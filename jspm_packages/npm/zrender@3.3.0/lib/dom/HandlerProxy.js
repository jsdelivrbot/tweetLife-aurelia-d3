/* */ 
(function(process) {
  var eventTool = require('../core/event');
  var zrUtil = require('../core/util');
  var Eventful = require('../mixin/Eventful');
  var env = require('../core/env');
  var GestureMgr = require('../core/GestureMgr');
  var addEventListener = eventTool.addEventListener;
  var removeEventListener = eventTool.removeEventListener;
  var normalizeEvent = eventTool.normalizeEvent;
  var TOUCH_CLICK_DELAY = 300;
  var mouseHandlerNames = ['click', 'dblclick', 'mousewheel', 'mouseout', 'mouseup', 'mousedown', 'mousemove', 'contextmenu'];
  var touchHandlerNames = ['touchstart', 'touchend', 'touchmove'];
  var pointerEventNames = {
    pointerdown: 1,
    pointerup: 1,
    pointermove: 1,
    pointerout: 1
  };
  var pointerHandlerNames = zrUtil.map(mouseHandlerNames, function(name) {
    var nm = name.replace('mouse', 'pointer');
    return pointerEventNames[nm] ? nm : name;
  });
  function eventNameFix(name) {
    return (name === 'mousewheel' && env.browser.firefox) ? 'DOMMouseScroll' : name;
  }
  function processGesture(proxy, event, stage) {
    var gestureMgr = proxy._gestureMgr;
    stage === 'start' && gestureMgr.clear();
    var gestureInfo = gestureMgr.recognize(event, proxy.handler.findHover(event.zrX, event.zrY, null), proxy.dom);
    stage === 'end' && gestureMgr.clear();
    if (gestureInfo) {
      var type = gestureInfo.type;
      event.gestureEvent = type;
      proxy.handler.dispatchToElement(gestureInfo.target, type, gestureInfo.event);
    }
  }
  function setTouchTimer(instance) {
    instance._touching = true;
    clearTimeout(instance._touchTimer);
    instance._touchTimer = setTimeout(function() {
      instance._touching = false;
    }, 700);
  }
  var domHandlers = {
    mousemove: function(event) {
      event = normalizeEvent(this.dom, event);
      this.trigger('mousemove', event);
    },
    mouseout: function(event) {
      event = normalizeEvent(this.dom, event);
      var element = event.toElement || event.relatedTarget;
      if (element != this.dom) {
        while (element && element.nodeType != 9) {
          if (element === this.dom) {
            return;
          }
          element = element.parentNode;
        }
      }
      this.trigger('mouseout', event);
    },
    touchstart: function(event) {
      event = normalizeEvent(this.dom, event);
      event.zrByTouch = true;
      this._lastTouchMoment = new Date();
      processGesture(this, event, 'start');
      domHandlers.mousemove.call(this, event);
      domHandlers.mousedown.call(this, event);
      setTouchTimer(this);
    },
    touchmove: function(event) {
      event = normalizeEvent(this.dom, event);
      event.zrByTouch = true;
      processGesture(this, event, 'change');
      domHandlers.mousemove.call(this, event);
      setTouchTimer(this);
    },
    touchend: function(event) {
      event = normalizeEvent(this.dom, event);
      event.zrByTouch = true;
      processGesture(this, event, 'end');
      domHandlers.mouseup.call(this, event);
      if (+new Date() - this._lastTouchMoment < TOUCH_CLICK_DELAY) {
        domHandlers.click.call(this, event);
      }
      setTouchTimer(this);
    },
    pointerdown: function(event) {
      domHandlers.mousedown.call(this, event);
    },
    pointermove: function(event) {
      if (!isPointerFromTouch(event)) {
        domHandlers.mousemove.call(this, event);
      }
    },
    pointerup: function(event) {
      domHandlers.mouseup.call(this, event);
    },
    pointerout: function(event) {
      if (!isPointerFromTouch(event)) {
        domHandlers.mouseout.call(this, event);
      }
    }
  };
  function isPointerFromTouch(event) {
    var pointerType = event.pointerType;
    return pointerType === 'pen' || pointerType === 'touch';
  }
  zrUtil.each(['click', 'mousedown', 'mouseup', 'mousewheel', 'dblclick', 'contextmenu'], function(name) {
    domHandlers[name] = function(event) {
      event = normalizeEvent(this.dom, event);
      this.trigger(name, event);
    };
  });
  function initDomHandler(instance) {
    zrUtil.each(touchHandlerNames, function(name) {
      instance._handlers[name] = zrUtil.bind(domHandlers[name], instance);
    });
    zrUtil.each(pointerHandlerNames, function(name) {
      instance._handlers[name] = zrUtil.bind(domHandlers[name], instance);
    });
    zrUtil.each(mouseHandlerNames, function(name) {
      instance._handlers[name] = makeMouseHandler(domHandlers[name], instance);
    });
    function makeMouseHandler(fn, instance) {
      return function() {
        if (instance._touching) {
          return;
        }
        return fn.apply(instance, arguments);
      };
    }
  }
  function HandlerDomProxy(dom) {
    Eventful.call(this);
    this.dom = dom;
    this._touching = false;
    this._touchTimer;
    this._gestureMgr = new GestureMgr();
    this._handlers = {};
    initDomHandler(this);
    if (env.pointerEventsSupported) {
      mountHandlers(pointerHandlerNames, this);
    } else {
      if (env.touchEventsSupported) {
        mountHandlers(touchHandlerNames, this);
      }
      mountHandlers(mouseHandlerNames, this);
    }
    function mountHandlers(handlerNames, instance) {
      zrUtil.each(handlerNames, function(name) {
        addEventListener(dom, eventNameFix(name), instance._handlers[name]);
      }, instance);
    }
  }
  var handlerDomProxyProto = HandlerDomProxy.prototype;
  handlerDomProxyProto.dispose = function() {
    var handlerNames = mouseHandlerNames.concat(touchHandlerNames);
    for (var i = 0; i < handlerNames.length; i++) {
      var name = handlerNames[i];
      removeEventListener(this.dom, eventNameFix(name), this._handlers[name]);
    }
  };
  handlerDomProxyProto.setCursor = function(cursorStyle) {
    this.dom.style.cursor = cursorStyle || 'default';
  };
  zrUtil.mixin(HandlerDomProxy, Eventful);
  module.exports = HandlerDomProxy;
})(require('process'));
