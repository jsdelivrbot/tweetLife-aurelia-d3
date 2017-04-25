import $ from 'jquery';
import {inject} from 'aurelia-framework'
import {HttpClient} from 'aurelia-http-client';
import {EventAggregator} from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class App {
    defaultView = true;
    emptyIcon = '-';
    statusDataPlaceholder = [
        {retweets: this.emptyIcon, reach: this.emptyIcon, maxDepth: this.emptyIcon, halfLife: this.emptyIcon, percent80Life: this.emptyIcon}
    ];
    topRetweetersDataPlaceholder = [
        {entity: {name: this.emptyIcon}, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon},
        {entity: {name: this.emptyIcon}, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon},
        {entity: {name: this.emptyIcon}, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon},
        {entity: {name: this.emptyIcon}, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon},
        {entity: {name: this.emptyIcon}, spread: this.emptyIcon, reach: this.emptyIcon, time: this.emptyIcon, level: this.emptyIcon}
    ]

    constructor(EventAggregator) {
        this.server = new HttpClient();
        this.server.configure(config => {
        //   config.useStandardConfiguration();//add cookie to request header
        });
        this.eventAggregator = EventAggregator;
        this.dataBack = false;
        this.fetching = false;
        this.loading = false;

        this.rootTweetId = '831527113211645959'
        this.rootTweetData = {}
        this.tweetLifeEntityTree = {};
        this.statusData = this.deepCopyData(this.statusDataPlaceholder)
        this.topRetweetersData = this.deepCopyData(this.topRetweetersDataPlaceholder)

        this.cardPanelTitles = [
            'Stats',
            'Top Retweeters who caused largest spread',
            'Cumulative Retweet Count vs Time',
            'Geographic analysis of retweeters by top profile country',
            'Word Cloud from Retweeters Bio'
        ];

        this.retweeterCardsNum = 5;
        this.dropdownTitle = 'Top 5';
        this.retweeterList = {
            'Most engaging Retweeters': {
                data:null,
                defaultView:true,
                loading:false
            },
            'Most active Retweeters': {
                data: null,
                defaultView:true,
                loading:false
            },
            'Most followed Retweeters': {
                data: null,
                defaultView:true,
                loading:false
            },
            'Most influential Retweeters': {
                data: null,
                defaultView:true,
                loading:false
            }
        }

    }

    attached() {}

    analyzeTweetlife = () => {
        let rootId = $.trim(this.rootTweetId);
        this.fetching = true;
        if(rootId && rootId.length > 0) {
            // loading
            this.loading = true;
            $('.actualRecord').addClass('hide');
            this.eventAggregator.publish('triggerFetch');
            this.defaultView = false;
            this.retweeterList['Most engaging Retweeters'].defaultView = false;
            this.retweeterList['Most active Retweeters'].defaultView = false;
            this.retweeterList['Most followed Retweeters'].defaultView = false;
            this.retweeterList['Most influential Retweeters'].defaultView = false;
            this.retweeterList['Most engaging Retweeters'].loading = true;
            this.retweeterList['Most active Retweeters'].loading = true;
            this.retweeterList['Most followed Retweeters'].loading = true;
            this.retweeterList['Most influential Retweeters'].loading = true;
            setTimeout(() => {
                this.server.createRequest('/api/os2-backend/tweetlife/' + rootId)
                    .withParams({cache: false})
                    .asGet()
                    .send()
                    // .then(response => {return response.json()})
                    .then(obj => {
                        this.fetching = false;
                        // console.log(obj.response)
                        // console.log(JSON.parse(obj.response))
                        let data = JSON.parse(obj.response);
                        if(data.code && data.code >= 400) {
                            // this.dataBack = true;
                            this.loading = false;
                            let errorCode = data.code;
                            let errorMsg = data.message;
                            $('.fetchErrorMsg').html('Error : ' + errorCode + ', ' + errorMsg)
                        }
                        else {
                            this.dataBack = true;
                            this.loading = false;
                            $('.actualRecord').removeClass('hide');
                            this.allData = data;
                            // set model for all the charts
                            this.rootTweetData = data.originTweet;
                            this.tweetLifeEntityTree = data.tweetLifeEntityTree;
                            this.statusData = data.tweetLifeStat;
                            this.topRetweetersData = data.topRetweeterEntities;
                            this.spreadTime = data.spreadTime;
                            this.geoData = data.countryCodes;
                            this.wordcloudData = data.bioKeywords;
                            // btm list
                            this.mostEngagedRetweeters = data.mostEngagedRetweeters;
                            this.mostActiveRetweeters = data.mostActiveRetweeters;
                            this.mostFollowedRetweeters = data.mostFollowedRetweeters;
                            this.mostInfluenceRetweeters = data.mostInfluenceRetweeters;

                            this.retweeterList['Most engaging Retweeters'].data = this.mostEngagedRetweeters;
                            this.retweeterList['Most active Retweeters'].data = this.mostActiveRetweeters;
                            this.retweeterList['Most followed Retweeters'].data = this.mostFollowedRetweeters;
                            this.retweeterList['Most influential Retweeters'].data = this.mostInfluenceRetweeters;

                            this.retweeterList['Most engaging Retweeters'].loading = false;
                            this.retweeterList['Most active Retweeters'].loading = false;
                            this.retweeterList['Most followed Retweeters'].loading = false;
                            this.retweeterList['Most influential Retweeters'].loading = false;

                            this.eventAggregator.publish('tweetlifeData', data);
                            this.defaultView = false;
                        }
                        
                    })
                    .catch(error => {
                        // alert('api error')
                        console.log(error)
                        $('.fetchErrorMsg').html('error')
                    }) 
            }, 1000)

        }
        else {
            // reset all forms
            this.dataBack = false;
            this.loading = false;
            this.statusData = this.deepCopyData(this.statusDataPlaceholder)
            this.topRetweetersData = this.deepCopyData(this.topRetweetersDataPlaceholder)
            this.eventAggregator.publish('noRootTweetId');
            this.defaultView = true;
        }
        
    }

    changeRetweeterTab($event) {
        let tabTitle = $event.detail;
        // if(this.allData) this.eventAggregator.publish('tweetlifeData', this.allData);
    }

    deepCopyData = (targetArr) => {
        let resultArr = [];
        targetArr.forEach((obj) => {
            let objNew = {};
            for(let key in obj) {
                objNew[key] = obj[key];
            }
            resultArr.push(objNew);
        })
        return resultArr;
    }


    changeListNum(number) {
        this.retweeterCardsNum = number;
        this.dropdownTitle = 'Top' + number;
    }


}
