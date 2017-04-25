/* */ 
var echarts = require('../echarts');
var zrUtil = require('zrender/lib/core/util');
var visualSolution = require('./visualSolution');
var each = zrUtil.each;
var STATE_LIST = ['visualInSelect', 'visualOutOfSelect'];
var MAP_ATTR = '\0__selectedMap';
var defaultOption = {
  visualSelectable: true,
  visualInSelect: {},
  visualOutOfSelect: {color: '#ccc'}
};
echarts.registerAction({
  type: 'select',
  event: 'select',
  update: 'updateView'
}, function(payload, ecModel) {
  var seriesList = ecModel.findComponents({
    mainType: 'series',
    query: payload
  });
  each(seriesList, function(seriesModel) {
    resetSelectedMapInAction(seriesModel, payload);
  });
});
echarts.registerVisual(echarts.PRIORITY.VISUAL.SELECT, function(ecModel) {
  ecModel.eachSeries(function(seriesModel) {
    var dataIndexMap = seriesModel[MAP_ATTR];
    if (!dataIndexMap) {
      return;
    }
    var visualMappings = visualSolution.createVisualMappings(seriesModel.option, STATE_LIST, function(mappingOption) {
      mappingOption.mappingMethod = 'fixed';
    });
    visualSolution.applyVisual(STATE_LIST, visualMappings, seriesModel.getData(), getValueState);
    function getValueState(dataIndex) {
      return dataIndexMap[dataIndex] ? 'visualInSelect' : 'visualOutOfSelect';
    }
  });
});
function visualSelectable(SeriesClz) {
  var proto = SeriesClz.prototype;
  proto.getSelectedDataIndexMap = getSelectedDataIndexMap;
  var rawOptionUpdated = proto.optionUpdated;
  proto.optionUpdated = function() {
    var ret = rawOptionUpdated.apply(this, arguments);
    resetSelectedMapByDataIndices(this, this.option.selectedDataIndex);
    return ret;
  };
  zrUtil.defaults(proto.defaultOption, defaultOption);
  return SeriesClz;
}
function getSelectedDataIndexMap() {
  return this[MAP_ATTR];
}
function resetSelectedMapByDataIndices(seriesModel, dataIndices) {
  var dataIndexMap = seriesModel[MAP_ATTR] = null;
  if (dataIndices instanceof Array) {
    var dataIndexMap = seriesModel[MAP_ATTR] = Array(seriesModel.getData().count());
    each(dataIndices, function(dataIndex) {
      dataIndexMap[dataIndex] = 1;
    });
  }
}
function resetSelectedMapInAction(seriesModel, payload) {
  var dataIndexMap = payload.dataIndexMap;
  if (dataIndexMap) {
    seriesModel[MAP_ATTR] = dataIndexMap;
  } else {
    resetSelectedMapByDataIndices(seriesModel, payload.dataIndex);
  }
}
module.exports = visualSelectable;
