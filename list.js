var SerialPort = require("serialport").SerialPort
var serialPort = require("serialport");
var index = 1;
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
  	console.log(index + '. Port name: ' + port.comName);
    console.log('   PNP ID: ' + port.pnpId);
    console.log('   Manufacturer: ' + port.manufacturer);
    if(ports.length > index) {
    	console.log('');
    }
    index++;
  });
});