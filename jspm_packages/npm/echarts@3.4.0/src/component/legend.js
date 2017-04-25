/* */ 
"format cjs";
define(function(require) {
  require('./legend/LegendModel');
  require('./legend/legendAction');
  require('./legend/LegendView');
  var echarts = require('../echarts');
  echarts.registerProcessor(require('./legend/legendFilter'));
});
