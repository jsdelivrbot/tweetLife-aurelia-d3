/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var zrUtil = require('zrender/core/util');
    return function(ecModel) {
      var processedMapType = {};
      ecModel.eachSeriesByType('map', function(mapSeries) {
        var mapType = mapSeries.getMapType();
        if (mapSeries.getHostGeoModel() || processedMapType[mapType]) {
          return;
        }
        var mapSymbolOffsets = {};
        zrUtil.each(mapSeries.seriesGroup, function(subMapSeries) {
          var geo = subMapSeries.coordinateSystem;
          var data = subMapSeries.originalData;
          if (subMapSeries.get('showLegendSymbol') && ecModel.getComponent('legend')) {
            data.each('value', function(value, idx) {
              var name = data.getName(idx);
              var region = geo.getRegion(name);
              if (!region || isNaN(value)) {
                return;
              }
              var offset = mapSymbolOffsets[name] || 0;
              var point = geo.dataToPoint(region.center);
              mapSymbolOffsets[name] = offset + 1;
              data.setItemLayout(idx, {
                point: point,
                offset: offset
              });
            });
          }
        });
        var data = mapSeries.getData();
        data.each(function(idx) {
          var name = data.getName(idx);
          var layout = data.getItemLayout(idx) || {};
          layout.showLabel = !mapSymbolOffsets[name];
          data.setItemLayout(idx, layout);
        });
        processedMapType[mapType] = true;
      });
    };
  });
})(require('process'));
