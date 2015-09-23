var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioclient = require("socket.io-client");
var address;
var gateways = ['http://0.0.0.0:3001', 'http://0.0.0.0:3002'];

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
process.argv.forEach(function(val, index) {
  if(isPortArg(val)) {
    listenOnPort(parseInt(val));
  }
});

function isPortArg(val) {
  return !isNaN(val);
}

function listenOnPort(port) {
  http.listen(port, function(){
    discoverAddress();
    connectGateways();
  });
}

function discoverAddress() {
  address = http.address();
  address = 'http://' + address['address'] + ':' + address['port'];
  console.log('listening for activity on ' + address);
}

function connectGateways() {
  gateways.forEach(function(val, index) {
    if(val != address) {
      console.log('will push to gateway ' + val);
    }
  });
}