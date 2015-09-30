var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

var allAddresses = ['0.0.0.0:3001', '0.0.0.0:3002', '0.0.0.0:3003'];
var gateways = {};
var thisAddress;
var usageMessage = 'Usage: node gateway HTTP_PORT SERIAL_PORT\nTry \'node list\' to get serial port name';

var localSocket = 'local message';
var gatewaySocket = 'gateway message';

/* startup */
processArgs();

function processArgs(){
  if(process.argv.length == 3) {
    openHttpPort(process.argv[2]);
    discoverSerialPort();
  } else if(process.argv.length == 4) {
    openHttpPort(process.argv[2]);
    openSerialPort(process.argv[3]);
  } else {
    exitWithMessage(usageMessage);
  }
}

/* startup - http */
function openHttpPort(port) {
  if(isValidPort(port)) {
    log('Opening http port ' + port);
    http.listen(port, function(){
      discoverAddress();
      discoverGateways();
    });
  } else {
    exitWithMessage(usageMessage);
  }
}

function discoverAddress() {
  var address = http.address();
  thisAddress = address['address'] + ':' + address['port'];
  log('Serving clients on [' + thisAddress + ']');
}

function discoverGateways() {
  allAddresses.forEach(function(address) {
    if(address != thisAddress) {
      gateways[address] = require("socket.io-client");
      gateways[address] = gateways[address].connect('http://' + address, { query: 'clientAddress=' + thisAddress });
      log('Listening to gateway [' + address + ']');
    }
  });
}

/* startup - serial */
function discoverSerialPort() {
  var found = 0;
  var name, port;
  serialport.list(function (err, ports) {
    for(var i = 0; i < ports.length; i++) {
      port = ports[i];
      if(port.manufacturer == 'SEGGER') {
        found++;
        name = port.comName;
      }
    }

    if(found == 1) {
      openSerialPort(name);
    } else {
      exitWithMessage(usageMessage);
    }
  });
}

function openSerialPort(port){
  log('Opening serial port ' + port);
}

/* serve html */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/* message handling - websocket I/O */
io.on('connection', function(socket){
  log('Client [' + clientAddress(socket) + '] just connected');

  socket.on('disconnect', function(){
    log('Client [' + clientAddress(socket) + '] just disconnected');
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
  log('Client [' + clientAddress(socket) + '] just sent [' + msg + '], emitting to clients & gateways...');
  io.emit(localSocket, msg);
  pushToGateways(msg);
}

function incomingFromGateway(msg, socket) {
  log('Gateway [' + clientAddress(socket) + '] just sent [' + msg + '], emitting to clients...');
  io.emit(localSocket, msg);
}

function pushToGateways(msg) {
  for(var address in gateways) {
    gateways[address].emit(gatewaySocket, msg);
  }
}

/* utilities */
function isValidPort(val) {
  return !isNaN(val);
}

function log(msg) {
  var now = new Date();
  console.log(now + ': ' + msg);
}

function clientAddress(socket) {
  return socket.handshake.query.clientAddress;
}

function exitWithMessage(str) {
  console.log(str);
  process.exit(0);
}