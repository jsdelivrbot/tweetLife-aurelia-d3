/* */ 
'use strict';
var createListFromArray = require('../helper/createListFromArray');
var SeriesModel = require('../../model/Series');
module.exports = SeriesModel.extend({
  type: 'series.scatter',
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
    hoverAnimation: true,
    symbolSize: 10,
    large: false,
    largeThreshold: 2000,
    itemStyle: {normal: {opacity: 0.8}}
  }
});
