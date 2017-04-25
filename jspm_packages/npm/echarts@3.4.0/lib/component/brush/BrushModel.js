/* */ 
var echarts = require('../../echarts');
var zrUtil = require('zrender/lib/core/util');
var visualSolution = require('../../visual/visualSolution');
var Model = require('../../model/Model');
var DEFAULT_OUT_OF_BRUSH_COLOR = ['#ddd'];
var BrushModel = echarts.extendComponentModel({
  type: 'brush',
  dependencies: ['geo', 'grid', 'xAxis', 'yAxis', 'parallel', 'series'],
  defaultOption: {
    toolbox: null,
    brushLink: null,
    seriesIndex: 'all',
    geoIndex: null,
    xAxisIndex: null,
    yAxisIndex: null,
    brushType: 'rect',
    brushMode: 'single',
    transformable: true,
    brushStyle: {
      borderWidth: 1,
      color: 'rgba(120,140,180,0.3)',
      borderColor: 'rgba(120,140,180,0.8)',
      width: null
    },
    throttleType: 'fixRate',
    throttleDelay: 0,
    removeOnClick: true
  },
  areas: [],
  brushType: null,
  brushOption: {},
  coordInfoList: [],
  optionUpdated: function(newOption, isInit) {
    var thisOption = this.option;
    !isInit && visualSolution.replaceVisualOption(thisOption, newOption, ['inBrush', 'outOfBrush']);
    thisOption.inBrush = thisOption.inBrush || {};
    thisOption.outOfBrush = thisOption.outOfBrush || {color: DEFAULT_OUT_OF_BRUSH_COLOR};
  },
  setAreas: function(areas) {
    if (__DEV__) {
      zrUtil.assert(zrUtil.isArray(areas));
      zrUtil.each(areas, function(area) {
        zrUtil.assert(area.brushType, 'Illegal areas');
      });
    }
    if (!areas) {
      return;
    }
    this.areas = zrUtil.map(areas, function(area) {
      return this._mergeBrushOption(area);
    }, this);
  },
  setBrushOption: function(brushOption) {
    this.brushOption = this._mergeBrushOption(brushOption);
    this.brushType = this.brushOption.brushType;
  },
  _mergeBrushOption: function(brushOption) {
    var option = this.option;
    return zrUtil.merge({
      brushType: option.brushType,
      brushMode: option.brushMode,
      transformable: option.transformable,
      brushStyle: new Model(option.brushStyle).getItemStyle(),
      removeOnClick: option.removeOnClick
    }, brushOption, true);
  }
});
module.exports = BrushModel;
