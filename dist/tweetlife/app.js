'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.App = undefined;

var _dec, _class;

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _aureliaFramework = require('aurelia-framework');

var _aureliaHttpClient = require('aurelia-http-client');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var App = exports.App = (_dec = (0, _aureliaFramework.inject)(_aureliaEventAggregator.EventAggregator), _dec(_class = function () {
    function App(EventAggregator) {
        var _this = this;

        _classCallCheck(this, App);

        this.defaultView = true;
        this.emptyIcon = '-';
        this.statusDataPlaceholder = [{ retweets: this.emptyIcon, reach: this.emptyIcon, maxDepth: this.emptyIcon, halfLife: this.emptyIcon, percent80Life: this.emptyIcon }];
        this.topRetweetersDataPlaceholder = [{ entity: { name: this.emptyIcon }, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon }, { entity: { name: this.emptyIcon }, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon }, { entity: { name: this.emptyIcon }, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon }, { entity: { name: this.emptyIcon }, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon }, { entity: { name: this.emptyIcon }, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon }];

        this.analyzeTweetlife = function () {
            var rootId = _jquery2.default.trim(_this.rootTweetId);
            _this.fetching = true;
            if (rootId && rootId.length > 0) {
                _this.loading = true;
                (0, _jquery2.default)('.actualRecord').addClass('hide');
                _this.eventAggregator.publish('triggerFetch');
                _this.defaultView = false;
                _this.retweeterList['Most engaging Retweeters'].defaultView = false;
                _this.retweeterList['Most active Retweeters'].defaultView = false;
                _this.retweeterList['Most followed Retweeters'].defaultView = false;
                _this.retweeterList['Most influential Retweeters'].defaultView = false;
                _this.retweeterList['Most engaging Retweeters'].loading = true;
                _this.retweeterList['Most active Retweeters'].loading = true;
                _this.retweeterList['Most followed Retweeters'].loading = true;
                _this.retweeterList['Most influential Retweeters'].loading = true;
                setTimeout(function () {
                    _this.server.createRequest('/api/os2-backend/tweetlife/' + rootId).withParams({ cache: false }).asGet().send().then(function (obj) {
                        _this.fetching = false;

                        var data = JSON.parse(obj.response);
                        if (data.code && data.code >= 400) {
                            _this.loading = false;
                            var errorCode = data.code;
                            var errorMsg = data.message;
                            (0, _jquery2.default)('.fetchErrorMsg').html('Error : ' + errorCode + ', ' + errorMsg);
                        } else {
                            _this.dataBack = true;
                            _this.loading = false;
                            (0, _jquery2.default)('.actualRecord').removeClass('hide');
                            _this.allData = data;

                            _this.rootTweetData = data.originTweet;
                            _this.tweetLifeEntityTree = data.tweetLifeEntityTree;
                            _this.statusData = data.tweetLifeStat;
                            _this.topRetweetersData = data.topRetweeterEntities;
                            _this.spreadTime = data.spreadTime;
                            _this.geoData = data.countryCodes;
                            _this.wordcloudData = data.bioKeywords;

                            _this.mostEngagedRetweeters = data.mostEngagedRetweeters;
                            _this.mostActiveRetweeters = data.mostActiveRetweeters;
                            _this.mostFollowedRetweeters = data.mostFollowedRetweeters;
                            _this.mostInfluenceRetweeters = data.mostInfluenceRetweeters;

                            _this.retweeterList['Most engaging Retweeters'].data = _this.mostEngagedRetweeters;
                            _this.retweeterList['Most active Retweeters'].data = _this.mostActiveRetweeters;
                            _this.retweeterList['Most followed Retweeters'].data = _this.mostFollowedRetweeters;
                            _this.retweeterList['Most influential Retweeters'].data = _this.mostInfluenceRetweeters;

                            _this.retweeterList['Most engaging Retweeters'].loading = false;
                            _this.retweeterList['Most active Retweeters'].loading = false;
                            _this.retweeterList['Most followed Retweeters'].loading = false;
                            _this.retweeterList['Most influential Retweeters'].loading = false;

                            _this.eventAggregator.publish('tweetlifeData', data);
                            _this.defaultView = false;
                        }
                    }).catch(function (error) {
                        console.log(error);
                        (0, _jquery2.default)('.fetchErrorMsg').html('error');
                    });
                }, 1000);
            } else {
                _this.dataBack = false;
                _this.loading = false;
                _this.statusData = _this.deepCopyData(_this.statusDataPlaceholder);
                _this.topRetweetersData = _this.deepCopyData(_this.topRetweetersDataPlaceholder);
                _this.eventAggregator.publish('noRootTweetId');
                _this.defaultView = true;
            }
        };

        this.deepCopyData = function (targetArr) {
            var resultArr = [];
            targetArr.forEach(function (obj) {
                var objNew = {};
                for (var key in obj) {
                    objNew[key] = obj[key];
                }
                resultArr.push(objNew);
            });
            return resultArr;
        };

        this.server = new _aureliaHttpClient.HttpClient();
        this.server.configure(function (config) {});
        this.eventAggregator = EventAggregator;
        this.dataBack = false;
        this.fetching = false;
        this.loading = false;

        this.rootTweetId = '831527113211645959';
        this.rootTweetData = {};
        this.tweetLifeEntityTree = {};
        this.statusData = this.deepCopyData(this.statusDataPlaceholder);
        this.topRetweetersData = this.deepCopyData(this.topRetweetersDataPlaceholder);

        this.cardPanelTitles = ['Stats', 'Top Retweeters who caused largest spread', 'Cumulative Retweet Count vs Time', 'Geographic analysis of retweeters by top profile country', 'Word Cloud from Retweeters Bio'];

        this.retweeterCardsNum = 5;
        this.dropdownTitle = 'Top 5';
        this.retweeterList = {
            'Most engaging Retweeters': {
                data: null,
                defaultView: true,
                loading: false
            },
            'Most active Retweeters': {
                data: null,
                defaultView: true,
                loading: false
            },
            'Most followed Retweeters': {
                data: null,
                defaultView: true,
                loading: false
            },
            'Most influential Retweeters': {
                data: null,
                defaultView: true,
                loading: false
            }
        };
    }

    App.prototype.attached = function attached() {};

    App.prototype.changeRetweeterTab = function changeRetweeterTab($event) {
        var tabTitle = $event.detail;
    };

    App.prototype.changeListNum = function changeListNum(number) {
        this.retweeterCardsNum = number;
        this.dropdownTitle = 'Top' + number;
    };

    return App;
}()) || _class);
//# sourceMappingURL=app.js.map
