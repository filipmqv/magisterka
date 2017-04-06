'use strict';

angular.module('webtorrentClientApp')
  .controller('MessengerCtrl', function ($scope, $interval, DhtFactory, UsersFactory, MessagesFactory, lodash) {

    var WebTorrent = require('webtorrent');
    var client = new WebTorrent();

    // prevent warnings about possible memory leak when >11 listeners added (webtorrent)
    const EventEmitter = require('events').EventEmitter;
    EventEmitter.defaultMaxListeners = 1000;

    var clearVariables = function () {
      $scope.lastInfoHashes = [];
      $scope.textInput = '';
      $scope.conversation = MessagesFactory.list; // service z wiadomościami
      $scope.friends = []; // TODO pobrać z serviceu o userze lub w ogóle w nim trzymać tylko
      $scope.myDhtId = $scope.currentUser.dhtId; // TODO per conversation; to tylko dla danej konwersacji; pobierane z serwera razem z moim profilem
    };
    var myCurrentInfoHash = '';

    var getUsers = function () {
      UsersFactory.get({}, function (data) {
        $scope.friends = data._items;
      });
    };

    var getMyCurrentInfoHash = function (userDhtId) {
      DhtFactory.get({dhtId: userDhtId}, function (data) {
        myCurrentInfoHash = data.infohash;
      });
    };

    var initController = function () {
      clearVariables();
      MessagesFactory.init().then(function (list) {
        lodash.forEach(list, function (item) {
          // todo zastąpić to jedną funkcją i ją dać też w funkcji sendMessage
          var buf = new Buffer(JSON.stringify(item.message));
          buf.name = 'text'; // TODO jakiś użytek z tego? odróżnienie wiadomości od załączników z nazwami? komponowanie "folderu"
          client.seed(buf);
        });
      });
      getUsers();
      getMyCurrentInfoHash($scope.myDhtId);
    };




    function isInfoHashInConversation(conversation, infohash) {
      var found = lodash.find(conversation, lodash.matchesProperty('infoHash', infohash));
      return !!found;
    }

    var addTorrentByInfoHash = function (infohash) {
      var magnetLink = 'magnet:?xt=urn:btih:'+ infohash +'&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
      var existingTorrent = client.get(magnetLink);
      if (!existingTorrent) {
        client.add(magnetLink, onTorrent);
      } else {
        console.log(infohash + '   exists');
      }
    };

    function onTorrent (torrent) {
      torrent.on('done', function () {
        torrent.files.forEach(function(file){
          file.getBuffer(function (err, buffer) {
            var message = JSON.parse(buffer.toString('utf8'));
            // todo nie wyswietlać dopóki nie mamy wszystkich poprzednich wiadomości
            // todo oddzielić wyświetlane wiadomosci od tych w pamięci (ogółem seedowanych - nie wszystkie muszą być na widoku)
            MessagesFactory.add(torrent.infoHash, message);
            $scope.$apply();
            if (message.previousInfoHash && !isInfoHashInConversation(MessagesFactory.list, message.previousInfoHash)) {
              console.log('adding previous ' + message.previousInfoHash);
              addTorrentByInfoHash(message.previousInfoHash);
            }
          });
        });
      });
    }

    $scope.checkMessages = function () {
      // TODO zamiast wszystkich pobrać tylko z tych ID które należą do naszych znajomych w tej konwersacji
      // TODO docelowo sprawdzić wszystkie konwersacje
      DhtFactory.get({}, function (data) {
        var currentInfoHashes = data._items;
        // for all friends check if there's new infohash
        lodash.forEach(currentInfoHashes, function (current) {
          var last = lodash.find($scope.lastInfoHashes, {'_id': current._id});
          if (!last || (last.infohash !== current.infohash && !isInfoHashInConversation(MessagesFactory.list, current.infohash))) {
            addTorrentByInfoHash(current.infohash);
          }
        });
        $scope.lastInfoHashes = currentInfoHashes;
      });
    };








    function updateDht(myDhtId, infoHash) {
      var dhtObject = {};
      dhtObject._id = myDhtId;
      dhtObject.infohash = infoHash;
      DhtFactory.update({}, dhtObject, null, function (error) {
        console.log(error);
      });
    }

    var sendingInProgress = false;
    $scope.sendMessage = function () {
      // prevent sending 2 messages with the same previous infohash
      if (!sendingInProgress) {
        sendingInProgress = true;
        // TODO zapisać bufor lub JSONA w localstorage
        // TODO sender - sprawdzać przy odbiorze czy się zgadza z tym kto wystawił infohash na swoim dhtId
        var message = {
          text: $scope.textInput,
          timestamp: lodash.now(),
          sender: $scope.myDhtId,
          previousInfoHash: myCurrentInfoHash
        };
        var buf = new Buffer(JSON.stringify(message));
        buf.name = 'text'; // TODO jakiś użytek z tego? odróżnienie wiadomości od załączników z nazwami? komponowanie "folderu"
        client.seed(buf, function (torrent) {
          myCurrentInfoHash = torrent.infoHash;
          MessagesFactory.add(torrent.infoHash, message);
          updateDht($scope.myDhtId, torrent.infoHash);
          sendingInProgress = false;
        });
      }
    };






    client.on('error', function (err) {
      console.error('WEBTORRENT ERROR: ' + err.message);
    });

    var checkMessagesInterval = $interval(function() {
      $scope.checkMessages();
    }, 5000);

    $scope.$on('$destroy', function() {
      $interval.cancel(checkMessagesInterval);
      checkMessagesInterval = undefined;
    });

    initController(); // init variables and get all data from server
  });
