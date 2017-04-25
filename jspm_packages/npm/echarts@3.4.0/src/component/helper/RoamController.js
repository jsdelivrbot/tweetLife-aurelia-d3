/* */ 
"format cjs";
define(function(require) {
  var Eventful = require('zrender/mixin/Eventful');
  var zrUtil = require('zrender/core/util');
  var eventTool = require('zrender/core/event');
  var interactionMutex = require('./interactionMutex');
  function mousedown(e) {
    if (e.target && e.target.draggable) {
      return;
    }
    var x = e.offsetX;
    var y = e.offsetY;
    if (this.containsPoint && this.containsPoint(x, y)) {
      this._x = x;
      this._y = y;
      this._dragging = true;
    }
  }
  function mousemove(e) {
    if (!this._dragging) {
      return;
    }
    eventTool.stop(e.event);
    if (e.gestureEvent !== 'pinch') {
      if (interactionMutex.isTaken(this._zr, 'globalPan')) {
        return;
      }
      var x = e.offsetX;
      var y = e.offsetY;
      var oldX = this._x;
      var oldY = this._y;
      var dx = x - oldX;
      var dy = y - oldY;
      this._x = x;
      this._y = y;
      var target = this.target;
      if (target) {
        var pos = target.position;
        pos[0] += dx;
        pos[1] += dy;
        target.dirty();
      }
      eventTool.stop(e.event);
      this.trigger('pan', dx, dy, oldX, oldY, x, y);
    }
  }
  function mouseup(e) {
    this._dragging = false;
  }
  function mousewheel(e) {
    var zoomDelta = e.wheelDelta > 0 ? 1.1 : 1 / 1.1;
    zoom.call(this, e, zoomDelta, e.offsetX, e.offsetY);
  }
  function pinch(e) {
    if (interactionMutex.isTaken(this._zr, 'globalPan')) {
      return;
    }
    var zoomDelta = e.pinchScale > 1 ? 1.1 : 1 / 1.1;
    zoom.call(this, e, zoomDelta, e.pinchX, e.pinchY);
  }
  function zoom(e, zoomDelta, zoomX, zoomY) {
    if (this.containsPoint && this.containsPoint(zoomX, zoomY)) {
      eventTool.stop(e.event);
      var target = this.target;
      var zoomLimit = this.zoomLimit;
      if (target) {
        var pos = target.position;
        var scale = target.scale;
        var newZoom = this.zoom = this.zoom || 1;
        newZoom *= zoomDelta;
        if (zoomLimit) {
          var zoomMin = zoomLimit.min || 0;
          var zoomMax = zoomLimit.max || Infinity;
          newZoom = Math.max(Math.min(zoomMax, newZoom), zoomMin);
        }
        var zoomScale = newZoom / this.zoom;
        this.zoom = newZoom;
        pos[0] -= (zoomX - pos[0]) * (zoomScale - 1);
        pos[1] -= (zoomY - pos[1]) * (zoomScale - 1);
        scale[0] *= zoomScale;
        scale[1] *= zoomScale;
        target.dirty();
      }
      this.trigger('zoom', zoomDelta, zoomX, zoomY);
    }
  }
  function RoamController(zr, target) {
    this.target = target;
    this.containsPoint;
    this.zoomLimit;
    this.zoom;
    this._zr = zr;
    var bind = zrUtil.bind;
    var mousedownHandler = bind(mousedown, this);
    var mousemoveHandler = bind(mousemove, this);
    var mouseupHandler = bind(mouseup, this);
    var mousewheelHandler = bind(mousewheel, this);
    var pinchHandler = bind(pinch, this);
    Eventful.call(this);
    this.setContainsPoint = function(containsPoint) {
      this.containsPoint = containsPoint;
    };
    this.enable = function(controlType) {
      this.disable();
      if (controlType == null) {
        controlType = true;
      }
      if (controlType === true || (controlType === 'move' || controlType === 'pan')) {
        zr.on('mousedown', mousedownHandler);
        zr.on('mousemove', mousemoveHandler);
        zr.on('mouseup', mouseupHandler);
      }
      if (controlType === true || (controlType === 'scale' || controlType === 'zoom')) {
        zr.on('mousewheel', mousewheelHandler);
        zr.on('pinch', pinchHandler);
      }
    };
    this.disable = function() {
      zr.off('mousedown', mousedownHandler);
      zr.off('mousemove', mousemoveHandler);
      zr.off('mouseup', mouseupHandler);
      zr.off('mousewheel', mousewheelHandler);
      zr.off('pinch', pinchHandler);
    };
    this.dispose = this.disable;
    this.isDragging = function() {
      return this._dragging;
    };
    this.isPinching = function() {
      return this._pinching;
    };
  }
  zrUtil.mixin(RoamController, Eventful);
  return RoamController;
});
