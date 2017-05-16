(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

angular.module('webtorrentClientApp')
  .controller('MessengerCtrl', function ($scope, $interval, DhtFactory, UsersFactory, ConversationsFactory,
                                         MessagesFactory, TorrentFactory, lodash, UserService) {

    var clearVariables = function () {
      $scope.my = MessagesFactory.my;
      $scope.con = MessagesFactory.control;
      $scope.otherControl = MessagesFactory.otherControl;
      $scope.ot = MessagesFactory.other;

      $scope.textInput = '';
      $scope.dhtIdsInConversations = {};
      $scope.getConversation = MessagesFactory.getAll; // factory with messages
      $scope.getTorrents = TorrentFactory.getAllTorrents;
      $scope.conversations = [];
      $scope.currentConversationId = 0;
      $scope.friendsInConversations = {};
      $scope.myDhtId = $scope.currentUser.dhtId; // TODO per conversation; to tylko dla danej konwersacji; pobierane z serwera razem z moim profilem
    };

    var getUsersForConversation = function (conversation) {
      ConversationsFactory.get({where: {conversation_id: conversation.conversation_id}}, function (data) {
        var convId = conversation.conversation_id;
        $scope.friendsInConversations[convId] = lodash.map(data._items, 'user_id')
        $scope.dhtIdsInConversations[convId] = lodash.map(data._items, 'user_dht_id')
      })
    };

    var getConversations = function () {
      ConversationsFactory.get({where: {user_id: UserService.getCurrentUser().id}}, function (data) {
        $scope.conversations = data._items;
        $scope.currentConversationId = $scope.conversations[0].conversation_id;
        // get other users involved in each conversation
        lodash.forEach($scope.conversations, function (item) {
          getUsersForConversation(item);
        })
      });
    };

    // var getUsers = function () {
    //   UsersFactory.get({}, function (data) {
    //     $scope.friends = data._items;
    //   });
    // };

    var initController = function () {
      clearVariables();
      getConversations();
      TorrentFactory.init($scope.currentUser.dhtId);
    };

    $scope.checkMessages = function () {
      TorrentFactory.checkMessages($scope.dhtIdsInConversations);
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

},{}]},{},[1]);
