/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var SeriesModel = require('../../model/Series');
  var createListFromArray = require('../helper/createListFromArray');
  return SeriesModel.extend({
    type: 'series.__base_bar__',
    getInitialData: function(option, ecModel) {
      if (__DEV__) {
        var coordSys = option.coordinateSystem;
        if (coordSys !== 'cartesian2d') {
          throw new Error('Bar only support cartesian2d coordinateSystem');
        }
      }
      return createListFromArray(option.data, this, ecModel);
    },
    getMarkerPosition: function(value) {
      var coordSys = this.coordinateSystem;
      if (coordSys) {
        var pt = coordSys.dataToPoint(value, true);
        var data = this.getData();
        var offset = data.getLayout('offset');
        var size = data.getLayout('size');
        var offsetIndex = coordSys.getBaseAxis().isHorizontal() ? 0 : 1;
        pt[offsetIndex] += offset + size / 2;
        return pt;
      }
      return [NaN, NaN];
    },
    defaultOption: {
      zlevel: 0,
      z: 2,
      coordinateSystem: 'cartesian2d',
      legendHoverLink: true,
      barMinHeight: 0,
      itemStyle: {
        normal: {},
        emphasis: {}
      }
    }
  });
});
