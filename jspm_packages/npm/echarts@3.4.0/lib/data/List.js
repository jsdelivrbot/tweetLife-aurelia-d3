/* */ 
var UNDEFINED = 'undefined';
var globalObj = typeof window === 'undefined' ? global : window;
var Float64Array = typeof globalObj.Float64Array === UNDEFINED ? Array : globalObj.Float64Array;
var Int32Array = typeof globalObj.Int32Array === UNDEFINED ? Array : globalObj.Int32Array;
var dataCtors = {
  'float': Float64Array,
  'int': Int32Array,
  'ordinal': Array,
  'number': Array,
  'time': Array
};
var Model = require('../model/Model');
var DataDiffer = require('./DataDiffer');
var zrUtil = require('zrender/lib/core/util');
var modelUtil = require('../util/model');
var isObject = zrUtil.isObject;
var TRANSFERABLE_PROPERTIES = ['stackedOn', 'hasItemOption', '_nameList', '_idList', '_rawData'];
var transferProperties = function(a, b) {
  zrUtil.each(TRANSFERABLE_PROPERTIES.concat(b.__wrappedMethods || []), function(propName) {
    if (b.hasOwnProperty(propName)) {
      a[propName] = b[propName];
    }
  });
  a.__wrappedMethods = b.__wrappedMethods;
};
var List = function(dimensions, hostModel) {
  dimensions = dimensions || ['x', 'y'];
  var dimensionInfos = {};
  var dimensionNames = [];
  for (var i = 0; i < dimensions.length; i++) {
    var dimensionName;
    var dimensionInfo = {};
    if (typeof dimensions[i] === 'string') {
      dimensionName = dimensions[i];
      dimensionInfo = {
        name: dimensionName,
        stackable: false,
        type: 'number'
      };
    } else {
      dimensionInfo = dimensions[i];
      dimensionName = dimensionInfo.name;
      dimensionInfo.type = dimensionInfo.type || 'number';
    }
    dimensionNames.push(dimensionName);
    dimensionInfos[dimensionName] = dimensionInfo;
  }
  this.dimensions = dimensionNames;
  this._dimensionInfos = dimensionInfos;
  this.hostModel = hostModel;
  this.dataType;
  this.indices = [];
  this._storage = {};
  this._nameList = [];
  this._idList = [];
  this._optionModels = [];
  this.stackedOn = null;
  this._visual = {};
  this._layout = {};
  this._itemVisuals = [];
  this._itemLayouts = [];
  this._graphicEls = [];
  this._rawData;
  this._extent;
};
var listProto = List.prototype;
listProto.type = 'list';
listProto.hasItemOption = true;
listProto.getDimension = function(dim) {
  if (!isNaN(dim)) {
    dim = this.dimensions[dim] || dim;
  }
  return dim;
};
listProto.getDimensionInfo = function(dim) {
  return zrUtil.clone(this._dimensionInfos[this.getDimension(dim)]);
};
listProto.initData = function(data, nameList, dimValueGetter) {
  data = data || [];
  if (__DEV__) {
    if (!zrUtil.isArray(data)) {
      throw new Error('Invalid data.');
    }
  }
  this._rawData = data;
  var storage = this._storage = {};
  var indices = this.indices = [];
  var dimensions = this.dimensions;
  var size = data.length;
  var dimensionInfoMap = this._dimensionInfos;
  var idList = [];
  var nameRepeatCount = {};
  nameList = nameList || [];
  for (var i = 0; i < dimensions.length; i++) {
    var dimInfo = dimensionInfoMap[dimensions[i]];
    var DataCtor = dataCtors[dimInfo.type];
    storage[dimensions[i]] = new DataCtor(size);
  }
  var self = this;
  if (!dimValueGetter) {
    self.hasItemOption = false;
  }
  dimValueGetter = dimValueGetter || function(dataItem, dimName, dataIndex, dimIndex) {
    var value = modelUtil.getDataItemValue(dataItem);
    if (modelUtil.isDataItemOption(dataItem)) {
      self.hasItemOption = true;
    }
    return modelUtil.converDataValue((value instanceof Array) ? value[dimIndex] : value, dimensionInfoMap[dimName]);
  };
  for (var idx = 0; idx < data.length; idx++) {
    var dataItem = data[idx];
    for (var k = 0; k < dimensions.length; k++) {
      var dim = dimensions[k];
      var dimStorage = storage[dim];
      dimStorage[idx] = dimValueGetter(dataItem, dim, idx, k);
    }
    indices.push(idx);
  }
  for (var i = 0; i < data.length; i++) {
    if (!nameList[i]) {
      if (data[i] && data[i].name != null) {
        nameList[i] = data[i].name;
      }
    }
    var name = nameList[i] || '';
    var id = data[i] && data[i].id;
    if (!id && name) {
      nameRepeatCount[name] = nameRepeatCount[name] || 0;
      id = name;
      if (nameRepeatCount[name] > 0) {
        id += '__ec__' + nameRepeatCount[name];
      }
      nameRepeatCount[name]++;
    }
    id && (idList[i] = id);
  }
  this._nameList = nameList;
  this._idList = idList;
};
listProto.count = function() {
  return this.indices.length;
};
listProto.get = function(dim, idx, stack) {
  var storage = this._storage;
  var dataIndex = this.indices[idx];
  if (dataIndex == null) {
    return NaN;
  }
  var value = storage[dim] && storage[dim][dataIndex];
  if (stack) {
    var dimensionInfo = this._dimensionInfos[dim];
    if (dimensionInfo && dimensionInfo.stackable) {
      var stackedOn = this.stackedOn;
      while (stackedOn) {
        var stackedValue = stackedOn.get(dim, idx);
        if ((value >= 0 && stackedValue > 0) || (value <= 0 && stackedValue < 0)) {
          value += stackedValue;
        }
        stackedOn = stackedOn.stackedOn;
      }
    }
  }
  return value;
};
listProto.getValues = function(dimensions, idx, stack) {
  var values = [];
  if (!zrUtil.isArray(dimensions)) {
    stack = idx;
    idx = dimensions;
    dimensions = this.dimensions;
  }
  for (var i = 0,
      len = dimensions.length; i < len; i++) {
    values.push(this.get(dimensions[i], idx, stack));
  }
  return values;
};
listProto.hasValue = function(idx) {
  var dimensions = this.dimensions;
  var dimensionInfos = this._dimensionInfos;
  for (var i = 0,
      len = dimensions.length; i < len; i++) {
    if (dimensionInfos[dimensions[i]].type !== 'ordinal' && isNaN(this.get(dimensions[i], idx))) {
      return false;
    }
  }
  return true;
};
listProto.getDataExtent = function(dim, stack, filter) {
  dim = this.getDimension(dim);
  var dimData = this._storage[dim];
  var dimInfo = this.getDimensionInfo(dim);
  stack = (dimInfo && dimInfo.stackable) && stack;
  var dimExtent = (this._extent || (this._extent = {}))[dim + (!!stack)];
  var value;
  if (dimExtent) {
    return dimExtent;
  }
  if (dimData) {
    var min = Infinity;
    var max = -Infinity;
    for (var i = 0,
        len = this.count(); i < len; i++) {
      value = this.get(dim, i, stack);
      if (!filter || filter(value, dim, i)) {
        value < min && (min = value);
        value > max && (max = value);
      }
    }
    return (this._extent[dim + !!stack] = [min, max]);
  } else {
    return [Infinity, -Infinity];
  }
};
listProto.getSum = function(dim, stack) {
  var dimData = this._storage[dim];
  var sum = 0;
  if (dimData) {
    for (var i = 0,
        len = this.count(); i < len; i++) {
      var value = this.get(dim, i, stack);
      if (!isNaN(value)) {
        sum += value;
      }
    }
  }
  return sum;
};
listProto.indexOf = function(dim, value) {
  var storage = this._storage;
  var dimData = storage[dim];
  var indices = this.indices;
  if (dimData) {
    for (var i = 0,
        len = indices.length; i < len; i++) {
      var rawIndex = indices[i];
      if (dimData[rawIndex] === value) {
        return i;
      }
    }
  }
  return -1;
};
listProto.indexOfName = function(name) {
  var indices = this.indices;
  var nameList = this._nameList;
  for (var i = 0,
      len = indices.length; i < len; i++) {
    var rawIndex = indices[i];
    if (nameList[rawIndex] === name) {
      return i;
    }
  }
  return -1;
};
listProto.indexOfRawIndex = function(rawIndex) {
  var indices = this.indices;
  var rawDataIndex = indices[rawIndex];
  if (rawDataIndex != null && rawDataIndex === rawIndex) {
    return rawIndex;
  }
  var left = 0;
  var right = indices.length - 1;
  while (left <= right) {
    var mid = (left + right) / 2 | 0;
    if (indices[mid] < rawIndex) {
      left = mid + 1;
    } else if (indices[mid] > rawIndex) {
      right = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
};
listProto.indexOfNearest = function(dim, value, stack, maxDistance) {
  var storage = this._storage;
  var dimData = storage[dim];
  if (maxDistance == null) {
    maxDistance = Infinity;
  }
  var nearestIdx = -1;
  if (dimData) {
    var minDist = Number.MAX_VALUE;
    for (var i = 0,
        len = this.count(); i < len; i++) {
      var diff = value - this.get(dim, i, stack);
      var dist = Math.abs(diff);
      if (diff <= maxDistance && (dist < minDist || (dist === minDist && diff > 0))) {
        minDist = dist;
        nearestIdx = i;
      }
    }
  }
  return nearestIdx;
};
listProto.getRawIndex = function(idx) {
  var rawIdx = this.indices[idx];
  return rawIdx == null ? -1 : rawIdx;
};
listProto.getRawDataItem = function(idx) {
  return this._rawData[this.getRawIndex(idx)];
};
listProto.getName = function(idx) {
  return this._nameList[this.indices[idx]] || '';
};
listProto.getId = function(idx) {
  return this._idList[this.indices[idx]] || (this.getRawIndex(idx) + '');
};
function normalizeDimensions(dimensions) {
  if (!zrUtil.isArray(dimensions)) {
    dimensions = [dimensions];
  }
  return dimensions;
}
listProto.each = function(dims, cb, stack, context) {
  if (typeof dims === 'function') {
    context = stack;
    stack = cb;
    cb = dims;
    dims = [];
  }
  dims = zrUtil.map(normalizeDimensions(dims), this.getDimension, this);
  var value = [];
  var dimSize = dims.length;
  var indices = this.indices;
  context = context || this;
  for (var i = 0; i < indices.length; i++) {
    switch (dimSize) {
      case 0:
        cb.call(context, i);
        break;
      case 1:
        cb.call(context, this.get(dims[0], i, stack), i);
        break;
      case 2:
        cb.call(context, this.get(dims[0], i, stack), this.get(dims[1], i, stack), i);
        break;
      default:
        for (var k = 0; k < dimSize; k++) {
          value[k] = this.get(dims[k], i, stack);
        }
        value[k] = i;
        cb.apply(context, value);
    }
  }
};
listProto.filterSelf = function(dimensions, cb, stack, context) {
  if (typeof dimensions === 'function') {
    context = stack;
    stack = cb;
    cb = dimensions;
    dimensions = [];
  }
  dimensions = zrUtil.map(normalizeDimensions(dimensions), this.getDimension, this);
  var newIndices = [];
  var value = [];
  var dimSize = dimensions.length;
  var indices = this.indices;
  context = context || this;
  for (var i = 0; i < indices.length; i++) {
    var keep;
    if (dimSize === 1) {
      keep = cb.call(context, this.get(dimensions[0], i, stack), i);
    } else {
      for (var k = 0; k < dimSize; k++) {
        value[k] = this.get(dimensions[k], i, stack);
      }
      value[k] = i;
      keep = cb.apply(context, value);
    }
    if (keep) {
      newIndices.push(indices[i]);
    }
  }
  this.indices = newIndices;
  this._extent = {};
  return this;
};
listProto.mapArray = function(dimensions, cb, stack, context) {
  if (typeof dimensions === 'function') {
    context = stack;
    stack = cb;
    cb = dimensions;
    dimensions = [];
  }
  var result = [];
  this.each(dimensions, function() {
    result.push(cb && cb.apply(this, arguments));
  }, stack, context);
  return result;
};
function cloneListForMapAndSample(original, excludeDimensions) {
  var allDimensions = original.dimensions;
  var list = new List(zrUtil.map(allDimensions, original.getDimensionInfo, original), original.hostModel);
  transferProperties(list, original);
  var storage = list._storage = {};
  var originalStorage = original._storage;
  for (var i = 0; i < allDimensions.length; i++) {
    var dim = allDimensions[i];
    var dimStore = originalStorage[dim];
    if (zrUtil.indexOf(excludeDimensions, dim) >= 0) {
      storage[dim] = new dimStore.constructor(originalStorage[dim].length);
    } else {
      storage[dim] = originalStorage[dim];
    }
  }
  return list;
}
listProto.map = function(dimensions, cb, stack, context) {
  dimensions = zrUtil.map(normalizeDimensions(dimensions), this.getDimension, this);
  var list = cloneListForMapAndSample(this, dimensions);
  var indices = list.indices = this.indices;
  var storage = list._storage;
  var tmpRetValue = [];
  this.each(dimensions, function() {
    var idx = arguments[arguments.length - 1];
    var retValue = cb && cb.apply(this, arguments);
    if (retValue != null) {
      if (typeof retValue === 'number') {
        tmpRetValue[0] = retValue;
        retValue = tmpRetValue;
      }
      for (var i = 0; i < retValue.length; i++) {
        var dim = dimensions[i];
        var dimStore = storage[dim];
        var rawIdx = indices[idx];
        if (dimStore) {
          dimStore[rawIdx] = retValue[i];
        }
      }
    }
  }, stack, context);
  return list;
};
listProto.downSample = function(dimension, rate, sampleValue, sampleIndex) {
  var list = cloneListForMapAndSample(this, [dimension]);
  var storage = this._storage;
  var targetStorage = list._storage;
  var originalIndices = this.indices;
  var indices = list.indices = [];
  var frameValues = [];
  var frameIndices = [];
  var frameSize = Math.floor(1 / rate);
  var dimStore = targetStorage[dimension];
  var len = this.count();
  for (var i = 0; i < storage[dimension].length; i++) {
    targetStorage[dimension][i] = storage[dimension][i];
  }
  for (var i = 0; i < len; i += frameSize) {
    if (frameSize > len - i) {
      frameSize = len - i;
      frameValues.length = frameSize;
    }
    for (var k = 0; k < frameSize; k++) {
      var idx = originalIndices[i + k];
      frameValues[k] = dimStore[idx];
      frameIndices[k] = idx;
    }
    var value = sampleValue(frameValues);
    var idx = frameIndices[sampleIndex(frameValues, value) || 0];
    dimStore[idx] = value;
    indices.push(idx);
  }
  return list;
};
listProto.getItemModel = function(idx) {
  var hostModel = this.hostModel;
  idx = this.indices[idx];
  return new Model(this._rawData[idx], hostModel, hostModel && hostModel.ecModel);
};
listProto.diff = function(otherList) {
  var idList = this._idList;
  var otherIdList = otherList && otherList._idList;
  var val;
  var prefix = 'e\0\0';
  return new DataDiffer(otherList ? otherList.indices : [], this.indices, function(idx) {
    return (val = otherIdList[idx]) != null ? val : prefix + idx;
  }, function(idx) {
    return (val = idList[idx]) != null ? val : prefix + idx;
  });
};
listProto.getVisual = function(key) {
  var visual = this._visual;
  return visual && visual[key];
};
listProto.setVisual = function(key, val) {
  if (isObject(key)) {
    for (var name in key) {
      if (key.hasOwnProperty(name)) {
        this.setVisual(name, key[name]);
      }
    }
    return;
  }
  this._visual = this._visual || {};
  this._visual[key] = val;
};
listProto.setLayout = function(key, val) {
  if (isObject(key)) {
    for (var name in key) {
      if (key.hasOwnProperty(name)) {
        this.setLayout(name, key[name]);
      }
    }
    return;
  }
  this._layout[key] = val;
};
listProto.getLayout = function(key) {
  return this._layout[key];
};
listProto.getItemLayout = function(idx) {
  return this._itemLayouts[idx];
};
listProto.setItemLayout = function(idx, layout, merge) {
  this._itemLayouts[idx] = merge ? zrUtil.extend(this._itemLayouts[idx] || {}, layout) : layout;
};
listProto.clearItemLayouts = function() {
  this._itemLayouts.length = 0;
};
listProto.getItemVisual = function(idx, key, ignoreParent) {
  var itemVisual = this._itemVisuals[idx];
  var val = itemVisual && itemVisual[key];
  if (val == null && !ignoreParent) {
    return this.getVisual(key);
  }
  return val;
};
listProto.setItemVisual = function(idx, key, value) {
  var itemVisual = this._itemVisuals[idx] || {};
  this._itemVisuals[idx] = itemVisual;
  if (isObject(key)) {
    for (var name in key) {
      if (key.hasOwnProperty(name)) {
        itemVisual[name] = key[name];
      }
    }
    return;
  }
  itemVisual[key] = value;
};
listProto.clearAllVisual = function() {
  this._visual = {};
  this._itemVisuals = [];
};
var setItemDataAndSeriesIndex = function(child) {
  child.seriesIndex = this.seriesIndex;
  child.dataIndex = this.dataIndex;
  child.dataType = this.dataType;
};
listProto.setItemGraphicEl = function(idx, el) {
  var hostModel = this.hostModel;
  if (el) {
    el.dataIndex = idx;
    el.dataType = this.dataType;
    el.seriesIndex = hostModel && hostModel.seriesIndex;
    if (el.type === 'group') {
      el.traverse(setItemDataAndSeriesIndex, el);
    }
  }
  this._graphicEls[idx] = el;
};
listProto.getItemGraphicEl = function(idx) {
  return this._graphicEls[idx];
};
listProto.eachItemGraphicEl = function(cb, context) {
  zrUtil.each(this._graphicEls, function(el, idx) {
    if (el) {
      cb && cb.call(context, el, idx);
    }
  });
};
listProto.cloneShallow = function() {
  var dimensionInfoList = zrUtil.map(this.dimensions, this.getDimensionInfo, this);
  var list = new List(dimensionInfoList, this.hostModel);
  list._storage = this._storage;
  transferProperties(list, this);
  list.indices = this.indices.slice();
  if (this._extent) {
    list._extent = zrUtil.extend({}, this._extent);
  }
  return list;
};
listProto.wrapMethod = function(methodName, injectFunction) {
  var originalMethod = this[methodName];
  if (typeof originalMethod !== 'function') {
    return;
  }
  this.__wrappedMethods = this.__wrappedMethods || [];
  this.__wrappedMethods.push(methodName);
  this[methodName] = function() {
    var res = originalMethod.apply(this, arguments);
    return injectFunction.apply(this, [res].concat(zrUtil.slice(arguments)));
  };
};
listProto.TRANSFERABLE_METHODS = ['cloneShallow', 'downSample', 'map'];
listProto.CHANGABLE_METHODS = ['filterSelf'];
module.exports = List;
