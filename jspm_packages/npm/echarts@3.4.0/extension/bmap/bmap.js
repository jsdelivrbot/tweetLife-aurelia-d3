/* */ 
"format cjs";
define(function(require) {
  require('../../index').registerCoordinateSystem('bmap', require('./BMapCoordSys'));
  require('./BMapModel');
  require('./BMapView');
  require('../../index').registerAction({
    type: 'bmapRoam',
    event: 'bmapRoam',
    update: 'updateLayout'
  }, function(payload, ecModel) {
    ecModel.eachComponent('bmap', function(bMapModel) {
      var bmap = bMapModel.getBMap();
      var center = bmap.getCenter();
      bMapModel.setCenterAndZoom([center.lng, center.lat], bmap.getZoom());
    });
  });
  return {version: '1.0.0'};
});
