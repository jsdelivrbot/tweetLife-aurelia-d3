/* */ 
var Eventful = require('zrender/lib/mixin/Eventful');
var zrUtil = require('zrender/lib/core/util');
var graphic = require('../../util/graphic');
var bind = zrUtil.bind;
var each = zrUtil.each;
var mathMin = Math.min;
var mathMax = Math.max;
var mathPow = Math.pow;
var COVER_Z = 10000;
var UNSELECT_THRESHOLD = 2;
var EVENTS = ['mousedown', 'mousemove', 'mouseup'];
function SelectController(type, zr, opt) {
  Eventful.call(this);
  this.type = type;
  this.zr = zr;
  this.opt = zrUtil.clone(opt);
  this.group = new graphic.Group();
  this._containerRect = null;
  this._track = [];
  this._dragging;
  this._cover;
  this._disabled = true;
  this._handlers = {
    mousedown: bind(mousedown, this),
    mousemove: bind(mousemove, this),
    mouseup: bind(mouseup, this)
  };
  each(EVENTS, function(eventName) {
    this.zr.on(eventName, this._handlers[eventName]);
  }, this);
}
SelectController.prototype = {
  constructor: SelectController,
  enable: function(container, rect) {
    this._disabled = false;
    removeGroup.call(this);
    this._containerRect = rect !== false ? (rect || container.getBoundingRect()) : null;
    container.add(this.group);
  },
  update: function(ranges) {
    renderCover.call(this, ranges && zrUtil.clone(ranges));
  },
  disable: function() {
    this._disabled = true;
    removeGroup.call(this);
  },
  dispose: function() {
    this.disable();
    each(EVENTS, function(eventName) {
      this.zr.off(eventName, this._handlers[eventName]);
    }, this);
  }
};
zrUtil.mixin(SelectController, Eventful);
function updateZ(group) {
  group.traverse(function(el) {
    el.z = COVER_Z;
  });
}
function isInContainer(x, y) {
  var localPos = this.group.transformCoordToLocal(x, y);
  return !this._containerRect || this._containerRect.contain(localPos[0], localPos[1]);
}
function preventDefault(e) {
  var rawE = e.event;
  rawE.preventDefault && rawE.preventDefault();
}
function mousedown(e) {
  if (this._disabled || (e.target && e.target.draggable)) {
    return;
  }
  preventDefault(e);
  var x = e.offsetX;
  var y = e.offsetY;
  if (isInContainer.call(this, x, y)) {
    this._dragging = true;
    this._track = [[x, y]];
  }
}
function mousemove(e) {
  if (!this._dragging || this._disabled) {
    return;
  }
  preventDefault(e);
  updateViewByCursor.call(this, e);
}
function mouseup(e) {
  if (!this._dragging || this._disabled) {
    return;
  }
  preventDefault(e);
  updateViewByCursor.call(this, e, true);
  this._dragging = false;
  this._track = [];
}
function updateViewByCursor(e, isEnd) {
  var x = e.offsetX;
  var y = e.offsetY;
  if (isInContainer.call(this, x, y)) {
    this._track.push([x, y]);
    var ranges = shouldShowCover.call(this) ? coverRenderers[this.type].getRanges.call(this) : [];
    renderCover.call(this, ranges);
    this.trigger('selected', zrUtil.clone(ranges));
    if (isEnd) {
      this.trigger('selectEnd', zrUtil.clone(ranges));
    }
  }
}
function shouldShowCover() {
  var track = this._track;
  if (!track.length) {
    return false;
  }
  var p2 = track[track.length - 1];
  var p1 = track[0];
  var dx = p2[0] - p1[0];
  var dy = p2[1] - p1[1];
  var dist = mathPow(dx * dx + dy * dy, 0.5);
  return dist > UNSELECT_THRESHOLD;
}
function renderCover(ranges) {
  var coverRenderer = coverRenderers[this.type];
  if (ranges && ranges.length) {
    if (!this._cover) {
      this._cover = coverRenderer.create.call(this);
      this.group.add(this._cover);
    }
    coverRenderer.update.call(this, ranges);
  } else {
    this.group.remove(this._cover);
    this._cover = null;
  }
  updateZ(this.group);
}
function removeGroup() {
  var group = this.group;
  var container = group.parent;
  if (container) {
    container.remove(group);
  }
}
function createRectCover() {
  var opt = this.opt;
  return new graphic.Rect({style: {
      stroke: opt.stroke,
      fill: opt.fill,
      lineWidth: opt.lineWidth,
      opacity: opt.opacity
    }});
}
function getLocalTrack() {
  return zrUtil.map(this._track, function(point) {
    return this.group.transformCoordToLocal(point[0], point[1]);
  }, this);
}
function getLocalTrackEnds() {
  var localTrack = getLocalTrack.call(this);
  var tail = localTrack.length - 1;
  tail < 0 && (tail = 0);
  return [localTrack[0], localTrack[tail]];
}
var coverRenderers = {
  line: {
    create: createRectCover,
    getRanges: function() {
      var ends = getLocalTrackEnds.call(this);
      var min = mathMin(ends[0][0], ends[1][0]);
      var max = mathMax(ends[0][0], ends[1][0]);
      return [[min, max]];
    },
    update: function(ranges) {
      var range = ranges[0];
      var width = this.opt.width;
      this._cover.setShape({
        x: range[0],
        y: -width / 2,
        width: range[1] - range[0],
        height: width
      });
    }
  },
  rect: {
    create: createRectCover,
    getRanges: function() {
      var ends = getLocalTrackEnds.call(this);
      var min = [mathMin(ends[1][0], ends[0][0]), mathMin(ends[1][1], ends[0][1])];
      var max = [mathMax(ends[1][0], ends[0][0]), mathMax(ends[1][1], ends[0][1])];
      return [[[min[0], max[0]], [min[1], max[1]]]];
    },
    update: function(ranges) {
      var range = ranges[0];
      this._cover.setShape({
        x: range[0][0],
        y: range[1][0],
        width: range[0][1] - range[0][0],
        height: range[1][1] - range[1][0]
      });
    }
  }
};
module.exports = SelectController;
