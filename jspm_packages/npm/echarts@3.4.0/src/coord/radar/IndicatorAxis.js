/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var Axis = require('../Axis');
  function IndicatorAxis(dim, scale, radiusExtent) {
    Axis.call(this, dim, scale, radiusExtent);
    this.type = 'value';
    this.angle = 0;
    this.name = '';
    this.model;
  }
  zrUtil.inherits(IndicatorAxis, Axis);
  return IndicatorAxis;
});
