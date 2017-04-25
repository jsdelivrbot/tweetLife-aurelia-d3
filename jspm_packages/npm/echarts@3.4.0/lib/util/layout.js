/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var BoundingRect = require('zrender/lib/core/BoundingRect');
var numberUtil = require('./number');
var formatUtil = require('./format');
var parsePercent = numberUtil.parsePercent;
var each = zrUtil.each;
var layout = {};
var LOCATION_PARAMS = layout.LOCATION_PARAMS = ['left', 'right', 'top', 'bottom', 'width', 'height'];
function boxLayout(orient, group, gap, maxWidth, maxHeight) {
  var x = 0;
  var y = 0;
  if (maxWidth == null) {
    maxWidth = Infinity;
  }
  if (maxHeight == null) {
    maxHeight = Infinity;
  }
  var currentLineMaxSize = 0;
  group.eachChild(function(child, idx) {
    var position = child.position;
    var rect = child.getBoundingRect();
    var nextChild = group.childAt(idx + 1);
    var nextChildRect = nextChild && nextChild.getBoundingRect();
    var nextX;
    var nextY;
    if (orient === 'horizontal') {
      var moveX = rect.width + (nextChildRect ? (-nextChildRect.x + rect.x) : 0);
      nextX = x + moveX;
      if (nextX > maxWidth || child.newline) {
        x = 0;
        nextX = moveX;
        y += currentLineMaxSize + gap;
        currentLineMaxSize = rect.height;
      } else {
        currentLineMaxSize = Math.max(currentLineMaxSize, rect.height);
      }
    } else {
      var moveY = rect.height + (nextChildRect ? (-nextChildRect.y + rect.y) : 0);
      nextY = y + moveY;
      if (nextY > maxHeight || child.newline) {
        x += currentLineMaxSize + gap;
        y = 0;
        nextY = moveY;
        currentLineMaxSize = rect.width;
      } else {
        currentLineMaxSize = Math.max(currentLineMaxSize, rect.width);
      }
    }
    if (child.newline) {
      return;
    }
    position[0] = x;
    position[1] = y;
    orient === 'horizontal' ? (x = nextX + gap) : (y = nextY + gap);
  });
}
layout.box = boxLayout;
layout.vbox = zrUtil.curry(boxLayout, 'vertical');
layout.hbox = zrUtil.curry(boxLayout, 'horizontal');
layout.getAvailableSize = function(positionInfo, containerRect, margin) {
  var containerWidth = containerRect.width;
  var containerHeight = containerRect.height;
  var x = parsePercent(positionInfo.x, containerWidth);
  var y = parsePercent(positionInfo.y, containerHeight);
  var x2 = parsePercent(positionInfo.x2, containerWidth);
  var y2 = parsePercent(positionInfo.y2, containerHeight);
  (isNaN(x) || isNaN(parseFloat(positionInfo.x))) && (x = 0);
  (isNaN(x2) || isNaN(parseFloat(positionInfo.x2))) && (x2 = containerWidth);
  (isNaN(y) || isNaN(parseFloat(positionInfo.y))) && (y = 0);
  (isNaN(y2) || isNaN(parseFloat(positionInfo.y2))) && (y2 = containerHeight);
  margin = formatUtil.normalizeCssArray(margin || 0);
  return {
    width: Math.max(x2 - x - margin[1] - margin[3], 0),
    height: Math.max(y2 - y - margin[0] - margin[2], 0)
  };
};
layout.getLayoutRect = function(positionInfo, containerRect, margin) {
  margin = formatUtil.normalizeCssArray(margin || 0);
  var containerWidth = containerRect.width;
  var containerHeight = containerRect.height;
  var left = parsePercent(positionInfo.left, containerWidth);
  var top = parsePercent(positionInfo.top, containerHeight);
  var right = parsePercent(positionInfo.right, containerWidth);
  var bottom = parsePercent(positionInfo.bottom, containerHeight);
  var width = parsePercent(positionInfo.width, containerWidth);
  var height = parsePercent(positionInfo.height, containerHeight);
  var verticalMargin = margin[2] + margin[0];
  var horizontalMargin = margin[1] + margin[3];
  var aspect = positionInfo.aspect;
  if (isNaN(width)) {
    width = containerWidth - right - horizontalMargin - left;
  }
  if (isNaN(height)) {
    height = containerHeight - bottom - verticalMargin - top;
  }
  if (isNaN(width) && isNaN(height)) {
    if (aspect > containerWidth / containerHeight) {
      width = containerWidth * 0.8;
    } else {
      height = containerHeight * 0.8;
    }
  }
  if (aspect != null) {
    if (isNaN(width)) {
      width = aspect * height;
    }
    if (isNaN(height)) {
      height = width / aspect;
    }
  }
  if (isNaN(left)) {
    left = containerWidth - right - width - horizontalMargin;
  }
  if (isNaN(top)) {
    top = containerHeight - bottom - height - verticalMargin;
  }
  switch (positionInfo.left || positionInfo.right) {
    case 'center':
      left = containerWidth / 2 - width / 2 - margin[3];
      break;
    case 'right':
      left = containerWidth - width - horizontalMargin;
      break;
  }
  switch (positionInfo.top || positionInfo.bottom) {
    case 'middle':
    case 'center':
      top = containerHeight / 2 - height / 2 - margin[0];
      break;
    case 'bottom':
      top = containerHeight - height - verticalMargin;
      break;
  }
  left = left || 0;
  top = top || 0;
  if (isNaN(width)) {
    width = containerWidth - left - (right || 0);
  }
  if (isNaN(height)) {
    height = containerHeight - top - (bottom || 0);
  }
  var rect = new BoundingRect(left + margin[3], top + margin[0], width, height);
  rect.margin = margin;
  return rect;
};
layout.positionElement = function(el, positionInfo, containerRect, margin, opt) {
  var h = !opt || !opt.hv || opt.hv[0];
  var v = !opt || !opt.hv || opt.hv[1];
  var boundingMode = opt && opt.boundingMode || 'all';
  if (!h && !v) {
    return;
  }
  var rect;
  if (boundingMode === 'raw') {
    rect = el.type === 'group' ? new BoundingRect(0, 0, +positionInfo.width || 0, +positionInfo.height || 0) : el.getBoundingRect();
  } else {
    rect = el.getBoundingRect();
    if (el.needLocalTransform()) {
      var transform = el.getLocalTransform();
      rect = rect.clone();
      rect.applyTransform(transform);
    }
  }
  positionInfo = layout.getLayoutRect(zrUtil.defaults({
    width: rect.width,
    height: rect.height
  }, positionInfo), containerRect, margin);
  var elPos = el.position;
  var dx = h ? positionInfo.x - rect.x : 0;
  var dy = v ? positionInfo.y - rect.y : 0;
  el.attr('position', boundingMode === 'raw' ? [dx, dy] : [elPos[0] + dx, elPos[1] + dy]);
};
layout.mergeLayoutParam = function(targetOption, newOption, opt) {
  !zrUtil.isObject(opt) && (opt = {});
  var hNames = ['width', 'left', 'right'];
  var vNames = ['height', 'top', 'bottom'];
  var hResult = merge(hNames);
  var vResult = merge(vNames);
  copy(hNames, targetOption, hResult);
  copy(vNames, targetOption, vResult);
  function merge(names) {
    var newParams = {};
    var newValueCount = 0;
    var merged = {};
    var mergedValueCount = 0;
    var enoughParamNumber = opt.ignoreSize ? 1 : 2;
    each(names, function(name) {
      merged[name] = targetOption[name];
    });
    each(names, function(name) {
      hasProp(newOption, name) && (newParams[name] = merged[name] = newOption[name]);
      hasValue(newParams, name) && newValueCount++;
      hasValue(merged, name) && mergedValueCount++;
    });
    if (mergedValueCount === enoughParamNumber || !newValueCount) {
      return merged;
    } else if (newValueCount >= enoughParamNumber) {
      return newParams;
    } else {
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (!hasProp(newParams, name) && hasProp(targetOption, name)) {
          newParams[name] = targetOption[name];
          break;
        }
      }
      return newParams;
    }
  }
  function hasProp(obj, name) {
    return obj.hasOwnProperty(name);
  }
  function hasValue(obj, name) {
    return obj[name] != null && obj[name] !== 'auto';
  }
  function copy(names, target, source) {
    each(names, function(name) {
      target[name] = source[name];
    });
  }
};
layout.getLayoutParams = function(source) {
  return layout.copyLayoutParams({}, source);
};
layout.copyLayoutParams = function(target, source) {
  source && target && each(LOCATION_PARAMS, function(name) {
    source.hasOwnProperty(name) && (target[name] = source[name]);
  });
  return target;
};
module.exports = layout;
