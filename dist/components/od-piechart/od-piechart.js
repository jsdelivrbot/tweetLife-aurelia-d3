'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OdPieChart = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2;

var _aureliaFramework = require('aurelia-framework');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

var _countries = require('./countries');

var _countries2 = _interopRequireDefault(_countries);

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

var OdPieChart = exports.OdPieChart = (_dec = (0, _aureliaFramework.customElement)('od-piechart'), _dec2 = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = _dec2(_class = (_class2 = function () {
    function OdPieChart(EventAggregator) {
        var _this = this;

        _classCallCheck(this, OdPieChart);

        _initDefineProp(this, 'data', _descriptor, this);

        _initDefineProp(this, 'defaultView', _descriptor2, this);

        this.loading = false;

        this.options = {
            tooltip: {
                trigger: 'item',
                formatter: "{b} : {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                left: '70%',
                top: 'center',
                align: 'left',
                itemGap: 5,
                itemWidth: 20,
                itemHeight: 20,
                data: []
            },
            series: [{
                name: 'Retweeters',
                type: 'pie',
                radius: ['0', '80%'],
                center: ['35%', '50%'],
                data: [],
                label: {
                    normal: {
                        show: false,
                        position: 'inner'
                    },
                    emphasis: {
                        show: false
                    }
                },
                labelLine: {
                    normal: {
                        show: false
                    }
                },
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }],
            color: ['#69a5b6', '#61b8c6', '#5ccad2', '#6dd1c8', '#7dd8bf', '#95e1bb', '#afe9b6', '#c7f1b3', '#dff9af', '#f3ffac']
        };

        this.eventAggregator = EventAggregator;
        this.eventAggregator.subscribe('triggerFetch', function () {

            _this.loading = true;
        });
        this.eventAggregator.subscribe('tweetlifeData', function (data) {
            _this.loading = false;
            _this.geoData = data.countryCodes;

            if (_this.geoData && _this.geoData.length > 10) {
                _this.geoData = _this.geoData.slice(0, 10);
            }

            var _generateData = _this.generateData(_this.geoData),
                result = _generateData[0],
                countryNames = _generateData[1];

            _this.options.legend.data = countryNames;
            _this.options.series[0].data = result;
            _this.data = result;
        });
        this.eventAggregator.subscribe('noRootTweetId', function () {

            _this.loading = false;
        });
    }

    OdPieChart.prototype.attached = function attached() {};

    OdPieChart.prototype.generateData = function generateData(data) {
        var result = [];
        var countryNamesArr = [];

        result = _lodash2.default.map(data, function (datum) {
            var countryObj = _lodash2.default.find(_countries2.default, function (country) {
                return country.cca2 == datum.key.toUpperCase() || country['cca3'] == datum.key.toUpperCase();
            });
            var countryName = '';
            if (datum.key == 'unknown') {
                countryNamesArr.push('unknown');
                countryName = 'unknown';
            } else {
                countryNamesArr.push(countryObj.name.common || datum.key);
                countryName = countryObj.name.common || datum.key;
            }

            return { name: countryName, value: datum.value };
        });

        return [result, countryNamesArr];
    };

    return OdPieChart;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'defaultView', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
})), _class2)) || _class) || _class);
//# sourceMappingURL=od-piechart.js.map
