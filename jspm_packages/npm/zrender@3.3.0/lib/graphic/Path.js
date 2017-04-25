/* */ 
var Displayable = require('./Displayable');
var zrUtil = require('../core/util');
var PathProxy = require('../core/PathProxy');
var pathContain = require('../contain/path');
var Pattern = require('./Pattern');
var getCanvasPattern = Pattern.prototype.getCanvasPattern;
var abs = Math.abs;
function Path(opts) {
  Displayable.call(this, opts);
  this.path = new PathProxy();
}
Path.prototype = {
  constructor: Path,
  type: 'path',
  __dirtyPath: true,
  strokeContainThreshold: 5,
  brush: function(ctx, prevEl) {
    var style = this.style;
    var path = this.path;
    var hasStroke = style.hasStroke();
    var hasFill = style.hasFill();
    var fill = style.fill;
    var stroke = style.stroke;
    var hasFillGradient = hasFill && !!(fill.colorStops);
    var hasStrokeGradient = hasStroke && !!(stroke.colorStops);
    var hasFillPattern = hasFill && !!(fill.image);
    var hasStrokePattern = hasStroke && !!(stroke.image);
    style.bind(ctx, this, prevEl);
    this.setTransform(ctx);
    if (this.__dirty) {
      var rect = this.getBoundingRect();
      if (hasFillGradient) {
        this._fillGradient = style.getGradient(ctx, fill, rect);
      }
      if (hasStrokeGradient) {
        this._strokeGradient = style.getGradient(ctx, stroke, rect);
      }
    }
    if (hasFillGradient) {
      ctx.fillStyle = this._fillGradient;
    } else if (hasFillPattern) {
      ctx.fillStyle = getCanvasPattern.call(fill, ctx);
    }
    if (hasStrokeGradient) {
      ctx.strokeStyle = this._strokeGradient;
    } else if (hasStrokePattern) {
      ctx.strokeStyle = getCanvasPattern.call(stroke, ctx);
    }
    var lineDash = style.lineDash;
    var lineDashOffset = style.lineDashOffset;
    var ctxLineDash = !!ctx.setLineDash;
    var scale = this.getGlobalScale();
    path.setScale(scale[0], scale[1]);
    if (this.__dirtyPath || (lineDash && !ctxLineDash && hasStroke)) {
      path = this.path.beginPath(ctx);
      if (lineDash && !ctxLineDash) {
        path.setLineDash(lineDash);
        path.setLineDashOffset(lineDashOffset);
      }
      this.buildPath(path, this.shape, false);
      this.__dirtyPath = false;
    } else {
      ctx.beginPath();
      this.path.rebuildPath(ctx);
    }
    hasFill && path.fill(ctx);
    if (lineDash && ctxLineDash) {
      ctx.setLineDash(lineDash);
      ctx.lineDashOffset = lineDashOffset;
    }
    hasStroke && path.stroke(ctx);
    if (lineDash && ctxLineDash) {
      ctx.setLineDash([]);
    }
    this.restoreTransform(ctx);
    if (style.text != null) {
      this.drawRectText(ctx, this.getBoundingRect());
    }
  },
  buildPath: function(ctx, shapeCfg, inBundle) {},
  getBoundingRect: function() {
    var rect = this._rect;
    var style = this.style;
    var needsUpdateRect = !rect;
    if (needsUpdateRect) {
      var path = this.path;
      if (this.__dirtyPath) {
        path.beginPath();
        this.buildPath(path, this.shape, false);
      }
      rect = path.getBoundingRect();
    }
    this._rect = rect;
    if (style.hasStroke()) {
      var rectWithStroke = this._rectWithStroke || (this._rectWithStroke = rect.clone());
      if (this.__dirty || needsUpdateRect) {
        rectWithStroke.copy(rect);
        var w = style.lineWidth;
        var lineScale = style.strokeNoScale ? this.getLineScale() : 1;
        if (!style.hasFill()) {
          w = Math.max(w, this.strokeContainThreshold || 4);
        }
        if (lineScale > 1e-10) {
          rectWithStroke.width += w / lineScale;
          rectWithStroke.height += w / lineScale;
          rectWithStroke.x -= w / lineScale / 2;
          rectWithStroke.y -= w / lineScale / 2;
        }
      }
      return rectWithStroke;
    }
    return rect;
  },
  contain: function(x, y) {
    var localPos = this.transformCoordToLocal(x, y);
    var rect = this.getBoundingRect();
    var style = this.style;
    x = localPos[0];
    y = localPos[1];
    if (rect.contain(x, y)) {
      var pathData = this.path.data;
      if (style.hasStroke()) {
        var lineWidth = style.lineWidth;
        var lineScale = style.strokeNoScale ? this.getLineScale() : 1;
        if (lineScale > 1e-10) {
          if (!style.hasFill()) {
            lineWidth = Math.max(lineWidth, this.strokeContainThreshold);
          }
          if (pathContain.containStroke(pathData, lineWidth / lineScale, x, y)) {
            return true;
          }
        }
      }
      if (style.hasFill()) {
        return pathContain.contain(pathData, x, y);
      }
    }
    return false;
  },
  dirty: function(dirtyPath) {
    if (dirtyPath == null) {
      dirtyPath = true;
    }
    if (dirtyPath) {
      this.__dirtyPath = dirtyPath;
      this._rect = null;
    }
    this.__dirty = true;
    this.__zr && this.__zr.refresh();
    if (this.__clipTarget) {
      this.__clipTarget.dirty();
    }
  },
  animateShape: function(loop) {
    return this.animate('shape', loop);
  },
  attrKV: function(key, value) {
    if (key === 'shape') {
      this.setShape(value);
      this.__dirtyPath = true;
      this._rect = null;
    } else {
      Displayable.prototype.attrKV.call(this, key, value);
    }
  },
  setShape: function(key, value) {
    var shape = this.shape;
    if (shape) {
      if (zrUtil.isObject(key)) {
        for (var name in key) {
          if (key.hasOwnProperty(name)) {
            shape[name] = key[name];
          }
        }
      } else {
        shape[key] = value;
      }
      this.dirty(true);
    }
    return this;
  },
  getLineScale: function() {
    var m = this.transform;
    return m && abs(m[0] - 1) > 1e-10 && abs(m[3] - 1) > 1e-10 ? Math.sqrt(abs(m[0] * m[3] - m[2] * m[1])) : 1;
  }
};
Path.extend = function(defaults) {
  var Sub = function(opts) {
    Path.call(this, opts);
    if (defaults.style) {
      this.style.extendFrom(defaults.style, false);
    }
    var defaultShape = defaults.shape;
    if (defaultShape) {
      this.shape = this.shape || {};
      var thisShape = this.shape;
      for (var name in defaultShape) {
        if (!thisShape.hasOwnProperty(name) && defaultShape.hasOwnProperty(name)) {
          thisShape[name] = defaultShape[name];
        }
      }
    }
    defaults.init && defaults.init.call(this, opts);
  };
  zrUtil.inherits(Sub, Path);
  for (var name in defaults) {
    if (name !== 'style' && name !== 'shape') {
      Sub.prototype[name] = defaults[name];
    }
  }
  return Sub;
};
zrUtil.inherits(Path, Displayable);
module.exports = Path;
