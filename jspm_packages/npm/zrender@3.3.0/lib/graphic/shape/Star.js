/* */ 
var PI = Math.PI;
var cos = Math.cos;
var sin = Math.sin;
module.exports = require('../Path').extend({
  type: 'star',
  shape: {
    cx: 0,
    cy: 0,
    n: 3,
    r0: null,
    r: 0
  },
  buildPath: function(ctx, shape) {
    var n = shape.n;
    if (!n || n < 2) {
      return;
    }
    var x = shape.cx;
    var y = shape.cy;
    var r = shape.r;
    var r0 = shape.r0;
    if (r0 == null) {
      r0 = n > 4 ? r * cos(2 * PI / n) / cos(PI / n) : r / 3;
    }
    var dStep = PI / n;
    var deg = -PI / 2;
    var xStart = x + r * cos(deg);
    var yStart = y + r * sin(deg);
    deg += dStep;
    ctx.moveTo(xStart, yStart);
    for (var i = 0,
        end = n * 2 - 1,
        ri; i < end; i++) {
      ri = i % 2 === 0 ? r0 : r;
      ctx.lineTo(x + ri * cos(deg), y + ri * sin(deg));
      deg += dStep;
    }
    ctx.closePath();
  }
});
