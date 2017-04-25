/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var zrColor = require('zrender/tool/color');
  var linearMap = require('../util/number').linearMap;
  var each = zrUtil.each;
  var isObject = zrUtil.isObject;
  var CATEGORY_DEFAULT_VISUAL_INDEX = -1;
  var VisualMapping = function(option) {
    var mappingMethod = option.mappingMethod;
    var visualType = option.type;
    var thisOption = this.option = zrUtil.clone(option);
    this.type = visualType;
    this.mappingMethod = mappingMethod;
    this._normalizeData = normalizers[mappingMethod];
    var visualHandler = visualHandlers[visualType];
    this.applyVisual = visualHandler.applyVisual;
    this.getColorMapper = visualHandler.getColorMapper;
    this._doMap = visualHandler._doMap[mappingMethod];
    if (mappingMethod === 'piecewise') {
      normalizeVisualRange(thisOption);
      preprocessForPiecewise(thisOption);
    } else if (mappingMethod === 'category') {
      thisOption.categories ? preprocessForSpecifiedCategory(thisOption) : normalizeVisualRange(thisOption, true);
    } else {
      zrUtil.assert(mappingMethod !== 'linear' || thisOption.dataExtent);
      normalizeVisualRange(thisOption);
    }
  };
  VisualMapping.prototype = {
    constructor: VisualMapping,
    mapValueToVisual: function(value) {
      var normalized = this._normalizeData(value);
      return this._doMap(normalized, value);
    },
    getNormalizer: function() {
      return zrUtil.bind(this._normalizeData, this);
    }
  };
  var visualHandlers = VisualMapping.visualHandlers = {
    color: {
      applyVisual: makeApplyVisual('color'),
      getColorMapper: function() {
        var thisOption = this.option;
        var parsedVisual = zrUtil.map(thisOption.visual, zrColor.parse);
        return zrUtil.bind(thisOption.mappingMethod === 'category' ? function(value, isNormalized) {
          !isNormalized && (value = this._normalizeData(value));
          return doMapCategory.call(this, value);
        } : function(value, isNormalized, out) {
          var returnRGBArray = !!out;
          !isNormalized && (value = this._normalizeData(value));
          out = zrColor.fastMapToColor(value, parsedVisual, out);
          return returnRGBArray ? out : zrUtil.stringify(out, 'rgba');
        }, this);
      },
      _doMap: {
        linear: function(normalized) {
          return zrColor.mapToColor(normalized, this.option.visual);
        },
        category: doMapCategory,
        piecewise: function(normalized, value) {
          var result = getSpecifiedVisual.call(this, value);
          if (result == null) {
            result = zrColor.mapToColor(normalized, this.option.visual);
          }
          return result;
        },
        fixed: doMapFixed
      }
    },
    colorHue: makePartialColorVisualHandler(function(color, value) {
      return zrColor.modifyHSL(color, value);
    }),
    colorSaturation: makePartialColorVisualHandler(function(color, value) {
      return zrColor.modifyHSL(color, null, value);
    }),
    colorLightness: makePartialColorVisualHandler(function(color, value) {
      return zrColor.modifyHSL(color, null, null, value);
    }),
    colorAlpha: makePartialColorVisualHandler(function(color, value) {
      return zrColor.modifyAlpha(color, value);
    }),
    opacity: {
      applyVisual: makeApplyVisual('opacity'),
      _doMap: makeDoMap([0, 1])
    },
    symbol: {
      applyVisual: function(value, getter, setter) {
        var symbolCfg = this.mapValueToVisual(value);
        if (zrUtil.isString(symbolCfg)) {
          setter('symbol', symbolCfg);
        } else if (isObject(symbolCfg)) {
          for (var name in symbolCfg) {
            if (symbolCfg.hasOwnProperty(name)) {
              setter(name, symbolCfg[name]);
            }
          }
        }
      },
      _doMap: {
        linear: doMapToArray,
        category: doMapCategory,
        piecewise: function(normalized, value) {
          var result = getSpecifiedVisual.call(this, value);
          if (result == null) {
            result = doMapToArray.call(this, normalized);
          }
          return result;
        },
        fixed: doMapFixed
      }
    },
    symbolSize: {
      applyVisual: makeApplyVisual('symbolSize'),
      _doMap: makeDoMap([0, 1])
    }
  };
  function preprocessForPiecewise(thisOption) {
    var pieceList = thisOption.pieceList;
    thisOption.hasSpecialVisual = false;
    zrUtil.each(pieceList, function(piece, index) {
      piece.originIndex = index;
      if (piece.visual != null) {
        thisOption.hasSpecialVisual = true;
      }
    });
  }
  function preprocessForSpecifiedCategory(thisOption) {
    var categories = thisOption.categories;
    var visual = thisOption.visual;
    var categoryMap = thisOption.categoryMap = {};
    each(categories, function(cate, index) {
      categoryMap[cate] = index;
    });
    if (!zrUtil.isArray(visual)) {
      var visualArr = [];
      if (zrUtil.isObject(visual)) {
        each(visual, function(v, cate) {
          var index = categoryMap[cate];
          visualArr[index != null ? index : CATEGORY_DEFAULT_VISUAL_INDEX] = v;
        });
      } else {
        visualArr[CATEGORY_DEFAULT_VISUAL_INDEX] = visual;
      }
      visual = thisOption.visual = visualArr;
    }
    for (var i = categories.length - 1; i >= 0; i--) {
      if (visual[i] == null) {
        delete categoryMap[categories[i]];
        categories.pop();
      }
    }
  }
  function normalizeVisualRange(thisOption, isCategory) {
    var visual = thisOption.visual;
    var visualArr = [];
    if (zrUtil.isObject(visual)) {
      each(visual, function(v) {
        visualArr.push(v);
      });
    } else if (visual != null) {
      visualArr.push(visual);
    }
    var doNotNeedPair = {
      color: 1,
      symbol: 1
    };
    if (!isCategory && visualArr.length === 1 && !doNotNeedPair.hasOwnProperty(thisOption.type)) {
      visualArr[1] = visualArr[0];
    }
    thisOption.visual = visualArr;
  }
  function makePartialColorVisualHandler(applyValue) {
    return {
      applyVisual: function(value, getter, setter) {
        value = this.mapValueToVisual(value);
        setter('color', applyValue(getter('color'), value));
      },
      _doMap: makeDoMap([0, 1])
    };
  }
  function doMapToArray(normalized) {
    var visual = this.option.visual;
    return visual[Math.round(linearMap(normalized, [0, 1], [0, visual.length - 1], true))] || {};
  }
  function makeApplyVisual(visualType) {
    return function(value, getter, setter) {
      setter(visualType, this.mapValueToVisual(value));
    };
  }
  function doMapCategory(normalized) {
    var visual = this.option.visual;
    return visual[(this.option.loop && normalized !== CATEGORY_DEFAULT_VISUAL_INDEX) ? normalized % visual.length : normalized];
  }
  function doMapFixed() {
    return this.option.visual[0];
  }
  function makeDoMap(sourceExtent) {
    return {
      linear: function(normalized) {
        return linearMap(normalized, sourceExtent, this.option.visual, true);
      },
      category: doMapCategory,
      piecewise: function(normalized, value) {
        var result = getSpecifiedVisual.call(this, value);
        if (result == null) {
          result = linearMap(normalized, sourceExtent, this.option.visual, true);
        }
        return result;
      },
      fixed: doMapFixed
    };
  }
  function getSpecifiedVisual(value) {
    var thisOption = this.option;
    var pieceList = thisOption.pieceList;
    if (thisOption.hasSpecialVisual) {
      var pieceIndex = VisualMapping.findPieceIndex(value, pieceList);
      var piece = pieceList[pieceIndex];
      if (piece && piece.visual) {
        return piece.visual[this.type];
      }
    }
  }
  var normalizers = {
    linear: function(value) {
      return linearMap(value, this.option.dataExtent, [0, 1], true);
    },
    piecewise: function(value) {
      var pieceList = this.option.pieceList;
      var pieceIndex = VisualMapping.findPieceIndex(value, pieceList, true);
      if (pieceIndex != null) {
        return linearMap(pieceIndex, [0, pieceList.length - 1], [0, 1], true);
      }
    },
    category: function(value) {
      var index = this.option.categories ? this.option.categoryMap[value] : value;
      return index == null ? CATEGORY_DEFAULT_VISUAL_INDEX : index;
    },
    fixed: zrUtil.noop
  };
  VisualMapping.listVisualTypes = function() {
    var visualTypes = [];
    zrUtil.each(visualHandlers, function(handler, key) {
      visualTypes.push(key);
    });
    return visualTypes;
  };
  VisualMapping.addVisualHandler = function(name, handler) {
    visualHandlers[name] = handler;
  };
  VisualMapping.isValidType = function(visualType) {
    return visualHandlers.hasOwnProperty(visualType);
  };
  VisualMapping.eachVisual = function(visual, callback, context) {
    if (zrUtil.isObject(visual)) {
      zrUtil.each(visual, callback, context);
    } else {
      callback.call(context, visual);
    }
  };
  VisualMapping.mapVisual = function(visual, callback, context) {
    var isPrimary;
    var newVisual = zrUtil.isArray(visual) ? [] : zrUtil.isObject(visual) ? {} : (isPrimary = true, null);
    VisualMapping.eachVisual(visual, function(v, key) {
      var newVal = callback.call(context, v, key);
      isPrimary ? (newVisual = newVal) : (newVisual[key] = newVal);
    });
    return newVisual;
  };
  VisualMapping.retrieveVisuals = function(obj) {
    var ret = {};
    var hasVisual;
    obj && each(visualHandlers, function(h, visualType) {
      if (obj.hasOwnProperty(visualType)) {
        ret[visualType] = obj[visualType];
        hasVisual = true;
      }
    });
    return hasVisual ? ret : null;
  };
  VisualMapping.prepareVisualTypes = function(visualTypes) {
    if (isObject(visualTypes)) {
      var types = [];
      each(visualTypes, function(item, type) {
        types.push(type);
      });
      visualTypes = types;
    } else if (zrUtil.isArray(visualTypes)) {
      visualTypes = visualTypes.slice();
    } else {
      return [];
    }
    visualTypes.sort(function(type1, type2) {
      return (type2 === 'color' && type1 !== 'color' && type1.indexOf('color') === 0) ? 1 : -1;
    });
    return visualTypes;
  };
  VisualMapping.dependsOn = function(visualType1, visualType2) {
    return visualType2 === 'color' ? !!(visualType1 && visualType1.indexOf(visualType2) === 0) : visualType1 === visualType2;
  };
  VisualMapping.findPieceIndex = function(value, pieceList, findClosestWhenOutside) {
    var possibleI;
    var abs = Infinity;
    for (var i = 0,
        len = pieceList.length; i < len; i++) {
      var pieceValue = pieceList[i].value;
      if (pieceValue != null) {
        if (pieceValue === value) {
          return i;
        }
        findClosestWhenOutside && updatePossible(pieceValue, i);
      }
    }
    for (var i = 0,
        len = pieceList.length; i < len; i++) {
      var piece = pieceList[i];
      var interval = piece.interval;
      var close = piece.close;
      if (interval) {
        if (interval[0] === -Infinity) {
          if (littleThan(close[1], value, interval[1])) {
            return i;
          }
        } else if (interval[1] === Infinity) {
          if (littleThan(close[0], interval[0], value)) {
            return i;
          }
        } else if (littleThan(close[0], interval[0], value) && littleThan(close[1], value, interval[1])) {
          return i;
        }
        findClosestWhenOutside && updatePossible(interval[0], i);
        findClosestWhenOutside && updatePossible(interval[1], i);
      }
    }
    if (findClosestWhenOutside) {
      return value === Infinity ? pieceList.length - 1 : value === -Infinity ? 0 : possibleI;
    }
    function updatePossible(val, index) {
      var newAbs = Math.abs(val - value);
      if (newAbs < abs) {
        abs = newAbs;
        possibleI = index;
      }
    }
  };
  function littleThan(close, a, b) {
    return close ? a <= b : a < b;
  }
  return VisualMapping;
});
