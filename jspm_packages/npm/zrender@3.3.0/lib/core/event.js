/* */ 
'use strict';
var Eventful = require('../mixin/Eventful');
var env = require('./env');
var isDomLevel2 = (typeof window !== 'undefined') && !!window.addEventListener;
function getBoundingClientRect(el) {
  return el.getBoundingClientRect ? el.getBoundingClientRect() : {
    left: 0,
    top: 0
  };
}
function clientToLocal(el, e, out, calculate) {
  out = out || {};
  if (calculate || !env.canvasSupported) {
    defaultGetZrXY(el, e, out);
  } else if (env.browser.firefox && e.layerX != null && e.layerX !== e.offsetX) {
    out.zrX = e.layerX;
    out.zrY = e.layerY;
  } else if (e.offsetX != null) {
    out.zrX = e.offsetX;
    out.zrY = e.offsetY;
  } else {
    defaultGetZrXY(el, e, out);
  }
  return out;
}
function defaultGetZrXY(el, e, out) {
  var box = getBoundingClientRect(el);
  out.zrX = e.clientX - box.left;
  out.zrY = e.clientY - box.top;
}
function normalizeEvent(el, e, calculate) {
  e = e || window.event;
  if (e.zrX != null) {
    return e;
  }
  var eventType = e.type;
  var isTouch = eventType && eventType.indexOf('touch') >= 0;
  if (!isTouch) {
    clientToLocal(el, e, e, calculate);
    e.zrDelta = (e.wheelDelta) ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
  } else {
    var touch = eventType != 'touchend' ? e.targetTouches[0] : e.changedTouches[0];
    touch && clientToLocal(el, touch, e, calculate);
  }
  return e;
}
function addEventListener(el, name, handler) {
  if (isDomLevel2) {
    el.addEventListener(name, handler);
  } else {
    el.attachEvent('on' + name, handler);
  }
}
function removeEventListener(el, name, handler) {
  if (isDomLevel2) {
    el.removeEventListener(name, handler);
  } else {
    el.detachEvent('on' + name, handler);
  }
}
var stop = isDomLevel2 ? function(e) {
  e.preventDefault();
  e.stopPropagation();
  e.cancelBubble = true;
} : function(e) {
  e.returnValue = false;
  e.cancelBubble = true;
};
module.exports = {
  clientToLocal: clientToLocal,
  normalizeEvent: normalizeEvent,
  addEventListener: addEventListener,
  removeEventListener: removeEventListener,
  stop: stop,
  Dispatcher: Eventful
};
