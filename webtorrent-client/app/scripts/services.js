'use strict';

var services = angular.module('ResourceServices', ['ngResource']);

//var lhost = 'http://0.0.0.0:5000/';
var intrahost = 'http://192.168.1.5:5000/';
var domainUrl = intrahost;

services.factory('DhtFactory', function ($resource) {
  return $resource(domainUrl + 'dht/:dhtId', {dhtId:'@_id'},
    {
      'update': { method:'PUT' }
    });
});

services.factory('UsersFactory', function ($resource) {
  return $resource(domainUrl + 'users');
});
