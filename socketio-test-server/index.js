var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var sockets = [];

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function chooseReplyers(socksLength, replyers) {
  var result = Array(socksLength)
  for (var i = 0; i < socksLength; i++) {
    result[i] = i < replyers ? true : false;
  }
  shuffle(result)
  return result;
}



io.on('connection', function (socket) {
  sockets.push(socket);
  console.log('connection, users: ' + sockets.length)

  socket.on('request_set_NUMBER_OF_MESSAGES_FOR_LEVEL', function(data) {
    console.log('request_set_NUMBER_OF_MESSAGES_FOR_LEVEL: ' + data.number)
    socket.broadcast.emit('set_NUMBER_OF_MESSAGES_FOR_LEVEL', {
      number: data.number
    })
  })

  socket.on('request_clear', function() {
    console.log('request_clear')
    socket.broadcast.emit('clear')
  })

  socket.on('request_set_REPLYER', function(data) {
    console.log('request_set_REPLYER: ' + data.replyers);
    var replyers = data.replyers;
    var tempSockets = sockets.slice(); // copy of array
    tempSockets.splice(tempSockets.indexOf(socket), 1); // remove the sender

    var socketsReplyers = chooseReplyers(tempSockets.length, replyers);
    for (var i = tempSockets.length - 1; i >= 0; i--) {
      tempSockets[i].emit('set_REPLYER', {replyer: socketsReplyers[i]})
    }
  })

  socket.on('request_options', function(data) {
    var tempSockets = sockets.slice(); // copy of array
    tempSockets.splice(tempSockets.indexOf(socket), 1); // remove the sender
    var socketsReplyers = [];
    if (data.replyers) {
      var replyers = data.replyers;
      socketsReplyers = chooseReplyers(tempSockets.length, replyers);
    }

    for (var i = tempSockets.length - 1; i >= 0; i--) {
      tempSockets[i].emit('options', {
        replyer: socketsReplyers[i],
        number: data.number
      })
    }
  })

  socket.on('disconnect', function () {
    var i = sockets.indexOf(socket);
    if(i != -1) {
      console.log('removing');
      sockets.splice(i, 1);
    }
  });
});