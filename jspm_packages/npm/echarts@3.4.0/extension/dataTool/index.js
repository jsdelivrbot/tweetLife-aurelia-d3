/* */ 
"format cjs";
define(function(require) {
  var echarts = require('../../index');
  echarts.dataTool = {
    version: '1.0.0',
    gexf: require('./gexf'),
    prepareBoxplotData: require('./prepareBoxplotData')
  };
  return echarts.dataTool;
});
