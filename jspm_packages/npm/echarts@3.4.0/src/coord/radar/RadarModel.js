/* */ 
"format cjs";
define(function(require) {
  var axisDefault = require('../axisDefault');
  var valueAxisDefault = axisDefault.valueAxis;
  var Model = require('../../model/Model');
  var zrUtil = require('zrender/core/util');
  var axisModelCommonMixin = require('../axisModelCommonMixin');
  function defaultsShow(opt, show) {
    return zrUtil.defaults({show: show}, opt);
  }
  var RadarModel = require('../../echarts').extendComponentModel({
    type: 'radar',
    optionUpdated: function() {
      var boundaryGap = this.get('boundaryGap');
      var splitNumber = this.get('splitNumber');
      var scale = this.get('scale');
      var axisLine = this.get('axisLine');
      var axisTick = this.get('axisTick');
      var axisLabel = this.get('axisLabel');
      var nameTextStyle = this.get('name.textStyle');
      var showName = this.get('name.show');
      var nameFormatter = this.get('name.formatter');
      var nameGap = this.get('nameGap');
      var triggerEvent = this.get('triggerEvent');
      var indicatorModels = zrUtil.map(this.get('indicator') || [], function(indicatorOpt) {
        if (indicatorOpt.max != null && indicatorOpt.max > 0 && !indicatorOpt.min) {
          indicatorOpt.min = 0;
        } else if (indicatorOpt.min != null && indicatorOpt.min < 0 && !indicatorOpt.max) {
          indicatorOpt.max = 0;
        }
        indicatorOpt = zrUtil.merge(zrUtil.clone(indicatorOpt), {
          boundaryGap: boundaryGap,
          splitNumber: splitNumber,
          scale: scale,
          axisLine: axisLine,
          axisTick: axisTick,
          axisLabel: axisLabel,
          name: indicatorOpt.text,
          nameLocation: 'end',
          nameGap: nameGap,
          nameTextStyle: nameTextStyle,
          triggerEvent: triggerEvent
        }, false);
        if (!showName) {
          indicatorOpt.name = '';
        }
        if (typeof nameFormatter === 'string') {
          var indName = indicatorOpt.name;
          indicatorOpt.name = nameFormatter.replace('{value}', indName != null ? indName : '');
        } else if (typeof nameFormatter === 'function') {
          indicatorOpt.name = nameFormatter(indicatorOpt.name, indicatorOpt);
        }
        var model = zrUtil.extend(new Model(indicatorOpt, null, this.ecModel), axisModelCommonMixin);
        model.mainType = 'radar';
        model.componentIndex = this.componentIndex;
        return model;
      }, this);
      this.getIndicatorModels = function() {
        return indicatorModels;
      };
    },
    defaultOption: {
      zlevel: 0,
      z: 0,
      center: ['50%', '50%'],
      radius: '75%',
      startAngle: 90,
      name: {show: true},
      boundaryGap: [0, 0],
      splitNumber: 5,
      nameGap: 15,
      scale: false,
      shape: 'polygon',
      axisLine: zrUtil.merge({lineStyle: {color: '#bbb'}}, valueAxisDefault.axisLine),
      axisLabel: defaultsShow(valueAxisDefault.axisLabel, false),
      axisTick: defaultsShow(valueAxisDefault.axisTick, false),
      splitLine: defaultsShow(valueAxisDefault.splitLine, true),
      splitArea: defaultsShow(valueAxisDefault.splitArea, true),
      indicator: []
    }
  });
  return RadarModel;
});
