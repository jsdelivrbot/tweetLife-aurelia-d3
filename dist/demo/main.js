'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.configure = configure;

require('bootstrap');

var _aureliaFramework = require('aurelia-framework');

var _route = require('./route');

function configure(aurelia) {
    var routesFactory = aurelia.container.get(_route.RoutesFactory);
    aurelia.use.standardConfiguration().developmentLogging().plugin('pg/htmlkit').plugin('pg/cbkit').plugin('aurelia-dialog', function (config) {
        config.useDefaults();
        config.settings.lock = true;
        config.settings.startingZIndex = 10001;
    }).feature('tweetlife', function (config) {
        if (config.routes) routesFactory.registerRoutes('tweetlife', config.routes);
    });

    aurelia.start().then(function () {
        return aurelia.setRoot();
    });
}
//# sourceMappingURL=main.js.map
