/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var SingleAxis = require('./SingleAxis');
    var axisHelper = require('../axisHelper');
    var layout = require('../../util/layout');
    function Single(axisModel, ecModel, api) {
      this.dimension = 'single';
      this.dimensions = ['single'];
      this._axis = null;
      this._rect;
      this._init(axisModel, ecModel, api);
      this._model = axisModel;
    }
    Single.prototype = {
      type: 'singleAxis',
      constructor: Single,
      _init: function(axisModel, ecModel, api) {
        var dim = this.dimension;
        var axis = new SingleAxis(dim, axisHelper.createScaleByModel(axisModel), [0, 0], axisModel.get('type'), axisModel.get('position'));
        var isCategory = axis.type === 'category';
        axis.onBand = isCategory && axisModel.get('boundaryGap');
        axis.inverse = axisModel.get('inverse');
        axis.orient = axisModel.get('orient');
        axisModel.axis = axis;
        axis.model = axisModel;
        this._axis = axis;
      },
      update: function(ecModel, api) {
        ecModel.eachSeries(function(seriesModel) {
          if (seriesModel.coordinateSystem === this) {
            var data = seriesModel.getData();
            var dim = this.dimension;
            this._axis.scale.unionExtentFromData(data, seriesModel.coordDimToDataDim(dim));
            axisHelper.niceScaleExtent(this._axis, this._axis.model);
          }
        }, this);
      },
      resize: function(axisModel, api) {
        this._rect = layout.getLayoutRect({
          left: axisModel.get('left'),
          top: axisModel.get('top'),
          right: axisModel.get('right'),
          bottom: axisModel.get('bottom'),
          width: axisModel.get('width'),
          height: axisModel.get('height')
        }, {
          width: api.getWidth(),
          height: api.getHeight()
        });
        this._adjustAxis();
      },
      getRect: function() {
        return this._rect;
      },
      _adjustAxis: function() {
        var rect = this._rect;
        var axis = this._axis;
        var isHorizontal = axis.isHorizontal();
        var extent = isHorizontal ? [0, rect.width] : [0, rect.height];
        var idx = axis.reverse ? 1 : 0;
        axis.setExtent(extent[idx], extent[1 - idx]);
        this._updateAxisTransform(axis, isHorizontal ? rect.x : rect.y);
      },
      _updateAxisTransform: function(axis, coordBase) {
        var axisExtent = axis.getExtent();
        var extentSum = axisExtent[0] + axisExtent[1];
        var isHorizontal = axis.isHorizontal();
        axis.toGlobalCoord = isHorizontal ? function(coord) {
          return coord + coordBase;
        } : function(coord) {
          return extentSum - coord + coordBase;
        };
        axis.toLocalCoord = isHorizontal ? function(coord) {
          return coord - coordBase;
        } : function(coord) {
          return extentSum - coord + coordBase;
        };
      },
      getAxis: function() {
        return this._axis;
      },
      getBaseAxis: function() {
        return this._axis;
      },
      containPoint: function(point) {
        var rect = this.getRect();
        var axis = this.getAxis();
        var orient = axis.orient;
        if (orient === 'horizontal') {
          return axis.contain(axis.toLocalCoord(point[0])) && (point[1] >= rect.y && point[1] <= (rect.y + rect.height));
        } else {
          return axis.contain(axis.toLocalCoord(point[1])) && (point[0] >= rect.y && point[0] <= (rect.y + rect.height));
        }
      },
      pointToData: function(point) {
        var axis = this.getAxis();
        return [axis.coordToData(axis.toLocalCoord(point[axis.orient === 'horizontal' ? 0 : 1]))];
      },
      dataToPoint: function(val) {
        var axis = this.getAxis();
        var rect = this.getRect();
        var pt = [];
        var idx = axis.orient === 'horizontal' ? 0 : 1;
        pt[idx] = axis.toGlobalCoord(axis.dataToCoord(+val));
        pt[1 - idx] = idx === 0 ? (rect.y + rect.height / 2) : (rect.x + rect.width / 2);
        return pt;
      }
    };
    return Single;
  });
})(require('process'));
