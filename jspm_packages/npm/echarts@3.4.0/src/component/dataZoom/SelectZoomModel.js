/* */ 
"format cjs";
define(function(require) {
  var DataZoomModel = require('./DataZoomModel');
  return DataZoomModel.extend({type: 'dataZoom.select'});
});
