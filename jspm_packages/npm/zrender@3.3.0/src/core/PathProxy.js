/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var curve = require('./curve');
  var vec2 = require('./vector');
  var bbox = require('./bbox');
  var BoundingRect = require('./BoundingRect');
  var dpr = require('../config').devicePixelRatio;
  var CMD = {
    M: 1,
    L: 2,
    C: 3,
    Q: 4,
    A: 5,
    Z: 6,
    R: 7
  };
  var min = [];
  var max = [];
  var min2 = [];
  var max2 = [];
  var mathMin = Math.min;
  var mathMax = Math.max;
  var mathCos = Math.cos;
  var mathSin = Math.sin;
  var mathSqrt = Math.sqrt;
  var mathAbs = Math.abs;
  var hasTypedArray = typeof Float32Array != 'undefined';
  var PathProxy = function() {
    this.data = [];
    this._len = 0;
    this._ctx = null;
    this._xi = 0;
    this._yi = 0;
    this._x0 = 0;
    this._y0 = 0;
    this._ux = 0;
    this._uy = 0;
  };
  PathProxy.prototype = {
    constructor: PathProxy,
    _lineDash: null,
    _dashOffset: 0,
    _dashIdx: 0,
    _dashSum: 0,
    setScale: function(sx, sy) {
      this._ux = mathAbs(1 / dpr / sx) || 0;
      this._uy = mathAbs(1 / dpr / sy) || 0;
    },
    getContext: function() {
      return this._ctx;
    },
    beginPath: function(ctx) {
      this._ctx = ctx;
      ctx && ctx.beginPath();
      ctx && (this.dpr = ctx.dpr);
      this._len = 0;
      if (this._lineDash) {
        this._lineDash = null;
        this._dashOffset = 0;
      }
      return this;
    },
    moveTo: function(x, y) {
      this.addData(CMD.M, x, y);
      this._ctx && this._ctx.moveTo(x, y);
      this._x0 = x;
      this._y0 = y;
      this._xi = x;
      this._yi = y;
      return this;
    },
    lineTo: function(x, y) {
      var exceedUnit = mathAbs(x - this._xi) > this._ux || mathAbs(y - this._yi) > this._uy || this._len < 5;
      this.addData(CMD.L, x, y);
      if (this._ctx && exceedUnit) {
        this._needsDash() ? this._dashedLineTo(x, y) : this._ctx.lineTo(x, y);
      }
      if (exceedUnit) {
        this._xi = x;
        this._yi = y;
      }
      return this;
    },
    bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
      this.addData(CMD.C, x1, y1, x2, y2, x3, y3);
      if (this._ctx) {
        this._needsDash() ? this._dashedBezierTo(x1, y1, x2, y2, x3, y3) : this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      }
      this._xi = x3;
      this._yi = y3;
      return this;
    },
    quadraticCurveTo: function(x1, y1, x2, y2) {
      this.addData(CMD.Q, x1, y1, x2, y2);
      if (this._ctx) {
        this._needsDash() ? this._dashedQuadraticTo(x1, y1, x2, y2) : this._ctx.quadraticCurveTo(x1, y1, x2, y2);
      }
      this._xi = x2;
      this._yi = y2;
      return this;
    },
    arc: function(cx, cy, r, startAngle, endAngle, anticlockwise) {
      this.addData(CMD.A, cx, cy, r, r, startAngle, endAngle - startAngle, 0, anticlockwise ? 0 : 1);
      this._ctx && this._ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
      this._xi = mathCos(endAngle) * r + cx;
      this._yi = mathSin(endAngle) * r + cx;
      return this;
    },
    arcTo: function(x1, y1, x2, y2, radius) {
      if (this._ctx) {
        this._ctx.arcTo(x1, y1, x2, y2, radius);
      }
      return this;
    },
    rect: function(x, y, w, h) {
      this._ctx && this._ctx.rect(x, y, w, h);
      this.addData(CMD.R, x, y, w, h);
      return this;
    },
    closePath: function() {
      this.addData(CMD.Z);
      var ctx = this._ctx;
      var x0 = this._x0;
      var y0 = this._y0;
      if (ctx) {
        this._needsDash() && this._dashedLineTo(x0, y0);
        ctx.closePath();
      }
      this._xi = x0;
      this._yi = y0;
      return this;
    },
    fill: function(ctx) {
      ctx && ctx.fill();
      this.toStatic();
    },
    stroke: function(ctx) {
      ctx && ctx.stroke();
      this.toStatic();
    },
    setLineDash: function(lineDash) {
      if (lineDash instanceof Array) {
        this._lineDash = lineDash;
        this._dashIdx = 0;
        var lineDashSum = 0;
        for (var i = 0; i < lineDash.length; i++) {
          lineDashSum += lineDash[i];
        }
        this._dashSum = lineDashSum;
      }
      return this;
    },
    setLineDashOffset: function(offset) {
      this._dashOffset = offset;
      return this;
    },
    len: function() {
      return this._len;
    },
    setData: function(data) {
      var len = data.length;
      if (!(this.data && this.data.length == len) && hasTypedArray) {
        this.data = new Float32Array(len);
      }
      for (var i = 0; i < len; i++) {
        this.data[i] = data[i];
      }
      this._len = len;
    },
    appendPath: function(path) {
      if (!(path instanceof Array)) {
        path = [path];
      }
      var len = path.length;
      var appendSize = 0;
      var offset = this._len;
      for (var i = 0; i < len; i++) {
        appendSize += path[i].len();
      }
      if (hasTypedArray && (this.data instanceof Float32Array)) {
        this.data = new Float32Array(offset + appendSize);
      }
      for (var i = 0; i < len; i++) {
        var appendPathData = path[i].data;
        for (var k = 0; k < appendPathData.length; k++) {
          this.data[offset++] = appendPathData[k];
        }
      }
      this._len = offset;
    },
    addData: function(cmd) {
      var data = this.data;
      if (this._len + arguments.length > data.length) {
        this._expandData();
        data = this.data;
      }
      for (var i = 0; i < arguments.length; i++) {
        data[this._len++] = arguments[i];
      }
      this._prevCmd = cmd;
    },
    _expandData: function() {
      if (!(this.data instanceof Array)) {
        var newData = [];
        for (var i = 0; i < this._len; i++) {
          newData[i] = this.data[i];
        }
        this.data = newData;
      }
    },
    _needsDash: function() {
      return this._lineDash;
    },
    _dashedLineTo: function(x1, y1) {
      var dashSum = this._dashSum;
      var offset = this._dashOffset;
      var lineDash = this._lineDash;
      var ctx = this._ctx;
      var x0 = this._xi;
      var y0 = this._yi;
      var dx = x1 - x0;
      var dy = y1 - y0;
      var dist = mathSqrt(dx * dx + dy * dy);
      var x = x0;
      var y = y0;
      var dash;
      var nDash = lineDash.length;
      var idx;
      dx /= dist;
      dy /= dist;
      if (offset < 0) {
        offset = dashSum + offset;
      }
      offset %= dashSum;
      x -= offset * dx;
      y -= offset * dy;
      while ((dx > 0 && x <= x1) || (dx < 0 && x >= x1) || (dx == 0 && ((dy > 0 && y <= y1) || (dy < 0 && y >= y1)))) {
        idx = this._dashIdx;
        dash = lineDash[idx];
        x += dx * dash;
        y += dy * dash;
        this._dashIdx = (idx + 1) % nDash;
        if ((dx > 0 && x < x0) || (dx < 0 && x > x0) || (dy > 0 && y < y0) || (dy < 0 && y > y0)) {
          continue;
        }
        ctx[idx % 2 ? 'moveTo' : 'lineTo'](dx >= 0 ? mathMin(x, x1) : mathMax(x, x1), dy >= 0 ? mathMin(y, y1) : mathMax(y, y1));
      }
      dx = x - x1;
      dy = y - y1;
      this._dashOffset = -mathSqrt(dx * dx + dy * dy);
    },
    _dashedBezierTo: function(x1, y1, x2, y2, x3, y3) {
      var dashSum = this._dashSum;
      var offset = this._dashOffset;
      var lineDash = this._lineDash;
      var ctx = this._ctx;
      var x0 = this._xi;
      var y0 = this._yi;
      var t;
      var dx;
      var dy;
      var cubicAt = curve.cubicAt;
      var bezierLen = 0;
      var idx = this._dashIdx;
      var nDash = lineDash.length;
      var x;
      var y;
      var tmpLen = 0;
      if (offset < 0) {
        offset = dashSum + offset;
      }
      offset %= dashSum;
      for (t = 0; t < 1; t += 0.1) {
        dx = cubicAt(x0, x1, x2, x3, t + 0.1) - cubicAt(x0, x1, x2, x3, t);
        dy = cubicAt(y0, y1, y2, y3, t + 0.1) - cubicAt(y0, y1, y2, y3, t);
        bezierLen += mathSqrt(dx * dx + dy * dy);
      }
      for (; idx < nDash; idx++) {
        tmpLen += lineDash[idx];
        if (tmpLen > offset) {
          break;
        }
      }
      t = (tmpLen - offset) / bezierLen;
      while (t <= 1) {
        x = cubicAt(x0, x1, x2, x3, t);
        y = cubicAt(y0, y1, y2, y3, t);
        idx % 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        t += lineDash[idx] / bezierLen;
        idx = (idx + 1) % nDash;
      }
      (idx % 2 !== 0) && ctx.lineTo(x3, y3);
      dx = x3 - x;
      dy = y3 - y;
      this._dashOffset = -mathSqrt(dx * dx + dy * dy);
    },
    _dashedQuadraticTo: function(x1, y1, x2, y2) {
      var x3 = x2;
      var y3 = y2;
      x2 = (x2 + 2 * x1) / 3;
      y2 = (y2 + 2 * y1) / 3;
      x1 = (this._xi + 2 * x1) / 3;
      y1 = (this._yi + 2 * y1) / 3;
      this._dashedBezierTo(x1, y1, x2, y2, x3, y3);
    },
    toStatic: function() {
      var data = this.data;
      if (data instanceof Array) {
        data.length = this._len;
        if (hasTypedArray) {
          this.data = new Float32Array(data);
        }
      }
    },
    getBoundingRect: function() {
      min[0] = min[1] = min2[0] = min2[1] = Number.MAX_VALUE;
      max[0] = max[1] = max2[0] = max2[1] = -Number.MAX_VALUE;
      var data = this.data;
      var xi = 0;
      var yi = 0;
      var x0 = 0;
      var y0 = 0;
      for (var i = 0; i < data.length; ) {
        var cmd = data[i++];
        if (i == 1) {
          xi = data[i];
          yi = data[i + 1];
          x0 = xi;
          y0 = yi;
        }
        switch (cmd) {
          case CMD.M:
            x0 = data[i++];
            y0 = data[i++];
            xi = x0;
            yi = y0;
            min2[0] = x0;
            min2[1] = y0;
            max2[0] = x0;
            max2[1] = y0;
            break;
          case CMD.L:
            bbox.fromLine(xi, yi, data[i], data[i + 1], min2, max2);
            xi = data[i++];
            yi = data[i++];
            break;
          case CMD.C:
            bbox.fromCubic(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], min2, max2);
            xi = data[i++];
            yi = data[i++];
            break;
          case CMD.Q:
            bbox.fromQuadratic(xi, yi, data[i++], data[i++], data[i], data[i + 1], min2, max2);
            xi = data[i++];
            yi = data[i++];
            break;
          case CMD.A:
            var cx = data[i++];
            var cy = data[i++];
            var rx = data[i++];
            var ry = data[i++];
            var startAngle = data[i++];
            var endAngle = data[i++] + startAngle;
            var psi = data[i++];
            var anticlockwise = 1 - data[i++];
            if (i == 1) {
              x0 = mathCos(startAngle) * rx + cx;
              y0 = mathSin(startAngle) * ry + cy;
            }
            bbox.fromArc(cx, cy, rx, ry, startAngle, endAngle, anticlockwise, min2, max2);
            xi = mathCos(endAngle) * rx + cx;
            yi = mathSin(endAngle) * ry + cy;
            break;
          case CMD.R:
            x0 = xi = data[i++];
            y0 = yi = data[i++];
            var width = data[i++];
            var height = data[i++];
            bbox.fromLine(x0, y0, x0 + width, y0 + height, min2, max2);
            break;
          case CMD.Z:
            xi = x0;
            yi = y0;
            break;
        }
        vec2.min(min, min, min2);
        vec2.max(max, max, max2);
      }
      if (i === 0) {
        min[0] = min[1] = max[0] = max[1] = 0;
      }
      return new BoundingRect(min[0], min[1], max[0] - min[0], max[1] - min[1]);
    },
    rebuildPath: function(ctx) {
      var d = this.data;
      var x0,
          y0;
      var xi,
          yi;
      var x,
          y;
      var ux = this._ux;
      var uy = this._uy;
      var len = this._len;
      for (var i = 0; i < len; ) {
        var cmd = d[i++];
        if (i == 1) {
          xi = d[i];
          yi = d[i + 1];
          x0 = xi;
          y0 = yi;
        }
        switch (cmd) {
          case CMD.M:
            x0 = xi = d[i++];
            y0 = yi = d[i++];
            ctx.moveTo(xi, yi);
            break;
          case CMD.L:
            x = d[i++];
            y = d[i++];
            if (mathAbs(x - xi) > ux || mathAbs(y - yi) > uy || i === len - 1) {
              ctx.lineTo(x, y);
              xi = x;
              yi = y;
            }
            break;
          case CMD.C:
            ctx.bezierCurveTo(d[i++], d[i++], d[i++], d[i++], d[i++], d[i++]);
            xi = d[i - 2];
            yi = d[i - 1];
            break;
          case CMD.Q:
            ctx.quadraticCurveTo(d[i++], d[i++], d[i++], d[i++]);
            xi = d[i - 2];
            yi = d[i - 1];
            break;
          case CMD.A:
            var cx = d[i++];
            var cy = d[i++];
            var rx = d[i++];
            var ry = d[i++];
            var theta = d[i++];
            var dTheta = d[i++];
            var psi = d[i++];
            var fs = d[i++];
            var r = (rx > ry) ? rx : ry;
            var scaleX = (rx > ry) ? 1 : rx / ry;
            var scaleY = (rx > ry) ? ry / rx : 1;
            var isEllipse = Math.abs(rx - ry) > 1e-3;
            var endAngle = theta + dTheta;
            if (isEllipse) {
              ctx.translate(cx, cy);
              ctx.rotate(psi);
              ctx.scale(scaleX, scaleY);
              ctx.arc(0, 0, r, theta, endAngle, 1 - fs);
              ctx.scale(1 / scaleX, 1 / scaleY);
              ctx.rotate(-psi);
              ctx.translate(-cx, -cy);
            } else {
              ctx.arc(cx, cy, r, theta, endAngle, 1 - fs);
            }
            if (i == 1) {
              x0 = mathCos(theta) * rx + cx;
              y0 = mathSin(theta) * ry + cy;
            }
            xi = mathCos(endAngle) * rx + cx;
            yi = mathSin(endAngle) * ry + cy;
            break;
          case CMD.R:
            x0 = xi = d[i];
            y0 = yi = d[i + 1];
            ctx.rect(d[i++], d[i++], d[i++], d[i++]);
            break;
          case CMD.Z:
            ctx.closePath();
            xi = x0;
            yi = y0;
        }
      }
    }
  };
  PathProxy.CMD = CMD;
  return PathProxy;
});
