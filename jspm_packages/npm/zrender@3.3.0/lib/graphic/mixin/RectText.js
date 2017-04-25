/* */ 
var textContain = require('../../contain/text');
var BoundingRect = require('../../core/BoundingRect');
var tmpRect = new BoundingRect();
var RectText = function() {};
function parsePercent(value, maxValue) {
  if (typeof value === 'string') {
    if (value.lastIndexOf('%') >= 0) {
      return parseFloat(value) / 100 * maxValue;
    }
    return parseFloat(value);
  }
  return value;
}
RectText.prototype = {
  constructor: RectText,
  drawRectText: function(ctx, rect, textRect) {
    var style = this.style;
    var text = style.text;
    text != null && (text += '');
    if (!text) {
      return;
    }
    ctx.save();
    var x;
    var y;
    var textPosition = style.textPosition;
    var textOffset = style.textOffset;
    var distance = style.textDistance;
    var align = style.textAlign;
    var font = style.textFont || style.font;
    var baseline = style.textBaseline;
    var verticalAlign = style.textVerticalAlign;
    textRect = textRect || textContain.getBoundingRect(text, font, align, baseline);
    var transform = this.transform;
    if (!style.textTransform) {
      if (transform) {
        tmpRect.copy(rect);
        tmpRect.applyTransform(transform);
        rect = tmpRect;
      }
    } else {
      this.setTransform(ctx);
    }
    if (textPosition instanceof Array) {
      x = rect.x + parsePercent(textPosition[0], rect.width);
      y = rect.y + parsePercent(textPosition[1], rect.height);
      align = align || 'left';
      baseline = baseline || 'top';
      if (verticalAlign) {
        switch (verticalAlign) {
          case 'middle':
            y -= textRect.height / 2 - textRect.lineHeight / 2;
            break;
          case 'bottom':
            y -= textRect.height - textRect.lineHeight / 2;
            break;
          default:
            y += textRect.lineHeight / 2;
        }
        baseline = 'middle';
      }
    } else {
      var res = textContain.adjustTextPositionOnRect(textPosition, rect, textRect, distance);
      x = res.x;
      y = res.y;
      align = align || res.textAlign;
      baseline = baseline || res.textBaseline;
    }
    if (textOffset) {
      x += textOffset[0];
      y += textOffset[1];
    }
    ctx.textAlign = align || 'left';
    ctx.textBaseline = baseline || 'alphabetic';
    var textFill = style.textFill;
    var textStroke = style.textStroke;
    textFill && (ctx.fillStyle = textFill);
    textStroke && (ctx.strokeStyle = textStroke);
    ctx.font = font || '12px sans-serif';
    ctx.shadowBlur = style.textShadowBlur;
    ctx.shadowColor = style.textShadowColor || 'transparent';
    ctx.shadowOffsetX = style.textShadowOffsetX;
    ctx.shadowOffsetY = style.textShadowOffsetY;
    var textLines = text.split('\n');
    if (style.textRotation) {
      transform && ctx.translate(transform[4], transform[5]);
      ctx.rotate(style.textRotation);
      transform && ctx.translate(-transform[4], -transform[5]);
    }
    for (var i = 0; i < textLines.length; i++) {
      textFill && ctx.fillText(textLines[i], x, y);
      textStroke && ctx.strokeText(textLines[i], x, y);
      y += textRect.lineHeight;
    }
    ctx.restore();
  }
};
module.exports = RectText;
