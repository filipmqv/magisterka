'use strict';

/**
 * @ngdoc function
 * @name webtorrentClientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the webtorrentClientApp
 */
angular.module('webtorrentClientApp')
  .controller('MainCtrl', function ($scope, DhtService, UsersService) {

    var WebTorrent = require('webtorrent');
    var _ = require('lodash');

    var client = new WebTorrent();
    // TODO na starcie apki pobierz mój ostatni infohash i do niego od razu linkuj kolejną wiadomość
    var myCurrentInfoHash = '';

    // prevent warnings about possible memory leak when >11 listeners added
    const EventEmitter = require('events').EventEmitter;
    EventEmitter.defaultMaxListeners = 1000;

    var clearVariables = function () {
      $scope.lastInfoHashes = [];
      $scope.textInput = '';
      $scope.conversation = [];
      $scope.friends = [];
      $scope.myDhtId = '58d1b3640054800ca5e5764a'; // TODO to tylko dla danej konwersacji; pobierane z serwera razem z moim profilem
    };

    // var getLastInfoHashes = function () {
    //   DhtService.get({}, function (data) {
    //     $scope.lastInfoHashes = data._items;
    //   });
    // };

    var getUsers = function () {
      UsersService.get({}, function (data) {
        $scope.friends = data._items;
      });
    };

    $scope.initController = function () {
      clearVariables();
      //getLastInfoHashes();
      getUsers();
    };




    function isInfoHashInConversation(conversation, infohash) {
      var found = _.find(conversation, _.matchesProperty('infoHash', infohash));
      return (typeof found !== 'undefined');

    }

    var addTorrentByInfoHash = function (infohash) {
      var magnetLink = 'magnet:?xt=urn:btih:'+ infohash +'&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
      var existingTorrent = client.get(magnetLink)
      if (!existingTorrent) {
        client.add(magnetLink, onTorrent);
      } else {
        console.log(infohash + '   exists')
      }
    };

    function onTorrent (torrent) {
      torrent.on('done', function () {
        torrent.files.forEach(function(file){
          file.getBuffer(function (err, buffer) {
            var message = JSON.parse(buffer.toString('utf8'));
            // todo nie wyswietlać dopóki nie mamy wszystkich poprzednich wiadomości
            // todo oddzielić wyświetlane wiadomosci od tych w pamięci (ogółem seedowanych - nie wszystkie muszą być na widoku)
            $scope.conversation.push({infoHash: torrent.infoHash, message: message});
            // todo zapisać w localforage
            $scope.$apply();
            // TODO sprawdzić pole poprzedniego infohasha i czy juz to mamy
            if (message.previousInfoHash && !isInfoHashInConversation($scope.conversation, message.previousInfoHash)) {
              console.log('adding previous ' + message.previousInfoHash)
              addTorrentByInfoHash(message.previousInfoHash);
            }
          })
        })
      })
    }

    $scope.checkMessages = function () {
      // TODO zamiast wszystkich pobrać tylko z tych ID które należą do naszych znajomych w tej konwersacji
      // TODO docelowo sprawdzić wszystkie konwersacje
      DhtService.get({}, function (data) {
        var currentInfoHashes = data._items;
        // for all friends check if there's new infohash
        _.forEach(currentInfoHashes, function (current) {
          var last = _.find($scope.lastInfoHashes, {'_id': current._id})
          if (!last || (last.infohash !== current.infohash && !isInfoHashInConversation($scope.conversation, current.infohash))) {
            addTorrentByInfoHash(current.infohash);
          }
        });
        $scope.lastInfoHashes = currentInfoHashes;
      });
    };






    var sendingInProgress = false;
    var count = 0;
    $scope.sendMessage = function () {
      // prevent sending 2 messages with the same previous infohash
      if (!sendingInProgress) {
        sendingInProgress = true;
        // TODO zapisać bufor lub JSONA w localstorage
        // TODO sender - sprawdzać przy odbiorze czy się zgadza z tym kto wystawił infohash na swoim dhtId
        var message = {
          text: $scope.textInput,
          timestamp: _.now(),
          sender: $scope.myDhtId,
          previousInfoHash: myCurrentInfoHash
        };
        var buf = new Buffer(JSON.stringify(message));
        buf.name = 'text'; // TODO jakiś użytek z tego? odróżnienie wiadomości od załączników z nazwami? komponowanie "folderu"
        client.seed(buf, function (torrent) {
          myCurrentInfoHash = torrent.infoHash;
          $scope.conversation.push({infoHash: myCurrentInfoHash, message: message});
          // add new infohash to dht
          var dhtObject = {};
          dhtObject._id = $scope.myDhtId;
          dhtObject.infohash = torrent.infoHash;
          DhtService.update({}, dhtObject, function (data) {
          }, function (error) {
            console.log(error);
          });
          sendingInProgress = false;
        });
      } else {
        console.log('rejected');
      }
    };






    client.on('error', function (err) {
      console.error('WEBTORRENT ERROR: ' + err.message);
    });

    setInterval(function() {
      $scope.checkMessages();
    }, 5000)

    $scope.initController(); // init variables and get all data from server
  });
