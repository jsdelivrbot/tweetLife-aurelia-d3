/* */ 
var Displayable = require('./Displayable');
var zrUtil = require('../core/util');
var textContain = require('../contain/text');
var Text = function(opts) {
  Displayable.call(this, opts);
};
Text.prototype = {
  constructor: Text,
  type: 'text',
  brush: function(ctx, prevEl) {
    var style = this.style;
    var x = style.x || 0;
    var y = style.y || 0;
    var text = style.text;
    text != null && (text += '');
    style.bind(ctx, this, prevEl);
    if (text) {
      this.setTransform(ctx);
      var textBaseline;
      var textAlign = style.textAlign;
      var font = style.textFont || style.font;
      if (style.textVerticalAlign) {
        var rect = textContain.getBoundingRect(text, font, style.textAlign, 'top');
        textBaseline = 'middle';
        switch (style.textVerticalAlign) {
          case 'middle':
            y -= rect.height / 2 - rect.lineHeight / 2;
            break;
          case 'bottom':
            y -= rect.height - rect.lineHeight / 2;
            break;
          default:
            y += rect.lineHeight / 2;
        }
      } else {
        textBaseline = style.textBaseline;
      }
      ctx.font = font || '12px sans-serif';
      ctx.textAlign = textAlign || 'left';
      if (ctx.textAlign !== textAlign) {
        ctx.textAlign = 'left';
      }
      ctx.textBaseline = textBaseline || 'alphabetic';
      if (ctx.textBaseline !== textBaseline) {
        ctx.textBaseline = 'alphabetic';
      }
      var lineHeight = textContain.measureText('国', ctx.font).width;
      var textLines = text.split('\n');
      for (var i = 0; i < textLines.length; i++) {
        style.hasFill() && ctx.fillText(textLines[i], x, y);
        style.hasStroke() && ctx.strokeText(textLines[i], x, y);
        y += lineHeight;
      }
      this.restoreTransform(ctx);
    }
  },
  getBoundingRect: function() {
    if (!this._rect) {
      var style = this.style;
      var textVerticalAlign = style.textVerticalAlign;
      var rect = textContain.getBoundingRect(style.text + '', style.textFont || style.font, style.textAlign, textVerticalAlign ? 'top' : style.textBaseline);
      switch (textVerticalAlign) {
        case 'middle':
          rect.y -= rect.height / 2;
          break;
        case 'bottom':
          rect.y -= rect.height;
          break;
      }
      rect.x += style.x || 0;
      rect.y += style.y || 0;
      this._rect = rect;
    }
    return this._rect;
  }
};
zrUtil.inherits(Text, Displayable);
module.exports = Text;
