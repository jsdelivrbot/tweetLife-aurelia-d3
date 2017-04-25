/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var Axis = require('../Axis');
  var axisLabelInterval = require('./axisLabelInterval');
  var Axis2D = function(dim, scale, coordExtent, axisType, position) {
    Axis.call(this, dim, scale, coordExtent);
    this.type = axisType || 'value';
    this.position = position || 'bottom';
  };
  Axis2D.prototype = {
    constructor: Axis2D,
    index: 0,
    onZero: false,
    model: null,
    isHorizontal: function() {
      var position = this.position;
      return position === 'top' || position === 'bottom';
    },
    getGlobalExtent: function() {
      var ret = this.getExtent();
      ret[0] = this.toGlobalCoord(ret[0]);
      ret[1] = this.toGlobalCoord(ret[1]);
      return ret;
    },
    getLabelInterval: function() {
      var labelInterval = this._labelInterval;
      if (!labelInterval) {
        labelInterval = this._labelInterval = axisLabelInterval(this);
      }
      return labelInterval;
    },
    isLabelIgnored: function(idx) {
      if (this.type === 'category') {
        var labelInterval = this.getLabelInterval();
        return ((typeof labelInterval === 'function') && !labelInterval(idx, this.scale.getLabel(idx))) || idx % (labelInterval + 1);
      }
    },
    toLocalCoord: null,
    toGlobalCoord: null
  };
  zrUtil.inherits(Axis2D, Axis);
  return Axis2D;
});
