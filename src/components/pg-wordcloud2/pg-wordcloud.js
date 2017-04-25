import { inject, customElement, bindable } from 'aurelia-framework'
import $ from 'jquery';
import jqCloud from 'jqcloud2';

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
        console.log('wordcloud detached');
        this._wordcloud = undefined;
    }

    _createOrUpdate() {
        var that = this;

        this.wordsResult = [];
        if (this.data) {
            this.data.forEach(function(item, idx) {
                var className = 'cloudWord-' + idx % that.ColorInterval;
                that.wordsResult.push({
                    text: item.key,
                    weight: item.value,
                    handlers: {
                        click: function() {
                            window.open("https://twitter.com/search?q=" + item.key + "&src=typd");
                        }
                    }
                });
            });
            $(this.element).find('.pg-wordcloud').jQCloud(that.wordsResult, {
                autoResize: true,
                fontSize: {
                    from: 0.15,
                    to: 0.04
                }

            });


        } else {
            this._wordcloud = undefined;

        }
    }

}