/* */ 
(function(process) {
  var zrUtil = require('zrender/lib/core/util');
  var env = require('zrender/lib/core/env');
  var echarts = require('../../echarts');
  var modelUtil = require('../../util/model');
  var helper = require('./helper');
  var AxisProxy = require('./AxisProxy');
  var each = zrUtil.each;
  var eachAxisDim = helper.eachAxisDim;
  var DataZoomModel = echarts.extendComponentModel({
    type: 'dataZoom',
    dependencies: ['xAxis', 'yAxis', 'zAxis', 'radiusAxis', 'angleAxis', 'singleAxis', 'series'],
    defaultOption: {
      zlevel: 0,
      z: 4,
      orient: null,
      xAxisIndex: null,
      yAxisIndex: null,
      filterMode: 'filter',
      throttle: null,
      start: 0,
      end: 100,
      startValue: null,
      endValue: null
    },
    init: function(option, parentModel, ecModel) {
      this._dataIntervalByAxis = {};
      this._dataInfo = {};
      this._axisProxies = {};
      this.textStyleModel;
      this._autoThrottle = true;
      var rawOption = retrieveRaw(option);
      this.mergeDefaultAndTheme(option, ecModel);
      this.doInit(rawOption);
    },
    mergeOption: function(newOption) {
      var rawOption = retrieveRaw(newOption);
      zrUtil.merge(this.option, newOption, true);
      this.doInit(rawOption);
    },
    doInit: function(rawOption) {
      var thisOption = this.option;
      if (!env.canvasSupported) {
        thisOption.realtime = false;
      }
      this._setDefaultThrottle(rawOption);
      processRangeProp('start', 'startValue', rawOption, thisOption);
      processRangeProp('end', 'endValue', rawOption, thisOption);
      this.textStyleModel = this.getModel('textStyle');
      this._resetTarget();
      this._giveAxisProxies();
    },
    _giveAxisProxies: function() {
      var axisProxies = this._axisProxies;
      this.eachTargetAxis(function(dimNames, axisIndex, dataZoomModel, ecModel) {
        var axisModel = this.dependentModels[dimNames.axis][axisIndex];
        var axisProxy = axisModel.__dzAxisProxy || (axisModel.__dzAxisProxy = new AxisProxy(dimNames.name, axisIndex, this, ecModel));
        axisProxies[dimNames.name + '_' + axisIndex] = axisProxy;
      }, this);
    },
    _resetTarget: function() {
      var thisOption = this.option;
      var autoMode = this._judgeAutoMode();
      eachAxisDim(function(dimNames) {
        var axisIndexName = dimNames.axisIndex;
        thisOption[axisIndexName] = modelUtil.normalizeToArray(thisOption[axisIndexName]);
      }, this);
      if (autoMode === 'axisIndex') {
        this._autoSetAxisIndex();
      } else if (autoMode === 'orient') {
        this._autoSetOrient();
      }
    },
    _judgeAutoMode: function() {
      var thisOption = this.option;
      var hasIndexSpecified = false;
      eachAxisDim(function(dimNames) {
        if (thisOption[dimNames.axisIndex] != null) {
          hasIndexSpecified = true;
        }
      }, this);
      var orient = thisOption.orient;
      if (orient == null && hasIndexSpecified) {
        return 'orient';
      } else if (!hasIndexSpecified) {
        if (orient == null) {
          thisOption.orient = 'horizontal';
        }
        return 'axisIndex';
      }
    },
    _autoSetAxisIndex: function() {
      var autoAxisIndex = true;
      var orient = this.get('orient', true);
      var thisOption = this.option;
      var dependentModels = this.dependentModels;
      if (autoAxisIndex) {
        var dimName = orient === 'vertical' ? 'y' : 'x';
        if (dependentModels[dimName + 'Axis'].length) {
          thisOption[dimName + 'AxisIndex'] = [0];
          autoAxisIndex = false;
        } else {
          each(dependentModels.singleAxis, function(singleAxisModel) {
            if (autoAxisIndex && singleAxisModel.get('orient', true) === orient) {
              thisOption.singleAxisIndex = [singleAxisModel.componentIndex];
              autoAxisIndex = false;
            }
          });
        }
      }
      if (autoAxisIndex) {
        eachAxisDim(function(dimNames) {
          if (!autoAxisIndex) {
            return;
          }
          var axisIndices = [];
          var axisModels = this.dependentModels[dimNames.axis];
          if (axisModels.length && !axisIndices.length) {
            for (var i = 0,
                len = axisModels.length; i < len; i++) {
              if (axisModels[i].get('type') === 'category') {
                axisIndices.push(i);
              }
            }
          }
          thisOption[dimNames.axisIndex] = axisIndices;
          if (axisIndices.length) {
            autoAxisIndex = false;
          }
        }, this);
      }
      if (autoAxisIndex) {
        this.ecModel.eachSeries(function(seriesModel) {
          if (this._isSeriesHasAllAxesTypeOf(seriesModel, 'value')) {
            eachAxisDim(function(dimNames) {
              var axisIndices = thisOption[dimNames.axisIndex];
              var axisIndex = seriesModel.get(dimNames.axisIndex);
              var axisId = seriesModel.get(dimNames.axisId);
              var axisModel = seriesModel.ecModel.queryComponents({
                mainType: dimNames.axis,
                index: axisIndex,
                id: axisId
              })[0];
              if (__DEV__) {
                if (!axisModel) {
                  throw new Error(dimNames.axis + ' "' + zrUtil.retrieve(axisIndex, axisId, 0) + '" not found');
                }
              }
              axisIndex = axisModel.componentIndex;
              if (zrUtil.indexOf(axisIndices, axisIndex) < 0) {
                axisIndices.push(axisIndex);
              }
            });
          }
        }, this);
      }
    },
    _autoSetOrient: function() {
      var dim;
      this.eachTargetAxis(function(dimNames) {
        !dim && (dim = dimNames.name);
      }, this);
      this.option.orient = dim === 'y' ? 'vertical' : 'horizontal';
    },
    _isSeriesHasAllAxesTypeOf: function(seriesModel, axisType) {
      var is = true;
      eachAxisDim(function(dimNames) {
        var seriesAxisIndex = seriesModel.get(dimNames.axisIndex);
        var axisModel = this.dependentModels[dimNames.axis][seriesAxisIndex];
        if (!axisModel || axisModel.get('type') !== axisType) {
          is = false;
        }
      }, this);
      return is;
    },
    _setDefaultThrottle: function(rawOption) {
      if (rawOption.hasOwnProperty('throttle')) {
        this._autoThrottle = false;
      }
      if (this._autoThrottle) {
        var globalOption = this.ecModel.option;
        this.option.throttle = (globalOption.animation && globalOption.animationDurationUpdate > 0) ? 100 : 20;
      }
    },
    getFirstTargetAxisModel: function() {
      var firstAxisModel;
      eachAxisDim(function(dimNames) {
        if (firstAxisModel == null) {
          var indices = this.get(dimNames.axisIndex);
          if (indices.length) {
            firstAxisModel = this.dependentModels[dimNames.axis][indices[0]];
          }
        }
      }, this);
      return firstAxisModel;
    },
    eachTargetAxis: function(callback, context) {
      var ecModel = this.ecModel;
      eachAxisDim(function(dimNames) {
        each(this.get(dimNames.axisIndex), function(axisIndex) {
          callback.call(context, dimNames, axisIndex, this, ecModel);
        }, this);
      }, this);
    },
    getAxisProxy: function(dimName, axisIndex) {
      return this._axisProxies[dimName + '_' + axisIndex];
    },
    setRawRange: function(opt) {
      each(['start', 'end', 'startValue', 'endValue'], function(name) {
        this.option[name] = opt[name];
      }, this);
    },
    getPercentRange: function() {
      var axisProxy = this.findRepresentativeAxisProxy();
      if (axisProxy) {
        return axisProxy.getDataPercentWindow();
      }
    },
    getValueRange: function(axisDimName, axisIndex) {
      if (axisDimName == null && axisIndex == null) {
        var axisProxy = this.findRepresentativeAxisProxy();
        if (axisProxy) {
          return axisProxy.getDataValueWindow();
        }
      } else {
        return this.getAxisProxy(axisDimName, axisIndex).getDataValueWindow();
      }
    },
    findRepresentativeAxisProxy: function() {
      var axisProxies = this._axisProxies;
      for (var key in axisProxies) {
        if (axisProxies.hasOwnProperty(key) && axisProxies[key].hostedBy(this)) {
          return axisProxies[key];
        }
      }
      for (var key in axisProxies) {
        if (axisProxies.hasOwnProperty(key) && !axisProxies[key].hostedBy(this)) {
          return axisProxies[key];
        }
      }
    }
  });
  function retrieveRaw(option) {
    var ret = {};
    each(['start', 'end', 'startValue', 'endValue', 'throttle'], function(name) {
      option.hasOwnProperty(name) && (ret[name] = option[name]);
    });
    return ret;
  }
  function processRangeProp(percentProp, valueProp, rawOption, thisOption) {
    if (rawOption[valueProp] != null && rawOption[percentProp] == null) {
      thisOption[percentProp] = null;
    }
  }
  module.exports = DataZoomModel;
})(require('process'));
