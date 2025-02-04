/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var Scale = require('./Scale');
  var numberUtil = require('../util/number');
  var IntervalScale = require('./Interval');
  var scaleProto = Scale.prototype;
  var intervalScaleProto = IntervalScale.prototype;
  var getPrecisionSafe = numberUtil.getPrecisionSafe;
  var roundingErrorFix = numberUtil.round;
  var mathFloor = Math.floor;
  var mathCeil = Math.ceil;
  var mathPow = Math.pow;
  var mathLog = Math.log;
  var LogScale = Scale.extend({
    type: 'log',
    base: 10,
    $constructor: function() {
      Scale.apply(this, arguments);
      this._originalScale = new IntervalScale();
    },
    getTicks: function() {
      var originalScale = this._originalScale;
      var extent = this._extent;
      var originalExtent = originalScale.getExtent();
      return zrUtil.map(intervalScaleProto.getTicks.call(this), function(val) {
        var powVal = numberUtil.round(mathPow(this.base, val));
        powVal = (val === extent[0] && originalScale.__fixMin) ? fixRoundingError(powVal, originalExtent[0]) : powVal;
        powVal = (val === extent[1] && originalScale.__fixMax) ? fixRoundingError(powVal, originalExtent[1]) : powVal;
        return powVal;
      }, this);
    },
    getLabel: intervalScaleProto.getLabel,
    scale: function(val) {
      val = scaleProto.scale.call(this, val);
      return mathPow(this.base, val);
    },
    setExtent: function(start, end) {
      var base = this.base;
      start = mathLog(start) / mathLog(base);
      end = mathLog(end) / mathLog(base);
      intervalScaleProto.setExtent.call(this, start, end);
    },
    getExtent: function() {
      var base = this.base;
      var extent = scaleProto.getExtent.call(this);
      extent[0] = mathPow(base, extent[0]);
      extent[1] = mathPow(base, extent[1]);
      var originalScale = this._originalScale;
      var originalExtent = originalScale.getExtent();
      originalScale.__fixMin && (extent[0] = fixRoundingError(extent[0], originalExtent[0]));
      originalScale.__fixMax && (extent[1] = fixRoundingError(extent[1], originalExtent[1]));
      return extent;
    },
    unionExtent: function(extent) {
      this._originalScale.unionExtent(extent);
      var base = this.base;
      extent[0] = mathLog(extent[0]) / mathLog(base);
      extent[1] = mathLog(extent[1]) / mathLog(base);
      scaleProto.unionExtent.call(this, extent);
    },
    unionExtentFromData: function(data, dim) {
      this.unionExtent(data.getDataExtent(dim, true, function(val) {
        return val > 0;
      }));
    },
    niceTicks: function(approxTickNum) {
      approxTickNum = approxTickNum || 10;
      var extent = this._extent;
      var span = extent[1] - extent[0];
      if (span === Infinity || span <= 0) {
        return;
      }
      var interval = numberUtil.quantity(span);
      var err = approxTickNum / span * interval;
      if (err <= 0.5) {
        interval *= 10;
      }
      while (!isNaN(interval) && Math.abs(interval) < 1 && Math.abs(interval) > 0) {
        interval *= 10;
      }
      var niceExtent = [numberUtil.round(mathCeil(extent[0] / interval) * interval), numberUtil.round(mathFloor(extent[1] / interval) * interval)];
      this._interval = interval;
      this._niceExtent = niceExtent;
    },
    niceExtent: function(splitNumber, fixMin, fixMax) {
      intervalScaleProto.niceExtent.call(this, splitNumber, fixMin, fixMax);
      var originalScale = this._originalScale;
      originalScale.__fixMin = fixMin;
      originalScale.__fixMax = fixMax;
    }
  });
  zrUtil.each(['contain', 'normalize'], function(methodName) {
    LogScale.prototype[methodName] = function(val) {
      val = mathLog(val) / mathLog(this.base);
      return scaleProto[methodName].call(this, val);
    };
  });
  LogScale.create = function() {
    return new LogScale();
  };
  function fixRoundingError(val, originalVal) {
    return roundingErrorFix(val, getPrecisionSafe(originalVal));
  }
  return LogScale;
});
