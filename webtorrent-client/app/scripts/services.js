'use strict';

var services = angular.module('Services', ['ngResource']);

services.factory('MessagesFactory', function($localForage, $q){
  var messages = {};
  //var numberOfSingleMessages = 0;

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

  messages.tryCompactMessages = function () {
    // todo policz w puszowaniu ile wiadomości nie jest złączonych od czasu ostatniego łączenia, jeśli >5 to połącz
  };

  return messages;
});


