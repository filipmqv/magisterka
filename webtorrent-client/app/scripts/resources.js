'use strict';

var resources = angular.module('Resources', ['ngResource']);


resources.factory('DhtFactory', function ($resource, ENDPOINT_URI) {
  return $resource(ENDPOINT_URI + 'dht/:dhtId', {dhtId:'@_id'},
    {
      get: {
        method: 'GET',
        headers: { 'Cache-Control' : 'no-cache' }
      },
      'update': { method:'PUT' }
    });
});

// todo rename to FriendsFactory
resources.factory('UsersFactory', function ($resource, ENDPOINT_URI) {
  return $resource(ENDPOINT_URI + 'users');
});

resources.factory('ConversationsFactory', function ($resource, ENDPOINT_URI) {
  return $resource(ENDPOINT_URI + 'conversations?embedded={"user_id":1}');
});

