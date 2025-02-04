/* */ 
'use strict';
var SeriesModel = require('../../model/Series');
var List = require('../../data/List');
var completeDimensions = require('../../data/helper/completeDimensions');
var zrUtil = require('zrender/lib/core/util');
var encodeHTML = require('../../util/format').encodeHTML;
var RadarSeries = SeriesModel.extend({
  type: 'series.radar',
  dependencies: ['radar'],
  init: function(option) {
    RadarSeries.superApply(this, 'init', arguments);
    this.legendDataProvider = function() {
      return this.getRawData();
    };
  },
  getInitialData: function(option, ecModel) {
    var data = option.data || [];
    var dimensions = completeDimensions([], data, [], 'indicator_');
    var list = new List(dimensions, this);
    list.initData(data);
    return list;
  },
  formatTooltip: function(dataIndex) {
    var value = this.getRawValue(dataIndex);
    var coordSys = this.coordinateSystem;
    var indicatorAxes = coordSys.getIndicatorAxes();
    var name = this.getData().getName(dataIndex);
    return encodeHTML(name === '' ? this.name : name) + '<br/>' + zrUtil.map(indicatorAxes, function(axis, idx) {
      return encodeHTML(axis.name + ' : ' + value[idx]);
    }).join('<br />');
  },
  defaultOption: {
    zlevel: 0,
    z: 2,
    coordinateSystem: 'radar',
    legendHoverLink: true,
    radarIndex: 0,
    lineStyle: {normal: {
        width: 2,
        type: 'solid'
      }},
    label: {normal: {position: 'top'}},
    symbol: 'emptyCircle',
    symbolSize: 4
  }
});
module.exports = RadarSeries;
