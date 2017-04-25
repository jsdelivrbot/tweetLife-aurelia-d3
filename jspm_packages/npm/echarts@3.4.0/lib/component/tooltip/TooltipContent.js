/* */ 
var zrUtil = require('zrender/lib/core/util');
var zrColor = require('zrender/lib/tool/color');
var eventUtil = require('zrender/lib/core/event');
var formatUtil = require('../../util/format');
var each = zrUtil.each;
var toCamelCase = formatUtil.toCamelCase;
var env = require('zrender/lib/core/env');
var vendors = ['', '-webkit-', '-moz-', '-o-'];
var gCssText = 'position:absolute;display:block;border-style:solid;white-space:nowrap;z-index:9999999;';
function assembleTransition(duration) {
  var transitionCurve = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var transitionText = 'left ' + duration + 's ' + transitionCurve + ',' + 'top ' + duration + 's ' + transitionCurve;
  return zrUtil.map(vendors, function(vendorPrefix) {
    return vendorPrefix + 'transition:' + transitionText;
  }).join(';');
}
function assembleFont(textStyleModel) {
  var cssText = [];
  var fontSize = textStyleModel.get('fontSize');
  var color = textStyleModel.getTextColor();
  color && cssText.push('color:' + color);
  cssText.push('font:' + textStyleModel.getFont());
  fontSize && cssText.push('line-height:' + Math.round(fontSize * 3 / 2) + 'px');
  each(['decoration', 'align'], function(name) {
    var val = textStyleModel.get(name);
    val && cssText.push('text-' + name + ':' + val);
  });
  return cssText.join(';');
}
function assembleCssText(tooltipModel) {
  tooltipModel = tooltipModel;
  var cssText = [];
  var transitionDuration = tooltipModel.get('transitionDuration');
  var backgroundColor = tooltipModel.get('backgroundColor');
  var textStyleModel = tooltipModel.getModel('textStyle');
  var padding = tooltipModel.get('padding');
  transitionDuration && cssText.push(assembleTransition(transitionDuration));
  if (backgroundColor) {
    if (env.canvasSupported) {
      cssText.push('background-Color:' + backgroundColor);
    } else {
      cssText.push('background-Color:#' + zrColor.toHex(backgroundColor));
      cssText.push('filter:alpha(opacity=70)');
    }
  }
  each(['width', 'color', 'radius'], function(name) {
    var borderName = 'border-' + name;
    var camelCase = toCamelCase(borderName);
    var val = tooltipModel.get(camelCase);
    val != null && cssText.push(borderName + ':' + val + (name === 'color' ? '' : 'px'));
  });
  cssText.push(assembleFont(textStyleModel));
  if (padding != null) {
    cssText.push('padding:' + formatUtil.normalizeCssArray(padding).join('px ') + 'px');
  }
  return cssText.join(';') + ';';
}
function TooltipContent(container, api) {
  var el = document.createElement('div');
  var zr = api.getZr();
  this.el = el;
  this._x = api.getWidth() / 2;
  this._y = api.getHeight() / 2;
  container.appendChild(el);
  this._container = container;
  this._show = false;
  this._hideTimeout;
  var self = this;
  el.onmouseenter = function() {
    if (self.enterable) {
      clearTimeout(self._hideTimeout);
      self._show = true;
    }
    self._inContent = true;
  };
  el.onmousemove = function(e) {
    e = e || window.event;
    if (!self.enterable) {
      var handler = zr.handler;
      eventUtil.normalizeEvent(container, e, true);
      handler.dispatch('mousemove', e);
    }
  };
  el.onmouseleave = function() {
    if (self.enterable) {
      if (self._show) {
        self.hideLater(self._hideDelay);
      }
    }
    self._inContent = false;
  };
}
TooltipContent.prototype = {
  constructor: TooltipContent,
  enterable: true,
  update: function() {
    var container = this._container;
    var stl = container.currentStyle || document.defaultView.getComputedStyle(container);
    var domStyle = container.style;
    if (domStyle.position !== 'absolute' && stl.position !== 'absolute') {
      domStyle.position = 'relative';
    }
  },
  show: function(tooltipModel) {
    clearTimeout(this._hideTimeout);
    var el = this.el;
    el.style.cssText = gCssText + assembleCssText(tooltipModel) + ';left:' + this._x + 'px;top:' + this._y + 'px;' + (tooltipModel.get('extraCssText') || '');
    el.style.display = el.innerHTML ? 'block' : 'none';
    this._show = true;
  },
  setContent: function(content) {
    var el = this.el;
    el.innerHTML = content;
    el.style.display = content ? 'block' : 'none';
  },
  moveTo: function(x, y) {
    var style = this.el.style;
    style.left = x + 'px';
    style.top = y + 'px';
    this._x = x;
    this._y = y;
  },
  hide: function() {
    this.el.style.display = 'none';
    this._show = false;
  },
  hideLater: function(time) {
    if (this._show && !(this._inContent && this.enterable)) {
      if (time) {
        this._hideDelay = time;
        this._show = false;
        this._hideTimeout = setTimeout(zrUtil.bind(this.hide, this), time);
      } else {
        this.hide();
      }
    }
  },
  isShow: function() {
    return this._show;
  }
};
module.exports = TooltipContent;
