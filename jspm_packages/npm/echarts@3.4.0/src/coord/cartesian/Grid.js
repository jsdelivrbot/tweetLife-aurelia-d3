/* */ 
"format cjs";
(function(process) {
  define(function(require, factory) {
    var layout = require('../../util/layout');
    var axisHelper = require('../axisHelper');
    var zrUtil = require('zrender/core/util');
    var Cartesian2D = require('./Cartesian2D');
    var Axis2D = require('./Axis2D');
    var each = zrUtil.each;
    var ifAxisCrossZero = axisHelper.ifAxisCrossZero;
    var niceScaleExtent = axisHelper.niceScaleExtent;
    require('./GridModel');
    function isAxisUsedInTheGrid(axisModel, gridModel, ecModel) {
      return axisModel.getCoordSysModel() === gridModel;
    }
    function getLabelUnionRect(axis) {
      var axisModel = axis.model;
      var labels = axisModel.getFormattedLabels();
      var textStyleModel = axisModel.getModel('axisLabel.textStyle');
      var rect;
      var step = 1;
      var labelCount = labels.length;
      if (labelCount > 40) {
        step = Math.ceil(labelCount / 40);
      }
      for (var i = 0; i < labelCount; i += step) {
        if (!axis.isLabelIgnored(i)) {
          var singleRect = textStyleModel.getTextRect(labels[i]);
          rect ? rect.union(singleRect) : (rect = singleRect);
        }
      }
      return rect;
    }
    function Grid(gridModel, ecModel, api) {
      this._coordsMap = {};
      this._coordsList = [];
      this._axesMap = {};
      this._axesList = [];
      this._initCartesian(gridModel, ecModel, api);
      this._model = gridModel;
    }
    var gridProto = Grid.prototype;
    gridProto.type = 'grid';
    gridProto.getRect = function() {
      return this._rect;
    };
    gridProto.update = function(ecModel, api) {
      var axesMap = this._axesMap;
      this._updateScale(ecModel, this._model);
      function ifAxisCanNotOnZero(otherAxisDim) {
        var axes = axesMap[otherAxisDim];
        for (var idx in axes) {
          if (axes.hasOwnProperty(idx)) {
            var axis = axes[idx];
            if (axis && (axis.type === 'category' || !ifAxisCrossZero(axis))) {
              return true;
            }
          }
        }
        return false;
      }
      each(axesMap.x, function(xAxis) {
        niceScaleExtent(xAxis, xAxis.model);
      });
      each(axesMap.y, function(yAxis) {
        niceScaleExtent(yAxis, yAxis.model);
      });
      each(axesMap.x, function(xAxis) {
        if (ifAxisCanNotOnZero('y')) {
          xAxis.onZero = false;
        }
      });
      each(axesMap.y, function(yAxis) {
        if (ifAxisCanNotOnZero('x')) {
          yAxis.onZero = false;
        }
      });
      this.resize(this._model, api);
    };
    gridProto.resize = function(gridModel, api) {
      var gridRect = layout.getLayoutRect(gridModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      this._rect = gridRect;
      var axesList = this._axesList;
      adjustAxes();
      if (gridModel.get('containLabel')) {
        each(axesList, function(axis) {
          if (!axis.model.get('axisLabel.inside')) {
            var labelUnionRect = getLabelUnionRect(axis);
            if (labelUnionRect) {
              var dim = axis.isHorizontal() ? 'height' : 'width';
              var margin = axis.model.get('axisLabel.margin');
              gridRect[dim] -= labelUnionRect[dim] + margin;
              if (axis.position === 'top') {
                gridRect.y += labelUnionRect.height + margin;
              } else if (axis.position === 'left') {
                gridRect.x += labelUnionRect.width + margin;
              }
            }
          }
        });
        adjustAxes();
      }
      function adjustAxes() {
        each(axesList, function(axis) {
          var isHorizontal = axis.isHorizontal();
          var extent = isHorizontal ? [0, gridRect.width] : [0, gridRect.height];
          var idx = axis.inverse ? 1 : 0;
          axis.setExtent(extent[idx], extent[1 - idx]);
          updateAxisTransfrom(axis, isHorizontal ? gridRect.x : gridRect.y);
        });
      }
    };
    gridProto.getAxis = function(axisType, axisIndex) {
      var axesMapOnDim = this._axesMap[axisType];
      if (axesMapOnDim != null) {
        if (axisIndex == null) {
          for (var name in axesMapOnDim) {
            if (axesMapOnDim.hasOwnProperty(name)) {
              return axesMapOnDim[name];
            }
          }
        }
        return axesMapOnDim[axisIndex];
      }
    };
    gridProto.getCartesian = function(xAxisIndex, yAxisIndex) {
      if (xAxisIndex != null && yAxisIndex != null) {
        var key = 'x' + xAxisIndex + 'y' + yAxisIndex;
        return this._coordsMap[key];
      } else {
        for (var i = 0,
            coordList = this._coordsList; i < coordList.length; i++) {
          if (coordList[i].getAxis('x').index === xAxisIndex || coordList[i].getAxis('y').index === yAxisIndex) {
            return coordList[i];
          }
        }
      }
    };
    gridProto.convertToPixel = function(ecModel, finder, value) {
      var target = this._findConvertTarget(ecModel, finder);
      return target.cartesian ? target.cartesian.dataToPoint(value) : target.axis ? target.axis.toGlobalCoord(target.axis.dataToCoord(value)) : null;
    };
    gridProto.convertFromPixel = function(ecModel, finder, value) {
      var target = this._findConvertTarget(ecModel, finder);
      return target.cartesian ? target.cartesian.pointToData(value) : target.axis ? target.axis.coordToData(target.axis.toLocalCoord(value)) : null;
    };
    gridProto._findConvertTarget = function(ecModel, finder) {
      var seriesModel = finder.seriesModel;
      var xAxisModel = finder.xAxisModel || (seriesModel && seriesModel.getReferringComponents('xAxis')[0]);
      var yAxisModel = finder.yAxisModel || (seriesModel && seriesModel.getReferringComponents('yAxis')[0]);
      var gridModel = finder.gridModel;
      var coordsList = this._coordsList;
      var cartesian;
      var axis;
      if (seriesModel) {
        cartesian = seriesModel.coordinateSystem;
        zrUtil.indexOf(coordsList, cartesian) < 0 && (cartesian = null);
      } else if (xAxisModel && yAxisModel) {
        cartesian = this.getCartesian(xAxisModel.componentIndex, yAxisModel.componentIndex);
      } else if (xAxisModel) {
        axis = this.getAxis('x', xAxisModel.componentIndex);
      } else if (yAxisModel) {
        axis = this.getAxis('y', yAxisModel.componentIndex);
      } else if (gridModel) {
        var grid = gridModel.coordinateSystem;
        if (grid === this) {
          cartesian = this._coordsList[0];
        }
      }
      return {
        cartesian: cartesian,
        axis: axis
      };
    };
    gridProto.containPoint = function(point) {
      var coord = this._coordsList[0];
      if (coord) {
        return coord.containPoint(point);
      }
    };
    gridProto._initCartesian = function(gridModel, ecModel, api) {
      var axisPositionUsed = {
        left: false,
        right: false,
        top: false,
        bottom: false
      };
      var axesMap = {
        x: {},
        y: {}
      };
      var axesCount = {
        x: 0,
        y: 0
      };
      ecModel.eachComponent('xAxis', createAxisCreator('x'), this);
      ecModel.eachComponent('yAxis', createAxisCreator('y'), this);
      if (!axesCount.x || !axesCount.y) {
        this._axesMap = {};
        this._axesList = [];
        return;
      }
      this._axesMap = axesMap;
      each(axesMap.x, function(xAxis, xAxisIndex) {
        each(axesMap.y, function(yAxis, yAxisIndex) {
          var key = 'x' + xAxisIndex + 'y' + yAxisIndex;
          var cartesian = new Cartesian2D(key);
          cartesian.grid = this;
          this._coordsMap[key] = cartesian;
          this._coordsList.push(cartesian);
          cartesian.addAxis(xAxis);
          cartesian.addAxis(yAxis);
        }, this);
      }, this);
      function createAxisCreator(axisType) {
        return function(axisModel, idx) {
          if (!isAxisUsedInTheGrid(axisModel, gridModel, ecModel)) {
            return;
          }
          var axisPosition = axisModel.get('position');
          if (axisType === 'x') {
            if (axisPosition !== 'top' && axisPosition !== 'bottom') {
              axisPosition = 'bottom';
              if (axisPositionUsed[axisPosition]) {
                axisPosition = axisPosition === 'top' ? 'bottom' : 'top';
              }
            }
          } else {
            if (axisPosition !== 'left' && axisPosition !== 'right') {
              axisPosition = 'left';
              if (axisPositionUsed[axisPosition]) {
                axisPosition = axisPosition === 'left' ? 'right' : 'left';
              }
            }
          }
          axisPositionUsed[axisPosition] = true;
          var axis = new Axis2D(axisType, axisHelper.createScaleByModel(axisModel), [0, 0], axisModel.get('type'), axisPosition);
          var isCategory = axis.type === 'category';
          axis.onBand = isCategory && axisModel.get('boundaryGap');
          axis.inverse = axisModel.get('inverse');
          axis.onZero = axisModel.get('axisLine.onZero');
          axisModel.axis = axis;
          axis.model = axisModel;
          axis.grid = this;
          axis.index = idx;
          this._axesList.push(axis);
          axesMap[axisType][idx] = axis;
          axesCount[axisType]++;
        };
      }
    };
    gridProto._updateScale = function(ecModel, gridModel) {
      zrUtil.each(this._axesList, function(axis) {
        axis.scale.setExtent(Infinity, -Infinity);
      });
      ecModel.eachSeries(function(seriesModel) {
        if (isCartesian2D(seriesModel)) {
          var axesModels = findAxesModels(seriesModel, ecModel);
          var xAxisModel = axesModels[0];
          var yAxisModel = axesModels[1];
          if (!isAxisUsedInTheGrid(xAxisModel, gridModel, ecModel) || !isAxisUsedInTheGrid(yAxisModel, gridModel, ecModel)) {
            return;
          }
          var cartesian = this.getCartesian(xAxisModel.componentIndex, yAxisModel.componentIndex);
          var data = seriesModel.getData();
          var xAxis = cartesian.getAxis('x');
          var yAxis = cartesian.getAxis('y');
          if (data.type === 'list') {
            unionExtent(data, xAxis, seriesModel);
            unionExtent(data, yAxis, seriesModel);
          }
        }
      }, this);
      function unionExtent(data, axis, seriesModel) {
        each(seriesModel.coordDimToDataDim(axis.dim), function(dim) {
          axis.scale.unionExtentFromData(data, dim);
        });
      }
    };
    function updateAxisTransfrom(axis, coordBase) {
      var axisExtent = axis.getExtent();
      var axisExtentSum = axisExtent[0] + axisExtent[1];
      axis.toGlobalCoord = axis.dim === 'x' ? function(coord) {
        return coord + coordBase;
      } : function(coord) {
        return axisExtentSum - coord + coordBase;
      };
      axis.toLocalCoord = axis.dim === 'x' ? function(coord) {
        return coord - coordBase;
      } : function(coord) {
        return axisExtentSum - coord + coordBase;
      };
    }
    var axesTypes = ['xAxis', 'yAxis'];
    function findAxesModels(seriesModel, ecModel) {
      return zrUtil.map(axesTypes, function(axisType) {
        var axisModel = seriesModel.getReferringComponents(axisType)[0];
        if (__DEV__) {
          if (!axisModel) {
            throw new Error(axisType + ' "' + zrUtil.retrieve(seriesModel.get(axisType + 'Index'), seriesModel.get(axisType + 'Id'), 0) + '" not found');
          }
        }
        return axisModel;
      });
    }
    function isCartesian2D(seriesModel) {
      return seriesModel.get('coordinateSystem') === 'cartesian2d';
    }
    Grid.create = function(ecModel, api) {
      var grids = [];
      ecModel.eachComponent('grid', function(gridModel, idx) {
        var grid = new Grid(gridModel, ecModel, api);
        grid.name = 'grid_' + idx;
        grid.resize(gridModel, api);
        gridModel.coordinateSystem = grid;
        grids.push(grid);
      });
      ecModel.eachSeries(function(seriesModel) {
        if (!isCartesian2D(seriesModel)) {
          return;
        }
        var axesModels = findAxesModels(seriesModel, ecModel);
        var xAxisModel = axesModels[0];
        var yAxisModel = axesModels[1];
        var gridModel = xAxisModel.getCoordSysModel();
        if (__DEV__) {
          if (!gridModel) {
            throw new Error('Grid "' + zrUtil.retrieve(xAxisModel.get('gridIndex'), xAxisModel.get('gridId'), 0) + '" not found');
          }
          if (xAxisModel.getCoordSysModel() !== yAxisModel.getCoordSysModel()) {
            throw new Error('xAxis and yAxis must use the same grid');
          }
        }
        var grid = gridModel.coordinateSystem;
        seriesModel.coordinateSystem = grid.getCartesian(xAxisModel.componentIndex, yAxisModel.componentIndex);
      });
      return grids;
    };
    Grid.dimensions = Cartesian2D.prototype.dimensions;
    require('../../CoordinateSystem').register('cartesian2d', Grid);
    return Grid;
  });
})(require('process'));
