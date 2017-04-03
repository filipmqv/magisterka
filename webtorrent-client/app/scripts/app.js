'use strict';

/**
 * @ngdoc overview
 * @name webtorrentClientApp
 * @description
 * # webtorrentClientApp
 *
 * Main module of the application.
 */
angular
  .module('webtorrentClientApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ResourceServices',
    'luegg.directives',
    'LocalForageModule'
  ])
  .constant('ENDPOINT_URI', 'http://192.168.1.5:5000/')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/messenger', {
        templateUrl: 'views/messenger.html',
        controller: 'MessengerCtrl',
        controllerAs: 'messenger'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
