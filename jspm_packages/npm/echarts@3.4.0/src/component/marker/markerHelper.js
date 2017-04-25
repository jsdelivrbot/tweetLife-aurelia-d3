/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var numberUtil = require('../../util/number');
  var indexOf = zrUtil.indexOf;
  function hasXOrY(item) {
    return !(isNaN(parseFloat(item.x)) && isNaN(parseFloat(item.y)));
  }
  function hasXAndY(item) {
    return !isNaN(parseFloat(item.x)) && !isNaN(parseFloat(item.y));
  }
  function getPrecision(data, valueAxisDim, dataIndex) {
    var precision = -1;
    do {
      precision = Math.max(numberUtil.getPrecision(data.get(valueAxisDim, dataIndex)), precision);
      data = data.stackedOn;
    } while (data);
    return precision;
  }
  function markerTypeCalculatorWithExtent(mlType, data, otherDataDim, targetDataDim, otherCoordIndex, targetCoordIndex) {
    var coordArr = [];
    var value = numCalculate(data, targetDataDim, mlType);
    var dataIndex = data.indexOfNearest(targetDataDim, value, true);
    coordArr[otherCoordIndex] = data.get(otherDataDim, dataIndex, true);
    coordArr[targetCoordIndex] = data.get(targetDataDim, dataIndex, true);
    var precision = getPrecision(data, targetDataDim, dataIndex);
    if (precision >= 0) {
      coordArr[targetCoordIndex] = +coordArr[targetCoordIndex].toFixed(precision);
    }
    return coordArr;
  }
  var curry = zrUtil.curry;
  var markerTypeCalculator = {
    min: curry(markerTypeCalculatorWithExtent, 'min'),
    max: curry(markerTypeCalculatorWithExtent, 'max'),
    average: curry(markerTypeCalculatorWithExtent, 'average')
  };
  var dataTransform = function(seriesModel, item) {
    var data = seriesModel.getData();
    var coordSys = seriesModel.coordinateSystem;
    if (item && !hasXAndY(item) && !zrUtil.isArray(item.coord) && coordSys) {
      var dims = coordSys.dimensions;
      var axisInfo = getAxisInfo(item, data, coordSys, seriesModel);
      item = zrUtil.clone(item);
      if (item.type && markerTypeCalculator[item.type] && axisInfo.baseAxis && axisInfo.valueAxis) {
        var otherCoordIndex = indexOf(dims, axisInfo.baseAxis.dim);
        var targetCoordIndex = indexOf(dims, axisInfo.valueAxis.dim);
        item.coord = markerTypeCalculator[item.type](data, axisInfo.baseDataDim, axisInfo.valueDataDim, otherCoordIndex, targetCoordIndex);
        item.value = item.coord[targetCoordIndex];
      } else {
        var coord = [item.xAxis != null ? item.xAxis : item.radiusAxis, item.yAxis != null ? item.yAxis : item.angleAxis];
        for (var i = 0; i < 2; i++) {
          if (markerTypeCalculator[coord[i]]) {
            var dataDim = seriesModel.coordDimToDataDim(dims[i])[0];
            coord[i] = numCalculate(data, dataDim, coord[i]);
          }
        }
        item.coord = coord;
      }
    }
    return item;
  };
  var getAxisInfo = function(item, data, coordSys, seriesModel) {
    var ret = {};
    if (item.valueIndex != null || item.valueDim != null) {
      ret.valueDataDim = item.valueIndex != null ? data.getDimension(item.valueIndex) : item.valueDim;
      ret.valueAxis = coordSys.getAxis(seriesModel.dataDimToCoordDim(ret.valueDataDim));
      ret.baseAxis = coordSys.getOtherAxis(ret.valueAxis);
      ret.baseDataDim = seriesModel.coordDimToDataDim(ret.baseAxis.dim)[0];
    } else {
      ret.baseAxis = seriesModel.getBaseAxis();
      ret.valueAxis = coordSys.getOtherAxis(ret.baseAxis);
      ret.baseDataDim = seriesModel.coordDimToDataDim(ret.baseAxis.dim)[0];
      ret.valueDataDim = seriesModel.coordDimToDataDim(ret.valueAxis.dim)[0];
    }
    return ret;
  };
  var dataFilter = function(coordSys, item) {
    return (coordSys && coordSys.containData && item.coord && !hasXOrY(item)) ? coordSys.containData(item.coord) : true;
  };
  var dimValueGetter = function(item, dimName, dataIndex, dimIndex) {
    if (dimIndex < 2) {
      return item.coord && item.coord[dimIndex];
    }
    return item.value;
  };
  var numCalculate = function(data, valueDataDim, type) {
    if (type === 'average') {
      var sum = 0;
      var count = 0;
      data.each(valueDataDim, function(val, idx) {
        if (!isNaN(val)) {
          sum += val;
          count++;
        }
      }, true);
      return sum / count;
    } else {
      return data.getDataExtent(valueDataDim, true)[type === 'max' ? 1 : 0];
    }
  };
  return {
    dataTransform: dataTransform,
    dataFilter: dataFilter,
    dimValueGetter: dimValueGetter,
    getAxisInfo: getAxisInfo,
    numCalculate: numCalculate
  };
});
