/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var ChartView = require('../../view/Chart');
var graphic = require('../../util/graphic');
var whiskerBoxCommon = require('../helper/whiskerBoxCommon');
var CandlestickView = ChartView.extend({
  type: 'candlestick',
  getStyleUpdater: function() {
    return updateStyle;
  },
  dispose: zrUtil.noop
});
zrUtil.mixin(CandlestickView, whiskerBoxCommon.viewMixin, true);
var normalStyleAccessPath = ['itemStyle', 'normal'];
var emphasisStyleAccessPath = ['itemStyle', 'emphasis'];
function updateStyle(itemGroup, data, idx) {
  var itemModel = data.getItemModel(idx);
  var normalItemStyleModel = itemModel.getModel(normalStyleAccessPath);
  var color = data.getItemVisual(idx, 'color');
  var borderColor = data.getItemVisual(idx, 'borderColor') || color;
  var itemStyle = normalItemStyleModel.getItemStyle(['color', 'color0', 'borderColor', 'borderColor0']);
  var whiskerEl = itemGroup.childAt(itemGroup.whiskerIndex);
  whiskerEl.useStyle(itemStyle);
  whiskerEl.style.stroke = borderColor;
  var bodyEl = itemGroup.childAt(itemGroup.bodyIndex);
  bodyEl.useStyle(itemStyle);
  bodyEl.style.fill = color;
  bodyEl.style.stroke = borderColor;
  var hoverStyle = itemModel.getModel(emphasisStyleAccessPath).getItemStyle();
  graphic.setHoverStyle(itemGroup, hoverStyle);
}
module.exports = CandlestickView;
