/* */ 
var OrdinalScale = require('../scale/Ordinal');
var IntervalScale = require('../scale/Interval');
require('../scale/Time');
require('../scale/Log');
var Scale = require('../scale/Scale');
var numberUtil = require('../util/number');
var zrUtil = require('zrender/lib/core/util');
var textContain = require('zrender/lib/contain/text');
var axisHelper = {};
axisHelper.getScaleExtent = function(axis, model) {
  var scale = axis.scale;
  var scaleType = scale.type;
  var min = model.getMin();
  var max = model.getMax();
  var fixMin = min != null;
  var fixMax = max != null;
  var originalExtent = scale.getExtent();
  var axisDataLen;
  var boundaryGap;
  var span;
  if (scaleType === 'ordinal') {
    axisDataLen = (model.get('data') || []).length;
  } else {
    boundaryGap = model.get('boundaryGap');
    if (!zrUtil.isArray(boundaryGap)) {
      boundaryGap = [boundaryGap || 0, boundaryGap || 0];
    }
    boundaryGap[0] = numberUtil.parsePercent(boundaryGap[0], 1);
    boundaryGap[1] = numberUtil.parsePercent(boundaryGap[1], 1);
    span = originalExtent[1] - originalExtent[0];
  }
  if (min == null) {
    min = scaleType === 'ordinal' ? (axisDataLen ? 0 : NaN) : originalExtent[0] - boundaryGap[0] * span;
  }
  if (max == null) {
    max = scaleType === 'ordinal' ? (axisDataLen ? axisDataLen - 1 : NaN) : originalExtent[1] + boundaryGap[1] * span;
  }
  if (min === 'dataMin') {
    min = originalExtent[0];
  }
  if (max === 'dataMax') {
    max = originalExtent[1];
  }
  (min == null || !isFinite(min)) && (min = NaN);
  (max == null || !isFinite(max)) && (max = NaN);
  axis.setBlank(zrUtil.eqNaN(min) || zrUtil.eqNaN(max));
  if (model.getNeedCrossZero()) {
    if (min > 0 && max > 0 && !fixMin) {
      min = 0;
    }
    if (min < 0 && max < 0 && !fixMax) {
      max = 0;
    }
  }
  return [min, max];
};
axisHelper.niceScaleExtent = function(axis, model) {
  var scale = axis.scale;
  var extent = axisHelper.getScaleExtent(axis, model);
  var fixMin = model.getMin() != null;
  var fixMax = model.getMax() != null;
  var splitNumber = model.get('splitNumber');
  if (scale.type === 'log') {
    scale.base = model.get('logBase');
  }
  scale.setExtent(extent[0], extent[1]);
  scale.niceExtent(splitNumber, fixMin, fixMax);
  var minInterval = model.get('minInterval');
  if (isFinite(minInterval) && !fixMin && !fixMax && scale.type === 'interval') {
    var interval = scale.getInterval();
    var intervalScale = Math.max(Math.abs(interval), minInterval) / interval;
    extent = scale.getExtent();
    var origin = (extent[1] + extent[0]) / 2;
    scale.setExtent(intervalScale * (extent[0] - origin) + origin, intervalScale * (extent[1] - origin) + origin);
    scale.niceExtent(splitNumber);
  }
  var interval = model.get('interval');
  if (interval != null) {
    scale.setInterval && scale.setInterval(interval);
  }
};
axisHelper.createScaleByModel = function(model, axisType) {
  axisType = axisType || model.get('type');
  if (axisType) {
    switch (axisType) {
      case 'category':
        return new OrdinalScale(model.getCategories(), [Infinity, -Infinity]);
      case 'value':
        return new IntervalScale();
      default:
        return (Scale.getClass(axisType) || IntervalScale).create(model);
    }
  }
};
axisHelper.ifAxisCrossZero = function(axis) {
  var dataExtent = axis.scale.getExtent();
  var min = dataExtent[0];
  var max = dataExtent[1];
  return !((min > 0 && max > 0) || (min < 0 && max < 0));
};
axisHelper.getAxisLabelInterval = function(tickCoords, labels, font, isAxisHorizontal) {
  var textSpaceTakenRect;
  var autoLabelInterval = 0;
  var accumulatedLabelInterval = 0;
  var step = 1;
  if (labels.length > 40) {
    step = Math.floor(labels.length / 40);
  }
  for (var i = 0; i < tickCoords.length; i += step) {
    var tickCoord = tickCoords[i];
    var rect = textContain.getBoundingRect(labels[i], font, 'center', 'top');
    rect[isAxisHorizontal ? 'x' : 'y'] += tickCoord;
    rect[isAxisHorizontal ? 'width' : 'height'] *= 1.3;
    if (!textSpaceTakenRect) {
      textSpaceTakenRect = rect.clone();
    } else if (textSpaceTakenRect.intersect(rect)) {
      accumulatedLabelInterval++;
      autoLabelInterval = Math.max(autoLabelInterval, accumulatedLabelInterval);
    } else {
      textSpaceTakenRect.union(rect);
      accumulatedLabelInterval = 0;
    }
  }
  if (autoLabelInterval === 0 && step > 1) {
    return step;
  }
  return (autoLabelInterval + 1) * step - 1;
};
axisHelper.getFormattedLabels = function(axis, labelFormatter) {
  var scale = axis.scale;
  var labels = scale.getTicksLabels();
  var ticks = scale.getTicks();
  if (typeof labelFormatter === 'string') {
    labelFormatter = (function(tpl) {
      return function(val) {
        return tpl.replace('{value}', val != null ? val : '');
      };
    })(labelFormatter);
    return zrUtil.map(labels, labelFormatter);
  } else if (typeof labelFormatter === 'function') {
    return zrUtil.map(ticks, function(tick, idx) {
      return labelFormatter(axis.type === 'category' ? scale.getLabel(tick) : tick, idx);
    }, this);
  } else {
    return labels;
  }
};
module.exports = axisHelper;
