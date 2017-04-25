/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var ComponentModel = require('../../model/Component');
var axisModelCreator = require('../axisModelCreator');
var PolarAxisModel = ComponentModel.extend({
  type: 'polarAxis',
  axis: null,
  getCoordSysModel: function() {
    return this.ecModel.queryComponents({
      mainType: 'polar',
      index: this.option.polarIndex,
      id: this.option.polarId
    })[0];
  }
});
zrUtil.merge(PolarAxisModel.prototype, require('../axisModelCommonMixin'));
var polarAxisDefaultExtendedOption = {
  angle: {
    startAngle: 90,
    clockwise: true,
    splitNumber: 12,
    axisLabel: {rotate: false}
  },
  radius: {splitNumber: 5}
};
function getAxisType(axisDim, option) {
  return option.type || (option.data ? 'category' : 'value');
}
axisModelCreator('angle', PolarAxisModel, getAxisType, polarAxisDefaultExtendedOption.angle);
axisModelCreator('radius', PolarAxisModel, getAxisType, polarAxisDefaultExtendedOption.radius);
