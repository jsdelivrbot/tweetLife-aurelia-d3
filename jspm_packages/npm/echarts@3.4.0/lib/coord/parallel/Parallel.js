/* */ 
(function(process) {
  var layout = require('../../util/layout');
  var axisHelper = require('../axisHelper');
  var zrUtil = require('zrender/lib/core/util');
  var ParallelAxis = require('./ParallelAxis');
  var graphic = require('../../util/graphic');
  var matrix = require('zrender/lib/core/matrix');
  var each = zrUtil.each;
  var PI = Math.PI;
  function Parallel(parallelModel, ecModel, api) {
    this._axesMap = {};
    this._axesLayout = {};
    this.dimensions = parallelModel.dimensions;
    this._rect;
    this._model = parallelModel;
    this._init(parallelModel, ecModel, api);
  }
  Parallel.prototype = {
    type: 'parallel',
    constructor: Parallel,
    _init: function(parallelModel, ecModel, api) {
      var dimensions = parallelModel.dimensions;
      var parallelAxisIndex = parallelModel.parallelAxisIndex;
      each(dimensions, function(dim, idx) {
        var axisIndex = parallelAxisIndex[idx];
        var axisModel = ecModel.getComponent('parallelAxis', axisIndex);
        var axis = this._axesMap[dim] = new ParallelAxis(dim, axisHelper.createScaleByModel(axisModel), [0, 0], axisModel.get('type'), axisIndex);
        var isCategory = axis.type === 'category';
        axis.onBand = isCategory && axisModel.get('boundaryGap');
        axis.inverse = axisModel.get('inverse');
        axisModel.axis = axis;
        axis.model = axisModel;
      }, this);
    },
    update: function(ecModel, api) {
      this._updateAxesFromSeries(this._model, ecModel);
    },
    _updateAxesFromSeries: function(parallelModel, ecModel) {
      ecModel.eachSeries(function(seriesModel) {
        if (!parallelModel.contains(seriesModel, ecModel)) {
          return;
        }
        var data = seriesModel.getData();
        each(this.dimensions, function(dim) {
          var axis = this._axesMap[dim];
          axis.scale.unionExtentFromData(data, dim);
          axisHelper.niceScaleExtent(axis, axis.model);
        }, this);
      }, this);
    },
    resize: function(parallelModel, api) {
      this._rect = layout.getLayoutRect(parallelModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      this._layoutAxes(parallelModel);
    },
    getRect: function() {
      return this._rect;
    },
    _layoutAxes: function(parallelModel) {
      var rect = this._rect;
      var layout = parallelModel.get('layout');
      var axes = this._axesMap;
      var dimensions = this.dimensions;
      var size = [rect.width, rect.height];
      var sizeIdx = layout === 'horizontal' ? 0 : 1;
      var layoutLength = size[sizeIdx];
      var axisLength = size[1 - sizeIdx];
      var axisExtent = [0, axisLength];
      each(axes, function(axis) {
        var idx = axis.inverse ? 1 : 0;
        axis.setExtent(axisExtent[idx], axisExtent[1 - idx]);
      });
      var axisExpandable = parallelModel.get('axisExpandable');
      var axisExpandWidth = parallelModel.get('axisExpandWidth');
      var axisExpandCenter = parallelModel.get('axisExpandCenter');
      var axisExpandCount = parallelModel.get('axisExpandCount') || 0;
      var axisExpandWindow;
      if (axisExpandCenter != null) {
        var left = Math.max(0, Math.floor(axisExpandCenter - (axisExpandCount - 1) / 2));
        var right = left + axisExpandCount - 1;
        if (right >= dimensions.length) {
          right = dimensions.length - 1;
          left = Math.max(0, Math.floor(right - axisExpandCount + 1));
        }
        axisExpandWindow = [left, right];
      }
      var calcPos = (axisExpandable && axisExpandWindow && axisExpandWidth) ? function(axisIndex, layoutLength, axisCount) {
        var peekIntervalCount = axisExpandWindow[1] - axisExpandWindow[0];
        var otherWidth = (layoutLength - axisExpandWidth * peekIntervalCount) / (axisCount - 1 - peekIntervalCount);
        var position;
        if (axisIndex < axisExpandWindow[0]) {
          position = (axisIndex - 1) * otherWidth;
        } else if (axisIndex <= axisExpandWindow[1]) {
          position = axisExpandWindow[0] * otherWidth + (axisIndex - axisExpandWindow[0]) * axisExpandWidth;
        } else if (axisIndex === axisCount - 1) {
          position = layoutLength;
        } else {
          position = axisExpandWindow[0] * otherWidth + peekIntervalCount * axisExpandWidth + (axisIndex - axisExpandWindow[1]) * otherWidth;
        }
        return {
          position: position,
          axisNameAvailableWidth: (axisExpandWindow[0] < axisIndex && axisIndex < axisExpandWindow[1]) ? axisExpandWidth : otherWidth
        };
      } : function(axisIndex, layoutLength, axisCount) {
        var step = layoutLength / (axisCount - 1);
        return {
          position: step * axisIndex,
          axisNameAvailableWidth: step
        };
      };
      each(dimensions, function(dim, idx) {
        var posInfo = calcPos(idx, layoutLength, dimensions.length);
        var positionTable = {
          horizontal: {
            x: posInfo.position,
            y: axisLength
          },
          vertical: {
            x: 0,
            y: posInfo.position
          }
        };
        var rotationTable = {
          horizontal: PI / 2,
          vertical: 0
        };
        var position = [positionTable[layout].x + rect.x, positionTable[layout].y + rect.y];
        var rotation = rotationTable[layout];
        var transform = matrix.create();
        matrix.rotate(transform, transform, rotation);
        matrix.translate(transform, transform, position);
        this._axesLayout[dim] = {
          position: position,
          rotation: rotation,
          transform: transform,
          axisNameAvailableWidth: posInfo.axisNameAvailableWidth,
          tickDirection: 1,
          labelDirection: 1,
          axisExpandWindow: axisExpandWindow
        };
      }, this);
    },
    getAxis: function(dim) {
      return this._axesMap[dim];
    },
    dataToPoint: function(value, dim) {
      return this.axisCoordToPoint(this._axesMap[dim].dataToCoord(value), dim);
    },
    eachActiveState: function(data, callback, context) {
      var dimensions = this.dimensions;
      var axesMap = this._axesMap;
      var hasActiveSet = this.hasAxisbrushed();
      for (var i = 0,
          len = data.count(); i < len; i++) {
        var values = data.getValues(dimensions, i);
        var activeState;
        if (!hasActiveSet) {
          activeState = 'normal';
        } else {
          activeState = 'active';
          for (var j = 0,
              lenj = dimensions.length; j < lenj; j++) {
            var dimName = dimensions[j];
            var state = axesMap[dimName].model.getActiveState(values[j], j);
            if (state === 'inactive') {
              activeState = 'inactive';
              break;
            }
          }
        }
        callback.call(context, activeState, i);
      }
    },
    hasAxisbrushed: function() {
      var dimensions = this.dimensions;
      var axesMap = this._axesMap;
      var hasActiveSet = false;
      for (var j = 0,
          lenj = dimensions.length; j < lenj; j++) {
        if (axesMap[dimensions[j]].model.getActiveState() !== 'normal') {
          hasActiveSet = true;
        }
      }
      return hasActiveSet;
    },
    axisCoordToPoint: function(coord, dim) {
      var axisLayout = this._axesLayout[dim];
      return graphic.applyTransform([coord, 0], axisLayout.transform);
    },
    getAxisLayout: function(dim) {
      return zrUtil.clone(this._axesLayout[dim]);
    },
    findClosestAxisDim: function(point) {
      var axisDim;
      var minDist = Infinity;
      zrUtil.each(this._axesLayout, function(axisLayout, dim) {
        var localPoint = graphic.applyTransform(point, axisLayout.transform, true);
        var extent = this._axesMap[dim].getExtent();
        if (localPoint[0] < extent[0] || localPoint[0] > extent[1]) {
          return;
        }
        var dist = Math.abs(localPoint[1]);
        if (dist < minDist) {
          minDist = dist;
          axisDim = dim;
        }
      }, this);
      return axisDim;
    }
  };
  module.exports = Parallel;
})(require('process'));
