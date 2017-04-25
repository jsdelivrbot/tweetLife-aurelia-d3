'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TlWordcloud = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2;

var _aureliaFramework = require('aurelia-framework');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

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

var TlWordcloud = exports.TlWordcloud = (_dec = (0, _aureliaFramework.customElement)('tl-wordcloud'), _dec2 = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = (0, _aureliaFramework.containerless)(_class = _dec2(_class = (_class2 = function () {
    function TlWordcloud(EventAggregator) {
        var _this = this;

        _classCallCheck(this, TlWordcloud);

        _initDefineProp(this, 'data', _descriptor, this);

        _initDefineProp(this, 'defaultView', _descriptor2, this);

        this.wordTotalNum = 30;
        this.loading = false;

        this.eventAggregator = EventAggregator;
        this.eventAggregator.subscribe('triggerFetch', function () {
            _this.loading = true;
        });
        this.eventAggregator.subscribe('tweetlifeData', function (data) {
            _this.loading = false;
            _this.wordCloudData = data.bioKeywords;

            if (_this.wordCloudData && _this.wordCloudData.length > _this.wordTotalNum) {
                _this.wordCloudData = _this.wordCloudData.splice(0, _this.wordTotalNum);
            }
        });
        this.eventAggregator.subscribe('noRootTweetId', function () {
            _this.loading = false;
        });
    }

    TlWordcloud.prototype.attached = function attached() {};

    return TlWordcloud;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'defaultView', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
})), _class2)) || _class) || _class) || _class);
//# sourceMappingURL=tl-wordcloud.js.map
