/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var zrUtil = require('../core/util');
  var Gradient = require('./Gradient');
  var LinearGradient = function(x, y, x2, y2, colorStops, globalCoord) {
    this.x = x == null ? 0 : x;
    this.y = y == null ? 0 : y;
    this.x2 = x2 == null ? 1 : x2;
    this.y2 = y2 == null ? 0 : y2;
    this.type = 'linear';
    this.global = globalCoord || false;
    Gradient.call(this, colorStops);
  };
  LinearGradient.prototype = {constructor: LinearGradient};
  zrUtil.inherits(LinearGradient, Gradient);
  return LinearGradient;
});
