/* */ 
"format cjs";
define(function(require) {
  require('./marker/MarkPointModel');
  require('./marker/MarkPointView');
  require('../echarts').registerPreprocessor(function(opt) {
    opt.markPoint = opt.markPoint || {};
  });
});
