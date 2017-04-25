/* */ 
var echarts = require('../echarts');
var zrUtil = require('zrender/lib/core/util');
var modelUtil = require('../util/model');
var graphicUtil = require('../util/graphic');
var layoutUtil = require('../util/layout');
echarts.registerPreprocessor(function(option) {
  var graphicOption = option && option.graphic;
  if (zrUtil.isArray(graphicOption)) {
    if (!graphicOption[0] || !graphicOption[0].elements) {
      option.graphic = [{elements: graphicOption}];
    } else {
      option.graphic = [option.graphic[0]];
    }
  } else if (graphicOption && !graphicOption.elements) {
    option.graphic = [{elements: [graphicOption]}];
  }
});
var GraphicModel = echarts.extendComponentModel({
  type: 'graphic',
  defaultOption: {
    elements: [],
    parentId: null
  },
  _elOptionsToUpdate: null,
  mergeOption: function(option) {
    var elements = this.option.elements;
    this.option.elements = null;
    GraphicModel.superApply(this, 'mergeOption', arguments);
    this.option.elements = elements;
  },
  optionUpdated: function(newOption, isInit) {
    var thisOption = this.option;
    var newList = (isInit ? thisOption : newOption).elements;
    var existList = thisOption.elements = isInit ? [] : thisOption.elements;
    var flattenedList = [];
    this._flatten(newList, flattenedList);
    var mappingResult = modelUtil.mappingToExists(existList, flattenedList);
    modelUtil.makeIdAndName(mappingResult);
    var elOptionsToUpdate = this._elOptionsToUpdate = [];
    zrUtil.each(mappingResult, function(resultItem, index) {
      var existElOption = resultItem.exist;
      var newElOption = resultItem.option;
      if (__DEV__) {
        zrUtil.assert(zrUtil.isObject(newElOption) || existElOption, 'Empty graphic option definition');
      }
      if (!newElOption) {
        return;
      }
      newElOption.id = resultItem.keyInfo.id;
      var newElParentId = newElOption.parentId;
      var newElParentOption = newElOption.parentOption;
      var existElParentId = existElOption && existElOption.parentId;
      !newElOption.type && existElOption && (newElOption.type = existElOption.type);
      newElOption.parentId = newElParentId ? newElParentId : newElParentOption ? newElParentOption.id : existElParentId ? existElParentId : null;
      newElOption.parentOption = null;
      elOptionsToUpdate.push(newElOption);
      var newElOptCopy = zrUtil.extend({}, newElOption);
      var $action = newElOption.$action;
      if (!$action || $action === 'merge') {
        if (existElOption) {
          if (__DEV__) {
            var newType = newElOption.type;
            zrUtil.assert(!newType || existElOption.type === newType, 'Please set $action: "replace" to change `type`');
          }
          zrUtil.merge(existElOption, newElOptCopy, true);
          layoutUtil.mergeLayoutParam(existElOption, newElOptCopy, {ignoreSize: true});
          layoutUtil.copyLayoutParams(newElOption, existElOption);
        } else {
          existList[index] = newElOptCopy;
        }
      } else if ($action === 'replace') {
        existList[index] = newElOptCopy;
      } else if ($action === 'remove') {
        existElOption && (existList[index] = null);
      }
      if (existList[index]) {
        existList[index].hv = newElOption.hv = [isSetLoc(newElOption, ['left', 'right']), isSetLoc(newElOption, ['top', 'bottom'])];
        if (existList[index].type === 'group') {
          existList[index].width == null && (existList[index].width = newElOption.width = 0);
          existList[index].height == null && (existList[index].height = newElOption.height = 0);
        }
      }
    }, this);
    for (var i = existList.length - 1; i >= 0; i--) {
      if (existList[i] == null) {
        existList.splice(i, 1);
      } else {
        delete existList[i].$action;
      }
    }
  },
  _flatten: function(optionList, result, parentOption) {
    zrUtil.each(optionList, function(option) {
      if (option) {
        if (parentOption) {
          option.parentOption = parentOption;
        }
        result.push(option);
        var children = option.children;
        if (option.type === 'group' && children) {
          this._flatten(children, result, option);
        }
        delete option.children;
      }
    }, this);
  },
  useElOptionsToUpdate: function() {
    var els = this._elOptionsToUpdate;
    this._elOptionsToUpdate = null;
    return els;
  }
});
echarts.extendComponentView({
  type: 'graphic',
  init: function(ecModel, api) {
    this._elMap = {};
    this._lastGraphicModel;
  },
  render: function(graphicModel, ecModel, api) {
    if (graphicModel !== this._lastGraphicModel) {
      this._clear();
    }
    this._lastGraphicModel = graphicModel;
    this._updateElements(graphicModel, api);
    this._relocate(graphicModel, api);
  },
  _updateElements: function(graphicModel, api) {
    var elOptionsToUpdate = graphicModel.useElOptionsToUpdate();
    if (!elOptionsToUpdate) {
      return;
    }
    var elMap = this._elMap;
    var rootGroup = this.group;
    zrUtil.each(elOptionsToUpdate, function(elOption) {
      var $action = elOption.$action;
      var id = elOption.id;
      var existEl = elMap[id];
      var parentId = elOption.parentId;
      var targetElParent = parentId != null ? elMap[parentId] : rootGroup;
      if (elOption.hv && elOption.hv[1] && elOption.type === 'text') {
        elOption.style = zrUtil.defaults({textBaseline: 'middle'}, elOption.style);
        elOption.style.textVerticalAlign = null;
      }
      var elOptionCleaned = getCleanedElOption(elOption);
      if (__DEV__) {
        existEl && zrUtil.assert(targetElParent === existEl.parent, 'Changing parent is not supported.');
      }
      if (!$action || $action === 'merge') {
        existEl ? existEl.attr(elOptionCleaned) : createEl(id, targetElParent, elOptionCleaned, elMap);
      } else if ($action === 'replace') {
        removeEl(existEl, elMap);
        createEl(id, targetElParent, elOptionCleaned, elMap);
      } else if ($action === 'remove') {
        removeEl(existEl, elMap);
      }
      if (elMap[id]) {
        elMap[id].__ecGraphicWidth = elOption.width;
        elMap[id].__ecGraphicHeight = elOption.height;
      }
    });
  },
  _relocate: function(graphicModel, api) {
    var elOptions = graphicModel.option.elements;
    var rootGroup = this.group;
    var elMap = this._elMap;
    for (var i = elOptions.length - 1; i >= 0; i--) {
      var elOption = elOptions[i];
      var el = elMap[elOption.id];
      if (!el) {
        continue;
      }
      var parentEl = el.parent;
      var containerInfo = parentEl === rootGroup ? {
        width: api.getWidth(),
        height: api.getHeight()
      } : {
        width: parentEl.__ecGraphicWidth || 0,
        height: parentEl.__ecGraphicHeight || 0
      };
      layoutUtil.positionElement(el, elOption, containerInfo, null, {
        hv: elOption.hv,
        boundingMode: elOption.bounding
      });
    }
  },
  _clear: function() {
    var elMap = this._elMap;
    zrUtil.each(elMap, function(el) {
      removeEl(el, elMap);
    });
    this._elMap = {};
  },
  dispose: function() {
    this._clear();
  }
});
function createEl(id, targetElParent, elOption, elMap) {
  var graphicType = elOption.type;
  if (__DEV__) {
    zrUtil.assert(graphicType, 'graphic type MUST be set');
  }
  var Clz = graphicUtil[graphicType.charAt(0).toUpperCase() + graphicType.slice(1)];
  if (__DEV__) {
    zrUtil.assert(Clz, 'graphic type can not be found');
  }
  var el = new Clz(elOption);
  targetElParent.add(el);
  elMap[id] = el;
  el.__ecGraphicId = id;
}
function removeEl(existEl, elMap) {
  var existElParent = existEl && existEl.parent;
  if (existElParent) {
    existEl.type === 'group' && existEl.traverse(function(el) {
      removeEl(el, elMap);
    });
    delete elMap[existEl.__ecGraphicId];
    existElParent.remove(existEl);
  }
}
function getCleanedElOption(elOption) {
  elOption = zrUtil.extend({}, elOption);
  zrUtil.each(['id', 'parentId', '$action', 'hv', 'bounding'].concat(layoutUtil.LOCATION_PARAMS), function(name) {
    delete elOption[name];
  });
  return elOption;
}
function isSetLoc(obj, props) {
  var isSet;
  zrUtil.each(props, function(prop) {
    obj[prop] != null && obj[prop] !== 'auto' && (isSet = true);
  });
  return isSet;
}
