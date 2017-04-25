/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var numberUtil = require('../util/number');
  var formatUtil = require('../util/format');
  var IntervalScale = require('./Interval');
  var intervalScaleProto = IntervalScale.prototype;
  var mathCeil = Math.ceil;
  var mathFloor = Math.floor;
  var ONE_SECOND = 1000;
  var ONE_MINUTE = ONE_SECOND * 60;
  var ONE_HOUR = ONE_MINUTE * 60;
  var ONE_DAY = ONE_HOUR * 24;
  var bisect = function(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid][2] < x) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  };
  var TimeScale = IntervalScale.extend({
    type: 'time',
    getLabel: function(val) {
      var stepLvl = this._stepLvl;
      var date = new Date(val);
      return formatUtil.formatTime(stepLvl[0], date);
    },
    niceExtent: function(approxTickNum, fixMin, fixMax) {
      var extent = this._extent;
      if (extent[0] === extent[1]) {
        extent[0] -= ONE_DAY;
        extent[1] += ONE_DAY;
      }
      if (extent[1] === -Infinity && extent[0] === Infinity) {
        var d = new Date();
        extent[1] = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        extent[0] = extent[1] - ONE_DAY;
      }
      this.niceTicks(approxTickNum);
      var interval = this._interval;
      if (!fixMin) {
        extent[0] = numberUtil.round(mathFloor(extent[0] / interval) * interval);
      }
      if (!fixMax) {
        extent[1] = numberUtil.round(mathCeil(extent[1] / interval) * interval);
      }
    },
    niceTicks: function(approxTickNum) {
      approxTickNum = approxTickNum || 10;
      var extent = this._extent;
      var span = extent[1] - extent[0];
      var approxInterval = span / approxTickNum;
      var scaleLevelsLen = scaleLevels.length;
      var idx = bisect(scaleLevels, approxInterval, 0, scaleLevelsLen);
      var level = scaleLevels[Math.min(idx, scaleLevelsLen - 1)];
      var interval = level[2];
      if (level[0] === 'year') {
        var yearSpan = span / interval;
        var yearStep = numberUtil.nice(yearSpan / approxTickNum, true);
        interval *= yearStep;
      }
      var niceExtent = [mathCeil(extent[0] / interval) * interval, mathFloor(extent[1] / interval) * interval];
      this._stepLvl = level;
      this._interval = interval;
      this._niceExtent = niceExtent;
    },
    parse: function(val) {
      return +numberUtil.parseDate(val);
    }
  });
  zrUtil.each(['contain', 'normalize'], function(methodName) {
    TimeScale.prototype[methodName] = function(val) {
      return intervalScaleProto[methodName].call(this, this.parse(val));
    };
  });
  var scaleLevels = [['hh:mm:ss', 1, ONE_SECOND], ['hh:mm:ss', 5, ONE_SECOND * 5], ['hh:mm:ss', 10, ONE_SECOND * 10], ['hh:mm:ss', 15, ONE_SECOND * 15], ['hh:mm:ss', 30, ONE_SECOND * 30], ['hh:mm\nMM-dd', 1, ONE_MINUTE], ['hh:mm\nMM-dd', 5, ONE_MINUTE * 5], ['hh:mm\nMM-dd', 10, ONE_MINUTE * 10], ['hh:mm\nMM-dd', 15, ONE_MINUTE * 15], ['hh:mm\nMM-dd', 30, ONE_MINUTE * 30], ['hh:mm\nMM-dd', 1, ONE_HOUR], ['hh:mm\nMM-dd', 2, ONE_HOUR * 2], ['hh:mm\nMM-dd', 6, ONE_HOUR * 6], ['hh:mm\nMM-dd', 12, ONE_HOUR * 12], ['MM-dd\nyyyy', 1, ONE_DAY], ['week', 7, ONE_DAY * 7], ['month', 1, ONE_DAY * 31], ['quarter', 3, ONE_DAY * 380 / 4], ['half-year', 6, ONE_DAY * 380 / 2], ['year', 1, ONE_DAY * 380]];
  TimeScale.create = function() {
    return new TimeScale();
  };
  return TimeScale;
});
