/* */ 
var Displayable = require('./Displayable');
var BoundingRect = require('../core/BoundingRect');
var zrUtil = require('../core/util');
var LRU = require('../core/LRU');
var globalImageCache = new LRU(50);
function ZImage(opts) {
  Displayable.call(this, opts);
}
ZImage.prototype = {
  constructor: ZImage,
  type: 'image',
  brush: function(ctx, prevEl) {
    var style = this.style;
    var src = style.image;
    var image;
    style.bind(ctx, this, prevEl);
    if (typeof src === 'string') {
      image = this._image;
    } else {
      image = src;
    }
    if (!image && src) {
      var cachedImgObj = globalImageCache.get(src);
      if (!cachedImgObj) {
        image = new Image();
        image.onload = function() {
          image.onload = null;
          for (var i = 0; i < cachedImgObj.pending.length; i++) {
            cachedImgObj.pending[i].dirty();
          }
        };
        cachedImgObj = {
          image: image,
          pending: [this]
        };
        image.src = src;
        globalImageCache.put(src, cachedImgObj);
        this._image = image;
        return;
      } else {
        image = cachedImgObj.image;
        this._image = image;
        if (!image.width || !image.height) {
          cachedImgObj.pending.push(this);
          return;
        }
      }
    }
    if (image) {
      var width = style.width || image.width;
      var height = style.height || image.height;
      var x = style.x || 0;
      var y = style.y || 0;
      if (!image.width || !image.height) {
        return;
      }
      this.setTransform(ctx);
      if (style.sWidth && style.sHeight) {
        var sx = style.sx || 0;
        var sy = style.sy || 0;
        ctx.drawImage(image, sx, sy, style.sWidth, style.sHeight, x, y, width, height);
      } else if (style.sx && style.sy) {
        var sx = style.sx;
        var sy = style.sy;
        var sWidth = width - sx;
        var sHeight = height - sy;
        ctx.drawImage(image, sx, sy, sWidth, sHeight, x, y, width, height);
      } else {
        ctx.drawImage(image, x, y, width, height);
      }
      if (style.width == null) {
        style.width = width;
      }
      if (style.height == null) {
        style.height = height;
      }
      this.restoreTransform(ctx);
      if (style.text != null) {
        this.drawRectText(ctx, this.getBoundingRect());
      }
    }
  },
  getBoundingRect: function() {
    var style = this.style;
    if (!this._rect) {
      this._rect = new BoundingRect(style.x || 0, style.y || 0, style.width || 0, style.height || 0);
    }
    return this._rect;
  }
};
zrUtil.inherits(ZImage, Displayable);
module.exports = ZImage;
