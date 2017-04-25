'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TlCardListCustomElement = undefined;

var _aureliaFramework = require('aurelia-framework');

var _cardsDummyData = require('../../data/cardsDummyData');

var _cardsDummyData2 = _interopRequireDefault(_cardsDummyData);

var _cbkit = require('pg/cbkit');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TlCardListCustomElement = exports.TlCardListCustomElement = function () {
  function TlCardListCustomElement(RecordUtils, CbkitService) {
    _classCallCheck(this, TlCardListCustomElement);

    this.cardsData = _cardsDummyData2.default;

    this.recordUtils = RecordUtils;
    this.cbkitService = CbkitService;
  }

  TlCardListCustomElement.prototype.activate = function activate() {
    var _this = this;

    this.click = function (model) {
      _this.cbkitService.openRecordDetail(model);
    };
    this.eventCardContextMenu = [{
      title: "Original Link",
      callback: function callback(model) {
        return _this.cbkitService.openRecordDetail(model);
      },
      hidden: this.buildProfileMode && this.phase0A
    }, {
      title: "Export as PNG",
      callback: function callback(model) {
        return _this.cbkitService.openRecordDetail(model);
      },
      hidden: this.buildProfileMode && this.phase0A
    }, {
      title: "Export as PDF",
      callback: function callback(model) {
        return _this.cbkitService.openRecordDetail(model);
      },
      hidden: this.buildProfileMode && this.phase0A
    }, {
      title: "Search this Twitter ID",
      callback: function callback(model) {
        return _this.cbkitService.openRecordDetail(model);
      },
      hidden: this.buildProfileMode && this.phase0A
    }];

    this.entityCardContextMenu = [].concat(this.eventCardContextMenu);
  };

  return TlCardListCustomElement;
}();
//# sourceMappingURL=tl-card-list.js.map
