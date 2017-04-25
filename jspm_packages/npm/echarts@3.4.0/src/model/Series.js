/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    'use strict';
    var zrUtil = require('zrender/core/util');
    var formatUtil = require('../util/format');
    var classUtil = require('../util/clazz');
    var modelUtil = require('../util/model');
    var ComponentModel = require('./Component');
    var colorPaletteMixin = require('./mixin/colorPalette');
    var env = require('zrender/core/env');
    var layout = require('../util/layout');
    var set = classUtil.set;
    var get = classUtil.get;
    var encodeHTML = formatUtil.encodeHTML;
    var addCommas = formatUtil.addCommas;
    var SeriesModel = ComponentModel.extend({
      type: 'series.__base__',
      seriesIndex: 0,
      coordinateSystem: null,
      defaultOption: null,
      legendDataProvider: null,
      visualColorAccessPath: 'itemStyle.normal.color',
      layoutMode: null,
      init: function(option, parentModel, ecModel, extraOpt) {
        this.seriesIndex = this.componentIndex;
        this.mergeDefaultAndTheme(option, ecModel);
        set(this, 'dataBeforeProcessed', this.getInitialData(option, ecModel));
        this.restoreData();
      },
      mergeDefaultAndTheme: function(option, ecModel) {
        var layoutMode = this.layoutMode;
        var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
        zrUtil.merge(option, ecModel.getTheme().get(this.subType));
        zrUtil.merge(option, this.getDefaultOption());
        modelUtil.defaultEmphasis(option.label, modelUtil.LABEL_OPTIONS);
        this.fillDataTextStyle(option.data);
        if (layoutMode) {
          layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
        }
      },
      mergeOption: function(newSeriesOption, ecModel) {
        newSeriesOption = zrUtil.merge(this.option, newSeriesOption, true);
        this.fillDataTextStyle(newSeriesOption.data);
        var layoutMode = this.layoutMode;
        if (layoutMode) {
          layout.mergeLayoutParam(this.option, newSeriesOption, layoutMode);
        }
        var data = this.getInitialData(newSeriesOption, ecModel);
        if (data) {
          set(this, 'data', data);
          set(this, 'dataBeforeProcessed', data.cloneShallow());
        }
      },
      fillDataTextStyle: function(data) {
        if (data) {
          for (var i = 0; i < data.length; i++) {
            if (data[i] && data[i].label) {
              modelUtil.defaultEmphasis(data[i].label, modelUtil.LABEL_OPTIONS);
            }
          }
        }
      },
      getInitialData: function() {},
      getData: function(dataType) {
        var data = get(this, 'data');
        return dataType == null ? data : data.getLinkedData(dataType);
      },
      setData: function(data) {
        set(this, 'data', data);
      },
      getRawData: function() {
        return get(this, 'dataBeforeProcessed');
      },
      coordDimToDataDim: function(coordDim) {
        return [coordDim];
      },
      dataDimToCoordDim: function(dataDim) {
        return dataDim;
      },
      getBaseAxis: function() {
        var coordSys = this.coordinateSystem;
        return coordSys && coordSys.getBaseAxis && coordSys.getBaseAxis();
      },
      formatTooltip: function(dataIndex, multipleSeries, dataType) {
        function formatArrayValue(value) {
          var result = [];
          zrUtil.each(value, function(val, idx) {
            var dimInfo = data.getDimensionInfo(idx);
            var dimType = dimInfo && dimInfo.type;
            var valStr;
            if (dimType === 'ordinal') {
              valStr = val + '';
            } else if (dimType === 'time') {
              valStr = multipleSeries ? '' : formatUtil.formatTime('yyyy/MM/dd hh:mm:ss', val);
            } else {
              valStr = addCommas(val);
            }
            valStr && result.push(valStr);
          });
          return result.join(', ');
        }
        var data = get(this, 'data');
        var value = this.getRawValue(dataIndex);
        var formattedValue = encodeHTML(zrUtil.isArray(value) ? formatArrayValue(value) : addCommas(value));
        var name = data.getName(dataIndex);
        var color = data.getItemVisual(dataIndex, 'color');
        if (zrUtil.isObject(color) && color.colorStops) {
          color = (color.colorStops[0] || {}).color;
        }
        color = color || 'transparent';
        var colorEl = '<span style="display:inline-block;margin-right:5px;' + 'border-radius:10px;width:9px;height:9px;background-color:' + encodeHTML(color) + '"></span>';
        var seriesName = this.name;
        if (seriesName === '\0-') {
          seriesName = '';
        }
        return !multipleSeries ? ((seriesName && encodeHTML(seriesName) + '<br />') + colorEl + (name ? encodeHTML(name) + ' : ' + formattedValue : formattedValue)) : (colorEl + encodeHTML(this.name) + ' : ' + formattedValue);
      },
      isAnimationEnabled: function() {
        if (env.node) {
          return false;
        }
        var animationEnabled = this.getShallow('animation');
        if (animationEnabled) {
          if (this.getData().count() > this.getShallow('animationThreshold')) {
            animationEnabled = false;
          }
        }
        return animationEnabled;
      },
      restoreData: function() {
        set(this, 'data', get(this, 'dataBeforeProcessed').cloneShallow());
      },
      getColorFromPalette: function(name, scope) {
        var ecModel = this.ecModel;
        var color = colorPaletteMixin.getColorFromPalette.call(this, name, scope);
        if (!color) {
          color = ecModel.getColorFromPalette(name, scope);
        }
        return color;
      },
      getAxisTooltipDataIndex: null,
      getTooltipPosition: null
    });
    zrUtil.mixin(SeriesModel, modelUtil.dataFormatMixin);
    zrUtil.mixin(SeriesModel, colorPaletteMixin);
    return SeriesModel;
  });
})(require('process'));
