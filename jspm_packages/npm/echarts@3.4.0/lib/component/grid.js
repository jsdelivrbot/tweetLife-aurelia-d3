/* */ 
'use strict';
var graphic = require('../util/graphic');
var zrUtil = require('zrender/lib/core/util');
var echarts = require('../echarts');
require('../coord/cartesian/Grid');
require('./axis');
echarts.extendComponentView({
  type: 'grid',
  render: function(gridModel, ecModel) {
    this.group.removeAll();
    if (gridModel.get('show')) {
      this.group.add(new graphic.Rect({
        shape: gridModel.coordinateSystem.getRect(),
        style: zrUtil.defaults({fill: gridModel.get('backgroundColor')}, gridModel.getItemStyle()),
        silent: true,
        z2: -1
      }));
    }
  }
});
echarts.registerPreprocessor(function(option) {
  if (option.xAxis && option.yAxis && !option.grid) {
    option.grid = {};
  }
});
