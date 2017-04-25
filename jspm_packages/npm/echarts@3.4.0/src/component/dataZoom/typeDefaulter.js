/* */ 
"format cjs";
define(function(require) {
  require('../../model/Component').registerSubTypeDefaulter('dataZoom', function(option) {
    return 'slider';
  });
});
