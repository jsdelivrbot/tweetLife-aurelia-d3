/* */ 
"format cjs";
define(function(require) {
  var graphic = require('../../util/graphic');
  var zrUtil = require('zrender/core/util');
  var SMOOTH = 0.3;
  var ParallelView = require('../../view/Chart').extend({
    type: 'parallel',
    init: function() {
      this._dataGroup = new graphic.Group();
      this.group.add(this._dataGroup);
      this._data;
    },
    render: function(seriesModel, ecModel, api, payload) {
      this._renderForNormal(seriesModel);
    },
    dispose: function() {},
    _renderForNormal: function(seriesModel) {
      var dataGroup = this._dataGroup;
      var data = seriesModel.getData();
      var oldData = this._data;
      var coordSys = seriesModel.coordinateSystem;
      var dimensions = coordSys.dimensions;
      var option = seriesModel.option;
      var smooth = option.smooth ? SMOOTH : null;
      data.diff(oldData).add(add).update(update).remove(remove).execute();
      updateElCommon(data, smooth);
      if (!this._data) {
        var clipPath = createGridClipShape(coordSys, seriesModel, function() {
          setTimeout(function() {
            dataGroup.removeClipPath();
          });
        });
        dataGroup.setClipPath(clipPath);
      }
      this._data = data;
      function add(newDataIndex) {
        addEl(data, dataGroup, newDataIndex, dimensions, coordSys, null, smooth);
      }
      function update(newDataIndex, oldDataIndex) {
        var line = oldData.getItemGraphicEl(oldDataIndex);
        var points = createLinePoints(data, newDataIndex, dimensions, coordSys);
        data.setItemGraphicEl(newDataIndex, line);
        graphic.updateProps(line, {shape: {points: points}}, seriesModel, newDataIndex);
      }
      function remove(oldDataIndex) {
        var line = oldData.getItemGraphicEl(oldDataIndex);
        dataGroup.remove(line);
      }
    },
    remove: function() {
      this._dataGroup && this._dataGroup.removeAll();
      this._data = null;
    }
  });
  function createGridClipShape(coordSys, seriesModel, cb) {
    var parallelModel = coordSys.model;
    var rect = coordSys.getRect();
    var rectEl = new graphic.Rect({shape: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }});
    var dim = parallelModel.get('layout') === 'horizontal' ? 'width' : 'height';
    rectEl.setShape(dim, 0);
    graphic.initProps(rectEl, {shape: {
        width: rect.width,
        height: rect.height
      }}, seriesModel, cb);
    return rectEl;
  }
  function createLinePoints(data, dataIndex, dimensions, coordSys) {
    var points = [];
    for (var i = 0; i < dimensions.length; i++) {
      var dimName = dimensions[i];
      var value = data.get(dimName, dataIndex);
      if (!isEmptyValue(value, coordSys.getAxis(dimName).type)) {
        points.push(coordSys.dataToPoint(value, dimName));
      }
    }
    return points;
  }
  function addEl(data, dataGroup, dataIndex, dimensions, coordSys) {
    var points = createLinePoints(data, dataIndex, dimensions, coordSys);
    var line = new graphic.Polyline({
      shape: {points: points},
      silent: true,
      z2: 10
    });
    dataGroup.add(line);
    data.setItemGraphicEl(dataIndex, line);
  }
  function updateElCommon(data, smooth) {
    var seriesStyleModel = data.hostModel.getModel('lineStyle.normal');
    var lineStyle = seriesStyleModel.getLineStyle();
    data.eachItemGraphicEl(function(line, dataIndex) {
      if (data.hasItemOption) {
        var itemModel = data.getItemModel(dataIndex);
        var lineStyleModel = itemModel.getModel('lineStyle.normal', seriesStyleModel);
        lineStyle = lineStyleModel.getLineStyle();
      }
      line.useStyle(zrUtil.extend(lineStyle, {
        fill: null,
        stroke: data.getItemVisual(dataIndex, 'color'),
        opacity: data.getItemVisual(dataIndex, 'opacity')
      }));
      line.shape.smooth = smooth;
    });
  }
  function isEmptyValue(val, axisType) {
    return axisType === 'category' ? val == null : (val == null || isNaN(val));
  }
  return ParallelView;
});
