'use strict';

var services = angular.module('Resources', ['ngResource']);


services.factory('DhtFactory', function ($resource, ENDPOINT_URI) {
  return $resource(ENDPOINT_URI + 'dht/:dhtId',
    {
      'update': { method:'PUT' }
    });
});

services.factory('UsersFactory', function ($resource, ENDPOINT_URI) {
  return $resource(ENDPOINT_URI + 'users');
});
