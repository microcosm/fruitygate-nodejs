var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

process.argv.forEach(function(val, index) {
  if(index == 2) {
    openSerialPort(val);
  }
});

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