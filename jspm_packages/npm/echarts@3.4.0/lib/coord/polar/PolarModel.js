/* */ 
'use strict';
require('./AxisModel');
require('../../echarts').extendComponentModel({
  type: 'polar',
  dependencies: ['polarAxis', 'angleAxis'],
  coordinateSystem: null,
  findAxisModel: function(axisType) {
    var foundAxisModel;
    var ecModel = this.ecModel;
    ecModel.eachComponent(axisType, function(axisModel) {
      if (axisModel.getCoordSysModel() === this) {
        foundAxisModel = axisModel;
      }
    }, this);
    return foundAxisModel;
  },
  defaultOption: {
    zlevel: 0,
    z: 0,
    center: ['50%', '50%'],
    radius: '80%'
  }
});
