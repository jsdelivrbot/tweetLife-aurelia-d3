/* */ 
"format cjs";
define(function(require) {
  var graphic = require('../../util/graphic');
  var zrUtil = require('zrender/core/util');
  function Polyline(lineData, idx, seriesScope) {
    graphic.Group.call(this);
    this._createPolyline(lineData, idx, seriesScope);
  }
  var polylineProto = Polyline.prototype;
  polylineProto._createPolyline = function(lineData, idx, seriesScope) {
    var points = lineData.getItemLayout(idx);
    var line = new graphic.Polyline({shape: {points: points}});
    this.add(line);
    this._updateCommonStl(lineData, idx, seriesScope);
  };
  polylineProto.updateData = function(lineData, idx, seriesScope) {
    var seriesModel = lineData.hostModel;
    var line = this.childAt(0);
    var target = {shape: {points: lineData.getItemLayout(idx)}};
    graphic.updateProps(line, target, seriesModel, idx);
    this._updateCommonStl(lineData, idx, seriesScope);
  };
  polylineProto._updateCommonStl = function(lineData, idx, seriesScope) {
    var line = this.childAt(0);
    var itemModel = lineData.getItemModel(idx);
    var visualColor = lineData.getItemVisual(idx, 'color');
    var lineStyle = seriesScope && seriesScope.lineStyle;
    var hoverLineStyle = seriesScope && seriesScope.hoverLineStyle;
    if (!seriesScope || lineData.hasItemOption) {
      lineStyle = itemModel.getModel('lineStyle.normal').getLineStyle();
      hoverLineStyle = itemModel.getModel('lineStyle.emphasis').getLineStyle();
    }
    line.useStyle(zrUtil.defaults({
      strokeNoScale: true,
      fill: 'none',
      stroke: visualColor
    }, lineStyle));
    line.hoverStyle = hoverLineStyle;
    graphic.setHoverStyle(this);
  };
  polylineProto.updateLayout = function(lineData, idx) {
    var polyline = this.childAt(0);
    polyline.setShape('points', lineData.getItemLayout(idx));
  };
  zrUtil.inherits(Polyline, graphic.Group);
  return Polyline;
});
