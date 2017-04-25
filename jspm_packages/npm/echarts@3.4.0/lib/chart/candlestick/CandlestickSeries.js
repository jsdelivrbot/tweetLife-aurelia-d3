/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var SeriesModel = require('../../model/Series');
var whiskerBoxCommon = require('../helper/whiskerBoxCommon');
var formatUtil = require('../../util/format');
var encodeHTML = formatUtil.encodeHTML;
var addCommas = formatUtil.addCommas;
var CandlestickSeries = SeriesModel.extend({
  type: 'series.candlestick',
  dependencies: ['xAxis', 'yAxis', 'grid'],
  valueDimensions: ['open', 'close', 'lowest', 'highest'],
  dimensions: null,
  defaultOption: {
    zlevel: 0,
    z: 2,
    coordinateSystem: 'cartesian2d',
    legendHoverLink: true,
    hoverAnimation: true,
    layout: null,
    itemStyle: {
      normal: {
        color: '#c23531',
        color0: '#314656',
        borderWidth: 1,
        borderColor: '#c23531',
        borderColor0: '#314656'
      },
      emphasis: {borderWidth: 2}
    },
    barMaxWidth: null,
    barMinWidth: null,
    barWidth: null,
    animationUpdate: false,
    animationEasing: 'linear',
    animationDuration: 300
  },
  getShadowDim: function() {
    return 'open';
  },
  formatTooltip: function(dataIndex, mutipleSeries) {
    var valueHTML = zrUtil.map(this.valueDimensions, function(dim) {
      return encodeHTML(dim + ': ' + addCommas(this.getData().get(dim, dataIndex)));
    }, this).join('<br />');
    var html = [];
    this.name != null && html.push(encodeHTML(this.name));
    valueHTML != null && html.push(valueHTML);
    return html.join('<br />');
  },
  brushSelector: function(itemLayout, selectors) {
    return selectors.rect(itemLayout.brushRect);
  }
});
zrUtil.mixin(CandlestickSeries, whiskerBoxCommon.seriesModelMixin, true);
module.exports = CandlestickSeries;
