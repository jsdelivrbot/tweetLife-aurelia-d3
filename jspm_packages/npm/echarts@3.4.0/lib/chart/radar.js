/* */ 
(function(process) {
  var zrUtil = require('zrender/lib/core/util');
  var echarts = require('../echarts');
  require('../component/radar');
  require('./radar/RadarSeries');
  require('./radar/RadarView');
  echarts.registerVisual(zrUtil.curry(require('../visual/dataColor'), 'radar'));
  echarts.registerVisual(zrUtil.curry(require('../visual/symbol'), 'radar', 'circle', null));
  echarts.registerLayout(require('./radar/radarLayout'));
  echarts.registerProcessor(zrUtil.curry(require('../processor/dataFilter'), 'radar'));
  echarts.registerPreprocessor(require('./radar/backwardCompat'));
})(require('process'));
