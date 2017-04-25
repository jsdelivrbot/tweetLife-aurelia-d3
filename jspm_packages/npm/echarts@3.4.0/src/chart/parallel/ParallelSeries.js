/* */ 
"format cjs";
define(function(require) {
  var List = require('../../data/List');
  var zrUtil = require('zrender/core/util');
  var SeriesModel = require('../../model/Series');
  var completeDimensions = require('../../data/helper/completeDimensions');
  return SeriesModel.extend({
    type: 'series.parallel',
    dependencies: ['parallel'],
    getInitialData: function(option, ecModel) {
      var parallelModel = ecModel.getComponent('parallel', this.get('parallelIndex'));
      var parallelAxisIndices = parallelModel.parallelAxisIndex;
      var rawData = option.data;
      var modelDims = parallelModel.dimensions;
      var dataDims = generateDataDims(modelDims, rawData);
      var dataDimsInfo = zrUtil.map(dataDims, function(dim, dimIndex) {
        var modelDimsIndex = zrUtil.indexOf(modelDims, dim);
        var axisModel = modelDimsIndex >= 0 && ecModel.getComponent('parallelAxis', parallelAxisIndices[modelDimsIndex]);
        if (axisModel && axisModel.get('type') === 'category') {
          translateCategoryValue(axisModel, dim, rawData);
          return {
            name: dim,
            type: 'ordinal'
          };
        } else if (modelDimsIndex < 0) {
          return completeDimensions.guessOrdinal(rawData, dimIndex) ? {
            name: dim,
            type: 'ordinal'
          } : dim;
        } else {
          return dim;
        }
      });
      var list = new List(dataDimsInfo, this);
      list.initData(rawData);
      if (this.option.progressive) {
        this.option.animation = false;
      }
      return list;
    },
    getRawIndicesByActiveState: function(activeState) {
      var coordSys = this.coordinateSystem;
      var data = this.getData();
      var indices = [];
      coordSys.eachActiveState(data, function(theActiveState, dataIndex) {
        if (activeState === theActiveState) {
          indices.push(data.getRawIndex(dataIndex));
        }
      });
      return indices;
    },
    defaultOption: {
      zlevel: 0,
      z: 2,
      coordinateSystem: 'parallel',
      parallelIndex: 0,
      label: {
        normal: {show: false},
        emphasis: {show: false}
      },
      inactiveOpacity: 0.05,
      activeOpacity: 1,
      lineStyle: {normal: {
          width: 1,
          opacity: 0.45,
          type: 'solid'
        }},
      progressive: false,
      smooth: false,
      animationEasing: 'linear'
    }
  });
  function translateCategoryValue(axisModel, dim, rawData) {
    var axisData = axisModel.get('data');
    var numberDim = convertDimNameToNumber(dim);
    if (axisData && axisData.length) {
      zrUtil.each(rawData, function(dataItem) {
        if (!dataItem) {
          return;
        }
        var index = zrUtil.indexOf(axisData, dataItem[numberDim]);
        dataItem[numberDim] = index >= 0 ? index : NaN;
      });
    }
  }
  function convertDimNameToNumber(dimName) {
    return +dimName.replace('dim', '');
  }
  function generateDataDims(modelDims, rawData) {
    var maxDimNum = 0;
    zrUtil.each(modelDims, function(dimName) {
      var numberDim = convertDimNameToNumber(dimName);
      numberDim > maxDimNum && (maxDimNum = numberDim);
    });
    var firstItem = rawData[0];
    if (firstItem && firstItem.length - 1 > maxDimNum) {
      maxDimNum = firstItem.length - 1;
    }
    var dataDims = [];
    for (var i = 0; i <= maxDimNum; i++) {
      dataDims.push('dim' + i);
    }
    return dataDims;
  }
});
