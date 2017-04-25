'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TlCardList = undefined;

var _dec, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;

var _aureliaFramework = require('aurelia-framework');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

var _cbkit = require('pg/cbkit');

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

var TlCardList = exports.TlCardList = (_dec = (0, _aureliaFramework.inject)(_cbkit.CbkitDialogService, _aureliaEventAggregator.EventAggregator), _dec(_class = (_class2 = function () {
    function TlCardList(CbkitDialogService, EventAggregator) {
        _classCallCheck(this, TlCardList);

        _initDefineProp(this, 'data', _descriptor, this);

        _initDefineProp(this, 'loading', _descriptor2, this);

        _initDefineProp(this, 'defaultView', _descriptor3, this);

        _initDefineProp(this, 'cardNum', _descriptor4, this);

        this.retweeterList = [];

        this.defaultView = true;
        this.loading = false;
        this.eventAggregator = EventAggregator;
        this.CbkitDialogService = CbkitDialogService;
    }

    TlCardList.prototype.attached = function attached() {
        var _this = this;

        this.click = function (model) {
            _this.CbkitDialogService.openRecordDetail(model);
        };
    };

    TlCardList.prototype.dataChanged = function dataChanged() {
        if (this.data) {
            this.dataBackup = JSON.parse(JSON.stringify(this.data));
            this.retweeterList = this.data.length > this.cardNum ? this.dataBackup.splice(0, this.cardNum) : this.data;
        } else {
            this.retweeterList = [];
        }
    };

    return TlCardList;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'loading', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'defaultView', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'cardNum', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
})), _class2)) || _class);
//# sourceMappingURL=tl-card-list.js.map
