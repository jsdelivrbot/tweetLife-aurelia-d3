/* */ 
"format cjs";
define(function(require) {
  var retrieve = require('zrender/core/util').retrieve;
  var parsePercent = require('../../util/number').parsePercent;
  return function(ecModel) {
    ecModel.eachSeriesByType('candlestick', function(seriesModel) {
      var coordSys = seriesModel.coordinateSystem;
      var data = seriesModel.getData();
      var dimensions = seriesModel.dimensions;
      var chartLayout = seriesModel.get('layout');
      var candleWidth = calculateCandleWidth(seriesModel, data);
      data.each(dimensions, function() {
        var args = arguments;
        var dimLen = dimensions.length;
        var axisDimVal = args[0];
        var idx = args[dimLen];
        var variableDim = chartLayout === 'horizontal' ? 0 : 1;
        var constDim = 1 - variableDim;
        var openVal = args[1];
        var closeVal = args[2];
        var lowestVal = args[3];
        var highestVal = args[4];
        var ocLow = Math.min(openVal, closeVal);
        var ocHigh = Math.max(openVal, closeVal);
        var ocLowPoint = getPoint(ocLow);
        var ocHighPoint = getPoint(ocHigh);
        var lowestPoint = getPoint(lowestVal);
        var highestPoint = getPoint(highestVal);
        var whiskerEnds = [[highestPoint, ocHighPoint], [lowestPoint, ocLowPoint]];
        var bodyEnds = [];
        addBodyEnd(ocHighPoint, 0);
        addBodyEnd(ocLowPoint, 1);
        data.setItemLayout(idx, {
          chartLayout: chartLayout,
          sign: openVal > closeVal ? -1 : openVal < closeVal ? 1 : 0,
          initBaseline: openVal > closeVal ? ocHighPoint[constDim] : ocLowPoint[constDim],
          bodyEnds: bodyEnds,
          whiskerEnds: whiskerEnds,
          brushRect: makeBrushRect()
        });
        function getPoint(val) {
          var p = [];
          p[variableDim] = axisDimVal;
          p[constDim] = val;
          return (isNaN(axisDimVal) || isNaN(val)) ? [NaN, NaN] : coordSys.dataToPoint(p);
        }
        function addBodyEnd(point, start) {
          var point1 = point.slice();
          var point2 = point.slice();
          point1[variableDim] += candleWidth / 2;
          point2[variableDim] -= candleWidth / 2;
          start ? bodyEnds.push(point1, point2) : bodyEnds.push(point2, point1);
        }
        function makeBrushRect() {
          var pmin = getPoint(Math.min(openVal, closeVal, lowestVal, highestVal));
          var pmax = getPoint(Math.max(openVal, closeVal, lowestVal, highestVal));
          pmin[variableDim] -= candleWidth / 2;
          pmax[variableDim] -= candleWidth / 2;
          return {
            x: pmin[0],
            y: pmin[1],
            width: constDim ? candleWidth : pmax[0] - pmin[0],
            height: constDim ? pmax[1] - pmin[1] : candleWidth
          };
        }
      }, true);
    });
  };
  function calculateCandleWidth(seriesModel, data) {
    var baseAxis = seriesModel.getBaseAxis();
    var extent;
    var bandWidth = baseAxis.type === 'category' ? baseAxis.getBandWidth() : (extent = baseAxis.getExtent(), Math.abs(extent[1] - extent[0]) / data.count());
    var barMaxWidth = parsePercent(retrieve(seriesModel.get('barMaxWidth'), bandWidth), bandWidth);
    var barMinWidth = parsePercent(retrieve(seriesModel.get('barMinWidth'), 1), bandWidth);
    var barWidth = seriesModel.get('barWidth');
    return barWidth != null ? parsePercent(barWidth, bandWidth) : Math.max(Math.min(bandWidth / 2, barMaxWidth), barMinWidth);
  }
});
