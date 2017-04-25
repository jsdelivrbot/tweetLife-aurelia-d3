'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ChartElement = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3;

var _aureliaFramework = require('aurelia-framework');

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _wordcloud = require('wordcloud');

var _wordcloud2 = _interopRequireDefault(_wordcloud);

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
        this.scale = d3.scale.linear();
    }

    ChartElement.prototype.attached = function attached() {
        this._createOrUpdate();
        this._attached = true;
    };

    ChartElement.prototype.dataChanged = function dataChanged() {
        this._createOrUpdate();
    };

    ChartElement.prototype.detached = function detached() {
        this._wordcloud = undefined;
    };

    ChartElement.prototype._resize = function _resize() {};

    ChartElement.prototype._createOrUpdate = function _createOrUpdate() {
        var that = this;

        this.wordsResult = [];
        if (this.data) {
            var large = this.data[0].value;
            var small = this.data[this.data.length - 1].value;
            this.scale.domain([small, large]).range([20, 60]);
            this.loading = false;
            this.data.forEach(function (item, idx) {
                that.wordsResult.push([item.key, that.scale(item.value)]);
            });

            (0, _wordcloud2.default)((0, _jquery2.default)(this.element).find('.pg-wordcloud')[0], {
                list: this.wordsResult,

                fontFamily: 'Finger Paint, cursive, sans-serif',
                color: 'random-dark',
                hover: window.drawBox,
                click: function click(item) {},
                shap: 'circle'
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
