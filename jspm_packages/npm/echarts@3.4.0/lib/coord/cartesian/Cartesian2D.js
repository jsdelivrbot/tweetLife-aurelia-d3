/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var Cartesian = require('./Cartesian');
function Cartesian2D(name) {
  Cartesian.call(this, name);
}
Cartesian2D.prototype = {
  constructor: Cartesian2D,
  type: 'cartesian2d',
  dimensions: ['x', 'y'],
  getBaseAxis: function() {
    return this.getAxesByScale('ordinal')[0] || this.getAxesByScale('time')[0] || this.getAxis('x');
  },
  containPoint: function(point) {
    var axisX = this.getAxis('x');
    var axisY = this.getAxis('y');
    return axisX.contain(axisX.toLocalCoord(point[0])) && axisY.contain(axisY.toLocalCoord(point[1]));
  },
  containData: function(data) {
    return this.getAxis('x').containData(data[0]) && this.getAxis('y').containData(data[1]);
  },
  dataToPoints: function(data, stack) {
    return data.mapArray(['x', 'y'], function(x, y) {
      return this.dataToPoint([x, y]);
    }, stack, this);
  },
  dataToPoint: function(data, clamp) {
    var xAxis = this.getAxis('x');
    var yAxis = this.getAxis('y');
    return [xAxis.toGlobalCoord(xAxis.dataToCoord(data[0], clamp)), yAxis.toGlobalCoord(yAxis.dataToCoord(data[1], clamp))];
  },
  pointToData: function(point, clamp) {
    var xAxis = this.getAxis('x');
    var yAxis = this.getAxis('y');
    return [xAxis.coordToData(xAxis.toLocalCoord(point[0]), clamp), yAxis.coordToData(yAxis.toLocalCoord(point[1]), clamp)];
  },
  getOtherAxis: function(axis) {
    return this.getAxis(axis.dim === 'x' ? 'y' : 'x');
  }
};
zrUtil.inherits(Cartesian2D, Cartesian);
module.exports = Cartesian2D;
