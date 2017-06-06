'use strict';

angular.module('webtorrentClientApp')
  .controller('MessengerCtrl', function ($scope, $interval, $window, DhtFactory, UsersFactory, ConversationsFactory,
                                         MessagesFactory, TorrentFactory, lodash, UserService) {

    const CHECK_MESSAGES_INTERVAL_TIME = 2000;

    var clearVariables = function () {
      $scope.my = MessagesFactory.my;
      $scope.con = MessagesFactory.control;
      $scope.otherControl = MessagesFactory.otherControl;
      $scope.ot = MessagesFactory.other;

      $scope.conversationIdInput = '';
      $scope.textInput = '';
      $scope.dhtIdsInConversations = {};
      $scope.getConversation = MessagesFactory.getAll; // factory with messages
      $scope.getTorrents = TorrentFactory.getAllTorrents;
      $scope.getLastInfoHashes = TorrentFactory.getLastInfoHashes;
      $scope.myConversations = [];
      $scope.currentConversationId = 0;
      $scope.friendsInConversations = {};
      $scope.myDhtId = '';
    };

    var getUsersForConversation = function (conversationId) {
      ConversationsFactory.get({where: {conversation_id: conversationId}}, function (data) {
        var convId = conversationId;
        $scope.friendsInConversations[convId] = lodash.map(data._items, function (item) {
          return {user_dht_id: item.user_dht_id, username: item.user_id.username};
        });
        $scope.dhtIdsInConversations[convId] = lodash.map(data._items, 'user_dht_id');
      });
    };

    var getConversations = function () {
      ConversationsFactory.get({where: {user_id: UserService.getCurrentUser().id}}, function (data) {
        if (data._items.length > 0) {
          $scope.myConversations = data._items;
          $scope.currentConversationId = $scope.myConversations[0].conversation_id;
          $scope.myDhtId = $scope.myConversations[0].user_dht_id;

          // get other users involved in each conversation
          lodash.forEach($scope.myConversations, function (item) {
            getUsersForConversation(item.conversation_id);
          });

          // in the end init torrent factory
          TorrentFactory.init($scope.myDhtId);
        }
      });
    };

    var initController = function () {
      clearVariables();
      getConversations();
    };

    $scope.checkMessages = function () {
      TorrentFactory.checkMessages($scope.dhtIdsInConversations);
    };

    $scope.sendMessage = function () {
      TorrentFactory.sendMessage($scope.textInput);
      $scope.textInput = '';
    };

    function createOrJoinConversation(convId) {
      // first obtain dhtId to store infohashes of messages in this conversation
      DhtFactory.save({}, {infohash: 'new'}).$promise.then(function (data) {
        var conversationObject = {
          'conversation_id': convId,
          'user_id': UserService.getCurrentUser().id,
          'user_dht_id': data._id // todo hash from <user, convId> or follow bep44
        };
        ConversationsFactory.save({}, conversationObject, function () {
          initController();
        });
      });
    }


    $scope.joinConversation = function () {
      if ($scope.conversationIdInput && $scope.conversationIdInput !== '') {
        createOrJoinConversation($scope.conversationIdInput);
      }
    };

    $scope.createNewConversation = function () {
      // server accepts dummy name of conversation to create new one with random UUID
      createOrJoinConversation('dummy');
    };

    $scope.clearStorageAndRefresh = function () {
      //localStorage.clear(); // stay logged in but clear messages
      MessagesFactory.clearAll().then(function () {
        $window.location.reload();
      });
    };

    $scope.truncate = function (word, length) {
      length = length || 9;
      return lodash.truncate(word, {'length': length});
    };

    var checkMessagesInterval = $interval(function() {
      $scope.checkMessages();
    }, CHECK_MESSAGES_INTERVAL_TIME);

    var checkUsersInConversation = $interval(function () {
      getUsersForConversation($scope.currentConversationId);
    }, 60000);

    var refreshConversationInterval = $interval(function() {
      // todo to jest hack, wymusza digest co sekundę...
      // TODO naprawić, żeby wiadomości z poprzedniego sprawdzenia wyswietlały się od razu jak są dostępne,
      // todo a nie kiedy skończy się kolejny cykl sprawdzenia
      // todo ale żeby nie wyswietlały się nowsze jeśli jeszcze nie ma poprzednich (FIFO)
    }, 1000);

    $scope.$on('$destroy', function() {
      $interval.cancel(checkUsersInConversation);
      checkUsersInConversation = undefined;
      $interval.cancel(checkMessagesInterval);
      checkMessagesInterval = undefined;
      $interval.cancel(refreshConversationInterval);
      refreshConversationInterval = undefined;
    });

    $scope.copySuccess = function () {
      console.log('Copied!');
    };

    $scope.copyFail = function (err) {
      console.error('Error!', err);
    };

    initController(); // init variables and get all data from server
  });
