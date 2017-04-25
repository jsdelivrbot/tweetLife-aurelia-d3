/* */ 
"format cjs";
define(function(require) {
  var svgCore = require('./core');
  var CMD = require('../core/PathProxy').CMD;
  var textContain = require('../contain/text');
  var createElement = svgCore.createElement;
  var arrayJoin = Array.prototype.join;
  var NONE = 'none';
  var mathRound = Math.round;
  var mathSin = Math.sin;
  var mathCos = Math.cos;
  var PI = Math.PI;
  var PI2 = Math.PI * 2;
  var degree = 180 / PI;
  var EPSILON = 1e-4;
  function round4(val) {
    return mathRound(val * 1e4) / 1e4;
  }
  function isAroundZero(val) {
    return val < EPSILON && val > -EPSILON;
  }
  function pathHasFill(style, isText) {
    var fill = isText ? style.textFill : style.fill;
    return fill != null && fill !== NONE;
  }
  function pathHasStroke(style, isText) {
    var stroke = isText ? style.textStroke : style.stroke;
    return stroke != null && stroke !== NONE;
  }
  function setTransform(svgEl, m) {
    if (m) {
      attr(svgEl, 'transform', 'matrix(' + arrayJoin.call(m, ',') + ')');
    }
  }
  function attr(el, key, val) {
    el.setAttribute(key, val);
  }
  function attrXLink(el, key, val) {
    el.setAttributeNS('http://www.w3.org/1999/xlink', key, val);
  }
  function bindStyle(svgEl, style, isText) {
    if (pathHasFill(style, isText)) {
      attr(svgEl, 'fill', isText ? style.textFill : style.fill);
      attr(svgEl, 'fill-opacity', style.opacity);
    } else {
      attr(svgEl, 'fill', NONE);
    }
    if (pathHasStroke(style, isText)) {
      attr(svgEl, 'stroke', isText ? style.textStroke : style.stroke);
      attr(svgEl, 'stroke-width', style.lineWidth);
      attr(svgEl, 'stroke-opacity', style.opacity);
      var lineDash = style.lineDash;
      if (lineDash) {
        attr(svgEl, 'stroke-dasharray', style.lineDash.join(','));
        attr(svgEl, 'stroke-dashoffset', mathRound(style.lineDashOffset || 0));
      } else {
        attr(svgEl, 'stroke-dasharray', '');
      }
      style.lineCap && attr(svgEl, 'stroke-linecap', style.lineCap);
      style.lineJoin && attr(svgEl, 'stroke-linejoin', style.lineJoin);
      style.miterLimit && attr(svgEl, 'stroke-miterlimit', style.miterLimit);
    } else {
      attr(svgEl, 'stroke', NONE);
    }
  }
  function pathDataToString(data) {
    var str = [];
    for (var i = 0; i < data.length; ) {
      var cmd = data[i++];
      var cmdStr = '';
      var nData = 0;
      switch (cmd) {
        case CMD.M:
          cmdStr = 'M';
          nData = 2;
          break;
        case CMD.L:
          cmdStr = 'L';
          nData = 2;
          break;
        case CMD.Q:
          cmdStr = 'Q';
          nData = 4;
          break;
        case CMD.C:
          cmdStr = 'C';
          nData = 6;
          break;
        case CMD.A:
          var cx = data[i++];
          var cy = data[i++];
          var rx = data[i++];
          var ry = data[i++];
          var theta = data[i++];
          var dTheta = data[i++];
          var psi = data[i++];
          var clockwise = data[i++];
          var sign = clockwise ? 1 : -1;
          var dThetaPositive = Math.abs(dTheta);
          var isCircle = isAroundZero(dThetaPositive - PI2) || isAroundZero(dThetaPositive % PI2);
          var large = dThetaPositive > PI;
          var x0 = round4(cx + rx * mathCos(theta));
          var y0 = round4(cy + ry * mathSin(theta) * sign);
          if (isCircle) {
            dTheta = PI2 - 1e-4;
            clockwise = false;
            sign = -1;
          }
          var x = round4(cx + rx * mathCos(theta + dTheta));
          var y = round4(cy + ry * mathSin(theta + dTheta) * sign);
          str.push('A', round4(rx), round4(ry), mathRound((psi + theta) * degree), +large, +clockwise, x, y);
          break;
        case CMD.Z:
          cmdStr = 'Z';
          break;
      }
      cmdStr && str.push(cmdStr);
      for (var j = 0; j < nData; j++) {
        str.push(round4(data[i++]));
      }
    }
    return str.join(' ');
  }
  var svgPath = {};
  svgPath.brush = function(el) {
    var style = el.style;
    var svgEl = el.__svgEl;
    if (!svgEl) {
      svgEl = createElement('path');
      el.__svgEl = svgEl;
    }
    var path = el.path;
    if (el.__dirtyPath) {
      path.beginPath();
      el.buildPath(path, el.shape);
      el.__dirtyPath = false;
      attr(svgEl, 'd', pathDataToString(path.data));
    }
    bindStyle(svgEl, style);
    setTransform(svgEl, el.transform);
    if (style.text != null) {
      svgTextDrawRectText(el, el.getBoundingRect());
    }
  };
  var svgImage = {};
  svgImage.brush = function(el) {
    var style = el.style;
    var image = style.image;
    if (image instanceof HTMLImageElement) {
      var src = image.src;
      image = src;
    }
    if (!image) {
      return;
    }
    var x = style.x || 0;
    var y = style.y || 0;
    var dw = style.width;
    var dh = style.height;
    var svgEl = el.__svgEl;
    if (!svgEl) {
      svgEl = createElement('image');
      el.__svgEl = svgEl;
    }
    if (image !== el.__imageSrc) {
      attrXLink(svgEl, 'href', image);
      el.__imageSrc = image;
    }
    attr(svgEl, 'width', dw);
    attr(svgEl, 'height', dh);
    attr(svgEl, 'x', x);
    attr(svgEl, 'y', y);
    setTransform(svgEl, el.transform);
    if (style.text != null) {
      svgTextDrawRectText(el, el.getBoundingRect());
    }
  };
  var svgText = {};
  var svgTextDrawRectText = function(el, rect, textRect) {
    var style = el.style;
    var text = style.text;
    text != null && (text += '');
    if (!text) {
      return;
    }
    var textSvgEl = el.__textSvgEl;
    if (!textSvgEl) {
      textSvgEl = createElement('text');
      el.__textSvgEl = textSvgEl;
    }
    bindStyle(textSvgEl, style, true);
    setTransform(textSvgEl, el.transform);
    var x;
    var y;
    var textPosition = style.textPosition;
    var distance = style.textDistance;
    var align = style.textAlign;
    var font = style.textFont || '12px sans-serif';
    var baseline = style.textBaseline;
    textRect = textRect || textContain.getBoundingRect(text, font, align, baseline);
    var lineHeight = textRect.lineHeight;
    if (textPosition instanceof Array) {
      x = rect.x + textPosition[0];
      y = rect.y + textPosition[1];
    } else {
      var newPos = textContain.adjustTextPositionOnRect(textPosition, rect, textRect, distance);
      x = newPos.x;
      y = newPos.y;
      align = 'left';
    }
    if (font) {
      textSvgEl.style.font = font;
    }
    attr(textSvgEl, 'x', x);
    attr(textSvgEl, 'y', y);
    var textLines = text.split('\n');
    var nTextLines = textLines.length;
    var textAnchor = align;
    if (textAnchor === 'left') {
      textAnchor = 'start';
    } else if (textAnchor === 'right') {
      textAnchor = 'end';
    } else if (textAnchor === 'center') {
      textAnchor = 'middle';
    }
    if (el.__text !== text || el.__textFont !== font) {
      var tspanList = el.__tspanList || [];
      el.__tspanList = tspanList;
      for (var i = 0; i < nTextLines; i++) {
        var tspan = tspanList[i];
        if (!tspan) {
          tspan = tspanList[i] = createElement('tspan');
          textSvgEl.appendChild(tspan);
          attr(tspan, 'alignment-baseline', 'hanging');
          attr(tspan, 'text-anchor', textAnchor);
        }
        attr(tspan, 'x', x);
        attr(tspan, 'y', y + i * lineHeight);
        tspan.appendChild(document.createTextNode(textLines[i]));
      }
      for (; i < tspanList.length; i++) {
        textSvgEl.removeChild(tspanList[i]);
      }
      tspanList.length = nTextLines;
      el.__text = text;
      el.__textFont = font;
    }
  };
  svgText.drawRectText = svgTextDrawRectText;
  svgText.brush = function(el) {
    var style = el.style;
    if (style.text != null) {
      style.textPosition = [0, 0];
      svgTextDrawRectText(el, {
        x: style.x || 0,
        y: style.y || 0,
        width: 0,
        height: 0
      }, el.getBoundingRect());
    }
  };
  return {
    path: svgPath,
    image: svgImage,
    text: svgText
  };
});
