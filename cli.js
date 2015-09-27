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
      console.log('Serial failed to open: ' + error);
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
        console.log('Have a great day!');
        process.exit(0);
      });
    }
  });
}

function processArgs(){
  if(process.argv.length <= 2) {
    console.log('Usage: node cli SERIAL_PORT_NAME');
    console.log('Try \'node list\' to get serial port name list');
    process.exit(0);
  } else {
    process.argv.forEach(function(val, index) {
      if(index == 2) {
        openSerialPort(val);
      }
    }); 
  }
}