import 'bootstrap';
import { Aurelia } from 'aurelia-framework';
import { RoutesFactory } from './route';

export function configure(aurelia) {
    let routesFactory = aurelia.container.get(RoutesFactory);
    aurelia.use
        .standardConfiguration()
        .developmentLogging()
        .plugin('pg/htmlkit')
        .plugin('pg/cbkit')
        .plugin('aurelia-dialog', config => {
            config.useDefaults();
            config.settings.lock = true;
            config.settings.startingZIndex = 10001;
        })
        .feature('tweetlife', config => {
            // console.log("Register feature: ", config.name || name, config);
            if (config.routes)
                routesFactory.registerRoutes('tweetlife', config.routes);

        });

    // Uncomment the line below to enable animation.
    // aurelia.use.plugin('aurelia-animator-css');

    // Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
    // aurelia.use.plugin('aurelia-html-import-template-loader')

    aurelia.start().then(() => aurelia.setRoot());
}