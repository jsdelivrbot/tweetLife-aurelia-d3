/* */ 
"format cjs";
define(function(require) {
  var Eventful = require('zrender/mixin/Eventful');
  var zrUtil = require('zrender/core/util');
  var BoundingRect = require('zrender/core/BoundingRect');
  var graphic = require('../../util/graphic');
  var interactionMutex = require('./interactionMutex');
  var DataDiffer = require('../../data/DataDiffer');
  var curry = zrUtil.curry;
  var each = zrUtil.each;
  var map = zrUtil.map;
  var mathMin = Math.min;
  var mathMax = Math.max;
  var mathPow = Math.pow;
  var COVER_Z = 10000;
  var UNSELECT_THRESHOLD = 6;
  var MIN_RESIZE_LINE_WIDTH = 6;
  var MUTEX_RESOURCE_KEY = 'globalPan';
  var DIRECTION_MAP = {
    w: [0, 0],
    e: [0, 1],
    n: [1, 0],
    s: [1, 1]
  };
  var CURSOR_MAP = {
    w: 'ew',
    e: 'ew',
    n: 'ns',
    s: 'ns',
    ne: 'nesw',
    sw: 'nesw',
    nw: 'nwse',
    se: 'nwse'
  };
  var DEFAULT_BRUSH_OPT = {
    brushStyle: {
      lineWidth: 2,
      stroke: 'rgba(0,0,0,0.3)',
      fill: 'rgba(0,0,0,0.1)'
    },
    transformable: true,
    brushMode: 'single',
    removeOnClick: false
  };
  var baseUID = 0;
  function BrushController(zr) {
    if (__DEV__) {
      zrUtil.assert(zr);
    }
    Eventful.call(this);
    this._zr = zr;
    this.group = new graphic.Group();
    this._brushType;
    this._brushOption;
    this._panels;
    this._track = [];
    this._dragging;
    this._covers = [];
    this._creatingCover;
    this._creatingPanel;
    this._enableGlobalPan;
    if (__DEV__) {
      this._mounted;
    }
    this._uid = 'brushController_' + baseUID++;
    this._handlers = {};
    each(mouseHandlers, function(handler, eventName) {
      this._handlers[eventName] = zrUtil.bind(handler, this);
    }, this);
  }
  BrushController.prototype = {
    constructor: BrushController,
    enableBrush: function(brushOption) {
      if (__DEV__) {
        zrUtil.assert(this._mounted);
      }
      this._brushType && doDisableBrush(this);
      brushOption.brushType && doEnableBrush(this, brushOption);
      return this;
    },
    setPanels: function(panelOpts) {
      var oldPanels = this._panels || {};
      var newPanels = this._panels = panelOpts && panelOpts.length && {};
      var thisGroup = this.group;
      newPanels && each(panelOpts, function(panelOpt) {
        var panelId = panelOpt.panelId;
        var panel = oldPanels[panelId];
        if (!panel) {
          panel = new graphic.Rect({
            silent: true,
            invisible: true
          });
          thisGroup.add(panel);
        }
        var rect = panelOpt.rect;
        if (!(rect instanceof BoundingRect)) {
          rect = BoundingRect.create(rect);
        }
        panel.attr('shape', rect.plain());
        panel.__brushPanelId = panelId;
        newPanels[panelId] = panel;
        oldPanels[panelId] = null;
      });
      each(oldPanels, function(panel) {
        panel && thisGroup.remove(panel);
      });
      return this;
    },
    mount: function(opt) {
      opt = opt || {};
      if (__DEV__) {
        this._mounted = true;
      }
      this._enableGlobalPan = opt.enableGlobalPan;
      var thisGroup = this.group;
      this._zr.add(thisGroup);
      thisGroup.attr({
        position: opt.position || [0, 0],
        rotation: opt.rotation || 0,
        scale: opt.scale || [1, 1]
      });
      return this;
    },
    eachCover: function(cb, context) {
      each(this._covers, cb, context);
    },
    updateCovers: function(brushOptionList) {
      if (__DEV__) {
        zrUtil.assert(this._mounted);
      }
      brushOptionList = zrUtil.map(brushOptionList, function(brushOption) {
        return zrUtil.merge(zrUtil.clone(DEFAULT_BRUSH_OPT), brushOption, true);
      });
      var tmpIdPrefix = '\0-brush-index-';
      var oldCovers = this._covers;
      var newCovers = this._covers = [];
      var controller = this;
      var creatingCover = this._creatingCover;
      (new DataDiffer(oldCovers, brushOptionList, oldGetKey, getKey)).add(addOrUpdate).update(addOrUpdate).remove(remove).execute();
      return this;
      function getKey(brushOption, index) {
        return (brushOption.id != null ? brushOption.id : tmpIdPrefix + index) + '-' + brushOption.brushType;
      }
      function oldGetKey(cover, index) {
        return getKey(cover.__brushOption, index);
      }
      function addOrUpdate(newIndex, oldIndex) {
        var newBrushOption = brushOptionList[newIndex];
        if (oldIndex != null && oldCovers[oldIndex] === creatingCover) {
          newCovers[newIndex] = oldCovers[oldIndex];
        } else {
          var cover = newCovers[newIndex] = oldIndex != null ? (oldCovers[oldIndex].__brushOption = newBrushOption, oldCovers[oldIndex]) : endCreating(controller, createCover(controller, newBrushOption));
          updateCoverAfterCreation(controller, cover);
        }
      }
      function remove(oldIndex) {
        if (oldCovers[oldIndex] !== creatingCover) {
          controller.group.remove(oldCovers[oldIndex]);
        }
      }
    },
    unmount: function() {
      this.enableBrush(false);
      clearCovers(this);
      this._zr.remove(this.group);
      if (__DEV__) {
        this._mounted = false;
      }
      return this;
    },
    dispose: function() {
      this.unmount();
      this.off();
    }
  };
  zrUtil.mixin(BrushController, Eventful);
  function doEnableBrush(controller, brushOption) {
    var zr = controller._zr;
    if (!controller._enableGlobalPan) {
      interactionMutex.take(zr, MUTEX_RESOURCE_KEY, controller._uid);
    }
    each(controller._handlers, function(handler, eventName) {
      zr.on(eventName, handler);
    });
    controller._brushType = brushOption.brushType;
    controller._brushOption = zrUtil.merge(zrUtil.clone(DEFAULT_BRUSH_OPT), brushOption, true);
  }
  function doDisableBrush(controller) {
    var zr = controller._zr;
    interactionMutex.release(zr, MUTEX_RESOURCE_KEY, controller._uid);
    each(controller._handlers, function(handler, eventName) {
      zr.off(eventName, handler);
    });
    controller._brushType = controller._brushOption = null;
  }
  function createCover(controller, brushOption) {
    var cover = coverRenderers[brushOption.brushType].createCover(controller, brushOption);
    updateZ(cover);
    cover.__brushOption = brushOption;
    controller.group.add(cover);
    return cover;
  }
  function endCreating(controller, creatingCover) {
    var coverRenderer = getCoverRenderer(creatingCover);
    if (coverRenderer.endCreating) {
      coverRenderer.endCreating(controller, creatingCover);
      updateZ(creatingCover);
    }
    return creatingCover;
  }
  function updateCoverShape(controller, cover) {
    var brushOption = cover.__brushOption;
    getCoverRenderer(cover).updateCoverShape(controller, cover, brushOption.range, brushOption);
  }
  function updateZ(group) {
    group.traverse(function(el) {
      el.z = COVER_Z;
      el.z2 = COVER_Z;
    });
  }
  function updateCoverAfterCreation(controller, cover) {
    getCoverRenderer(cover).updateCommon(controller, cover);
    updateCoverShape(controller, cover);
  }
  function getCoverRenderer(cover) {
    return coverRenderers[cover.__brushOption.brushType];
  }
  function getPanelByPoint(controller, x, y) {
    var panels = controller._panels;
    if (!panels) {
      return true;
    }
    var panel;
    each(panels, function(pn) {
      pn.contain(x, y) && (panel = pn);
    });
    return panel;
  }
  function getPanelByCover(controller, cover) {
    var panels = controller._panels;
    if (!panels) {
      return true;
    }
    var panelId = cover.__brushOption.panelId;
    return panelId != null ? panels[panelId] : true;
  }
  function clearCovers(controller) {
    var covers = controller._covers;
    var originalLength = covers.length;
    each(covers, function(cover) {
      controller.group.remove(cover);
    }, controller);
    covers.length = 0;
    return !!originalLength;
  }
  function trigger(controller, opt) {
    var areas = map(controller._covers, function(cover) {
      var brushOption = cover.__brushOption;
      var range = zrUtil.clone(brushOption.range);
      return {
        brushType: brushOption.brushType,
        panelId: brushOption.panelId,
        range: range
      };
    });
    controller.trigger('brush', areas, {
      isEnd: !!opt.isEnd,
      removeOnClick: !!opt.removeOnClick
    });
  }
  function shouldShowCover(controller) {
    var track = controller._track;
    if (!track.length) {
      return false;
    }
    var p2 = track[track.length - 1];
    var p1 = track[0];
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];
    var dist = mathPow(dx * dx + dy * dy, 0.5);
    return dist > UNSELECT_THRESHOLD;
  }
  function getTrackEnds(track) {
    var tail = track.length - 1;
    tail < 0 && (tail = 0);
    return [track[0], track[tail]];
  }
  function createBaseRectCover(doDrift, controller, brushOption, edgeNames) {
    var cover = new graphic.Group();
    cover.add(new graphic.Rect({
      name: 'main',
      style: makeStyle(brushOption),
      silent: true,
      draggable: true,
      cursor: 'move',
      drift: curry(doDrift, controller, cover, 'nswe'),
      ondragend: curry(trigger, controller, {isEnd: true})
    }));
    each(edgeNames, function(name) {
      cover.add(new graphic.Rect({
        name: name,
        style: {opacity: 0},
        draggable: true,
        silent: true,
        invisible: true,
        drift: curry(doDrift, controller, cover, name),
        ondragend: curry(trigger, controller, {isEnd: true})
      }));
    });
    return cover;
  }
  function updateBaseRect(controller, cover, localRange, brushOption) {
    var lineWidth = brushOption.brushStyle.lineWidth || 0;
    var handleSize = mathMax(lineWidth, MIN_RESIZE_LINE_WIDTH);
    var x = localRange[0][0];
    var y = localRange[1][0];
    var xa = x - lineWidth / 2;
    var ya = y - lineWidth / 2;
    var x2 = localRange[0][1];
    var y2 = localRange[1][1];
    var x2a = x2 - handleSize + lineWidth / 2;
    var y2a = y2 - handleSize + lineWidth / 2;
    var width = x2 - x;
    var height = y2 - y;
    var widtha = width + lineWidth;
    var heighta = height + lineWidth;
    updateRectShape(controller, cover, 'main', x, y, width, height);
    if (brushOption.transformable) {
      updateRectShape(controller, cover, 'w', xa, ya, handleSize, heighta);
      updateRectShape(controller, cover, 'e', x2a, ya, handleSize, heighta);
      updateRectShape(controller, cover, 'n', xa, ya, widtha, handleSize);
      updateRectShape(controller, cover, 's', xa, y2a, widtha, handleSize);
      updateRectShape(controller, cover, 'nw', xa, ya, handleSize, handleSize);
      updateRectShape(controller, cover, 'ne', x2a, ya, handleSize, handleSize);
      updateRectShape(controller, cover, 'sw', xa, y2a, handleSize, handleSize);
      updateRectShape(controller, cover, 'se', x2a, y2a, handleSize, handleSize);
    }
  }
  function updateCommon(controller, cover) {
    var brushOption = cover.__brushOption;
    var transformable = brushOption.transformable;
    var mainEl = cover.childAt(0);
    mainEl.useStyle(makeStyle(brushOption));
    mainEl.attr({
      silent: !transformable,
      cursor: transformable ? 'move' : 'default'
    });
    each(['w', 'e', 'n', 's', 'se', 'sw', 'ne', 'nw'], function(name) {
      var el = cover.childOfName(name);
      var globalDir = getGlobalDirection(controller, name);
      el && el.attr({
        silent: !transformable,
        invisible: !transformable,
        cursor: transformable ? CURSOR_MAP[globalDir] + '-resize' : null
      });
    });
  }
  function updateRectShape(controller, cover, name, x, y, w, h) {
    var el = cover.childOfName(name);
    el && el.setShape(pointsToRect(clipByPanel(controller, cover, [[x, y], [x + w, y + h]])));
  }
  function makeStyle(brushOption) {
    return zrUtil.defaults({strokeNoScale: true}, brushOption.brushStyle);
  }
  function formatRectRange(x, y, x2, y2) {
    var min = [mathMin(x, x2), mathMin(y, y2)];
    var max = [mathMax(x, x2), mathMax(y, y2)];
    return [[min[0], max[0]], [min[1], max[1]]];
  }
  function getTransform(controller) {
    return graphic.getTransform(controller.group);
  }
  function getGlobalDirection(controller, localDirection) {
    if (localDirection.length > 1) {
      localDirection = localDirection.split('');
      var globalDir = [getGlobalDirection(controller, localDirection[0]), getGlobalDirection(controller, localDirection[1])];
      (globalDir[0] === 'e' || globalDir[0] === 'w') && globalDir.reverse();
      return globalDir.join('');
    } else {
      var map = {
        w: 'left',
        e: 'right',
        n: 'top',
        s: 'bottom'
      };
      var inverseMap = {
        left: 'w',
        right: 'e',
        top: 'n',
        bottom: 's'
      };
      var globalDir = graphic.transformDirection(map[localDirection], getTransform(controller));
      return inverseMap[globalDir];
    }
  }
  function driftRect(toRectRange, fromRectRange, controller, cover, name, dx, dy, e) {
    var brushOption = cover.__brushOption;
    var rectRange = toRectRange(brushOption.range);
    var localDelta = toLocalDelta(controller, dx, dy);
    each(name.split(''), function(namePart) {
      var ind = DIRECTION_MAP[namePart];
      rectRange[ind[0]][ind[1]] += localDelta[ind[0]];
    });
    brushOption.range = fromRectRange(formatRectRange(rectRange[0][0], rectRange[1][0], rectRange[0][1], rectRange[1][1]));
    updateCoverAfterCreation(controller, cover);
    trigger(controller, {isEnd: false});
  }
  function driftPolygon(controller, cover, dx, dy, e) {
    var range = cover.__brushOption.range;
    var localDelta = toLocalDelta(controller, dx, dy);
    each(range, function(point) {
      point[0] += localDelta[0];
      point[1] += localDelta[1];
    });
    updateCoverAfterCreation(controller, cover);
    trigger(controller, {isEnd: false});
  }
  function toLocalDelta(controller, dx, dy) {
    var thisGroup = controller.group;
    var localD = thisGroup.transformCoordToLocal(dx, dy);
    var localZero = thisGroup.transformCoordToLocal(0, 0);
    return [localD[0] - localZero[0], localD[1] - localZero[1]];
  }
  function clipByPanel(controller, cover, data) {
    var panel = getPanelByCover(controller, cover);
    if (panel === true) {
      return zrUtil.clone(data);
    }
    var panelRect = panel.getBoundingRect();
    return zrUtil.map(data, function(point) {
      var x = point[0];
      x = mathMax(x, panelRect.x);
      x = mathMin(x, panelRect.x + panelRect.width);
      var y = point[1];
      y = mathMax(y, panelRect.y);
      y = mathMin(y, panelRect.y + panelRect.height);
      return [x, y];
    });
  }
  function pointsToRect(points) {
    var xmin = mathMin(points[0][0], points[1][0]);
    var ymin = mathMin(points[0][1], points[1][1]);
    var xmax = mathMax(points[0][0], points[1][0]);
    var ymax = mathMax(points[0][1], points[1][1]);
    return {
      x: xmin,
      y: ymin,
      width: xmax - xmin,
      height: ymax - ymin
    };
  }
  function resetCursor(controller, e) {
    var x = e.offsetX;
    var y = e.offsetY;
    var zr = controller._zr;
    if (controller._brushType) {
      var panels = controller._panels;
      var covers = controller._covers;
      var inCover;
      for (var i = 0; i < covers.length; i++) {
        if (coverRenderers[covers[i].__brushOption.brushType].contain(covers[i], x, y)) {
          inCover = true;
          break;
        }
      }
      if (!inCover) {
        if (panels) {
          each(panels, function(panel) {
            panel.contain(x, y) && zr.setCursorStyle('crosshair');
          });
        } else {
          zr.setCursorStyle('crosshair');
        }
      }
    }
  }
  function preventDefault(e) {
    var rawE = e.event;
    rawE.preventDefault && rawE.preventDefault();
  }
  function mainShapeContain(cover, x, y) {
    return cover.childOfName('main').contain(x, y);
  }
  function updateCoverByMouse(controller, e, isEnd) {
    var x = e.offsetX;
    var y = e.offsetY;
    var creatingCover = controller._creatingCover;
    var panel = controller._creatingPanel;
    var thisBrushOption = controller._brushOption;
    var eventParams;
    controller._track.push(controller.group.transformCoordToLocal(x, y));
    if (shouldShowCover(controller) || creatingCover) {
      if (panel && !creatingCover) {
        thisBrushOption.brushMode === 'single' && clearCovers(controller);
        var brushOption = zrUtil.clone(thisBrushOption);
        brushOption.panelId = panel === true ? null : panel.__brushPanelId;
        creatingCover = controller._creatingCover = createCover(controller, brushOption);
        controller._covers.push(creatingCover);
      }
      if (creatingCover) {
        var coverRenderer = coverRenderers[controller._brushType];
        var coverBrushOption = creatingCover.__brushOption;
        coverBrushOption.range = coverRenderer.getCreatingRange(clipByPanel(controller, creatingCover, controller._track));
        if (isEnd) {
          endCreating(controller, creatingCover);
          coverRenderer.updateCommon(controller, creatingCover);
        }
        updateCoverShape(controller, creatingCover);
        eventParams = {isEnd: isEnd};
      }
    } else if (isEnd && thisBrushOption.brushMode === 'single' && thisBrushOption.removeOnClick) {
      if (getPanelByPoint(controller, x, y) && clearCovers(controller)) {
        eventParams = {
          isEnd: isEnd,
          removeOnClick: true
        };
      }
    }
    return eventParams;
  }
  var mouseHandlers = {
    mousedown: function(e) {
      if (this._dragging) {
        handleDragEnd.call(this, e);
      } else if (!e.target || !e.target.draggable) {
        preventDefault(e);
        var x = e.offsetX;
        var y = e.offsetY;
        this._creatingCover = null;
        var panel = this._creatingPanel = getPanelByPoint(this, x, y);
        if (panel) {
          this._dragging = true;
          this._track = [this.group.transformCoordToLocal(x, y)];
        }
      }
    },
    mousemove: function(e) {
      resetCursor(this, e);
      if (this._dragging) {
        preventDefault(e);
        var eventParams = updateCoverByMouse(this, e, false);
        eventParams && trigger(this, eventParams);
      }
    },
    mouseup: handleDragEnd
  };
  function handleDragEnd(e) {
    if (this._dragging) {
      preventDefault(e);
      var eventParams = updateCoverByMouse(this, e, true);
      this._dragging = false;
      this._track = [];
      this._creatingCover = null;
      eventParams && trigger(this, eventParams);
    }
  }
  var coverRenderers = {
    lineX: getLineRenderer(0),
    lineY: getLineRenderer(1),
    rect: {
      createCover: function(controller, brushOption) {
        return createBaseRectCover(curry(driftRect, function(range) {
          return range;
        }, function(range) {
          return range;
        }), controller, brushOption, ['w', 'e', 'n', 's', 'se', 'sw', 'ne', 'nw']);
      },
      getCreatingRange: function(localTrack) {
        var ends = getTrackEnds(localTrack);
        return formatRectRange(ends[1][0], ends[1][1], ends[0][0], ends[0][1]);
      },
      updateCoverShape: function(controller, cover, localRange, brushOption) {
        updateBaseRect(controller, cover, localRange, brushOption);
      },
      updateCommon: updateCommon,
      contain: mainShapeContain
    },
    polygon: {
      createCover: function(controller, brushOption) {
        var cover = new graphic.Group();
        cover.add(new graphic.Polyline({
          name: 'main',
          style: makeStyle(brushOption),
          silent: true
        }));
        return cover;
      },
      getCreatingRange: function(localTrack) {
        return localTrack;
      },
      endCreating: function(controller, cover) {
        cover.remove(cover.childAt(0));
        cover.add(new graphic.Polygon({
          name: 'main',
          draggable: true,
          drift: curry(driftPolygon, controller, cover),
          ondragend: curry(trigger, controller, {isEnd: true})
        }));
      },
      updateCoverShape: function(controller, cover, localRange, brushOption) {
        cover.childAt(0).setShape({points: clipByPanel(controller, cover, localRange)});
      },
      updateCommon: updateCommon,
      contain: mainShapeContain
    }
  };
  function getLineRenderer(xyIndex) {
    return {
      createCover: function(controller, brushOption) {
        return createBaseRectCover(curry(driftRect, function(range) {
          var rectRange = [range, [0, 100]];
          xyIndex && rectRange.reverse();
          return rectRange;
        }, function(rectRange) {
          return rectRange[xyIndex];
        }), controller, brushOption, [['w', 'e'], ['n', 's']][xyIndex]);
      },
      getCreatingRange: function(localTrack) {
        var ends = getTrackEnds(localTrack);
        var min = mathMin(ends[0][xyIndex], ends[1][xyIndex]);
        var max = mathMax(ends[0][xyIndex], ends[1][xyIndex]);
        return [min, max];
      },
      updateCoverShape: function(controller, cover, localRange, brushOption) {
        var brushWidth = brushOption.brushStyle.width;
        var otherExtent;
        if (brushWidth == null) {
          var panel = getPanelByCover(controller, cover);
          var base = 0;
          if (panel !== true) {
            var rect = panel.getBoundingRect();
            brushWidth = xyIndex ? rect.width : rect.height;
            base = xyIndex ? rect.x : rect.y;
          }
          otherExtent = [base, base + (brushWidth || 0)];
        } else {
          otherExtent = [-brushWidth / 2, brushWidth / 2];
        }
        var rectRange = [localRange, otherExtent];
        xyIndex && rectRange.reverse();
        updateBaseRect(controller, cover, rectRange, brushOption);
      },
      updateCommon: updateCommon,
      contain: mainShapeContain
    };
  }
  return BrushController;
});
