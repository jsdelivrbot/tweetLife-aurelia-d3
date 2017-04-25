import * as tweetlifeRoutes from "./routes";

function configure(config, configurationCallback) {
    config.globalResources([
        // '../components/box-wrap/box-wrap',
        // '../tweetlife/tl-card-list/tl-card-list',
        '../tweetlife/tl-linechart/tl-linechart',
        '../tweetlife/tl-spreadView/tl-spreadView',
        '../tweetlife/tl-expandable-tree/tl-expandable-tree',
        '../tweetlife/tl-map-view/tl-map-view',
        '../tweetlife/tl-timeline/tl-timeline',
        '../tweetlife/tl-wordcloud/tl-wordcloud',
        '../components/od-piechart/od-piechart'
    ]);
    configurationCallback({
        name: "tweetlife",
        routes: tweetlifeRoutes.ROUTES,
        l18n: true
    });
}
export {configure, tweetlifeRoutes};