"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RoutesFactory = exports.RoutesFactory = function () {
    function RoutesFactory() {
        _classCallCheck(this, RoutesFactory);

        this.extra = {};
    }

    RoutesFactory.prototype.registerRoutes = function registerRoutes(pluginName, routesConfig) {
        var modulePrefix = pluginName + "/";
        for (var _iterator = Object.keys(routesConfig), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var routeName = _ref;

            var routeConf = routesConfig[routeName];
            routeConf.module = modulePrefix + routeConf.module;
            if (routeConf.toolbar) routeConf.toolbar = modulePrefix + routeConf.toolbar;
            this.extra[routeName] = routeConf;
        }
    };

    RoutesFactory.prototype.createAllowedRoutesList = function createAllowedRoutesList() {
        var routes = [];

        for (var _iterator2 = Object.keys(this.extra), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray2) {
                if (_i2 >= _iterator2.length) break;
                _ref2 = _iterator2[_i2++];
            } else {
                _i2 = _iterator2.next();
                if (_i2.done) break;
                _ref2 = _i2.value;
            }

            var name = _ref2;

            var routeConfig = this.extra[name];

            var r = this._createRoute(name, routeConfig);
            routes.push(r);
        }

        var defaultRoute = "#/tweetlife";

        routes.push({ route: '', redirect: defaultRoute });

        return routes;
    };

    RoutesFactory.prototype._createRoute = function _createRoute(routeName, routeConfig) {
        return {
            name: routeName,
            route: routeConfig.path,
            moduleId: routeConfig.module,
            params: routeConfig.params,
            toolbar: routeConfig.toolbar
        };
    };

    return RoutesFactory;
}();
//# sourceMappingURL=route.js.map
