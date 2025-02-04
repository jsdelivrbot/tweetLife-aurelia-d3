/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var graphic = require('../../util/graphic');
  var each = zrUtil.each;
  var helper = {};
  var COMPONENT_NAMES = ['geo', 'xAxis', 'yAxis'];
  var PANEL_ID_SPLIT = '--';
  var COORD_CONVERTS = ['dataToPoint', 'pointToData'];
  helper.parseOutputRanges = function(areas, coordInfoList, ecModel, rangesCoordInfo) {
    each(areas, function(area, index) {
      var panelId = area.panelId;
      if (panelId) {
        panelId = panelId.split(PANEL_ID_SPLIT);
        area[panelId[0] + 'Index'] = +panelId[1];
        var coordInfo = findCoordInfo(area, coordInfoList);
        area.coordRange = coordConvert[area.brushType](1, coordInfo, area.range);
        rangesCoordInfo && (rangesCoordInfo[index] = coordInfo);
      }
    });
  };
  helper.parseInputRanges = function(brushModel, ecModel) {
    each(brushModel.areas, function(area) {
      var coordInfo = findCoordInfo(area, brushModel.coordInfoList);
      if (__DEV__) {
        zrUtil.assert(!coordInfo || coordInfo === true || area.coordRange, 'coordRange must be specified when coord index specified.');
        zrUtil.assert(!coordInfo || coordInfo !== true || area.range, 'range must be specified.');
      }
      area.range = area.range || [];
      if (coordInfo && coordInfo !== true) {
        area.range = coordConvert[area.brushType](0, coordInfo, area.coordRange);
        area.panelId = coordInfo.panelId;
      }
    });
  };
  helper.makePanelOpts = function(coordInfoList) {
    var panelOpts = [];
    each(coordInfoList, function(coordInfo) {
      var coordSys = coordInfo.coordSys;
      var rect;
      if (coordInfo.geoIndex >= 0) {
        rect = coordSys.getBoundingRect().clone();
        rect.applyTransform(graphic.getTransform(coordSys));
      } else {
        rect = coordSys.grid.getRect().clone();
      }
      panelOpts.push({
        panelId: coordInfo.panelId,
        rect: rect
      });
    });
    return panelOpts;
  };
  helper.makeCoordInfoList = function(option, ecModel) {
    var coordInfoList = [];
    each(COMPONENT_NAMES, function(componentName) {
      var componentIndices = option[componentName + 'Index'];
      if (componentIndices == null || componentIndices === 'none') {
        return;
      }
      if (componentIndices !== 'all' && !zrUtil.isArray(componentIndices)) {
        componentIndices = [componentIndices];
      }
      ecModel.eachComponent({mainType: componentName}, function(componentModel, index) {
        if (componentIndices !== 'all' && zrUtil.indexOf(componentIndices, index) < 0) {
          return;
        }
        var grid;
        var coordSys;
        (componentName === 'xAxis' || componentName === 'yAxis') ? (grid = componentModel.axis.grid) : (coordSys = componentModel.coordinateSystem);
        var coordInfo;
        for (var i = 0,
            len = coordInfoList.length; i < len; i++) {
          var cInfo = coordInfoList[i];
          if (__DEV__) {
            zrUtil.assert(cInfo[componentName + 'Index'] != index, 'Coord should not be defined duplicately: ' + componentName + index);
          }
          if (componentName === 'yAxis' && !cInfo.yAxis && cInfo.xAxis) {
            var aCoordSys = grid.getCartesian(cInfo.xAxisIndex, index);
            if (aCoordSys) {
              coordSys = aCoordSys;
              coordInfo = cInfo;
              break;
            }
          }
        }
        !coordInfo && coordInfoList.push(coordInfo = {});
        coordInfo[componentName] = componentModel;
        coordInfo[componentName + 'Index'] = index;
        coordInfo.panelId = componentName + PANEL_ID_SPLIT + index;
        coordInfo.coordSys = coordSys || grid.getCartesian(coordInfo.xAxisIndex, coordInfo.yAxisIndex);
        coordInfo.coordSys ? (coordInfoList[componentName + 'Has'] = true) : coordInfoList.pop();
      });
    });
    return coordInfoList;
  };
  helper.controlSeries = function(area, brushModel, seriesModel) {
    var coordInfo = findCoordInfo(area, brushModel.coordInfoList);
    return coordInfo === true || (coordInfo && coordInfo.coordSys === seriesModel.coordinateSystem);
  };
  function formatMinMax(minMax) {
    minMax[0] > minMax[1] && minMax.reverse();
    return minMax;
  }
  function findCoordInfo(area, coordInfoList) {
    var isGlobal = true;
    for (var j = 0; j < COMPONENT_NAMES.length; j++) {
      var indexAttr = COMPONENT_NAMES[j] + 'Index';
      if (area[indexAttr] >= 0) {
        isGlobal = false;
        for (var i = 0; i < coordInfoList.length; i++) {
          if (coordInfoList[i][indexAttr] === area[indexAttr]) {
            return coordInfoList[i];
          }
        }
      }
    }
    return isGlobal;
  }
  function axisConvert(axisName, to, coordInfo, coordRange) {
    var axis = coordInfo.coordSys.getAxis(axisName);
    if (__DEV__) {
      zrUtil.assert(axis, 'line brush is only available in cartesian (grid).');
    }
    return formatMinMax(zrUtil.map([0, 1], function(i) {
      return to ? axis.coordToData(axis.toLocalCoord(coordRange[i])) : axis.toGlobalCoord(axis.dataToCoord(coordRange[i]));
    }));
  }
  var coordConvert = {
    lineX: zrUtil.curry(axisConvert, 'x'),
    lineY: zrUtil.curry(axisConvert, 'y'),
    rect: function(to, coordInfo, coordRange) {
      var coordSys = coordInfo.coordSys;
      var xminymin = coordSys[COORD_CONVERTS[to]]([coordRange[0][0], coordRange[1][0]]);
      var xmaxymax = coordSys[COORD_CONVERTS[to]]([coordRange[0][1], coordRange[1][1]]);
      return [formatMinMax([xminymin[0], xmaxymax[0]]), formatMinMax([xminymin[1], xmaxymax[1]])];
    },
    polygon: function(to, coordInfo, coordRange) {
      var coordSys = coordInfo.coordSys;
      return zrUtil.map(coordRange, coordSys[COORD_CONVERTS[to]], coordSys);
    }
  };
  return helper;
});
