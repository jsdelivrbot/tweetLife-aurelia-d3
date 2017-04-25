/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    return function(seriesType, ecModel) {
      var paletteScope = {};
      ecModel.eachRawSeriesByType(seriesType, function(seriesModel) {
        var dataAll = seriesModel.getRawData();
        var idxMap = {};
        if (!ecModel.isSeriesFiltered(seriesModel)) {
          var data = seriesModel.getData();
          data.each(function(idx) {
            var rawIdx = data.getRawIndex(idx);
            idxMap[rawIdx] = idx;
          });
          dataAll.each(function(rawIdx) {
            var filteredIdx = idxMap[rawIdx];
            var singleDataColor = filteredIdx != null && data.getItemVisual(filteredIdx, 'color', true);
            if (!singleDataColor) {
              var itemModel = dataAll.getItemModel(rawIdx);
              var color = itemModel.get('itemStyle.normal.color') || seriesModel.getColorFromPalette(dataAll.getName(rawIdx), paletteScope);
              dataAll.setItemVisual(rawIdx, 'color', color);
              if (filteredIdx != null) {
                data.setItemVisual(filteredIdx, 'color', color);
              }
            } else {
              dataAll.setItemVisual(rawIdx, 'color', singleDataColor);
            }
          });
        }
      });
    };
  });
})(require('process'));
