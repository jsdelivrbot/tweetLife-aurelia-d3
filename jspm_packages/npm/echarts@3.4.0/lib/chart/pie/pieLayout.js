/* */ 
var numberUtil = require('../../util/number');
var parsePercent = numberUtil.parsePercent;
var labelLayout = require('./labelLayout');
var zrUtil = require('zrender/lib/core/util');
var PI2 = Math.PI * 2;
var RADIAN = Math.PI / 180;
module.exports = function(seriesType, ecModel, api, payload) {
  ecModel.eachSeriesByType(seriesType, function(seriesModel) {
    var center = seriesModel.get('center');
    var radius = seriesModel.get('radius');
    if (!zrUtil.isArray(radius)) {
      radius = [0, radius];
    }
    if (!zrUtil.isArray(center)) {
      center = [center, center];
    }
    var width = api.getWidth();
    var height = api.getHeight();
    var size = Math.min(width, height);
    var cx = parsePercent(center[0], width);
    var cy = parsePercent(center[1], height);
    var r0 = parsePercent(radius[0], size / 2);
    var r = parsePercent(radius[1], size / 2);
    var data = seriesModel.getData();
    var startAngle = -seriesModel.get('startAngle') * RADIAN;
    var minAngle = seriesModel.get('minAngle') * RADIAN;
    var sum = data.getSum('value');
    var unitRadian = Math.PI / (sum || data.count()) * 2;
    var clockwise = seriesModel.get('clockwise');
    var roseType = seriesModel.get('roseType');
    var stillShowZeroSum = seriesModel.get('stillShowZeroSum');
    var extent = data.getDataExtent('value');
    extent[0] = 0;
    var restAngle = PI2;
    var valueSumLargerThanMinAngle = 0;
    var currentAngle = startAngle;
    var dir = clockwise ? 1 : -1;
    data.each('value', function(value, idx) {
      var angle;
      if (isNaN(value)) {
        data.setItemLayout(idx, {
          angle: NaN,
          startAngle: NaN,
          endAngle: NaN,
          clockwise: clockwise,
          cx: cx,
          cy: cy,
          r0: r0,
          r: roseType ? NaN : r
        });
        return;
      }
      if (roseType !== 'area') {
        angle = (sum === 0 && stillShowZeroSum) ? unitRadian : (value * unitRadian);
      } else {
        angle = PI2 / (data.count() || 1);
      }
      if (angle < minAngle) {
        angle = minAngle;
        restAngle -= minAngle;
      } else {
        valueSumLargerThanMinAngle += value;
      }
      var endAngle = currentAngle + dir * angle;
      data.setItemLayout(idx, {
        angle: angle,
        startAngle: currentAngle,
        endAngle: endAngle,
        clockwise: clockwise,
        cx: cx,
        cy: cy,
        r0: r0,
        r: roseType ? numberUtil.linearMap(value, extent, [r0, r]) : r
      });
      currentAngle = endAngle;
    }, true);
    if (restAngle < PI2) {
      if (restAngle <= 1e-3) {
        var angle = PI2 / data.count();
        data.each(function(idx) {
          var layout = data.getItemLayout(idx);
          layout.startAngle = startAngle + dir * idx * angle;
          layout.endAngle = startAngle + dir * (idx + 1) * angle;
        });
      } else {
        unitRadian = restAngle / valueSumLargerThanMinAngle;
        currentAngle = startAngle;
        data.each('value', function(value, idx) {
          var layout = data.getItemLayout(idx);
          var angle = layout.angle === minAngle ? minAngle : value * unitRadian;
          layout.startAngle = currentAngle;
          layout.endAngle = currentAngle + dir * angle;
          currentAngle += dir * angle;
        });
      }
    }
    labelLayout(seriesModel, r, width, height);
  });
};
