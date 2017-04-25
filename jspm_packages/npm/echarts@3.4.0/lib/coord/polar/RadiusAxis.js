/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var Axis = require('../Axis');
function RadiusAxis(scale, radiusExtent) {
  Axis.call(this, 'radius', scale, radiusExtent);
  this.type = 'category';
}
RadiusAxis.prototype = {
  constructor: RadiusAxis,
  dataToRadius: Axis.prototype.dataToCoord,
  radiusToData: Axis.prototype.coordToData
};
zrUtil.inherits(RadiusAxis, Axis);
module.exports = RadiusAxis;
