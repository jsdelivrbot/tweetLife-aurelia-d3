import { inject, customElement, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import countries from './countries';
import _ from 'lodash';

@customElement('od-piechart')
@inject(EventAggregator)
export class OdPieChart {
    @bindable data;
    @bindable defaultView;
    loading = false;

    constructor(EventAggregator) {
        // piechart config options
        this.options = {
            tooltip: {
                trigger: 'item',
                formatter: "{b} : {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                left: '70%',
                top: 'center',
                align:'left',
                itemGap: 5,
                itemWidth: 20,
                itemHeight: 20,
                data: []
            },
            series: [
                {
                    name: 'Retweeters',
                    type: 'pie',
                    radius: ['0','80%'],
                    center: ['35%', '50%'],
                    data: [],
                    label: {
                        normal: {
                            show: false,
                            position: 'inner'
                        },
                        emphasis: {
                            show: false ,
                            // textStyle: {
                            //     fontSize: '30',
                            //     fontWeight: 'bold'
                            // }
                        }
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ],
            color:['#69a5b6','#61b8c6','#5ccad2', '#6dd1c8','#7dd8bf','#95e1bb', '#afe9b6','#c7f1b3','#dff9af', '#f3ffac']
        };
        
        this.eventAggregator = EventAggregator;
        this.eventAggregator.subscribe('triggerFetch', () => {
 
            this.loading = true;
        })
        this.eventAggregator.subscribe('tweetlifeData', (data) => {
            this.loading = false;
            this.geoData = data.countryCodes;
            // control data number
            if(this.geoData && (this.geoData.length > 10) ) {
                this.geoData = this.geoData.slice(0, 10);
            }
            let [result, countryNames] = this.generateData(this.geoData);
            this.options.legend.data = countryNames
            this.options.series[0].data = result;
            this.data = result;
        })
        this.eventAggregator.subscribe('noRootTweetId', () => {

            this.loading = false;
        })
        
    }

    attached() {}

    generateData(data) {
        let result = [];
        let countryNamesArr = [];

        result = _.map(data, (datum) => {
            let countryObj = _.find(countries, function(country) {
                return country.cca2 == datum.key.toUpperCase() || country['cca3'] == datum.key.toUpperCase();
            });
            let countryName = '';
            if(datum.key == 'unknown') {
                countryNamesArr.push('unknown');
                countryName = 'unknown'
            }
            else {
                countryNamesArr.push(countryObj.name.common || datum.key);
                countryName = countryObj.name.common || datum.key;
            }
            
            return { name: countryName, value: datum.value }
        });

        return [result, countryNamesArr];
    };

}
