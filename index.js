var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allAddresses = ['0.0.0.0:3001', '0.0.0.0:3002', '0.0.0.0:3003'];
var gateways = {};
var thisAddress;

var chatSocket = 'chat message';
var gatewaySocket = 'gateway message';
var clientIntroduction = 'hello from ';
var gatewayIntroduction = 'hello from http://';

/* chat interface */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/* route chat messages */
io.on('connection', function(socket){
  console.log('[' + socket.handshake.query.clientAddress + '] just connected');

  socket.on('disconnect', function(){
    console.log('[' + socket.handshake.query.clientAddress + '] just disconnected');
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
  console.log(gatewaySocket + ' received: ' + msg);
  io.emit(chatSocket, msg);
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
  thisAddress = address['address'] + ':' + address['port'];
  console.log('serving clients on [' + thisAddress + ']');
}

function discoverGateways() {
  allAddresses.forEach(function(address) {
    if(address != thisAddress) {
      gateways[address] = require("socket.io-client");
      gateways[address] = gateways[address].connect('http://' + address, { query: 'clientAddress=' + thisAddress });
      console.log('listening to gateway [' + address + ']');
    }
  });
}

function pushToGateways(msg) {
  for(var address in gateways) {
    gateways[address].emit('gateway message', msg);
  }
}