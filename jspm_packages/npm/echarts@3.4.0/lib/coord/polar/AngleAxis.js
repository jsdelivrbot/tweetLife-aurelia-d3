/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var Axis = require('../Axis');
function AngleAxis(scale, angleExtent) {
  angleExtent = angleExtent || [0, 360];
  Axis.call(this, 'angle', scale, angleExtent);
  this.type = 'category';
}
AngleAxis.prototype = {
  constructor: AngleAxis,
  dataToAngle: Axis.prototype.dataToCoord,
  angleToData: Axis.prototype.coordToData
};
zrUtil.inherits(AngleAxis, Axis);
module.exports = AngleAxis;
