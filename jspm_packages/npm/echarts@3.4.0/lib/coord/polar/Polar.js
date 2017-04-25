/* */ 
'use strict';
var RadiusAxis = require('./RadiusAxis');
var AngleAxis = require('./AngleAxis');
var Polar = function(name) {
  this.name = name || '';
  this.cx = 0;
  this.cy = 0;
  this._radiusAxis = new RadiusAxis();
  this._angleAxis = new AngleAxis();
};
Polar.prototype = {
  constructor: Polar,
  type: 'polar',
  dimensions: ['radius', 'angle'],
  containPoint: function(point) {
    var coord = this.pointToCoord(point);
    return this._radiusAxis.contain(coord[0]) && this._angleAxis.contain(coord[1]);
  },
  containData: function(data) {
    return this._radiusAxis.containData(data[0]) && this._angleAxis.containData(data[1]);
  },
  getAxis: function(axisType) {
    return this['_' + axisType + 'Axis'];
  },
  getAxesByScale: function(scaleType) {
    var axes = [];
    var angleAxis = this._angleAxis;
    var radiusAxis = this._radiusAxis;
    angleAxis.scale.type === scaleType && axes.push(angleAxis);
    radiusAxis.scale.type === scaleType && axes.push(radiusAxis);
    return axes;
  },
  getAngleAxis: function() {
    return this._angleAxis;
  },
  getRadiusAxis: function() {
    return this._radiusAxis;
  },
  getOtherAxis: function(axis) {
    var angleAxis = this._angleAxis;
    return axis === angleAxis ? this._radiusAxis : angleAxis;
  },
  getBaseAxis: function() {
    return this.getAxesByScale('ordinal')[0] || this.getAxesByScale('time')[0] || this.getAngleAxis();
  },
  dataToPoints: function(data) {
    return data.mapArray(this.dimensions, function(radius, angle) {
      return this.dataToPoint([radius, angle]);
    }, this);
  },
  dataToPoint: function(data, clamp) {
    return this.coordToPoint([this._radiusAxis.dataToRadius(data[0], clamp), this._angleAxis.dataToAngle(data[1], clamp)]);
  },
  pointToData: function(point, clamp) {
    var coord = this.pointToCoord(point);
    return [this._radiusAxis.radiusToData(coord[0], clamp), this._angleAxis.angleToData(coord[1], clamp)];
  },
  pointToCoord: function(point) {
    var dx = point[0] - this.cx;
    var dy = point[1] - this.cy;
    var angleAxis = this.getAngleAxis();
    var extent = angleAxis.getExtent();
    var minAngle = Math.min(extent[0], extent[1]);
    var maxAngle = Math.max(extent[0], extent[1]);
    angleAxis.inverse ? (minAngle = maxAngle - 360) : (maxAngle = minAngle + 360);
    var radius = Math.sqrt(dx * dx + dy * dy);
    dx /= radius;
    dy /= radius;
    var radian = Math.atan2(-dy, dx) / Math.PI * 180;
    var dir = radian < minAngle ? 1 : -1;
    while (radian < minAngle || radian > maxAngle) {
      radian += dir * 360;
    }
    return [radius, radian];
  },
  coordToPoint: function(coord) {
    var radius = coord[0];
    var radian = coord[1] / 180 * Math.PI;
    var x = Math.cos(radian) * radius + this.cx;
    var y = -Math.sin(radian) * radius + this.cy;
    return [x, y];
  }
};
module.exports = Polar;
