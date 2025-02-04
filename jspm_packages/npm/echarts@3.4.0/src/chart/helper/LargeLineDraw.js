/* */ 
"format cjs";
define(function(require) {
  var graphic = require('../../util/graphic');
  var quadraticContain = require('zrender/contain/quadratic');
  var lineContain = require('zrender/contain/line');
  var LargeLineShape = graphic.extendShape({
    shape: {
      polyline: false,
      segs: []
    },
    buildPath: function(path, shape) {
      var segs = shape.segs;
      var isPolyline = shape.polyline;
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if (isPolyline) {
          path.moveTo(seg[0][0], seg[0][1]);
          for (var j = 1; j < seg.length; j++) {
            path.lineTo(seg[j][0], seg[j][1]);
          }
        } else {
          path.moveTo(seg[0][0], seg[0][1]);
          if (seg.length > 2) {
            path.quadraticCurveTo(seg[2][0], seg[2][1], seg[1][0], seg[1][1]);
          } else {
            path.lineTo(seg[1][0], seg[1][1]);
          }
        }
      }
    },
    findDataIndex: function(x, y) {
      var shape = this.shape;
      var segs = shape.segs;
      var isPolyline = shape.polyline;
      var lineWidth = Math.max(this.style.lineWidth, 1);
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if (isPolyline) {
          for (var j = 1; j < seg.length; j++) {
            if (lineContain.containStroke(seg[j - 1][0], seg[j - 1][1], seg[j][0], seg[j][1], lineWidth, x, y)) {
              return i;
            }
          }
        } else {
          if (seg.length > 2) {
            if (quadraticContain.containStroke(seg[0][0], seg[0][1], seg[2][0], seg[2][1], seg[1][0], seg[1][1], lineWidth, x, y)) {
              return i;
            }
          } else {
            if (lineContain.containStroke(seg[0][0], seg[0][1], seg[1][0], seg[1][1], lineWidth, x, y)) {
              return i;
            }
          }
        }
      }
      return -1;
    }
  });
  function LargeLineDraw() {
    this.group = new graphic.Group();
    this._lineEl = new LargeLineShape();
  }
  var largeLineProto = LargeLineDraw.prototype;
  largeLineProto.updateData = function(data) {
    this.group.removeAll();
    var lineEl = this._lineEl;
    var seriesModel = data.hostModel;
    lineEl.setShape({
      segs: data.mapArray(data.getItemLayout),
      polyline: seriesModel.get('polyline')
    });
    lineEl.useStyle(seriesModel.getModel('lineStyle.normal').getLineStyle());
    var visualColor = data.getVisual('color');
    if (visualColor) {
      lineEl.setStyle('stroke', visualColor);
    }
    lineEl.setStyle('fill');
    lineEl.seriesIndex = seriesModel.seriesIndex;
    lineEl.on('mousemove', function(e) {
      lineEl.dataIndex = null;
      var dataIndex = lineEl.findDataIndex(e.offsetX, e.offsetY);
      if (dataIndex > 0) {
        lineEl.dataIndex = dataIndex;
      }
    });
    this.group.add(lineEl);
  };
  largeLineProto.updateLayout = function(seriesModel) {
    var data = seriesModel.getData();
    this._lineEl.setShape({segs: data.mapArray(data.getItemLayout)});
  };
  largeLineProto.remove = function() {
    this.group.removeAll();
  };
  return LargeLineDraw;
});
