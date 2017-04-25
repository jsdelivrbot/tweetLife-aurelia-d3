/* */ 
var PictorialBarSeries = require('./BaseBarSeries').extend({
  type: 'series.pictorialBar',
  dependencies: ['grid'],
  defaultOption: {
    symbol: 'circle',
    symbolSize: null,
    symbolRotate: null,
    symbolPosition: null,
    symbolOffset: null,
    symbolMargin: null,
    symbolRepeat: false,
    symbolRepeatDirection: 'end',
    symbolClip: false,
    symbolBoundingData: null,
    symbolPatternSize: 400,
    barGap: '-100%',
    progressive: 0,
    hoverAnimation: false
  },
  getInitialData: function(option) {
    option.stack = null;
    return PictorialBarSeries.superApply(this, 'getInitialData', arguments);
  }
});
module.exports = PictorialBarSeries;
