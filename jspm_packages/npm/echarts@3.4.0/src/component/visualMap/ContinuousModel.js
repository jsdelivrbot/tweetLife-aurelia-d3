/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var VisualMapModel = require('./VisualMapModel');
    var zrUtil = require('zrender/core/util');
    var numberUtil = require('../../util/number');
    var DEFAULT_BAR_BOUND = [20, 140];
    var ContinuousModel = VisualMapModel.extend({
      type: 'visualMap.continuous',
      defaultOption: {
        align: 'auto',
        calculable: false,
        range: null,
        realtime: true,
        itemHeight: null,
        itemWidth: null,
        hoverLink: true,
        hoverLinkDataSize: null,
        hoverLinkOnHandle: true
      },
      optionUpdated: function(newOption, isInit) {
        ContinuousModel.superApply(this, 'optionUpdated', arguments);
        this.resetTargetSeries();
        this.resetExtent();
        this.resetVisual(function(mappingOption) {
          mappingOption.mappingMethod = 'linear';
          mappingOption.dataExtent = this.getExtent();
        });
        this._resetRange();
      },
      resetItemSize: function() {
        ContinuousModel.superApply(this, 'resetItemSize', arguments);
        var itemSize = this.itemSize;
        this._orient === 'horizontal' && itemSize.reverse();
        (itemSize[0] == null || isNaN(itemSize[0])) && (itemSize[0] = DEFAULT_BAR_BOUND[0]);
        (itemSize[1] == null || isNaN(itemSize[1])) && (itemSize[1] = DEFAULT_BAR_BOUND[1]);
      },
      _resetRange: function() {
        var dataExtent = this.getExtent();
        var range = this.option.range;
        if (!range || range.auto) {
          dataExtent.auto = 1;
          this.option.range = dataExtent;
        } else if (zrUtil.isArray(range)) {
          if (range[0] > range[1]) {
            range.reverse();
          }
          range[0] = Math.max(range[0], dataExtent[0]);
          range[1] = Math.min(range[1], dataExtent[1]);
        }
      },
      completeVisualOption: function() {
        VisualMapModel.prototype.completeVisualOption.apply(this, arguments);
        zrUtil.each(this.stateList, function(state) {
          var symbolSize = this.option.controller[state].symbolSize;
          if (symbolSize && symbolSize[0] !== symbolSize[1]) {
            symbolSize[0] = 0;
          }
        }, this);
      },
      setSelected: function(selected) {
        this.option.range = selected.slice();
        this._resetRange();
      },
      getSelected: function() {
        var dataExtent = this.getExtent();
        var dataInterval = numberUtil.asc((this.get('range') || []).slice());
        dataInterval[0] > dataExtent[1] && (dataInterval[0] = dataExtent[1]);
        dataInterval[1] > dataExtent[1] && (dataInterval[1] = dataExtent[1]);
        dataInterval[0] < dataExtent[0] && (dataInterval[0] = dataExtent[0]);
        dataInterval[1] < dataExtent[0] && (dataInterval[1] = dataExtent[0]);
        return dataInterval;
      },
      getValueState: function(value) {
        var range = this.option.range;
        var dataExtent = this.getExtent();
        return ((range[0] <= dataExtent[0] || range[0] <= value) && (range[1] >= dataExtent[1] || value <= range[1])) ? 'inRange' : 'outOfRange';
      },
      findTargetDataIndices: function(range) {
        var result = [];
        this.eachTargetSeries(function(seriesModel) {
          var dataIndices = [];
          var data = seriesModel.getData();
          data.each(this.getDataDimension(data), function(value, dataIndex) {
            range[0] <= value && value <= range[1] && dataIndices.push(dataIndex);
          }, true, this);
          result.push({
            seriesId: seriesModel.id,
            dataIndex: dataIndices
          });
        }, this);
        return result;
      },
      getVisualMeta: function(getColorVisual) {
        var oVals = getColorStopValues(this, 'outOfRange', this.getExtent());
        var iVals = getColorStopValues(this, 'inRange', this.option.range.slice());
        var stops = [];
        function setStop(value, valueState) {
          stops.push({
            value: value,
            color: getColorVisual(value, valueState)
          });
        }
        var iIdx = 0;
        var oIdx = 0;
        var iLen = iVals.length;
        var oLen = oVals.length;
        for (; oIdx < oLen && (!iVals.length || oVals[oIdx] <= iVals[0]); oIdx++) {
          if (oVals[oIdx] < iVals[iIdx]) {
            setStop(oVals[oIdx], 'outOfRange');
          }
        }
        for (var first = 1; iIdx < iLen; iIdx++, first = 0) {
          first && stops.length && setStop(iVals[iIdx], 'outOfRange');
          setStop(iVals[iIdx], 'inRange');
        }
        for (var first = 1; oIdx < oLen; oIdx++) {
          if (!iVals.length || iVals[iVals.length - 1] < oVals[oIdx]) {
            if (first) {
              stops.length && setStop(stops[stops.length - 1].value, 'outOfRange');
              first = 0;
            }
            setStop(oVals[oIdx], 'outOfRange');
          }
        }
        var stopsLen = stops.length;
        return {
          stops: stops,
          outerColors: [stopsLen ? stops[0].color : 'transparent', stopsLen ? stops[stopsLen - 1].color : 'transparent']
        };
      }
    });
    function getColorStopValues(visualMapModel, valueState, dataExtent) {
      if (dataExtent[0] === dataExtent[1]) {
        return dataExtent.slice();
      }
      var count = 200;
      var step = (dataExtent[1] - dataExtent[0]) / count;
      var value = dataExtent[0];
      var stopValues = [];
      for (var i = 0; i <= count && value < dataExtent[1]; i++) {
        stopValues.push(value);
        value += step;
      }
      stopValues.push(dataExtent[1]);
      return stopValues;
    }
    return ContinuousModel;
  });
})(require('process'));
