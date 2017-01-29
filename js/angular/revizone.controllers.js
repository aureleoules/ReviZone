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
    $scope.isPrivate = false;
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
                cours_length: quill.getLength(),
                public: !$scope.isPrivate
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
            coursId: $routeParams.coursId,
            public: !$('#isPublic').is(':checked')
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
                $scope.coursArray = result.data;
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
                $scope.matieresList = [];
                for (var i = 0; i < $scope.listCours.length; i++)  {
                    if ($scope.matieresList.indexOf($scope.listCours[i].matiere) === -1) {
                        $scope.matieresList.push($scope.listCours[i].matiere);
                    }
                }
                $scope.matieresList.sort();
            });
            $scope.selectedMatiere = 'all';
            $scope.selectMatiere = function(index)  {
                $scope.coursArray = [];
                if (index === 'all')  {
                    $scope.coursArray = $scope.listCours;
                } else {
                    for (var i = 0; i < $scope.listCours.length; i++)  {
                        if ($scope.listCours[i].matiere === $scope.matieresList[index])  {
                            $scope.coursArray.push($scope.listCours[i]);
                        }
                    }
                }
                $scope.selectedMatiere = index;
            }
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


app.controller('exercerCtrl', function($scope, AuthService, $location, UtilsFactory, $http, API_ENDPOINT, $routeParams) {
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });
    $scope.isAuthenticated = AuthService.isAuthenticated();
    $scope.rechercher = function()  {
        var criteres =   {
            classe: $('#classe option:selected').text(),
            matiere: $('#matiere option:selected').text(),
            chapitre: $('#chapitre option:selected').text()
        }
        if (!criteres.classe  || !criteres.matiere  || !criteres.chapitre || !criteres.classe === "Choisir" || !criteres.matiere === 'Choisir' || criteres.chapitre === 'Choisir')  {
            UtilsFactory.makeAlert("Merci d'indiquer un chapitre.", 'info');
        } else {
            $location.path('/exercices/' + criteres.classe + '/' + criteres.matiere + '/' + criteres.chapitre);
        }
    }
});

app.controller('creerExerciceCtrl', function($scope, AuthService, $location, UtilsFactory, $http, API_ENDPOINT, $routeParams) {
    $http.get(API_ENDPOINT.url + '/getprogramme').then(function(result) {
        $scope.programme = result.data[0].classes; //recupere le programme de chaque classes.
    });

    $scope.quizs = [{
        id: 0,
        question: '',
        reponse: '',
        type: 'qa'
    }];
    $scope.addQuiz = function(item)  {
        $scope.quizs.push(item);
    }
    $scope.removeQuiz = function(id, question)  {
        var removeByAttr = function(arr, attr, value) {
            var i = arr.length;
            while (i--) {
                if (arr[i] &&
                    arr[i].hasOwnProperty(attr) &&
                    (arguments.length > 2 && arr[i][attr] === value)) {
                    arr.splice(i, 1);
                }
            }
            return arr;
        }
        removeByAttr($scope.quizs, 'id', id)
    }
    $scope.saveQuizs = function()  {
        var criteres =   {
            classe: $('#classe option:selected').text(),
            matiere: $('#matiere option:selected').text(),
            chapitre: $('#chapitre option:selected').text()
        }
        for (var i = 0; i < $scope.quizs.length; i++)  { //delete id value for each exercise
            delete $scope.quizs[i].id;
        }
        var myQuiz = {
            quizs: $scope.quizs,
            coursSeulement: "false",
            classe: criteres.classe,
            matiere: criteres.matiere,
            chapitre: criteres.chapitre
        };
        $http.post(API_ENDPOINT.url + '/saveQuizs', myQuiz).then(function(response)  {
            if (response.data.success === true)  {
                UtilsFactory.makeAlert(response.data.msg, 'success');
                $location.path('/exercices/' + myQuiz.classe + '/' + myQuiz.matiere + '/' + myQuiz.chapitre);
            } else {
                UtilsFactory.makeAlert(response.data.msg, 'danger');
            }
        });
    }
});

app.controller('exercicesCtrl', function($scope, AuthService, $location, UtilsFactory, $http, API_ENDPOINT, $routeParams, ngDialog) {
    if (AuthService.isAuthenticated() === true)  {
        AuthService.getUser().then(function(user)  {
            $scope.user = user;
        });
    }
    var request = {
        classe: $routeParams.classe,
        matiere: $routeParams.matiere,
        chapitre: $routeParams.chapitre
    }
    if (request.classe || request.matiere || request.chapitre)  {
        function similarity(s1, s2) {
            var longer = s1;
            var shorter = s2;
            if (s1.length < s2.length) {
                longer = s2;
                shorter = s1;
            }
            var longerLength = longer.length;
            if (longerLength == 0) {
                return 1.0;
            }
            return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
        }

        function editDistance(s1, s2) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();

            var costs = new Array();
            for (var i = 0; i <= s1.length; i++) {
                var lastValue = i;
                for (var j = 0; j <= s2.length; j++) {
                    if (i == 0)
                        costs[j] = j;
                    else {
                        if (j > 0) {
                            var newValue = costs[j - 1];
                            if (s1.charAt(i - 1) != s2.charAt(j - 1))
                                newValue = Math.min(Math.min(newValue, lastValue),
                                    costs[j]) + 1;
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                }
                if (i > 0)
                    costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        }

        function getExercices()  {
            $http.get(API_ENDPOINT.url + '/chercherExercices', {
                params: request
            }).then(function(result) {
                if (result.data.success === false) {
                    UtilsFactory.makeAlert(result.data.msg, 'danger')
                } else {
                    $scope.result = result.data;
                    $scope.quizs = [];
                    $scope.result.forEach(function(item, index)  {
                        if (item.type === "qa") {
                            $scope.quizs.push($scope.result[index]);
                        }
                    });
                }
            });
        }
        getExercices();
        $scope.resultEx = [];
        $scope.verify = function(index)  {
            var userAnwser;
            if ($scope.reponse)  {
                userAnwser = $scope.reponse[index];
            }
            var anwser = $scope.quizs[index].reponse;
            if (userAnwser)  {
                if (similarity(anwser, userAnwser) > 0.67) {
                    $scope.resultEx[index] = {
                        success: true
                    };
                } else {
                    $scope.resultEx[index] = {
                        success: false
                    };
                }
                $scope.reponse[index] = $scope.quizs[index].reponse;
            }
        }
        $scope.deleteQuiz = function(index)  {
            var quizId = $scope.quizs[index]._id;
            $scope.dialog =   {
                text: "Êtes-vous certain de vouloir supprimer ce quiz?",
                confirmBtn: "Oui je veux le supprimer."
            }
            ngDialog.open({
                template: './modals/confirmation.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
            $scope.confirm = function()  {
                $http.delete(API_ENDPOINT.url + '/supprimerQuiz', {
                    params:  {
                        quizId: quizId
                    }
                }).then(function(result)  {
                    if (result.data.success === true)  {
                        getExercices()
                    } else {
                        UtilsFactory.makeAlert(result.data.msg, 'danger');
                    }
                });
            }
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

app.controller('coursCtrl', function($scope, $routeParams, $http, API_ENDPOINT, UtilsFactory, AuthService, ngDialog, $location, $ocLazyLoad) {
    $ocLazyLoad.load('https://code.responsivevoice.org/responsivevoice.js').then(function()  {
        $scope.responsiveVoices = responsiveVoice.getVoices();
    });
    $ocLazyLoad.load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js');

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
    $scope.showAudio = true;

    function download(filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    }
    $scope.export = function(argu)  {
        if (argu === 'pdf')  {
            var doc = new jsPDF();

            var html = $('.ql-editor').html();
            doc.fromHTML(html, 15, 15, {
                'width': 170
            });
            doc.save($scope.cours.classe + " - " + $scope.cours.matiere + " - " + $scope.cours.titre + " par " + $scope.cours.auteur + ".pdf");
        } else if (argu === 'audio')  {
            responsiveVoice.speak(quill.getText(), $('#voiceSelect option:selected').val());
            $scope.showPause = true;
            $scope.showAudio = false;
        } else if (argu === 'raw') {
            download($scope.cours.classe + " - " + $scope.cours.matiere + " - " + $scope.cours.titre + " par " + $scope.cours.auteur + ".txt", quill.getText() + '\n\nVia ReviZone (http://www.revizone.fr)');
        } else if (argu === 'html') {
            var html = $('.ql-editor').html();
            download($scope.cours.classe + " - " + $scope.cours.matiere + " - " + $scope.cours.titre + " par " + $scope.cours.auteur + ".html", html);
        }

    }
    $scope.pauseAudio =   function()  {
        responsiveVoice.pause();
        $scope.showPause = false;
        $scope.showResume = true;
    }
    $scope.cancelAudio =   function()  {
        responsiveVoice.cancel();
        $scope.showAudio = true;
        $scope.showPause = false;
        $scope.showResume = false;
    }
    $scope.resumeAudio = function() {
        responsiveVoice.resume();
        $scope.showPause = true;
        $scope.showResume = false;
    }
});

app.controller('quizCtrl', function(ngDialog, $routeParams, $scope, AuthService, $location, UtilsFactory, $http, API_ENDPOINT) {
    var coursId = $routeParams.coursId;
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
            getQuizs();
        }
    });

    function similarity(s1, s2) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        var longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    }

    function editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
            var lastValue = i;
            for (var j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        var newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue),
                                costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    function getQuizs()  {
        $http.get(API_ENDPOINT.url + '/getQuizs', {
            params:  {
                coursId: $scope.cours._id
            }
        }).then(function(result)  {
            $scope.quizs = result.data.quizs;
            if ($scope.cours.chapitre)  {
                $http.get(API_ENDPOINT.url + '/getQuizs', {
                    params:  {
                        classe: $scope.cours.classe,
                        matiere: $scope.cours.matiere,
                        chapitre: $scope.cours.chapitre
                    }
                }).then(function(result)  {
                    for (var i = 0; i < result.data.quizs.length; i++)  { //flatten array and merge them
                        $scope.quizs.push(result.data.quizs[i]);
                    }
                });
            }
        });
    }
    AuthService.getUser().then(function(userData)  {
        $scope.user = userData;
    });
    $scope.resultEx = [];
    $scope.verify = function(index)  {
        var userAnwser;
        if ($scope.reponse)  {
            userAnwser = $scope.reponse[index];
        }
        var anwser = $scope.quizs[index].reponse;
        if (userAnwser)  {
            if (similarity(anwser, userAnwser) > 0.67) {
                $scope.resultEx[index] = {
                    success: true
                };
            } else {
                $scope.resultEx[index] = {
                    success: false
                };
                $scope.reponse[index] = $scope.quizs[index].reponse;
            }
        }
    }
    $scope.deleteQuiz = function(index)  {
        var quizId = $scope.quizs[index]._id;
        $scope.dialog =   {
            text: "Êtes-vous certain de vouloir supprimer ce quiz?",
            confirmBtn: "Oui je veux le supprimer."
        }
        ngDialog.open({
            template: './modals/confirmation.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
        $scope.confirm = function()  {
            $http.delete(API_ENDPOINT.url + '/supprimerQuiz', {
                params:  {
                    quizId: quizId
                }
            }).then(function(result)  {
                if (result.data.success === true)  {
                    getQuizs();
                } else {
                    UtilsFactory.makeAlert(result.data.msg, 'danger');
                }
            });
        }
    }
});

app.controller('redigerQuizCtrl', function($routeParams, $scope, AuthService, $location, UtilsFactory, $http, API_ENDPOINT) {
    var coursId = $routeParams.coursId;
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
        }
    });
    $scope.quizs = [{
        id: 0,
        question: '',
        reponse: '',
        type: 'qa'
    }];
    $scope.addQuiz = function(item)  {
        $scope.quizs.push(item);
    }
    $scope.removeQuiz = function(id, question)  {
        var removeByAttr = function(arr, attr, value) {
            var i = arr.length;
            while (i--) {
                if (arr[i] &&
                    arr[i].hasOwnProperty(attr) &&
                    (arguments.length > 2 && arr[i][attr] === value)) {
                    arr.splice(i, 1);
                }
            }
            return arr;
        }
        removeByAttr($scope.quizs, 'id', id)
    }
    $scope.saveQuizs = function()  {
        var coursId = $routeParams.coursId;
        for (var i = 0; i < $scope.quizs.length; i++)  { //delete id value for each exercise
            delete $scope.quizs[i].id;
        }
        var isForCoursOnly;
        if ($scope.onlyFor === undefined)  {
            if ($scope.cours.chapitre)  {
                isForCoursOnly = false;
            } else  {
                isForCoursOnly = true;
            }
        } else {
            isForCoursOnly = $scope.onlyFor;
        }
        var myQuiz;
        if (isForCoursOnly === true || isForCoursOnly === 'true')  {
            myQuiz = {
                quizs: $scope.quizs,
                coursSeulement: isForCoursOnly,
                coursId: coursId
            }
        } else {
            myQuiz = {
                quizs: $scope.quizs,
                coursSeulement: isForCoursOnly,
                classe: $scope.cours.classe,
                matiere: $scope.cours.matiere,
                chapitre: $scope.cours.chapitre
            }
        }
        $http.post(API_ENDPOINT.url + '/saveQuizs', myQuiz).then(function(response)  {
            if (response.data.success === true)  {
                UtilsFactory.makeAlert(response.data.msg, 'success');
                $location.path('/cours/' + coursId + '/quiz')
            } else {
                UtilsFactory.makeAlert(response.data.msg, 'danger');
            }
        });
    }
});


app.controller('loginCtrl', function($scope, AuthService, $location, UtilsFactory) {
    if (AuthService.isAuthenticated())  {
        $location.path('/accueil');
    }
    $scope.login = function() {
        AuthService.login($scope.user).then(function(msg) {
            $location.path('/accueil');
        }, function(errMsg) {
            UtilsFactory.makeAlert(errMsg, "danger", "", 1000);
        });
    };
});

app.controller('registerCtrl', function($scope, AuthService, $location, $http, API_ENDPOINT, UtilsFactory, fileReader) {
    if (AuthService.isAuthenticated())  {
        $location.path('/accueil');
    } else  {
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
    }
});

app.controller('AppCtrl', function($rootScope, $scope, $location, AuthService, AUTH_EVENTS) {
    $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
        AuthService.logout();
        $location.path('/accueil');
    });

    $('.navbar-collapse a:not(#nameHeader)').click(function() {
        $(".navbar-collapse").collapse('hide');
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

app.controller('classeCtrl', function($scope, AuthService, $http, API_ENDPOINT, UtilsFactory, ngDialog) {
    var coursSelIndex
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
    AuthService.getUser().then(function(userData) {
        $scope.user = userData;
    });

    function getClasseFeed() {
        $http.get(API_ENDPOINT.url + '/getClasseFeed').then(function(result) {
            if (result.data.success === true) {
                $scope.classeFeed = result.data.feed;
                for (var i = 0; i < $scope.classeFeed.length; i++) {
                    var date = moment($scope.classeFeed[i].createdAt).format('DD MMMM YYYY: HH-mm');
                    $scope.classeFeed[i].createdAtDate = date;
                }
            } else {
                $scope.classeFeed = '';
            }
        });
    }
    getClasseFeed();
    setInterval(function() {
        getClasseFeed();
    }, 5000)
    $scope.sendFeed = function() {
        var selCours;
        if (coursSelIndex) {
            selCours = $scope.listCours[coursSelIndex];
        } else {
            selCours = '';
        }
        $http.post(API_ENDPOINT.url + '/msgClasseFeed', {
            msg: $scope.post,
            cours: selCours
        }).then(function(response)  {
            if (response.data.success === true)  {
                $scope.post = '';
                $scope.removeSelected();
                getClasseFeed();
            } else {
                UtilsFactory.makeAlert(response.data.msg, 'danger');
            }
        });
    }
    $scope.removeComment = function(_id) {
        $scope.dialog = {
            text: "Êtes-vous certain de vouloir supprimer ce commentaire",
            confirmBtn: "Oui je veux le supprimer."
        }
        ngDialog.open({
            template: './modals/confirmation.html',
            className: 'ngdialog-theme-default',
            scope: $scope
        });
        $scope.confirm = function() {
            $http.delete(API_ENDPOINT.url + '/removeClasseFeed', {
                params: {
                    _id: _id
                }
            }).then(function(result)  {
                if (result.data.success === false)  {} else {
                    getClasseFeed();
                }
            });
        }

    }

    $scope.selectCours = function() {
        $http.get(API_ENDPOINT.url + '/getListCours', {
            params:  {
                pseudo: $scope.user.pseudo
            }
        }).then(function(result) {
            $scope.listCours = result.data;
            ngDialog.open({
                template: './modals/selectCours.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
        });
        $scope.confirm = function(cours) {
            coursSelIndex = $('#selectedCours').find(':selected').val();
            $scope.coursSelected = $scope.listCours[coursSelIndex];
        }
    }
    $scope.removeSelected = function() {
        $scope.coursSelected = '';
        coursSelIndex = '';
    }
});

app.controller('404Ctrl', function($scope, $http, API_ENDPOINT) {
    $http.get(API_ENDPOINT.url + '/getRandomCours').then(function(result) {
        $scope.randomCours = result.data.cours[0];
    });
});
