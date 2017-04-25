import { inject, customElement, bindable } from 'aurelia-framework'
import _ from "lodash";
import $ from 'jquery';
import echarts from "echarts";
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
const DEBOUNC_TIME = 300;
@customElement('echart')
@inject(Element)
export class ChartElement {
    @bindable data;
    @bindable loading;
    @bindable options = {};

    _datazoomParams;
    _chart;
    _attached = false;

    _debounceResize = _.debounce(this._resize, DEBOUNC_TIME);

    constructor(element) {
        this.element = element;
    }

    attached() {
        // workaround https://github.com/aurelia/templating/issues/400
        this._createOrUpdate();
        this._attached = true;
    }

    dataChanged() {
        if (this._attached) {
            this._createOrUpdate();
        }
    }

    detached() {
        if (this._chart) {
            this._chart = undefined;
        }
        this._attached = false;
    }

    _createOrUpdate() {
        if (this.data) {
            if (!this._chart) {
                this._chart = echarts.init($(this.element).find('.pg-echart')[0]);
                new ResizeSensor(this.element, () => {
                    this._debounceResize(this._chart)
                });
                this._chart.on('click', params => {
                    this._clickChart(params);
                });
                this._chart.on('datazoom', params => {
                    this._datazoom()
                });
                // this._chart.on('brushselected', params => {
                //    console.log(params)
                // });
            }
            this._chart.setOption(this.options, true);
            // $(window).resize(() => { this._chart.resize(); });
            // detect dom resize, see: https://github.com/marcj/css-element-queries
            // new ResizeSensor(this.element, () => {
            //     console.log(this,'resize')
            //     this._chart && this._chart.resize();
            // });

        } else {
            if (this._chart) {
                //this._chart.destroy();
                this._chart = undefined;
            }
        }
    }

    _resize(chart) {
        if (chart) {
            chart.resize();
        }
    }
    _clickChart(params) {
        this.element.dispatchEvent(new CustomEvent('chartclick', {
            detail: params, bubbles: true
        })
        );
    }
    _datazoom(chartElement) {
        const xAxis = this._chart.getOption().xAxis[0];
        let startValue, endValue;
        if (xAxis && xAxis.data && xAxis.data.length) {
            startValue = xAxis.data[xAxis.rangeStart || 0];
            endValue = xAxis.data[xAxis.rangeEnd || xAxis.data.length - 1];
        }

        const params = { 
            startValue: startValue, 
            endValue: endValue,
            startIndex:xAxis.rangeStart,
            endIndex:xAxis.rangeEnd 
        };
        if (!_.isEqual(params, this.element._datazoomParams)) {
            this.element._datazoomParams = params;//cache the last datazoom params
            this.element.dispatchEvent(new CustomEvent('datazoom', {
                detail: params, bubbles: true
            })
            );
        }

    }
    getChart(){
        return this._chart;
    }
    dispatchDatazoom(params) {
        if (this._chart) {
            // this._chart.dispatchAction(_.assignIn({ type: 'dataZoom' }), params);
            this.options.dataZoom[0] = _.assignIn(this.options.dataZoom[0],params)
            this._createOrUpdate();
        }
    }
}