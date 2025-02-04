/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var config = require('./config');
  var util = require('./core/util');
  var log = require('./core/log');
  var BoundingRect = require('./core/BoundingRect');
  var timsort = require('./core/timsort');
  var Layer = require('./Layer');
  var requestAnimationFrame = require('./animation/requestAnimationFrame');
  var MAX_PROGRESSIVE_LAYER_NUMBER = 5;
  function parseInt10(val) {
    return parseInt(val, 10);
  }
  function isLayerValid(layer) {
    if (!layer) {
      return false;
    }
    if (layer.isBuildin) {
      return true;
    }
    if (typeof(layer.resize) !== 'function' || typeof(layer.refresh) !== 'function') {
      return false;
    }
    return true;
  }
  function preProcessLayer(layer) {
    layer.__unusedCount++;
  }
  function postProcessLayer(layer) {
    if (layer.__unusedCount == 1) {
      layer.clear();
    }
  }
  var tmpRect = new BoundingRect(0, 0, 0, 0);
  var viewRect = new BoundingRect(0, 0, 0, 0);
  function isDisplayableCulled(el, width, height) {
    tmpRect.copy(el.getBoundingRect());
    if (el.transform) {
      tmpRect.applyTransform(el.transform);
    }
    viewRect.width = width;
    viewRect.height = height;
    return !tmpRect.intersect(viewRect);
  }
  function isClipPathChanged(clipPaths, prevClipPaths) {
    if (clipPaths == prevClipPaths) {
      return false;
    }
    if (!clipPaths || !prevClipPaths || (clipPaths.length !== prevClipPaths.length)) {
      return true;
    }
    for (var i = 0; i < clipPaths.length; i++) {
      if (clipPaths[i] !== prevClipPaths[i]) {
        return true;
      }
    }
  }
  function doClip(clipPaths, ctx) {
    for (var i = 0; i < clipPaths.length; i++) {
      var clipPath = clipPaths[i];
      var path = clipPath.path;
      clipPath.setTransform(ctx);
      path.beginPath(ctx);
      clipPath.buildPath(path, clipPath.shape);
      ctx.clip();
      clipPath.restoreTransform(ctx);
    }
  }
  function createRoot(width, height) {
    var domRoot = document.createElement('div');
    domRoot.style.cssText = ['position:relative', 'overflow:hidden', 'width:' + width + 'px', 'height:' + height + 'px', 'padding:0', 'margin:0', 'border-width:0'].join(';') + ';';
    return domRoot;
  }
  var Painter = function(root, storage, opts) {
    var singleCanvas = !root.nodeName || root.nodeName.toUpperCase() === 'CANVAS';
    this._opts = opts = util.extend({}, opts || {});
    this.dpr = opts.devicePixelRatio || config.devicePixelRatio;
    this._singleCanvas = singleCanvas;
    this.root = root;
    var rootStyle = root.style;
    if (rootStyle) {
      rootStyle['-webkit-tap-highlight-color'] = 'transparent';
      rootStyle['-webkit-user-select'] = rootStyle['user-select'] = rootStyle['-webkit-touch-callout'] = 'none';
      root.innerHTML = '';
    }
    this.storage = storage;
    var zlevelList = this._zlevelList = [];
    var layers = this._layers = {};
    this._layerConfig = {};
    if (!singleCanvas) {
      this._width = this._getSize(0);
      this._height = this._getSize(1);
      var domRoot = this._domRoot = createRoot(this._width, this._height);
      root.appendChild(domRoot);
    } else {
      var width = root.width;
      var height = root.height;
      this._width = width;
      this._height = height;
      var mainLayer = new Layer(root, this, 1);
      mainLayer.initContext();
      layers[0] = mainLayer;
      zlevelList.push(0);
      this._domRoot = root;
    }
    this.pathToImage = this._createPathToImage();
    this._progressiveLayers = [];
    this._hoverlayer;
    this._hoverElements = [];
  };
  Painter.prototype = {
    constructor: Painter,
    isSingleCanvas: function() {
      return this._singleCanvas;
    },
    getViewportRoot: function() {
      return this._domRoot;
    },
    refresh: function(paintAll) {
      var list = this.storage.getDisplayList(true);
      var zlevelList = this._zlevelList;
      this._paintList(list, paintAll);
      for (var i = 0; i < zlevelList.length; i++) {
        var z = zlevelList[i];
        var layer = this._layers[z];
        if (!layer.isBuildin && layer.refresh) {
          layer.refresh();
        }
      }
      this.refreshHover();
      if (this._progressiveLayers.length) {
        this._startProgessive();
      }
      return this;
    },
    addHover: function(el, hoverStyle) {
      if (el.__hoverMir) {
        return;
      }
      var elMirror = new el.constructor({
        style: el.style,
        shape: el.shape
      });
      elMirror.__from = el;
      el.__hoverMir = elMirror;
      elMirror.setStyle(hoverStyle);
      this._hoverElements.push(elMirror);
    },
    removeHover: function(el) {
      var elMirror = el.__hoverMir;
      var hoverElements = this._hoverElements;
      var idx = util.indexOf(hoverElements, elMirror);
      if (idx >= 0) {
        hoverElements.splice(idx, 1);
      }
      el.__hoverMir = null;
    },
    clearHover: function(el) {
      var hoverElements = this._hoverElements;
      for (var i = 0; i < hoverElements.length; i++) {
        var from = hoverElements[i].__from;
        if (from) {
          from.__hoverMir = null;
        }
      }
      hoverElements.length = 0;
    },
    refreshHover: function() {
      var hoverElements = this._hoverElements;
      var len = hoverElements.length;
      var hoverLayer = this._hoverlayer;
      hoverLayer && hoverLayer.clear();
      if (!len) {
        return;
      }
      timsort(hoverElements, this.storage.displayableSortFunc);
      if (!hoverLayer) {
        hoverLayer = this._hoverlayer = this.getLayer(1e5);
      }
      var scope = {};
      hoverLayer.ctx.save();
      for (var i = 0; i < len; ) {
        var el = hoverElements[i];
        var originalEl = el.__from;
        if (!(originalEl && originalEl.__zr)) {
          hoverElements.splice(i, 1);
          originalEl.__hoverMir = null;
          len--;
          continue;
        }
        i++;
        if (!originalEl.invisible) {
          el.transform = originalEl.transform;
          el.invTransform = originalEl.invTransform;
          el.__clipPaths = originalEl.__clipPaths;
          this._doPaintEl(el, hoverLayer, true, scope);
        }
      }
      hoverLayer.ctx.restore();
    },
    _startProgessive: function() {
      var self = this;
      if (!self._furtherProgressive) {
        return;
      }
      var token = self._progressiveToken = +new Date();
      self._progress++;
      requestAnimationFrame(step);
      function step() {
        if (token === self._progressiveToken && self.storage) {
          self._doPaintList(self.storage.getDisplayList());
          if (self._furtherProgressive) {
            self._progress++;
            requestAnimationFrame(step);
          } else {
            self._progressiveToken = -1;
          }
        }
      }
    },
    _clearProgressive: function() {
      this._progressiveToken = -1;
      this._progress = 0;
      util.each(this._progressiveLayers, function(layer) {
        layer.__dirty && layer.clear();
      });
    },
    _paintList: function(list, paintAll) {
      if (paintAll == null) {
        paintAll = false;
      }
      this._updateLayerStatus(list);
      this._clearProgressive();
      this.eachBuildinLayer(preProcessLayer);
      this._doPaintList(list, paintAll);
      this.eachBuildinLayer(postProcessLayer);
    },
    _doPaintList: function(list, paintAll) {
      var currentLayer;
      var currentZLevel;
      var ctx;
      var scope;
      var progressiveLayerIdx = 0;
      var currentProgressiveLayer;
      var width = this._width;
      var height = this._height;
      var layerProgress;
      var frame = this._progress;
      function flushProgressiveLayer(layer) {
        var dpr = ctx.dpr || 1;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        currentLayer.__dirty = true;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(layer.dom, 0, 0, width * dpr, height * dpr);
        ctx.restore();
      }
      for (var i = 0,
          l = list.length; i < l; i++) {
        var el = list[i];
        var elZLevel = this._singleCanvas ? 0 : el.zlevel;
        var elFrame = el.__frame;
        if (elFrame < 0 && currentProgressiveLayer) {
          flushProgressiveLayer(currentProgressiveLayer);
          currentProgressiveLayer = null;
        }
        if (currentZLevel !== elZLevel) {
          if (ctx) {
            ctx.restore();
          }
          scope = {};
          currentZLevel = elZLevel;
          currentLayer = this.getLayer(currentZLevel);
          if (!currentLayer.isBuildin) {
            log('ZLevel ' + currentZLevel + ' has been used by unkown layer ' + currentLayer.id);
          }
          ctx = currentLayer.ctx;
          ctx.save();
          currentLayer.__unusedCount = 0;
          if (currentLayer.__dirty || paintAll) {
            currentLayer.clear();
          }
        }
        if (!(currentLayer.__dirty || paintAll)) {
          continue;
        }
        if (elFrame >= 0) {
          if (!currentProgressiveLayer) {
            currentProgressiveLayer = this._progressiveLayers[Math.min(progressiveLayerIdx++, MAX_PROGRESSIVE_LAYER_NUMBER - 1)];
            currentProgressiveLayer.ctx.save();
            currentProgressiveLayer.renderScope = {};
            if (currentProgressiveLayer && (currentProgressiveLayer.__progress > currentProgressiveLayer.__maxProgress)) {
              i = currentProgressiveLayer.__nextIdxNotProg - 1;
              continue;
            }
            layerProgress = currentProgressiveLayer.__progress;
            if (!currentProgressiveLayer.__dirty) {
              frame = layerProgress;
            }
            currentProgressiveLayer.__progress = frame + 1;
          }
          if (elFrame === frame) {
            this._doPaintEl(el, currentProgressiveLayer, true, currentProgressiveLayer.renderScope);
          }
        } else {
          this._doPaintEl(el, currentLayer, paintAll, scope);
        }
        el.__dirty = false;
      }
      if (currentProgressiveLayer) {
        flushProgressiveLayer(currentProgressiveLayer);
      }
      ctx && ctx.restore();
      this._furtherProgressive = false;
      util.each(this._progressiveLayers, function(layer) {
        if (layer.__maxProgress >= layer.__progress) {
          this._furtherProgressive = true;
        }
      }, this);
    },
    _doPaintEl: function(el, currentLayer, forcePaint, scope) {
      var ctx = currentLayer.ctx;
      var m = el.transform;
      if ((currentLayer.__dirty || forcePaint) && !el.invisible && el.style.opacity !== 0 && !(m && !m[0] && !m[3]) && !(el.culling && isDisplayableCulled(el, this._width, this._height))) {
        var clipPaths = el.__clipPaths;
        if (scope.prevClipLayer !== currentLayer || isClipPathChanged(clipPaths, scope.prevElClipPaths)) {
          if (scope.prevElClipPaths) {
            scope.prevClipLayer.ctx.restore();
            scope.prevClipLayer = scope.prevElClipPaths = null;
            scope.prevEl = null;
          }
          if (clipPaths) {
            ctx.save();
            doClip(clipPaths, ctx);
            scope.prevClipLayer = currentLayer;
            scope.prevElClipPaths = clipPaths;
          }
        }
        el.beforeBrush && el.beforeBrush(ctx);
        el.brush(ctx, scope.prevEl || null);
        scope.prevEl = el;
        el.afterBrush && el.afterBrush(ctx);
      }
    },
    getLayer: function(zlevel) {
      if (this._singleCanvas) {
        return this._layers[0];
      }
      var layer = this._layers[zlevel];
      if (!layer) {
        layer = new Layer('zr_' + zlevel, this, this.dpr);
        layer.isBuildin = true;
        if (this._layerConfig[zlevel]) {
          util.merge(layer, this._layerConfig[zlevel], true);
        }
        this.insertLayer(zlevel, layer);
        layer.initContext();
      }
      return layer;
    },
    insertLayer: function(zlevel, layer) {
      var layersMap = this._layers;
      var zlevelList = this._zlevelList;
      var len = zlevelList.length;
      var prevLayer = null;
      var i = -1;
      var domRoot = this._domRoot;
      if (layersMap[zlevel]) {
        log('ZLevel ' + zlevel + ' has been used already');
        return;
      }
      if (!isLayerValid(layer)) {
        log('Layer of zlevel ' + zlevel + ' is not valid');
        return;
      }
      if (len > 0 && zlevel > zlevelList[0]) {
        for (i = 0; i < len - 1; i++) {
          if (zlevelList[i] < zlevel && zlevelList[i + 1] > zlevel) {
            break;
          }
        }
        prevLayer = layersMap[zlevelList[i]];
      }
      zlevelList.splice(i + 1, 0, zlevel);
      if (prevLayer) {
        var prevDom = prevLayer.dom;
        if (prevDom.nextSibling) {
          domRoot.insertBefore(layer.dom, prevDom.nextSibling);
        } else {
          domRoot.appendChild(layer.dom);
        }
      } else {
        if (domRoot.firstChild) {
          domRoot.insertBefore(layer.dom, domRoot.firstChild);
        } else {
          domRoot.appendChild(layer.dom);
        }
      }
      layersMap[zlevel] = layer;
    },
    eachLayer: function(cb, context) {
      var zlevelList = this._zlevelList;
      var z;
      var i;
      for (i = 0; i < zlevelList.length; i++) {
        z = zlevelList[i];
        cb.call(context, this._layers[z], z);
      }
    },
    eachBuildinLayer: function(cb, context) {
      var zlevelList = this._zlevelList;
      var layer;
      var z;
      var i;
      for (i = 0; i < zlevelList.length; i++) {
        z = zlevelList[i];
        layer = this._layers[z];
        if (layer.isBuildin) {
          cb.call(context, layer, z);
        }
      }
    },
    eachOtherLayer: function(cb, context) {
      var zlevelList = this._zlevelList;
      var layer;
      var z;
      var i;
      for (i = 0; i < zlevelList.length; i++) {
        z = zlevelList[i];
        layer = this._layers[z];
        if (!layer.isBuildin) {
          cb.call(context, layer, z);
        }
      }
    },
    getLayers: function() {
      return this._layers;
    },
    _updateLayerStatus: function(list) {
      var layers = this._layers;
      var progressiveLayers = this._progressiveLayers;
      var elCountsLastFrame = {};
      var progressiveElCountsLastFrame = {};
      this.eachBuildinLayer(function(layer, z) {
        elCountsLastFrame[z] = layer.elCount;
        layer.elCount = 0;
        layer.__dirty = false;
      });
      util.each(progressiveLayers, function(layer, idx) {
        progressiveElCountsLastFrame[idx] = layer.elCount;
        layer.elCount = 0;
        layer.__dirty = false;
      });
      var progressiveLayerCount = 0;
      var currentProgressiveLayer;
      var lastProgressiveKey;
      var frameCount = 0;
      for (var i = 0,
          l = list.length; i < l; i++) {
        var el = list[i];
        var zlevel = this._singleCanvas ? 0 : el.zlevel;
        var layer = layers[zlevel];
        var elProgress = el.progressive;
        if (layer) {
          layer.elCount++;
          layer.__dirty = layer.__dirty || el.__dirty;
        }
        if (elProgress >= 0) {
          if (lastProgressiveKey !== elProgress) {
            lastProgressiveKey = elProgress;
            frameCount++;
          }
          var elFrame = el.__frame = frameCount - 1;
          if (!currentProgressiveLayer) {
            var idx = Math.min(progressiveLayerCount, MAX_PROGRESSIVE_LAYER_NUMBER - 1);
            currentProgressiveLayer = progressiveLayers[idx];
            if (!currentProgressiveLayer) {
              currentProgressiveLayer = progressiveLayers[idx] = new Layer('progressive', this, this.dpr);
              currentProgressiveLayer.initContext();
            }
            currentProgressiveLayer.__maxProgress = 0;
          }
          currentProgressiveLayer.__dirty = currentProgressiveLayer.__dirty || el.__dirty;
          currentProgressiveLayer.elCount++;
          currentProgressiveLayer.__maxProgress = Math.max(currentProgressiveLayer.__maxProgress, elFrame);
          if (currentProgressiveLayer.__maxProgress >= currentProgressiveLayer.__progress) {
            layer.__dirty = true;
          }
        } else {
          el.__frame = -1;
          if (currentProgressiveLayer) {
            currentProgressiveLayer.__nextIdxNotProg = i;
            progressiveLayerCount++;
            currentProgressiveLayer = null;
          }
        }
      }
      if (currentProgressiveLayer) {
        progressiveLayerCount++;
        currentProgressiveLayer.__nextIdxNotProg = i;
      }
      this.eachBuildinLayer(function(layer, z) {
        if (elCountsLastFrame[z] !== layer.elCount) {
          layer.__dirty = true;
        }
      });
      progressiveLayers.length = Math.min(progressiveLayerCount, MAX_PROGRESSIVE_LAYER_NUMBER);
      util.each(progressiveLayers, function(layer, idx) {
        if (progressiveElCountsLastFrame[idx] !== layer.elCount) {
          el.__dirty = true;
        }
        if (layer.__dirty) {
          layer.__progress = 0;
        }
      });
    },
    clear: function() {
      this.eachBuildinLayer(this._clearLayer);
      return this;
    },
    _clearLayer: function(layer) {
      layer.clear();
    },
    configLayer: function(zlevel, config) {
      if (config) {
        var layerConfig = this._layerConfig;
        if (!layerConfig[zlevel]) {
          layerConfig[zlevel] = config;
        } else {
          util.merge(layerConfig[zlevel], config, true);
        }
        var layer = this._layers[zlevel];
        if (layer) {
          util.merge(layer, layerConfig[zlevel], true);
        }
      }
    },
    delLayer: function(zlevel) {
      var layers = this._layers;
      var zlevelList = this._zlevelList;
      var layer = layers[zlevel];
      if (!layer) {
        return;
      }
      layer.dom.parentNode.removeChild(layer.dom);
      delete layers[zlevel];
      zlevelList.splice(util.indexOf(zlevelList, zlevel), 1);
    },
    resize: function(width, height) {
      var domRoot = this._domRoot;
      domRoot.style.display = 'none';
      var opts = this._opts;
      width != null && (opts.width = width);
      height != null && (opts.height = height);
      width = this._getSize(0);
      height = this._getSize(1);
      domRoot.style.display = '';
      if (this._width != width || height != this._height) {
        domRoot.style.width = width + 'px';
        domRoot.style.height = height + 'px';
        for (var id in this._layers) {
          if (this._layers.hasOwnProperty(id)) {
            this._layers[id].resize(width, height);
          }
        }
        util.each(this._progressiveLayers, function(layer) {
          layer.resize(width, height);
        });
        this.refresh(true);
      }
      this._width = width;
      this._height = height;
      return this;
    },
    clearLayer: function(zlevel) {
      var layer = this._layers[zlevel];
      if (layer) {
        layer.clear();
      }
    },
    dispose: function() {
      this.root.innerHTML = '';
      this.root = this.storage = this._domRoot = this._layers = null;
    },
    getRenderedCanvas: function(opts) {
      opts = opts || {};
      if (this._singleCanvas) {
        return this._layers[0].dom;
      }
      var imageLayer = new Layer('image', this, opts.pixelRatio || this.dpr);
      imageLayer.initContext();
      imageLayer.clearColor = opts.backgroundColor;
      imageLayer.clear();
      var displayList = this.storage.getDisplayList(true);
      var scope = {};
      for (var i = 0; i < displayList.length; i++) {
        var el = displayList[i];
        this._doPaintEl(el, imageLayer, true, scope);
      }
      return imageLayer.dom;
    },
    getWidth: function() {
      return this._width;
    },
    getHeight: function() {
      return this._height;
    },
    _getSize: function(whIdx) {
      var opts = this._opts;
      var wh = ['width', 'height'][whIdx];
      var cwh = ['clientWidth', 'clientHeight'][whIdx];
      var plt = ['paddingLeft', 'paddingTop'][whIdx];
      var prb = ['paddingRight', 'paddingBottom'][whIdx];
      if (opts[wh] != null && opts[wh] !== 'auto') {
        return parseFloat(opts[wh]);
      }
      var root = this.root;
      var stl = document.defaultView.getComputedStyle(root);
      return ((root[cwh] || parseInt10(stl[wh]) || parseInt10(root.style[wh])) - (parseInt10(stl[plt]) || 0) - (parseInt10(stl[prb]) || 0)) | 0;
    },
    _pathToImage: function(id, path, width, height, dpr) {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.clearRect(0, 0, width * dpr, height * dpr);
      var pathTransform = {
        position: path.position,
        rotation: path.rotation,
        scale: path.scale
      };
      path.position = [0, 0, 0];
      path.rotation = 0;
      path.scale = [1, 1];
      if (path) {
        path.brush(ctx);
      }
      var ImageShape = require('./graphic/Image');
      var imgShape = new ImageShape({
        id: id,
        style: {
          x: 0,
          y: 0,
          image: canvas
        }
      });
      if (pathTransform.position != null) {
        imgShape.position = path.position = pathTransform.position;
      }
      if (pathTransform.rotation != null) {
        imgShape.rotation = path.rotation = pathTransform.rotation;
      }
      if (pathTransform.scale != null) {
        imgShape.scale = path.scale = pathTransform.scale;
      }
      return imgShape;
    },
    _createPathToImage: function() {
      var me = this;
      return function(id, e, width, height) {
        return me._pathToImage(id, e, width, height, me.dpr);
      };
    }
  };
  return Painter;
});
