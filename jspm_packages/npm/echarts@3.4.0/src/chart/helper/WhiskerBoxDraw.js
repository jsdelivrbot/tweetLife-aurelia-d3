/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var graphic = require('../../util/graphic');
  var Path = require('zrender/graphic/Path');
  var WhiskerPath = Path.extend({
    type: 'whiskerInBox',
    shape: {},
    buildPath: function(ctx, shape) {
      for (var i in shape) {
        if (shape.hasOwnProperty(i) && i.indexOf('ends') === 0) {
          var pts = shape[i];
          ctx.moveTo(pts[0][0], pts[0][1]);
          ctx.lineTo(pts[1][0], pts[1][1]);
        }
      }
    }
  });
  function WhiskerBox(data, idx, styleUpdater, isInit) {
    graphic.Group.call(this);
    this.bodyIndex;
    this.whiskerIndex;
    this.styleUpdater = styleUpdater;
    this._createContent(data, idx, isInit);
    this.updateData(data, idx, isInit);
    this._seriesModel;
  }
  var whiskerBoxProto = WhiskerBox.prototype;
  whiskerBoxProto._createContent = function(data, idx, isInit) {
    var itemLayout = data.getItemLayout(idx);
    var constDim = itemLayout.chartLayout === 'horizontal' ? 1 : 0;
    var count = 0;
    this.add(new graphic.Polygon({
      shape: {points: isInit ? transInit(itemLayout.bodyEnds, constDim, itemLayout) : itemLayout.bodyEnds},
      style: {strokeNoScale: true},
      z2: 100
    }));
    this.bodyIndex = count++;
    var whiskerEnds = zrUtil.map(itemLayout.whiskerEnds, function(ends) {
      return isInit ? transInit(ends, constDim, itemLayout) : ends;
    });
    this.add(new WhiskerPath({
      shape: makeWhiskerEndsShape(whiskerEnds),
      style: {strokeNoScale: true},
      z2: 100
    }));
    this.whiskerIndex = count++;
  };
  function transInit(points, dim, itemLayout) {
    return zrUtil.map(points, function(point) {
      point = point.slice();
      point[dim] = itemLayout.initBaseline;
      return point;
    });
  }
  function makeWhiskerEndsShape(whiskerEnds) {
    var shape = {};
    zrUtil.each(whiskerEnds, function(ends, i) {
      shape['ends' + i] = ends;
    });
    return shape;
  }
  whiskerBoxProto.updateData = function(data, idx, isInit) {
    var seriesModel = this._seriesModel = data.hostModel;
    var itemLayout = data.getItemLayout(idx);
    var updateMethod = graphic[isInit ? 'initProps' : 'updateProps'];
    updateMethod(this.childAt(this.bodyIndex), {shape: {points: itemLayout.bodyEnds}}, seriesModel, idx);
    updateMethod(this.childAt(this.whiskerIndex), {shape: makeWhiskerEndsShape(itemLayout.whiskerEnds)}, seriesModel, idx);
    this.styleUpdater.call(null, this, data, idx);
  };
  zrUtil.inherits(WhiskerBox, graphic.Group);
  function WhiskerBoxDraw(styleUpdater) {
    this.group = new graphic.Group();
    this.styleUpdater = styleUpdater;
  }
  var whiskerBoxDrawProto = WhiskerBoxDraw.prototype;
  whiskerBoxDrawProto.updateData = function(data) {
    var group = this.group;
    var oldData = this._data;
    var styleUpdater = this.styleUpdater;
    data.diff(oldData).add(function(newIdx) {
      if (data.hasValue(newIdx)) {
        var symbolEl = new WhiskerBox(data, newIdx, styleUpdater, true);
        data.setItemGraphicEl(newIdx, symbolEl);
        group.add(symbolEl);
      }
    }).update(function(newIdx, oldIdx) {
      var symbolEl = oldData.getItemGraphicEl(oldIdx);
      if (!data.hasValue(newIdx)) {
        group.remove(symbolEl);
        return;
      }
      if (!symbolEl) {
        symbolEl = new WhiskerBox(data, newIdx, styleUpdater);
      } else {
        symbolEl.updateData(data, newIdx);
      }
      group.add(symbolEl);
      data.setItemGraphicEl(newIdx, symbolEl);
    }).remove(function(oldIdx) {
      var el = oldData.getItemGraphicEl(oldIdx);
      el && group.remove(el);
    }).execute();
    this._data = data;
  };
  whiskerBoxDrawProto.remove = function() {
    var group = this.group;
    var data = this._data;
    this._data = null;
    data && data.eachItemGraphicEl(function(el) {
      el && group.remove(el);
    });
  };
  return WhiskerBoxDraw;
});
