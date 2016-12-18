angular.module('revizone', ['ngRoute', 'revizone.controllers'])
    .config(function($routeProvider) {
        $routeProvider.
        when('/', {
            redirectTo: '/home',
            controller: 'AppCtrl'
        }).
        when('/home', {
            title: "Home",
            templateUrl: 'partials/home.html',
            controller: 'homeCtrl'
        }).
        otherwise({
            title: "Page not found!",
            redirectTo: '/404'
        });
    })

//Scope for the # (root)
.run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous, userInfo) {
        $rootScope.title = current.$$route.title; //change the HTML index title to the current root title;
    });
}]);
