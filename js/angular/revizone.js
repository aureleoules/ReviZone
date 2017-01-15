var app = angular.module('revizone', ['ngRoute', 'revizone.controllers', 'ngDialog']);

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
        controller: 'homeCtrl'
    }).
    when('/inscription', {
        title: "Inscription",
        templateUrl: 'partials/register.html',
        controller: 'registerCtrl'
    }).
    when('/trouver', {
        title: "Recherche de cours",
        templateUrl: 'partials/recherche.html',
        controller: 'rechercheCtrl'
    }).
    when('/cgu', {
        title: "Conditions Générales d'Utilisation",
        templateUrl: 'partials/cgu.html',
        controller: 'cguCtrl'
    }).
    when('/classe', {
        title: "Ma classe",
        templateUrl: 'partials/classe.html',
        controller: 'classeCtrl'
    }).
    when('/connexion', {
        title: "Connexion",
        templateUrl: 'partials/login.html',
        controller: 'loginCtrl'
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
        templateUrl: 'partials/nouveau.html',
        controller: 'newCtrl'
    }).
    when('/cours/:idcours', {
        title: "Cours",
        templateUrl: 'partials/cours.html',
        controller: 'coursCtrl'
    }).
    when('/cours/:coursId/modifier', {
        title: "Modifier un cours",
        templateUrl: 'partials/modifier.html',
        controller: 'modifierCtrl'
    }).
    when('/cours/:coursId/exercices', {
        title: "Exercices",
        templateUrl: 'partials/exercices.html',
        controller: 'exercicesCtrl'
    }).
    otherwise({
        title: "Page non trouvée!",
        redirectTo: '/404'
    });
});

//Scope for the # (root)
app.run(['$rootScope', '$location', 'AuthService', function($rootScope, $location, AuthService) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (!AuthService.isAuthenticated()) {
            var allowedRoutes = ['/', '', '/accueil', '/connexion', '/404', '/inscription', '/trouver', '/cgu'];
            var isAllowed = allowedRoutes.indexOf($location.path()) > -1 || ($location.path().substring(0, '/cours/'.length)) === '/cours/' || ($location.path().substring(0, '/profil/'.length)) === '/profil/'; //checks if the $location.path() is contained in the allowedRoutes array.
            if (!isAllowed)  { //if not allowed -> /login path
                event.preventDefault();
                $location.path('/login');
            }
        }

    });
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous, userInfo) {
        $rootScope.title = current.$$route.title; //change the HTML index title to the current root title;
    });
}]);
