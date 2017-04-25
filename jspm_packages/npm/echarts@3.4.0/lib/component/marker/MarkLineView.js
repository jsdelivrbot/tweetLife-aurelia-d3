/* */ 
var zrUtil = require('zrender/lib/core/util');
var List = require('../../data/List');
var numberUtil = require('../../util/number');
var markerHelper = require('./markerHelper');
var LineDraw = require('../../chart/helper/LineDraw');
var markLineTransform = function(seriesModel, coordSys, mlModel, item) {
  var data = seriesModel.getData();
  var mlType = item.type;
  if (!zrUtil.isArray(item) && (mlType === 'min' || mlType === 'max' || mlType === 'average' || (item.xAxis != null || item.yAxis != null))) {
    var valueAxis;
    var valueDataDim;
    var value;
    if (item.yAxis != null || item.xAxis != null) {
      valueDataDim = item.yAxis != null ? 'y' : 'x';
      valueAxis = coordSys.getAxis(valueDataDim);
      value = zrUtil.retrieve(item.yAxis, item.xAxis);
    } else {
      var axisInfo = markerHelper.getAxisInfo(item, data, coordSys, seriesModel);
      valueDataDim = axisInfo.valueDataDim;
      valueAxis = axisInfo.valueAxis;
      value = markerHelper.numCalculate(data, valueDataDim, mlType);
    }
    var valueIndex = valueDataDim === 'x' ? 0 : 1;
    var baseIndex = 1 - valueIndex;
    var mlFrom = zrUtil.clone(item);
    var mlTo = {};
    mlFrom.type = null;
    mlFrom.coord = [];
    mlTo.coord = [];
    mlFrom.coord[baseIndex] = -Infinity;
    mlTo.coord[baseIndex] = Infinity;
    var precision = mlModel.get('precision');
    if (precision >= 0 && typeof value === 'number') {
      value = +value.toFixed(precision);
    }
    mlFrom.coord[valueIndex] = mlTo.coord[valueIndex] = value;
    item = [mlFrom, mlTo, {
      type: mlType,
      valueIndex: item.valueIndex,
      value: value
    }];
  }
  item = [markerHelper.dataTransform(seriesModel, item[0]), markerHelper.dataTransform(seriesModel, item[1]), zrUtil.extend({}, item[2])];
  item[2].type = item[2].type || '';
  zrUtil.merge(item[2], item[0]);
  zrUtil.merge(item[2], item[1]);
  return item;
};
function isInifinity(val) {
  return !isNaN(val) && !isFinite(val);
}
function ifMarkLineHasOnlyDim(dimIndex, fromCoord, toCoord, coordSys) {
  var otherDimIndex = 1 - dimIndex;
  var dimName = coordSys.dimensions[dimIndex];
  return isInifinity(fromCoord[otherDimIndex]) && isInifinity(toCoord[otherDimIndex]) && fromCoord[dimIndex] === toCoord[dimIndex] && coordSys.getAxis(dimName).containData(fromCoord[dimIndex]);
}
function markLineFilter(coordSys, item) {
  if (coordSys.type === 'cartesian2d') {
    var fromCoord = item[0].coord;
    var toCoord = item[1].coord;
    if (fromCoord && toCoord && (ifMarkLineHasOnlyDim(1, fromCoord, toCoord, coordSys) || ifMarkLineHasOnlyDim(0, fromCoord, toCoord, coordSys))) {
      return true;
    }
  }
  return markerHelper.dataFilter(coordSys, item[0]) && markerHelper.dataFilter(coordSys, item[1]);
}
function updateSingleMarkerEndLayout(data, idx, isFrom, seriesModel, api) {
  var coordSys = seriesModel.coordinateSystem;
  var itemModel = data.getItemModel(idx);
  var point;
  var xPx = numberUtil.parsePercent(itemModel.get('x'), api.getWidth());
  var yPx = numberUtil.parsePercent(itemModel.get('y'), api.getHeight());
  if (!isNaN(xPx) && !isNaN(yPx)) {
    point = [xPx, yPx];
  } else {
    if (seriesModel.getMarkerPosition) {
      point = seriesModel.getMarkerPosition(data.getValues(data.dimensions, idx));
    } else {
      var dims = coordSys.dimensions;
      var x = data.get(dims[0], idx);
      var y = data.get(dims[1], idx);
      point = coordSys.dataToPoint([x, y]);
    }
    if (coordSys.type === 'cartesian2d') {
      var xAxis = coordSys.getAxis('x');
      var yAxis = coordSys.getAxis('y');
      var dims = coordSys.dimensions;
      if (isInifinity(data.get(dims[0], idx))) {
        point[0] = xAxis.toGlobalCoord(xAxis.getExtent()[isFrom ? 0 : 1]);
      } else if (isInifinity(data.get(dims[1], idx))) {
        point[1] = yAxis.toGlobalCoord(yAxis.getExtent()[isFrom ? 0 : 1]);
      }
    }
    if (!isNaN(xPx)) {
      point[0] = xPx;
    }
    if (!isNaN(yPx)) {
      point[1] = yPx;
    }
  }
  data.setItemLayout(idx, point);
}
require('./MarkerView').extend({
  type: 'markLine',
  updateLayout: function(markLineModel, ecModel, api) {
    ecModel.eachSeries(function(seriesModel) {
      var mlModel = seriesModel.markLineModel;
      if (mlModel) {
        var mlData = mlModel.getData();
        var fromData = mlModel.__from;
        var toData = mlModel.__to;
        fromData.each(function(idx) {
          updateSingleMarkerEndLayout(fromData, idx, true, seriesModel, api);
          updateSingleMarkerEndLayout(toData, idx, false, seriesModel, api);
        });
        mlData.each(function(idx) {
          mlData.setItemLayout(idx, [fromData.getItemLayout(idx), toData.getItemLayout(idx)]);
        });
        this.markerGroupMap[seriesModel.name].updateLayout();
      }
    }, this);
  },
  renderSeries: function(seriesModel, mlModel, ecModel, api) {
    var coordSys = seriesModel.coordinateSystem;
    var seriesName = seriesModel.name;
    var seriesData = seriesModel.getData();
    var lineDrawMap = this.markerGroupMap;
    var lineDraw = lineDrawMap[seriesName];
    if (!lineDraw) {
      lineDraw = lineDrawMap[seriesName] = new LineDraw();
    }
    this.group.add(lineDraw.group);
    var mlData = createList(coordSys, seriesModel, mlModel);
    var fromData = mlData.from;
    var toData = mlData.to;
    var lineData = mlData.line;
    mlModel.__from = fromData;
    mlModel.__to = toData;
    mlModel.setData(lineData);
    var symbolType = mlModel.get('symbol');
    var symbolSize = mlModel.get('symbolSize');
    if (!zrUtil.isArray(symbolType)) {
      symbolType = [symbolType, symbolType];
    }
    if (typeof symbolSize === 'number') {
      symbolSize = [symbolSize, symbolSize];
    }
    mlData.from.each(function(idx) {
      updateDataVisualAndLayout(fromData, idx, true);
      updateDataVisualAndLayout(toData, idx, false);
    });
    lineData.each(function(idx) {
      var lineColor = lineData.getItemModel(idx).get('lineStyle.normal.color');
      lineData.setItemVisual(idx, {color: lineColor || fromData.getItemVisual(idx, 'color')});
      lineData.setItemLayout(idx, [fromData.getItemLayout(idx), toData.getItemLayout(idx)]);
      lineData.setItemVisual(idx, {
        'fromSymbolSize': fromData.getItemVisual(idx, 'symbolSize'),
        'fromSymbol': fromData.getItemVisual(idx, 'symbol'),
        'toSymbolSize': toData.getItemVisual(idx, 'symbolSize'),
        'toSymbol': toData.getItemVisual(idx, 'symbol')
      });
    });
    lineDraw.updateData(lineData);
    mlData.line.eachItemGraphicEl(function(el, idx) {
      el.traverse(function(child) {
        child.dataModel = mlModel;
      });
    });
    function updateDataVisualAndLayout(data, idx, isFrom) {
      var itemModel = data.getItemModel(idx);
      updateSingleMarkerEndLayout(data, idx, isFrom, seriesModel, api);
      data.setItemVisual(idx, {
        symbolSize: itemModel.get('symbolSize') || symbolSize[isFrom ? 0 : 1],
        symbol: itemModel.get('symbol', true) || symbolType[isFrom ? 0 : 1],
        color: itemModel.get('itemStyle.normal.color') || seriesData.getVisual('color')
      });
    }
    lineDraw.__keep = true;
    lineDraw.group.silent = mlModel.get('silent') || seriesModel.get('silent');
  }
});
function createList(coordSys, seriesModel, mlModel) {
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
  var fromData = new List(coordDimsInfos, mlModel);
  var toData = new List(coordDimsInfos, mlModel);
  var lineData = new List([], mlModel);
  var optData = zrUtil.map(mlModel.get('data'), zrUtil.curry(markLineTransform, seriesModel, coordSys, mlModel));
  if (coordSys) {
    optData = zrUtil.filter(optData, zrUtil.curry(markLineFilter, coordSys));
  }
  var dimValueGetter = coordSys ? markerHelper.dimValueGetter : function(item) {
    return item.value;
  };
  fromData.initData(zrUtil.map(optData, function(item) {
    return item[0];
  }), null, dimValueGetter);
  toData.initData(zrUtil.map(optData, function(item) {
    return item[1];
  }), null, dimValueGetter);
  lineData.initData(zrUtil.map(optData, function(item) {
    return item[2];
  }));
  lineData.hasItemOption = true;
  return {
    from: fromData,
    to: toData,
    line: lineData
  };
}
