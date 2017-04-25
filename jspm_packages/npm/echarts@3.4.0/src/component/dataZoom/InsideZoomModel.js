/* */ 
"format cjs";
define(function(require) {
  return require('./DataZoomModel').extend({
    type: 'dataZoom.inside',
    defaultOption: {
      disabled: false,
      zoomLock: false
    }
  });
});
