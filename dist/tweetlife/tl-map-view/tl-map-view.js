'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TlMapView = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3;

var _aureliaFramework = require('aurelia-framework');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

var _cbkit = require('pg/cbkit');

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _ResizeSensor = require('css-element-queries/src/ResizeSensor');

var _ResizeSensor2 = _interopRequireDefault(_ResizeSensor);

var _worldCountries = require('./world-countries.json!');

var _worldCountries2 = _interopRequireDefault(_worldCountries);

var _countryCapitalLocation = require('./countryCapitalLocation.json!');

var _countryCapitalLocation2 = _interopRequireDefault(_countryCapitalLocation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

var DAY_TIMESPAN = 24 * 60 * 60 * 1000;
var HOUR_TIMESPAN = 60 * 60 * 1000;
var DEBOUNC_TIME = 300;

var TlMapView = exports.TlMapView = (_dec = (0, _aureliaFramework.customElement)('tl-map-view'), _dec2 = (0, _aureliaFramework.inject)(Element, _aureliaEventAggregator.EventAggregator, _cbkit.CbkitDialogService), _dec(_class = _dec2(_class = (_class2 = function () {
  function TlMapView(element, eventAggregator, CbkitDialogService) {
    var _this = this;

    _classCallCheck(this, TlMapView);

    _initDefineProp(this, 'data', _descriptor, this);

    _initDefineProp(this, 'loading', _descriptor2, this);

    _initDefineProp(this, 'defaultView', _descriptor3, this);

    this.totalBrushTime = 10000;
    this.timelineStepTime = 300;
    this.allowedPlay = true;
    this.allowHeatmap = false;
    this.showHeatmap = false;
    this.timelinePlayData = [];
    this._debounceResize = _lodash2.default.debounce(this._reRender, DEBOUNC_TIME);
    this._attached = false;

    this.element = element;
    this.ea = eventAggregator;
    this.cbkitDialogService = CbkitDialogService;
    this.fetchSubscription = this.ea.subscribe('triggerFetch', function () {
      _this.timeline && _this.timeline.resetTimeline();
      _this.timelinePlayData = [];
      _this.showPause = false;
      _this.allowedPlay = true;
      _this.reseted = true;
      _this.allowHeatmap = false;
      _this.showHeatmap = false;
    });
  }

  TlMapView.prototype.attached = function attached() {
    var _this2 = this;

    this._attached = true;
    this.mapContainer = d3.select(this.svgContainer).select('#tl-worldmap-countries');
    this.linesContaner = d3.select(this.svgContainer).select('#tl-worldmap-lines');
    this._renderMap();
    new _ResizeSensor2.default(this.element, function () {
      if (_this2.loading) {
        return;
      }
      _this2.resizing = true;
      _this2._debounceResize(_this2);
    });
    this._init();
  };

  TlMapView.prototype.detached = function detached() {
    this._attached = false;
    if (this.fetchSubscription) {
      this.fetchSubscription.dispose();
    }
  };

  TlMapView.prototype.dataChanged = function dataChanged() {
    var _this3 = this;

    setTimeout(function () {
      _this3._init();
    });
  };

  TlMapView.prototype._init = function _init() {
    var _this4 = this;

    if (!this._attached || !this.data) {
      return;
    }
    this.originTweet = this.data.originTweet;
    if (this.originTweet) {
      this.originTweet.attributes.country_code_enrich = ['us'];
    }
    this.timelineData = [];
    this.spreadMap = this.data.spreadMap;
    if (this.data.timelineData && this.data.timelineData.length) {
      var lastTimeDiff = this.data.timelineData[this.data.timelineData.length - 1].key;
      var lastHourDiff = Math.ceil(lastTimeDiff / HOUR_TIMESPAN);
      for (var i = 0; i <= lastHourDiff; i++) {
        this.timelineData.push({ key: i + 'h', value: 0 });
      }
      this.data.timelineData.forEach(function (tlData) {
        var hour = Math.ceil(tlData.key / HOUR_TIMESPAN);
        var mappingHour = _this4.timelineData.find(function (d) {
          return hour + 'h' == d.key;
        });
        if (mappingHour) {
          mappingHour.value = mappingHour.value + tlData.value;
        }
      });

      this.totalBrushTime = this._caculateBrushTime(lastHourDiff);
      this._clearMap();
      this._renderMap();
      this._clearOriginLine();
      this._clearSpreadLines();

      setTimeout(function () {
        _this4._renderOriginLine();
      }, 500);
    }
  };

  TlMapView.prototype._reRender = function _reRender(self) {
    var _this5 = this;

    this.resizing = false;
    this._clearMap();
    this._clearOriginLine();
    this._clearSpreadLines();
    this._renderMap();
    if (!this.showHeatmap) {
      this._renderOriginLine();
      this.timelinePlayData.forEach(function (d, idx) {
        _this5._renderHourLines(idx, d.key);
      });
    } else {
      this._renderHeatmap();
    }
  };

  TlMapView.prototype._renderMap = function _renderMap() {
    var $svgContainer = $(this.svgContainer);
    var _ref = [$svgContainer.width(), $svgContainer.width() / 1.92],
        width = _ref[0],
        height = _ref[1];

    $svgContainer.attr('height', height);

    var features = _lodash2.default.filter(_worldCountries2.default.features, function (value, key) {
      return value.properties.name != 'Antarctica';
    });

    var projection = d3.geo.mercator();
    var oldScala = projection.scale();
    var oldTranslate = projection.translate();

    this.xy = projection.scale(oldScala * (width / oldTranslate[0] / 2)).translate([width / 2, height * 0.66]);

    var path = d3.geo.path().projection(this.xy);

    this.mapContainer.attr('width', width).attr('height', height);
    this.mapContainer.selectAll('path').data(features).enter().append('svg:path').attr('country-code', function (data) {
      return data.CountryCode;
    }).attr('d', path).append('title').text(function (d) {
      return d.CountryCode;
    });
  };

  TlMapView.prototype._renderOriginLine = function _renderOriginLine() {
    if (!this._attached) {
      return;
    }
    if (!(this.timelineData && this.timelineData.length)) {
      return;
    }
    var tweet = this.originTweet;
    var lineBaseTop = -20;

    var chart = this.timeline.echart.getChart();

    var lineBaseLeft = chart.convertToPixel({ xAxisIndex: 0 }, 0);
    var startPosition = [lineBaseLeft, lineBaseTop];

    var originTweetGeo = this._getTweetGeo(tweet);
    if (originTweetGeo) {
      var endPosition = this.xy(originTweetGeo);
      var line = d3.svg.line().interpolate("linear").x(function (data) {
        return data[0];
      }).y(function (data) {
        return data[1];
      });

      this.linesContaner.append('svg:path').attr('d', line([startPosition, [startPosition[0], endPosition[1]], endPosition])).attr('class', 'origin').attr("marker-start", "url(#marker_arrow)").attr("marker-end", "url(#arrow)");

      this._renderLocationPoint(tweet, endPosition, { r: 6, class: 'origin' });

      this.linesContaner.append('svg:text').text("Tweeted").attr('class', 'origin').attr('transform', 'translate(' + startPosition[0] + ', ' + (endPosition[1] + 18) + ')');
    }
  };

  TlMapView.prototype._renderHourLines = function _renderHourLines(index, endTime, animate) {
    var _this6 = this;

    if (!(this.timelineData && this.timelineData.length)) {
      return;
    }
    var lineBaseTop = -46;

    var chart = this.timeline.echart.getChart();

    var lineBaseLeft = chart.convertToPixel({ xAxisIndex: 0 }, index);
    var startPosition = [lineBaseLeft, lineBaseTop];

    var spreadTweets = [];
    this.spreadMap.forEach(function (tw) {
      var time = new Date(tw.event_time || tw.eventTime).getTime();
      var originTweetTime = new Date(_this6.originTweet.event_time || tw.eventTime).getTime();
      var hour = Math.ceil((time - originTweetTime) / HOUR_TIMESPAN) + 'h';
      if (hour == endTime) {
        var location = _this6._getTweetGeo(tw);
        if (location) {
          spreadTweets.push({
            tweet: tw,
            hour: hour,
            location: _this6._getTweetGeo(tw)
          });
        }
      }
    });

    spreadTweets.forEach(function (tw) {
      _this6._renderLine(startPosition, tw, animate);
    });
  };

  TlMapView.prototype._renderLine = function _renderLine(startPosition, twInfo, animate) {
    var _this7 = this;

    var line = d3.svg.line().interpolate("basis").x(function (data) {
      return data[0];
    }).y(function (data) {
      return data[1];
    });
    var endPosition = this.xy(twInfo.location);
    var speadLine = this.linesContaner.append('svg:path').attr('d', line([startPosition].concat(this._getSmoothPoint(startPosition, endPosition), [endPosition]))).attr('id', 'speadline-' + twInfo.tweet.id).attr('class', 'spread');
    if (animate) {
      var duration = speadLine.transition().duration(1000).attrTween("stroke-dasharray", function () {
        var len = this.getTotalLength();
        return function (t) {
          return d3.interpolateString("0," + len, len + ",0")(t);
        };
      });
      if (!this.resizing) {
        duration.each('end', function () {
          if (_this7.reseted) {
            return;
          }
          _this7._renderLocationPoint(twInfo.tweet, endPosition);
        });
      }
    } else {
      this._renderLocationPoint(twInfo.tweet, endPosition);
    }
  };

  TlMapView.prototype._renderLocationPoint = function _renderLocationPoint(tweet, position, options) {
    var _this8 = this;

    options = _lodash2.default.assignIn({ r: 8, class: 'spread' }, options);
    var circle = this.linesContaner.append('circle').datum(tweet).attr('r', options.r).attr('id', 'speadcircle-' + tweet.id).attr('class', options.class).on('mouseover', function () {
      _this8.linesContaner.select('#speadline-' + tweet.id).classed('active', true);
      _this8.linesContaner.select('#speadcircle-' + tweet.id).classed('active', true);
      _this8.currentEvent = tweet;
      _this8.currentEntity = tweet.entities.from;
      _this8._showEntityCard(position);
    }).on('mouseout', function () {
      _this8.linesContaner.select('#speadline-' + tweet.id).classed('active', false);
      _this8.linesContaner.select('#speadcircle-' + tweet.id).classed('active', false);
      _this8._hideEntityCard();
    }).on('click', function (tweet) {
      _this8.cbkitDialogService.openRecordDetail(tweet);
    }).attr('fill', 'rgba(73,144,226,0.6)').attr('transform', 'translate(' + position[0] + ', ' + position[1] + ')');
    if (tweet.attributes.country_code_enrich && tweet.attributes.country_code_enrich[0]) {
      var countryCode = tweet.attributes.country_code_enrich[0].toUpperCase();
      var spreadCountryPath = this.mapContainer.select('[country-code="' + countryCode + '"]');
      spreadCountryPath.classed(options.class, true);
    }
  };

  TlMapView.prototype._renderHeatmap = function _renderHeatmap() {
    var _this9 = this;

    if (this.data.eventsByCountryCode) {
      var compute = d3.interpolate(d3.rgb('#83a8d8'), d3.rgb('#9ec5dd'));
      var scaleDomain = this.data.eventsByCountryCode.map(function (d) {
        return d.value;
      });
      scaleDomain = _lodash2.default.sortedUniq(scaleDomain);
      var colorRange = d3.scale.linear().domain([202, 1]).range([0, 1]);
      this.data.eventsByCountryCode.forEach(function (d) {
        _this9.mapContainer.select('[country-code="' + d.key.toUpperCase() + '"]').style('fill', compute(colorRange(d.value))).select('title').text(d.key.toUpperCase() + '\n' + d.value);
      });
    }
  };

  TlMapView.prototype._clearMap = function _clearMap() {
    this.mapContainer.selectAll('path').remove();
  };

  TlMapView.prototype._clearOriginLine = function _clearOriginLine() {
    this.linesContaner.selectAll('.origin').remove();
  };

  TlMapView.prototype._clearSpreadLines = function _clearSpreadLines() {
    this.linesContaner.selectAll('.spread').remove();
    this.mapContainer.selectAll('.spread').classed('spread', false);
  };

  TlMapView.prototype._showEntityCard = function _showEntityCard(position) {
    var cardContainer = $(this.element).find('#tl-worldmap-entitycard');
    var offsetParent = cardContainer.parent();
    var left = position[0] + parseInt(offsetParent.css('paddingLeft'));
    var top = position[1] + parseInt(offsetParent.css('paddingTop')) + 20;
    var $svgContainer = $(this.svgContainer);
    left = Math.min(left, $svgContainer.width() - 250);
    cardContainer.removeClass('hide').css({ left: left, top: top });
  };

  TlMapView.prototype._hideEntityCard = function _hideEntityCard() {
    $(this.element).find('#tl-worldmap-entitycard').addClass('hide');
  };

  TlMapView.prototype._getTweetGeo = function _getTweetGeo(tweet) {
    var geo = void 0;
    if (tweet.attributes.geo) {
      geo = tweet.attributes.geo;
    } else {
      if (tweet.attributes.country_code_enrich && tweet.attributes.country_code_enrich[0]) {
        var capitalInfo = _countryCapitalLocation2.default.find(function (cap) {
          return cap.CountryCode == tweet.attributes.country_code_enrich[0].toUpperCase();
        });
        if (capitalInfo) {
          geo = [capitalInfo.CapitalLongitude, capitalInfo.CapitalLatitude];
        }
      }
    }
    return geo;
  };

  TlMapView.prototype._getSmoothPoint = function _getSmoothPoint(startPoint, endPoint) {
    var x1 = startPoint[0],
        y1 = startPoint[1];
    var x2 = endPoint[0],
        y2 = endPoint[1];

    return [[x1 + (x2 - x1) / 12, y1 + (y2 - y1) * 5 / 12], [x1 + (x2 - x1) * 4 / 12, y1 + (y2 - y1) * 9 / 12], [x1 + (x2 - x1) * 8 / 12, y1 + (y2 - y1) * 11 / 12]];
  };

  TlMapView.prototype._caculateBrushTime = function _caculateBrushTime(count) {
    var minTime = 1000;
    return minTime + count * this.timelineStepTime;
  };

  TlMapView.prototype.__toggleHeatmap = function __toggleHeatmap() {
    this._reRender();
  };

  TlMapView.prototype.__playBtnClicked = function __playBtnClicked() {
    this.timeline.playTimeline();
    this.showPause = true;
    this.reseted = false;
    this.allowHeatmap = false;
  };

  TlMapView.prototype.__pauseBtnClicked = function __pauseBtnClicked() {
    this.timeline.pauseTimeline();
    this.showPause = false;
  };

  TlMapView.prototype.__resetBtnClicked = function __resetBtnClicked() {
    this.timeline.resetTimeline();
    this.timelinePlayData = [];
    this.showPause = false;
    this.allowedPlay = true;
    this.reseted = true;
    this.allowHeatmap = false;
    this.showHeatmap = false;
    this._reRender();
  };

  TlMapView.prototype.__timelineBrush = function __timelineBrush(d) {
    this.timelinePlayData.push(d.endItem);
    this._renderHourLines(d.endIndex, d.endItem.key, true);
  };

  TlMapView.prototype.__playDone = function __playDone(params) {
    this.showPause = false;
    this.allowedPlay = false;
    this.allowHeatmap = true;
  };

  return TlMapView;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'loading', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'defaultView', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class);
//# sourceMappingURL=tl-map-view.js.map
