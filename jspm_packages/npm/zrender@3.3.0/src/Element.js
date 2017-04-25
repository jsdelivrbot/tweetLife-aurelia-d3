/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var guid = require('./core/guid');
  var Eventful = require('./mixin/Eventful');
  var Transformable = require('./mixin/Transformable');
  var Animatable = require('./mixin/Animatable');
  var zrUtil = require('./core/util');
  var Element = function(opts) {
    Transformable.call(this, opts);
    Eventful.call(this, opts);
    Animatable.call(this, opts);
    this.id = opts.id || guid();
  };
  Element.prototype = {
    type: 'element',
    name: '',
    __zr: null,
    ignore: false,
    clipPath: null,
    drift: function(dx, dy) {
      switch (this.draggable) {
        case 'horizontal':
          dy = 0;
          break;
        case 'vertical':
          dx = 0;
          break;
      }
      var m = this.transform;
      if (!m) {
        m = this.transform = [1, 0, 0, 1, 0, 0];
      }
      m[4] += dx;
      m[5] += dy;
      this.decomposeTransform();
      this.dirty(false);
    },
    beforeUpdate: function() {},
    afterUpdate: function() {},
    update: function() {
      this.updateTransform();
    },
    traverse: function(cb, context) {},
    attrKV: function(key, value) {
      if (key === 'position' || key === 'scale' || key === 'origin') {
        if (value) {
          var target = this[key];
          if (!target) {
            target = this[key] = [];
          }
          target[0] = value[0];
          target[1] = value[1];
        }
      } else {
        this[key] = value;
      }
    },
    hide: function() {
      this.ignore = true;
      this.__zr && this.__zr.refresh();
    },
    show: function() {
      this.ignore = false;
      this.__zr && this.__zr.refresh();
    },
    attr: function(key, value) {
      if (typeof key === 'string') {
        this.attrKV(key, value);
      } else if (zrUtil.isObject(key)) {
        for (var name in key) {
          if (key.hasOwnProperty(name)) {
            this.attrKV(name, key[name]);
          }
        }
      }
      this.dirty(false);
      return this;
    },
    setClipPath: function(clipPath) {
      var zr = this.__zr;
      if (zr) {
        clipPath.addSelfToZr(zr);
      }
      if (this.clipPath && this.clipPath !== clipPath) {
        this.removeClipPath();
      }
      this.clipPath = clipPath;
      clipPath.__zr = zr;
      clipPath.__clipTarget = this;
      this.dirty(false);
    },
    removeClipPath: function() {
      var clipPath = this.clipPath;
      if (clipPath) {
        if (clipPath.__zr) {
          clipPath.removeSelfFromZr(clipPath.__zr);
        }
        clipPath.__zr = null;
        clipPath.__clipTarget = null;
        this.clipPath = null;
        this.dirty(false);
      }
    },
    addSelfToZr: function(zr) {
      this.__zr = zr;
      var animators = this.animators;
      if (animators) {
        for (var i = 0; i < animators.length; i++) {
          zr.animation.addAnimator(animators[i]);
        }
      }
      if (this.clipPath) {
        this.clipPath.addSelfToZr(zr);
      }
    },
    removeSelfFromZr: function(zr) {
      this.__zr = null;
      var animators = this.animators;
      if (animators) {
        for (var i = 0; i < animators.length; i++) {
          zr.animation.removeAnimator(animators[i]);
        }
      }
      if (this.clipPath) {
        this.clipPath.removeSelfFromZr(zr);
      }
    }
  };
  zrUtil.mixin(Element, Animatable);
  zrUtil.mixin(Element, Transformable);
  zrUtil.mixin(Element, Eventful);
  return Element;
});
