/* */ 
"format cjs";
define(function(require) {
  var Geo = require('./Geo');
  var layout = require('../../util/layout');
  var zrUtil = require('zrender/core/util');
  var numberUtil = require('../../util/number');
  var mapDataStores = {};
  function resizeGeo(geoModel, api) {
    var rect = this.getBoundingRect();
    var boxLayoutOption;
    var center = geoModel.get('layoutCenter');
    var size = geoModel.get('layoutSize');
    var viewWidth = api.getWidth();
    var viewHeight = api.getHeight();
    var aspectScale = geoModel.get('aspectScale') || 0.75;
    var aspect = rect.width / rect.height * aspectScale;
    var useCenterAndSize = false;
    if (center && size) {
      center = [numberUtil.parsePercent(center[0], viewWidth), numberUtil.parsePercent(center[1], viewHeight)];
      size = numberUtil.parsePercent(size, Math.min(viewWidth, viewHeight));
      if (!isNaN(center[0]) && !isNaN(center[1]) && !isNaN(size)) {
        useCenterAndSize = true;
      } else {
        if (__DEV__) {
          console.warn('Given layoutCenter or layoutSize data are invalid. Use left/top/width/height instead.');
        }
      }
    }
    var viewRect;
    if (useCenterAndSize) {
      var viewRect = {};
      if (aspect > 1) {
        viewRect.width = size;
        viewRect.height = size / aspect;
      } else {
        viewRect.height = size;
        viewRect.width = size * aspect;
      }
      viewRect.y = center[1] - viewRect.height / 2;
      viewRect.x = center[0] - viewRect.width / 2;
    } else {
      boxLayoutOption = geoModel.getBoxLayoutParams();
      boxLayoutOption.aspect = aspect;
      viewRect = layout.getLayoutRect(boxLayoutOption, {
        width: viewWidth,
        height: viewHeight
      });
    }
    this.setViewRect(viewRect.x, viewRect.y, viewRect.width, viewRect.height);
    this.setCenter(geoModel.get('center'));
    this.setZoom(geoModel.get('zoom'));
  }
  function setGeoCoords(geo, model) {
    zrUtil.each(model.get('geoCoord'), function(geoCoord, name) {
      geo.addGeoCoord(name, geoCoord);
    });
  }
  if (__DEV__) {
    var mapNotExistsError = function(name) {
      console.error('Map ' + name + ' not exists. You can download map file on http://echarts.baidu.com/download-map.html');
    };
  }
  var geoCreator = {
    dimensions: Geo.prototype.dimensions,
    create: function(ecModel, api) {
      var geoList = [];
      ecModel.eachComponent('geo', function(geoModel, idx) {
        var name = geoModel.get('map');
        var mapData = mapDataStores[name];
        if (__DEV__) {
          if (!mapData) {
            mapNotExistsError(name);
          }
        }
        var geo = new Geo(name + idx, name, mapData && mapData.geoJson, mapData && mapData.specialAreas, geoModel.get('nameMap'));
        geo.zoomLimit = geoModel.get('scaleLimit');
        geoList.push(geo);
        setGeoCoords(geo, geoModel);
        geoModel.coordinateSystem = geo;
        geo.model = geoModel;
        geo.resize = resizeGeo;
        geo.resize(geoModel, api);
      });
      ecModel.eachSeries(function(seriesModel) {
        var coordSys = seriesModel.get('coordinateSystem');
        if (coordSys === 'geo') {
          var geoIndex = seriesModel.get('geoIndex') || 0;
          seriesModel.coordinateSystem = geoList[geoIndex];
        }
      });
      var mapModelGroupBySeries = {};
      ecModel.eachSeriesByType('map', function(seriesModel) {
        if (!seriesModel.getHostGeoModel()) {
          var mapType = seriesModel.getMapType();
          mapModelGroupBySeries[mapType] = mapModelGroupBySeries[mapType] || [];
          mapModelGroupBySeries[mapType].push(seriesModel);
        }
      });
      zrUtil.each(mapModelGroupBySeries, function(mapSeries, mapType) {
        var mapData = mapDataStores[mapType];
        if (__DEV__) {
          if (!mapData) {
            mapNotExistsError(mapSeries[0].get('map'));
          }
        }
        var nameMapList = zrUtil.map(mapSeries, function(singleMapSeries) {
          return singleMapSeries.get('nameMap');
        });
        var geo = new Geo(mapType, mapType, mapData && mapData.geoJson, mapData && mapData.specialAreas, zrUtil.mergeAll(nameMapList));
        geo.zoomLimit = zrUtil.retrieve.apply(null, zrUtil.map(mapSeries, function(singleMapSeries) {
          return singleMapSeries.get('scaleLimit');
        }));
        geoList.push(geo);
        geo.resize = resizeGeo;
        geo.resize(mapSeries[0], api);
        zrUtil.each(mapSeries, function(singleMapSeries) {
          singleMapSeries.coordinateSystem = geo;
          setGeoCoords(geo, singleMapSeries);
        });
      });
      return geoList;
    },
    registerMap: function(mapName, geoJson, specialAreas) {
      if (geoJson.geoJson && !geoJson.features) {
        specialAreas = geoJson.specialAreas;
        geoJson = geoJson.geoJson;
      }
      if (typeof geoJson === 'string') {
        geoJson = (typeof JSON !== 'undefined' && JSON.parse) ? JSON.parse(geoJson) : (new Function('return (' + geoJson + ');'))();
      }
      mapDataStores[mapName] = {
        geoJson: geoJson,
        specialAreas: specialAreas
      };
    },
    getMap: function(mapName) {
      return mapDataStores[mapName];
    },
    getFilledRegions: function(originRegionArr, mapName) {
      var regionsArr = (originRegionArr || []).slice();
      var map = geoCreator.getMap(mapName);
      var geoJson = map && map.geoJson;
      if (!geoJson) {
        if (__DEV__) {
          mapNotExistsError(mapName);
        }
        return originRegionArr;
      }
      var dataNameMap = {};
      var features = geoJson.features;
      for (var i = 0; i < regionsArr.length; i++) {
        dataNameMap[regionsArr[i].name] = regionsArr[i];
      }
      for (var i = 0; i < features.length; i++) {
        var name = features[i].properties.name;
        if (!dataNameMap[name]) {
          regionsArr.push({name: name});
        }
      }
      return regionsArr;
    }
  };
  var echarts = require('../../echarts');
  echarts.registerMap = geoCreator.registerMap;
  echarts.getMap = geoCreator.getMap;
  echarts.loadMap = function() {};
  echarts.registerCoordinateSystem('geo', geoCreator);
  return geoCreator;
});
