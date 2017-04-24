'use strict';

angular.module('webtorrentClientApp')
  .controller('MessengerCtrl', function ($scope, $interval, DhtFactory, UsersFactory, MessagesFactory, TorrentFactory, lodash) {

    var clearVariables = function () {
      $scope.textInput = '';
      $scope.getConversation = MessagesFactory.getAll; // factory with messages
      $scope.friends = []; // TODO pobrać z service'u o userze lub w ogóle w nim trzymać tylko
      $scope.myDhtId = $scope.currentUser.dhtId; // TODO per conversation; to tylko dla danej konwersacji; pobierane z serwera razem z moim profilem
    };

    var getUsers = function () {
      UsersFactory.get({}, function (data) {
        $scope.friends = data._items;
      });
    };

    var initController = function () {
      clearVariables();
      getUsers();
      TorrentFactory.init($scope.currentUser.dhtId);
    };

    $scope.checkMessages = function () {
      console.log(lodash.now() + ' check start');
      TorrentFactory.checkMessages();
    };

    $scope.sendMessage = function () {
      TorrentFactory.sendMessage($scope.textInput);
    };

    $scope.truncate = function (word) {
      return lodash.truncate(word, {'length': 8});
    };



    var checkMessagesInterval = $interval(function() {
      $scope.checkMessages();
    }, 5000);

    $scope.$on('$destroy', function() {
      $interval.cancel(checkMessagesInterval);
      checkMessagesInterval = undefined;
    });

    initController(); // init variables and get all data from server
  });
