angular.module('revizone')
    .factory('UtilsFactory', function() {
        return {
            makeAlert: function(msg, type, url, delay) {
                $.notify({
                    // options
                    message: msg,
                    url: url
                }, {
                    // settings
                    placement: {
                        from: "top",
                        align: "right"
                    },
                    type: type,
                    offset: 5,
                    spacing: 50,
                    z_index: 1031,
                    delay: 5000,
                    timer: 500,
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    }
                });
            }
        };
    })
    .service('AuthService', function($q, $http, API_ENDPOINT, $rootScope) {
        var LOCAL_TOKEN_KEY = 'a65f1va98';
        var isAuthenticated = false;
        var authToken;

        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                useCredentials(token);
            }
        }

        function storeUserCredentials(token) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            useCredentials(token);
        }

        function useCredentials(token) {
            isAuthenticated = true;
            authToken = token;

            // Set the token as header for your requests!
            $http.defaults.headers.common.Authorization = authToken;
        }

        function destroyUserCredentials() {
            authToken = undefined;
            isAuthenticated = false;
            $http.defaults.headers.common.Authorization = undefined;
            window.localStorage.removeItem(LOCAL_TOKEN_KEY);
        }

        var register = function(user) {
            return $q(function(resolve, reject) {
                $http.post(API_ENDPOINT.url + '/signup', user).then(function(result) {
                    if (result.data.success) {
                        resolve(result.data.msg);
                        $rootScope.$emit('userLoggedOut');
                    } else {
                        reject(result.data.msg);
                    }
                });
            });
        };

        var getUser = function()  {
            return $q(function(resolve, reject) {
                $http.get(API_ENDPOINT.url + '/getuser').then(function(result) {
                    if (result.data) {
                        resolve(result.data);
                    } else {
                        reject(result.data.msg);
                    }
                });
            });
        }

        var login = function(user) {
            return $q(function(resolve, reject) {
                $http.post(API_ENDPOINT.url + '/authenticate', user).then(function(result) {
                    if (result.data.success) {
                        storeUserCredentials(result.data.token);
                        resolve(result.data.msg);
                        $rootScope.$emit('userLoggedIn');
                    } else {
                        reject(result.data.msg);
                    }
                });
            });
        };

        var logout = function() {
            destroyUserCredentials();
        };

        loadUserCredentials();

        return {
            login: login,
            register: register,
            logout: logout,
            isAuthenticated: function() {
                return isAuthenticated;
            },
            getUser: getUser
        };
    })

.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS) {
    return {
        responseError: function(response) {
            $rootScope.$broadcast({
                401: AUTH_EVENTS.notAuthenticated,
            }[response.status], response);
            return $q.reject(response);
        }
    };
})

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});
