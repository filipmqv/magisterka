'use strict';

angular.module('webtorrentClientApp')
  .controller('MessengerCtrl', function ($scope, $interval, DhtFactory, UsersFactory, MessagesFactory, TorrentFactory, lodash) {

    var clearVariables = function () {
      $scope.my = MessagesFactory.my;
      $scope.con = MessagesFactory.control;
      $scope.otherControl = MessagesFactory.otherControl;
      $scope.ot = MessagesFactory.other;
      $scope.textInput = '';
      $scope.getConversation = MessagesFactory.getAll; // factory with messages
      $scope.getTorrents = TorrentFactory.getAllTorrents;
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

    var refreshConversationInterval = $interval(function() {
      // todo to jest hack, wymusza digest co sekundę...
      // TODO naprawić, żeby wiadomości z poprzedniego sprawdzenia wyswietlały się od razu jak są dostępne,
      // todo a nie kiedy skończy się kolejny cykl sprawdzenia
      // todo ale żeby nie wyswietlały się nowsze jeśli jeszcze nie ma poprzednich (FIFO)
    }, 1000);

    $scope.$on('$destroy', function() {
      $interval.cancel(checkMessagesInterval);
      checkMessagesInterval = undefined;
      $interval.cancel(refreshConversationInterval);
      refreshConversationInterval = undefined;
    });

    initController(); // init variables and get all data from server
  });
