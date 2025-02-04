/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var SeriesModel = require('../../model/Series');
  var List = require('../../data/List');
  var zrUtil = require('zrender/core/util');
  var formatUtil = require('../../util/format');
  var CoordinateSystem = require('../../CoordinateSystem');
  function preprocessOption(seriesOpt) {
    var data = seriesOpt.data;
    if (data && data[0] && data[0][0] && data[0][0].coord) {
      if (__DEV__) {
        console.warn('Lines data configuration has been changed to' + ' { coords:[[1,2],[2,3]] }');
      }
      seriesOpt.data = zrUtil.map(data, function(itemOpt) {
        var coords = [itemOpt[0].coord, itemOpt[1].coord];
        var target = {coords: coords};
        if (itemOpt[0].name) {
          target.fromName = itemOpt[0].name;
        }
        if (itemOpt[1].name) {
          target.toName = itemOpt[1].name;
        }
        return zrUtil.mergeAll([target, itemOpt[0], itemOpt[1]]);
      });
    }
  }
  var LinesSeries = SeriesModel.extend({
    type: 'series.lines',
    dependencies: ['grid', 'polar'],
    visualColorAccessPath: 'lineStyle.normal.color',
    init: function(option) {
      preprocessOption(option);
      LinesSeries.superApply(this, 'init', arguments);
    },
    mergeOption: function(option) {
      preprocessOption(option);
      LinesSeries.superApply(this, 'mergeOption', arguments);
    },
    getInitialData: function(option, ecModel) {
      if (__DEV__) {
        var CoordSys = CoordinateSystem.get(option.coordinateSystem);
        if (!CoordSys) {
          throw new Error('Unkown coordinate system ' + option.coordinateSystem);
        }
      }
      var lineData = new List(['value'], this);
      lineData.hasItemOption = false;
      lineData.initData(option.data, [], function(dataItem, dimName, dataIndex, dimIndex) {
        if (dataItem instanceof Array) {
          return NaN;
        } else {
          lineData.hasItemOption = true;
          var value = dataItem.value;
          if (value != null) {
            return value instanceof Array ? value[dimIndex] : value;
          }
        }
      });
      return lineData;
    },
    formatTooltip: function(dataIndex) {
      var data = this.getData();
      var itemModel = data.getItemModel(dataIndex);
      var name = itemModel.get('name');
      if (name) {
        return name;
      }
      var fromName = itemModel.get('fromName');
      var toName = itemModel.get('toName');
      var html = [];
      fromName != null && html.push(fromName);
      toName != null && html.push(toName);
      return formatUtil.encodeHTML(html.join(' > '));
    },
    defaultOption: {
      coordinateSystem: 'geo',
      zlevel: 0,
      z: 2,
      legendHoverLink: true,
      hoverAnimation: true,
      xAxisIndex: 0,
      yAxisIndex: 0,
      symbol: ['none', 'none'],
      symbolSize: [10, 10],
      geoIndex: 0,
      effect: {
        show: false,
        period: 4,
        constantSpeed: 0,
        symbol: 'circle',
        symbolSize: 3,
        loop: true,
        trailLength: 0.2
      },
      large: false,
      largeThreshold: 2000,
      polyline: false,
      label: {normal: {
          show: false,
          position: 'end'
        }},
      lineStyle: {normal: {opacity: 0.5}}
    }
  });
});
