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

  socket.on(localSocket, function(input){
    incomingFromSocket(input, socket);
  });

  socket.on(gatewaySocket, function(input){
    incomingFromGateway(input, socket);
  });
});

/* message handling - serial I/O */
function openSerialPort(port){
  log('Opening serial port ' + port);
  serialPort = new SerialPort(port, {
    baudrate: 38400,
    parser: serialport.parsers.readline('\n')
  }, false);

  serialPort.open(function(error) {
    if ( error ) {
      exitWithMessage('Serial failed to open: ' + error);
    } else {
      serialPort.on('data', function(data) {
        incomingFromSerial(data);
      });
    }
  });
}

function incomingFromSerial(input) {
  if(isGatewayMessage(input)) {
    var msg = parseJsonToObject(input);
    log('Incoming from local mesh node ' + msg['sender'] + ', message \'' + msg['message'] + '\' for target ' + msg['receiver']);
    log('Emitting to local clients...');
    io.emit(localSocket, msg['sender'] + '-' + msg['message']);
    log('Pushing to other gateways...');
    pushToGateways(JSON.stringify(msg));
    log('Done.');
  }
}

function isGatewayMessage(input) {
  return input.indexOf('{ "gateway-message":') > 1;
}

function parseJsonToObject(input) {
  return JSON.parse(
    input.substring(
      input.indexOf('{ "gateway-message":'),
      input.indexOf('}}') + 2)
    )['gateway-message'];
}

/* message handling - generic */
function incomingFromSocket(input, socket) {
  var targetNodeId = parseTargetNodeId(input);
  var message = parseMessage(input);
  log('Incoming from socket client [' + clientAddress(socket) + ']: message \'' + message + '\' for target ' + targetNodeId);
  log('Emitting to other clients...');
  io.emit(localSocket, input);
  log('Pushing to other gateways...');
  pushToGateways(input);
  log('Done.');
}

function incomingFromGateway(input, socket) {
  log('Incoming from gateway [' + clientAddress(socket) + ']: message \'' + message + '\', emitting to clients...');
  log('Emitting to clients...');
  io.emit(localSocket, input);
  log('Done.');
}

function pushToGateways(input) {
  for(var address in gateways) {
    gateways[address].emit(gatewaySocket, input);
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

function parseTargetNodeId(input) {
  return input.substring(0, input.indexOf('-'));
}

function parseMessage(input) {
  return input.substring(input.indexOf('-')+1);
}

function exitWithMessage(str) {
  console.log(str);
  process.exit(0);
}