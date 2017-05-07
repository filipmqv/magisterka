'use strict';

var services = angular.module('Torrents', []);

services.factory('TorrentFactory', function($localForage, DhtFactory, MessagesFactory, lodash){
  var torrent = {};

  var WebTorrent = require('webtorrent');
  var client = new WebTorrent();

  // prevent warnings about possible memory leak when >11 listeners added (webtorrent)
  const EventEmitter = require('events').EventEmitter;
  EventEmitter.defaultMaxListeners = 1000;

  var lastInfoHashes = [];
  var myCurrentInfoHash = '';
  var myDhtId = '';

  function getMyCurrentInfoHash(userDhtId) {
    DhtFactory.get({dhtId: userDhtId}, function (data) {
      myCurrentInfoHash = data.infohash;
    }, handleDhtError);
  }



  function seedByControlMessages(controlList, messagesList) {
    lodash.forEachRight(controlList, function (levelList) {
      if (levelList) {
        lodash.forEach(levelList, function (controlMessage) {
          var hashes = controlMessage.message.content.infoHashes;
          var lvl = MessagesFactory.getLevelFromLength(hashes.length);
          var messages = MessagesFactory.getMessagesByInfoHash(messagesList, hashes);
          MessagesFactory.changeLevelForMessages(messagesList, 0, lvl, messages)

          var sortedMessages = lodash.sortBy(messages, 'infoHash');
          var bufs = lodash.map(sortedMessages, createBuffer);

          var infoHashesBuf = createBufferWithName(controlMessage.message, 'control');
          bufs.push(infoHashesBuf);
          client.seed(bufs, {name: 'control'});
        });
      }
    });
  }

  function seedList(list) {
    lodash.forEach(list, function (item) {
      client.seed(createBuffer(item.message));
    });
  }

  function seedOnInit() {
    // seed my messages and then other's

    // todo usunąć rekurencyjnie z niższych leveli na bazie controlMessage.message.content.prevControlMsgs
    // todo zbierać wiadomości do listy a potem jednym ruchem usunąć

    seedByControlMessages(MessagesFactory.control, MessagesFactory.my);
    // seed rest of messages (which were not compacted)
    seedList(MessagesFactory.my[0]);

    // temporary tree of control messages
    var tempOtherControl = [[], [], [], [], [], [], []];
    lodash.forEach(MessagesFactory.otherControl, function (item) {
      var lvl = MessagesFactory.getLevelFromLength(item.message.content.infoHashes.length);
      tempOtherControl[lvl].push(item);
    });
    var tempOther = [[], [], [], [], [], [], []];
    tempOther[0] = lodash.concat(tempOther[0], MessagesFactory.other);
    seedByControlMessages(tempOtherControl, tempOther);
    seedList(tempOther[0]);
  }

  function initialize(userDhtId) {
    // todo czy to ONCE nie wymaga przeładowania strony po zalogowaniu, jesli ktoś sie wczesniej wylogował bez odświeżenia?
    myDhtId = userDhtId;
    getMyCurrentInfoHash(userDhtId);
    MessagesFactory.init(userDhtId).then(seedOnInit);
  }
  torrent.init = lodash.once(initialize);





  function removeTorrents(infoHashes) {
    lodash.forEach(infoHashes, function(i) {
      if (client.get(i)) {
        client.remove(i, handleIfError);
      }
    });
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

  function onTorrent (torrent) {
    // todo jesli typ video to od razu dodać (nie czekać na 'done') jak w przykładzie, a na 'done' zapisać w localforage
    torrent.on('done', function () {
      if (torrent.name === 'control') {
        torrent.files.forEach(function (file) {

          file.getBuffer(function (err, buffer) {
            var message = getFromBuffer(buffer);
            // TODO - a co jeśli to moja wiadomość? (bo np loguję się na nowym kompie) wtedy trzeba ją dać na odpowiedni level
            if (file.name === 'text' && !isInfoHashInConversation(MessagesFactory.getAll(), message.infoHash)) {
              MessagesFactory.add(message.infoHash, message.message);
            }
            if (file.name === 'control') {
              removeTorrents(message.content.infoHashes);
              removeTorrents(message.content.controlMessages);
              MessagesFactory.removeControlMessagesByInfoHash(message.content.controlMessages);

              MessagesFactory.add(torrent.infoHash, message);
              if (message.previousInfoHash) {
                addTorrentByInfoHash(message.previousInfoHash);
              }
            }
          });

        });
      }

      if (torrent.name === 'text') {
        torrent.files.forEach(function (file) {
          file.getBuffer(function (err, buffer) {
            var message = getFromBuffer(buffer);

            // todo nie wyswietlać dopóki nie mamy wszystkich poprzednich wiadomości
            MessagesFactory.add(torrent.infoHash, message);
            console.log(lodash.now() + ' should apply ' + message.content);
            if (message.previousInfoHash && !isInfoHashInConversation(MessagesFactory.getAll(), message.previousInfoHash)) {
              console.log('adding previous ' + message.previousInfoHash);
              addTorrentByInfoHash(message.previousInfoHash);
            }
          });
        });
      }
    });
  }

  torrent.checkMessages = function () {
    // TODO zamiast wszystkich pobrać tylko z tych ID które należą do naszych znajomych w tej konwersacji
    // TODO docelowo sprawdzić wszystkie konwersacje
    DhtFactory.get({}, function (data) {
      var currentInfoHashes = data._items;
      // for all friends check if there's new infohash
      lodash.forEach(currentInfoHashes, function (current) {
        var last = lodash.find(lastInfoHashes, {'_id': current._id});
        if (!last || (last.infohash !== current.infohash && !isInfoHashInConversation(MessagesFactory.getAll(), current.infohash))) {
          addTorrentByInfoHash(current.infohash);
        }
      });
      lastInfoHashes = currentInfoHashes;
    }, handleDhtError);
  };



// sending

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
    // todo jakie wiadomości zawiera i jakie kontrolne zastepuje bezposrednio - a przy inicie zanim usuniemy te kontrolne to sprawdzamy czy nie ma jeszcze poniżej nich innych kontrolnych rekurencyjnie
    var numberOfSingleMessages = MessagesFactory.my[level].length;
    var numberOfMessagesForLevel = MessagesFactory.numberOfMessagesForLevel(level);
    if (numberOfSingleMessages >= numberOfMessagesForLevel) {
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


      client.seed(bufs, {name: 'control'}, function (torrent) {
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
    var actualType = type || 'text';
    // TODO sender - sprawdzać przy odbiorze czy się zgadza z tym kto wystawił infohash na swoim dhtId
    return {
      type: actualType,
      content: input,
      timestamp: lodash.now(),
      sender: userDhtId, // todo dhtId z konwersacji
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

      var noCompactInProgress = tryCompactMessages(0); // TODO kompaktować tylko te tekstowe czy wideo też??
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

  torrent.getAllTorrents = function () {
    return client.torrents;
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

  return torrent;
});


