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
    var currentInfohash = '';

    var clearVariables = function () {
      $scope.lastInfoHashes = [];
      $scope.message = {};
      $scope.conversation = [];
      $scope.friends = [];
      $scope.myDhtId = '58d1b3640054800ca5e5764a'; // TODO
    };

    $scope.initController = function () {
      clearVariables();
      getLastInfoHashes();
      getUsers();
    };



    var getLastInfoHashes = function () {
      DhtService.get({}, function (data) {
        $scope.lastInfoHashes = data._items;
      });
    };

    var getUsers = function () {
      UsersService.get({}, function (data) {
        $scope.friends = data._items;
      });
    };

    var addTorrentByInfoHash = function (infohash) {
      var magnetLink = 'magnet:?xt=urn:btih:'+ infohash +'&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com';
      client.add(magnetLink, onTorrent);
    };

    function onTorrent (torrent) {
      console.log('dodano do pobierania ' + torrent.infoHash)
      torrent.on('done', function () {
        torrent.files.forEach(function(file){
          file.getBuffer(function (err, buffer) {
            var bufferString = buffer.toString('utf8');
            $scope.conversation.push({messageText: bufferString})
            // todo pushować też poprzedni infohash, nadawcę, datę2
            $scope.$apply();
            // TODO sprawdzić pole poprzedniego infohasha i czy juz to mamy
          })
        })
      })
    }

    setInterval(function() {
      //console.log(client.torrents)
      /*for (var f in $scope.friends) {
        var id = _.find($scope.lastInfoHashes, {'_id': f.dht_id})
        addTorrentByInfoHash(id.infohash);
      }*/
      // TODO for each friend check DHT
      // TODO compare with previous
      // TODO if new then add infohash to download
    }, 5000);


    $scope.checkmessages = function () {
      // TODO zamiast wszystkich pobrać tylko z tych ID które należą do naszych znajomych w tej konwersacji
      DhtService.get({}, function (data) {
        var currentInfoHashes = data._items;
        _.forEach($scope.lastInfoHashes, function (x) {
          var currentInfohash = _.find(currentInfoHashes, {'_id': x._id}).infohash
          if (currentInfohash && x.infohash !== currentInfohash) {
            addTorrentByInfoHash(currentInfohash);
          }
        })
        $scope.lastInfoHashes = currentInfoHashes;
      });
      /*for (var x in $scope.lastInfoHashes) {
        console.log(x)
        addTorrentByInfoHash(x.infohash);
      }*/
      /*for (var f in $scope.friends) {
        console.log(f)
        var id = _.find($scope.lastInfoHashes, {'_id': f.dht_id})
        addTorrentByInfoHash(id.infohash);
        console.log(id)
      }*/
    };




    $scope.sendMessage = function () {
      // TODO zrobić z tego JSON do bufora, dodać nadawcę, datę, poprzedni infohash
      // TODO zapisać bufor lub JSONA w localstorage
      var buf = new Buffer($scope.message.text);
      buf.name = 'Some file name';
      client.seed(buf, function (torrent) {
        var p = {};
        p._id = $scope.myDhtId;
        p.infohash = torrent.infoHash;
        DhtService.update({}, p, function (data) {
          console.log(data)
        }, function (error) {
          console.log(error);
        });
      });
    };






    client.on('error', function (err) {
      console.error('WEBTORRENT ERROR: ' + err.message);
    });

    $scope.initController(); // init variables and get all data from server
  });
