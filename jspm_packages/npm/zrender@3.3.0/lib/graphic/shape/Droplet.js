/* */ 
'use strict';
module.exports = require('../Path').extend({
  type: 'droplet',
  shape: {
    cx: 0,
    cy: 0,
    width: 0,
    height: 0
  },
  buildPath: function(ctx, shape) {
    var x = shape.cx;
    var y = shape.cy;
    var a = shape.width;
    var b = shape.height;
    ctx.moveTo(x, y + a);
    ctx.bezierCurveTo(x + a, y + a, x + a * 3 / 2, y - a / 3, x, y - b);
    ctx.bezierCurveTo(x - a * 3 / 2, y - a / 3, x - a, y + a, x, y + a);
    ctx.closePath();
  }
});
