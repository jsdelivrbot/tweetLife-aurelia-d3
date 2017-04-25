import { inject, customElement, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { computedFrom } from "aurelia-binding";
import moment from 'moment';
import $ from 'jquery';

@customElement('tl-spreadview')
@inject(EventAggregator)
export class TlSpreadView {
  allData;
  defaultView = true;
  tabs = {
    "Spread Pattern": {
      data: null,
      type: 'spread'
    },
    "Map View": {
      data: null,
      type: 'map'
    },
  };
  constructor(EventAggregator) {
    this.loading = false;
    this.eventAggregator = EventAggregator;
    this.eventAggregator.subscribe('tweetlifeData', (data) => {
      this.loading = false;
      this.allData = data;
      this.tabs["Spread Pattern"].data = data;
      this.tabs["Map View"].data = data;
      this.defaultView = false;
    })
    this.eventAggregator.subscribe('noRootTweetId', () => {
      this.defaultView = true;
    })
    this.eventAggregator.subscribe('triggerFetch', () => {
      this.loading = true;
      this.defaultView = false;
    })
  }

  attached() { }

  changeBetweenView($event) { };

  @computedFrom('allData')
  get originTweets() {
    if (this.allData && this.allData.originTweet) {
      return [this.allData.originTweet]
    } else {
      return [];
    }
  }

}
