/* */ 
var parseGeoJson = require('./parseGeoJson');
var zrUtil = require('zrender/lib/core/util');
var BoundingRect = require('zrender/lib/core/BoundingRect');
var View = require('../View');
var geoFixFuncs = [require('./fix/nanhai'), require('./fix/textCoord'), require('./fix/geoCoord')];
function Geo(name, map, geoJson, specialAreas, nameMap) {
  View.call(this, name);
  this.map = map;
  this._nameCoordMap = {};
  this.loadGeoJson(geoJson, specialAreas, nameMap);
}
Geo.prototype = {
  constructor: Geo,
  type: 'geo',
  dimensions: ['lng', 'lat'],
  containCoord: function(coord) {
    var regions = this.regions;
    for (var i = 0; i < regions.length; i++) {
      if (regions[i].contain(coord)) {
        return true;
      }
    }
    return false;
  },
  loadGeoJson: function(geoJson, specialAreas, nameMap) {
    try {
      this.regions = geoJson ? parseGeoJson(geoJson) : [];
    } catch (e) {
      throw 'Invalid geoJson format\n' + e;
    }
    specialAreas = specialAreas || {};
    nameMap = nameMap || {};
    var regions = this.regions;
    var regionsMap = {};
    for (var i = 0; i < regions.length; i++) {
      var regionName = regions[i].name;
      regionName = nameMap[regionName] || regionName;
      regions[i].name = regionName;
      regionsMap[regionName] = regions[i];
      this.addGeoCoord(regionName, regions[i].center);
      var specialArea = specialAreas[regionName];
      if (specialArea) {
        regions[i].transformTo(specialArea.left, specialArea.top, specialArea.width, specialArea.height);
      }
    }
    this._regionsMap = regionsMap;
    this._rect = null;
    zrUtil.each(geoFixFuncs, function(fixFunc) {
      fixFunc(this);
    }, this);
  },
  transformTo: function(x, y, width, height) {
    var rect = this.getBoundingRect();
    rect = rect.clone();
    rect.y = -rect.y - rect.height;
    var viewTransform = this._viewTransform;
    viewTransform.transform = rect.calculateTransform(new BoundingRect(x, y, width, height));
    viewTransform.decomposeTransform();
    var scale = viewTransform.scale;
    scale[1] = -scale[1];
    viewTransform.updateTransform();
    this._updateTransform();
  },
  getRegion: function(name) {
    return this._regionsMap[name];
  },
  getRegionByCoord: function(coord) {
    var regions = this.regions;
    for (var i = 0; i < regions.length; i++) {
      if (regions[i].contain(coord)) {
        return regions[i];
      }
    }
  },
  addGeoCoord: function(name, geoCoord) {
    this._nameCoordMap[name] = geoCoord;
  },
  getGeoCoord: function(name) {
    return this._nameCoordMap[name];
  },
  getBoundingRect: function() {
    if (this._rect) {
      return this._rect;
    }
    var rect;
    var regions = this.regions;
    for (var i = 0; i < regions.length; i++) {
      var regionRect = regions[i].getBoundingRect();
      rect = rect || regionRect.clone();
      rect.union(regionRect);
    }
    return (this._rect = rect || new BoundingRect(0, 0, 0, 0));
  },
  dataToPoints: function(data) {
    var item = [];
    return data.mapArray(['lng', 'lat'], function(lon, lat) {
      item[0] = lon;
      item[1] = lat;
      return this.dataToPoint(item);
    }, this);
  },
  dataToPoint: function(data) {
    if (typeof data === 'string') {
      data = this.getGeoCoord(data);
    }
    if (data) {
      return View.prototype.dataToPoint.call(this, data);
    }
  },
  convertToPixel: zrUtil.curry(doConvert, 'dataToPoint'),
  convertFromPixel: zrUtil.curry(doConvert, 'pointToData')
};
zrUtil.mixin(Geo, View);
function doConvert(methodName, ecModel, finder, value) {
  var geoModel = finder.geoModel;
  var seriesModel = finder.seriesModel;
  var coordSys = geoModel ? geoModel.coordinateSystem : seriesModel ? (seriesModel.coordinateSystem || (seriesModel.getReferringComponents('geo')[0] || {}).coordinateSystem) : null;
  return coordSys === this ? coordSys[methodName](value) : null;
}
module.exports = Geo;
