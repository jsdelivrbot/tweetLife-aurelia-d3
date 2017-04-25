/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var axisHelper = require('./axisHelper');
  function getName(obj) {
    if (zrUtil.isObject(obj) && obj.value != null) {
      return obj.value;
    } else {
      return obj;
    }
  }
  return {
    getFormattedLabels: function() {
      return axisHelper.getFormattedLabels(this.axis, this.get('axisLabel.formatter'));
    },
    getCategories: function() {
      return this.get('type') === 'category' && zrUtil.map(this.get('data'), getName);
    },
    getMin: function(origin) {
      var option = this.option;
      var min = (!origin && option.rangeStart != null) ? option.rangeStart : option.min;
      if (min != null && min !== 'dataMin' && !zrUtil.eqNaN(min)) {
        min = this.axis.scale.parse(min);
      }
      return min;
    },
    getMax: function(origin) {
      var option = this.option;
      var max = (!origin && option.rangeEnd != null) ? option.rangeEnd : option.max;
      if (max != null && max !== 'dataMax' && !zrUtil.eqNaN(max)) {
        max = this.axis.scale.parse(max);
      }
      return max;
    },
    getNeedCrossZero: function() {
      var option = this.option;
      return (option.rangeStart != null || option.rangeEnd != null) ? false : !option.scale;
    },
    getCoordSysModel: zrUtil.noop,
    setRange: function(rangeStart, rangeEnd) {
      this.option.rangeStart = rangeStart;
      this.option.rangeEnd = rangeEnd;
    },
    resetRange: function() {
      this.option.rangeStart = this.option.rangeEnd = null;
    }
  };
});
