/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('../../util/number');
    var helper = require('./helper');
    var each = zrUtil.each;
    var asc = numberUtil.asc;
    var AxisProxy = function(dimName, axisIndex, dataZoomModel, ecModel) {
      this._dimName = dimName;
      this._axisIndex = axisIndex;
      this._valueWindow;
      this._percentWindow;
      this._dataExtent;
      this.ecModel = ecModel;
      this._dataZoomModel = dataZoomModel;
    };
    AxisProxy.prototype = {
      constructor: AxisProxy,
      hostedBy: function(dataZoomModel) {
        return this._dataZoomModel === dataZoomModel;
      },
      getDataValueWindow: function() {
        return this._valueWindow.slice();
      },
      getDataPercentWindow: function() {
        return this._percentWindow.slice();
      },
      getTargetSeriesModels: function() {
        var seriesModels = [];
        var ecModel = this.ecModel;
        ecModel.eachSeries(function(seriesModel) {
          if (helper.isCoordSupported(seriesModel.get('coordinateSystem'))) {
            var dimName = this._dimName;
            var axisModel = ecModel.queryComponents({
              mainType: dimName + 'Axis',
              index: seriesModel.get(dimName + 'AxisIndex'),
              id: seriesModel.get(dimName + 'AxisId')
            })[0];
            if (this._axisIndex === (axisModel && axisModel.componentIndex)) {
              seriesModels.push(seriesModel);
            }
          }
        }, this);
        return seriesModels;
      },
      getAxisModel: function() {
        return this.ecModel.getComponent(this._dimName + 'Axis', this._axisIndex);
      },
      getOtherAxisModel: function() {
        var axisDim = this._dimName;
        var ecModel = this.ecModel;
        var axisModel = this.getAxisModel();
        var isCartesian = axisDim === 'x' || axisDim === 'y';
        var otherAxisDim;
        var coordSysIndexName;
        if (isCartesian) {
          coordSysIndexName = 'gridIndex';
          otherAxisDim = axisDim === 'x' ? 'y' : 'x';
        } else {
          coordSysIndexName = 'polarIndex';
          otherAxisDim = axisDim === 'angle' ? 'radius' : 'angle';
        }
        var foundOtherAxisModel;
        ecModel.eachComponent(otherAxisDim + 'Axis', function(otherAxisModel) {
          if ((otherAxisModel.get(coordSysIndexName) || 0) === (axisModel.get(coordSysIndexName) || 0)) {
            foundOtherAxisModel = otherAxisModel;
          }
        });
        return foundOtherAxisModel;
      },
      calculateDataWindow: function(opt) {
        var dataExtent = this._dataExtent;
        var axisModel = this.getAxisModel();
        var scale = axisModel.axis.scale;
        var percentExtent = [0, 100];
        var percentWindow = [opt.start, opt.end];
        var valueWindow = [];
        dataExtent = dataExtent.slice();
        fixExtentByAxis(dataExtent, axisModel);
        each(['startValue', 'endValue'], function(prop) {
          valueWindow.push(opt[prop] != null ? scale.parse(opt[prop]) : null);
        });
        each([0, 1], function(idx) {
          var boundValue = valueWindow[idx];
          var boundPercent = percentWindow[idx];
          if (boundPercent != null || boundValue == null) {
            if (boundPercent == null) {
              boundPercent = percentExtent[idx];
            }
            boundValue = scale.parse(numberUtil.linearMap(boundPercent, percentExtent, dataExtent, true));
          } else {
            boundPercent = numberUtil.linearMap(boundValue, dataExtent, percentExtent, true);
          }
          valueWindow[idx] = boundValue;
          percentWindow[idx] = boundPercent;
        });
        return {
          valueWindow: asc(valueWindow),
          percentWindow: asc(percentWindow)
        };
      },
      reset: function(dataZoomModel) {
        if (dataZoomModel !== this._dataZoomModel) {
          return;
        }
        this._dataExtent = calculateDataExtent(this._dimName, this.getTargetSeriesModels());
        var dataWindow = this.calculateDataWindow(dataZoomModel.option);
        this._valueWindow = dataWindow.valueWindow;
        this._percentWindow = dataWindow.percentWindow;
        setAxisModel(this);
      },
      restore: function(dataZoomModel) {
        if (dataZoomModel !== this._dataZoomModel) {
          return;
        }
        this._valueWindow = this._percentWindow = null;
        setAxisModel(this, true);
      },
      filterData: function(dataZoomModel) {
        if (dataZoomModel !== this._dataZoomModel) {
          return;
        }
        var axisDim = this._dimName;
        var seriesModels = this.getTargetSeriesModels();
        var filterMode = dataZoomModel.get('filterMode');
        var valueWindow = this._valueWindow;
        var otherAxisModel = this.getOtherAxisModel();
        if (dataZoomModel.get('$fromToolbox') && otherAxisModel && otherAxisModel.get('type') === 'category') {
          filterMode = 'empty';
        }
        each(seriesModels, function(seriesModel) {
          var seriesData = seriesModel.getData();
          seriesData && each(seriesModel.coordDimToDataDim(axisDim), function(dim) {
            if (filterMode === 'empty') {
              seriesModel.setData(seriesData.map(dim, function(value) {
                return !isInWindow(value) ? NaN : value;
              }));
            } else {
              seriesData.filterSelf(dim, isInWindow);
            }
          });
        });
        function isInWindow(value) {
          return value >= valueWindow[0] && value <= valueWindow[1];
        }
      }
    };
    function calculateDataExtent(axisDim, seriesModels) {
      var dataExtent = [Infinity, -Infinity];
      each(seriesModels, function(seriesModel) {
        var seriesData = seriesModel.getData();
        if (seriesData) {
          each(seriesModel.coordDimToDataDim(axisDim), function(dim) {
            var seriesExtent = seriesData.getDataExtent(dim);
            seriesExtent[0] < dataExtent[0] && (dataExtent[0] = seriesExtent[0]);
            seriesExtent[1] > dataExtent[1] && (dataExtent[1] = seriesExtent[1]);
          });
        }
      }, this);
      if (dataExtent[1] < dataExtent[0]) {
        dataExtent = [NaN, NaN];
      }
      return dataExtent;
    }
    function fixExtentByAxis(dataExtent, axisModel) {
      var min = axisModel.getMin(true);
      if (min != null && min !== 'dataMin') {
        dataExtent[0] = min;
      }
      var max = axisModel.getMax(true);
      if (max != null && max !== 'dataMax') {
        dataExtent[1] = max;
      }
      if (!axisModel.get('scale', true)) {
        dataExtent[0] > 0 && (dataExtent[0] = 0);
        dataExtent[1] < 0 && (dataExtent[1] = 0);
      }
      return dataExtent;
    }
    function setAxisModel(axisProxy, isRestore) {
      var axisModel = axisProxy.getAxisModel();
      var percentWindow = axisProxy._percentWindow;
      var valueWindow = axisProxy._valueWindow;
      if (!percentWindow) {
        return;
      }
      var precision = numberUtil.getPixelPrecision(valueWindow, [0, 500]);
      var useOrigin = isRestore || (percentWindow[0] === 0 && percentWindow[1] === 100);
      axisModel.setRange(useOrigin ? null : +valueWindow[0].toFixed(precision), useOrigin ? null : +valueWindow[1].toFixed(precision));
    }
    return AxisProxy;
  });
})(require('process'));
