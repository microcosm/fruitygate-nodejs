var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allAddresses = ['http://0.0.0.0:3001', 'http://0.0.0.0:3002', 'http://0.0.0.0:3003'];
var gateways = {};
var thisAddress;

var chatSocket = 'chat message';
var gatewaySocket = 'gateway message';
var handshakeIdentifier = 'hello from http://';

/* chat interface */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/* route chat messages */
io.on('connection', function(socket){
  console.log('a client connected');

  socket.on('disconnect', function(){
    console.log('a client disconnected');
  });

  socket.on(chatSocket, function(msg){
    handleChatMessage(msg);
  });

  socket.on(gatewaySocket, function(msg){
    handleGatewayMessage(msg);
  });
});

function handleChatMessage(msg) {
  console.log(chatSocket + ' received: ' + msg);
  io.emit(chatSocket, msg);
  pushToGateways(msg);
}

function handleGatewayMessage(msg) {
  if(msg.indexOf(handshakeIdentifier) > -1) {
    console.log('handshake from ' + msg.replace(handshakeIdentifier, ''));
  } else {
    console.log(gatewaySocket + ' received: ' + msg);
    io.emit(chatSocket, msg);
  }
}

/* listen */
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

/* broadcast */
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
  pushToGateways('hello from ' + thisAddress);
}

function pushToGateways(msg) {
  for(var address in gateways) {
    gateways[address].emit('gateway message', msg);
  }
}