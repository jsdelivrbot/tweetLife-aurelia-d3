/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var matrix = require('../core/matrix');
  var vector = require('../core/vector');
  var mIdentity = matrix.identity;
  var EPSILON = 5e-5;
  function isNotAroundZero(val) {
    return val > EPSILON || val < -EPSILON;
  }
  var Transformable = function(opts) {
    opts = opts || {};
    if (!opts.position) {
      this.position = [0, 0];
    }
    if (opts.rotation == null) {
      this.rotation = 0;
    }
    if (!opts.scale) {
      this.scale = [1, 1];
    }
    this.origin = this.origin || null;
  };
  var transformableProto = Transformable.prototype;
  transformableProto.transform = null;
  transformableProto.needLocalTransform = function() {
    return isNotAroundZero(this.rotation) || isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1]) || isNotAroundZero(this.scale[0] - 1) || isNotAroundZero(this.scale[1] - 1);
  };
  transformableProto.updateTransform = function() {
    var parent = this.parent;
    var parentHasTransform = parent && parent.transform;
    var needLocalTransform = this.needLocalTransform();
    var m = this.transform;
    if (!(needLocalTransform || parentHasTransform)) {
      m && mIdentity(m);
      return;
    }
    m = m || matrix.create();
    if (needLocalTransform) {
      this.getLocalTransform(m);
    } else {
      mIdentity(m);
    }
    if (parentHasTransform) {
      if (needLocalTransform) {
        matrix.mul(m, parent.transform, m);
      } else {
        matrix.copy(m, parent.transform);
      }
    }
    this.transform = m;
    this.invTransform = this.invTransform || matrix.create();
    matrix.invert(this.invTransform, m);
  };
  transformableProto.getLocalTransform = function(m) {
    m = m || [];
    mIdentity(m);
    var origin = this.origin;
    var scale = this.scale;
    var rotation = this.rotation;
    var position = this.position;
    if (origin) {
      m[4] -= origin[0];
      m[5] -= origin[1];
    }
    matrix.scale(m, m, scale);
    if (rotation) {
      matrix.rotate(m, m, rotation);
    }
    if (origin) {
      m[4] += origin[0];
      m[5] += origin[1];
    }
    m[4] += position[0];
    m[5] += position[1];
    return m;
  };
  transformableProto.setTransform = function(ctx) {
    var m = this.transform;
    var dpr = ctx.dpr || 1;
    if (m) {
      ctx.setTransform(dpr * m[0], dpr * m[1], dpr * m[2], dpr * m[3], dpr * m[4], dpr * m[5]);
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };
  transformableProto.restoreTransform = function(ctx) {
    var m = this.transform;
    var dpr = ctx.dpr || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  var tmpTransform = [];
  transformableProto.decomposeTransform = function() {
    if (!this.transform) {
      return;
    }
    var parent = this.parent;
    var m = this.transform;
    if (parent && parent.transform) {
      matrix.mul(tmpTransform, parent.invTransform, m);
      m = tmpTransform;
    }
    var sx = m[0] * m[0] + m[1] * m[1];
    var sy = m[2] * m[2] + m[3] * m[3];
    var position = this.position;
    var scale = this.scale;
    if (isNotAroundZero(sx - 1)) {
      sx = Math.sqrt(sx);
    }
    if (isNotAroundZero(sy - 1)) {
      sy = Math.sqrt(sy);
    }
    if (m[0] < 0) {
      sx = -sx;
    }
    if (m[3] < 0) {
      sy = -sy;
    }
    position[0] = m[4];
    position[1] = m[5];
    scale[0] = sx;
    scale[1] = sy;
    this.rotation = Math.atan2(-m[1] / sy, m[0] / sx);
  };
  transformableProto.getGlobalScale = function() {
    var m = this.transform;
    if (!m) {
      return [1, 1];
    }
    var sx = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
    var sy = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
    if (m[0] < 0) {
      sx = -sx;
    }
    if (m[3] < 0) {
      sy = -sy;
    }
    return [sx, sy];
  };
  transformableProto.transformCoordToLocal = function(x, y) {
    var v2 = [x, y];
    var invTransform = this.invTransform;
    if (invTransform) {
      vector.applyTransform(v2, v2, invTransform);
    }
    return v2;
  };
  transformableProto.transformCoordToGlobal = function(x, y) {
    var v2 = [x, y];
    var transform = this.transform;
    if (transform) {
      vector.applyTransform(v2, v2, transform);
    }
    return v2;
  };
  return Transformable;
});
