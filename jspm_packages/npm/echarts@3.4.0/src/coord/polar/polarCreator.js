/* */ 
"format cjs";
define(function(require) {
  var Polar = require('./Polar');
  var numberUtil = require('../../util/number');
  var zrUtil = require('zrender/core/util');
  var axisHelper = require('../axisHelper');
  var niceScaleExtent = axisHelper.niceScaleExtent;
  require('./PolarModel');
  function resizePolar(polarModel, api) {
    var center = polarModel.get('center');
    var radius = polarModel.get('radius');
    var width = api.getWidth();
    var height = api.getHeight();
    var parsePercent = numberUtil.parsePercent;
    this.cx = parsePercent(center[0], width);
    this.cy = parsePercent(center[1], height);
    var radiusAxis = this.getRadiusAxis();
    var size = Math.min(width, height) / 2;
    radiusAxis.setExtent(0, parsePercent(radius, size));
  }
  function updatePolarScale(ecModel, api) {
    var polar = this;
    var angleAxis = polar.getAngleAxis();
    var radiusAxis = polar.getRadiusAxis();
    angleAxis.scale.setExtent(Infinity, -Infinity);
    radiusAxis.scale.setExtent(Infinity, -Infinity);
    ecModel.eachSeries(function(seriesModel) {
      if (seriesModel.coordinateSystem === polar) {
        var data = seriesModel.getData();
        radiusAxis.scale.unionExtentFromData(data, 'radius');
        angleAxis.scale.unionExtentFromData(data, 'angle');
      }
    });
    niceScaleExtent(angleAxis, angleAxis.model);
    niceScaleExtent(radiusAxis, radiusAxis.model);
    if (angleAxis.type === 'category' && !angleAxis.onBand) {
      var extent = angleAxis.getExtent();
      var diff = 360 / angleAxis.scale.count();
      angleAxis.inverse ? (extent[1] += diff) : (extent[1] -= diff);
      angleAxis.setExtent(extent[0], extent[1]);
    }
  }
  function setAxis(axis, axisModel) {
    axis.type = axisModel.get('type');
    axis.scale = axisHelper.createScaleByModel(axisModel);
    axis.onBand = axisModel.get('boundaryGap') && axis.type === 'category';
    if (axisModel.mainType === 'angleAxis') {
      var startAngle = axisModel.get('startAngle');
      axis.inverse = axisModel.get('inverse') ^ axisModel.get('clockwise');
      axis.setExtent(startAngle, startAngle + (axis.inverse ? -360 : 360));
    }
    axisModel.axis = axis;
    axis.model = axisModel;
  }
  var polarCreator = {
    dimensions: Polar.prototype.dimensions,
    create: function(ecModel, api) {
      var polarList = [];
      ecModel.eachComponent('polar', function(polarModel, idx) {
        var polar = new Polar(idx);
        polar.resize = resizePolar;
        polar.update = updatePolarScale;
        var radiusAxis = polar.getRadiusAxis();
        var angleAxis = polar.getAngleAxis();
        var radiusAxisModel = polarModel.findAxisModel('radiusAxis');
        var angleAxisModel = polarModel.findAxisModel('angleAxis');
        setAxis(radiusAxis, radiusAxisModel);
        setAxis(angleAxis, angleAxisModel);
        polar.resize(polarModel, api);
        polarList.push(polar);
        polarModel.coordinateSystem = polar;
      });
      ecModel.eachSeries(function(seriesModel) {
        if (seriesModel.get('coordinateSystem') === 'polar') {
          var polarModel = ecModel.queryComponents({
            mainType: 'polar',
            index: seriesModel.get('polarIndex'),
            id: seriesModel.get('polarId')
          })[0];
          if (__DEV__) {
            if (!polarModel) {
              throw new Error('Polar "' + zrUtil.retrieve(seriesModel.get('polarIndex'), seriesModel.get('polarId'), 0) + '" not found');
            }
          }
          seriesModel.coordinateSystem = polarModel.coordinateSystem;
        }
      });
      return polarList;
    }
  };
  require('../../CoordinateSystem').register('polar', polarCreator);
});
