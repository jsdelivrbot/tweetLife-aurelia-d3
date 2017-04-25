/* */ 
"format cjs";
define(function(require) {
  var echarts = require('../../echarts');
  var actionInfo = {
    type: 'axisAreaSelect',
    event: 'axisAreaSelected',
    update: 'updateVisual'
  };
  echarts.registerAction(actionInfo, function(payload, ecModel) {
    ecModel.eachComponent({
      mainType: 'parallelAxis',
      query: payload
    }, function(parallelAxisModel) {
      parallelAxisModel.axis.model.setActiveIntervals(payload.intervals);
    });
  });
  echarts.registerAction('parallelAxisExpand', function(payload, ecModel) {
    ecModel.eachComponent({
      mainType: 'parallel',
      query: payload
    }, function(parallelModel) {
      parallelModel.setAxisExpand(payload);
    });
  });
});
