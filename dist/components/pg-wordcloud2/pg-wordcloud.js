'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ChartElement = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3;

var _aureliaFramework = require('aurelia-framework');

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _jqcloud = require('jqcloud2');

var _jqcloud2 = _interopRequireDefault(_jqcloud);

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

var ChartElement = exports.ChartElement = (_dec = (0, _aureliaFramework.customElement)('pg-wordcloud'), _dec2 = (0, _aureliaFramework.inject)(Element), _dec(_class = _dec2(_class = (_class2 = function () {
    function ChartElement(element) {
        _classCallCheck(this, ChartElement);

        _initDefineProp(this, 'data', _descriptor, this);

        _initDefineProp(this, 'loading', _descriptor2, this);

        _initDefineProp(this, 'options', _descriptor3, this);

        this.ColorInterval = 10;

        this.element = element;
    }

    ChartElement.prototype.attached = function attached() {
        this._createOrUpdate();
        this._attached = true;
    };

    ChartElement.prototype.dataChanged = function dataChanged() {
        this._createOrUpdate();
    };

    ChartElement.prototype.detached = function detached() {
        console.log('wordcloud detached');
        this._wordcloud = undefined;
    };

    ChartElement.prototype._createOrUpdate = function _createOrUpdate() {
        var that = this;

        this.wordsResult = [];
        if (this.data) {
            this.data.forEach(function (item, idx) {
                var className = 'cloudWord-' + idx % that.ColorInterval;
                that.wordsResult.push({
                    text: item.key,
                    weight: item.value,
                    handlers: {
                        click: function click() {
                            window.open("https://twitter.com/search?q=" + item.key + "&src=typd");
                        }
                    }
                });
            });
            (0, _jquery2.default)(this.element).find('.pg-wordcloud').jQCloud(that.wordsResult, {
                autoResize: true,
                fontSize: {
                    from: 0.15,
                    to: 0.04
                }

            });
        } else {
            this._wordcloud = undefined;
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
//# sourceMappingURL=pg-wordcloud.js.map
