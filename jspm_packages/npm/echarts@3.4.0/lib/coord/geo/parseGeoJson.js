/* */ 
var zrUtil = require('zrender/lib/core/util');
var Region = require('./Region');
function decode(json) {
  if (!json.UTF8Encoding) {
    return json;
  }
  var features = json.features;
  for (var f = 0; f < features.length; f++) {
    var feature = features[f];
    var geometry = feature.geometry;
    var coordinates = geometry.coordinates;
    var encodeOffsets = geometry.encodeOffsets;
    for (var c = 0; c < coordinates.length; c++) {
      var coordinate = coordinates[c];
      if (geometry.type === 'Polygon') {
        coordinates[c] = decodePolygon(coordinate, encodeOffsets[c]);
      } else if (geometry.type === 'MultiPolygon') {
        for (var c2 = 0; c2 < coordinate.length; c2++) {
          var polygon = coordinate[c2];
          coordinate[c2] = decodePolygon(polygon, encodeOffsets[c][c2]);
        }
      }
    }
  }
  json.UTF8Encoding = false;
  return json;
}
function decodePolygon(coordinate, encodeOffsets) {
  var result = [];
  var prevX = encodeOffsets[0];
  var prevY = encodeOffsets[1];
  for (var i = 0; i < coordinate.length; i += 2) {
    var x = coordinate.charCodeAt(i) - 64;
    var y = coordinate.charCodeAt(i + 1) - 64;
    x = (x >> 1) ^ (-(x & 1));
    y = (y >> 1) ^ (-(y & 1));
    x += prevX;
    y += prevY;
    prevX = x;
    prevY = y;
    result.push([x / 1024, y / 1024]);
  }
  return result;
}
function flattern2D(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    for (var k = 0; k < array[i].length; k++) {
      ret.push(array[i][k]);
    }
  }
  return ret;
}
module.exports = function(geoJson) {
  decode(geoJson);
  return zrUtil.map(zrUtil.filter(geoJson.features, function(featureObj) {
    return featureObj.geometry && featureObj.properties;
  }), function(featureObj) {
    var properties = featureObj.properties;
    var geometry = featureObj.geometry;
    var coordinates = geometry.coordinates;
    if (geometry.type === 'MultiPolygon') {
      coordinates = flattern2D(coordinates);
    }
    return new Region(properties.name, coordinates, properties.cp);
  });
};
