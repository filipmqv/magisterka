'use strict';

angular.module('webtorrentClientApp')
  .controller('LoginCtrl', function ($scope, $rootScope, AUTH_EVENTS, AuthService, UserService, $location) {

    // for testing and quick filling the form
    $scope.credentialsInput = {};
    $scope.usernames = ['moz', 'chrome', 'oper', 'h1', 'h2', 'h3', 'h4',
      'test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9'];
    var emailEnding = '@wp.pl';
    var password = 'password';

    $scope.fillCredentials = function (username) {
      $scope.credentialsInput.email = username + emailEnding;
      $scope.credentialsInput.password = password;
    };




    $scope.login = function (credentials) {
      AuthService.login(credentials).then(function () {
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
        $location.path('/messenger');
      }, function (err) {
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
        $scope.error = err.data.error;
      });
    };
  });
