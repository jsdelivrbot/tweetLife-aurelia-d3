/* */ 
'use strict';
var List = require('../../data/List');
var completeDimensions = require('../../data/helper/completeDimensions');
var zrUtil = require('zrender/lib/core/util');
var modelUtil = require('../../util/model');
var CoordinateSystem = require('../../CoordinateSystem');
var getDataItemValue = modelUtil.getDataItemValue;
var converDataValue = modelUtil.converDataValue;
function firstDataNotNull(data) {
  var i = 0;
  while (i < data.length && data[i] == null) {
    i++;
  }
  return data[i];
}
function ifNeedCompleteOrdinalData(data) {
  var sampleItem = firstDataNotNull(data);
  return sampleItem != null && !zrUtil.isArray(getDataItemValue(sampleItem));
}
function createListFromArray(data, seriesModel, ecModel) {
  data = data || [];
  if (__DEV__) {
    if (!zrUtil.isArray(data)) {
      throw new Error('Invalid data.');
    }
  }
  var coordSysName = seriesModel.get('coordinateSystem');
  var creator = creators[coordSysName];
  var registeredCoordSys = CoordinateSystem.get(coordSysName);
  var axesInfo = creator && creator(data, seriesModel, ecModel);
  var dimensions = axesInfo && axesInfo.dimensions;
  if (!dimensions) {
    dimensions = (registeredCoordSys && registeredCoordSys.dimensions) || ['x', 'y'];
    dimensions = completeDimensions(dimensions, data, dimensions.concat(['value']));
  }
  var categoryIndex = axesInfo ? axesInfo.categoryIndex : -1;
  var list = new List(dimensions, seriesModel);
  var nameList = createNameList(axesInfo, data);
  var categories = {};
  var dimValueGetter = (categoryIndex >= 0 && ifNeedCompleteOrdinalData(data)) ? function(itemOpt, dimName, dataIndex, dimIndex) {
    if (modelUtil.isDataItemOption(itemOpt)) {
      list.hasItemOption = true;
    }
    return dimIndex === categoryIndex ? dataIndex : converDataValue(getDataItemValue(itemOpt), dimensions[dimIndex]);
  } : function(itemOpt, dimName, dataIndex, dimIndex) {
    var value = getDataItemValue(itemOpt);
    var val = converDataValue(value && value[dimIndex], dimensions[dimIndex]);
    if (modelUtil.isDataItemOption(itemOpt)) {
      list.hasItemOption = true;
    }
    var categoryAxesModels = axesInfo && axesInfo.categoryAxesModels;
    if (categoryAxesModels && categoryAxesModels[dimName]) {
      if (typeof val === 'string') {
        categories[dimName] = categories[dimName] || categoryAxesModels[dimName].getCategories();
        val = zrUtil.indexOf(categories[dimName], val);
        if (val < 0 && !isNaN(val)) {
          val = +val;
        }
      }
    }
    return val;
  };
  list.hasItemOption = false;
  list.initData(data, nameList, dimValueGetter);
  return list;
}
function isStackable(axisType) {
  return axisType !== 'category' && axisType !== 'time';
}
function getDimTypeByAxis(axisType) {
  return axisType === 'category' ? 'ordinal' : axisType === 'time' ? 'time' : 'float';
}
var creators = {
  cartesian2d: function(data, seriesModel, ecModel) {
    var axesModels = zrUtil.map(['xAxis', 'yAxis'], function(name) {
      return ecModel.queryComponents({
        mainType: name,
        index: seriesModel.get(name + 'Index'),
        id: seriesModel.get(name + 'Id')
      })[0];
    });
    var xAxisModel = axesModels[0];
    var yAxisModel = axesModels[1];
    if (__DEV__) {
      if (!xAxisModel) {
        throw new Error('xAxis "' + zrUtil.retrieve(seriesModel.get('xAxisIndex'), seriesModel.get('xAxisId'), 0) + '" not found');
      }
      if (!yAxisModel) {
        throw new Error('yAxis "' + zrUtil.retrieve(seriesModel.get('xAxisIndex'), seriesModel.get('yAxisId'), 0) + '" not found');
      }
    }
    var xAxisType = xAxisModel.get('type');
    var yAxisType = yAxisModel.get('type');
    var dimensions = [{
      name: 'x',
      type: getDimTypeByAxis(xAxisType),
      stackable: isStackable(xAxisType)
    }, {
      name: 'y',
      type: getDimTypeByAxis(yAxisType),
      stackable: isStackable(yAxisType)
    }];
    var isXAxisCateogry = xAxisType === 'category';
    var isYAxisCategory = yAxisType === 'category';
    completeDimensions(dimensions, data, ['x', 'y', 'z']);
    var categoryAxesModels = {};
    if (isXAxisCateogry) {
      categoryAxesModels.x = xAxisModel;
    }
    if (isYAxisCategory) {
      categoryAxesModels.y = yAxisModel;
    }
    return {
      dimensions: dimensions,
      categoryIndex: isXAxisCateogry ? 0 : (isYAxisCategory ? 1 : -1),
      categoryAxesModels: categoryAxesModels
    };
  },
  singleAxis: function(data, seriesModel, ecModel) {
    var singleAxisModel = ecModel.queryComponents({
      mainType: 'singleAxis',
      index: seriesModel.get('singleAxisIndex'),
      id: seriesModel.get('singleAxisId')
    })[0];
    if (__DEV__) {
      if (!singleAxisModel) {
        throw new Error('singleAxis should be specified.');
      }
    }
    var singleAxisType = singleAxisModel.get('type');
    var isCategory = singleAxisType === 'category';
    var dimensions = [{
      name: 'single',
      type: getDimTypeByAxis(singleAxisType),
      stackable: isStackable(singleAxisType)
    }];
    completeDimensions(dimensions, data);
    var categoryAxesModels = {};
    if (isCategory) {
      categoryAxesModels.single = singleAxisModel;
    }
    return {
      dimensions: dimensions,
      categoryIndex: isCategory ? 0 : -1,
      categoryAxesModels: categoryAxesModels
    };
  },
  polar: function(data, seriesModel, ecModel) {
    var polarModel = ecModel.queryComponents({
      mainType: 'polar',
      index: seriesModel.get('polarIndex'),
      id: seriesModel.get('polarId')
    })[0];
    var angleAxisModel = polarModel.findAxisModel('angleAxis');
    var radiusAxisModel = polarModel.findAxisModel('radiusAxis');
    if (__DEV__) {
      if (!angleAxisModel) {
        throw new Error('angleAxis option not found');
      }
      if (!radiusAxisModel) {
        throw new Error('radiusAxis option not found');
      }
    }
    var radiusAxisType = radiusAxisModel.get('type');
    var angleAxisType = angleAxisModel.get('type');
    var dimensions = [{
      name: 'radius',
      type: getDimTypeByAxis(radiusAxisType),
      stackable: isStackable(radiusAxisType)
    }, {
      name: 'angle',
      type: getDimTypeByAxis(angleAxisType),
      stackable: isStackable(angleAxisType)
    }];
    var isAngleAxisCateogry = angleAxisType === 'category';
    var isRadiusAxisCateogry = radiusAxisType === 'category';
    completeDimensions(dimensions, data, ['radius', 'angle', 'value']);
    var categoryAxesModels = {};
    if (isRadiusAxisCateogry) {
      categoryAxesModels.radius = radiusAxisModel;
    }
    if (isAngleAxisCateogry) {
      categoryAxesModels.angle = angleAxisModel;
    }
    return {
      dimensions: dimensions,
      categoryIndex: isAngleAxisCateogry ? 1 : (isRadiusAxisCateogry ? 0 : -1),
      categoryAxesModels: categoryAxesModels
    };
  },
  geo: function(data, seriesModel, ecModel) {
    return {dimensions: completeDimensions([{name: 'lng'}, {name: 'lat'}], data, ['lng', 'lat', 'value'])};
  }
};
function createNameList(result, data) {
  var nameList = [];
  var categoryDim = result && result.dimensions[result.categoryIndex];
  var categoryAxisModel;
  if (categoryDim) {
    categoryAxisModel = result.categoryAxesModels[categoryDim.name];
  }
  if (categoryAxisModel) {
    var categories = categoryAxisModel.getCategories();
    if (categories) {
      var dataLen = data.length;
      if (zrUtil.isArray(data[0]) && data[0].length > 1) {
        nameList = [];
        for (var i = 0; i < dataLen; i++) {
          nameList[i] = categories[data[i][result.categoryIndex || 0]];
        }
      } else {
        nameList = categories.slice(0);
      }
    }
  }
  return nameList;
}
module.exports = createListFromArray;
