'use strict';

var services = angular.module('Services', ['ngResource']);

services.factory('MessagesFactory', function($localForage, $q){
  var messages = {};

  messages.init = function () {
    return $q(function(resolve, reject) {
      $localForage.iterate(function(value, key, iterationNumber) {
        messages.list.push({infoHash: key, message: value});
      }).then(function () {
        resolve(messages.list);
      })
    })


  };

//   .then(function(data) {
//   // data is the key of the value > 10
// });


messages.list = [];

messages.add = function(infoHash, message){
  messages.list.push({infoHash: infoHash, message: message});
  $localForage.setItem(infoHash, message);
};

return messages;
});
