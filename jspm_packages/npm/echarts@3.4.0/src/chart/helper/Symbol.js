/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var symbolUtil = require('../../util/symbol');
  var graphic = require('../../util/graphic');
  var numberUtil = require('../../util/number');
  function getSymbolSize(data, idx) {
    var symbolSize = data.getItemVisual(idx, 'symbolSize');
    return symbolSize instanceof Array ? symbolSize.slice() : [+symbolSize, +symbolSize];
  }
  function getScale(symbolSize) {
    return [symbolSize[0] / 2, symbolSize[1] / 2];
  }
  function Symbol(data, idx, seriesScope) {
    graphic.Group.call(this);
    this.updateData(data, idx, seriesScope);
  }
  var symbolProto = Symbol.prototype;
  function driftSymbol(dx, dy) {
    this.parent.drift(dx, dy);
  }
  symbolProto._createSymbol = function(symbolType, data, idx, symbolSize) {
    this.removeAll();
    var seriesModel = data.hostModel;
    var color = data.getItemVisual(idx, 'color');
    var symbolPath = symbolUtil.createSymbol(symbolType, -1, -1, 2, 2, color);
    symbolPath.attr({
      z2: 100,
      culling: true,
      scale: [0, 0]
    });
    symbolPath.drift = driftSymbol;
    graphic.initProps(symbolPath, {scale: getScale(symbolSize)}, seriesModel, idx);
    this._symbolType = symbolType;
    this.add(symbolPath);
  };
  symbolProto.stopSymbolAnimation = function(toLastFrame) {
    this.childAt(0).stopAnimation(toLastFrame);
  };
  symbolProto.getSymbolPath = function() {
    return this.childAt(0);
  };
  symbolProto.getScale = function() {
    return this.childAt(0).scale;
  };
  symbolProto.highlight = function() {
    this.childAt(0).trigger('emphasis');
  };
  symbolProto.downplay = function() {
    this.childAt(0).trigger('normal');
  };
  symbolProto.setZ = function(zlevel, z) {
    var symbolPath = this.childAt(0);
    symbolPath.zlevel = zlevel;
    symbolPath.z = z;
  };
  symbolProto.setDraggable = function(draggable) {
    var symbolPath = this.childAt(0);
    symbolPath.draggable = draggable;
    symbolPath.cursor = draggable ? 'move' : 'pointer';
  };
  symbolProto.updateData = function(data, idx, seriesScope) {
    this.silent = false;
    var symbolType = data.getItemVisual(idx, 'symbol') || 'circle';
    var seriesModel = data.hostModel;
    var symbolSize = getSymbolSize(data, idx);
    if (symbolType !== this._symbolType) {
      this._createSymbol(symbolType, data, idx, symbolSize);
    } else {
      var symbolPath = this.childAt(0);
      graphic.updateProps(symbolPath, {scale: getScale(symbolSize)}, seriesModel, idx);
    }
    this._updateCommon(data, idx, symbolSize, seriesScope);
    this._seriesModel = seriesModel;
  };
  var normalStyleAccessPath = ['itemStyle', 'normal'];
  var emphasisStyleAccessPath = ['itemStyle', 'emphasis'];
  var normalLabelAccessPath = ['label', 'normal'];
  var emphasisLabelAccessPath = ['label', 'emphasis'];
  symbolProto._updateCommon = function(data, idx, symbolSize, seriesScope) {
    var symbolPath = this.childAt(0);
    var seriesModel = data.hostModel;
    var color = data.getItemVisual(idx, 'color');
    if (symbolPath.type !== 'image') {
      symbolPath.useStyle({strokeNoScale: true});
    }
    seriesScope = seriesScope || null;
    var itemStyle = seriesScope && seriesScope.itemStyle;
    var hoverItemStyle = seriesScope && seriesScope.hoverItemStyle;
    var symbolRotate = seriesScope && seriesScope.symbolRotate;
    var symbolOffset = seriesScope && seriesScope.symbolOffset;
    var labelModel = seriesScope && seriesScope.labelModel;
    var hoverLabelModel = seriesScope && seriesScope.hoverLabelModel;
    var hoverAnimation = seriesScope && seriesScope.hoverAnimation;
    if (!seriesScope || data.hasItemOption) {
      var itemModel = data.getItemModel(idx);
      itemStyle = itemModel.getModel(normalStyleAccessPath).getItemStyle(['color']);
      hoverItemStyle = itemModel.getModel(emphasisStyleAccessPath).getItemStyle();
      symbolRotate = itemModel.getShallow('symbolRotate');
      symbolOffset = itemModel.getShallow('symbolOffset');
      labelModel = itemModel.getModel(normalLabelAccessPath);
      hoverLabelModel = itemModel.getModel(emphasisLabelAccessPath);
      hoverAnimation = itemModel.getShallow('hoverAnimation');
    } else {
      hoverItemStyle = zrUtil.extend({}, hoverItemStyle);
    }
    var elStyle = symbolPath.style;
    symbolPath.attr('rotation', (symbolRotate || 0) * Math.PI / 180 || 0);
    if (symbolOffset) {
      symbolPath.attr('position', [numberUtil.parsePercent(symbolOffset[0], symbolSize[0]), numberUtil.parsePercent(symbolOffset[1], symbolSize[1])]);
    }
    symbolPath.setColor(color);
    symbolPath.setStyle(itemStyle);
    var opacity = data.getItemVisual(idx, 'opacity');
    if (opacity != null) {
      elStyle.opacity = opacity;
    }
    var dimensions = data.dimensions.slice();
    var valueDim;
    var dataType;
    while (dimensions.length && (valueDim = dimensions.pop(), dataType = data.getDimensionInfo(valueDim).type, dataType === 'ordinal' || dataType === 'time')) {}
    if (valueDim != null && labelModel.getShallow('show')) {
      graphic.setText(elStyle, labelModel, color);
      elStyle.text = zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'normal'), data.get(valueDim, idx));
    } else {
      elStyle.text = '';
    }
    if (valueDim != null && hoverLabelModel.getShallow('show')) {
      graphic.setText(hoverItemStyle, hoverLabelModel, color);
      hoverItemStyle.text = zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'emphasis'), data.get(valueDim, idx));
    } else {
      hoverItemStyle.text = '';
    }
    symbolPath.off('mouseover').off('mouseout').off('emphasis').off('normal');
    symbolPath.hoverStyle = hoverItemStyle;
    graphic.setHoverStyle(symbolPath);
    var scale = getScale(symbolSize);
    if (hoverAnimation && seriesModel.isAnimationEnabled()) {
      var onEmphasis = function() {
        var ratio = scale[1] / scale[0];
        this.animateTo({scale: [Math.max(scale[0] * 1.1, scale[0] + 3), Math.max(scale[1] * 1.1, scale[1] + 3 * ratio)]}, 400, 'elasticOut');
      };
      var onNormal = function() {
        this.animateTo({scale: scale}, 400, 'elasticOut');
      };
      symbolPath.on('mouseover', onEmphasis).on('mouseout', onNormal).on('emphasis', onEmphasis).on('normal', onNormal);
    }
  };
  symbolProto.fadeOut = function(cb) {
    var symbolPath = this.childAt(0);
    this.silent = true;
    symbolPath.style.text = '';
    graphic.updateProps(symbolPath, {scale: [0, 0]}, this._seriesModel, this.dataIndex, cb);
  };
  zrUtil.inherits(Symbol, graphic.Group);
  return Symbol;
});
