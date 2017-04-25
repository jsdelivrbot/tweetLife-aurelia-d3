'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.tweetlifeRoutes = exports.configure = undefined;

var _routes = require('./routes');

var tweetlifeRoutes = _interopRequireWildcard(_routes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function configure(config, configurationCallback) {
    config.globalResources(['../tweetlife/tl-linechart/tl-linechart', '../tweetlife/tl-spreadView/tl-spreadView', '../tweetlife/tl-expandable-tree/tl-expandable-tree', '../tweetlife/tl-map-view/tl-map-view', '../tweetlife/tl-timeline/tl-timeline', '../tweetlife/tl-wordcloud/tl-wordcloud', '../components/od-piechart/od-piechart']);
    configurationCallback({
        name: "tweetlife",
        routes: tweetlifeRoutes.ROUTES,
        l18n: true
    });
}
exports.configure = configure;
exports.tweetlifeRoutes = tweetlifeRoutes;
//# sourceMappingURL=index.js.map
