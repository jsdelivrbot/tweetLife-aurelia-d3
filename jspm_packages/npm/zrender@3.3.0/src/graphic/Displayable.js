/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('../core/util');
  var Style = require('./Style');
  var Element = require('../Element');
  var RectText = require('./mixin/RectText');
  function Displayable(opts) {
    opts = opts || {};
    Element.call(this, opts);
    for (var name in opts) {
      if (opts.hasOwnProperty(name) && name !== 'style') {
        this[name] = opts[name];
      }
    }
    this.style = new Style(opts.style);
    this._rect = null;
    this.__clipPaths = [];
  }
  Displayable.prototype = {
    constructor: Displayable,
    type: 'displayable',
    __dirty: true,
    invisible: false,
    z: 0,
    z2: 0,
    zlevel: 0,
    draggable: false,
    dragging: false,
    silent: false,
    culling: false,
    cursor: 'pointer',
    rectHover: false,
    progressive: -1,
    beforeBrush: function(ctx) {},
    afterBrush: function(ctx) {},
    brush: function(ctx, prevEl) {},
    getBoundingRect: function() {},
    contain: function(x, y) {
      return this.rectContain(x, y);
    },
    traverse: function(cb, context) {
      cb.call(context, this);
    },
    rectContain: function(x, y) {
      var coord = this.transformCoordToLocal(x, y);
      var rect = this.getBoundingRect();
      return rect.contain(coord[0], coord[1]);
    },
    dirty: function() {
      this.__dirty = true;
      this._rect = null;
      this.__zr && this.__zr.refresh();
    },
    animateStyle: function(loop) {
      return this.animate('style', loop);
    },
    attrKV: function(key, value) {
      if (key !== 'style') {
        Element.prototype.attrKV.call(this, key, value);
      } else {
        this.style.set(value);
      }
    },
    setStyle: function(key, value) {
      this.style.set(key, value);
      this.dirty(false);
      return this;
    },
    useStyle: function(obj) {
      this.style = new Style(obj);
      this.dirty(false);
      return this;
    }
  };
  zrUtil.inherits(Displayable, Element);
  zrUtil.mixin(Displayable, RectText);
  return Displayable;
});
