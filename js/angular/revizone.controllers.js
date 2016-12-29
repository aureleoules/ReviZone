var app = angular.module('revizone.controllers', []);

//Home Page Controller
app.controller('homeCtrl', function($scope) {});

app.controller('newCtrl', function($scope, $http, API_ENDPOINT, AuthService, $location, UtilsFactory, $window, ngDialog) { //création d'un nouveau cours
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
    var author, classe;
    $scope.save = function(arg)  { //fonction de sauvegarde du cours
        var delta = quill.getContents(); //récupere le contenu du cours
        var classeSel = $('#classe option:selected').text(); //classe séléctionnée
        var matiereSel = $('#matiere option:selected').text(); //matiere séléctionnée
        var chapitreSel = $('#chapitre option:selected').text(); //chapitre séléctionné
        AuthService.getUser().then(function(userData)  { //on récupere les données de l'user
            var cours = { //défini l'objet cours
                classe: classeSel,
                matiere: matiereSel,
                chapitre: chapitreSel,
                cours: delta,
                titre: $scope.titre,
                cours_length: quill.getLength()
            }

            $http.post(API_ENDPOINT.url + '/newCours', cours).then(function(result) { //envois du cours
                if (result.data.success === false) { //error
                    UtilsFactory.makeAlert(result.data.msg, "danger");
                } else { //success
                    UtilsFactory.makeAlert(result.data.msg, "success")
                    if (arg === "quit")  {
                        $location.path('/cours/' + result.data._id);
                    } else {
                        $location.path('/modifier/' + result.data._id);
                    }
                }
            });

        });

    }
    var win = $window;
    $scope.$watch('nouveauForm.$dirty', function(value) {
        if (value) {
            win.onbeforeunload = function() {
                return "Des changements n'ont pas été enregistré.";
            };
        }
    });
    $scope.quit = function()  {
        $scope.dialog =   {
            text: "Êtes-vous certain de vouloir quitter sans enregistrer?",
            confirmBtn: "Oui je veux quitter."
        }
        ngDialog.open({
            template: './modals/confirmation.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }
    $scope.confirm = function()  {
        $location.path('/accueil');
    }
});

app.controller('modifierCtrl', function($scope, $http, API_ENDPOINT, AuthService, $location, UtilsFactory, $routeParams) {
    $scope.isAuthenticated = function()  {
        return AuthService.isAuthenticated();
    }
    coursId = $routeParams.coursId;

    $http.get(API_ENDPOINT.url + '/getCours', {
        params: {
            coursId: coursId
        }
    }).then(function(result) {
        $scope.cours = result.data[0];
        quill.setContents(result.data[0].content);
        AuthService.getUser().then(function(user)  {
            if (user.pseudo !== $scope.cours.auteur)  {
                UtilsFactory.makeAlert('Ce cours ne vous appartient pas.', 'danger');
                $location.path('/accueil');
            }
        });
    });

    $scope.modifier = function(arg)  {
        var cours = {
            content: quill.getContents(),
            coursId: $routeParams.coursId
        }

        $http.put(API_ENDPOINT.url + '/editCours', cours).then(function(result)  {
            var data = result.data;
            if (data.success === true)  {
                UtilsFactory.makeAlert(data.msg, "success");
                if (arg === 'quit')  {
                    $location.path('/cours/' + $routeParams.coursId);
                } else {}
            } else {
                UtilsFactory.makeAlert(data.msg, "danger");
            }
        });
    };
    // $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
    //     $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    // });

    // $scope.selectDefaultOptions = function()  {
    //     //CLASSE:
    //     $('#classeSelector option').filter(function() {
    //         return $(this).html() == $scope.cours.classe;
    //     }).remove();
    //     $('#classeSelector').append($('<option>', {
    //         value: $scope.cours.classe,
    //         text: $scope.cours.classe
    //     }));
    //     $('#classeSelector option[value=' + $scope.cours.classe + ']').attr('selected', 'selected');
    //
    //     //MATIERE:
    //     $('#matiereSelector option').filter(function() {
    //         return $(this).html() == $scope.cours.matiere;
    //     }).remove();
    //     $('#matiereSelector').append($('<option>', {
    //         value: $scope.cours.matiere,
    //         text: $scope.cours.matiere
    //     }));
    //     $('#matiereSelector option[value=' + $scope.cours.matiere + ']').attr('selected', 'selected');
    //
    //     //CHAPITRE:
    //     $('#chapitreSelector option').filter(function() {
    //         return $(this).html() == $scope.cours.chapitre;
    //     }).remove();
    //     $('#chapitreSelector').append($('<option>', {
    //         value: $scope.cours.chapitre,
    //         text: $scope.cours.chapitre
    //     }));
    //     $('#chapitreSelector option[value=' + $scope.cours.chapitre + ']').attr('selected', 'selected');
    // }
});

app.controller('profilCtrl', function($scope, $http, API_ENDPOINT, AuthService, $routeParams, $location, UtilsFactory) { //page de profil
    var pseudo;
    var callback = function()  {
        $http.get(API_ENDPOINT.url + '/getProfile', {
            params:  {
                pseudo: pseudo
            }
        }).then(function(result) {
            $scope.user = result.data[0];
            if(!$scope.user) {
                $location.path('/accueil');
                UtilsFactory.makeAlert("Cet utilisateur n'existe pas.", "danger")
                return;
            }
            $http.get(API_ENDPOINT.url + '/getEtablissementById', { //récupere le nom du lycée de l'utilsateur grâce a l'ID du lycée
                params:  {
                    id: $scope.user.scolaire.etablissement
                }
            }).then(function(result) {
                $scope.etablissement = result.data[0];
            });
            $http.get(API_ENDPOINT.url + '/getListCours', {
                params:  {
                    pseudo: pseudo
                }
            }).then(function(result) {
                $scope.listCours = result.data;
                $scope.lecturesTotal = 0;
                for (var i = 0; i < $scope.listCours.length; i++)  {
                    $scope.lecturesTotal += $scope.listCours[i].lectures;
                }
            });
        });

        $http.get(API_ENDPOINT.url + '/isFollowed', {
            params:  {
                pseudo: pseudo
            }
        }).then(function(result) {
            if(result.data.success === true) {
                $scope.isFollowed = result.data.isFollowed;
            }
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
    $scope.follow = function()  {
        $http.post(API_ENDPOINT.url + '/followUser', {
            user: pseudo
        }).then(function(result)  {
            if (result.data.success === false)  {
                UtilsFactory.makeAlert(result.data.msg, 'danger');
            } else {
                $scope.isFollowed = true;
            }
        });
    }
    $scope.unfollow = function()  {
        $http.delete(API_ENDPOINT.url + '/unFollowUser', {
            params: {
                user: pseudo
            }
        }).then(function(result)  {
            if (result.data.success === false)  {
                UtilsFactory.makeAlert(result.data.msg, 'danger');
            } else {
                $scope.isFollowed = false;
            }
        });
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
                if (!$scope.result.length > 0)  {
                    $scope.showSadFace = true;
                } else {
                    $scope.showSadFace = false;
                }
                $scope.slide();
            }
        });
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

app.controller('coursCtrl', function($scope, $routeParams, $http, API_ENDPOINT, UtilsFactory, AuthService, ngDialog, $location) {
    $scope.isAuthenticated = function()  {
        return AuthService.isAuthenticated();
    }
    if ($scope.isAuthenticated()) {
        AuthService.getUser().then(function(user)  {
            $scope.user = user;
        });
    }
    coursId = $routeParams.idcours;
    $http.get(API_ENDPOINT.url + '/getCours', {
        params: {
            coursId: coursId
        }
    }).then(function(result) {
        if (result.data.success === false)  {
            UtilsFactory.makeAlert(result.data.msg, "danger");
            $location.path('/accueil');
        } else {
            $scope.cours = result.data[0];
            quill.setContents(result.data[0].content);
            if ($scope.isAuthenticated())  {
                $http.get(API_ENDPOINT.url + '/getCoursRate', {
                    params: {
                        coursId: coursId
                    }
                }).then(function(result) {
                    if (result.data.success !== false) {
                        var rate = result.data.rate;
                        $("#star-" + rate).prop('checked', true);
                    }
                });
            }
        }
    });

    $scope.rate = function(stars)  {
        $http.post(API_ENDPOINT.url + '/rateCours', {
            stars: stars,
            coursId: coursId
        }).then(function(result)  {
            if (result.data.success === false)  {
                UtilsFactory.makeAlert(result.data.msg, 'danger');
            } else {
                UtilsFactory.makeAlert(result.data.msg, "success");
            }
        });
    }
    $scope.delete = function() {
        $scope.dialog =   {
            text: "Êtes-vous certain de vouloir supprimer ce cours?",
            confirmBtn: "Je veux supprimer ce cours"
        }
        ngDialog.open({
            template: './modals/confirmation.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
    }
    $scope.confirm = function()  {
        $http.delete(API_ENDPOINT.url + '/supprimerCours', {
            params:  {
                coursId: $routeParams.idcours
            }
        }).then(function(result)  {
            if (result.data.success === false)  {
                UtilsFactory.makeAlert(result.data.msg, 'danger');
            } else {
                UtilsFactory.makeAlert(result.data.msg, "success");
                $location.path('/profil');
            }
        });
    }
});

app.controller('loginCtrl', function($scope, AuthService, $location) {
    $scope.login = function() {
        AuthService.login($scope.user).then(function(msg) {
            $location.path('/accueil');
        }, function(errMsg) {
            UtilsFactory.makeAlert(errMsg, "danger", "", 1000);

        });
    };
});

app.controller('registerCtrl', function($scope, AuthService, $location, $http, API_ENDPOINT, UtilsFactory) {
    $scope.signup = function() {
        AuthService.register($scope.userInfos).then(function(msg) {
            $location.path('/connexion');
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
        $location.path('/connexion');
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
        $location.path('/connexion');
    };

    $rootScope.$on('userLoggedIn', function(data) {
        getUserData();
    });

});

app.controller('classeCtrl', function($scope, AuthService, $http, API_ENDPOINT) {
    $http.get(API_ENDPOINT.url + '/getClasse').then(function(result) {
        $scope.classe = result.data; //recupere le programme de chaque classes.
        $http.get(API_ENDPOINT.url + '/getEtablissementById', { //récupere le nom du lycée de l'utilsateur grâce a l'ID du lycée
            params:  {
                id: $scope.classe[0].scolaire.etablissement
            }
        }).then(function(result) {
            $scope.etablissement = result.data[0];
        });
    });
});

app.controller('404Ctrl', function($scope) {});
