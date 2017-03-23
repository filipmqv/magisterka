'use strict';

var services = angular.module('ResourceServices', ['ngResource']);

var lhost = 'http://0.0.0.0:5000/';
//var rhcloud = 'http://server-foodplaner.rhcloud.com/rest/v1/'; // to change
var domainUrl = lhost;

services.factory('DhtService', function ($resource) {
  return $resource(domainUrl + 'dht/:dhtId', {dhtId:'@_id'},
    {
      'update': { method:'PUT' }
    });
});

services.factory('UsersService', function ($resource) {
  return $resource(domainUrl + 'users');
});
