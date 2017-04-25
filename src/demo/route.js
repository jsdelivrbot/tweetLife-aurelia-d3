export class RoutesFactory {

    extra = {};

    registerRoutes(pluginName, routesConfig) {
        let modulePrefix = pluginName + "/";
        for (let routeName of Object.keys(routesConfig)) {
            let routeConf = routesConfig[routeName];
            routeConf.module = modulePrefix + routeConf.module;
            if (routeConf.toolbar) routeConf.toolbar = modulePrefix + routeConf.toolbar;
            this.extra[routeName] = routeConf;
        }
    }

    createAllowedRoutesList() {
        let routes = [];




        for (let name of Object.keys(this.extra)) {
            let routeConfig = this.extra[name];

            let r = this._createRoute(name, routeConfig);
            routes.push(r);

        }

        // TODO this is pretty tricky now
        let defaultRoute = "#/tweetlife";

        routes.push({ route: '', redirect: defaultRoute });

        return routes;

    }

    _createRoute(routeName, routeConfig) {
        return {
            name: routeName,
            route: routeConfig.path,
            moduleId: routeConfig.module,
            params: routeConfig.params,
            toolbar: routeConfig.toolbar
        }
    }




}