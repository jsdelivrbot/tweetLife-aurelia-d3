/* */ 
(function(process) {
  var fileSystem = require('fs');
  var readLine = require('readline');
  var path = require('path');
  var MAP_FILE_NAME = 'MaterialIcons-Regular.ijmap';
  var readLineHandle = readLine.createInterface({
    input: fileSystem.createReadStream('codepoints'),
    output: process.stdout,
    terminal: false
  });
  var json = {icons: {}};
  readLineHandle.on('line', function(line) {
    var nameCodepointPair = line.split(' ');
    var codepoint = nameCodepointPair[1];
    var name = nameCodepointPair[0].toLowerCase().trim().replace(/[^0-9a-z]+/gi, ' ').replace(/\b[a-z]/g, function(char) {
      return char.toUpperCase();
    });
    json.icons[codepoint] = {name: name};
  });
  readLineHandle.on('close', function() {
    fileSystem.writeFileSync(MAP_FILE_NAME, JSON.stringify(json));
  });
})(require('process'));
