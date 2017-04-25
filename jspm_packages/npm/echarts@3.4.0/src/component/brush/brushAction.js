/* */ 
"format cjs";
define(function(require) {
  var echarts = require('../../echarts');
  echarts.registerAction({
    type: 'brush',
    event: 'brush',
    update: 'updateView'
  }, function(payload, ecModel) {
    ecModel.eachComponent({
      mainType: 'brush',
      query: payload
    }, function(brushModel) {
      brushModel.setAreas(payload.areas);
    });
  });
  echarts.registerAction({
    type: 'brushSelect',
    event: 'brushSelected',
    update: 'none'
  }, function() {});
});
