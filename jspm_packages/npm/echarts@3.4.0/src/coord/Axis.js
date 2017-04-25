/* */ 
"format cjs";
define(function(require) {
  var numberUtil = require('../util/number');
  var linearMap = numberUtil.linearMap;
  var zrUtil = require('zrender/core/util');
  function fixExtentWithBands(extent, nTick) {
    var size = extent[1] - extent[0];
    var len = nTick;
    var margin = size / len / 2;
    extent[0] += margin;
    extent[1] -= margin;
  }
  var normalizedExtent = [0, 1];
  var Axis = function(dim, scale, extent) {
    this.dim = dim;
    this.scale = scale;
    this._extent = extent || [0, 0];
    this.inverse = false;
    this.onBand = false;
  };
  Axis.prototype = {
    constructor: Axis,
    contain: function(coord) {
      var extent = this._extent;
      var min = Math.min(extent[0], extent[1]);
      var max = Math.max(extent[0], extent[1]);
      return coord >= min && coord <= max;
    },
    containData: function(data) {
      return this.contain(this.dataToCoord(data));
    },
    getExtent: function() {
      var ret = this._extent.slice();
      return ret;
    },
    getPixelPrecision: function(dataExtent) {
      return numberUtil.getPixelPrecision(dataExtent || this.scale.getExtent(), this._extent);
    },
    setExtent: function(start, end) {
      var extent = this._extent;
      extent[0] = start;
      extent[1] = end;
    },
    dataToCoord: function(data, clamp) {
      var extent = this._extent;
      var scale = this.scale;
      data = scale.normalize(data);
      if (this.onBand && scale.type === 'ordinal') {
        extent = extent.slice();
        fixExtentWithBands(extent, scale.count());
      }
      return linearMap(data, normalizedExtent, extent, clamp);
    },
    coordToData: function(coord, clamp) {
      var extent = this._extent;
      var scale = this.scale;
      if (this.onBand && scale.type === 'ordinal') {
        extent = extent.slice();
        fixExtentWithBands(extent, scale.count());
      }
      var t = linearMap(coord, extent, normalizedExtent, clamp);
      return this.scale.scale(t);
    },
    getTicksCoords: function(alignWithLabel) {
      if (this.onBand && !alignWithLabel) {
        var bands = this.getBands();
        var coords = [];
        for (var i = 0; i < bands.length; i++) {
          coords.push(bands[i][0]);
        }
        if (bands[i - 1]) {
          coords.push(bands[i - 1][1]);
        }
        return coords;
      } else {
        return zrUtil.map(this.scale.getTicks(), this.dataToCoord, this);
      }
    },
    getLabelsCoords: function() {
      return zrUtil.map(this.scale.getTicks(), this.dataToCoord, this);
    },
    getBands: function() {
      var extent = this.getExtent();
      var bands = [];
      var len = this.scale.count();
      var start = extent[0];
      var end = extent[1];
      var span = end - start;
      for (var i = 0; i < len; i++) {
        bands.push([span * i / len + start, span * (i + 1) / len + start]);
      }
      return bands;
    },
    getBandWidth: function() {
      var axisExtent = this._extent;
      var dataExtent = this.scale.getExtent();
      var len = dataExtent[1] - dataExtent[0] + (this.onBand ? 1 : 0);
      len === 0 && (len = 1);
      var size = Math.abs(axisExtent[1] - axisExtent[0]);
      return Math.abs(size) / len;
    },
    isBlank: function() {
      return this._isBlank;
    },
    setBlank: function(isBlank) {
      this._isBlank = isBlank;
    }
  };
  return Axis;
});
