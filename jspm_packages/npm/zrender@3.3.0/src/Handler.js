/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var util = require('./core/util');
  var Draggable = require('./mixin/Draggable');
  var Eventful = require('./mixin/Eventful');
  function makeEventPacket(eveType, target, event) {
    return {
      type: eveType,
      event: event,
      target: target,
      cancelBubble: false,
      offsetX: event.zrX,
      offsetY: event.zrY,
      gestureEvent: event.gestureEvent,
      pinchX: event.pinchX,
      pinchY: event.pinchY,
      pinchScale: event.pinchScale,
      wheelDelta: event.zrDelta,
      zrByTouch: event.zrByTouch
    };
  }
  function EmptyProxy() {}
  EmptyProxy.prototype.dispose = function() {};
  var handlerNames = ['click', 'dblclick', 'mousewheel', 'mouseout', 'mouseup', 'mousedown', 'mousemove', 'contextmenu'];
  var Handler = function(storage, painter, proxy, painterRoot) {
    Eventful.call(this);
    this.storage = storage;
    this.painter = painter;
    this.painterRoot = painterRoot;
    proxy = proxy || new EmptyProxy();
    this.proxy = proxy;
    proxy.handler = this;
    this._hovered;
    this._lastTouchMoment;
    this._lastX;
    this._lastY;
    Draggable.call(this);
    util.each(handlerNames, function(name) {
      proxy.on && proxy.on(name, this[name], this);
    }, this);
  };
  Handler.prototype = {
    constructor: Handler,
    mousemove: function(event) {
      var x = event.zrX;
      var y = event.zrY;
      var hovered = this.findHover(x, y, null);
      var lastHovered = this._hovered;
      var proxy = this.proxy;
      this._hovered = hovered;
      proxy.setCursor && proxy.setCursor(hovered ? hovered.cursor : 'default');
      if (lastHovered && hovered !== lastHovered && lastHovered.__zr) {
        this.dispatchToElement(lastHovered, 'mouseout', event);
      }
      this.dispatchToElement(hovered, 'mousemove', event);
      if (hovered && hovered !== lastHovered) {
        this.dispatchToElement(hovered, 'mouseover', event);
      }
    },
    mouseout: function(event) {
      this.dispatchToElement(this._hovered, 'mouseout', event);
      var element = event.toElement || event.relatedTarget;
      var innerDom;
      do {
        element = element && element.parentNode;
      } while (element && element.nodeType != 9 && !(innerDom = element === this.painterRoot));
      !innerDom && this.trigger('globalout', {event: event});
    },
    resize: function(event) {
      this._hovered = null;
    },
    dispatch: function(eventName, eventArgs) {
      var handler = this[eventName];
      handler && handler.call(this, eventArgs);
    },
    dispose: function() {
      this.proxy.dispose();
      this.storage = this.proxy = this.painter = null;
    },
    setCursorStyle: function(cursorStyle) {
      var proxy = this.proxy;
      proxy.setCursor && proxy.setCursor(cursorStyle);
    },
    dispatchToElement: function(targetEl, eventName, event) {
      var eventHandler = 'on' + eventName;
      var eventPacket = makeEventPacket(eventName, targetEl, event);
      var el = targetEl;
      while (el) {
        el[eventHandler] && (eventPacket.cancelBubble = el[eventHandler].call(el, eventPacket));
        el.trigger(eventName, eventPacket);
        el = el.parent;
        if (eventPacket.cancelBubble) {
          break;
        }
      }
      if (!eventPacket.cancelBubble) {
        this.trigger(eventName, eventPacket);
        this.painter && this.painter.eachOtherLayer(function(layer) {
          if (typeof(layer[eventHandler]) == 'function') {
            layer[eventHandler].call(layer, eventPacket);
          }
          if (layer.trigger) {
            layer.trigger(eventName, eventPacket);
          }
        });
      }
    },
    findHover: function(x, y, exclude) {
      var list = this.storage.getDisplayList();
      for (var i = list.length - 1; i >= 0; i--) {
        if (!list[i].silent && list[i] !== exclude && !list[i].ignore && isHover(list[i], x, y)) {
          return list[i];
        }
      }
    }
  };
  util.each(['click', 'mousedown', 'mouseup', 'mousewheel', 'dblclick', 'contextmenu'], function(name) {
    Handler.prototype[name] = function(event) {
      var hovered = this.findHover(event.zrX, event.zrY, null);
      if (name === 'mousedown') {
        this._downel = hovered;
        this._upel = hovered;
      } else if (name === 'mosueup') {
        this._upel = hovered;
      } else if (name === 'click') {
        if (this._downel !== this._upel) {
          return;
        }
      }
      this.dispatchToElement(hovered, name, event);
    };
  });
  function isHover(displayable, x, y) {
    if (displayable[displayable.rectHover ? 'rectContain' : 'contain'](x, y)) {
      var el = displayable;
      while (el) {
        if (el.silent || (el.clipPath && !el.clipPath.contain(x, y))) {
          return false;
        }
        el = el.parent;
      }
      return true;
    }
    return false;
  }
  util.mixin(Handler, Eventful);
  util.mixin(Handler, Draggable);
  return Handler;
});
