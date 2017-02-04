var app = angular.module('revizone', ['ngRoute', 'revizone.controllers', 'ngDialog', 'oc.lazyLoad', '720kb.socialshare', 'ngFileUpload']);

app.config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');
    $routeProvider.
    when('/', {
        redirectTo: '/accueil',
        controller: 'AppCtrl'
    }).
    when('/accueil', {
        title: "Accueil",
        templateUrl: 'partials/home.html',
        controller: 'homeCtrl',
        id: 'home'
    }).
    when('/inscription', {
        title: "Inscription",
        templateUrl: 'partials/register.html',
        controller: 'registerCtrl'
    }).
    when('/trouver', {
        title: "Recherche de cours",
        templateUrl: 'partials/trouver.html',
        controller: 'trouverCtrl'
    }).
    when('/recherche/:classe/:matiere/:chapitre/:keywords', {
        title: "Recherche",
        templateUrl: 'partials/recherche.html',
        controller: 'rechercheCtrl'
    }).
    when('/cgu', {
        title: "Conditions Générales d'Utilisation",
        templateUrl: 'partials/cgu.html',
    }).
    when('/a-propos', {
        title: "À propos",
        templateUrl: 'partials/about.html',
    }).
    when('/mentions-legales', {
        title: "Mentions Légales",
        templateUrl: 'partials/mentions-legales.html',
    }).
    when('/classe', {
        title: "Ma classe",
        templateUrl: 'partials/classe.html',
        controller: 'classeCtrl'
    }).
    when('/connexion', {
        title: "Connexion",
        templateUrl: 'partials/login.html',
        controller: 'loginCtrl',
        id: "login"
    }).
    when('/profil/:user', {
        title: "Profil",
        templateUrl: 'partials/profil.html',
        controller: 'profilCtrl'
    }).
    when('/profil', {
        title: "Profil",
        templateUrl: 'partials/profil.html',
        controller: 'profilCtrl'
    }).
    when('/rediger', {
        title: "Rédiger un cours",
        templateUrl: 'partials/cours/nouveau.html',
        controller: 'newCtrl'
    }).
    when('/exercer', {
        title: "Recherche d'exercice",
        templateUrl: 'partials/exercer.html',
        controller: 'exercerCtrl'
    }).
    when('/exercice/creer', {
        title: "Création d'exercice",
        templateUrl: 'partials/creerExercice.html',
        controller: 'creerExerciceCtrl'
    }).
    when('/exercices/:classe/:matiere/:chapitre', {
        title: "S'exercer",
        templateUrl: 'partials/exercices.html',
        controller: 'exercicesCtrl'
    }).
    when('/cours/:idcours', {
        title: "Cours",
        templateUrl: 'partials/cours/cours.html',
        controller: 'coursCtrl'
    }).
    when('/cours/:coursId/modifier', {
        title: "Modifier un cours",
        templateUrl: 'partials/cours/modifier.html',
        controller: 'modifierCtrl'
    }).
    when('/cours/:coursId/quiz', {
        title: "Exercices",
        templateUrl: 'partials/cours/quiz.html',
        controller: 'quizCtrl'
    }).
    when('/cours/:coursId/quiz/creer', {
        title: "Rédaction d'exercices",
        templateUrl: 'partials/cours/creerQuiz.html',
        controller: 'redigerQuizCtrl'
    }).
    when('/404', {
        title: "Page non trouvée!",
        templateUrl: 'partials/404.html',
        controller: '404Ctrl'
    }).
    otherwise({
        redirectTo: '/404'
    });
});

//Scope for the # (root)
app.run(['$rootScope', '$location', 'AuthService', function($rootScope, $location, AuthService) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (!AuthService.isAuthenticated()) {
            var allowedRoutes = ['/', '', '/accueil', '/connexion', '/404', '/inscription', '/trouver', '/cgu', '/mentions-legales', '/a-propos', '/exercer'];
            var quizCreer = $location.path().substring($location.path().length - '/quiz/creer'.length, $location.path().length) === '/quiz/creer';
            var exerciceCreer = $location.path().substring($location.path().length - '/exercice/creer'.length, $location.path().length) === '/exercice/creer';
            var isAllowed = allowedRoutes.indexOf($location.path()) > -1 || quizCreer === true || exerciceCreer !== true || ($location.path().substring(0, '/cours/'.length)) === '/cours/' || ($location.path().substring(0, '/profil/'.length)) === '/profil/'; //checks if the $location.path() is contained in the allowedRoutes array.
            if (!isAllowed || quizCreer === true)  { //if not allowed -> /login path
                event.preventDefault();
                $location.path('/accueil');
            }
        }

    });
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous, userInfo) {
        $rootScope.title = current.$$route.title; //change the HTML index title to the current root title;
    });
}]);
