/* */ 
"format cjs";
define(function(require) {
  var SymbolDraw = require('../../chart/helper/SymbolDraw');
  var zrUtil = require('zrender/core/util');
  var numberUtil = require('../../util/number');
  var List = require('../../data/List');
  var markerHelper = require('./markerHelper');
  function updateMarkerLayout(mpData, seriesModel, api) {
    var coordSys = seriesModel.coordinateSystem;
    mpData.each(function(idx) {
      var itemModel = mpData.getItemModel(idx);
      var point;
      var xPx = numberUtil.parsePercent(itemModel.get('x'), api.getWidth());
      var yPx = numberUtil.parsePercent(itemModel.get('y'), api.getHeight());
      if (!isNaN(xPx) && !isNaN(yPx)) {
        point = [xPx, yPx];
      } else if (seriesModel.getMarkerPosition) {
        point = seriesModel.getMarkerPosition(mpData.getValues(mpData.dimensions, idx));
      } else if (coordSys) {
        var x = mpData.get(coordSys.dimensions[0], idx);
        var y = mpData.get(coordSys.dimensions[1], idx);
        point = coordSys.dataToPoint([x, y]);
      }
      if (!isNaN(xPx)) {
        point[0] = xPx;
      }
      if (!isNaN(yPx)) {
        point[1] = yPx;
      }
      mpData.setItemLayout(idx, point);
    });
  }
  require('./MarkerView').extend({
    type: 'markPoint',
    updateLayout: function(markPointModel, ecModel, api) {
      ecModel.eachSeries(function(seriesModel) {
        var mpModel = seriesModel.markPointModel;
        if (mpModel) {
          updateMarkerLayout(mpModel.getData(), seriesModel, api);
          this.markerGroupMap[seriesModel.name].updateLayout(mpModel);
        }
      }, this);
    },
    renderSeries: function(seriesModel, mpModel, ecModel, api) {
      var coordSys = seriesModel.coordinateSystem;
      var seriesName = seriesModel.name;
      var seriesData = seriesModel.getData();
      var symbolDrawMap = this.markerGroupMap;
      var symbolDraw = symbolDrawMap[seriesName];
      if (!symbolDraw) {
        symbolDraw = symbolDrawMap[seriesName] = new SymbolDraw();
      }
      var mpData = createList(coordSys, seriesModel, mpModel);
      mpModel.setData(mpData);
      updateMarkerLayout(mpModel.getData(), seriesModel, api);
      mpData.each(function(idx) {
        var itemModel = mpData.getItemModel(idx);
        var symbolSize = itemModel.getShallow('symbolSize');
        if (typeof symbolSize === 'function') {
          symbolSize = symbolSize(mpModel.getRawValue(idx), mpModel.getDataParams(idx));
        }
        mpData.setItemVisual(idx, {
          symbolSize: symbolSize,
          color: itemModel.get('itemStyle.normal.color') || seriesData.getVisual('color'),
          symbol: itemModel.getShallow('symbol')
        });
      });
      symbolDraw.updateData(mpData);
      this.group.add(symbolDraw.group);
      mpData.eachItemGraphicEl(function(el) {
        el.traverse(function(child) {
          child.dataModel = mpModel;
        });
      });
      symbolDraw.__keep = true;
      symbolDraw.group.silent = mpModel.get('silent') || seriesModel.get('silent');
    }
  });
  function createList(coordSys, seriesModel, mpModel) {
    var coordDimsInfos;
    if (coordSys) {
      coordDimsInfos = zrUtil.map(coordSys && coordSys.dimensions, function(coordDim) {
        var info = seriesModel.getData().getDimensionInfo(seriesModel.coordDimToDataDim(coordDim)[0]) || {};
        info.name = coordDim;
        return info;
      });
    } else {
      coordDimsInfos = [{
        name: 'value',
        type: 'float'
      }];
    }
    var mpData = new List(coordDimsInfos, mpModel);
    var dataOpt = zrUtil.map(mpModel.get('data'), zrUtil.curry(markerHelper.dataTransform, seriesModel));
    if (coordSys) {
      dataOpt = zrUtil.filter(dataOpt, zrUtil.curry(markerHelper.dataFilter, coordSys));
    }
    mpData.initData(dataOpt, null, coordSys ? markerHelper.dimValueGetter : function(item) {
      return item.value;
    });
    return mpData;
  }
});
