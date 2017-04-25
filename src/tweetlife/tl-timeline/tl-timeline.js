import { inject, customElement, bindable } from 'aurelia-framework';
import _ from 'lodash';
import { moment } from 'pg/htmlkit'

@customElement('tl-timeline')
@inject(Element)
export class TlTimeLine {
  @bindable data;
  @bindable showDatazoom = true;
  @bindable totalBrushTime = 2000;
  loading = false;
  element;

  _attached = false;
  _brushing = false;
  _brushIndex = 0;
  _chartBrushInterval;
  _datazoomParams = {}; //cache the datazoom params

  constructor(element) {
    this.defaultView = true;
    this.options = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        }
      },
      toolbox: {
        show: false
      },
      grid: {
        left: 0,
        right: 10,
        top: 20,
        containLabel: true
      },
      brush: {
        xAxisIndex: 'all',
        brushLink: 'all',
        // brushType:'lineY',
        outOfBrush: {
          colorAlpha: 0.3
        },
        brushStyle: {
          color: 'rgba(120,140,180,0.1)',
          borderColor: 'rgba(120,140,180,0.3)',
        },
        inBrunsh: {
          color: 'red',
          colorAlpha: 1
        }
      },
      xAxis: [
        {
          type: 'category',
          axisLine: {
            lineStyle: {
              color: '#cdcdcd',
              width: 1
            }
          },
          axisLabel: {
            show: true,
            textStyle: {
              color: '#000',
              fontSize: 10
            }
          },
          data: [],
          scale: true,
          boundaryGap: true,
          axisTick: { alignWithLabel: true },
          splitNumber: 20,
          min: 'dataMin',
          max: 'dataMax'
        }
        // ,{
        //             type: 'category',
        //             gridIndex: 1,
        //             data: [],
        //             scale: true,
        //             boundaryGap : 24,
        //             axisLine: {onZero: false},
        //             axisTick: {show: false},
        //             splitLine: {show: false},
        //             axisLabel: {show: false},
        //             splitNumber: 20,
        //             min: 'dataMin',
        //             max: 'dataMax'
        //         }
      ],
      yAxis: [
        {
          scale: true,
          splitLine: { show: false },
          axisLine: {
            onZero: true,
            lineStyle: {
              color: '#cdcdcd',
              width: 1
            }
          },
          axisLabel: {
            textStyle: {
              color: '#000',
              fontSize: 10
            }
          }
        }
      ],
      dataZoom: [
        {
          show: false,
          xAxisIndex: [0],
          type: 'slider',
          top: '65%',
          start: 0,
          end: 100,
          realtime: false,
          dataBackground: {
            lineStyle: {
              color: 'rgba(89,200,211,1)'
            },
            areaStyle: {
              color: 'rgba(89,200,211,0.5)'
            }
          },
          handleStyle: {
            color: '#FFFFFF',
            borderColor: '#59c8d3'
          },
          backgroundColor: '#FFFFFF',
          fillerColor: 'rgba(89,200,211,0.5)'
        }
      ],
      series: [
        {
          name: 'Twitters',
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            normal: {
              color: '#a6dfe6'
            }
          },
          data: []
        }
      ]
    };
    this.element = element;
  }

  attached() {
    this.options.dataZoom[0].show = this.showDatazoom;
  }
  detached() {
    clearInterval(this._chartBrushInterval);
  }

  dataChanged() {
    this.defaultView = false;
    let timeArr = [], valueArr = []
    this.data.forEach((obj) => { timeArr.push(obj.key); valueArr.push(obj.value); })
    this.options.series[0].data = valueArr;
    this.options.xAxis[0].data = timeArr;
    // todo: add timeline xAxis label data
  }

  playTimeline() {
    this._startBrush();
  }

  resetTimeline() {
    this._brushIndex = 0;
    this._brushing = false;
    clearInterval(this._chartBrushInterval);
    this.echart.dispatchDatazoom({ show: this.showDatazoom  });
    this._brushChart(0, 0);
  }

  pauseTimeline() {
    this._brushing = false;
    clearInterval(this._chartBrushInterval);
  }

  _startBrush(start) {
    if (!this._brushing && this.data && this.data.length) {
      const length = this.data.length;
      this._brushing = true;
      this.echart.dispatchDatazoom({ show: false });
      this._chartBrushInterval = setInterval(() => {
        this._brushChart(0, this._brushIndex);
        this._brushIndex++;
        if (this._brushIndex > length) {
          this._brushing = false;
          this.echart.dispatchDatazoom({ show: this.showDatazoom });
          this._brushChart(0, this._brushIndex - 1);
          clearInterval(this._chartBrushInterval);
          this._brushIndex = 0;

          // dispatch when play is finished
          this.element.dispatchEvent(new CustomEvent('play-done', {
            detail: {},
            bubbles: true
          }));
        }
      }, this.totalBrushTime / this.data.length);

    }
  }

  _brushChart(start, end) {
    const chart = this.echart.getChart();
    chart.dispatchAction({
      type: 'brush',
      areas: [{
        brushType: 'lineX',
        xAxisIndex: 0,
        coordRange: [start - 1, end ? end : -1]
      }]
    });
    let startObj = this.data[start];
    let endObj = this.data[end];
    //the brush stop at the center of the bar ,so the last will move more one just for view.
    if (end < this.data.length) {
      this.element.dispatchEvent(new CustomEvent('data-brush', {
        detail: {
          startIndex: start,
          endIndex: end,
          startItem: startObj,
          endItem: endObj
        },
        bubbles: true
      }));
    }

  }

  datazoom(params) {
    // let {rangeStart, rangeEnd} = params;
    // if (this.data && this.data.length) {
    //     rangeStart = rangeStart || 0;
    //     rangeEnd = rangeEnd || this.data.length - 1;
    // }
    // this._datazoomParams = _.assignIn(this._datazoomParams, params, { rangeStart, rangeEnd });

    this.element.dispatchEvent(
      new CustomEvent('data-range-change', { detail: params, bubbles: true })
    );
  }
}
