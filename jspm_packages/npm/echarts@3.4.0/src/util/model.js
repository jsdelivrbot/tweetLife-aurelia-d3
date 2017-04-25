/* */ 
"format cjs";
define(function(require) {
  var formatUtil = require('./format');
  var nubmerUtil = require('./number');
  var Model = require('../model/Model');
  var zrUtil = require('zrender/core/util');
  var each = zrUtil.each;
  var isObject = zrUtil.isObject;
  var modelUtil = {};
  modelUtil.normalizeToArray = function(value) {
    return value instanceof Array ? value : value == null ? [] : [value];
  };
  modelUtil.defaultEmphasis = function(opt, subOpts) {
    if (opt) {
      var emphasisOpt = opt.emphasis = opt.emphasis || {};
      var normalOpt = opt.normal = opt.normal || {};
      each(subOpts, function(subOptName) {
        var val = zrUtil.retrieve(emphasisOpt[subOptName], normalOpt[subOptName]);
        if (val != null) {
          emphasisOpt[subOptName] = val;
        }
      });
    }
  };
  modelUtil.LABEL_OPTIONS = ['position', 'offset', 'show', 'textStyle', 'distance', 'formatter'];
  modelUtil.getDataItemValue = function(dataItem) {
    return dataItem && (dataItem.value == null ? dataItem : dataItem.value);
  };
  modelUtil.isDataItemOption = function(dataItem) {
    return isObject(dataItem) && !(dataItem instanceof Array);
  };
  modelUtil.converDataValue = function(value, dimInfo) {
    var dimType = dimInfo && dimInfo.type;
    if (dimType === 'ordinal') {
      return value;
    }
    if (dimType === 'time' && !isFinite(value) && value != null && value !== '-') {
      value = +nubmerUtil.parseDate(value);
    }
    return (value == null || value === '') ? NaN : +value;
  };
  modelUtil.createDataFormatModel = function(data, opt) {
    var model = new Model();
    zrUtil.mixin(model, modelUtil.dataFormatMixin);
    model.seriesIndex = opt.seriesIndex;
    model.name = opt.name || '';
    model.mainType = opt.mainType;
    model.subType = opt.subType;
    model.getData = function() {
      return data;
    };
    return model;
  };
  modelUtil.dataFormatMixin = {
    getDataParams: function(dataIndex, dataType) {
      var data = this.getData(dataType);
      var seriesIndex = this.seriesIndex;
      var seriesName = this.name;
      var rawValue = this.getRawValue(dataIndex, dataType);
      var rawDataIndex = data.getRawIndex(dataIndex);
      var name = data.getName(dataIndex, true);
      var itemOpt = data.getRawDataItem(dataIndex);
      return {
        componentType: this.mainType,
        componentSubType: this.subType,
        seriesType: this.mainType === 'series' ? this.subType : null,
        seriesIndex: seriesIndex,
        seriesName: seriesName,
        name: name,
        dataIndex: rawDataIndex,
        data: itemOpt,
        dataType: dataType,
        value: rawValue,
        color: data.getItemVisual(dataIndex, 'color'),
        $vars: ['seriesName', 'name', 'value']
      };
    },
    getFormattedLabel: function(dataIndex, status, dataType, dimIndex) {
      status = status || 'normal';
      var data = this.getData(dataType);
      var itemModel = data.getItemModel(dataIndex);
      var params = this.getDataParams(dataIndex, dataType);
      if (dimIndex != null && (params.value instanceof Array)) {
        params.value = params.value[dimIndex];
      }
      var formatter = itemModel.get(['label', status, 'formatter']);
      if (typeof formatter === 'function') {
        params.status = status;
        return formatter(params);
      } else if (typeof formatter === 'string') {
        return formatUtil.formatTpl(formatter, params);
      }
    },
    getRawValue: function(idx, dataType) {
      var data = this.getData(dataType);
      var dataItem = data.getRawDataItem(idx);
      if (dataItem != null) {
        return (isObject(dataItem) && !(dataItem instanceof Array)) ? dataItem.value : dataItem;
      }
    },
    formatTooltip: zrUtil.noop
  };
  modelUtil.mappingToExists = function(exists, newCptOptions) {
    newCptOptions = (newCptOptions || []).slice();
    var result = zrUtil.map(exists || [], function(obj, index) {
      return {exist: obj};
    });
    each(newCptOptions, function(cptOption, index) {
      if (!isObject(cptOption)) {
        return;
      }
      for (var i = 0; i < result.length; i++) {
        if (!result[i].option && cptOption.id != null && result[i].exist.id === cptOption.id + '') {
          result[i].option = cptOption;
          newCptOptions[index] = null;
          return;
        }
      }
      for (var i = 0; i < result.length; i++) {
        var exist = result[i].exist;
        if (!result[i].option && (exist.id == null || cptOption.id == null) && cptOption.name != null && !modelUtil.isIdInner(cptOption) && !modelUtil.isIdInner(exist) && exist.name === cptOption.name + '') {
          result[i].option = cptOption;
          newCptOptions[index] = null;
          return;
        }
      }
    });
    each(newCptOptions, function(cptOption, index) {
      if (!isObject(cptOption)) {
        return;
      }
      var i = 0;
      for (; i < result.length; i++) {
        var exist = result[i].exist;
        if (!result[i].option && !modelUtil.isIdInner(exist) && cptOption.id == null) {
          result[i].option = cptOption;
          break;
        }
      }
      if (i >= result.length) {
        result.push({option: cptOption});
      }
    });
    return result;
  };
  modelUtil.makeIdAndName = function(mapResult) {
    var idMap = {};
    each(mapResult, function(item, index) {
      var existCpt = item.exist;
      existCpt && (idMap[existCpt.id] = item);
    });
    each(mapResult, function(item, index) {
      var opt = item.option;
      zrUtil.assert(!opt || opt.id == null || !idMap[opt.id] || idMap[opt.id] === item, 'id duplicates: ' + (opt && opt.id));
      opt && opt.id != null && (idMap[opt.id] = item);
      !item.keyInfo && (item.keyInfo = {});
    });
    each(mapResult, function(item, index) {
      var existCpt = item.exist;
      var opt = item.option;
      var keyInfo = item.keyInfo;
      if (!isObject(opt)) {
        return;
      }
      keyInfo.name = opt.name != null ? opt.name + '' : existCpt ? existCpt.name : '\0-';
      if (existCpt) {
        keyInfo.id = existCpt.id;
      } else if (opt.id != null) {
        keyInfo.id = opt.id + '';
      } else {
        var idNum = 0;
        do {
          keyInfo.id = '\0' + keyInfo.name + '\0' + idNum++;
        } while (idMap[keyInfo.id]);
      }
      idMap[keyInfo.id] = item;
    });
  };
  modelUtil.isIdInner = function(cptOption) {
    return isObject(cptOption) && cptOption.id && (cptOption.id + '').indexOf('\0_ec_\0') === 0;
  };
  modelUtil.compressBatches = function(batchA, batchB) {
    var mapA = {};
    var mapB = {};
    makeMap(batchA || [], mapA);
    makeMap(batchB || [], mapB, mapA);
    return [mapToArray(mapA), mapToArray(mapB)];
    function makeMap(sourceBatch, map, otherMap) {
      for (var i = 0,
          len = sourceBatch.length; i < len; i++) {
        var seriesId = sourceBatch[i].seriesId;
        var dataIndices = modelUtil.normalizeToArray(sourceBatch[i].dataIndex);
        var otherDataIndices = otherMap && otherMap[seriesId];
        for (var j = 0,
            lenj = dataIndices.length; j < lenj; j++) {
          var dataIndex = dataIndices[j];
          if (otherDataIndices && otherDataIndices[dataIndex]) {
            otherDataIndices[dataIndex] = null;
          } else {
            (map[seriesId] || (map[seriesId] = {}))[dataIndex] = 1;
          }
        }
      }
    }
    function mapToArray(map, isData) {
      var result = [];
      for (var i in map) {
        if (map.hasOwnProperty(i) && map[i] != null) {
          if (isData) {
            result.push(+i);
          } else {
            var dataIndices = mapToArray(map[i], true);
            dataIndices.length && result.push({
              seriesId: i,
              dataIndex: dataIndices
            });
          }
        }
      }
      return result;
    }
  };
  modelUtil.queryDataIndex = function(data, payload) {
    if (payload.dataIndexInside != null) {
      return payload.dataIndexInside;
    } else if (payload.dataIndex != null) {
      return zrUtil.isArray(payload.dataIndex) ? zrUtil.map(payload.dataIndex, function(value) {
        return data.indexOfRawIndex(value);
      }) : data.indexOfRawIndex(payload.dataIndex);
    } else if (payload.name != null) {
      return zrUtil.isArray(payload.name) ? zrUtil.map(payload.name, function(value) {
        return data.indexOfName(value);
      }) : data.indexOfName(payload.name);
    }
  };
  modelUtil.parseFinder = function(ecModel, finder, opt) {
    if (zrUtil.isString(finder)) {
      var obj = {};
      obj[finder + 'Index'] = 0;
      finder = obj;
    }
    var defaultMainType = opt && opt.defaultMainType;
    if (defaultMainType && !has(finder, defaultMainType + 'Index') && !has(finder, defaultMainType + 'Id') && !has(finder, defaultMainType + 'Name')) {
      finder[defaultMainType + 'Index'] = 0;
    }
    var result = {};
    each(finder, function(value, key) {
      var value = finder[key];
      if (key === 'dataIndex' || key === 'dataIndexInside') {
        result[key] = value;
        return;
      }
      var parsedKey = key.match(/^(\w+)(Index|Id|Name)$/) || [];
      var mainType = parsedKey[1];
      var queryType = parsedKey[2];
      if (!mainType || !queryType) {
        return;
      }
      var queryParam = {mainType: mainType};
      queryParam[queryType.toLowerCase()] = value;
      var models = ecModel.queryComponents(queryParam);
      result[mainType + 'Models'] = models;
      result[mainType + 'Model'] = models[0];
    });
    return result;
  };
  function has(obj, prop) {
    return obj && obj.hasOwnProperty(prop);
  }
  return modelUtil;
});
