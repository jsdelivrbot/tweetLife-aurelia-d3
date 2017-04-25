/* */ 
var zrUtil = require('zrender/lib/core/util');
var modelUtil = require('../util/model');
var Model = require('./Model');
var each = zrUtil.each;
var filter = zrUtil.filter;
var map = zrUtil.map;
var isArray = zrUtil.isArray;
var indexOf = zrUtil.indexOf;
var isObject = zrUtil.isObject;
var ComponentModel = require('./Component');
var globalDefault = require('./globalDefault');
var OPTION_INNER_KEY = '\0_ec_inner';
var GlobalModel = Model.extend({
  constructor: GlobalModel,
  init: function(option, parentModel, theme, optionManager) {
    theme = theme || {};
    this.option = null;
    this._theme = new Model(theme);
    this._optionManager = optionManager;
  },
  setOption: function(option, optionPreprocessorFuncs) {
    zrUtil.assert(!(OPTION_INNER_KEY in option), 'please use chart.getOption()');
    this._optionManager.setOption(option, optionPreprocessorFuncs);
    this.resetOption();
  },
  resetOption: function(type) {
    var optionChanged = false;
    var optionManager = this._optionManager;
    if (!type || type === 'recreate') {
      var baseOption = optionManager.mountOption(type === 'recreate');
      if (!this.option || type === 'recreate') {
        initBase.call(this, baseOption);
      } else {
        this.restoreData();
        this.mergeOption(baseOption);
      }
      optionChanged = true;
    }
    if (type === 'timeline' || type === 'media') {
      this.restoreData();
    }
    if (!type || type === 'recreate' || type === 'timeline') {
      var timelineOption = optionManager.getTimelineOption(this);
      timelineOption && (this.mergeOption(timelineOption), optionChanged = true);
    }
    if (!type || type === 'recreate' || type === 'media') {
      var mediaOptions = optionManager.getMediaOption(this, this._api);
      if (mediaOptions.length) {
        each(mediaOptions, function(mediaOption) {
          this.mergeOption(mediaOption, optionChanged = true);
        }, this);
      }
    }
    return optionChanged;
  },
  mergeOption: function(newOption) {
    var option = this.option;
    var componentsMap = this._componentsMap;
    var newCptTypes = [];
    each(newOption, function(componentOption, mainType) {
      if (componentOption == null) {
        return;
      }
      if (!ComponentModel.hasClass(mainType)) {
        option[mainType] = option[mainType] == null ? zrUtil.clone(componentOption) : zrUtil.merge(option[mainType], componentOption, true);
      } else {
        newCptTypes.push(mainType);
      }
    });
    ComponentModel.topologicalTravel(newCptTypes, ComponentModel.getAllClassMainTypes(), visitComponent, this);
    this._seriesIndices = this._seriesIndices || [];
    function visitComponent(mainType, dependencies) {
      var newCptOptionList = modelUtil.normalizeToArray(newOption[mainType]);
      var mapResult = modelUtil.mappingToExists(componentsMap[mainType], newCptOptionList);
      modelUtil.makeIdAndName(mapResult);
      each(mapResult, function(item, index) {
        var opt = item.option;
        if (isObject(opt)) {
          item.keyInfo.mainType = mainType;
          item.keyInfo.subType = determineSubType(mainType, opt, item.exist);
        }
      });
      var dependentModels = getComponentsByTypes(componentsMap, dependencies);
      option[mainType] = [];
      componentsMap[mainType] = [];
      each(mapResult, function(resultItem, index) {
        var componentModel = resultItem.exist;
        var newCptOption = resultItem.option;
        zrUtil.assert(isObject(newCptOption) || componentModel, 'Empty component definition');
        if (!newCptOption) {
          componentModel.mergeOption({}, this);
          componentModel.optionUpdated({}, false);
        } else {
          var ComponentModelClass = ComponentModel.getClass(mainType, resultItem.keyInfo.subType, true);
          if (componentModel && componentModel instanceof ComponentModelClass) {
            componentModel.name = resultItem.keyInfo.name;
            componentModel.mergeOption(newCptOption, this);
            componentModel.optionUpdated(newCptOption, false);
          } else {
            var extraOpt = zrUtil.extend({
              dependentModels: dependentModels,
              componentIndex: index
            }, resultItem.keyInfo);
            componentModel = new ComponentModelClass(newCptOption, this, this, extraOpt);
            zrUtil.extend(componentModel, extraOpt);
            componentModel.init(newCptOption, this, this, extraOpt);
            componentModel.optionUpdated(null, true);
          }
        }
        componentsMap[mainType][index] = componentModel;
        option[mainType][index] = componentModel.option;
      }, this);
      if (mainType === 'series') {
        this._seriesIndices = createSeriesIndices(componentsMap.series);
      }
    }
  },
  getOption: function() {
    var option = zrUtil.clone(this.option);
    each(option, function(opts, mainType) {
      if (ComponentModel.hasClass(mainType)) {
        var opts = modelUtil.normalizeToArray(opts);
        for (var i = opts.length - 1; i >= 0; i--) {
          if (modelUtil.isIdInner(opts[i])) {
            opts.splice(i, 1);
          }
        }
        option[mainType] = opts;
      }
    });
    delete option[OPTION_INNER_KEY];
    return option;
  },
  getTheme: function() {
    return this._theme;
  },
  getComponent: function(mainType, idx) {
    var list = this._componentsMap[mainType];
    if (list) {
      return list[idx || 0];
    }
  },
  queryComponents: function(condition) {
    var mainType = condition.mainType;
    if (!mainType) {
      return [];
    }
    var index = condition.index;
    var id = condition.id;
    var name = condition.name;
    var cpts = this._componentsMap[mainType];
    if (!cpts || !cpts.length) {
      return [];
    }
    var result;
    if (index != null) {
      if (!isArray(index)) {
        index = [index];
      }
      result = filter(map(index, function(idx) {
        return cpts[idx];
      }), function(val) {
        return !!val;
      });
    } else if (id != null) {
      var isIdArray = isArray(id);
      result = filter(cpts, function(cpt) {
        return (isIdArray && indexOf(id, cpt.id) >= 0) || (!isIdArray && cpt.id === id);
      });
    } else if (name != null) {
      var isNameArray = isArray(name);
      result = filter(cpts, function(cpt) {
        return (isNameArray && indexOf(name, cpt.name) >= 0) || (!isNameArray && cpt.name === name);
      });
    } else {
      result = cpts;
    }
    return filterBySubType(result, condition);
  },
  findComponents: function(condition) {
    var query = condition.query;
    var mainType = condition.mainType;
    var queryCond = getQueryCond(query);
    var result = queryCond ? this.queryComponents(queryCond) : this._componentsMap[mainType];
    return doFilter(filterBySubType(result, condition));
    function getQueryCond(q) {
      var indexAttr = mainType + 'Index';
      var idAttr = mainType + 'Id';
      var nameAttr = mainType + 'Name';
      return q && (q[indexAttr] != null || q[idAttr] != null || q[nameAttr] != null) ? {
        mainType: mainType,
        index: q[indexAttr],
        id: q[idAttr],
        name: q[nameAttr]
      } : null;
    }
    function doFilter(res) {
      return condition.filter ? filter(res, condition.filter) : res;
    }
  },
  eachComponent: function(mainType, cb, context) {
    var componentsMap = this._componentsMap;
    if (typeof mainType === 'function') {
      context = cb;
      cb = mainType;
      each(componentsMap, function(components, componentType) {
        each(components, function(component, index) {
          cb.call(context, componentType, component, index);
        });
      });
    } else if (zrUtil.isString(mainType)) {
      each(componentsMap[mainType], cb, context);
    } else if (isObject(mainType)) {
      var queryResult = this.findComponents(mainType);
      each(queryResult, cb, context);
    }
  },
  getSeriesByName: function(name) {
    var series = this._componentsMap.series;
    return filter(series, function(oneSeries) {
      return oneSeries.name === name;
    });
  },
  getSeriesByIndex: function(seriesIndex) {
    return this._componentsMap.series[seriesIndex];
  },
  getSeriesByType: function(subType) {
    var series = this._componentsMap.series;
    return filter(series, function(oneSeries) {
      return oneSeries.subType === subType;
    });
  },
  getSeries: function() {
    return this._componentsMap.series.slice();
  },
  eachSeries: function(cb, context) {
    assertSeriesInitialized(this);
    each(this._seriesIndices, function(rawSeriesIndex) {
      var series = this._componentsMap.series[rawSeriesIndex];
      cb.call(context, series, rawSeriesIndex);
    }, this);
  },
  eachRawSeries: function(cb, context) {
    each(this._componentsMap.series, cb, context);
  },
  eachSeriesByType: function(subType, cb, context) {
    assertSeriesInitialized(this);
    each(this._seriesIndices, function(rawSeriesIndex) {
      var series = this._componentsMap.series[rawSeriesIndex];
      if (series.subType === subType) {
        cb.call(context, series, rawSeriesIndex);
      }
    }, this);
  },
  eachRawSeriesByType: function(subType, cb, context) {
    return each(this.getSeriesByType(subType), cb, context);
  },
  isSeriesFiltered: function(seriesModel) {
    assertSeriesInitialized(this);
    return zrUtil.indexOf(this._seriesIndices, seriesModel.componentIndex) < 0;
  },
  filterSeries: function(cb, context) {
    assertSeriesInitialized(this);
    var filteredSeries = filter(this._componentsMap.series, cb, context);
    this._seriesIndices = createSeriesIndices(filteredSeries);
  },
  restoreData: function() {
    var componentsMap = this._componentsMap;
    this._seriesIndices = createSeriesIndices(componentsMap.series);
    var componentTypes = [];
    each(componentsMap, function(components, componentType) {
      componentTypes.push(componentType);
    });
    ComponentModel.topologicalTravel(componentTypes, ComponentModel.getAllClassMainTypes(), function(componentType, dependencies) {
      each(componentsMap[componentType], function(component) {
        component.restoreData();
      });
    });
  }
});
function mergeTheme(option, theme) {
  zrUtil.each(theme, function(themeItem, name) {
    if (!ComponentModel.hasClass(name)) {
      if (typeof themeItem === 'object') {
        option[name] = !option[name] ? zrUtil.clone(themeItem) : zrUtil.merge(option[name], themeItem, false);
      } else {
        if (option[name] == null) {
          option[name] = themeItem;
        }
      }
    }
  });
}
function initBase(baseOption) {
  baseOption = baseOption;
  this.option = {};
  this.option[OPTION_INNER_KEY] = 1;
  this._componentsMap = {};
  this._seriesIndices = null;
  mergeTheme(baseOption, this._theme.option);
  zrUtil.merge(baseOption, globalDefault, false);
  this.mergeOption(baseOption);
}
function getComponentsByTypes(componentsMap, types) {
  if (!zrUtil.isArray(types)) {
    types = types ? [types] : [];
  }
  var ret = {};
  each(types, function(type) {
    ret[type] = (componentsMap[type] || []).slice();
  });
  return ret;
}
function determineSubType(mainType, newCptOption, existComponent) {
  var subType = newCptOption.type ? newCptOption.type : existComponent ? existComponent.subType : ComponentModel.determineSubType(mainType, newCptOption);
  return subType;
}
function createSeriesIndices(seriesModels) {
  return map(seriesModels, function(series) {
    return series.componentIndex;
  }) || [];
}
function filterBySubType(components, condition) {
  return condition.hasOwnProperty('subType') ? filter(components, function(cpt) {
    return cpt.subType === condition.subType;
  }) : components;
}
function assertSeriesInitialized(ecModel) {
  if (__DEV__) {
    if (!ecModel._seriesIndices) {
      throw new Error('Series has not been initialized yet.');
    }
  }
}
zrUtil.mixin(GlobalModel, require('./mixin/colorPalette'));
module.exports = GlobalModel;
