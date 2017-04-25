/* */ 
var Clip = require('./Clip');
var color = require('../tool/color');
var util = require('../core/util');
var isArrayLike = util.isArrayLike;
var arraySlice = Array.prototype.slice;
function defaultGetter(target, key) {
  return target[key];
}
function defaultSetter(target, key, value) {
  target[key] = value;
}
function interpolateNumber(p0, p1, percent) {
  return (p1 - p0) * percent + p0;
}
function interpolateString(p0, p1, percent) {
  return percent > 0.5 ? p1 : p0;
}
function interpolateArray(p0, p1, percent, out, arrDim) {
  var len = p0.length;
  if (arrDim == 1) {
    for (var i = 0; i < len; i++) {
      out[i] = interpolateNumber(p0[i], p1[i], percent);
    }
  } else {
    var len2 = p0[0].length;
    for (var i = 0; i < len; i++) {
      for (var j = 0; j < len2; j++) {
        out[i][j] = interpolateNumber(p0[i][j], p1[i][j], percent);
      }
    }
  }
}
function fillArr(arr0, arr1, arrDim) {
  var arr0Len = arr0.length;
  var arr1Len = arr1.length;
  if (arr0Len !== arr1Len) {
    var isPreviousLarger = arr0Len > arr1Len;
    if (isPreviousLarger) {
      arr0.length = arr1Len;
    } else {
      for (var i = arr0Len; i < arr1Len; i++) {
        arr0.push(arrDim === 1 ? arr1[i] : arraySlice.call(arr1[i]));
      }
    }
  }
  var len2 = arr0[0] && arr0[0].length;
  for (var i = 0; i < arr0.length; i++) {
    if (arrDim === 1) {
      if (isNaN(arr0[i])) {
        arr0[i] = arr1[i];
      }
    } else {
      for (var j = 0; j < len2; j++) {
        if (isNaN(arr0[i][j])) {
          arr0[i][j] = arr1[i][j];
        }
      }
    }
  }
}
function isArraySame(arr0, arr1, arrDim) {
  if (arr0 === arr1) {
    return true;
  }
  var len = arr0.length;
  if (len !== arr1.length) {
    return false;
  }
  if (arrDim === 1) {
    for (var i = 0; i < len; i++) {
      if (arr0[i] !== arr1[i]) {
        return false;
      }
    }
  } else {
    var len2 = arr0[0].length;
    for (var i = 0; i < len; i++) {
      for (var j = 0; j < len2; j++) {
        if (arr0[i][j] !== arr1[i][j]) {
          return false;
        }
      }
    }
  }
  return true;
}
function catmullRomInterpolateArray(p0, p1, p2, p3, t, t2, t3, out, arrDim) {
  var len = p0.length;
  if (arrDim == 1) {
    for (var i = 0; i < len; i++) {
      out[i] = catmullRomInterpolate(p0[i], p1[i], p2[i], p3[i], t, t2, t3);
    }
  } else {
    var len2 = p0[0].length;
    for (var i = 0; i < len; i++) {
      for (var j = 0; j < len2; j++) {
        out[i][j] = catmullRomInterpolate(p0[i][j], p1[i][j], p2[i][j], p3[i][j], t, t2, t3);
      }
    }
  }
}
function catmullRomInterpolate(p0, p1, p2, p3, t, t2, t3) {
  var v0 = (p2 - p0) * 0.5;
  var v1 = (p3 - p1) * 0.5;
  return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
}
function cloneValue(value) {
  if (isArrayLike(value)) {
    var len = value.length;
    if (isArrayLike(value[0])) {
      var ret = [];
      for (var i = 0; i < len; i++) {
        ret.push(arraySlice.call(value[i]));
      }
      return ret;
    }
    return arraySlice.call(value);
  }
  return value;
}
function rgba2String(rgba) {
  rgba[0] = Math.floor(rgba[0]);
  rgba[1] = Math.floor(rgba[1]);
  rgba[2] = Math.floor(rgba[2]);
  return 'rgba(' + rgba.join(',') + ')';
}
function createTrackClip(animator, easing, oneTrackDone, keyframes, propName) {
  var getter = animator._getter;
  var setter = animator._setter;
  var useSpline = easing === 'spline';
  var trackLen = keyframes.length;
  if (!trackLen) {
    return;
  }
  var firstVal = keyframes[0].value;
  var isValueArray = isArrayLike(firstVal);
  var isValueColor = false;
  var isValueString = false;
  var arrDim = (isValueArray && isArrayLike(firstVal[0])) ? 2 : 1;
  var trackMaxTime;
  keyframes.sort(function(a, b) {
    return a.time - b.time;
  });
  trackMaxTime = keyframes[trackLen - 1].time;
  var kfPercents = [];
  var kfValues = [];
  var prevValue = keyframes[0].value;
  var isAllValueEqual = true;
  for (var i = 0; i < trackLen; i++) {
    kfPercents.push(keyframes[i].time / trackMaxTime);
    var value = keyframes[i].value;
    if (!((isValueArray && isArraySame(value, prevValue, arrDim)) || (!isValueArray && value === prevValue))) {
      isAllValueEqual = false;
    }
    prevValue = value;
    if (typeof value == 'string') {
      var colorArray = color.parse(value);
      if (colorArray) {
        value = colorArray;
        isValueColor = true;
      } else {
        isValueString = true;
      }
    }
    kfValues.push(value);
  }
  if (isAllValueEqual) {
    return;
  }
  var lastValue = kfValues[trackLen - 1];
  for (var i = 0; i < trackLen - 1; i++) {
    if (isValueArray) {
      fillArr(kfValues[i], lastValue, arrDim);
    } else {
      if (isNaN(kfValues[i]) && !isNaN(lastValue) && !isValueString && !isValueColor) {
        kfValues[i] = lastValue;
      }
    }
  }
  isValueArray && fillArr(getter(animator._target, propName), lastValue, arrDim);
  var lastFrame = 0;
  var lastFramePercent = 0;
  var start;
  var w;
  var p0;
  var p1;
  var p2;
  var p3;
  if (isValueColor) {
    var rgba = [0, 0, 0, 0];
  }
  var onframe = function(target, percent) {
    var frame;
    if (percent < 0) {
      frame = 0;
    } else if (percent < lastFramePercent) {
      start = Math.min(lastFrame + 1, trackLen - 1);
      for (frame = start; frame >= 0; frame--) {
        if (kfPercents[frame] <= percent) {
          break;
        }
      }
      frame = Math.min(frame, trackLen - 2);
    } else {
      for (frame = lastFrame; frame < trackLen; frame++) {
        if (kfPercents[frame] > percent) {
          break;
        }
      }
      frame = Math.min(frame - 1, trackLen - 2);
    }
    lastFrame = frame;
    lastFramePercent = percent;
    var range = (kfPercents[frame + 1] - kfPercents[frame]);
    if (range === 0) {
      return;
    } else {
      w = (percent - kfPercents[frame]) / range;
    }
    if (useSpline) {
      p1 = kfValues[frame];
      p0 = kfValues[frame === 0 ? frame : frame - 1];
      p2 = kfValues[frame > trackLen - 2 ? trackLen - 1 : frame + 1];
      p3 = kfValues[frame > trackLen - 3 ? trackLen - 1 : frame + 2];
      if (isValueArray) {
        catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, getter(target, propName), arrDim);
      } else {
        var value;
        if (isValueColor) {
          value = catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, rgba, 1);
          value = rgba2String(rgba);
        } else if (isValueString) {
          return interpolateString(p1, p2, w);
        } else {
          value = catmullRomInterpolate(p0, p1, p2, p3, w, w * w, w * w * w);
        }
        setter(target, propName, value);
      }
    } else {
      if (isValueArray) {
        interpolateArray(kfValues[frame], kfValues[frame + 1], w, getter(target, propName), arrDim);
      } else {
        var value;
        if (isValueColor) {
          interpolateArray(kfValues[frame], kfValues[frame + 1], w, rgba, 1);
          value = rgba2String(rgba);
        } else if (isValueString) {
          return interpolateString(kfValues[frame], kfValues[frame + 1], w);
        } else {
          value = interpolateNumber(kfValues[frame], kfValues[frame + 1], w);
        }
        setter(target, propName, value);
      }
    }
  };
  var clip = new Clip({
    target: animator._target,
    life: trackMaxTime,
    loop: animator._loop,
    delay: animator._delay,
    onframe: onframe,
    ondestroy: oneTrackDone
  });
  if (easing && easing !== 'spline') {
    clip.easing = easing;
  }
  return clip;
}
var Animator = function(target, loop, getter, setter) {
  this._tracks = {};
  this._target = target;
  this._loop = loop || false;
  this._getter = getter || defaultGetter;
  this._setter = setter || defaultSetter;
  this._clipCount = 0;
  this._delay = 0;
  this._doneList = [];
  this._onframeList = [];
  this._clipList = [];
};
Animator.prototype = {
  when: function(time, props) {
    var tracks = this._tracks;
    for (var propName in props) {
      if (!props.hasOwnProperty(propName)) {
        continue;
      }
      if (!tracks[propName]) {
        tracks[propName] = [];
        var value = this._getter(this._target, propName);
        if (value == null) {
          continue;
        }
        if (time !== 0) {
          tracks[propName].push({
            time: 0,
            value: cloneValue(value)
          });
        }
      }
      tracks[propName].push({
        time: time,
        value: props[propName]
      });
    }
    return this;
  },
  during: function(callback) {
    this._onframeList.push(callback);
    return this;
  },
  _doneCallback: function() {
    this._tracks = {};
    this._clipList.length = 0;
    var doneList = this._doneList;
    var len = doneList.length;
    for (var i = 0; i < len; i++) {
      doneList[i].call(this);
    }
  },
  start: function(easing) {
    var self = this;
    var clipCount = 0;
    var oneTrackDone = function() {
      clipCount--;
      if (!clipCount) {
        self._doneCallback();
      }
    };
    var lastClip;
    for (var propName in this._tracks) {
      if (!this._tracks.hasOwnProperty(propName)) {
        continue;
      }
      var clip = createTrackClip(this, easing, oneTrackDone, this._tracks[propName], propName);
      if (clip) {
        this._clipList.push(clip);
        clipCount++;
        if (this.animation) {
          this.animation.addClip(clip);
        }
        lastClip = clip;
      }
    }
    if (lastClip) {
      var oldOnFrame = lastClip.onframe;
      lastClip.onframe = function(target, percent) {
        oldOnFrame(target, percent);
        for (var i = 0; i < self._onframeList.length; i++) {
          self._onframeList[i](target, percent);
        }
      };
    }
    if (!clipCount) {
      this._doneCallback();
    }
    return this;
  },
  stop: function(forwardToLast) {
    var clipList = this._clipList;
    var animation = this.animation;
    for (var i = 0; i < clipList.length; i++) {
      var clip = clipList[i];
      if (forwardToLast) {
        clip.onframe(this._target, 1);
      }
      animation && animation.removeClip(clip);
    }
    clipList.length = 0;
  },
  delay: function(time) {
    this._delay = time;
    return this;
  },
  done: function(cb) {
    if (cb) {
      this._doneList.push(cb);
    }
    return this;
  },
  getClips: function() {
    return this._clipList;
  }
};
module.exports = Animator;
