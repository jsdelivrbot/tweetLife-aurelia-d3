/* */ 
var zrUtil = require('zrender/lib/core/util');
var Axis = require('../Axis');
function IndicatorAxis(dim, scale, radiusExtent) {
  Axis.call(this, dim, scale, radiusExtent);
  this.type = 'value';
  this.angle = 0;
  this.name = '';
  this.model;
}
zrUtil.inherits(IndicatorAxis, Axis);
module.exports = IndicatorAxis;
