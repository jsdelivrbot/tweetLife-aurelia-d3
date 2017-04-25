'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BoxWrap = undefined;

var _dec, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;

var _aureliaFramework = require('aurelia-framework');

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

var BoxWrap = exports.BoxWrap = (_dec = (0, _aureliaFramework.inject)(Element), _dec(_class = (_class2 = function () {
    BoxWrap.prototype.getClassNames = function getClassNames() {
        var classes = ['box-wrap'];
        if (this.class) {
            classes.push(this.class);
        }
        return classes.join(' ');
    };

    BoxWrap.prototype.changeView = function changeView(item) {
        var oldTab = this.activeTab;
        this.activeTab = item;
        if (oldTab !== item) {
            this.element.dispatchEvent(new CustomEvent('activetabchange', {
                detail: {
                    activeTab: this.activeTab
                }, bubbles: true
            }));
        }
    };

    function BoxWrap(element) {
        _classCallCheck(this, BoxWrap);

        _initDefineProp(this, 'class', _descriptor, this);

        _initDefineProp(this, 'title', _descriptor2, this);

        _initDefineProp(this, 'list', _descriptor3, this);

        _initDefineProp(this, 'isShowSelection', _descriptor4, this);

        _initDefineProp(this, 'activeTab', _descriptor5, this);

        this.element = element;
    }

    BoxWrap.prototype.attached = function attached() {
        this.activeTab = this.isShowSelection ? this.list[0] : null;
    };

    BoxWrap.prototype.listChanged = function listChanged() {
        if (this.list) {
            this.activeTab = this.list[0];
        }
    };

    return BoxWrap;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'class', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'title', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'list', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'isShowSelection', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, 'activeTab', [_aureliaFramework.bindable], {
    enumerable: true,
    initializer: null
})), _class2)) || _class);
//# sourceMappingURL=box-wrap.js.map
