var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var sockets = [];

io.on('connection', function (socket) {
  sockets.push(socket);
  console.log('connection, users: ' + sockets.length)

  socket.on('request_set_NUMBER_OF_MESSAGES_FOR_LEVEL', function(data) {
    console.log('request_set_NUMBER_OF_MESSAGES_FOR_LEVEL: ' + data.number)
    for (var i = sockets.length - 1; i >= 0; i--) {
      sockets[i].emit('set_NUMBER_OF_MESSAGES_FOR_LEVEL', {
        number: data.number
      })
    }
  })

  socket.on('request_clear', function() {
    console.log('request_clear')
    for (var i = sockets.length - 1; i >= 0; i--) {
      sockets[i].emit('clear')
    }
  })

  socket.on('disconnect', function () {
    var i = sockets.indexOf(socket);
    if(i != -1) {
      console.log('removing')
      sockets.splice(i, 1);
    }
  });
});