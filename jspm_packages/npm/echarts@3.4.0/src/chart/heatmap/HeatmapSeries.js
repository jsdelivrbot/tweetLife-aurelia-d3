/* */ 
"format cjs";
define(function(require) {
  var SeriesModel = require('../../model/Series');
  var createListFromArray = require('../helper/createListFromArray');
  return SeriesModel.extend({
    type: 'series.heatmap',
    getInitialData: function(option, ecModel) {
      return createListFromArray(option.data, this, ecModel);
    },
    defaultOption: {
      coordinateSystem: 'cartesian2d',
      zlevel: 0,
      z: 2,
      geoIndex: 0,
      blurSize: 30,
      pointSize: 20,
      maxOpacity: 1,
      minOpacity: 0
    }
  });
});
