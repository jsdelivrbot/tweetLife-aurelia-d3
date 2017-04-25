import { bindable } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { RoutesFactory } from './route';
import { inject } from 'aurelia-framework';

@inject(RoutesFactory)
export class App {
    constructor(routesFactory) {
        this.routesFactory = routesFactory;
    }
        
    gotoSentiment() {
        this.router.navigate("tweetlife");
    }

    configureRouter(config, router) {
        let routes = this.routesFactory.createAllowedRoutesList();
        // console.log('Available routes', routes);
        config.map(routes);
        this.router = router;
    }
    
    
}