/* */ 
(function(process) {
  var zrUtil = require('zrender/lib/core/util');
  var echarts = require('../echarts');
  var PRIORITY = echarts.PRIORITY;
  require('./line/LineSeries');
  require('./line/LineView');
  echarts.registerVisual(zrUtil.curry(require('../visual/symbol'), 'line', 'circle', 'line'));
  echarts.registerLayout(zrUtil.curry(require('../layout/points'), 'line'));
  echarts.registerProcessor(PRIORITY.PROCESSOR.STATISTIC, zrUtil.curry(require('../processor/dataSample'), 'line'));
  require('../component/grid');
})(require('process'));
