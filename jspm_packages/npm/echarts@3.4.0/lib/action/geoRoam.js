/* */ 
var zrUtil = require('zrender/lib/core/util');
var roamHelper = require('./roamHelper');
var echarts = require('../echarts');
echarts.registerAction({
  type: 'geoRoam',
  event: 'geoRoam',
  update: 'updateLayout'
}, function(payload, ecModel) {
  var componentType = payload.componentType || 'series';
  ecModel.eachComponent({
    mainType: componentType,
    query: payload
  }, function(componentModel) {
    var geo = componentModel.coordinateSystem;
    if (geo.type !== 'geo') {
      return;
    }
    var res = roamHelper.updateCenterAndZoom(geo, payload, componentModel.get('scaleLimit'));
    componentModel.setCenter && componentModel.setCenter(res.center);
    componentModel.setZoom && componentModel.setZoom(res.zoom);
    if (componentType === 'series') {
      zrUtil.each(componentModel.seriesGroup, function(seriesModel) {
        seriesModel.setCenter(res.center);
        seriesModel.setZoom(res.zoom);
      });
    }
  });
});
