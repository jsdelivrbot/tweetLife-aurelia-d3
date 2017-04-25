import { inject, customElement, bindable } from 'aurelia-framework'
import $ from 'jquery';
import wordcloud from 'wordcloud';
import * as d3 from 'd3';

@customElement('pg-wordcloud')
@inject(Element)
export class ChartElement {
    @bindable data;
    @bindable loading;
    @bindable options = {};

    _wordcloud;
    ColorInterval = 10;

    constructor(element) {
        this.element = element;
        this.scale = d3.scale.linear();
    }

    attached() {
        // workaround https://github.com/aurelia/templating/issues/400
        this._createOrUpdate();
        this._attached = true;
    }

    dataChanged() {
        this._createOrUpdate();
    }

    detached() {
        // console.log('wordcloud detached');
        this._wordcloud = undefined;
    }

    _resize() {

    }

    _createOrUpdate() {
        var that = this;

        this.wordsResult = [];
        if (this.data) {
            let large = this.data[0].value;
            let small = this.data[this.data.length-1].value
            this.scale.domain([small, large]).range([20, 60]);
            this.loading = false;
            this.data.forEach(function(item, idx) {
                that.wordsResult.push([item.key, that.scale(item.value)]);
            });
            //x => { return x / 10; },
            wordcloud($(this.element).find('.pg-wordcloud')[0], {
                list: this.wordsResult,
                // gridSize: 18,
                // weightFactor: x => { return x / 100; },
                fontFamily: 'Finger Paint, cursive, sans-serif',
                color: 'random-dark',
                hover: window.drawBox,
                click: function(item) {
                    // alert(item[0] + ': ' + item[1]);
                },
                shap: 'circle',
                // backgroundColor: '#001f00'
            });

        } else {
            this._wordcloud = undefined;

        }
    }

}