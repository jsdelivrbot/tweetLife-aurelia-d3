/* */ 
'use strict';
var List = require('../../data/List');
var completeDimensions = require('../../data/helper/completeDimensions');
var WhiskerBoxDraw = require('./WhiskerBoxDraw');
var zrUtil = require('zrender/lib/core/util');
function getItemValue(item) {
  return item.value == null ? item : item.value;
}
var seriesModelMixin = {
  _baseAxisDim: null,
  getInitialData: function(option, ecModel) {
    var categories;
    var xAxisModel = ecModel.getComponent('xAxis', this.get('xAxisIndex'));
    var yAxisModel = ecModel.getComponent('yAxis', this.get('yAxisIndex'));
    var xAxisType = xAxisModel.get('type');
    var yAxisType = yAxisModel.get('type');
    var addOrdinal;
    if (xAxisType === 'category') {
      option.layout = 'horizontal';
      categories = xAxisModel.getCategories();
      addOrdinal = true;
    } else if (yAxisType === 'category') {
      option.layout = 'vertical';
      categories = yAxisModel.getCategories();
      addOrdinal = true;
    } else {
      option.layout = option.layout || 'horizontal';
    }
    this._baseAxisDim = option.layout === 'horizontal' ? 'x' : 'y';
    var data = option.data;
    var dimensions = this.dimensions = ['base'].concat(this.valueDimensions);
    completeDimensions(dimensions, data);
    var list = new List(dimensions, this);
    list.initData(data, categories ? categories.slice() : null, function(dataItem, dimName, idx, dimIdx) {
      var value = getItemValue(dataItem);
      return addOrdinal ? (dimName === 'base' ? idx : value[dimIdx - 1]) : value[dimIdx];
    });
    return list;
  },
  coordDimToDataDim: function(axisDim) {
    var dims = this.valueDimensions.slice();
    var baseDim = ['base'];
    var map = {
      horizontal: {
        x: baseDim,
        y: dims
      },
      vertical: {
        x: dims,
        y: baseDim
      }
    };
    return map[this.get('layout')][axisDim];
  },
  dataDimToCoordDim: function(dataDim) {
    var dim;
    zrUtil.each(['x', 'y'], function(coordDim, index) {
      var dataDims = this.coordDimToDataDim(coordDim);
      if (zrUtil.indexOf(dataDims, dataDim) >= 0) {
        dim = coordDim;
      }
    }, this);
    return dim;
  },
  getBaseAxis: function() {
    var dim = this._baseAxisDim;
    return this.ecModel.getComponent(dim + 'Axis', this.get(dim + 'AxisIndex')).axis;
  }
};
var viewMixin = {
  init: function() {
    var whiskerBoxDraw = this._whiskerBoxDraw = new WhiskerBoxDraw(this.getStyleUpdater());
    this.group.add(whiskerBoxDraw.group);
  },
  render: function(seriesModel, ecModel, api) {
    this._whiskerBoxDraw.updateData(seriesModel.getData());
  },
  remove: function(ecModel) {
    this._whiskerBoxDraw.remove();
  }
};
module.exports = {
  seriesModelMixin: seriesModelMixin,
  viewMixin: viewMixin
};
