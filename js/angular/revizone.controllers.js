var app = angular.module('revizone.controllers', []);

//Home Page Controller
app.controller('homeCtrl', function($scope) {});

app.controller('newCtrl', function($scope, $http, API_ENDPOINT, AuthService, $location, UtilsFactory) {
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
    var author, classe;
    AuthService.getUser().then(function(userData)  {
        $scope.user = userData;
        // $("#classe option:contains($scope.user.scolaire.classe)").remove();
        // $('#classe option:selected').text($scope.user.scolaire.classe);
        // $('#classe option:selected').val($scope.user.scolaire.classe);

    });
    $scope.save = function()  {
        var delta = quill.getContents();
        var classeSel = $('#classe option:selected').text();
        var matiereSel = $('#matiere option:selected').text();
        var chapitreSel = $('#chapitre option:selected').text();
        var isPublic = $('#isPublic').prop('checked');
        console.log(quill.getLength());
        if (classeSel !== "Choisir" || matiereSel !== "Choisir" || chapitreSel !== "Choisir")  {
            AuthService.getUser().then(function(userData)  {
                author = userData.pseudo;
                var cours = {
                    classe: classeSel,
                    matiere: matiereSel,
                    chapitre: chapitreSel,
                    cours: delta,
                    auteur: author,
                    isPublic: isPublic,
                    titre: $scope.titre,
                    cours_length: quill.getLength()
                }

                $http.post(API_ENDPOINT.url + '/newCours', cours).then(function(result) {
                    if (result.data.success === false) {
                        UtilsFactory.makeAlert(result.data.msg);
                    } else {
                        $location.path('/cours/' + result.data._id);
                    }
                });

            });
        }
    }
});

app.controller('profileCtrl', function($scope, $http, API_ENDPOINT, AuthService, $routeParams, $location) {
    var pseudo;
    if ($location.path() === '/me') {
        pseudo = user.pseudo;
    } else {
        pseudo = $routeParams.user;
    }

    $http.get(API_ENDPOINT.url + '/getProfile', {
        params:  {
            pseudo: pseudo
        }
    }).then(function(result) {
        $scope.user = result.data[0];
        $http.get(API_ENDPOINT.url + '/getEtablissementById', {
            params:  {
                id: $scope.user.scolaire.etablissement
            }
        }).then(function(result) {
            $scope.etablissement = result.data[0];
        });
    });


});


app.controller('rechercheCtrl', function($scope, $http, API_ENDPOINT) {
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });

    $scope.rechercher = function()  {
        var criteres =   {
            keywords: $('#tagsInput').val(),
            classe: $('#classe option:selected').text(),
            matiere: $('#matiere option:selected').text(),
            chapitre: $('#chapitre option:selected').text()
        }
        $http.get(API_ENDPOINT.url + '/chercherCours', {
            params: criteres
        }).then(function(result) {
            $scope.result = result.data;
            console.log(result.data);
            $scope.slide();
        });
        console.log(JSON.stringify(criteres));
    }
    $scope.icon = "fa-caret-down";
    $scope.slide = function() {
        $("#rechercheDiv").slideToggle();
        if($scope.icon === "fa-caret-down") {
            $scope.icon = "fa-caret-up";
        } else {
            $scope.icon = "fa-caret-down";
        }
    }
});

app.controller('coursCtrl', function($scope, $routeParams, $http, API_ENDPOINT, UtilsFactory) {
    coursId = $routeParams.idcours;
    $http.get(API_ENDPOINT.url + '/getCours', {
        params: {
            coursId: coursId
        }
    }).then(function(result) {
        $scope.cours = result.data[0];
        quill.setContents(result.data[0].content);
    });
});

app.controller('loginCtrl', function($scope, AuthService, $location) {
    $scope.user = {
        name: '',
        password: ''
    };

    $scope.login = function() {
        AuthService.login($scope.user).then(function(msg) {
            $location.path('/inside');
        }, function(errMsg) {
            UtilsFactory.makeAlert(errMsg, "danger", "", 1000);

        });
    };
});

app.controller('registerCtrl', function($scope, AuthService, $location, $http, API_ENDPOINT, UtilsFactory) {
    $scope.signup = function() {
        AuthService.register($scope.userInfos).then(function(msg) {
            $location.path('/login');
        }, function(error)  {
            UtilsFactory.makeAlert(error, "danger", "", 1000);
        });
    };
    var isCodePostalReady;
    $scope.checkIfReady = function()  {
        if ($('#inputCodePostal').val().length >= 4) {
            getEtablissements();
        }
    }

    var getEtablissements = function()  {
        console.log("TEA:");
        $http.get(API_ENDPOINT.url + '/getetablissements', {
            params:  {
                code_postal: $scope.userInfos.codepostal
            }
        }).then(function(result) {
            $scope.etablissements = result.data;
        });
    }

    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
});

app.controller('AppCtrl', function($rootScope, $scope, $location, AuthService, AUTH_EVENTS) {
    $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
        AuthService.logout();
        $location.path('/login');
    });
    $scope.isActive = function(viewLocation) { //This function is for the NavBar: Set 'active' class if navbar item is selected.
        return viewLocation === $location.path();
    };
    getUserData();

    function getUserData() {
        if (AuthService.isAuthenticated())  {
            AuthService.getUser().then(function(userData)  {
                $scope.userData = userData;
            }, function(err) {});
        }
    };

    $scope.isAuthenticated = function()  {
        return AuthService.isAuthenticated();
    }

    $scope.getUser = function() {
        AuthService.getUser().then(function(userData)  {
            $scope.userData = userData;
        }, function(err) {});
    };

    $scope.logout = function() {
        AuthService.logout();
        $location.path('/login');
    };

    $rootScope.$on('userLoggedIn', function(data) {
        getUserData();
    });

});

app.controller('404Ctrl', function($scope) {});
