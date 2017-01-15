angular.module('revizone')

.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated'
})

.constant('API_ENDPOINT', {
  url: 'http://64.137.171.80:8089/api'
  //  For a simulator use: url: 'http://127.0.0.1:8080/api'
});
