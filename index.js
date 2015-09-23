var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allAddresses = ['http://0.0.0.0:3001', 'http://0.0.0.0:3002'];
var gateways = {};
var thisAddress;

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
    pushToGateways(msg);
    console.log('chat message: ' + msg);
  });

  socket.on('gateway message', function(msg){
    io.emit('chat message', msg);
    console.log('gateway message: ' + msg);
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
    discoverGateways();
  });
}

function discoverAddress() {
  var address = http.address();
  thisAddress = 'http://' + address['address'] + ':' + address['port'];
  console.log('listening on ' + thisAddress);
}

function discoverGateways() {
  allAddresses.forEach(function(address) {
    if(address != thisAddress) {
      gateways[address] = require("socket.io-client");
      gateways[address] = gateways[address].connect(address);
      console.log('connected to gateway ' + address);
    }
  });
}

function pushToGateways(msg) {
  for(var address in gateways) {
    console.log('pushing to ' + address);
    gateways[address].emit('gateway message', msg);
  }
}