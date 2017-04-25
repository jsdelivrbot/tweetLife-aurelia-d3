'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TlTimeLine = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3;

var _aureliaFramework = require('aurelia-framework');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _htmlkit = require('pg/htmlkit');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var TlTimeLine = exports.TlTimeLine = (_dec = (0, _aureliaFramework.customElement)('tl-timeline'), _dec2 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = (_class2 = function () {
  function TlTimeLine(element) {
    _classCallCheck(this, TlTimeLine);

    _initDefineProp(this, 'data', _descriptor, this);

    _initDefineProp(this, 'showDatazoom', _descriptor2, this);

    _initDefineProp(this, 'totalBrushTime', _descriptor3, this);

    this.loading = false;
    this._attached = false;
    this._brushing = false;
    this._brushIndex = 0;
    this._datazoomParams = {};

    this.defaultView = true;
    this.options = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        }
      },
      toolbox: {
        show: false
      },
      grid: {
        left: 0,
        right: 10,
        top: 20,
        containLabel: true
      },
      brush: {
        xAxisIndex: 'all',
        brushLink: 'all',

        outOfBrush: {
          colorAlpha: 0.3
        },
        brushStyle: {
          color: 'rgba(120,140,180,0.1)',
          borderColor: 'rgba(120,140,180,0.3)'
        },
        inBrunsh: {
          color: 'red',
          colorAlpha: 1
        }
      },
      xAxis: [{
        type: 'category',
        axisLine: {
          lineStyle: {
            color: '#cdcdcd',
            width: 1
          }
        },
        axisLabel: {
          show: true,
          textStyle: {
            color: '#000',
            fontSize: 10
          }
        },
        data: [],
        scale: true,
        boundaryGap: true,
        axisTick: { alignWithLabel: true },
        splitNumber: 20,
        min: 'dataMin',
        max: 'dataMax'
      }],
      yAxis: [{
        scale: true,
        splitLine: { show: false },
        axisLine: {
          onZero: true,
          lineStyle: {
            color: '#cdcdcd',
            width: 1
          }
        },
        axisLabel: {
          textStyle: {
            color: '#000',
            fontSize: 10
          }
        }
      }],
      dataZoom: [{
        show: false,
        xAxisIndex: [0],
        type: 'slider',
        top: '65%',
        start: 0,
        end: 100,
        realtime: false,
        dataBackground: {
          lineStyle: {
            color: 'rgba(89,200,211,1)'
          },
          areaStyle: {
            color: 'rgba(89,200,211,0.5)'
          }
        },
        handleStyle: {
          color: '#FFFFFF',
          borderColor: '#59c8d3'
        },
        backgroundColor: '#FFFFFF',
        fillerColor: 'rgba(89,200,211,0.5)'
      }],
      series: [{
        name: 'Twitters',
        type: 'bar',
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          normal: {
            color: '#a6dfe6'
          }
        },
        data: []
      }]
    };
    this.element = element;
  }

  TlTimeLine.prototype.attached = function attached() {
    this.options.dataZoom[0].show = this.showDatazoom;
  };

  TlTimeLine.prototype.detached = function detached() {
    clearInterval(this._chartBrushInterval);
  };

  TlTimeLine.prototype.dataChanged = function dataChanged() {
    this.defaultView = false;
    var timeArr = [],
        valueArr = [];
    this.data.forEach(function (obj) {
      timeArr.push(obj.key);valueArr.push(obj.value);
    });
    this.options.series[0].data = valueArr;
    this.options.xAxis[0].data = timeArr;
  };

  TlTimeLine.prototype.playTimeline = function playTimeline() {
    this._startBrush();
  };

  TlTimeLine.prototype.resetTimeline = function resetTimeline() {
    this._brushIndex = 0;
    this._brushing = false;
    clearInterval(this._chartBrushInterval);
    this.echart.dispatchDatazoom({ show: this.showDatazoom });
    this._brushChart(0, 0);
  };

  TlTimeLine.prototype.pauseTimeline = function pauseTimeline() {
    this._brushing = false;
    clearInterval(this._chartBrushInterval);
  };

  TlTimeLine.prototype._startBrush = function _startBrush(start) {
    var _this = this;

    if (!this._brushing && this.data && this.data.length) {
      var length = this.data.length;
      this._brushing = true;
      this.echart.dispatchDatazoom({ show: false });
      this._chartBrushInterval = setInterval(function () {
        _this._brushChart(0, _this._brushIndex);
        _this._brushIndex++;
        if (_this._brushIndex > length) {
          _this._brushing = false;
          _this.echart.dispatchDatazoom({ show: _this.showDatazoom });
          _this._brushChart(0, _this._brushIndex - 1);
          clearInterval(_this._chartBrushInterval);
          _this._brushIndex = 0;

          _this.element.dispatchEvent(new CustomEvent('play-done', {
            detail: {},
            bubbles: true
          }));
        }
      }, this.totalBrushTime / this.data.length);
    }
  };

  TlTimeLine.prototype._brushChart = function _brushChart(start, end) {
    var chart = this.echart.getChart();
    chart.dispatchAction({
      type: 'brush',
      areas: [{
        brushType: 'lineX',
        xAxisIndex: 0,
        coordRange: [start - 1, end ? end : -1]
      }]
    });
    var startObj = this.data[start];
    var endObj = this.data[end];

    if (end < this.data.length) {
      this.element.dispatchEvent(new CustomEvent('data-brush', {
        detail: {
          startIndex: start,
          endIndex: end,
          startItem: startObj,
          endItem: endObj
        },
        bubbles: true
      }));
    }
  };

  TlTimeLine.prototype.datazoom = function datazoom(params) {

    this.element.dispatchEvent(new CustomEvent('data-range-change', { detail: params, bubbles: true }));
  };

  return TlTimeLine;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'showDatazoom', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: function initializer() {
    return true;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'totalBrushTime', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: function initializer() {
    return 2000;
  }
})), _class2)) || _class) || _class);
//# sourceMappingURL=tl-timeline.js.map
