/* */ 
'use strict';
var createListFromArray = require('../helper/createListFromArray');
var SeriesModel = require('../../model/Series');
module.exports = SeriesModel.extend({
  type: 'series.line',
  dependencies: ['grid', 'polar'],
  getInitialData: function(option, ecModel) {
    if (__DEV__) {
      var coordSys = option.coordinateSystem;
      if (coordSys !== 'polar' && coordSys !== 'cartesian2d') {
        throw new Error('Line not support coordinateSystem besides cartesian and polar');
      }
    }
    return createListFromArray(option.data, this, ecModel);
  },
  defaultOption: {
    zlevel: 0,
    z: 2,
    coordinateSystem: 'cartesian2d',
    legendHoverLink: true,
    hoverAnimation: true,
    clipOverflow: true,
    label: {normal: {position: 'top'}},
    lineStyle: {normal: {
        width: 2,
        type: 'solid'
      }},
    step: false,
    smooth: false,
    smoothMonotone: null,
    symbol: 'emptyCircle',
    symbolSize: 4,
    symbolRotate: null,
    showSymbol: true,
    showAllSymbol: false,
    connectNulls: false,
    sampling: 'none',
    animationEasing: 'linear',
    progressive: 0,
    hoverLayerThreshold: Infinity
  }
});
