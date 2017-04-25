/* */ 
var echarts = require('../../echarts');
var visualSolution = require('../../visual/visualSolution');
var zrUtil = require('zrender/lib/core/util');
var BoundingRect = require('zrender/lib/core/BoundingRect');
var selector = require('./selector');
var throttle = require('../../util/throttle');
var brushHelper = require('../helper/brushHelper');
var STATE_LIST = ['inBrush', 'outOfBrush'];
var DISPATCH_METHOD = '__ecBrushSelect';
var DISPATCH_FLAG = '__ecInBrushSelectEvent';
var PRIORITY_BRUSH = echarts.PRIORITY.VISUAL.BRUSH;
echarts.registerLayout(PRIORITY_BRUSH, function(ecModel, api, payload) {
  ecModel.eachComponent({mainType: 'brush'}, function(brushModel) {
    payload && payload.type === 'takeGlobalCursor' && brushModel.setBrushOption(payload.key === 'brush' ? payload.brushOption : {brushType: false});
    brushModel.coordInfoList = brushHelper.makeCoordInfoList(brushModel.option, ecModel);
    brushHelper.parseInputRanges(brushModel, ecModel);
  });
});
echarts.registerVisual(PRIORITY_BRUSH, function(ecModel, api, payload) {
  var brushSelected = [];
  var throttleType;
  var throttleDelay;
  ecModel.eachComponent({mainType: 'brush'}, function(brushModel, brushIndex) {
    var thisBrushSelected = {
      brushId: brushModel.id,
      brushIndex: brushIndex,
      brushName: brushModel.name,
      areas: zrUtil.clone(brushModel.areas),
      selected: []
    };
    brushSelected.push(thisBrushSelected);
    var brushOption = brushModel.option;
    var brushLink = brushOption.brushLink;
    var linkedSeriesMap = [];
    var selectedDataIndexForLink = [];
    var rangeInfoBySeries = [];
    var hasBrushExists = 0;
    if (!brushIndex) {
      throttleType = brushOption.throttleType;
      throttleDelay = brushOption.throttleDelay;
    }
    var areas = zrUtil.map(brushModel.areas, function(area) {
      return bindSelector(zrUtil.defaults({boundingRect: boundingRectBuilders[area.brushType](area)}, area));
    });
    var visualMappings = visualSolution.createVisualMappings(brushModel.option, STATE_LIST, function(mappingOption) {
      mappingOption.mappingMethod = 'fixed';
    });
    zrUtil.isArray(brushLink) && zrUtil.each(brushLink, function(seriesIndex) {
      linkedSeriesMap[seriesIndex] = 1;
    });
    function linkOthers(seriesIndex) {
      return brushLink === 'all' || linkedSeriesMap[seriesIndex];
    }
    function brushed(rangeInfoList) {
      return !!rangeInfoList.length;
    }
    ecModel.eachSeries(function(seriesModel, seriesIndex) {
      var rangeInfoList = rangeInfoBySeries[seriesIndex] = [];
      seriesModel.subType === 'parallel' ? stepAParallel(seriesModel, seriesIndex, rangeInfoList) : stepAOthers(seriesModel, seriesIndex, rangeInfoList);
    });
    function stepAParallel(seriesModel, seriesIndex) {
      var coordSys = seriesModel.coordinateSystem;
      hasBrushExists |= coordSys.hasAxisbrushed();
      linkOthers(seriesIndex) && coordSys.eachActiveState(seriesModel.getData(), function(activeState, dataIndex) {
        activeState === 'active' && (selectedDataIndexForLink[dataIndex] = 1);
      });
    }
    function stepAOthers(seriesModel, seriesIndex, rangeInfoList) {
      var selectorsByBrushType = getSelectorsByBrushType(seriesModel);
      if (!selectorsByBrushType || brushModelNotControll(brushModel, seriesIndex)) {
        return;
      }
      zrUtil.each(areas, function(area) {
        selectorsByBrushType[area.brushType] && brushHelper.controlSeries(area, brushModel, seriesModel) && rangeInfoList.push(area);
        hasBrushExists |= brushed(rangeInfoList);
      });
      if (linkOthers(seriesIndex) && brushed(rangeInfoList)) {
        var data = seriesModel.getData();
        data.each(function(dataIndex) {
          if (checkInRange(selectorsByBrushType, rangeInfoList, data, dataIndex)) {
            selectedDataIndexForLink[dataIndex] = 1;
          }
        });
      }
    }
    ecModel.eachSeries(function(seriesModel, seriesIndex) {
      var seriesBrushSelected = {
        seriesId: seriesModel.id,
        seriesIndex: seriesIndex,
        seriesName: seriesModel.name,
        dataIndex: []
      };
      thisBrushSelected.selected.push(seriesBrushSelected);
      var selectorsByBrushType = getSelectorsByBrushType(seriesModel);
      var rangeInfoList = rangeInfoBySeries[seriesIndex];
      var data = seriesModel.getData();
      var getValueState = linkOthers(seriesIndex) ? function(dataIndex) {
        return selectedDataIndexForLink[dataIndex] ? (seriesBrushSelected.dataIndex.push(data.getRawIndex(dataIndex)), 'inBrush') : 'outOfBrush';
      } : function(dataIndex) {
        return checkInRange(selectorsByBrushType, rangeInfoList, data, dataIndex) ? (seriesBrushSelected.dataIndex.push(data.getRawIndex(dataIndex)), 'inBrush') : 'outOfBrush';
      };
      (linkOthers(seriesIndex) ? hasBrushExists : brushed(rangeInfoList)) && visualSolution.applyVisual(STATE_LIST, visualMappings, data, getValueState);
    });
  });
  dispatchAction(api, throttleType, throttleDelay, brushSelected, payload);
});
function dispatchAction(api, throttleType, throttleDelay, brushSelected, payload) {
  if (!payload) {
    return;
  }
  var zr = api.getZr();
  if (zr[DISPATCH_FLAG]) {
    return;
  }
  if (!zr[DISPATCH_METHOD]) {
    zr[DISPATCH_METHOD] = doDispatch;
  }
  var fn = throttle.createOrUpdate(zr, DISPATCH_METHOD, throttleDelay, throttleType);
  fn(api, brushSelected);
}
function doDispatch(api, brushSelected) {
  if (!api.isDisposed()) {
    var zr = api.getZr();
    zr[DISPATCH_FLAG] = true;
    api.dispatchAction({
      type: 'brushSelect',
      batch: brushSelected
    });
    zr[DISPATCH_FLAG] = false;
  }
}
function checkInRange(selectorsByBrushType, rangeInfoList, data, dataIndex) {
  var itemLayout = data.getItemLayout(dataIndex);
  for (var i = 0,
      len = rangeInfoList.length; i < len; i++) {
    var area = rangeInfoList[i];
    if (selectorsByBrushType[area.brushType](itemLayout, area.selectors, area)) {
      return true;
    }
  }
}
function getSelectorsByBrushType(seriesModel) {
  var brushSelector = seriesModel.brushSelector;
  if (zrUtil.isString(brushSelector)) {
    var sels = [];
    zrUtil.each(selector, function(selectorsByElementType, brushType) {
      sels[brushType] = selectorsByElementType[brushSelector];
    });
    return sels;
  } else if (zrUtil.isFunction(brushSelector)) {
    var bSelector = {};
    zrUtil.each(selector, function(sel, brushType) {
      bSelector[brushType] = brushSelector;
    });
    return bSelector;
  }
  return brushSelector;
}
function brushModelNotControll(brushModel, seriesIndex) {
  var seriesIndices = brushModel.option.seriesIndex;
  return seriesIndices != null && seriesIndices !== 'all' && (zrUtil.isArray(seriesIndices) ? zrUtil.indexOf(seriesIndices, seriesIndex) < 0 : seriesIndex !== seriesIndices);
}
function bindSelector(area) {
  var selectors = area.selectors = {};
  zrUtil.each(selector[area.brushType], function(selFn, elType) {
    selectors[elType] = function(itemLayout) {
      return selFn(itemLayout, selectors, area);
    };
  });
  return area;
}
var boundingRectBuilders = {
  lineX: zrUtil.noop,
  lineY: zrUtil.noop,
  rect: function(area) {
    return getBoundingRectFromMinMax(area.range);
  },
  polygon: function(area) {
    var minMax;
    var range = area.range;
    for (var i = 0,
        len = range.length; i < len; i++) {
      minMax = minMax || [[Infinity, -Infinity], [Infinity, -Infinity]];
      var rg = range[i];
      rg[0] < minMax[0][0] && (minMax[0][0] = rg[0]);
      rg[0] > minMax[0][1] && (minMax[0][1] = rg[0]);
      rg[1] < minMax[1][0] && (minMax[1][0] = rg[1]);
      rg[1] > minMax[1][1] && (minMax[1][1] = rg[1]);
    }
    return minMax && getBoundingRectFromMinMax(minMax);
  }
};
function getBoundingRectFromMinMax(minMax) {
  return new BoundingRect(minMax[0][0], minMax[1][0], minMax[0][1] - minMax[0][0], minMax[1][1] - minMax[1][0]);
}
