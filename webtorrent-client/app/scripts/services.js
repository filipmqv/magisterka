'use strict';

var services = angular.module('Services', ['ngResource']);

services.factory('MessagesFactory', function($localForage, $q){
  var messages = {};

  messages.init = function () {
    return $q(function(resolve) {
      $localForage.iterate(function(value, key) {
        messages.list.push({infoHash: key, message: value});
      }).then(function () {
        resolve(messages.list);
      });
    });
  };

  messages.list = [];

  messages.add = function(infoHash, message){
    messages.list.push({infoHash: infoHash, message: message});
    $localForage.setItem(infoHash, message);
  };

  return messages;
});
