/* */ 
var zrUtil = require('zrender/lib/core/util');
require('../coord/cartesian/Grid');
require('./bar/BarSeries');
require('./bar/BarView');
var barLayoutGrid = require('../layout/barGrid');
var echarts = require('../echarts');
echarts.registerLayout(zrUtil.curry(barLayoutGrid, 'bar'));
echarts.registerVisual(function(ecModel) {
  ecModel.eachSeriesByType('bar', function(seriesModel) {
    var data = seriesModel.getData();
    data.setVisual('legendSymbol', 'roundRect');
  });
});
require('../component/grid');
