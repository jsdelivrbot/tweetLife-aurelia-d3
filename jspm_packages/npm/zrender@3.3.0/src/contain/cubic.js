/* */ 
"format cjs";
define(function(require) {
  var curve = require('../core/curve');
  return {containStroke: function(x0, y0, x1, y1, x2, y2, x3, y3, lineWidth, x, y) {
      if (lineWidth === 0) {
        return false;
      }
      var _l = lineWidth;
      if ((y > y0 + _l && y > y1 + _l && y > y2 + _l && y > y3 + _l) || (y < y0 - _l && y < y1 - _l && y < y2 - _l && y < y3 - _l) || (x > x0 + _l && x > x1 + _l && x > x2 + _l && x > x3 + _l) || (x < x0 - _l && x < x1 - _l && x < x2 - _l && x < x3 - _l)) {
        return false;
      }
      var d = curve.cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, null);
      return d <= _l / 2;
    }};
});
