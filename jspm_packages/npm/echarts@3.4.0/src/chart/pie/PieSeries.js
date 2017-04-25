/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var List = require('../../data/List');
  var zrUtil = require('zrender/core/util');
  var modelUtil = require('../../util/model');
  var completeDimensions = require('../../data/helper/completeDimensions');
  var dataSelectableMixin = require('../../component/helper/selectableMixin');
  var PieSeries = require('../../echarts').extendSeriesModel({
    type: 'series.pie',
    init: function(option) {
      PieSeries.superApply(this, 'init', arguments);
      this.legendDataProvider = function() {
        return this.getRawData();
      };
      this.updateSelectedMap(option.data);
      this._defaultLabelLine(option);
    },
    mergeOption: function(newOption) {
      PieSeries.superCall(this, 'mergeOption', newOption);
      this.updateSelectedMap(this.option.data);
    },
    getInitialData: function(option, ecModel) {
      var dimensions = completeDimensions(['value'], option.data);
      var list = new List(dimensions, this);
      list.initData(option.data);
      return list;
    },
    getDataParams: function(dataIndex) {
      var data = this.getData();
      var params = PieSeries.superCall(this, 'getDataParams', dataIndex);
      var sum = data.getSum('value');
      params.percent = !sum ? 0 : +(data.get('value', dataIndex) / sum * 100).toFixed(2);
      params.$vars.push('percent');
      return params;
    },
    _defaultLabelLine: function(option) {
      modelUtil.defaultEmphasis(option.labelLine, ['show']);
      var labelLineNormalOpt = option.labelLine.normal;
      var labelLineEmphasisOpt = option.labelLine.emphasis;
      labelLineNormalOpt.show = labelLineNormalOpt.show && option.label.normal.show;
      labelLineEmphasisOpt.show = labelLineEmphasisOpt.show && option.label.emphasis.show;
    },
    defaultOption: {
      zlevel: 0,
      z: 2,
      legendHoverLink: true,
      hoverAnimation: true,
      center: ['50%', '50%'],
      radius: [0, '75%'],
      clockwise: true,
      startAngle: 90,
      minAngle: 0,
      selectedOffset: 10,
      avoidLabelOverlap: true,
      stillShowZeroSum: true,
      label: {
        normal: {
          rotate: false,
          show: true,
          position: 'outer'
        },
        emphasis: {}
      },
      labelLine: {normal: {
          show: true,
          length: 15,
          length2: 15,
          smooth: false,
          lineStyle: {
            width: 1,
            type: 'solid'
          }
        }},
      itemStyle: {
        normal: {borderWidth: 1},
        emphasis: {}
      },
      animationType: 'expansion',
      animationEasing: 'cubicOut',
      data: []
    }
  });
  zrUtil.mixin(PieSeries, dataSelectableMixin);
  return PieSeries;
});
