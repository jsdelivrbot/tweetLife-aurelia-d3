/* */ 
var ComponentModel = require('../../model/Component');
var axisModelCreator = require('../axisModelCreator');
var zrUtil = require('zrender/lib/core/util');
var AxisModel = ComponentModel.extend({
  type: 'singleAxis',
  layoutMode: 'box',
  axis: null,
  coordinateSystem: null,
  getCoordSysModel: function() {
    return this;
  }
});
var defaultOption = {
  left: '5%',
  top: '5%',
  right: '5%',
  bottom: '5%',
  type: 'value',
  position: 'bottom',
  orient: 'horizontal',
  axisLine: {
    show: true,
    lineStyle: {
      width: 2,
      type: 'solid'
    }
  },
  axisTick: {
    show: true,
    length: 6,
    lineStyle: {width: 2}
  },
  axisLabel: {
    show: true,
    interval: 'auto'
  },
  splitLine: {
    show: true,
    lineStyle: {
      type: 'dashed',
      opacity: 0.2
    }
  }
};
function getAxisType(axisName, option) {
  return option.type || (option.data ? 'category' : 'value');
}
zrUtil.merge(AxisModel.prototype, require('../axisModelCommonMixin'));
axisModelCreator('single', AxisModel, getAxisType, defaultOption);
module.exports = AxisModel;
