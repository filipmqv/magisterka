'use strict';

var services = angular.module('Services', []);

services.factory('MessagesFactory', function($localForage, $q, lodash){
  var messages = {};

  messages.my = [];
  messages.other = [];

  function pushMessage(userDhtId, infoHash, message) {
    if (userDhtId === message.sender) {
      messages.my.push({infoHash: infoHash, message: message});
    } else {
      messages.other.push({infoHash: infoHash, message: message});
    }
  }

  messages.init = function (userDhtId) {
    return $q(function(resolve) {
      $localForage.iterate(function(value, key) {
        pushMessage(userDhtId, key, value);
      }).then(function () {
        resolve(messages.getAll());
      });
    });
  };

  messages.add = function(infoHash, message, userDhtId){
    pushMessage(userDhtId, infoHash, message);
    $localForage.setItem(infoHash, message);
  };

  messages.getAll = function () {
    return lodash.concat(messages.my, messages.other);
  };

  return messages;
});


