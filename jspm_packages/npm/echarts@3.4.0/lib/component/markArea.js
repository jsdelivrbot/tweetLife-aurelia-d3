/* */ 
require('./marker/MarkAreaModel');
require('./marker/MarkAreaView');
require('../echarts').registerPreprocessor(function(opt) {
  opt.markArea = opt.markArea || {};
});
