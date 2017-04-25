/* */ 
"format cjs";
define(function(require) {
  var numberUtil = require('../util/number');
  var formatUtil = require('../util/format');
  var Scale = require('./Scale');
  var mathFloor = Math.floor;
  var mathCeil = Math.ceil;
  var getPrecisionSafe = numberUtil.getPrecisionSafe;
  var roundingErrorFix = numberUtil.round;
  var IntervalScale = Scale.extend({
    type: 'interval',
    _interval: 0,
    setExtent: function(start, end) {
      var thisExtent = this._extent;
      if (!isNaN(start)) {
        thisExtent[0] = parseFloat(start);
      }
      if (!isNaN(end)) {
        thisExtent[1] = parseFloat(end);
      }
    },
    unionExtent: function(other) {
      var extent = this._extent;
      other[0] < extent[0] && (extent[0] = other[0]);
      other[1] > extent[1] && (extent[1] = other[1]);
      IntervalScale.prototype.setExtent.call(this, extent[0], extent[1]);
    },
    getInterval: function() {
      if (!this._interval) {
        this.niceTicks();
      }
      return this._interval;
    },
    setInterval: function(interval) {
      this._interval = interval;
      this._niceExtent = this._extent.slice();
    },
    getTicks: function() {
      if (!this._interval) {
        this.niceTicks();
      }
      var interval = this._interval;
      var extent = this._extent;
      var ticks = [];
      var safeLimit = 10000;
      if (interval) {
        var niceExtent = this._niceExtent;
        var precision = getPrecisionSafe(interval) + 2;
        if (extent[0] < niceExtent[0]) {
          ticks.push(extent[0]);
        }
        var tick = niceExtent[0];
        while (tick <= niceExtent[1]) {
          ticks.push(tick);
          tick = roundingErrorFix(tick + interval, precision);
          if (ticks.length > safeLimit) {
            return [];
          }
        }
        if (extent[1] > (ticks.length ? ticks[ticks.length - 1] : niceExtent[1])) {
          ticks.push(extent[1]);
        }
      }
      return ticks;
    },
    getTicksLabels: function() {
      var labels = [];
      var ticks = this.getTicks();
      for (var i = 0; i < ticks.length; i++) {
        labels.push(this.getLabel(ticks[i]));
      }
      return labels;
    },
    getLabel: function(data) {
      return formatUtil.addCommas(data);
    },
    niceTicks: function(splitNumber) {
      splitNumber = splitNumber || 5;
      var extent = this._extent;
      var span = extent[1] - extent[0];
      if (!isFinite(span)) {
        return;
      }
      if (span < 0) {
        span = -span;
        extent.reverse();
      }
      var step = roundingErrorFix(numberUtil.nice(span / splitNumber, true), Math.max(getPrecisionSafe(extent[0]), getPrecisionSafe(extent[1])) + 2);
      var precision = getPrecisionSafe(step) + 2;
      var niceExtent = [roundingErrorFix(mathCeil(extent[0] / step) * step, precision), roundingErrorFix(mathFloor(extent[1] / step) * step, precision)];
      this._interval = step;
      this._niceExtent = niceExtent;
    },
    niceExtent: function(splitNumber, fixMin, fixMax) {
      var extent = this._extent;
      if (extent[0] === extent[1]) {
        if (extent[0] !== 0) {
          var expandSize = extent[0];
          if (!fixMax) {
            extent[1] += expandSize / 2;
            extent[0] -= expandSize / 2;
          } else {
            extent[0] -= expandSize / 2;
          }
        } else {
          extent[1] = 1;
        }
      }
      var span = extent[1] - extent[0];
      if (!isFinite(span)) {
        extent[0] = 0;
        extent[1] = 1;
      }
      this.niceTicks(splitNumber);
      var interval = this._interval;
      if (!fixMin) {
        extent[0] = roundingErrorFix(mathFloor(extent[0] / interval) * interval);
      }
      if (!fixMax) {
        extent[1] = roundingErrorFix(mathCeil(extent[1] / interval) * interval);
      }
    }
  });
  IntervalScale.create = function() {
    return new IntervalScale();
  };
  return IntervalScale;
});
