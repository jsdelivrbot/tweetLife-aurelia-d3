'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TlLineChart = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor;

var _aureliaFramework = require('aurelia-framework');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

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

var TlLineChart = exports.TlLineChart = (_dec = (0, _aureliaFramework.customElement)('tl-linechart'), _dec2 = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = _dec2(_class = (_class2 = function () {
    function TlLineChart(EventAggregator) {
        var _this = this;

        _classCallCheck(this, TlLineChart);

        _initDefineProp(this, 'defaultView', _descriptor, this);

        this.loading = false;

        this.options = {
            title: {
                text: ''
            },
            tooltip: {
                trigger: 'axis',
                formatter: function formatter(params) {
                    params = params[0];
                    return params.name + ' : ' + params.data;
                },
                axisPointer: {
                    animation: false
                }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                splitLine: {
                    show: false
                },
                axisLine: {
                    lineStyle: {
                        color: '#cdcdcd',
                        width: 2
                    }
                },
                axisLabel: {
                    textStyle: {
                        color: '#000',
                        fontSize: 10
                    }
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#cdcdcd',
                        width: 2
                    }
                },
                axisLabel: {
                    textStyle: {
                        color: '#000',
                        fontSize: 10
                    }
                },

                splitLine: {
                    show: false
                }
            },
            series: [{
                type: 'line',
                smooth: true,

                data: []
            }]
        };

        this.eventAggregator = EventAggregator;
        this.eventAggregator.subscribe('triggerFetch', function () {
            _this.loading = true;
        });
        this.eventAggregator.subscribe('tweetlifeData', function (dataCol) {
            _this.loading = false;
            _this.lineData = dataCol.spreadTime;

            var newData = [],
                yIdx = [],
                gapNum = 7,
                totalCounts = _this.lineData.length;
            var timeStart = (0, _moment2.default)(_this.lineData[1]).format('ddd, h:mm A');
            var timeEnd = (0, _moment2.default)(_this.lineData[_this.lineData.length - 1]).format('ddd, h:mm A');
            newData.push(timeStart);
            yIdx.push(1);

            var incrs = Math.floor(totalCounts / gapNum);
            for (var i = 0; i < gapNum - 1; i++) {
                var dataIdx = +incrs * i + parseInt(Math.random() * incrs);
                dataIdx = dataIdx >= totalCounts - 1 ? dataIdx - 10 : dataIdx;
                var timeStamp = _this.lineData[dataIdx];
                var timeValue = (0, _moment2.default)(timeStamp).format('ddd, h:mm A');
                newData.push(timeValue);
                yIdx.push(dataIdx);
            }

            newData.push(timeEnd);
            yIdx.push(totalCounts - 1);

            _this.options.series[0].data = yIdx;
            _this.options.xAxis.data = newData;
        });
        this.eventAggregator.subscribe('noRootTweetId', function () {
            _this.loading = false;
        });
    }

    TlLineChart.prototype.attached = function attached() {};

    TlLineChart.prototype.timeConverter = function timeConverter(time, unit) {
        var result = '',
            number = '',
            finalUnit = '';
        switch (unit) {
            case 'min':
                if (time > 60) {
                    time = time / 60;
                    this.timeConverter(time, 'hr');
                } else {
                    result = Math.ceil(time) + ' min';
                    number = Math.ceil(time);
                    finalUnit = 'min';
                    break;
                }
            case 'hr':
                if (time > 24) {
                    time = time / 24;
                    this.timeConverter(time, 'day');
                } else {
                    result = Math.ceil(time) + ' hr';
                    number = Math.ceil(time);
                    finalUnit = 'hr';
                    break;
                }
            case 'day':
                if (time > 7) {
                    time = time / 7;
                    this.timeConverter(time, 'wk');
                } else {
                    result = Math.ceil(time) + ' day';
                    number = Math.ceil(time);
                    finalUnit = 'day';
                    break;
                }
            case 'wk':
                if (time > 5) {
                    time = time / 5;
                    this.timeConverter(time, 'month');
                } else {
                    result = Math.ceil(time) + ' wk';
                    number = Math.ceil(time);
                    finalUnit = 'wk';
                    break;
                }
            case 'month':
                if (time > 12) {
                    time = time / 60;
                    this.timeConverter(time, 'year');
                } else {
                    result = Math.ceil(time) + ' month';
                    number = Math.ceil(time);
                    finalUnit = 'month';
                    break;
                }
            case 'year':
                result = Math.ceil(time) + ' year';
                number = Math.ceil(time);
                finalUnit = 'year';
                break;

        }

        return { result: result, number: number, unit: finalUnit };
    };

    return TlLineChart;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'defaultView', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: function initializer() {
        return true;
    }
})), _class2)) || _class) || _class);
//# sourceMappingURL=tl-linechart.js.map
