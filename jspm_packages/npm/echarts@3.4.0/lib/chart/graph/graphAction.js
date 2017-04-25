/* */ 
var echarts = require('../../echarts');
var roamHelper = require('../../action/roamHelper');
var actionInfo = {
  type: 'graphRoam',
  event: 'graphRoam',
  update: 'none'
};
echarts.registerAction(actionInfo, function(payload, ecModel) {
  ecModel.eachComponent({
    mainType: 'series',
    query: payload
  }, function(seriesModel) {
    var coordSys = seriesModel.coordinateSystem;
    var res = roamHelper.updateCenterAndZoom(coordSys, payload);
    seriesModel.setCenter && seriesModel.setCenter(res.center);
    seriesModel.setZoom && seriesModel.setZoom(res.zoom);
  });
});
echarts.registerAction({
  type: 'focusNodeAdjacency',
  event: 'focusNodeAdjacency',
  update: 'series.graph:focusNodeAdjacency'
}, function() {});
echarts.registerAction({
  type: 'unfocusNodeAdjacency',
  event: 'unfocusNodeAdjacency',
  update: 'series.graph:unfocusNodeAdjacency'
}, function() {});
