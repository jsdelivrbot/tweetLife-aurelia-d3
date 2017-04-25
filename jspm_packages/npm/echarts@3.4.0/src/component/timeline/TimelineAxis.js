/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var Axis = require('../../coord/Axis');
  var axisHelper = require('../../coord/axisHelper');
  var TimelineAxis = function(dim, scale, coordExtent, axisType) {
    Axis.call(this, dim, scale, coordExtent);
    this.type = axisType || 'value';
    this._autoLabelInterval;
    this.model = null;
  };
  TimelineAxis.prototype = {
    constructor: TimelineAxis,
    getLabelInterval: function() {
      var timelineModel = this.model;
      var labelModel = timelineModel.getModel('label.normal');
      var labelInterval = labelModel.get('interval');
      if (labelInterval != null && labelInterval != 'auto') {
        return labelInterval;
      }
      var labelInterval = this._autoLabelInterval;
      if (!labelInterval) {
        labelInterval = this._autoLabelInterval = axisHelper.getAxisLabelInterval(zrUtil.map(this.scale.getTicks(), this.dataToCoord, this), axisHelper.getFormattedLabels(this, labelModel.get('formatter')), labelModel.getModel('textStyle').getFont(), timelineModel.get('orient') === 'horizontal');
      }
      return labelInterval;
    },
    isLabelIgnored: function(idx) {
      if (this.type === 'category') {
        var labelInterval = this.getLabelInterval();
        return ((typeof labelInterval === 'function') && !labelInterval(idx, this.scale.getLabel(idx))) || idx % (labelInterval + 1);
      }
    }
  };
  zrUtil.inherits(TimelineAxis, Axis);
  return TimelineAxis;
});
