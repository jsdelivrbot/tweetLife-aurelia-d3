/* */ 
var zrUtil = require('zrender/lib/core/util');
var graphic = require('../../util/graphic');
var symbolUtil = require('../../util/symbol');
var numberUtil = require('../../util/number');
var helper = require('./helper');
var parsePercent = numberUtil.parsePercent;
var BAR_BORDER_WIDTH_QUERY = ['itemStyle', 'normal', 'borderWidth'];
var LAYOUT_ATTRS = [{
  xy: 'x',
  wh: 'width',
  index: 0,
  posDesc: ['left', 'right']
}, {
  xy: 'y',
  wh: 'height',
  index: 1,
  posDesc: ['top', 'bottom']
}];
var pathForLineWidth = new graphic.Circle();
var BarView = require('../../echarts').extendChartView({
  type: 'pictorialBar',
  render: function(seriesModel, ecModel, api) {
    var group = this.group;
    var data = seriesModel.getData();
    var oldData = this._data;
    var cartesian = seriesModel.coordinateSystem;
    var baseAxis = cartesian.getBaseAxis();
    var isHorizontal = !!baseAxis.isHorizontal();
    var coordSysRect = cartesian.grid.getRect();
    var opt = {
      ecSize: {
        width: api.getWidth(),
        height: api.getHeight()
      },
      seriesModel: seriesModel,
      coordSys: cartesian,
      coordSysExtent: [[coordSysRect.x, coordSysRect.x + coordSysRect.width], [coordSysRect.y, coordSysRect.y + coordSysRect.height]],
      isHorizontal: isHorizontal,
      valueDim: LAYOUT_ATTRS[+isHorizontal],
      categoryDim: LAYOUT_ATTRS[1 - isHorizontal]
    };
    data.diff(oldData).add(function(dataIndex) {
      if (!data.hasValue(dataIndex)) {
        return;
      }
      var itemModel = getItemModel(data, dataIndex);
      var symbolMeta = getSymbolMeta(data, dataIndex, itemModel, opt);
      var bar = createBar(data, opt, symbolMeta);
      data.setItemGraphicEl(dataIndex, bar);
      group.add(bar);
      updateCommon(bar, opt, symbolMeta);
    }).update(function(newIndex, oldIndex) {
      var bar = oldData.getItemGraphicEl(oldIndex);
      if (!data.hasValue(newIndex)) {
        group.remove(bar);
        return;
      }
      var itemModel = getItemModel(data, newIndex);
      var symbolMeta = getSymbolMeta(data, newIndex, itemModel, opt);
      var pictorialShapeStr = getShapeStr(data, symbolMeta);
      if (bar && pictorialShapeStr !== bar.__pictorialShapeStr) {
        group.remove(bar);
        data.setItemGraphicEl(newIndex, null);
        bar = null;
      }
      if (bar) {
        updateBar(bar, opt, symbolMeta);
      } else {
        bar = createBar(data, opt, symbolMeta, true);
      }
      data.setItemGraphicEl(newIndex, bar);
      bar.__pictorialSymbolMeta = symbolMeta;
      group.add(bar);
      updateCommon(bar, opt, symbolMeta);
    }).remove(function(dataIndex) {
      var bar = oldData.getItemGraphicEl(dataIndex);
      bar && removeBar(oldData, dataIndex, bar.__pictorialSymbolMeta.animationModel, bar);
    }).execute();
    this._data = data;
    return this.group;
  },
  dispose: zrUtil.noop,
  remove: function(ecModel, api) {
    var group = this.group;
    var data = this._data;
    if (ecModel.get('animation')) {
      if (data) {
        data.eachItemGraphicEl(function(bar) {
          removeBar(data, bar.dataIndex, ecModel, bar);
        });
      }
    } else {
      group.removeAll();
    }
  }
});
function getSymbolMeta(data, dataIndex, itemModel, opt) {
  var layout = data.getItemLayout(dataIndex);
  var symbolRepeat = itemModel.get('symbolRepeat');
  var symbolClip = itemModel.get('symbolClip');
  var symbolPosition = itemModel.get('symbolPosition') || 'start';
  var symbolRotate = itemModel.get('symbolRotate');
  var rotation = (symbolRotate || 0) * Math.PI / 180 || 0;
  var symbolPatternSize = itemModel.get('symbolPatternSize') || 2;
  var isAnimationEnabled = itemModel.isAnimationEnabled();
  var symbolMeta = {
    dataIndex: dataIndex,
    layout: layout,
    itemModel: itemModel,
    symbolType: data.getItemVisual(dataIndex, 'symbol') || 'circle',
    color: data.getItemVisual(dataIndex, 'color'),
    symbolClip: symbolClip,
    symbolRepeat: symbolRepeat,
    symbolRepeatDirection: itemModel.get('symbolRepeatDirection'),
    symbolPatternSize: symbolPatternSize,
    rotation: rotation,
    animationModel: isAnimationEnabled ? itemModel : null,
    hoverAnimation: isAnimationEnabled && itemModel.get('hoverAnimation'),
    z2: itemModel.getShallow('z', true) || 0
  };
  prepareBarLength(itemModel, symbolRepeat, layout, opt, symbolMeta);
  prepareSymbolSize(data, dataIndex, layout, symbolRepeat, symbolClip, symbolMeta.boundingLength, symbolMeta.pxSign, symbolPatternSize, opt, symbolMeta);
  prepareLineWidth(itemModel, symbolMeta.symbolScale, rotation, opt, symbolMeta);
  var symbolSize = symbolMeta.symbolSize;
  var symbolOffset = itemModel.get('symbolOffset');
  if (zrUtil.isArray(symbolOffset)) {
    symbolOffset = [parsePercent(symbolOffset[0], symbolSize[0]), parsePercent(symbolOffset[1], symbolSize[1])];
  }
  prepareLayoutInfo(itemModel, symbolSize, layout, symbolRepeat, symbolClip, symbolOffset, symbolPosition, symbolMeta.valueLineWidth, symbolMeta.boundingLength, symbolMeta.repeatCutLength, opt, symbolMeta);
  return symbolMeta;
}
function prepareBarLength(itemModel, symbolRepeat, layout, opt, output) {
  var valueDim = opt.valueDim;
  var symbolBoundingData = itemModel.get('symbolBoundingData');
  var valueAxis = opt.coordSys.getOtherAxis(opt.coordSys.getBaseAxis());
  var zeroPx = valueAxis.toGlobalCoord(valueAxis.dataToCoord(0));
  var boundingLength = output.boundingLength = symbolBoundingData != null ? valueAxis.toGlobalCoord(valueAxis.dataToCoord(valueAxis.scale.parse(symbolBoundingData))) - zeroPx : symbolRepeat ? opt.coordSysExtent[valueDim.index][1 - +(layout[valueDim.wh] <= 0)] - zeroPx : layout[valueDim.wh];
  if (symbolRepeat) {
    output.repeatCutLength = layout[valueDim.wh];
  }
  output.pxSign = boundingLength > 0 ? 1 : boundingLength < 0 ? -1 : 0;
}
function prepareSymbolSize(data, dataIndex, layout, symbolRepeat, symbolClip, boundingLength, pxSign, symbolPatternSize, opt, output) {
  var valueDim = opt.valueDim;
  var categoryDim = opt.categoryDim;
  var categorySize = Math.abs(layout[categoryDim.wh]);
  var symbolSize = data.getItemVisual(dataIndex, 'symbolSize');
  if (zrUtil.isArray(symbolSize)) {
    symbolSize = symbolSize.slice();
  } else {
    if (symbolSize == null) {
      symbolSize = '100%';
    }
    symbolSize = [symbolSize, symbolSize];
  }
  symbolSize[categoryDim.index] = parsePercent(symbolSize[categoryDim.index], categorySize);
  symbolSize[valueDim.index] = parsePercent(symbolSize[valueDim.index], symbolRepeat ? categorySize : Math.abs(boundingLength));
  output.symbolSize = symbolSize;
  var symbolScale = output.symbolScale = [symbolSize[0] / symbolPatternSize, symbolSize[1] / symbolPatternSize];
  symbolScale[valueDim.index] *= (opt.isHorizontal ? -1 : 1) * pxSign;
}
function prepareLineWidth(itemModel, symbolScale, rotation, opt, output) {
  var valueLineWidth = itemModel.get(BAR_BORDER_WIDTH_QUERY) || 0;
  if (valueLineWidth) {
    pathForLineWidth.attr({
      scale: symbolScale.slice(),
      rotation: rotation
    });
    pathForLineWidth.updateTransform();
    valueLineWidth /= pathForLineWidth.getLineScale();
    valueLineWidth *= symbolScale[opt.valueDim.index];
  }
  output.valueLineWidth = valueLineWidth;
}
function prepareLayoutInfo(itemModel, symbolSize, layout, symbolRepeat, symbolClip, symbolOffset, symbolPosition, valueLineWidth, boundingLength, repeatCutLength, opt, output) {
  var categoryDim = opt.categoryDim;
  var valueDim = opt.valueDim;
  var pxSign = output.pxSign;
  var unitLength = Math.max(symbolSize[valueDim.index] + valueLineWidth, 0);
  var pathLen = unitLength;
  if (symbolRepeat) {
    var absBoundingLength = Math.abs(boundingLength);
    var symbolMargin = zrUtil.retrieve(itemModel.get('symbolMargin'), '15%') + '';
    var hasEndGap = false;
    if (symbolMargin.lastIndexOf('!') === symbolMargin.length - 1) {
      hasEndGap = true;
      symbolMargin = symbolMargin.slice(0, symbolMargin.length - 1);
    }
    symbolMargin = parsePercent(symbolMargin, symbolSize[valueDim.index]);
    var uLenWithMargin = Math.max(unitLength + symbolMargin * 2, 0);
    var endFix = hasEndGap ? 0 : symbolMargin * 2;
    var repeatSpecified = numberUtil.isNumeric(symbolRepeat);
    var repeatTimes = repeatSpecified ? symbolRepeat : toIntTimes((absBoundingLength + endFix) / uLenWithMargin);
    var mDiff = absBoundingLength - repeatTimes * unitLength;
    symbolMargin = mDiff / 2 / (hasEndGap ? repeatTimes : repeatTimes - 1);
    uLenWithMargin = unitLength + symbolMargin * 2;
    endFix = hasEndGap ? 0 : symbolMargin * 2;
    if (!repeatSpecified && symbolRepeat !== 'fixed') {
      repeatTimes = repeatCutLength ? toIntTimes((Math.abs(repeatCutLength) + endFix) / uLenWithMargin) : 0;
    }
    pathLen = repeatTimes * uLenWithMargin - endFix;
    output.repeatTimes = repeatTimes;
    output.symbolMargin = symbolMargin;
  }
  var sizeFix = pxSign * (pathLen / 2);
  var pathPosition = output.pathPosition = [];
  pathPosition[categoryDim.index] = layout[categoryDim.wh] / 2;
  pathPosition[valueDim.index] = symbolPosition === 'start' ? sizeFix : symbolPosition === 'end' ? boundingLength - sizeFix : boundingLength / 2;
  if (symbolOffset) {
    pathPosition[0] += symbolOffset[0];
    pathPosition[1] += symbolOffset[1];
  }
  var bundlePosition = output.bundlePosition = [];
  bundlePosition[categoryDim.index] = layout[categoryDim.xy];
  bundlePosition[valueDim.index] = layout[valueDim.xy];
  var barRectShape = output.barRectShape = zrUtil.extend({}, layout);
  barRectShape[valueDim.wh] = pxSign * Math.max(Math.abs(layout[valueDim.wh]), Math.abs(pathPosition[valueDim.index] + sizeFix));
  barRectShape[categoryDim.wh] = layout[categoryDim.wh];
  var clipShape = output.clipShape = {};
  clipShape[categoryDim.xy] = -layout[categoryDim.xy];
  clipShape[categoryDim.wh] = opt.ecSize[categoryDim.wh];
  clipShape[valueDim.xy] = 0;
  clipShape[valueDim.wh] = layout[valueDim.wh];
}
function createPath(symbolMeta) {
  var symbolPatternSize = symbolMeta.symbolPatternSize;
  var path = symbolUtil.createSymbol(symbolMeta.symbolType, -symbolPatternSize / 2, -symbolPatternSize / 2, symbolPatternSize, symbolPatternSize, symbolMeta.color);
  path.attr({culling: true});
  path.type !== 'image' && path.setStyle({strokeNoScale: true});
  return path;
}
function createOrUpdateRepeatSymbols(bar, opt, symbolMeta, isUpdate) {
  var bundle = bar.__pictorialBundle;
  var symbolSize = symbolMeta.symbolSize;
  var valueLineWidth = symbolMeta.valueLineWidth;
  var pathPosition = symbolMeta.pathPosition;
  var valueDim = opt.valueDim;
  var repeatTimes = symbolMeta.repeatTimes || 0;
  var index = 0;
  var unit = symbolSize[opt.valueDim.index] + valueLineWidth + symbolMeta.symbolMargin * 2;
  eachPath(bar, function(path) {
    path.__pictorialAnimationIndex = index;
    path.__pictorialRepeatTimes = repeatTimes;
    if (index < repeatTimes) {
      updateAttr(path, null, makeTarget(index), symbolMeta, isUpdate);
    } else {
      updateAttr(path, null, {scale: [0, 0]}, symbolMeta, isUpdate, function() {
        bundle.remove(path);
      });
    }
    updateHoverAnimation(path, symbolMeta);
    index++;
  });
  for (; index < repeatTimes; index++) {
    var path = createPath(symbolMeta);
    path.__pictorialAnimationIndex = index;
    path.__pictorialRepeatTimes = repeatTimes;
    bundle.add(path);
    var target = makeTarget(index, true);
    updateAttr(path, {
      position: target.position,
      scale: [0, 0]
    }, {
      scale: target.scale,
      rotation: target.rotation
    }, symbolMeta, isUpdate);
    path.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
    updateHoverAnimation(path, symbolMeta);
  }
  function makeTarget(index) {
    var position = pathPosition.slice();
    var pxSign = symbolMeta.pxSign;
    var i = index;
    if (symbolMeta.symbolRepeatDirection === 'start' ? pxSign > 0 : pxSign < 0) {
      i = repeatTimes - 1 - index;
    }
    position[valueDim.index] = unit * (i - repeatTimes / 2 + 0.5) + pathPosition[valueDim.index];
    return {
      position: position,
      scale: symbolMeta.symbolScale.slice(),
      rotation: symbolMeta.rotation
    };
  }
  function onMouseOver() {
    eachPath(bar, function(path) {
      path.trigger('emphasis');
    });
  }
  function onMouseOut() {
    eachPath(bar, function(path) {
      path.trigger('normal');
    });
  }
}
function createOrUpdateSingleSymbol(bar, opt, symbolMeta, isUpdate) {
  var bundle = bar.__pictorialBundle;
  var mainPath = bar.__pictorialMainPath;
  if (!mainPath) {
    mainPath = bar.__pictorialMainPath = createPath(symbolMeta);
    bundle.add(mainPath);
    updateAttr(mainPath, {
      position: symbolMeta.pathPosition.slice(),
      scale: [0, 0],
      rotation: symbolMeta.rotation
    }, {scale: symbolMeta.symbolScale.slice()}, symbolMeta, isUpdate);
    mainPath.on('mouseover', onMouseOver).on('mouseout', onMouseOut);
  } else {
    updateAttr(mainPath, null, {
      position: symbolMeta.pathPosition.slice(),
      scale: symbolMeta.symbolScale.slice(),
      rotation: symbolMeta.rotation
    }, symbolMeta, isUpdate);
  }
  updateHoverAnimation(mainPath, symbolMeta);
  function onMouseOver() {
    this.trigger('emphasis');
  }
  function onMouseOut() {
    this.trigger('normal');
  }
}
function createOrUpdateBarRect(bar, symbolMeta, isUpdate) {
  var rectShape = zrUtil.extend({}, symbolMeta.barRectShape);
  var barRect = bar.__pictorialBarRect;
  if (!barRect) {
    barRect = bar.__pictorialBarRect = new graphic.Rect({
      z2: 2,
      shape: rectShape,
      silent: true,
      style: {
        stroke: 'transparent',
        fill: 'transparent',
        lineWidth: 0
      }
    });
    bar.add(barRect);
  } else {
    updateAttr(barRect, null, {shape: rectShape}, symbolMeta, isUpdate);
  }
}
function createOrUpdateClip(bar, opt, symbolMeta, isUpdate) {
  if (symbolMeta.symbolClip) {
    var clipPath = bar.__pictorialClipPath;
    var clipShape = zrUtil.extend({}, symbolMeta.clipShape);
    var valueDim = opt.valueDim;
    var animationModel = symbolMeta.animationModel;
    var dataIndex = symbolMeta.dataIndex;
    if (clipPath) {
      graphic.updateProps(clipPath, {shape: clipShape}, animationModel, dataIndex);
    } else {
      clipShape[valueDim.wh] = 0;
      clipPath = new graphic.Rect({shape: clipShape});
      bar.__pictorialBundle.setClipPath(clipPath);
      bar.__pictorialClipPath = clipPath;
      var target = {};
      target[valueDim.wh] = symbolMeta.clipShape[valueDim.wh];
      graphic[isUpdate ? 'updateProps' : 'initProps'](clipPath, {shape: target}, animationModel, dataIndex);
    }
  }
}
function getItemModel(data, dataIndex) {
  var itemModel = data.getItemModel(dataIndex);
  itemModel.getAnimationDelayParams = getAnimationDelayParams;
  itemModel.isAnimationEnabled = isAnimationEnabled;
  return itemModel;
}
function getAnimationDelayParams(path) {
  return {
    index: path.__pictorialAnimationIndex,
    count: path.__pictorialRepeatTimes
  };
}
function isAnimationEnabled() {
  return this.parentModel.isAnimationEnabled() && !!this.getShallow('animation');
}
function updateHoverAnimation(path, symbolMeta) {
  path.off('emphasis').off('normal');
  var scale = symbolMeta.symbolScale.slice();
  symbolMeta.hoverAnimation && path.on('emphasis', function() {
    this.animateTo({scale: [scale[0] * 1.1, scale[1] * 1.1]}, 400, 'elasticOut');
  }).on('normal', function() {
    this.animateTo({scale: scale.slice()}, 400, 'elasticOut');
  });
}
function createBar(data, opt, symbolMeta, isUpdate) {
  var bar = new graphic.Group();
  var bundle = new graphic.Group();
  bar.add(bundle);
  bar.__pictorialBundle = bundle;
  bundle.attr('position', symbolMeta.bundlePosition.slice());
  if (symbolMeta.symbolRepeat) {
    createOrUpdateRepeatSymbols(bar, opt, symbolMeta);
  } else {
    createOrUpdateSingleSymbol(bar, opt, symbolMeta);
  }
  createOrUpdateBarRect(bar, symbolMeta, isUpdate);
  createOrUpdateClip(bar, opt, symbolMeta, isUpdate);
  bar.__pictorialShapeStr = getShapeStr(data, symbolMeta);
  bar.__pictorialSymbolMeta = symbolMeta;
  return bar;
}
function updateBar(bar, opt, symbolMeta) {
  var animationModel = symbolMeta.animationModel;
  var dataIndex = symbolMeta.dataIndex;
  var bundle = bar.__pictorialBundle;
  graphic.updateProps(bundle, {position: symbolMeta.bundlePosition.slice()}, animationModel, dataIndex);
  if (symbolMeta.symbolRepeat) {
    createOrUpdateRepeatSymbols(bar, opt, symbolMeta, true);
  } else {
    createOrUpdateSingleSymbol(bar, opt, symbolMeta, true);
  }
  createOrUpdateBarRect(bar, symbolMeta, true);
  createOrUpdateClip(bar, opt, symbolMeta, true);
}
function removeBar(data, dataIndex, animationModel, bar) {
  var labelRect = bar.__pictorialBarRect;
  labelRect && (labelRect.style.text = '');
  var pathes = [];
  eachPath(bar, function(path) {
    pathes.push(path);
  });
  bar.__pictorialMainPath && pathes.push(bar.__pictorialMainPath);
  bar.__pictorialClipPath && (animationModel = null);
  zrUtil.each(pathes, function(path) {
    graphic.updateProps(path, {scale: [0, 0]}, animationModel, dataIndex, function() {
      bar.parent && bar.parent.remove(bar);
    });
  });
  data.setItemGraphicEl(dataIndex, null);
}
function getShapeStr(data, symbolMeta) {
  return [data.getItemVisual(symbolMeta.dataIndex, 'symbol') || 'none', !!symbolMeta.symbolRepeat, !!symbolMeta.symbolClip].join(':');
}
function eachPath(bar, cb, context) {
  zrUtil.each(bar.__pictorialBundle.children(), function(el) {
    el !== bar.__pictorialBarRect && cb.call(context, el);
  });
}
function updateAttr(el, immediateAttrs, animationAttrs, symbolMeta, isUpdate, cb) {
  immediateAttrs && el.attr(immediateAttrs);
  if (symbolMeta.symbolClip && !isUpdate) {
    animationAttrs && el.attr(animationAttrs);
  } else {
    animationAttrs && graphic[isUpdate ? 'updateProps' : 'initProps'](el, animationAttrs, symbolMeta.animationModel, symbolMeta.dataIndex, cb);
  }
}
function updateCommon(bar, opt, symbolMeta) {
  var color = symbolMeta.color;
  var dataIndex = symbolMeta.dataIndex;
  var itemModel = symbolMeta.itemModel;
  var normalStyle = itemModel.getModel('itemStyle.normal').getItemStyle(['color']);
  var hoverStyle = itemModel.getModel('itemStyle.emphasis').getItemStyle();
  eachPath(bar, function(path) {
    path.setColor(color);
    path.setStyle(zrUtil.defaults({
      fill: color,
      opacity: symbolMeta.opacity
    }, normalStyle));
    graphic.setHoverStyle(path, hoverStyle);
    path.z2 = symbolMeta.z2;
  });
  var barRectHoverStyle = {};
  var barPositionOutside = opt.valueDim.posDesc[+(symbolMeta.boundingLength > 0)];
  var barRect = bar.__pictorialBarRect;
  helper.setLabel(barRect.style, barRectHoverStyle, itemModel, color, opt.seriesModel, dataIndex, barPositionOutside);
  graphic.setHoverStyle(barRect, barRectHoverStyle);
}
function toIntTimes(times) {
  var roundedTimes = Math.round(times);
  return Math.abs(times - roundedTimes) < 1e-4 ? roundedTimes : Math.ceil(times);
}
module.exports = BarView;
