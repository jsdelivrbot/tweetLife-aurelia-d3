import { inject, customElement, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import moment from 'moment';
import _ from 'lodash';

@customElement('tl-linechart')
@inject(EventAggregator)
export class TlLineChart {
    @bindable defaultView = true;
    loading = false;
    lineData;

    constructor(EventAggregator) {
        // linechart config options
        this.options = {
            title: {
                text: ''    
            },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    params = params[0];
                    return params.name + ' : ' + params.data;
                },
                axisPointer: {
                    animation: false
                }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                splitLine: {
                    show: false
                },
                axisLine: {
                    lineStyle: {
                        color: '#cdcdcd',
                        width: 2
                    }
                },
                axisLabel: {
                    textStyle: {
                        color: '#000',
                        fontSize: 10
                    }
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#cdcdcd',
                        width: 2
                    }
                },
                axisLabel: {
                    textStyle: {
                        color: '#000',
                        fontSize: 10
                    }
                },
                // boundaryGap: [0, '20%'],
                // min: 0,
                // max: 100,
                splitLine: {
                    show: false
                }
            },
            series: [{
                type: 'line',
                smooth: true,
                // sampling: 'average',
                // showSymbol: false,
                // hoverAnimation: false,
                data: []
            }]
        };

        this.eventAggregator = EventAggregator;
        this.eventAggregator.subscribe('triggerFetch', () => {
            this.loading = true;
        })
        this.eventAggregator.subscribe('tweetlifeData', (dataCol) => {
            this.loading = false;
            this.lineData = dataCol.spreadTime;

            // set xAxis count
            let newData = [], yIdx = [], gapNum = 7, totalCounts = this.lineData.length;
            let timeStart = moment(this.lineData[1]).format('ddd, h:mm A');
            let timeEnd = moment(this.lineData[this.lineData.length - 1]).format('ddd, h:mm A');
            newData.push(timeStart)
            yIdx.push(1)

            let incrs = Math.floor(totalCounts/gapNum);
            for(let i = 0; i < gapNum-1; i++) {
                let dataIdx = +incrs * i + parseInt(Math.random() * incrs);
                dataIdx = (dataIdx >= (totalCounts-1)) ? (dataIdx - 10) : dataIdx;
                let timeStamp = this.lineData[dataIdx];
                let timeValue = moment(timeStamp).format('ddd, h:mm A')
                newData.push(timeValue)
                yIdx.push(dataIdx)
            }
            
            newData.push(timeEnd)
            yIdx.push(totalCounts-1)
            
            this.options.series[0].data = yIdx;
            this.options.xAxis.data = newData
        })
        this.eventAggregator.subscribe('noRootTweetId', () => {
            this.loading = false;
        })
        
    }

    attached() {}

    timeConverter(time, unit) {
        let result = '', number = '', finalUnit = '';
        switch(unit) {
            case 'min': 
                if(time > 60) {
                    time = time / 60; // to hour
                    this.timeConverter(time, 'hr')
                }
                else {
                    result = Math.ceil(time) + ' min';
                    number = Math.ceil(time);
                    finalUnit = 'min';
                    break;
                }
            case 'hr': 
                if(time > 24) {
                    time = time / 24; // to day
                    this.timeConverter(time, 'day')
                }
                else {
                    result = Math.ceil(time) + ' hr';
                    number = Math.ceil(time);
                    finalUnit = 'hr';
                    break;
                }
            case 'day': 
                if(time > 7) {
                    time = time / 7; // to week
                    this.timeConverter(time, 'wk')
                }
                else {
                    result = Math.ceil(time) + ' day';
                    number = Math.ceil(time);
                    finalUnit = 'day';
                    break;
                }
            case 'wk': 
                if(time > 5) {
                    time = time / 5; // to month
                    this.timeConverter(time, 'month')
                }
                else {
                    result = Math.ceil(time) + ' wk';
                    number = Math.ceil(time);
                    finalUnit = 'wk';
                    break;
                }
            case 'month': 
                if(time > 12) {
                    time = time / 60; // to year
                    this.timeConverter(time, 'year')
                }
                else {
                    result = Math.ceil(time) + ' month';
                    number = Math.ceil(time);
                    finalUnit = 'month';
                    break;
                }
            case 'year': 
                result = Math.ceil(time) + ' year';
                    number = Math.ceil(time);
                    finalUnit = 'year';
                break;
            
        }

        return { result: result, number: number, unit: finalUnit };
    }

}
