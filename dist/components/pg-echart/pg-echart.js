'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ChartElement = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3;

var _aureliaFramework = require('aurelia-framework');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _echarts = require('echarts');

var _echarts2 = _interopRequireDefault(_echarts);

var _ResizeSensor = require('css-element-queries/src/ResizeSensor');

var _ResizeSensor2 = _interopRequireDefault(_ResizeSensor);

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

var DEBOUNC_TIME = 300;
var ChartElement = exports.ChartElement = (_dec = (0, _aureliaFramework.customElement)('echart'), _dec2 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = (_class2 = function () {
    function ChartElement(element) {
        _classCallCheck(this, ChartElement);

        _initDefineProp(this, 'data', _descriptor, this);

        _initDefineProp(this, 'loading', _descriptor2, this);

        _initDefineProp(this, 'options', _descriptor3, this);

        this._attached = false;
        this._debounceResize = _lodash2.default.debounce(this._resize, DEBOUNC_TIME);

        this.element = element;
    }

    ChartElement.prototype.attached = function attached() {
        this._createOrUpdate();
        this._attached = true;
    };

    ChartElement.prototype.dataChanged = function dataChanged() {
        if (this._attached) {
            this._createOrUpdate();
        }
    };

    ChartElement.prototype.detached = function detached() {
        if (this._chart) {
            this._chart = undefined;
        }
        this._attached = false;
    };

    ChartElement.prototype._createOrUpdate = function _createOrUpdate() {
        var _this = this;

        if (this.data) {
            if (!this._chart) {
                this._chart = _echarts2.default.init((0, _jquery2.default)(this.element).find('.pg-echart')[0]);
                new _ResizeSensor2.default(this.element, function () {
                    _this._debounceResize(_this._chart);
                });
                this._chart.on('click', function (params) {
                    _this._clickChart(params);
                });
                this._chart.on('datazoom', function (params) {
                    _this._datazoom();
                });
            }
            this._chart.setOption(this.options, true);
        } else {
            if (this._chart) {
                this._chart = undefined;
            }
        }
    };

    ChartElement.prototype._resize = function _resize(chart) {
        if (chart) {
            chart.resize();
        }
    };

    ChartElement.prototype._clickChart = function _clickChart(params) {
        this.element.dispatchEvent(new CustomEvent('chartclick', {
            detail: params, bubbles: true
        }));
    };

    ChartElement.prototype._datazoom = function _datazoom(chartElement) {
        var xAxis = this._chart.getOption().xAxis[0];
        var startValue = void 0,
            endValue = void 0;
        if (xAxis && xAxis.data && xAxis.data.length) {
            startValue = xAxis.data[xAxis.rangeStart || 0];
            endValue = xAxis.data[xAxis.rangeEnd || xAxis.data.length - 1];
        }

        var params = {
            startValue: startValue,
            endValue: endValue,
            startIndex: xAxis.rangeStart,
            endIndex: xAxis.rangeEnd
        };
        if (!_lodash2.default.isEqual(params, this.element._datazoomParams)) {
            this.element._datazoomParams = params;
            this.element.dispatchEvent(new CustomEvent('datazoom', {
                detail: params, bubbles: true
            }));
        }
    };

    ChartElement.prototype.getChart = function getChart() {
        return this._chart;
    };

    ChartElement.prototype.dispatchDatazoom = function dispatchDatazoom(params) {
        if (this._chart) {
            this.options.dataZoom[0] = _lodash2.default.assignIn(this.options.dataZoom[0], params);
            this._createOrUpdate();
        }
    };

    return ChartElement;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'loading', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'options', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: function initializer() {
        return {};
    }
})), _class2)) || _class) || _class);
//# sourceMappingURL=pg-echart.js.map
