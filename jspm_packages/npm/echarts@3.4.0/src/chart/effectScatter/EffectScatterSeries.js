/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var createListFromArray = require('../helper/createListFromArray');
  var SeriesModel = require('../../model/Series');
  return SeriesModel.extend({
    type: 'series.effectScatter',
    dependencies: ['grid', 'polar'],
    getInitialData: function(option, ecModel) {
      var list = createListFromArray(option.data, this, ecModel);
      return list;
    },
    brushSelector: 'point',
    defaultOption: {
      coordinateSystem: 'cartesian2d',
      zlevel: 0,
      z: 2,
      legendHoverLink: true,
      effectType: 'ripple',
      progressive: 0,
      showEffectOn: 'render',
      rippleEffect: {
        period: 4,
        scale: 2.5,
        brushType: 'fill'
      },
      symbolSize: 10
    }
  });
});
