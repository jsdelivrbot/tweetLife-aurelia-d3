'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TlSpreadView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dec, _dec2, _dec3, _class, _desc, _value, _class2;

var _aureliaFramework = require('aurelia-framework');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

var _aureliaBinding = require('aurelia-binding');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var TlSpreadView = exports.TlSpreadView = (_dec = (0, _aureliaFramework.customElement)('tl-spreadview'), _dec2 = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec3 = (0, _aureliaBinding.computedFrom)('allData'), _dec(_class = _dec2(_class = (_class2 = function () {
  function TlSpreadView(EventAggregator) {
    var _this = this;

    _classCallCheck(this, TlSpreadView);

    this.defaultView = true;
    this.tabs = {
      "Spread Pattern": {
        data: null,
        type: 'spread'
      },
      "Map View": {
        data: null,
        type: 'map'
      }
    };

    this.loading = false;
    this.eventAggregator = EventAggregator;
    this.eventAggregator.subscribe('tweetlifeData', function (data) {
      _this.loading = false;
      _this.allData = data;
      _this.tabs["Spread Pattern"].data = data;
      _this.tabs["Map View"].data = data;
      _this.defaultView = false;
    });
    this.eventAggregator.subscribe('noRootTweetId', function () {
      _this.defaultView = true;
    });
    this.eventAggregator.subscribe('triggerFetch', function () {
      _this.loading = true;
      _this.defaultView = false;
    });
  }

  TlSpreadView.prototype.attached = function attached() {};

  TlSpreadView.prototype.changeBetweenView = function changeBetweenView($event) {};

  _createClass(TlSpreadView, [{
    key: 'originTweets',
    get: function get() {
      if (this.allData && this.allData.originTweet) {
        return [this.allData.originTweet];
      } else {
        return [];
      }
    }
  }]);

  return TlSpreadView;
}(), (_applyDecoratedDescriptor(_class2.prototype, 'originTweets', [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, 'originTweets'), _class2.prototype)), _class2)) || _class) || _class);
//# sourceMappingURL=tl-spreadView.js.map
