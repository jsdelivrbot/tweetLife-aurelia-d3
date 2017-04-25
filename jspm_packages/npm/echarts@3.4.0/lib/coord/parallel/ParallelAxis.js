/* */ 
var zrUtil = require('zrender/lib/core/util');
var Axis = require('../Axis');
var ParallelAxis = function(dim, scale, coordExtent, axisType, axisIndex) {
  Axis.call(this, dim, scale, coordExtent);
  this.type = axisType || 'value';
  this.axisIndex = axisIndex;
};
ParallelAxis.prototype = {
  constructor: ParallelAxis,
  model: null
};
zrUtil.inherits(ParallelAxis, Axis);
module.exports = ParallelAxis;
