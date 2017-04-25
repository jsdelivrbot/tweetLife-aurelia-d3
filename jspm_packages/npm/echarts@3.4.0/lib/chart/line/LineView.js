/* */ 
'use strict';
var zrUtil = require('zrender/lib/core/util');
var SymbolDraw = require('../helper/SymbolDraw');
var Symbol = require('../helper/Symbol');
var lineAnimationDiff = require('./lineAnimationDiff');
var graphic = require('../../util/graphic');
var modelUtil = require('../../util/model');
var polyHelper = require('./poly');
var ChartView = require('../../view/Chart');
function isPointsSame(points1, points2) {
  if (points1.length !== points2.length) {
    return;
  }
  for (var i = 0; i < points1.length; i++) {
    var p1 = points1[i];
    var p2 = points2[i];
    if (p1[0] !== p2[0] || p1[1] !== p2[1]) {
      return;
    }
  }
  return true;
}
function getSmooth(smooth) {
  return typeof(smooth) === 'number' ? smooth : (smooth ? 0.3 : 0);
}
function getAxisExtentWithGap(axis) {
  var extent = axis.getGlobalExtent();
  if (axis.onBand) {
    var halfBandWidth = axis.getBandWidth() / 2 - 1;
    var dir = extent[1] > extent[0] ? 1 : -1;
    extent[0] += dir * halfBandWidth;
    extent[1] -= dir * halfBandWidth;
  }
  return extent;
}
function sign(val) {
  return val >= 0 ? 1 : -1;
}
function getStackedOnPoints(coordSys, data) {
  var baseAxis = coordSys.getBaseAxis();
  var valueAxis = coordSys.getOtherAxis(baseAxis);
  var valueStart = baseAxis.onZero ? 0 : valueAxis.scale.getExtent()[0];
  var valueDim = valueAxis.dim;
  var baseDataOffset = valueDim === 'x' || valueDim === 'radius' ? 1 : 0;
  return data.mapArray([valueDim], function(val, idx) {
    var stackedOnSameSign;
    var stackedOn = data.stackedOn;
    while (stackedOn && sign(stackedOn.get(valueDim, idx)) === sign(val)) {
      stackedOnSameSign = stackedOn;
      break;
    }
    var stackedData = [];
    stackedData[baseDataOffset] = data.get(baseAxis.dim, idx);
    stackedData[1 - baseDataOffset] = stackedOnSameSign ? stackedOnSameSign.get(valueDim, idx, true) : valueStart;
    return coordSys.dataToPoint(stackedData);
  }, true);
}
function createGridClipShape(cartesian, hasAnimation, seriesModel) {
  var xExtent = getAxisExtentWithGap(cartesian.getAxis('x'));
  var yExtent = getAxisExtentWithGap(cartesian.getAxis('y'));
  var isHorizontal = cartesian.getBaseAxis().isHorizontal();
  var x = Math.min(xExtent[0], xExtent[1]);
  var y = Math.min(yExtent[0], yExtent[1]);
  var width = Math.max(xExtent[0], xExtent[1]) - x;
  var height = Math.max(yExtent[0], yExtent[1]) - y;
  var lineWidth = seriesModel.get('lineStyle.normal.width') || 2;
  var expandSize = seriesModel.get('clipOverflow') ? lineWidth / 2 : Math.max(width, height);
  if (isHorizontal) {
    y -= expandSize;
    height += expandSize * 2;
  } else {
    x -= expandSize;
    width += expandSize * 2;
  }
  var clipPath = new graphic.Rect({shape: {
      x: x,
      y: y,
      width: width,
      height: height
    }});
  if (hasAnimation) {
    clipPath.shape[isHorizontal ? 'width' : 'height'] = 0;
    graphic.initProps(clipPath, {shape: {
        width: width,
        height: height
      }}, seriesModel);
  }
  return clipPath;
}
function createPolarClipShape(polar, hasAnimation, seriesModel) {
  var angleAxis = polar.getAngleAxis();
  var radiusAxis = polar.getRadiusAxis();
  var radiusExtent = radiusAxis.getExtent();
  var angleExtent = angleAxis.getExtent();
  var RADIAN = Math.PI / 180;
  var clipPath = new graphic.Sector({shape: {
      cx: polar.cx,
      cy: polar.cy,
      r0: radiusExtent[0],
      r: radiusExtent[1],
      startAngle: -angleExtent[0] * RADIAN,
      endAngle: -angleExtent[1] * RADIAN,
      clockwise: angleAxis.inverse
    }});
  if (hasAnimation) {
    clipPath.shape.endAngle = -angleExtent[0] * RADIAN;
    graphic.initProps(clipPath, {shape: {endAngle: -angleExtent[1] * RADIAN}}, seriesModel);
  }
  return clipPath;
}
function createClipShape(coordSys, hasAnimation, seriesModel) {
  return coordSys.type === 'polar' ? createPolarClipShape(coordSys, hasAnimation, seriesModel) : createGridClipShape(coordSys, hasAnimation, seriesModel);
}
function turnPointsIntoStep(points, coordSys, stepTurnAt) {
  var baseAxis = coordSys.getBaseAxis();
  var baseIndex = baseAxis.dim === 'x' || baseAxis.dim === 'radius' ? 0 : 1;
  var stepPoints = [];
  for (var i = 0; i < points.length - 1; i++) {
    var nextPt = points[i + 1];
    var pt = points[i];
    stepPoints.push(pt);
    var stepPt = [];
    switch (stepTurnAt) {
      case 'end':
        stepPt[baseIndex] = nextPt[baseIndex];
        stepPt[1 - baseIndex] = pt[1 - baseIndex];
        stepPoints.push(stepPt);
        break;
      case 'middle':
        var middle = (pt[baseIndex] + nextPt[baseIndex]) / 2;
        var stepPt2 = [];
        stepPt[baseIndex] = stepPt2[baseIndex] = middle;
        stepPt[1 - baseIndex] = pt[1 - baseIndex];
        stepPt2[1 - baseIndex] = nextPt[1 - baseIndex];
        stepPoints.push(stepPt);
        stepPoints.push(stepPt2);
        break;
      default:
        stepPt[baseIndex] = pt[baseIndex];
        stepPt[1 - baseIndex] = nextPt[1 - baseIndex];
        stepPoints.push(stepPt);
    }
  }
  points[i] && stepPoints.push(points[i]);
  return stepPoints;
}
function getVisualGradient(data, coordSys) {
  var visualMetaList = data.getVisual('visualMeta');
  if (!visualMetaList || !visualMetaList.length || !data.count()) {
    return;
  }
  var visualMeta;
  for (var i = visualMetaList.length - 1; i >= 0; i--) {
    if (visualMetaList[i].dimension < 2) {
      visualMeta = visualMetaList[i];
      break;
    }
  }
  if (!visualMeta || coordSys.type !== 'cartesian2d') {
    if (__DEV__) {
      console.warn('Visual map on line style only support x or y dimension.');
    }
    return;
  }
  var dimension = visualMeta.dimension;
  var dimName = data.dimensions[dimension];
  var axis = coordSys.getAxis(dimName);
  var colorStops = zrUtil.map(visualMeta.stops, function(stop) {
    return {
      coord: axis.toGlobalCoord(axis.dataToCoord(stop.value)),
      color: stop.color
    };
  });
  var stopLen = colorStops.length;
  var outerColors = visualMeta.outerColors.slice();
  if (stopLen && colorStops[0].coord > colorStops[stopLen - 1].coord) {
    colorStops.reverse();
    outerColors.reverse();
  }
  var tinyExtent = 10;
  var minCoord = colorStops[0].coord - tinyExtent;
  var maxCoord = colorStops[stopLen - 1].coord + tinyExtent;
  var coordSpan = maxCoord - minCoord;
  if (coordSpan < 1e-3) {
    return 'transparent';
  }
  zrUtil.each(colorStops, function(stop) {
    stop.offset = (stop.coord - minCoord) / coordSpan;
  });
  colorStops.push({
    offset: stopLen ? colorStops[stopLen - 1].offset : 0.5,
    color: outerColors[1] || 'transparent'
  });
  colorStops.unshift({
    offset: stopLen ? colorStops[0].offset : 0.5,
    color: outerColors[0] || 'transparent'
  });
  var gradient = new graphic.LinearGradient(0, 0, 0, 0, colorStops, true);
  gradient[dimName] = minCoord;
  gradient[dimName + '2'] = maxCoord;
  return gradient;
}
module.exports = ChartView.extend({
  type: 'line',
  init: function() {
    var lineGroup = new graphic.Group();
    var symbolDraw = new SymbolDraw();
    this.group.add(symbolDraw.group);
    this._symbolDraw = symbolDraw;
    this._lineGroup = lineGroup;
  },
  render: function(seriesModel, ecModel, api) {
    var coordSys = seriesModel.coordinateSystem;
    var group = this.group;
    var data = seriesModel.getData();
    var lineStyleModel = seriesModel.getModel('lineStyle.normal');
    var areaStyleModel = seriesModel.getModel('areaStyle.normal');
    var points = data.mapArray(data.getItemLayout, true);
    var isCoordSysPolar = coordSys.type === 'polar';
    var prevCoordSys = this._coordSys;
    var symbolDraw = this._symbolDraw;
    var polyline = this._polyline;
    var polygon = this._polygon;
    var lineGroup = this._lineGroup;
    var hasAnimation = seriesModel.get('animation');
    var isAreaChart = !areaStyleModel.isEmpty();
    var stackedOnPoints = getStackedOnPoints(coordSys, data);
    var showSymbol = seriesModel.get('showSymbol');
    var isSymbolIgnore = showSymbol && !isCoordSysPolar && !seriesModel.get('showAllSymbol') && this._getSymbolIgnoreFunc(data, coordSys);
    var oldData = this._data;
    oldData && oldData.eachItemGraphicEl(function(el, idx) {
      if (el.__temp) {
        group.remove(el);
        oldData.setItemGraphicEl(idx, null);
      }
    });
    if (!showSymbol) {
      symbolDraw.remove();
    }
    group.add(lineGroup);
    var step = !isCoordSysPolar && seriesModel.get('step');
    if (!(polyline && prevCoordSys.type === coordSys.type && step === this._step)) {
      showSymbol && symbolDraw.updateData(data, isSymbolIgnore);
      if (step) {
        points = turnPointsIntoStep(points, coordSys, step);
        stackedOnPoints = turnPointsIntoStep(stackedOnPoints, coordSys, step);
      }
      polyline = this._newPolyline(points, coordSys, hasAnimation);
      if (isAreaChart) {
        polygon = this._newPolygon(points, stackedOnPoints, coordSys, hasAnimation);
      }
      lineGroup.setClipPath(createClipShape(coordSys, true, seriesModel));
    } else {
      if (isAreaChart && !polygon) {
        polygon = this._newPolygon(points, stackedOnPoints, coordSys, hasAnimation);
      } else if (polygon && !isAreaChart) {
        lineGroup.remove(polygon);
        polygon = this._polygon = null;
      }
      lineGroup.setClipPath(createClipShape(coordSys, false, seriesModel));
      showSymbol && symbolDraw.updateData(data, isSymbolIgnore);
      data.eachItemGraphicEl(function(el) {
        el.stopAnimation(true);
      });
      if (!isPointsSame(this._stackedOnPoints, stackedOnPoints) || !isPointsSame(this._points, points)) {
        if (hasAnimation) {
          this._updateAnimation(data, stackedOnPoints, coordSys, api, step);
        } else {
          if (step) {
            points = turnPointsIntoStep(points, coordSys, step);
            stackedOnPoints = turnPointsIntoStep(stackedOnPoints, coordSys, step);
          }
          polyline.setShape({points: points});
          polygon && polygon.setShape({
            points: points,
            stackedOnPoints: stackedOnPoints
          });
        }
      }
    }
    var visualColor = getVisualGradient(data, coordSys) || data.getVisual('color');
    polyline.useStyle(zrUtil.defaults(lineStyleModel.getLineStyle(), {
      fill: 'none',
      stroke: visualColor,
      lineJoin: 'bevel'
    }));
    var smooth = seriesModel.get('smooth');
    smooth = getSmooth(seriesModel.get('smooth'));
    polyline.setShape({
      smooth: smooth,
      smoothMonotone: seriesModel.get('smoothMonotone'),
      connectNulls: seriesModel.get('connectNulls')
    });
    if (polygon) {
      var stackedOn = data.stackedOn;
      var stackedOnSmooth = 0;
      polygon.useStyle(zrUtil.defaults(areaStyleModel.getAreaStyle(), {
        fill: visualColor,
        opacity: 0.7,
        lineJoin: 'bevel'
      }));
      if (stackedOn) {
        var stackedOnSeries = stackedOn.hostModel;
        stackedOnSmooth = getSmooth(stackedOnSeries.get('smooth'));
      }
      polygon.setShape({
        smooth: smooth,
        stackedOnSmooth: stackedOnSmooth,
        smoothMonotone: seriesModel.get('smoothMonotone'),
        connectNulls: seriesModel.get('connectNulls')
      });
    }
    this._data = data;
    this._coordSys = coordSys;
    this._stackedOnPoints = stackedOnPoints;
    this._points = points;
    this._step = step;
  },
  dispose: function() {},
  highlight: function(seriesModel, ecModel, api, payload) {
    var data = seriesModel.getData();
    var dataIndex = modelUtil.queryDataIndex(data, payload);
    if (!(dataIndex instanceof Array) && dataIndex != null && dataIndex >= 0) {
      var symbol = data.getItemGraphicEl(dataIndex);
      if (!symbol) {
        var pt = data.getItemLayout(dataIndex);
        if (!pt) {
          return;
        }
        symbol = new Symbol(data, dataIndex);
        symbol.position = pt;
        symbol.setZ(seriesModel.get('zlevel'), seriesModel.get('z'));
        symbol.ignore = isNaN(pt[0]) || isNaN(pt[1]);
        symbol.__temp = true;
        data.setItemGraphicEl(dataIndex, symbol);
        symbol.stopSymbolAnimation(true);
        this.group.add(symbol);
      }
      symbol.highlight();
    } else {
      ChartView.prototype.highlight.call(this, seriesModel, ecModel, api, payload);
    }
  },
  downplay: function(seriesModel, ecModel, api, payload) {
    var data = seriesModel.getData();
    var dataIndex = modelUtil.queryDataIndex(data, payload);
    if (dataIndex != null && dataIndex >= 0) {
      var symbol = data.getItemGraphicEl(dataIndex);
      if (symbol) {
        if (symbol.__temp) {
          data.setItemGraphicEl(dataIndex, null);
          this.group.remove(symbol);
        } else {
          symbol.downplay();
        }
      }
    } else {
      ChartView.prototype.downplay.call(this, seriesModel, ecModel, api, payload);
    }
  },
  _newPolyline: function(points) {
    var polyline = this._polyline;
    if (polyline) {
      this._lineGroup.remove(polyline);
    }
    polyline = new polyHelper.Polyline({
      shape: {points: points},
      silent: true,
      z2: 10
    });
    this._lineGroup.add(polyline);
    this._polyline = polyline;
    return polyline;
  },
  _newPolygon: function(points, stackedOnPoints) {
    var polygon = this._polygon;
    if (polygon) {
      this._lineGroup.remove(polygon);
    }
    polygon = new polyHelper.Polygon({
      shape: {
        points: points,
        stackedOnPoints: stackedOnPoints
      },
      silent: true
    });
    this._lineGroup.add(polygon);
    this._polygon = polygon;
    return polygon;
  },
  _getSymbolIgnoreFunc: function(data, coordSys) {
    var categoryAxis = coordSys.getAxesByScale('ordinal')[0];
    if (categoryAxis && categoryAxis.isLabelIgnored) {
      return zrUtil.bind(categoryAxis.isLabelIgnored, categoryAxis);
    }
  },
  _updateAnimation: function(data, stackedOnPoints, coordSys, api, step) {
    var polyline = this._polyline;
    var polygon = this._polygon;
    var seriesModel = data.hostModel;
    var diff = lineAnimationDiff(this._data, data, this._stackedOnPoints, stackedOnPoints, this._coordSys, coordSys);
    var current = diff.current;
    var stackedOnCurrent = diff.stackedOnCurrent;
    var next = diff.next;
    var stackedOnNext = diff.stackedOnNext;
    if (step) {
      current = turnPointsIntoStep(diff.current, coordSys, step);
      stackedOnCurrent = turnPointsIntoStep(diff.stackedOnCurrent, coordSys, step);
      next = turnPointsIntoStep(diff.next, coordSys, step);
      stackedOnNext = turnPointsIntoStep(diff.stackedOnNext, coordSys, step);
    }
    polyline.shape.__points = diff.current;
    polyline.shape.points = current;
    graphic.updateProps(polyline, {shape: {points: next}}, seriesModel);
    if (polygon) {
      polygon.setShape({
        points: current,
        stackedOnPoints: stackedOnCurrent
      });
      graphic.updateProps(polygon, {shape: {
          points: next,
          stackedOnPoints: stackedOnNext
        }}, seriesModel);
    }
    var updatedDataInfo = [];
    var diffStatus = diff.status;
    for (var i = 0; i < diffStatus.length; i++) {
      var cmd = diffStatus[i].cmd;
      if (cmd === '=') {
        var el = data.getItemGraphicEl(diffStatus[i].idx1);
        if (el) {
          updatedDataInfo.push({
            el: el,
            ptIdx: i
          });
        }
      }
    }
    if (polyline.animators && polyline.animators.length) {
      polyline.animators[0].during(function() {
        for (var i = 0; i < updatedDataInfo.length; i++) {
          var el = updatedDataInfo[i].el;
          el.attr('position', polyline.shape.__points[updatedDataInfo[i].ptIdx]);
        }
      });
    }
  },
  remove: function(ecModel) {
    var group = this.group;
    var oldData = this._data;
    this._lineGroup.removeAll();
    this._symbolDraw.remove(true);
    oldData && oldData.eachItemGraphicEl(function(el, idx) {
      if (el.__temp) {
        group.remove(el);
        oldData.setItemGraphicEl(idx, null);
      }
    });
    this._polyline = this._polygon = this._coordSys = this._points = this._stackedOnPoints = this._data = null;
  }
});
