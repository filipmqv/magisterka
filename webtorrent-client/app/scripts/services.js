'use strict';

var services = angular.module('Services', []);

services.factory('MessagesFactory', function($localForage, localStorageService, $q, lodash){
  var NUMBER_OF_MESSAGES_FOR_LEVEL = 5;

  var messages = {};

  messages.my = [[], [], [], [], [], [], []];
  messages.control = [[], [], [], [], [], [], []];
  messages.other = [];
  messages.otherControl = [];

  function clearArrayOfArays(arr) {
    for (var i = 0, len = arr.length; i < len; i++) {
      arr[i] = [];
    }
  }

  function clearVariables() {
    clearArrayOfArays(messages.my);
    clearArrayOfArays(messages.control);
    messages.other.splice(0);
    messages.otherControl.splice(0);
  }

  function logn(base, val) {
    return Math.log(val) / Math.log(base);
  }

  messages.getLevelFromLength = function(len) {
    return Math.floor(logn(NUMBER_OF_MESSAGES_FOR_LEVEL, len));
  };

  messages.numberOfMessagesForLevel = function (level) {
    return Math.pow(NUMBER_OF_MESSAGES_FOR_LEVEL, level+1);
  };

  function pushMessage(userDhtId, infoHash, message, level) {
    if (message.type === 'control' && userDhtId === message.sender) {
      var levelCounted = messages.getLevelFromLength(message.content.infoHashes.length); // count level based on number of regular messages it contains
      messages.control[levelCounted].push({infoHash: infoHash, message: message});
    } else if (message.type === 'control') {
      messages.otherControl.push({infoHash: infoHash, message: message});
    } else if (userDhtId === message.sender) {
      level = level || 0;
      messages.my[level].push({infoHash: infoHash, message: message});
    } else {
      messages.other.push({infoHash: infoHash, message: message});
    }
  }

  messages.init = function (userDhtId) {
    clearVariables();
    NUMBER_OF_MESSAGES_FOR_LEVEL = localStorageService.get('NUMBER_OF_MESSAGES_FOR_LEVEL') || 5;
    return $q(function(resolve) {
      $localForage.iterate(function(value, key) {
        pushMessage(userDhtId, key, value);
      }).then(function () {
        resolve();
      });
    });
  };

  messages.add = function(infoHash, message, userDhtId, level) {
    pushMessage(userDhtId, infoHash, message, level);
    $localForage.setItem(infoHash, message);
  };

  messages.moveLevelUp = function (level) {
    messages.my[level+1] = lodash.concat(messages.my[level+1], messages.my[level]);
    messages.my[level] = [];
  };

  messages.removeControlMessagesFromLevel = function (level) {
    $localForage.removeItem(lodash.map(messages.control[level], 'infoHash'));
    messages.control[level] = [];
  };

  messages.removeControlMessagesByInfoHash = function (infoHashes) {
    function compare(i, j) {
      return i.infoHash === j;
    }
    lodash.pullAllWith(messages.otherControl, infoHashes, compare);
    lodash.forEach(messages.control, function (sublist) {
      lodash.pullAllWith(sublist, infoHashes, compare);
    });
    $localForage.removeItem(infoHashes);
  };

  messages.getMessagesByInfoHash = function (list, infoHashes, level) {
    level = level || 0;
    var messagesFromList = lodash.filter(list[level], function(item) {
      return lodash.includes(infoHashes, item.infoHash);
    });
    return messagesFromList;
  };

  messages.changeLevelForMessages = function (list, fromLevel, toLevel, listOfMessagesToMove) {
    lodash.pullAll(list[fromLevel], listOfMessagesToMove);
    list[toLevel] = lodash.concat(list[toLevel], listOfMessagesToMove);
  };

  messages.getAll = function () {
    return lodash.concat(lodash.flatten(messages.my), messages.other);
  };

  messages.getMessagesAndControl = function () {
    return lodash.concat(lodash.flatten(messages.my), lodash.flatten(messages.control), messages.other, messages.otherControl);
  };

  messages.clearAll = function () {
    return $q(function (resolve) {
      $localForage.clear().then(function () {
        resolve();
      });
    });
  };

  return messages;
});


