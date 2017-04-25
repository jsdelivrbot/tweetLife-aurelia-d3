/* */ 
require('./marker/MarkLineModel');
require('./marker/MarkLineView');
require('../echarts').registerPreprocessor(function(opt) {
  opt.markLine = opt.markLine || {};
});
