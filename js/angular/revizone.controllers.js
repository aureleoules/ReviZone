var app = angular.module('revizone.controllers', []);

//Home Page Controller
app.controller('homeCtrl', function($scope) {});

app.controller('newCtrl', function($scope, $http, API_ENDPOINT, AuthService, $location, UtilsFactory) { //création d'un nouveau cours
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
    var author, classe;
    $scope.save = function()  { //fonction de sauvegarde du cours
        var delta = quill.getContents(); //récupere le contenu du cours
        var classeSel = $('#classe option:selected').text(); //classe séléctionnée
        var matiereSel = $('#matiere option:selected').text(); //matiere séléctionnée
        var chapitreSel = $('#chapitre option:selected').text(); //chapitre séléctionné
        if (classeSel !== "Choisir" || matiereSel !== "Choisir" || chapitreSel !== "Choisir")  { //Si l'utilisateur a défini la classe; matiere; chapitre alors on y va
            AuthService.getUser().then(function(userData)  { //on récupere les données de l'user
                author = userData.pseudo;
                var cours = { //défini l'objet cours
                    classe: classeSel,
                    matiere: matiereSel,
                    chapitre: chapitreSel,
                    cours: delta,
                    auteur: author,
                    titre: $scope.titre,
                    cours_length: quill.getLength()
                }

                $http.post(API_ENDPOINT.url + '/newCours', cours).then(function(result) { //envois du cours
                    if (result.data.success === false) { //error
                        UtilsFactory.makeAlert(result.data.msg);
                    } else { //success
                        $location.path('/cours/' + result.data._id);
                    }
                });

            });
        }
    }
});

app.controller('profilCtrl', function($scope, $http, API_ENDPOINT, AuthService, $routeParams, $location) { //page de profil
    var pseudo;
    var callback = function()  {
        $http.get(API_ENDPOINT.url + '/getProfile', {
            params:  {
                pseudo: pseudo
            }
        }).then(function(result) {
            $scope.user = result.data[0];
            $http.get(API_ENDPOINT.url + '/getEtablissementById', { //récupere le nom du lycée de l'utilsateur grâce a l'ID du lycée
                params:  {
                    id: $scope.user.scolaire.etablissement
                }
            }).then(function(result) {
                $scope.etablissement = result.data[0];
            });
            $http.get(API_ENDPOINT.url + '/getListCours', { //récupere le nom du lycée de l'utilsateur grâce a l'ID du lycée
                params:  {
                    user: $scope.user.pseudo
                }
            }).then(function(result) {
                $scope.listCours = result.data;
            });
        });
    };
    if ($location.path() === '/profil') { //si l'utilisateur va sur /profil alors il tombe sur son profile
        AuthService.getUser().then(function(user)  {
            pseudo = user.pseudo;
            callback();
        });
    } else { //sinon il tombe sur le profile de l'user demandé
        pseudo = $routeParams.user;
        callback();
    }
});


app.controller('rechercheCtrl', function($scope, $http, API_ENDPOINT, UtilsFactory) {
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
    $scope.showSadFace = false;

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
            if (result.data.success === false) {
                UtilsFactory.makeAlert(result.data.msg, 'danger')
            } else {
                $scope.result = result.data;
                if(!$scope.result.length > 0) {
                    $scope.showSadFace = true;
                } else {
                    $scope.showSadFace = false;
                }
                console.log(JSON.stringify($scope.result));
                $scope.slide();
            }
        });
        console.log($scope.showSadFace);
        console.log(JSON.stringify(criteres));
    }
    $scope.icon = "fa-caret-down";
    $scope.slide = function() {
        $("#rechercheDiv").slideToggle();
        if ($scope.icon === "fa-caret-down") {
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
