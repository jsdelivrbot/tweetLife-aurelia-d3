import { inject, customElement, bindable, containerless } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import _ from "lodash";
import * as d3 from 'd3';

@customElement('tl-wordcloud')
@containerless
@inject(EventAggregator)
export class TlWordcloud {
    @bindable data;
    @bindable defaultView;

    wordTotalNum = 30;
    loading = false
    
    constructor(EventAggregator) {
        this.eventAggregator = EventAggregator;
        this.eventAggregator.subscribe('triggerFetch', () => {
            this.loading = true;
        })
        this.eventAggregator.subscribe('tweetlifeData', (data) => {
            this.loading = false;
            this.wordCloudData = data.bioKeywords;

            // control data number
            if( this.wordCloudData && (this.wordCloudData.length > this.wordTotalNum)) {
                this.wordCloudData = this.wordCloudData.splice(0, this.wordTotalNum);
            }
        })
        this.eventAggregator.subscribe('noRootTweetId', () => {
            this.loading = false;
        })
        
    }

    attached() {}
}
