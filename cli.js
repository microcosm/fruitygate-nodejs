var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

processArgs();

function openSerialPort(portName){
  var serialPort = new SerialPort(portName, {
    baudrate: 38400,
    parser: serialport.parsers.readline('\n')
  }, false);

  serialPort.open(function(error) {
    if ( error ) {
      exitWithMessage('Serial failed to open: ' + error);
    } else {
      console.log('Serial open');
      rl.setPrompt('');
      rl.prompt();

      serialPort.on('data', function(data) {
        console.log(data);
      });

      rl.on('line', function(line) {
        console.log('writing \'' + line + '\' to serial port...');
        serialPort.write(line + '\r', function(err, results) {
          rl.prompt();
        });
      }).on('close', function() {
        exitWithMessage('Have a great day!');
      });
    }
  });
}

function processArgs(){
  if(process.argv.length <= 2) {
    processWithoutArgs();
  } else {
    process.argv.forEach(function(val, index) {
      if(index == 2) {
        openSerialPort(val);
      }
    }); 
  }
}

function processWithoutArgs() {
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
      console.log('Opening ' + name);
      openSerialPort(name);
    } else {
      exitWithMessage('Usage: node cli SERIAL_PORT_NAME\nTry \'node list\' to get serial port name list');
    }
  });
}

function exitWithMessage(str) {
  console.log(str);
  process.exit(0);
}