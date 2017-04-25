/* */ 
var clazzUtil = require('../util/clazz');
function Scale() {
  this._extent = [Infinity, -Infinity];
  this._interval = 0;
  this.init && this.init.apply(this, arguments);
}
var scaleProto = Scale.prototype;
scaleProto.parse = function(val) {
  return val;
};
scaleProto.contain = function(val) {
  var extent = this._extent;
  return val >= extent[0] && val <= extent[1];
};
scaleProto.normalize = function(val) {
  var extent = this._extent;
  if (extent[1] === extent[0]) {
    return 0.5;
  }
  return (val - extent[0]) / (extent[1] - extent[0]);
};
scaleProto.scale = function(val) {
  var extent = this._extent;
  return val * (extent[1] - extent[0]) + extent[0];
};
scaleProto.unionExtent = function(other) {
  var extent = this._extent;
  other[0] < extent[0] && (extent[0] = other[0]);
  other[1] > extent[1] && (extent[1] = other[1]);
};
scaleProto.unionExtentFromData = function(data, dim) {
  this.unionExtent(data.getDataExtent(dim, true));
};
scaleProto.getExtent = function() {
  return this._extent.slice();
};
scaleProto.setExtent = function(start, end) {
  var thisExtent = this._extent;
  if (!isNaN(start)) {
    thisExtent[0] = start;
  }
  if (!isNaN(end)) {
    thisExtent[1] = end;
  }
};
scaleProto.getTicksLabels = function() {
  var labels = [];
  var ticks = this.getTicks();
  for (var i = 0; i < ticks.length; i++) {
    labels.push(this.getLabel(ticks[i]));
  }
  return labels;
};
clazzUtil.enableClassExtend(Scale);
clazzUtil.enableClassManagement(Scale, {registerWhenExtend: true});
module.exports = Scale;
