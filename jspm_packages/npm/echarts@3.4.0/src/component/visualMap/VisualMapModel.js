/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var echarts = require('../../echarts');
    var zrUtil = require('zrender/core/util');
    var env = require('zrender/core/env');
    var visualDefault = require('../../visual/visualDefault');
    var VisualMapping = require('../../visual/VisualMapping');
    var visualSolution = require('../../visual/visualSolution');
    var mapVisual = VisualMapping.mapVisual;
    var modelUtil = require('../../util/model');
    var eachVisual = VisualMapping.eachVisual;
    var numberUtil = require('../../util/number');
    var isArray = zrUtil.isArray;
    var each = zrUtil.each;
    var asc = numberUtil.asc;
    var linearMap = numberUtil.linearMap;
    var noop = zrUtil.noop;
    var DEFAULT_COLOR = ['#f6efa6', '#d88273', '#bf444c'];
    var VisualMapModel = echarts.extendComponentModel({
      type: 'visualMap',
      dependencies: ['series'],
      stateList: ['inRange', 'outOfRange'],
      replacableOptionKeys: ['inRange', 'outOfRange', 'target', 'controller', 'color'],
      dataBound: [-Infinity, Infinity],
      layoutMode: {
        type: 'box',
        ignoreSize: true
      },
      defaultOption: {
        show: true,
        zlevel: 0,
        z: 4,
        seriesIndex: null,
        min: 0,
        max: 200,
        dimension: null,
        inRange: null,
        outOfRange: null,
        left: 0,
        right: null,
        top: null,
        bottom: 0,
        itemWidth: null,
        itemHeight: null,
        inverse: false,
        orient: 'vertical',
        backgroundColor: 'rgba(0,0,0,0)',
        borderColor: '#ccc',
        contentColor: '#5793f3',
        inactiveColor: '#aaa',
        borderWidth: 0,
        padding: 5,
        textGap: 10,
        precision: 0,
        color: null,
        formatter: null,
        text: null,
        textStyle: {color: '#333'}
      },
      init: function(option, parentModel, ecModel) {
        this._dataExtent;
        this.targetVisuals = {};
        this.controllerVisuals = {};
        this.textStyleModel;
        this.itemSize;
        this.mergeDefaultAndTheme(option, ecModel);
      },
      optionUpdated: function(newOption, isInit) {
        var thisOption = this.option;
        if (!env.canvasSupported) {
          thisOption.realtime = false;
        }
        !isInit && visualSolution.replaceVisualOption(thisOption, newOption, this.replacableOptionKeys);
        this.textStyleModel = this.getModel('textStyle');
        this.resetItemSize();
        this.completeVisualOption();
      },
      resetVisual: function(supplementVisualOption) {
        var stateList = this.stateList;
        supplementVisualOption = zrUtil.bind(supplementVisualOption, this);
        this.controllerVisuals = visualSolution.createVisualMappings(this.option.controller, stateList, supplementVisualOption);
        this.targetVisuals = visualSolution.createVisualMappings(this.option.target, stateList, supplementVisualOption);
      },
      resetTargetSeries: function() {
        var thisOption = this.option;
        var allSeriesIndex = thisOption.seriesIndex == null;
        thisOption.seriesIndex = allSeriesIndex ? [] : modelUtil.normalizeToArray(thisOption.seriesIndex);
        allSeriesIndex && this.ecModel.eachSeries(function(seriesModel, index) {
          thisOption.seriesIndex.push(index);
        });
      },
      eachTargetSeries: function(callback, context) {
        zrUtil.each(this.option.seriesIndex, function(seriesIndex) {
          callback.call(context, this.ecModel.getSeriesByIndex(seriesIndex));
        }, this);
      },
      isTargetSeries: function(seriesModel) {
        var is = false;
        this.eachTargetSeries(function(model) {
          model === seriesModel && (is = true);
        });
        return is;
      },
      formatValueText: function(value, isCategory, edgeSymbols) {
        var option = this.option;
        var precision = option.precision;
        var dataBound = this.dataBound;
        var formatter = option.formatter;
        var isMinMax;
        var textValue;
        edgeSymbols = edgeSymbols || ['<', '>'];
        if (zrUtil.isArray(value)) {
          value = value.slice();
          isMinMax = true;
        }
        textValue = isCategory ? value : (isMinMax ? [toFixed(value[0]), toFixed(value[1])] : toFixed(value));
        if (zrUtil.isString(formatter)) {
          return formatter.replace('{value}', isMinMax ? textValue[0] : textValue).replace('{value2}', isMinMax ? textValue[1] : textValue);
        } else if (zrUtil.isFunction(formatter)) {
          return isMinMax ? formatter(value[0], value[1]) : formatter(value);
        }
        if (isMinMax) {
          if (value[0] === dataBound[0]) {
            return edgeSymbols[0] + ' ' + textValue[1];
          } else if (value[1] === dataBound[1]) {
            return edgeSymbols[1] + ' ' + textValue[0];
          } else {
            return textValue[0] + ' - ' + textValue[1];
          }
        } else {
          return textValue;
        }
        function toFixed(val) {
          return val === dataBound[0] ? 'min' : val === dataBound[1] ? 'max' : (+val).toFixed(precision);
        }
      },
      resetExtent: function() {
        var thisOption = this.option;
        var extent = asc([thisOption.min, thisOption.max]);
        this._dataExtent = extent;
      },
      getDataDimension: function(list) {
        var optDim = this.option.dimension;
        return optDim != null ? optDim : list.dimensions.length - 1;
      },
      getExtent: function() {
        return this._dataExtent.slice();
      },
      completeVisualOption: function() {
        var thisOption = this.option;
        var base = {
          inRange: thisOption.inRange,
          outOfRange: thisOption.outOfRange
        };
        var target = thisOption.target || (thisOption.target = {});
        var controller = thisOption.controller || (thisOption.controller = {});
        zrUtil.merge(target, base);
        zrUtil.merge(controller, base);
        var isCategory = this.isCategory();
        completeSingle.call(this, target);
        completeSingle.call(this, controller);
        completeInactive.call(this, target, 'inRange', 'outOfRange');
        completeController.call(this, controller);
        function completeSingle(base) {
          if (isArray(thisOption.color) && !base.inRange) {
            base.inRange = {color: thisOption.color.slice().reverse()};
          }
          base.inRange = base.inRange || {color: DEFAULT_COLOR};
          each(this.stateList, function(state) {
            var visualType = base[state];
            if (zrUtil.isString(visualType)) {
              var defa = visualDefault.get(visualType, 'active', isCategory);
              if (defa) {
                base[state] = {};
                base[state][visualType] = defa;
              } else {
                delete base[state];
              }
            }
          }, this);
        }
        function completeInactive(base, stateExist, stateAbsent) {
          var optExist = base[stateExist];
          var optAbsent = base[stateAbsent];
          if (optExist && !optAbsent) {
            optAbsent = base[stateAbsent] = {};
            each(optExist, function(visualData, visualType) {
              if (!VisualMapping.isValidType(visualType)) {
                return;
              }
              var defa = visualDefault.get(visualType, 'inactive', isCategory);
              if (defa != null) {
                optAbsent[visualType] = defa;
                if (visualType === 'color' && !optAbsent.hasOwnProperty('opacity') && !optAbsent.hasOwnProperty('colorAlpha')) {
                  optAbsent.opacity = [0, 0];
                }
              }
            });
          }
        }
        function completeController(controller) {
          var symbolExists = (controller.inRange || {}).symbol || (controller.outOfRange || {}).symbol;
          var symbolSizeExists = (controller.inRange || {}).symbolSize || (controller.outOfRange || {}).symbolSize;
          var inactiveColor = this.get('inactiveColor');
          each(this.stateList, function(state) {
            var itemSize = this.itemSize;
            var visuals = controller[state];
            if (!visuals) {
              visuals = controller[state] = {color: isCategory ? inactiveColor : [inactiveColor]};
            }
            if (visuals.symbol == null) {
              visuals.symbol = symbolExists && zrUtil.clone(symbolExists) || (isCategory ? 'roundRect' : ['roundRect']);
            }
            if (visuals.symbolSize == null) {
              visuals.symbolSize = symbolSizeExists && zrUtil.clone(symbolSizeExists) || (isCategory ? itemSize[0] : [itemSize[0], itemSize[0]]);
            }
            visuals.symbol = mapVisual(visuals.symbol, function(symbol) {
              return (symbol === 'none' || symbol === 'square') ? 'roundRect' : symbol;
            });
            var symbolSize = visuals.symbolSize;
            if (symbolSize != null) {
              var max = -Infinity;
              eachVisual(symbolSize, function(value) {
                value > max && (max = value);
              });
              visuals.symbolSize = mapVisual(symbolSize, function(value) {
                return linearMap(value, [0, max], [0, itemSize[0]], true);
              });
            }
          }, this);
        }
      },
      resetItemSize: function() {
        this.itemSize = [parseFloat(this.get('itemWidth')), parseFloat(this.get('itemHeight'))];
      },
      isCategory: function() {
        return !!this.option.categories;
      },
      setSelected: noop,
      getValueState: noop,
      getVisualMeta: noop
    });
    return VisualMapModel;
  });
})(require('process'));
