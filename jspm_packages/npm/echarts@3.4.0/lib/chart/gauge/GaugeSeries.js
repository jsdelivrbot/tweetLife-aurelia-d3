/* */ 
var List = require('../../data/List');
var SeriesModel = require('../../model/Series');
var zrUtil = require('zrender/lib/core/util');
var GaugeSeries = SeriesModel.extend({
  type: 'series.gauge',
  getInitialData: function(option, ecModel) {
    var list = new List(['value'], this);
    var dataOpt = option.data || [];
    if (!zrUtil.isArray(dataOpt)) {
      dataOpt = [dataOpt];
    }
    list.initData(dataOpt);
    return list;
  },
  defaultOption: {
    zlevel: 0,
    z: 2,
    center: ['50%', '50%'],
    legendHoverLink: true,
    radius: '75%',
    startAngle: 225,
    endAngle: -45,
    clockwise: true,
    min: 0,
    max: 100,
    splitNumber: 10,
    axisLine: {
      show: true,
      lineStyle: {
        color: [[0.2, '#91c7ae'], [0.8, '#63869e'], [1, '#c23531']],
        width: 30
      }
    },
    splitLine: {
      show: true,
      length: 30,
      lineStyle: {
        color: '#eee',
        width: 2,
        type: 'solid'
      }
    },
    axisTick: {
      show: true,
      splitNumber: 5,
      length: 8,
      lineStyle: {
        color: '#eee',
        width: 1,
        type: 'solid'
      }
    },
    axisLabel: {
      show: true,
      distance: 5,
      textStyle: {color: 'auto'}
    },
    pointer: {
      show: true,
      length: '80%',
      width: 8
    },
    itemStyle: {normal: {color: 'auto'}},
    title: {
      show: true,
      offsetCenter: [0, '-40%'],
      textStyle: {
        color: '#333',
        fontSize: 15
      }
    },
    detail: {
      show: true,
      backgroundColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      borderColor: '#ccc',
      width: 100,
      height: 40,
      offsetCenter: [0, '40%'],
      textStyle: {
        color: 'auto',
        fontSize: 30
      }
    }
  }
});
module.exports = GaugeSeries;
