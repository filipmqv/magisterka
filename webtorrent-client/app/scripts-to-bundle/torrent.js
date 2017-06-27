'use strict';

var services = angular.module('Torrents', []);

services.factory('TorrentFactory', function($localForage, $timeout, $interval, DhtFactory, MessagesFactory, lodash, TESTING_MODE){
  var torrent = {};

  // TODO FOR TESTING
  var TESTING_REPLYER = true;

  var WebTorrent = require('webtorrent');
  var client = new WebTorrent();

  // prevent warnings about possible memory leak when >11 listeners added (webtorrent)
  const EventEmitter = require('events').EventEmitter;
  EventEmitter.defaultMaxListeners = 1000;

  var lastInfoHashes = [];
  var myCurrentInfoHash = '';
  var myDhtId = '';
  // set date 1 week ago
  var dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - 7);

  function getMyCurrentInfoHash(userDhtId) {
    DhtFactory.get({dhtId: userDhtId}, function (data) {
      myCurrentInfoHash = data.infohash;
    }, handleDhtError);
  }

/////////////////// init

  function isOlderThanOneWeek(timestamp, OneWeekAgoDate) {
    return timestamp < OneWeekAgoDate
  }

  function seedByControlMessages(controlList, messagesList) {
    lodash.forEachRight(controlList, function (levelList) {
      if (levelList) {
        lodash.forEach(levelList, function (controlMessage) {
          if (isOlderThanOneWeek(controlMessage.message.timestamp, dateThreshold)) {
            // if message is older then 1 week then don't seed it
            return;
          }
          var hashes = controlMessage.message.content.infoHashes;
          var lvl = MessagesFactory.getLevelFromLength(hashes.length);
          var messages = MessagesFactory.getMessagesByInfoHash(messagesList, hashes);
          MessagesFactory.changeLevelForMessages(messagesList, 0, lvl, messages);

          var sortedMessages = lodash.sortBy(messages, 'infoHash');
          var bufs = lodash.map(sortedMessages, createBuffer);

          var infoHashesBuf = createBufferWithName(controlMessage.message, 'control');
          bufs.push(infoHashesBuf);
          client.seed(bufs, {name: 'control' + lvl});
        });
      }
    });
  }

  function seedList(list) {
    lodash.forEach(list, function (item) {
      if (isOlderThanOneWeek(item.message.timestamp, dateThreshold)) {
        // if message is older then 1 week then don't seed it
        return;
      }
      client.seed(createBuffer(item.message));
    });
  }

  function getControlMessagesToRemove(flatControlMessages) {
    // return control messages which contain some messages that are also in other control message and are smaller then them
    var toRemove = [];
    lodash.forEach(flatControlMessages, function (controlMessage) {
      var toPush = lodash.filter(flatControlMessages, function (item) {
        return item.infoHash !== controlMessage.infoHash &&
          item.message.content.infoHashes.length < controlMessage.message.content.infoHashes.length &&
          lodash.intersection(item.message.content.infoHashes, controlMessage.message.content.infoHashes).length > 0;
      });
      if (toPush.length > 0) {
        toRemove.push(toPush);
      }
    });
    return toRemove;
  }

  function removeUnnecessaryControlMessages(controlMessages) {
    var infoHashesToRemove = lodash.chain(controlMessages)
      .flattenDeep() // first flatten the list
      .thru(getControlMessagesToRemove)
      .map('infoHash')
      .value();
    MessagesFactory.removeControlMessagesByInfoHash(infoHashesToRemove);
  }

  function seedOnInit() {
    // first remove control messages which are contained in other (bigger) control messages
    removeUnnecessaryControlMessages(MessagesFactory.control);
    removeUnnecessaryControlMessages(MessagesFactory.otherControl);

    // seed my messages (first control messages, then the rest)
    seedByControlMessages(MessagesFactory.control, MessagesFactory.my);
    seedList(MessagesFactory.my[0]);

    // temporary tree of control messages
    var tempOtherControl = [[], [], [], [], [], [], []];
    lodash.forEach(MessagesFactory.otherControl, function (item) {
      var lvl = MessagesFactory.getLevelFromLength(item.message.content.infoHashes.length);
      tempOtherControl[lvl].push(item);
    });
    var tempOther = [[], [], [], [], [], [], []];
    tempOther[0] = lodash.concat(tempOther[0], MessagesFactory.other);

    // seed other's control messages then the rest of regular messages
    seedByControlMessages(tempOtherControl, tempOther);
    seedList(tempOther[0]);
  }

  function actualInit(userDhtId) {
    client = new WebTorrent();
    myDhtId = userDhtId;
    getMyCurrentInfoHash(userDhtId);
    MessagesFactory.init(userDhtId).then(seedOnInit);
  }

  torrent.init = function(userDhtId, replyer) {
    TESTING_REPLYER = replyer !== null ? replyer : true;
    if (client && !client.destroyed) {
      // if not destroyed - destroy first
      client.destroy(function (err) {
        if (err) {
          return console.error(err);
        }
        actualInit(userDhtId);
      });
    } else {
      actualInit(userDhtId);
    }

    // todo czy to nie wymaga przeładowania strony po zalogowaniu, jesli ktoś sie wczesniej wylogował bez odświeżenia?
  };

///////////// receive


  function removeTorrents(infoHashes) {
    // workaround for time testing with protractor (timeout-->interval called once)
    $interval(function () {
      lodash.forEach(infoHashes, function(i) {
        if (client.get(i)) {
          client.remove(i, handleIfError);
        }
      });
    }, 5000, 1, true);
  }

  function isInfoHashInConversation(conversation, infohash) {
    var found = lodash.find(conversation, lodash.matchesProperty('infoHash', infohash));
    return !!found;
  }

  function getMagnetLink(infohash) {
    return 'magnet:?xt=urn:btih:'+ infohash +'&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
  }

  function addTorrentByInfoHash(infohash) {
    if (infohash.length !== 40) {
      return;
    }
    var magnetLink = getMagnetLink(infohash);
    var existingTorrent = client.get(magnetLink);
    if (!existingTorrent) {
      client.add(magnetLink, onTorrent);
    }
  }

  function addPreviousInfoHash(previousInfoHash) {
    if (previousInfoHash && !isInfoHashInConversation(MessagesFactory.getMessagesAndControl(), previousInfoHash)) {
      console.log('adding previous ' + previousInfoHash);
      addTorrentByInfoHash(previousInfoHash);
    }
  }

  function addTextToConversation(infoHash, message, levelForMessages) {
    if (!isInfoHashInConversation(MessagesFactory.getMessagesAndControl(), infoHash)) {
      MessagesFactory.add(infoHash, message, myDhtId, levelForMessages);
      console.log(lodash.now() + ' should apply ' + message.content);
      TESTING_MODE_AUTO_REPLAY(message.content);
    }
  }

  function handleControlTorrentFile(torrent, file, levelForMessages) {
    file.getBuffer(function (err, buffer) {
      var message = getFromBuffer(buffer);
      if (file.name === 'text') {
        addTextToConversation(message.infoHash, message.message, levelForMessages);
      } else if (file.name === 'control') {
        removeTorrents(message.content.infoHashes);
        removeTorrents(message.content.controlMessages);
        MessagesFactory.removeControlMessagesByInfoHash(message.content.controlMessages);
        MessagesFactory.add(torrent.infoHash, message, myDhtId);
        addPreviousInfoHash(message.previousInfoHash);
      }
    });
  }

  function handleTextTorrentFile(torrent, file) {
    file.getBuffer(function (err, buffer) {
      var message = getFromBuffer(buffer);
      // todo nie wyswietlać dopóki nie mamy wszystkich poprzednich wiadomości
      addTextToConversation(torrent.infoHash, message);
      addPreviousInfoHash(message.previousInfoHash);
    });
  }

  function onTorrent (torrent) {
    if (torrent.name.startsWith('control')) {
      var levelForMessages = lodash.parseInt(torrent.name.slice(7));
      torrent.files.forEach(function (file) {
        handleControlTorrentFile(torrent, file, levelForMessages);
      });
    } else if (torrent.name === 'text') {
      torrent.files.forEach(function (file) {
        handleTextTorrentFile(torrent, file);
      });
    }
      // todo zrobić otrzymywanie, zapisywanie, wyswietlanie i init plików (dowolnych)
      // todo jeśli typ z załącznikiem to najpierw trzeba przygotować dymek czatu (na bazie wiadomości) i w niego wstawić załącznik
  }

  function checkInfoHashForDhtId(dhtId) {
    DhtFactory.get({dhtId: dhtId}, function (data) {
      // if there's newer inhohash for dhtId - add torrent and save as latest
      var currentInfoHash = data;
      var last = lodash.find(lastInfoHashes, {'_id': currentInfoHash._id});
      if (!last || (last.infohash !== currentInfoHash.infohash &&
              !isInfoHashInConversation(MessagesFactory.getMessagesAndControl(), currentInfoHash.infohash))) {
        addTorrentByInfoHash(currentInfoHash.infohash);
        lodash.pull(lastInfoHashes, last);
        lastInfoHashes.push(currentInfoHash);
      }
    }, handleDhtError);
  }

  torrent.checkMessages = function (dhtIdsInConversations) {
    // check all conversations and all users in them
    lodash.forEach(dhtIdsInConversations, function (dhtIds) {
      lodash.forEach(dhtIds, function (dhtId) {
        checkInfoHashForDhtId(dhtId);
      });
    });
  };



/////////////// send

  var sendingQueue = [];
  var sendingInProgress = false;

  function afterSending(infoHash) {
    updateDht(myDhtId, infoHash);
    if (sendingQueue.length > 0) { // take message from queue
      sendMessageInner(sendingQueue.shift());
    } else {
      sendingInProgress = false;
    }
  }

  function tryCompactMessages(level) {
    var numberOfSingleMessages = MessagesFactory.my[level].length;
    var numberOfMessagesForLevel = MessagesFactory.numberOfMessagesForLevel(level);
    if (numberOfMessagesForLevel > 1 && numberOfSingleMessages >= numberOfMessagesForLevel) {
      // create control message
      // get messages which will be compacted into this new control message
      var sortedMessages = lodash.sortBy(MessagesFactory.my[level], 'infoHash');
      var bufs = lodash.map(sortedMessages, createBuffer);

      // get list of infohashes of those messages
      var oldestPrevInfoHash = lodash.minBy(sortedMessages, 'message.timestamp').message.previousInfoHash;
      var infoHashes = lodash.map(sortedMessages, 'infoHash');

      // get control messages from this level
      var sortedControlMessages = lodash.sortBy(MessagesFactory.control[level], 'infoHash');
      var controlMessagesInfoHashes = lodash.map(sortedControlMessages, 'infoHash');

      // todo czy tutaj nie dać drzewa z zależnościami z niższych leveli?
      var thisControlMessageContent = {infoHashes: infoHashes, controlMessages: controlMessagesInfoHashes};

      var infoHashesMsg = createMessage(thisControlMessageContent, myDhtId, oldestPrevInfoHash, 'control');
      var infoHashesBuf = createBufferWithName(infoHashesMsg, 'control');
      bufs.push(infoHashesBuf);

      removeTorrents(infoHashes);
      removeTorrents(controlMessagesInfoHashes);

      MessagesFactory.moveLevelUp(level);

      var torrentNameLevel = level + 1;
      client.seed(bufs, {name: 'control' + torrentNameLevel}, function (torrent) {
        myCurrentInfoHash = torrent.infoHash;
        MessagesFactory.add(torrent.infoHash, infoHashesMsg, myDhtId);
        MessagesFactory.removeControlMessagesFromLevel(level);

        var noCompactInProgress = tryCompactMessages(level+1);
        if (noCompactInProgress) { // update only if there's no compacting in progress
          afterSending(torrent.infoHash);
        }
      });
    } else {
      return true; // no messages to compact on this level
    }
    return false; // compacting is in progress and 'don't update DHT'
  }

  function updateDht(myDhtId, infoHash) {
    var dhtObject = {
      _id: myDhtId,
      infohash: infoHash
    };
    DhtFactory.update({}, dhtObject, null, function (error) {
      console.error(error);
    });
  }

  function createMessage(input, userDhtId, prevInfoHash, type) {
    // TODO sender - sprawdzać przy odbiorze czy się zgadza z tym kto wystawił infohash na swoim dhtId
    return {
      type: type || 'text',
      content: input,
      timestamp: lodash.now(),
      sender: userDhtId,
      previousInfoHash: prevInfoHash
    };
  }

  function createBufferWithName(message, name) {
    var actualName = name || 'text';
    var buffer = new Buffer(angular.toJson(message));
    buffer.name = actualName;
    return buffer;
  }

  function createBuffer(message) {
    return createBufferWithName(message, 'text');
  }

  function getFromBuffer(buffer) {
    return angular.fromJson(buffer.toString('utf8'));
  }

  function sendMessageInner(textInput) {
    var message = createMessage(textInput, myDhtId, myCurrentInfoHash, null);
    var buf = createBuffer(message);
    client.seed(buf, function (torrent) {
      myCurrentInfoHash = torrent.infoHash;
      MessagesFactory.add(torrent.infoHash, message, myDhtId);

      var noCompactInProgress = tryCompactMessages(0);
      if (noCompactInProgress) { // only if there's no compacting in progress
        afterSending(torrent.infoHash);
      }
    });
  }
  torrent.sendMessage = function (textInput) {
    // prevent sending 2 messages with the same previous infohash - push to FIFO queue
    if (sendingInProgress) {
      sendingQueue.push(textInput);
    }
    else {
      sendingInProgress = true;
      sendMessageInner(textInput);
    }
  };

/////////////// close

  torrent.exit = function () {
    client.destroy();
  };

////////////////// other

  torrent.getAllTorrents = function () {
    return client.torrents;
  };

  torrent.getLastInfoHashes = function () {
    return lastInfoHashes;
  };

  client.on('error', function (err) {
    console.error('WEBTORRENT ERROR: ' + err.message);
  });

  function handleDhtError(error) {
    console.error('dht error: ' + error);
  }

  function handleIfError(error) {
    if (error) {
      console.error(error);
    }
  }

////////////////////// TESTING_MODE functions

  function TESTING_MODE_AUTO_REPLAY(content) {
    if (TESTING_MODE && TESTING_REPLYER) {
      if (content.startsWith('AUTO_REPLY_REQUEST')) {
        torrent.sendMessage('reply for ' + content);
      }
    }
  }

  return torrent;
});


