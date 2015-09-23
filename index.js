var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/* render chat interface */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/* route chat messages */
io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('chat user disconnected');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('chat message: ' + msg);
  });
});

/* listen on port from arg */
process.argv.forEach(function(val, index, array) {
  if(isPortArg(val)) {
    listenOnPort(parseInt(val));
  }
});

function isPortArg(val) {
  return !isNaN(val);
}

function listenOnPort(port) {
  http.listen(port, function(){
    console.log('listening on *:' + port);
  });
}