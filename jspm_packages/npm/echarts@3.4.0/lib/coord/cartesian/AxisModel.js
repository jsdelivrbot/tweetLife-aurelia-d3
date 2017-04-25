/* */ 
'use strict';
var ComponentModel = require('../../model/Component');
var zrUtil = require('zrender/lib/core/util');
var axisModelCreator = require('../axisModelCreator');
var AxisModel = ComponentModel.extend({
  type: 'cartesian2dAxis',
  axis: null,
  init: function() {
    AxisModel.superApply(this, 'init', arguments);
    this.resetRange();
  },
  mergeOption: function() {
    AxisModel.superApply(this, 'mergeOption', arguments);
    this.resetRange();
  },
  restoreData: function() {
    AxisModel.superApply(this, 'restoreData', arguments);
    this.resetRange();
  },
  getCoordSysModel: function() {
    return this.ecModel.queryComponents({
      mainType: 'grid',
      index: this.option.gridIndex,
      id: this.option.gridId
    })[0];
  }
});
function getAxisType(axisDim, option) {
  return option.type || (option.data ? 'category' : 'value');
}
zrUtil.merge(AxisModel.prototype, require('../axisModelCommonMixin'));
var extraOption = {offset: 0};
axisModelCreator('x', AxisModel, getAxisType, extraOption);
axisModelCreator('y', AxisModel, getAxisType, extraOption);
module.exports = AxisModel;
