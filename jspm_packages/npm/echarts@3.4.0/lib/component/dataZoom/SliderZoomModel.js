/* */ 
var DataZoomModel = require('./DataZoomModel');
var SliderZoomModel = DataZoomModel.extend({
  type: 'dataZoom.slider',
  layoutMode: 'box',
  defaultOption: {
    show: true,
    right: 'ph',
    top: 'ph',
    width: 'ph',
    height: 'ph',
    left: null,
    bottom: null,
    backgroundColor: 'rgba(47,69,84,0)',
    dataBackground: {
      lineStyle: {
        color: '#2f4554',
        width: 0.5,
        opacity: 0.3
      },
      areaStyle: {
        color: 'rgba(47,69,84,0.3)',
        opacity: 0.3
      }
    },
    borderColor: '#ddd',
    fillerColor: 'rgba(167,183,204,0.4)',
    handleIcon: 'M8.2,13.6V3.9H6.3v9.7H3.1v14.9h3.3v9.7h1.8v-9.7h3.3V13.6H8.2z M9.7,24.4H4.8v-1.4h4.9V24.4z M9.7,19.1H4.8v-1.4h4.9V19.1z',
    handleSize: '100%',
    handleStyle: {color: '#a7b7cc'},
    labelPrecision: null,
    labelFormatter: null,
    showDetail: true,
    showDataShadow: 'auto',
    realtime: true,
    zoomLock: false,
    textStyle: {color: '#333'}
  }
});
module.exports = SliderZoomModel;
