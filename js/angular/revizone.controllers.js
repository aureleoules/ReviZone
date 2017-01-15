var app = angular.module('revizone.controllers', []);

//Home Page Controller
app.controller('homeCtrl', function($scope, AuthService, $http, UtilsFactory, API_ENDPOINT) {
    $scope.isAuthenticated = AuthService.isAuthenticated();
    if ($scope.isAuthenticated)  {
        $http.get(API_ENDPOINT.url + '/getUserFeed').then(function(result) {
            if (result.data.success === true)  {
                $scope.feed = result.data.feed;
                $scope.pictures = {};
                $scope.feed.forEach(function(item, key)  {
                    $http.get(API_ENDPOINT.url + '/getPicture', {
                        params: {
                            pseudo: item.auteur
                        }
                    }).then(function(response)  {
                        $scope.feed[key].picture = response.data[0].picture;
                    });
                });
                if ($scope.feed.length < 1)  {
                    $scope.showFeed = false;
                } else {
                    $scope.showFeed = true;
                }
            }
        });
        AuthService.getUser().then(function(user)  {
            $scope.user = user;
            console.log()
            $http.get(API_ENDPOINT.url + '/getListCours', {
                params:  {
                    pseudo: $scope.user.pseudo
                }
            }).then(function(result) {
                $scope.listCours = result.data;
                var rates = []; //calcul de la moyenne de chaque note de chaque cours.

                for (var i = 0; i < $scope.listCours.length; i++)  {
                    for (var y = 0; y < $scope.listCours[i].rates.length; y++)  {
                        rates.push($scope.listCours[i].rates[y].rate);
                    }
                }
                var num = 0;
                for (var i = 0; i < rates.length; i++)  {
                    num += rates[i];
                }
                $scope.average = Math.round(num / rates.length); //fin du calcul de la moyenne.
                if (isNaN($scope.average))  {
                    $scope.average = '- ';
                }
                $scope.lecturesTotal = 0;
                for (var i = 0; i < $scope.listCours.length; i++)  {
                    $scope.lecturesTotal += $scope.listCours[i].lectures;
                }
            });
        });

    }
});

app.controller('newCtrl', function($scope, $http, API_ENDPOINT, AuthService, $location, UtilsFactory, ngDialog, fileReader) { //création d'un nouveau cours
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
                        $location.path('/cours/' + result.data._id + '/modifier');
                    }
                }
            });

        });

    }

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
    $scope.fromPicture = function()  {
        $('#file').click();
    }
    $scope.getFile = function() {
        fileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.imageSrc = result;
                $http.post(API_ENDPOINT.url + '/OCR', {
                    base64Image: $scope.imageSrc
                }).then(function(result)  {
                    var text = result.data.ParsedResults[0].ParsedText;
                    quill.setText(text);
                });
            });
    };
});

app.controller('modifierCtrl', function($scope, $http, API_ENDPOINT, AuthService, $location, UtilsFactory, $routeParams) {
    $scope.isAuthenticated = function()  {
        return AuthService.isAuthenticated();
    }
    if (!$scope.isAuthenticated())  {
        $location.path('/cours/' + $routeParams.coursId);
    } else {
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
                    $location.path('/cours/' + $routeParams.coursId);
                }
            });
        });
    }
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

app.controller('profilCtrl', function($scope, $http, API_ENDPOINT, AuthService, $routeParams, $location, UtilsFactory, ngDialog, $rootScope, fileReader) { //page de profil
    $scope.isAuthenticated = AuthService.isAuthenticated();
    if ($scope.isAuthenticated)  {
        AuthService.getUser().then(function(user)  {
            $scope.user = user;
            if ($location.path() === '/profil') { //si l'utilisateur va sur /profil alors il tombe sur son profile
                callback($scope.user.pseudo);
            } else { //sinon il tombe sur le profile de l'user demandé
                callback($routeParams.user);
            }
        });
    } else {
        callback($routeParams.user);
    }
    var isCodePostalReady;
    $scope.checkIfReady = function()  {
        if ($('#inputCodePostal').val().length >= 4) {
            getEtablissements();
        }
    }

    var getEtablissements = function()  {
        $http.get(API_ENDPOINT.url + '/getetablissements', {
            params:  {
                code_postal: $scope.editedUser.scolaire.code_postal
            }
        }).then(function(result) {
            $scope.etablissements = result.data;
        });
    }

    function callback(currentUser)  {
        $http.get(API_ENDPOINT.url + '/getProfile', {
            params:  {
                pseudo: currentUser
            }
        }).then(function(result) {
            $scope.profile = result.data[0];
            if (!$scope.profile)  {
                $location.path('/accueil');
                UtilsFactory.makeAlert("Cet utilisateur n'existe pas.", "danger")
                return;
            }
            $http.get(API_ENDPOINT.url + '/getEtablissementById', { //récupere le nom du lycée de l'utilsateur grâce a l'ID du lycée
                params:  {
                    id: $scope.profile.scolaire.etablissement
                }
            }).then(function(result) {
                $scope.etablissement = result.data[0];
            });
            $http.get(API_ENDPOINT.url + '/getListCours', {
                params:  {
                    pseudo: currentUser
                }
            }).then(function(result) {
                $scope.listCours = result.data;
                var rates = []; //calcul de la moyenne de chaque note de chaque cours.

                for (var i = 0; i < $scope.listCours.length; i++)  {
                    for (var y = 0; y < $scope.listCours[i].rates.length; y++)  {
                        rates.push($scope.listCours[i].rates[y].rate);
                    }
                }
                var num = 0;
                for (var i = 0; i < rates.length; i++)  {
                    num += rates[i];
                }
                $scope.average = Math.round(num / rates.length); //fin du calcul de la moyenne.
                if (isNaN($scope.average))  {
                    $scope.average = '- ';
                }
                $scope.lecturesTotal = 0;
                for (var i = 0; i < $scope.listCours.length; i++)  {
                    $scope.lecturesTotal += $scope.listCours[i].lectures;
                }
            });
        });
        if ($scope.isAuthenticated)  {
            $http.get(API_ENDPOINT.url + '/isFollowed', {
                params:  {
                    pseudo: currentUser
                }
            }).then(function(result) {
                if (result.data.success === true)  {
                    $scope.isFollowed = result.data.isFollowed;
                }
            });
        }
    };

    $scope.follow = function()  {
        if ($routeParams.user !== undefined)  {
            $http.post(API_ENDPOINT.url + '/followUser', {
                user: $routeParams.user
            }).then(function(result)  {
                if (result.data.success === false)  {
                    UtilsFactory.makeAlert(result.data.msg, 'danger');
                } else {
                    $scope.isFollowed = true;
                }
            });
        }
    }
    $scope.unfollow = function()  {
        if ($routeParams.user !== undefined)  {
            $http.delete(API_ENDPOINT.url + '/unFollowUser', {
                params: {
                    user: $routeParams.user
                }
            }).then(function(result)  {
                if (result.data.success === false)  {
                    UtilsFactory.makeAlert(result.data.msg, 'danger');
                } else {
                    $scope.isFollowed = false;
                }
            });
        }
    }
    $scope.selectImage = function()  {
        $('#file').click();
    }
    $scope.getFile = function() {
        fileReader.readAsDataUrl($scope.file, $scope).then(function(result) {
                $scope.imageSrc = result;
        });
    };
    $scope.edit = function() {
        $scope.editedUser = angular.copy($scope.user);
        $scope.editedUser.scolaire.code_postal = parseInt($scope.editedUser.scolaire.code_postal);
        $scope.imageSrc = $scope.editedUser.picture;
        getEtablissements();
        $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
            $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
        });
        if ($routeParams.user === undefined  || $routeParams.user === $scope.user.pseudo)  {
            ngDialog.open({
                template: './modals/editProfile.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
            $rootScope.$on('ngDialog.closing', function(e, $dialog) {});
        }
        $scope.save = function()  {
            $scope.editedUser['picture'] = $scope.imageSrc;
            console.log($scope.editedUser);
            $http.put(API_ENDPOINT.url + '/editUser', {
                user: $scope.editedUser
            }).then(function(result) {
                if (result.data.success === true)  {
                    UtilsFactory.makeAlert(result.data.msg, "success");
                    $http.get(API_ENDPOINT.url + '/getProfile', {
                        params:  {
                            pseudo: $scope.user.pseudo
                        }
                    }).then(function(result) {
                        $scope.user = result.data[0];

                    });
                } else {
                    UtilsFactory.makeAlert(result.data.msg, "danger");
                }
            });
        }


        var passwordChng;
        $scope.changePassword = function() {
            $scope.passwords =   {};
            passwordChng = ngDialog.open({
                template: './modals/changePassword.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
        };
        $scope.savePassword = function()  {
            $http.put(API_ENDPOINT.url + '/editPassword', {
                passwords: $scope.passwords
            }).then(function(result) {
                if (result.data.success === true)  {
                    UtilsFactory.makeAlert(result.data.msg, "success");
                    passwordChng.close();
                } else {
                    UtilsFactory.makeAlert(result.data.msg, "danger");
                }
            });
        }
    }
});

app.controller('rechercheCtrl', function($scope, $http, API_ENDPOINT, UtilsFactory) {
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
    $scope.showSadFace = false;
    $scope.currentPage = 0;
    $scope.pageSize = 10;
    var coursLength;
    $scope.numberOfPages = function() {
        return Math.ceil(coursLength / $scope.pageSize);
    }
    $scope.searchLess = function()  {
        if ($scope.currentPage > 1)  {
            $scope.currentPage--;
            $scope.rechercher($scope.currentPage);
        }
    }
    $scope.searchMore = function()  {
        if ($scope.currentPage < $scope.numberOfPages())  {
            $scope.currentPage++;
            $scope.rechercher($scope.currentPage);
        }
    }
    $scope.rechercher = function(page, slide)  {
        $scope.currentPage = page;
        var criteres =   {
            keywords: $('#tagsInput').val(),
            classe: $('#classe option:selected').text(),
            matiere: $('#matiere option:selected').text(),
            chapitre: $('#chapitre option:selected').text(),
            page: $scope.currentPage
        }
        $http.get(API_ENDPOINT.url + '/chercherCours', {
            params: criteres
        }).then(function(result) {
            if (result.data.success === false) {
                UtilsFactory.makeAlert(result.data.msg, 'danger')
            } else {
                $scope.result = result.data.cours;
                coursLength = result.data.coursLength;
                $scope.result.forEach(function(item, key)  {
                    $http.get(API_ENDPOINT.url + '/getPicture', {
                        params: {
                            pseudo: item.auteur
                        }
                    }).then(function(response)  {
                        $scope.result[key].picture = response.data[0].picture;
                    });
                });
                if (!$scope.result.length > 0)  {
                    $scope.showSadFace = true;
                } else {
                    $scope.showSadFace = false;
                }
            }
            if (slide === true)  {
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
                //UtilsFactory.makeAlert(result.data.msg, "success");
            }
        });
    }
    $scope.delete = function() {
        $scope.dialog =   {
            text: "Êtes-vous certain de vouloir supprimer ce cours?",
            confirmBtn: "Je veux supprimer ce cours"
        };
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
    $scope.export = function(argu)  {
        if (argu === 'pdf')  {
            var doc = new jsPDF();
            doc.fromHTML($('#editor-container').html(), 15, 15, {
                'width': 170
            });
            doc.save($scope.cours.classe + " - " + $scope.cours.matiere + " - " + $scope.cours.chapitre + " par " + $scope.cours.auteur + ".pdf");
        }

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

app.controller('registerCtrl', function($scope, AuthService, $location, $http, API_ENDPOINT, UtilsFactory, fileReader) {
    $scope.userInfos = {};
    $scope.imageSrc = "http://i.imgur.com/Dknt6vC.png";
    $scope.selectImage = function()  {
        $('#file').click();
    }
    $scope.getFile = function() {
        fileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.imageSrc = result;
            });
    };

    $scope.signup = function() {
        AuthService.register($scope.userInfos).then(function(msg) {
            $http.post(API_ENDPOINT.url + '/savePicture', {
                img: $scope.imageSrc,
                pseudo: $scope.userInfos.pseudo
            }).then(function(response)  {});
            AuthService.login($scope.userInfos).then(function(msg) {
                $location.path('/accueil');
            }, function(errMsg) {
                UtilsFactory.makeAlert(errMsg, "danger", "", 1000);
            });
        }, function(error)  {
            UtilsFactory.makeAlert(error, "danger");
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
        $location.path('/accueil');
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
        $location.path('/accueil');
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

app.controller('404Ctrl', function($scope, $http, API_ENDPOINT) {
    $http.get(API_ENDPOINT.url + '/getRandomCours').then(function(result) {
        $scope.randomCours = result.data.cours[0];
    }); 
});
