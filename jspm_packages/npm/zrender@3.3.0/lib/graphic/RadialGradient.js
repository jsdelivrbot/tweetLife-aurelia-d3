/* */ 
'use strict';
var zrUtil = require('../core/util');
var Gradient = require('./Gradient');
var RadialGradient = function(x, y, r, colorStops, globalCoord) {
  this.x = x == null ? 0.5 : x;
  this.y = y == null ? 0.5 : y;
  this.r = r == null ? 0.5 : r;
  this.type = 'radial';
  this.global = globalCoord || false;
  Gradient.call(this, colorStops);
};
RadialGradient.prototype = {constructor: RadialGradient};
zrUtil.inherits(RadialGradient, Gradient);
module.exports = RadialGradient;
