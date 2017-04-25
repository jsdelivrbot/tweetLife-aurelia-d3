/* */ 
"format cjs";
(function(process) {
  if (typeof __DEV__ === 'undefined') {
    if (typeof window !== 'undefined') {
      window.__DEV__ = true;
    } else if (typeof global !== 'undefined') {
      global.__DEV__ = true;
    }
  }
  define(function(require) {
    var env = require('zrender/core/env');
    var GlobalModel = require('./model/Global');
    var ExtensionAPI = require('./ExtensionAPI');
    var CoordinateSystemManager = require('./CoordinateSystem');
    var OptionManager = require('./model/OptionManager');
    var ComponentModel = require('./model/Component');
    var SeriesModel = require('./model/Series');
    var ComponentView = require('./view/Component');
    var ChartView = require('./view/Chart');
    var graphic = require('./util/graphic');
    var modelUtil = require('./util/model');
    var throttle = require('./util/throttle');
    var zrender = require('zrender');
    var zrUtil = require('zrender/core/util');
    var colorTool = require('zrender/tool/color');
    var Eventful = require('zrender/mixin/Eventful');
    var timsort = require('zrender/core/timsort');
    var each = zrUtil.each;
    var parseClassType = ComponentModel.parseClassType;
    var PRIORITY_PROCESSOR_FILTER = 1000;
    var PRIORITY_PROCESSOR_STATISTIC = 5000;
    var PRIORITY_VISUAL_LAYOUT = 1000;
    var PRIORITY_VISUAL_GLOBAL = 2000;
    var PRIORITY_VISUAL_CHART = 3000;
    var PRIORITY_VISUAL_COMPONENT = 4000;
    var PRIORITY_VISUAL_BRUSH = 5000;
    var IN_MAIN_PROCESS = '__flagInMainProcess';
    var HAS_GRADIENT_OR_PATTERN_BG = '__hasGradientOrPatternBg';
    var OPTION_UPDATED = '__optionUpdated';
    var ACTION_REG = /^[a-zA-Z0-9_]+$/;
    function createRegisterEventWithLowercaseName(method) {
      return function(eventName, handler, context) {
        eventName = eventName && eventName.toLowerCase();
        Eventful.prototype[method].call(this, eventName, handler, context);
      };
    }
    function MessageCenter() {
      Eventful.call(this);
    }
    MessageCenter.prototype.on = createRegisterEventWithLowercaseName('on');
    MessageCenter.prototype.off = createRegisterEventWithLowercaseName('off');
    MessageCenter.prototype.one = createRegisterEventWithLowercaseName('one');
    zrUtil.mixin(MessageCenter, Eventful);
    function ECharts(dom, theme, opts) {
      opts = opts || {};
      if (typeof theme === 'string') {
        theme = themeStorage[theme];
      }
      this.id;
      this.group;
      this._dom = dom;
      var zr = this._zr = zrender.init(dom, {
        renderer: opts.renderer || 'canvas',
        devicePixelRatio: opts.devicePixelRatio,
        width: opts.width,
        height: opts.height
      });
      this._throttledZrFlush = throttle.throttle(zrUtil.bind(zr.flush, zr), 17);
      this._theme = zrUtil.clone(theme);
      this._chartsViews = [];
      this._chartsMap = {};
      this._componentsViews = [];
      this._componentsMap = {};
      this._api = new ExtensionAPI(this);
      this._coordSysMgr = new CoordinateSystemManager();
      Eventful.call(this);
      this._messageCenter = new MessageCenter();
      this._initEvents();
      this.resize = zrUtil.bind(this.resize, this);
      this._pendingActions = [];
      function prioritySortFunc(a, b) {
        return a.prio - b.prio;
      }
      timsort(visualFuncs, prioritySortFunc);
      timsort(dataProcessorFuncs, prioritySortFunc);
      zr.animation.on('frame', this._onframe, this);
    }
    var echartsProto = ECharts.prototype;
    echartsProto._onframe = function() {
      if (this[OPTION_UPDATED]) {
        var silent = this[OPTION_UPDATED].silent;
        this[IN_MAIN_PROCESS] = true;
        updateMethods.prepareAndUpdate.call(this);
        this[IN_MAIN_PROCESS] = false;
        this[OPTION_UPDATED] = false;
        flushPendingActions.call(this, silent);
        triggerUpdatedEvent.call(this, silent);
      }
    };
    echartsProto.getDom = function() {
      return this._dom;
    };
    echartsProto.getZr = function() {
      return this._zr;
    };
    echartsProto.setOption = function(option, notMerge, lazyUpdate) {
      if (__DEV__) {
        zrUtil.assert(!this[IN_MAIN_PROCESS], '`setOption` should not be called during main process.');
      }
      var silent;
      if (zrUtil.isObject(notMerge)) {
        lazyUpdate = notMerge.lazyUpdate;
        silent = notMerge.silent;
        notMerge = notMerge.notMerge;
      }
      this[IN_MAIN_PROCESS] = true;
      if (!this._model || notMerge) {
        var optionManager = new OptionManager(this._api);
        var theme = this._theme;
        var ecModel = this._model = new GlobalModel(null, null, theme, optionManager);
        ecModel.init(null, null, theme, optionManager);
      }
      this.__lastOnlyGraphic = !!(option && option.graphic);
      zrUtil.each(option, function(o, mainType) {
        mainType !== 'graphic' && (this.__lastOnlyGraphic = false);
      }, this);
      this._model.setOption(option, optionPreprocessorFuncs);
      if (lazyUpdate) {
        this[OPTION_UPDATED] = {silent: silent};
        this[IN_MAIN_PROCESS] = false;
      } else {
        updateMethods.prepareAndUpdate.call(this);
        this._zr.flush();
        this[OPTION_UPDATED] = false;
        this[IN_MAIN_PROCESS] = false;
        flushPendingActions.call(this, silent);
        triggerUpdatedEvent.call(this, silent);
      }
    };
    echartsProto.setTheme = function() {
      console.log('ECharts#setTheme() is DEPRECATED in ECharts 3.0');
    };
    echartsProto.getModel = function() {
      return this._model;
    };
    echartsProto.getOption = function() {
      return this._model && this._model.getOption();
    };
    echartsProto.getWidth = function() {
      return this._zr.getWidth();
    };
    echartsProto.getHeight = function() {
      return this._zr.getHeight();
    };
    echartsProto.getRenderedCanvas = function(opts) {
      if (!env.canvasSupported) {
        return;
      }
      opts = opts || {};
      opts.pixelRatio = opts.pixelRatio || 1;
      opts.backgroundColor = opts.backgroundColor || this._model.get('backgroundColor');
      var zr = this._zr;
      var list = zr.storage.getDisplayList();
      zrUtil.each(list, function(el) {
        el.stopAnimation(true);
      });
      return zr.painter.getRenderedCanvas(opts);
    };
    echartsProto.getDataURL = function(opts) {
      opts = opts || {};
      var excludeComponents = opts.excludeComponents;
      var ecModel = this._model;
      var excludesComponentViews = [];
      var self = this;
      each(excludeComponents, function(componentType) {
        ecModel.eachComponent({mainType: componentType}, function(component) {
          var view = self._componentsMap[component.__viewId];
          if (!view.group.ignore) {
            excludesComponentViews.push(view);
            view.group.ignore = true;
          }
        });
      });
      var url = this.getRenderedCanvas(opts).toDataURL('image/' + (opts && opts.type || 'png'));
      each(excludesComponentViews, function(view) {
        view.group.ignore = false;
      });
      return url;
    };
    echartsProto.getConnectedDataURL = function(opts) {
      if (!env.canvasSupported) {
        return;
      }
      var groupId = this.group;
      var mathMin = Math.min;
      var mathMax = Math.max;
      var MAX_NUMBER = Infinity;
      if (connectedGroups[groupId]) {
        var left = MAX_NUMBER;
        var top = MAX_NUMBER;
        var right = -MAX_NUMBER;
        var bottom = -MAX_NUMBER;
        var canvasList = [];
        var dpr = (opts && opts.pixelRatio) || 1;
        zrUtil.each(instances, function(chart, id) {
          if (chart.group === groupId) {
            var canvas = chart.getRenderedCanvas(zrUtil.clone(opts));
            var boundingRect = chart.getDom().getBoundingClientRect();
            left = mathMin(boundingRect.left, left);
            top = mathMin(boundingRect.top, top);
            right = mathMax(boundingRect.right, right);
            bottom = mathMax(boundingRect.bottom, bottom);
            canvasList.push({
              dom: canvas,
              left: boundingRect.left,
              top: boundingRect.top
            });
          }
        });
        left *= dpr;
        top *= dpr;
        right *= dpr;
        bottom *= dpr;
        var width = right - left;
        var height = bottom - top;
        var targetCanvas = zrUtil.createCanvas();
        targetCanvas.width = width;
        targetCanvas.height = height;
        var zr = zrender.init(targetCanvas);
        each(canvasList, function(item) {
          var img = new graphic.Image({style: {
              x: item.left * dpr - left,
              y: item.top * dpr - top,
              image: item.dom
            }});
          zr.add(img);
        });
        zr.refreshImmediately();
        return targetCanvas.toDataURL('image/' + (opts && opts.type || 'png'));
      } else {
        return this.getDataURL(opts);
      }
    };
    echartsProto.convertToPixel = zrUtil.curry(doConvertPixel, 'convertToPixel');
    echartsProto.convertFromPixel = zrUtil.curry(doConvertPixel, 'convertFromPixel');
    function doConvertPixel(methodName, finder, value) {
      var ecModel = this._model;
      var coordSysList = this._coordSysMgr.getCoordinateSystems();
      var result;
      finder = modelUtil.parseFinder(ecModel, finder);
      for (var i = 0; i < coordSysList.length; i++) {
        var coordSys = coordSysList[i];
        if (coordSys[methodName] && (result = coordSys[methodName](ecModel, finder, value)) != null) {
          return result;
        }
      }
      if (__DEV__) {
        console.warn('No coordinate system that supports ' + methodName + ' found by the given finder.');
      }
    }
    echartsProto.containPixel = function(finder, value) {
      var ecModel = this._model;
      var result;
      finder = modelUtil.parseFinder(ecModel, finder);
      zrUtil.each(finder, function(models, key) {
        key.indexOf('Models') >= 0 && zrUtil.each(models, function(model) {
          var coordSys = model.coordinateSystem;
          if (coordSys && coordSys.containPoint) {
            result |= !!coordSys.containPoint(value);
          } else if (key === 'seriesModels') {
            var view = this._chartsMap[model.__viewId];
            if (view && view.containPoint) {
              result |= view.containPoint(value, model);
            } else {
              if (__DEV__) {
                console.warn(key + ': ' + (view ? 'The found component do not support containPoint.' : 'No view mapping to the found component.'));
              }
            }
          } else {
            if (__DEV__) {
              console.warn(key + ': containPoint is not supported');
            }
          }
        }, this);
      }, this);
      return !!result;
    };
    echartsProto.getVisual = function(finder, visualType) {
      var ecModel = this._model;
      finder = modelUtil.parseFinder(ecModel, finder, {defaultMainType: 'series'});
      var seriesModel = finder.seriesModel;
      if (__DEV__) {
        if (!seriesModel) {
          console.warn('There is no specified seires model');
        }
      }
      var data = seriesModel.getData();
      var dataIndexInside = finder.hasOwnProperty('dataIndexInside') ? finder.dataIndexInside : finder.hasOwnProperty('dataIndex') ? data.indexOfRawIndex(finder.dataIndex) : null;
      return dataIndexInside != null ? data.getItemVisual(dataIndexInside, visualType) : data.getVisual(visualType);
    };
    var updateMethods = {
      update: function(payload) {
        var ecModel = this._model;
        var api = this._api;
        var coordSysMgr = this._coordSysMgr;
        var zr = this._zr;
        if (!ecModel) {
          return;
        }
        ecModel.restoreData();
        coordSysMgr.create(this._model, this._api);
        processData.call(this, ecModel, api);
        stackSeriesData.call(this, ecModel);
        coordSysMgr.update(ecModel, api);
        doVisualEncoding.call(this, ecModel, payload);
        doRender.call(this, ecModel, payload);
        var backgroundColor = ecModel.get('backgroundColor') || 'transparent';
        var painter = zr.painter;
        if (painter.isSingleCanvas && painter.isSingleCanvas()) {
          zr.configLayer(0, {clearColor: backgroundColor});
        } else {
          if (!env.canvasSupported) {
            var colorArr = colorTool.parse(backgroundColor);
            backgroundColor = colorTool.stringify(colorArr, 'rgb');
            if (colorArr[3] === 0) {
              backgroundColor = 'transparent';
            }
          }
          if (backgroundColor.colorStops || backgroundColor.image) {
            zr.configLayer(0, {clearColor: backgroundColor});
            this[HAS_GRADIENT_OR_PATTERN_BG] = true;
            this._dom.style.background = 'transparent';
          } else {
            if (this[HAS_GRADIENT_OR_PATTERN_BG]) {
              zr.configLayer(0, {clearColor: null});
            }
            this[HAS_GRADIENT_OR_PATTERN_BG] = false;
            this._dom.style.background = backgroundColor;
          }
        }
      },
      updateView: function(payload) {
        var ecModel = this._model;
        if (!ecModel) {
          return;
        }
        ecModel.eachSeries(function(seriesModel) {
          seriesModel.getData().clearAllVisual();
        });
        doVisualEncoding.call(this, ecModel, payload);
        invokeUpdateMethod.call(this, 'updateView', ecModel, payload);
      },
      updateVisual: function(payload) {
        var ecModel = this._model;
        if (!ecModel) {
          return;
        }
        ecModel.eachSeries(function(seriesModel) {
          seriesModel.getData().clearAllVisual();
        });
        doVisualEncoding.call(this, ecModel, payload, true);
        invokeUpdateMethod.call(this, 'updateVisual', ecModel, payload);
      },
      updateLayout: function(payload) {
        var ecModel = this._model;
        if (!ecModel) {
          return;
        }
        doLayout.call(this, ecModel, payload);
        invokeUpdateMethod.call(this, 'updateLayout', ecModel, payload);
      },
      prepareAndUpdate: function(payload) {
        var ecModel = this._model;
        prepareView.call(this, 'component', ecModel);
        prepareView.call(this, 'chart', ecModel);
        if (this.__lastOnlyGraphic) {
          each(this._componentsViews, function(componentView) {
            var componentModel = componentView.__model;
            if (componentModel && componentModel.mainType === 'graphic') {
              componentView.render(componentModel, ecModel, this._api, payload);
              updateZ(componentModel, componentView);
            }
          }, this);
          this.__lastOnlyGraphic = false;
        } else {
          updateMethods.update.call(this, payload);
        }
      }
    };
    function updateDirectly(ecIns, method, payload, mainType, subType) {
      var ecModel = ecIns._model;
      var query = {};
      query[mainType + 'Id'] = payload[mainType + 'Id'];
      query[mainType + 'Index'] = payload[mainType + 'Index'];
      query[mainType + 'Name'] = payload[mainType + 'Name'];
      var condition = {
        mainType: mainType,
        query: query
      };
      subType && (condition.subType = subType);
      ecModel && ecModel.eachComponent(condition, function(model, index) {
        var view = ecIns[mainType === 'series' ? '_chartsMap' : '_componentsMap'][model.__viewId];
        if (view && view.__alive) {
          view[method](model, ecModel, ecIns._api, payload);
        }
      }, ecIns);
    }
    echartsProto.resize = function(opts) {
      if (__DEV__) {
        zrUtil.assert(!this[IN_MAIN_PROCESS], '`resize` should not be called during main process.');
      }
      this[IN_MAIN_PROCESS] = true;
      this._zr.resize(opts);
      var optionChanged = this._model && this._model.resetOption('media');
      var updateMethod = optionChanged ? 'prepareAndUpdate' : 'update';
      updateMethods[updateMethod].call(this);
      this._loadingFX && this._loadingFX.resize();
      this[IN_MAIN_PROCESS] = false;
      var silent = opts && opts.silent;
      flushPendingActions.call(this, silent);
      triggerUpdatedEvent.call(this, silent);
    };
    echartsProto.showLoading = function(name, cfg) {
      if (zrUtil.isObject(name)) {
        cfg = name;
        name = '';
      }
      name = name || 'default';
      this.hideLoading();
      if (!loadingEffects[name]) {
        if (__DEV__) {
          console.warn('Loading effects ' + name + ' not exists.');
        }
        return;
      }
      var el = loadingEffects[name](this._api, cfg);
      var zr = this._zr;
      this._loadingFX = el;
      zr.add(el);
    };
    echartsProto.hideLoading = function() {
      this._loadingFX && this._zr.remove(this._loadingFX);
      this._loadingFX = null;
    };
    echartsProto.makeActionFromEvent = function(eventObj) {
      var payload = zrUtil.extend({}, eventObj);
      payload.type = eventActionMap[eventObj.type];
      return payload;
    };
    echartsProto.dispatchAction = function(payload, opt) {
      if (!zrUtil.isObject(opt)) {
        opt = {silent: !!opt};
      }
      if (!actions[payload.type]) {
        return;
      }
      if (this[IN_MAIN_PROCESS]) {
        this._pendingActions.push(payload);
        return;
      }
      doDispatchAction.call(this, payload, opt.silent);
      if (opt.flush) {
        this._zr.flush(true);
      } else if (opt.flush !== false && env.browser.weChat) {
        this._throttledZrFlush();
      }
      flushPendingActions.call(this, opt.silent);
      triggerUpdatedEvent.call(this, opt.silent);
    };
    function doDispatchAction(payload, silent) {
      var payloadType = payload.type;
      var actionWrap = actions[payloadType];
      var actionInfo = actionWrap.actionInfo;
      var cptType = (actionInfo.update || 'update').split(':');
      var updateMethod = cptType.pop();
      cptType = cptType[0] && parseClassType(cptType[0]);
      this[IN_MAIN_PROCESS] = true;
      var payloads = [payload];
      var batched = false;
      if (payload.batch) {
        batched = true;
        payloads = zrUtil.map(payload.batch, function(item) {
          item = zrUtil.defaults(zrUtil.extend({}, item), payload);
          item.batch = null;
          return item;
        });
      }
      var eventObjBatch = [];
      var eventObj;
      var isHighDown = payloadType === 'highlight' || payloadType === 'downplay';
      for (var i = 0; i < payloads.length; i++) {
        var batchItem = payloads[i];
        eventObj = actionWrap.action(batchItem, this._model);
        eventObj = eventObj || zrUtil.extend({}, batchItem);
        eventObj.type = actionInfo.event || eventObj.type;
        eventObjBatch.push(eventObj);
        if (isHighDown) {
          updateDirectly(this, updateMethod, batchItem, 'series');
        } else if (cptType) {
          updateDirectly(this, updateMethod, batchItem, cptType.main, cptType.sub);
        }
      }
      if (updateMethod !== 'none' && !isHighDown && !cptType) {
        if (this[OPTION_UPDATED]) {
          updateMethods.prepareAndUpdate.call(this, payload);
          this[OPTION_UPDATED] = false;
        } else {
          updateMethods[updateMethod].call(this, payload);
        }
      }
      if (batched) {
        eventObj = {
          type: actionInfo.event || payloadType,
          batch: eventObjBatch
        };
      } else {
        eventObj = eventObjBatch[0];
      }
      this[IN_MAIN_PROCESS] = false;
      !silent && this._messageCenter.trigger(eventObj.type, eventObj);
    }
    function flushPendingActions(silent) {
      var pendingActions = this._pendingActions;
      while (pendingActions.length) {
        var payload = pendingActions.shift();
        doDispatchAction.call(this, payload, silent);
      }
    }
    function triggerUpdatedEvent(silent) {
      !silent && this.trigger('updated');
    }
    echartsProto.on = createRegisterEventWithLowercaseName('on');
    echartsProto.off = createRegisterEventWithLowercaseName('off');
    echartsProto.one = createRegisterEventWithLowercaseName('one');
    function invokeUpdateMethod(methodName, ecModel, payload) {
      var api = this._api;
      each(this._componentsViews, function(component) {
        var componentModel = component.__model;
        component[methodName](componentModel, ecModel, api, payload);
        updateZ(componentModel, component);
      }, this);
      ecModel.eachSeries(function(seriesModel, idx) {
        var chart = this._chartsMap[seriesModel.__viewId];
        chart[methodName](seriesModel, ecModel, api, payload);
        updateZ(seriesModel, chart);
        updateProgressiveAndBlend(seriesModel, chart);
      }, this);
      updateHoverLayerStatus(this._zr, ecModel);
    }
    function prepareView(type, ecModel) {
      var isComponent = type === 'component';
      var viewList = isComponent ? this._componentsViews : this._chartsViews;
      var viewMap = isComponent ? this._componentsMap : this._chartsMap;
      var zr = this._zr;
      for (var i = 0; i < viewList.length; i++) {
        viewList[i].__alive = false;
      }
      ecModel[isComponent ? 'eachComponent' : 'eachSeries'](function(componentType, model) {
        if (isComponent) {
          if (componentType === 'series') {
            return;
          }
        } else {
          model = componentType;
        }
        var viewId = model.id + '_' + model.type;
        var view = viewMap[viewId];
        if (!view) {
          var classType = parseClassType(model.type);
          var Clazz = isComponent ? ComponentView.getClass(classType.main, classType.sub) : ChartView.getClass(classType.sub);
          if (Clazz) {
            view = new Clazz();
            view.init(ecModel, this._api);
            viewMap[viewId] = view;
            viewList.push(view);
            zr.add(view.group);
          } else {
            return;
          }
        }
        model.__viewId = viewId;
        view.__alive = true;
        view.__id = viewId;
        view.__model = model;
      }, this);
      for (var i = 0; i < viewList.length; ) {
        var view = viewList[i];
        if (!view.__alive) {
          zr.remove(view.group);
          view.dispose(ecModel, this._api);
          viewList.splice(i, 1);
          delete viewMap[view.__id];
        } else {
          i++;
        }
      }
    }
    function processData(ecModel, api) {
      each(dataProcessorFuncs, function(process) {
        process.func(ecModel, api);
      });
    }
    function stackSeriesData(ecModel) {
      var stackedDataMap = {};
      ecModel.eachSeries(function(series) {
        var stack = series.get('stack');
        var data = series.getData();
        if (stack && data.type === 'list') {
          var previousStack = stackedDataMap[stack];
          if (previousStack) {
            data.stackedOn = previousStack;
          }
          stackedDataMap[stack] = data;
        }
      });
    }
    function doLayout(ecModel, payload) {
      var api = this._api;
      each(visualFuncs, function(visual) {
        if (visual.isLayout) {
          visual.func(ecModel, api, payload);
        }
      });
    }
    function doVisualEncoding(ecModel, payload, excludesLayout) {
      var api = this._api;
      ecModel.clearColorPalette();
      ecModel.eachSeries(function(seriesModel) {
        seriesModel.clearColorPalette();
      });
      each(visualFuncs, function(visual) {
        (!excludesLayout || !visual.isLayout) && visual.func(ecModel, api, payload);
      });
    }
    function doRender(ecModel, payload) {
      var api = this._api;
      each(this._componentsViews, function(componentView) {
        var componentModel = componentView.__model;
        componentView.render(componentModel, ecModel, api, payload);
        updateZ(componentModel, componentView);
      }, this);
      each(this._chartsViews, function(chart) {
        chart.__alive = false;
      }, this);
      ecModel.eachSeries(function(seriesModel, idx) {
        var chartView = this._chartsMap[seriesModel.__viewId];
        chartView.__alive = true;
        chartView.render(seriesModel, ecModel, api, payload);
        chartView.group.silent = !!seriesModel.get('silent');
        updateZ(seriesModel, chartView);
        updateProgressiveAndBlend(seriesModel, chartView);
      }, this);
      updateHoverLayerStatus(this._zr, ecModel);
      each(this._chartsViews, function(chart) {
        if (!chart.__alive) {
          chart.remove(ecModel, api);
        }
      }, this);
    }
    var MOUSE_EVENT_NAMES = ['click', 'dblclick', 'mouseover', 'mouseout', 'mousemove', 'mousedown', 'mouseup', 'globalout', 'contextmenu'];
    echartsProto._initEvents = function() {
      each(MOUSE_EVENT_NAMES, function(eveName) {
        this._zr.on(eveName, function(e) {
          var ecModel = this.getModel();
          var el = e.target;
          var params;
          if (eveName === 'globalout') {
            params = {};
          } else if (el && el.dataIndex != null) {
            var dataModel = el.dataModel || ecModel.getSeriesByIndex(el.seriesIndex);
            params = dataModel && dataModel.getDataParams(el.dataIndex, el.dataType) || {};
          } else if (el && el.eventData) {
            params = zrUtil.extend({}, el.eventData);
          }
          if (params) {
            params.event = e;
            params.type = eveName;
            this.trigger(eveName, params);
          }
        }, this);
      }, this);
      each(eventActionMap, function(actionType, eventType) {
        this._messageCenter.on(eventType, function(event) {
          this.trigger(eventType, event);
        }, this);
      }, this);
    };
    echartsProto.isDisposed = function() {
      return this._disposed;
    };
    echartsProto.clear = function() {
      this.setOption({series: []}, true);
    };
    echartsProto.dispose = function() {
      if (this._disposed) {
        if (__DEV__) {
          console.warn('Instance ' + this.id + ' has been disposed');
        }
        return;
      }
      this._disposed = true;
      var api = this._api;
      var ecModel = this._model;
      each(this._componentsViews, function(component) {
        component.dispose(ecModel, api);
      });
      each(this._chartsViews, function(chart) {
        chart.dispose(ecModel, api);
      });
      this._zr.dispose();
      delete instances[this.id];
    };
    zrUtil.mixin(ECharts, Eventful);
    function updateHoverLayerStatus(zr, ecModel) {
      var storage = zr.storage;
      var elCount = 0;
      storage.traverse(function(el) {
        if (!el.isGroup) {
          elCount++;
        }
      });
      if (elCount > ecModel.get('hoverLayerThreshold') && !env.node) {
        storage.traverse(function(el) {
          if (!el.isGroup) {
            el.useHoverLayer = true;
          }
        });
      }
    }
    function updateProgressiveAndBlend(seriesModel, chartView) {
      var elCount = 0;
      chartView.group.traverse(function(el) {
        if (el.type !== 'group' && !el.ignore) {
          elCount++;
        }
      });
      var frameDrawNum = +seriesModel.get('progressive');
      var needProgressive = elCount > seriesModel.get('progressiveThreshold') && frameDrawNum && !env.node;
      if (needProgressive) {
        chartView.group.traverse(function(el) {
          if (!el.isGroup) {
            el.progressive = needProgressive ? Math.floor(elCount++ / frameDrawNum) : -1;
            if (needProgressive) {
              el.stopAnimation(true);
            }
          }
        });
      }
      var blendMode = seriesModel.get('blendMode') || null;
      if (__DEV__) {
        if (!env.canvasSupported && blendMode && blendMode !== 'source-over') {
          console.warn('Only canvas support blendMode');
        }
      }
      chartView.group.traverse(function(el) {
        if (!el.isGroup) {
          el.setStyle('blend', blendMode);
        }
      });
    }
    function updateZ(model, view) {
      var z = model.get('z');
      var zlevel = model.get('zlevel');
      view.group.traverse(function(el) {
        if (el.type !== 'group') {
          z != null && (el.z = z);
          zlevel != null && (el.zlevel = zlevel);
        }
      });
    }
    var actions = [];
    var eventActionMap = {};
    var dataProcessorFuncs = [];
    var optionPreprocessorFuncs = [];
    var visualFuncs = [];
    var themeStorage = {};
    var loadingEffects = {};
    var instances = {};
    var connectedGroups = {};
    var idBase = new Date() - 0;
    var groupIdBase = new Date() - 0;
    var DOM_ATTRIBUTE_KEY = '_echarts_instance_';
    var echarts = {
      version: '3.4.0',
      dependencies: {zrender: '3.3.0'}
    };
    function enableConnect(chart) {
      var STATUS_PENDING = 0;
      var STATUS_UPDATING = 1;
      var STATUS_UPDATED = 2;
      var STATUS_KEY = '__connectUpdateStatus';
      function updateConnectedChartsStatus(charts, status) {
        for (var i = 0; i < charts.length; i++) {
          var otherChart = charts[i];
          otherChart[STATUS_KEY] = status;
        }
      }
      zrUtil.each(eventActionMap, function(actionType, eventType) {
        chart._messageCenter.on(eventType, function(event) {
          if (connectedGroups[chart.group] && chart[STATUS_KEY] !== STATUS_PENDING) {
            var action = chart.makeActionFromEvent(event);
            var otherCharts = [];
            zrUtil.each(instances, function(otherChart) {
              if (otherChart !== chart && otherChart.group === chart.group) {
                otherCharts.push(otherChart);
              }
            });
            updateConnectedChartsStatus(otherCharts, STATUS_PENDING);
            each(otherCharts, function(otherChart) {
              if (otherChart[STATUS_KEY] !== STATUS_UPDATING) {
                otherChart.dispatchAction(action);
              }
            });
            updateConnectedChartsStatus(otherCharts, STATUS_UPDATED);
          }
        });
      });
    }
    echarts.init = function(dom, theme, opts) {
      if (__DEV__) {
        if ((zrender.version.replace('.', '') - 0) < (echarts.dependencies.zrender.replace('.', '') - 0)) {
          throw new Error('ZRender ' + zrender.version + ' is too old for ECharts ' + echarts.version + '. Current version need ZRender ' + echarts.dependencies.zrender + '+');
        }
        if (!dom) {
          throw new Error('Initialize failed: invalid dom.');
        }
        if (zrUtil.isDom(dom) && dom.nodeName.toUpperCase() !== 'CANVAS' && (!dom.clientWidth || !dom.clientHeight)) {
          console.warn('Can\'t get dom width or height');
        }
      }
      var chart = new ECharts(dom, theme, opts);
      chart.id = 'ec_' + idBase++;
      instances[chart.id] = chart;
      dom.setAttribute && dom.setAttribute(DOM_ATTRIBUTE_KEY, chart.id);
      enableConnect(chart);
      return chart;
    };
    echarts.connect = function(groupId) {
      if (zrUtil.isArray(groupId)) {
        var charts = groupId;
        groupId = null;
        zrUtil.each(charts, function(chart) {
          if (chart.group != null) {
            groupId = chart.group;
          }
        });
        groupId = groupId || ('g_' + groupIdBase++);
        zrUtil.each(charts, function(chart) {
          chart.group = groupId;
        });
      }
      connectedGroups[groupId] = true;
      return groupId;
    };
    echarts.disConnect = function(groupId) {
      connectedGroups[groupId] = false;
    };
    echarts.dispose = function(chart) {
      if (zrUtil.isDom(chart)) {
        chart = echarts.getInstanceByDom(chart);
      } else if (typeof chart === 'string') {
        chart = instances[chart];
      }
      if ((chart instanceof ECharts) && !chart.isDisposed()) {
        chart.dispose();
      }
    };
    echarts.getInstanceByDom = function(dom) {
      var key = dom.getAttribute(DOM_ATTRIBUTE_KEY);
      return instances[key];
    };
    echarts.getInstanceById = function(key) {
      return instances[key];
    };
    echarts.registerTheme = function(name, theme) {
      themeStorage[name] = theme;
    };
    echarts.registerPreprocessor = function(preprocessorFunc) {
      optionPreprocessorFuncs.push(preprocessorFunc);
    };
    echarts.registerProcessor = function(priority, processorFunc) {
      if (typeof priority === 'function') {
        processorFunc = priority;
        priority = PRIORITY_PROCESSOR_FILTER;
      }
      if (__DEV__) {
        if (isNaN(priority)) {
          throw new Error('Unkown processor priority');
        }
      }
      dataProcessorFuncs.push({
        prio: priority,
        func: processorFunc
      });
    };
    echarts.registerAction = function(actionInfo, eventName, action) {
      if (typeof eventName === 'function') {
        action = eventName;
        eventName = '';
      }
      var actionType = zrUtil.isObject(actionInfo) ? actionInfo.type : ([actionInfo, actionInfo = {event: eventName}][0]);
      actionInfo.event = (actionInfo.event || actionType).toLowerCase();
      eventName = actionInfo.event;
      zrUtil.assert(ACTION_REG.test(actionType) && ACTION_REG.test(eventName));
      if (!actions[actionType]) {
        actions[actionType] = {
          action: action,
          actionInfo: actionInfo
        };
      }
      eventActionMap[eventName] = actionType;
    };
    echarts.registerCoordinateSystem = function(type, CoordinateSystem) {
      CoordinateSystemManager.register(type, CoordinateSystem);
    };
    echarts.registerLayout = function(priority, layoutFunc) {
      if (typeof priority === 'function') {
        layoutFunc = priority;
        priority = PRIORITY_VISUAL_LAYOUT;
      }
      if (__DEV__) {
        if (isNaN(priority)) {
          throw new Error('Unkown layout priority');
        }
      }
      visualFuncs.push({
        prio: priority,
        func: layoutFunc,
        isLayout: true
      });
    };
    echarts.registerVisual = function(priority, visualFunc) {
      if (typeof priority === 'function') {
        visualFunc = priority;
        priority = PRIORITY_VISUAL_CHART;
      }
      if (__DEV__) {
        if (isNaN(priority)) {
          throw new Error('Unkown visual priority');
        }
      }
      visualFuncs.push({
        prio: priority,
        func: visualFunc
      });
    };
    echarts.registerLoading = function(name, loadingFx) {
      loadingEffects[name] = loadingFx;
    };
    echarts.extendComponentModel = function(opts) {
      return ComponentModel.extend(opts);
    };
    echarts.extendComponentView = function(opts) {
      return ComponentView.extend(opts);
    };
    echarts.extendSeriesModel = function(opts) {
      return SeriesModel.extend(opts);
    };
    echarts.extendChartView = function(opts) {
      return ChartView.extend(opts);
    };
    echarts.setCanvasCreator = function(creator) {
      zrUtil.createCanvas = creator;
    };
    echarts.registerVisual(PRIORITY_VISUAL_GLOBAL, require('./visual/seriesColor'));
    echarts.registerPreprocessor(require('./preprocessor/backwardCompat'));
    echarts.registerLoading('default', require('./loading/default'));
    echarts.registerAction({
      type: 'highlight',
      event: 'highlight',
      update: 'highlight'
    }, zrUtil.noop);
    echarts.registerAction({
      type: 'downplay',
      event: 'downplay',
      update: 'downplay'
    }, zrUtil.noop);
    echarts.List = require('./data/List');
    echarts.Model = require('./model/Model');
    echarts.graphic = require('./util/graphic');
    echarts.number = require('./util/number');
    echarts.format = require('./util/format');
    echarts.throttle = throttle.throttle;
    echarts.matrix = require('zrender/core/matrix');
    echarts.vector = require('zrender/core/vector');
    echarts.color = require('zrender/tool/color');
    echarts.util = {};
    each(['map', 'each', 'filter', 'indexOf', 'inherits', 'reduce', 'filter', 'bind', 'curry', 'isArray', 'isString', 'isObject', 'isFunction', 'extend', 'defaults', 'clone'], function(name) {
      echarts.util[name] = zrUtil[name];
    });
    echarts.PRIORITY = {
      PROCESSOR: {
        FILTER: PRIORITY_PROCESSOR_FILTER,
        STATISTIC: PRIORITY_PROCESSOR_STATISTIC
      },
      VISUAL: {
        LAYOUT: PRIORITY_VISUAL_LAYOUT,
        GLOBAL: PRIORITY_VISUAL_GLOBAL,
        CHART: PRIORITY_VISUAL_CHART,
        COMPONENT: PRIORITY_VISUAL_COMPONENT,
        BRUSH: PRIORITY_VISUAL_BRUSH
      }
    };
    return echarts;
  });
})(require('process'));
