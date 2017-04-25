/* */ 
"format cjs";
define(function(require) {
  var roundRectHelper = require('../helper/roundRect');
  return require('../Path').extend({
    type: 'rect',
    shape: {
      r: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0
    },
    buildPath: function(ctx, shape) {
      var x = shape.x;
      var y = shape.y;
      var width = shape.width;
      var height = shape.height;
      if (!shape.r) {
        ctx.rect(x, y, width, height);
      } else {
        roundRectHelper.buildPath(ctx, shape);
      }
      ctx.closePath();
      return;
    }
  });
});
