/* */ 
(function(process) {
  var zrUtil = require('zrender/lib/core/util');
  var Axis = require('../Axis');
  var axisHelper = require('../axisHelper');
  var SingleAxis = function(dim, scale, coordExtent, axisType, position) {
    Axis.call(this, dim, scale, coordExtent);
    this.type = axisType || 'value';
    this.position = position || 'bottom';
    this.orient = null;
    this._labelInterval = null;
  };
  SingleAxis.prototype = {
    constructor: SingleAxis,
    model: null,
    isHorizontal: function() {
      var position = this.position;
      return position === 'top' || position === 'bottom';
    },
    getLabelInterval: function() {
      var labelInterval = this._labelInterval;
      if (!labelInterval) {
        var axisModel = this.model;
        var labelModel = axisModel.getModel('axisLabel');
        var interval = labelModel.get('interval');
        if (!(this.type === 'category' && interval === 'auto')) {
          labelInterval = this._labelInterval = interval === 'auto' ? 0 : interval;
          return labelInterval;
        }
        labelInterval = this._labelInterval = axisHelper.getAxisLabelInterval(zrUtil.map(this.scale.getTicks(), this.dataToCoord, this), axisModel.getFormattedLabels(), labelModel.getModel('textStyle').getFont(), this.isHorizontal());
      }
      return labelInterval;
    },
    toGlobalCoord: null,
    toLocalCoord: null
  };
  zrUtil.inherits(SingleAxis, Axis);
  module.exports = SingleAxis;
})(require('process'));
