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

  var getMyCurrentInfoHash = function (userDhtId) {
    DhtFactory.get({dhtId: userDhtId}, function (data) {
      myCurrentInfoHash = data.infohash;
    });
  };

  torrent.init = function (userDhtId) {
    myDhtId = userDhtId;
    getMyCurrentInfoHash(userDhtId);
    MessagesFactory.init(userDhtId).then(function (list) {
      lodash.forEach(list, function (item) {
        // todo zastąpić to jedną funkcją i ją dać też w funkcji sendMessage
        var buf = new Buffer(JSON.stringify(item.message));
        buf.name = 'text'; // TODO jakiś użytek z tego? odróżnienie wiadomości od załączników z nazwami? komponowanie "folderu"
        client.seed(buf);
      });
    });
  };


  function isInfoHashInConversation(conversation, infohash) {
    var found = lodash.find(conversation, lodash.matchesProperty('infoHash', infohash));
    return !!found;
  }

  function addTorrentByInfoHash(infohash) {
    if (infohash.length !== 40) {
      return;
    }
    var magnetLink = 'magnet:?xt=urn:btih:'+ infohash +'&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
    var existingTorrent = client.get(magnetLink);
    if (!existingTorrent) {
      client.add(magnetLink, onTorrent);
    } else {
      console.log(infohash + '   exists');
    }
  }

  function onTorrent (torrent) {
    torrent.on('done', function () {
      torrent.files.forEach(function(file){
        file.getBuffer(function (err, buffer) {
          var message = JSON.parse(buffer.toString('utf8'));
          // todo nie wyswietlać dopóki nie mamy wszystkich poprzednich wiadomości
          // todo oddzielić wyświetlane wiadomosci od tych w pamięci (ogółem seedowanych - nie wszystkie muszą być na widoku)
          MessagesFactory.add(torrent.infoHash, message);
          console.log(lodash.now() + ' should apply ' + message.text);
          if (message.previousInfoHash && !isInfoHashInConversation(MessagesFactory.getAll(), message.previousInfoHash)) {
            console.log('adding previous ' + message.previousInfoHash);
            addTorrentByInfoHash(message.previousInfoHash);
          }
        });
      });
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
    });
  };





  var tryCompactMessages = function () {
    // todo policz w puszowaniu ile wiadomości nie jest złączonych od czasu ostatniego łączenia, jeśli >5 to połącz
    var numberOfSingleMessages = MessagesFactory.my.length;
    console.log('in compact' + numberOfSingleMessages)
    if (numberOfSingleMessages > 3) {
      console.log('dsfsdfs')
    }
  };

  function updateDht(myDhtId, infoHash) {
    var dhtObject = {};
    dhtObject._id = myDhtId;
    dhtObject.infohash = infoHash;
    DhtFactory.update({}, dhtObject, null, function (error) {
      console.error(error);
    });
  }

  var sendingInProgress = false;
  torrent.sendMessage = function (textInput) {
    // prevent sending 2 messages with the same previous infohash
    if (!sendingInProgress) {
      sendingInProgress = true;
      // TODO sender - sprawdzać przy odbiorze czy się zgadza z tym kto wystawił infohash na swoim dhtId
      var message = {
        text: textInput,
        timestamp: lodash.now(),
        sender: myDhtId, // todo dhtId z konwersacji
        previousInfoHash: myCurrentInfoHash
      };
      var buf = new Buffer(JSON.stringify(message));
      buf.name = 'text'; // TODO jakiś użytek z tego? odróżnienie wiadomości od załączników z nazwami? komponowanie "folderu"
      client.seed(buf, function (torrent) {
        myCurrentInfoHash = torrent.infoHash;
        MessagesFactory.add(torrent.infoHash, message, myDhtId);
        updateDht(myDhtId, torrent.infoHash);
        tryCompactMessages();
        sendingInProgress = false;
      });
    }
  };



  client.on('error', function (err) {
    console.error('WEBTORRENT ERROR: ' + err.message);
  });

  return torrent;
});


