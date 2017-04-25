/* */ 
"format cjs";
define(function(require) {
  require('../../model/Component').registerSubTypeDefaulter('timeline', function() {
    return 'slider';
  });
});
