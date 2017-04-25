/* */ 
var zrUtil = require('zrender/lib/core/util');
var IndicatorAxis = require('./IndicatorAxis');
var IntervalScale = require('../../scale/Interval');
var numberUtil = require('../../util/number');
var axisHelper = require('../axisHelper');
function Radar(radarModel, ecModel, api) {
  this._model = radarModel;
  this.dimensions = [];
  this._indicatorAxes = zrUtil.map(radarModel.getIndicatorModels(), function(indicatorModel, idx) {
    var dim = 'indicator_' + idx;
    var indicatorAxis = new IndicatorAxis(dim, new IntervalScale());
    indicatorAxis.name = indicatorModel.get('name');
    indicatorAxis.model = indicatorModel;
    indicatorModel.axis = indicatorAxis;
    this.dimensions.push(dim);
    return indicatorAxis;
  }, this);
  this.resize(radarModel, api);
  this.cx;
  this.cy;
  this.r;
  this.startAngle;
}
Radar.prototype.getIndicatorAxes = function() {
  return this._indicatorAxes;
};
Radar.prototype.dataToPoint = function(value, indicatorIndex) {
  var indicatorAxis = this._indicatorAxes[indicatorIndex];
  return this.coordToPoint(indicatorAxis.dataToCoord(value), indicatorIndex);
};
Radar.prototype.coordToPoint = function(coord, indicatorIndex) {
  var indicatorAxis = this._indicatorAxes[indicatorIndex];
  var angle = indicatorAxis.angle;
  var x = this.cx + coord * Math.cos(angle);
  var y = this.cy - coord * Math.sin(angle);
  return [x, y];
};
Radar.prototype.pointToData = function(pt) {
  var dx = pt[0] - this.cx;
  var dy = pt[1] - this.cy;
  var radius = Math.sqrt(dx * dx + dy * dy);
  dx /= radius;
  dy /= radius;
  var radian = Math.atan2(-dy, dx);
  var minRadianDiff = Infinity;
  var closestAxis;
  var closestAxisIdx = -1;
  for (var i = 0; i < this._indicatorAxes.length; i++) {
    var indicatorAxis = this._indicatorAxes[i];
    var diff = Math.abs(radian - indicatorAxis.angle);
    if (diff < minRadianDiff) {
      closestAxis = indicatorAxis;
      closestAxisIdx = i;
      minRadianDiff = diff;
    }
  }
  return [closestAxisIdx, +(closestAxis && closestAxis.coodToData(radius))];
};
Radar.prototype.resize = function(radarModel, api) {
  var center = radarModel.get('center');
  var viewWidth = api.getWidth();
  var viewHeight = api.getHeight();
  var viewSize = Math.min(viewWidth, viewHeight) / 2;
  this.cx = numberUtil.parsePercent(center[0], viewWidth);
  this.cy = numberUtil.parsePercent(center[1], viewHeight);
  this.startAngle = radarModel.get('startAngle') * Math.PI / 180;
  this.r = numberUtil.parsePercent(radarModel.get('radius'), viewSize);
  zrUtil.each(this._indicatorAxes, function(indicatorAxis, idx) {
    indicatorAxis.setExtent(0, this.r);
    var angle = (this.startAngle + idx * Math.PI * 2 / this._indicatorAxes.length);
    angle = Math.atan2(Math.sin(angle), Math.cos(angle));
    indicatorAxis.angle = angle;
  }, this);
};
Radar.prototype.update = function(ecModel, api) {
  var indicatorAxes = this._indicatorAxes;
  var radarModel = this._model;
  zrUtil.each(indicatorAxes, function(indicatorAxis) {
    indicatorAxis.scale.setExtent(Infinity, -Infinity);
  });
  ecModel.eachSeriesByType('radar', function(radarSeries, idx) {
    if (radarSeries.get('coordinateSystem') !== 'radar' || ecModel.getComponent('radar', radarSeries.get('radarIndex')) !== radarModel) {
      return;
    }
    var data = radarSeries.getData();
    zrUtil.each(indicatorAxes, function(indicatorAxis) {
      indicatorAxis.scale.unionExtentFromData(data, indicatorAxis.dim);
    });
  }, this);
  var splitNumber = radarModel.get('splitNumber');
  function increaseInterval(interval) {
    var exp10 = Math.pow(10, Math.floor(Math.log(interval) / Math.LN10));
    var f = interval / exp10;
    if (f === 2) {
      f = 5;
    } else {
      f *= 2;
    }
    return f * exp10;
  }
  zrUtil.each(indicatorAxes, function(indicatorAxis, idx) {
    var rawExtent = axisHelper.getScaleExtent(indicatorAxis, indicatorAxis.model);
    axisHelper.niceScaleExtent(indicatorAxis, indicatorAxis.model);
    var axisModel = indicatorAxis.model;
    var scale = indicatorAxis.scale;
    var fixedMin = axisModel.getMin();
    var fixedMax = axisModel.getMax();
    var interval = scale.getInterval();
    if (fixedMin != null && fixedMax != null) {
      scale.setInterval((fixedMax - fixedMin) / splitNumber);
    } else if (fixedMin != null) {
      var max;
      do {
        max = fixedMin + interval * splitNumber;
        scale.setExtent(+fixedMin, max);
        scale.setInterval(interval);
        interval = increaseInterval(interval);
      } while (max < rawExtent[1] && isFinite(max) && isFinite(rawExtent[1]));
    } else if (fixedMax != null) {
      var min;
      do {
        min = fixedMax - interval * splitNumber;
        scale.setExtent(min, +fixedMax);
        scale.setInterval(interval);
        interval = increaseInterval(interval);
      } while (min > rawExtent[0] && isFinite(min) && isFinite(rawExtent[0]));
    } else {
      var nicedSplitNumber = scale.getTicks().length - 1;
      if (nicedSplitNumber > splitNumber) {
        interval = increaseInterval(interval);
      }
      var center = Math.round((rawExtent[0] + rawExtent[1]) / 2 / interval) * interval;
      var halfSplitNumber = Math.round(splitNumber / 2);
      scale.setExtent(numberUtil.round(center - halfSplitNumber * interval), numberUtil.round(center + (splitNumber - halfSplitNumber) * interval));
      scale.setInterval(interval);
    }
  });
};
Radar.dimensions = [];
Radar.create = function(ecModel, api) {
  var radarList = [];
  ecModel.eachComponent('radar', function(radarModel) {
    var radar = new Radar(radarModel, ecModel, api);
    radarList.push(radar);
    radarModel.coordinateSystem = radar;
  });
  ecModel.eachSeriesByType('radar', function(radarSeries) {
    if (radarSeries.get('coordinateSystem') === 'radar') {
      radarSeries.coordinateSystem = radarList[radarSeries.get('radarIndex') || 0];
    }
  });
  return radarList;
};
require('../../CoordinateSystem').register('radar', Radar);
module.exports = Radar;
