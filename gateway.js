var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var allAddresses = ['0.0.0.0:3001', '0.0.0.0:3002', '0.0.0.0:3003'];
var gateways = {};
var thisAddress;

var localSocket = 'local message';
var gatewaySocket = 'gateway message';

/* startup */
process.argv.forEach(function(val, index) {
  if(isPortArg(val)) {
    listenOnPort(parseInt(val));
  }
});

function listenOnPort(port) {
  http.listen(port, function(){
    discoverAddress();
    discoverGateways();
  });
}

function discoverAddress() {
  var address = http.address();
  thisAddress = address['address'] + ':' + address['port'];
  log('serving clients on [' + thisAddress + ']');
}

function discoverGateways() {
  allAddresses.forEach(function(address) {
    if(address != thisAddress) {
      gateways[address] = require("socket.io-client");
      gateways[address] = gateways[address].connect('http://' + address, { query: 'clientAddress=' + thisAddress });
      log('listening to gateway [' + address + ']');
    }
  });
}

/* serve html */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/* message handling - websocket I/O */
io.on('connection', function(socket){
  log('client [' + clientAddress(socket) + '] just connected');

  socket.on('disconnect', function(){
    log('client [' + clientAddress(socket) + '] just disconnected');
  });

  socket.on(localSocket, function(msg){
    incomingFromLocal(msg, socket);
  });

  socket.on(gatewaySocket, function(msg){
    incomingFromGateway(msg, socket);
  });
});

/* message handling - serial */
//todo

/* message handling - generic */
function incomingFromLocal(msg, socket) {
  log('client [' + clientAddress(socket) + '] just sent [' + msg + '], emitting to clients & gateways...');
  io.emit(localSocket, msg);
  pushToGateways(msg);
}

function incomingFromGateway(msg, socket) {
  log('gateway [' + clientAddress(socket) + '] just sent [' + msg + '], emitting to clients...');
  io.emit(localSocket, msg);
}

function pushToGateways(msg) {
  for(var address in gateways) {
    gateways[address].emit(gatewaySocket, msg);
  }
}

/* utilities */
function isPortArg(val) {
  return !isNaN(val);
}

function log(msg) {
  var now = new Date();
  console.log(now + ': ' + msg);
}

function clientAddress(socket) {
  return socket.handshake.query.clientAddress;
}