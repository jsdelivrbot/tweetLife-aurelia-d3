/* */ 
var zrUtil = require('zrender/lib/core/util');
var List = require('../../data/List');
var numberUtil = require('../../util/number');
var graphic = require('../../util/graphic');
var colorUtil = require('zrender/lib/tool/color');
var markerHelper = require('./markerHelper');
var markAreaTransform = function(seriesModel, coordSys, maModel, item) {
  var lt = markerHelper.dataTransform(seriesModel, item[0]);
  var rb = markerHelper.dataTransform(seriesModel, item[1]);
  var retrieve = zrUtil.retrieve;
  var ltCoord = lt.coord;
  var rbCoord = rb.coord;
  ltCoord[0] = retrieve(ltCoord[0], -Infinity);
  ltCoord[1] = retrieve(ltCoord[1], -Infinity);
  rbCoord[0] = retrieve(rbCoord[0], Infinity);
  rbCoord[1] = retrieve(rbCoord[1], Infinity);
  var result = zrUtil.mergeAll([{}, lt, rb]);
  result.coord = [lt.coord, rb.coord];
  result.x0 = lt.x;
  result.y0 = lt.y;
  result.x1 = rb.x;
  result.y1 = rb.y;
  return result;
};
function isInifinity(val) {
  return !isNaN(val) && !isFinite(val);
}
function ifMarkLineHasOnlyDim(dimIndex, fromCoord, toCoord, coordSys) {
  var otherDimIndex = 1 - dimIndex;
  return isInifinity(fromCoord[otherDimIndex]) && isInifinity(toCoord[otherDimIndex]);
}
function markAreaFilter(coordSys, item) {
  var fromCoord = item.coord[0];
  var toCoord = item.coord[1];
  if (coordSys.type === 'cartesian2d') {
    if (fromCoord && toCoord && (ifMarkLineHasOnlyDim(1, fromCoord, toCoord, coordSys) || ifMarkLineHasOnlyDim(0, fromCoord, toCoord, coordSys))) {
      return true;
    }
  }
  return markerHelper.dataFilter(coordSys, {
    coord: fromCoord,
    x: item.x0,
    y: item.y0
  }) || markerHelper.dataFilter(coordSys, {
    coord: toCoord,
    x: item.x1,
    y: item.y1
  });
}
function getSingleMarkerEndPoint(data, idx, dims, seriesModel, api) {
  var coordSys = seriesModel.coordinateSystem;
  var itemModel = data.getItemModel(idx);
  var point;
  var xPx = numberUtil.parsePercent(itemModel.get(dims[0]), api.getWidth());
  var yPx = numberUtil.parsePercent(itemModel.get(dims[1]), api.getHeight());
  if (!isNaN(xPx) && !isNaN(yPx)) {
    point = [xPx, yPx];
  } else {
    if (seriesModel.getMarkerPosition) {
      point = seriesModel.getMarkerPosition(data.getValues(dims, idx));
    } else {
      var x = data.get(dims[0], idx);
      var y = data.get(dims[1], idx);
      point = coordSys.dataToPoint([x, y], true);
    }
    if (coordSys.type === 'cartesian2d') {
      var xAxis = coordSys.getAxis('x');
      var yAxis = coordSys.getAxis('y');
      var x = data.get(dims[0], idx);
      var y = data.get(dims[1], idx);
      if (isInifinity(x)) {
        point[0] = xAxis.toGlobalCoord(xAxis.getExtent()[dims[0] === 'x0' ? 0 : 1]);
      } else if (isInifinity(y)) {
        point[1] = yAxis.toGlobalCoord(yAxis.getExtent()[dims[1] === 'y0' ? 0 : 1]);
      }
    }
    if (!isNaN(xPx)) {
      point[0] = xPx;
    }
    if (!isNaN(yPx)) {
      point[1] = yPx;
    }
  }
  return point;
}
var dimPermutations = [['x0', 'y0'], ['x1', 'y0'], ['x1', 'y1'], ['x0', 'y1']];
require('./MarkerView').extend({
  type: 'markArea',
  updateLayout: function(markAreaModel, ecModel, api) {
    ecModel.eachSeries(function(seriesModel) {
      var maModel = seriesModel.markAreaModel;
      if (maModel) {
        var areaData = maModel.getData();
        areaData.each(function(idx) {
          var points = zrUtil.map(dimPermutations, function(dim) {
            return getSingleMarkerEndPoint(areaData, idx, dim, seriesModel, api);
          });
          areaData.setItemLayout(idx, points);
          var el = areaData.getItemGraphicEl(idx);
          el.setShape('points', points);
        });
      }
    }, this);
  },
  renderSeries: function(seriesModel, maModel, ecModel, api) {
    var coordSys = seriesModel.coordinateSystem;
    var seriesName = seriesModel.name;
    var seriesData = seriesModel.getData();
    var areaGroupMap = this.markerGroupMap;
    var polygonGroup = areaGroupMap[seriesName];
    if (!polygonGroup) {
      polygonGroup = areaGroupMap[seriesName] = {group: new graphic.Group()};
    }
    this.group.add(polygonGroup.group);
    polygonGroup.__keep = true;
    var areaData = createList(coordSys, seriesModel, maModel);
    maModel.setData(areaData);
    areaData.each(function(idx) {
      areaData.setItemLayout(idx, zrUtil.map(dimPermutations, function(dim) {
        return getSingleMarkerEndPoint(areaData, idx, dim, seriesModel, api);
      }));
      areaData.setItemVisual(idx, {color: seriesData.getVisual('color')});
    });
    areaData.diff(polygonGroup.__data).add(function(idx) {
      var polygon = new graphic.Polygon({shape: {points: areaData.getItemLayout(idx)}});
      areaData.setItemGraphicEl(idx, polygon);
      polygonGroup.group.add(polygon);
    }).update(function(newIdx, oldIdx) {
      var polygon = polygonGroup.__data.getItemGraphicEl(oldIdx);
      graphic.updateProps(polygon, {shape: {points: areaData.getItemLayout(newIdx)}}, maModel, newIdx);
      polygonGroup.group.add(polygon);
      areaData.setItemGraphicEl(newIdx, polygon);
    }).remove(function(idx) {
      var polygon = polygonGroup.__data.getItemGraphicEl(idx);
      polygonGroup.group.remove(polygon);
    }).execute();
    areaData.eachItemGraphicEl(function(polygon, idx) {
      var itemModel = areaData.getItemModel(idx);
      var labelModel = itemModel.getModel('label.normal');
      var labelHoverModel = itemModel.getModel('label.emphasis');
      var color = areaData.getItemVisual(idx, 'color');
      polygon.useStyle(zrUtil.defaults(itemModel.getModel('itemStyle.normal').getItemStyle(), {
        fill: colorUtil.modifyAlpha(color, 0.4),
        stroke: color
      }));
      polygon.hoverStyle = itemModel.getModel('itemStyle.normal').getItemStyle();
      var defaultValue = areaData.getName(idx) || '';
      var textColor = color || polygon.style.fill;
      if (labelModel.getShallow('show')) {
        graphic.setText(polygon.style, labelModel, textColor);
        polygon.style.text = zrUtil.retrieve(maModel.getFormattedLabel(idx, 'normal'), defaultValue);
      } else {
        polygon.style.text = '';
      }
      if (labelHoverModel.getShallow('show')) {
        graphic.setText(polygon.hoverStyle, labelHoverModel, textColor);
        polygon.hoverStyle.text = zrUtil.retrieve(maModel.getFormattedLabel(idx, 'emphasis'), defaultValue);
      } else {
        polygon.hoverStyle.text = '';
      }
      graphic.setHoverStyle(polygon, {});
      polygon.dataModel = maModel;
    });
    polygonGroup.__data = areaData;
    polygonGroup.group.silent = maModel.get('silent') || seriesModel.get('silent');
  }
});
function createList(coordSys, seriesModel, maModel) {
  var coordDimsInfos;
  var areaData;
  var dims = ['x0', 'y0', 'x1', 'y1'];
  if (coordSys) {
    coordDimsInfos = zrUtil.map(coordSys && coordSys.dimensions, function(coordDim) {
      var info = seriesModel.getData().getDimensionInfo(seriesModel.coordDimToDataDim(coordDim)[0]) || {};
      info.name = coordDim;
      return info;
    });
    areaData = new List(zrUtil.map(dims, function(dim, idx) {
      return {
        name: dim,
        type: coordDimsInfos[idx % 2].type
      };
    }), maModel);
  } else {
    coordDimsInfos = [{
      name: 'value',
      type: 'float'
    }];
    areaData = new List(coordDimsInfos, maModel);
  }
  var optData = zrUtil.map(maModel.get('data'), zrUtil.curry(markAreaTransform, seriesModel, coordSys, maModel));
  if (coordSys) {
    optData = zrUtil.filter(optData, zrUtil.curry(markAreaFilter, coordSys));
  }
  var dimValueGetter = coordSys ? function(item, dimName, dataIndex, dimIndex) {
    return item.coord[Math.floor(dimIndex / 2)][dimIndex % 2];
  } : function(item) {
    return item.value;
  };
  areaData.initData(optData, null, dimValueGetter);
  areaData.hasItemOption = true;
  return areaData;
}
