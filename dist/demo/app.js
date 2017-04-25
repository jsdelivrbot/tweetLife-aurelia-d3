'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.App = undefined;

var _dec, _class;

var _aureliaFramework = require('aurelia-framework');

var _aureliaRouter = require('aurelia-router');

var _route = require('./route');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var App = exports.App = (_dec = (0, _aureliaFramework.inject)(_route.RoutesFactory), _dec(_class = function () {
    function App(routesFactory) {
        _classCallCheck(this, App);

        this.routesFactory = routesFactory;
    }

    App.prototype.gotoSentiment = function gotoSentiment() {
        this.router.navigate("tweetlife");
    };

    App.prototype.configureRouter = function configureRouter(config, router) {
        var routes = this.routesFactory.createAllowedRoutesList();

        config.map(routes);
        this.router = router;
    };

    return App;
}()) || _class);
//# sourceMappingURL=app.js.map
