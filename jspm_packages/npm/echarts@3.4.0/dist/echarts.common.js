/* */ 
"format cjs";
(function(process) {
  (function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
      module.exports = factory();
    else if (typeof define === 'function' && define.amd)
      define([], factory);
    else if (typeof exports === 'object')
      exports["echarts"] = factory();
    else
      root["echarts"] = factory();
  })(this, function() {
    return (function(modules) {
      var installedModules = {};
      function __webpack_require__(moduleId) {
        if (installedModules[moduleId])
          return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
          exports: {},
          id: moduleId,
          loaded: false
        };
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.loaded = true;
        return module.exports;
      }
      __webpack_require__.m = modules;
      __webpack_require__.c = installedModules;
      __webpack_require__.p = "";
      return __webpack_require__(0);
    })([function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(1);
      __webpack_require__(100);
      __webpack_require__(134);
      __webpack_require__(141);
      __webpack_require__(150);
      __webpack_require__(292);
      __webpack_require__(299);
      __webpack_require__(293);
      __webpack_require__(113);
      __webpack_require__(328);
      __webpack_require__(358);
      __webpack_require__(364);
      __webpack_require__(367);
      __webpack_require__(329);
      __webpack_require__(379);
      __webpack_require__(391);
    }, function(module, exports, __webpack_require__) {
      if (false) {
        if (typeof window !== 'undefined') {
          window.__DEV__ = true;
        } else if (typeof global !== 'undefined') {
          global.__DEV__ = true;
        }
      }
      var env = __webpack_require__(2);
      var GlobalModel = __webpack_require__(3);
      var ExtensionAPI = __webpack_require__(25);
      var CoordinateSystemManager = __webpack_require__(26);
      var OptionManager = __webpack_require__(27);
      var ComponentModel = __webpack_require__(19);
      var SeriesModel = __webpack_require__(28);
      var ComponentView = __webpack_require__(29);
      var ChartView = __webpack_require__(42);
      var graphic = __webpack_require__(43);
      var modelUtil = __webpack_require__(5);
      var throttle = __webpack_require__(81);
      var zrender = __webpack_require__(82);
      var zrUtil = __webpack_require__(4);
      var colorTool = __webpack_require__(39);
      var Eventful = __webpack_require__(33);
      var timsort = __webpack_require__(86);
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
        if (true) {
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
        if (true) {
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
                if (true) {
                  console.warn(key + ': ' + (view ? 'The found component do not support containPoint.' : 'No view mapping to the found component.'));
                }
              }
            } else {
              if (true) {
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
        if (true) {
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
        if (true) {
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
          if (true) {
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
          if (true) {
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
        if (true) {
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
        if (true) {
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
        if (true) {
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
        if (true) {
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
        if (true) {
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
      echarts.registerVisual(PRIORITY_VISUAL_GLOBAL, __webpack_require__(94));
      echarts.registerPreprocessor(__webpack_require__(95));
      echarts.registerLoading('default', __webpack_require__(97));
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
      echarts.List = __webpack_require__(98);
      echarts.Model = __webpack_require__(12);
      echarts.graphic = __webpack_require__(43);
      echarts.number = __webpack_require__(7);
      echarts.format = __webpack_require__(6);
      echarts.throttle = throttle.throttle;
      echarts.matrix = __webpack_require__(11);
      echarts.vector = __webpack_require__(10);
      echarts.color = __webpack_require__(39);
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
      module.exports = echarts;
    }, function(module, exports) {
      var env = {};
      if (typeof navigator === 'undefined') {
        env = {
          browser: {},
          os: {},
          node: true,
          canvasSupported: true
        };
      } else {
        env = detect(navigator.userAgent);
      }
      module.exports = env;
      function detect(ua) {
        var os = {};
        var browser = {};
        var firefox = ua.match(/Firefox\/([\d.]+)/);
        var ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/.+?rv:(([\d.]+))/);
        var edge = ua.match(/Edge\/([\d.]+)/);
        var weChat = (/micromessenger/i).test(ua);
        if (firefox) {
          browser.firefox = true;
          browser.version = firefox[1];
        }
        if (ie) {
          browser.ie = true;
          browser.version = ie[1];
        }
        if (edge) {
          browser.edge = true;
          browser.version = edge[1];
        }
        if (weChat) {
          browser.weChat = true;
        }
        return {
          browser: browser,
          os: os,
          node: false,
          canvasSupported: document.createElement('canvas').getContext ? true : false,
          touchEventsSupported: 'ontouchstart' in window && !browser.ie && !browser.edge,
          pointerEventsSupported: 'onpointerdown' in window && (browser.edge || (browser.ie && browser.version >= 11))
        };
      }
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var modelUtil = __webpack_require__(5);
      var Model = __webpack_require__(12);
      var each = zrUtil.each;
      var filter = zrUtil.filter;
      var map = zrUtil.map;
      var isArray = zrUtil.isArray;
      var indexOf = zrUtil.indexOf;
      var isObject = zrUtil.isObject;
      var ComponentModel = __webpack_require__(19);
      var globalDefault = __webpack_require__(23);
      var OPTION_INNER_KEY = '\0_ec_inner';
      var GlobalModel = Model.extend({
        constructor: GlobalModel,
        init: function(option, parentModel, theme, optionManager) {
          theme = theme || {};
          this.option = null;
          this._theme = new Model(theme);
          this._optionManager = optionManager;
        },
        setOption: function(option, optionPreprocessorFuncs) {
          zrUtil.assert(!(OPTION_INNER_KEY in option), 'please use chart.getOption()');
          this._optionManager.setOption(option, optionPreprocessorFuncs);
          this.resetOption();
        },
        resetOption: function(type) {
          var optionChanged = false;
          var optionManager = this._optionManager;
          if (!type || type === 'recreate') {
            var baseOption = optionManager.mountOption(type === 'recreate');
            if (!this.option || type === 'recreate') {
              initBase.call(this, baseOption);
            } else {
              this.restoreData();
              this.mergeOption(baseOption);
            }
            optionChanged = true;
          }
          if (type === 'timeline' || type === 'media') {
            this.restoreData();
          }
          if (!type || type === 'recreate' || type === 'timeline') {
            var timelineOption = optionManager.getTimelineOption(this);
            timelineOption && (this.mergeOption(timelineOption), optionChanged = true);
          }
          if (!type || type === 'recreate' || type === 'media') {
            var mediaOptions = optionManager.getMediaOption(this, this._api);
            if (mediaOptions.length) {
              each(mediaOptions, function(mediaOption) {
                this.mergeOption(mediaOption, optionChanged = true);
              }, this);
            }
          }
          return optionChanged;
        },
        mergeOption: function(newOption) {
          var option = this.option;
          var componentsMap = this._componentsMap;
          var newCptTypes = [];
          each(newOption, function(componentOption, mainType) {
            if (componentOption == null) {
              return;
            }
            if (!ComponentModel.hasClass(mainType)) {
              option[mainType] = option[mainType] == null ? zrUtil.clone(componentOption) : zrUtil.merge(option[mainType], componentOption, true);
            } else {
              newCptTypes.push(mainType);
            }
          });
          ComponentModel.topologicalTravel(newCptTypes, ComponentModel.getAllClassMainTypes(), visitComponent, this);
          this._seriesIndices = this._seriesIndices || [];
          function visitComponent(mainType, dependencies) {
            var newCptOptionList = modelUtil.normalizeToArray(newOption[mainType]);
            var mapResult = modelUtil.mappingToExists(componentsMap[mainType], newCptOptionList);
            modelUtil.makeIdAndName(mapResult);
            each(mapResult, function(item, index) {
              var opt = item.option;
              if (isObject(opt)) {
                item.keyInfo.mainType = mainType;
                item.keyInfo.subType = determineSubType(mainType, opt, item.exist);
              }
            });
            var dependentModels = getComponentsByTypes(componentsMap, dependencies);
            option[mainType] = [];
            componentsMap[mainType] = [];
            each(mapResult, function(resultItem, index) {
              var componentModel = resultItem.exist;
              var newCptOption = resultItem.option;
              zrUtil.assert(isObject(newCptOption) || componentModel, 'Empty component definition');
              if (!newCptOption) {
                componentModel.mergeOption({}, this);
                componentModel.optionUpdated({}, false);
              } else {
                var ComponentModelClass = ComponentModel.getClass(mainType, resultItem.keyInfo.subType, true);
                if (componentModel && componentModel instanceof ComponentModelClass) {
                  componentModel.name = resultItem.keyInfo.name;
                  componentModel.mergeOption(newCptOption, this);
                  componentModel.optionUpdated(newCptOption, false);
                } else {
                  var extraOpt = zrUtil.extend({
                    dependentModels: dependentModels,
                    componentIndex: index
                  }, resultItem.keyInfo);
                  componentModel = new ComponentModelClass(newCptOption, this, this, extraOpt);
                  zrUtil.extend(componentModel, extraOpt);
                  componentModel.init(newCptOption, this, this, extraOpt);
                  componentModel.optionUpdated(null, true);
                }
              }
              componentsMap[mainType][index] = componentModel;
              option[mainType][index] = componentModel.option;
            }, this);
            if (mainType === 'series') {
              this._seriesIndices = createSeriesIndices(componentsMap.series);
            }
          }
        },
        getOption: function() {
          var option = zrUtil.clone(this.option);
          each(option, function(opts, mainType) {
            if (ComponentModel.hasClass(mainType)) {
              var opts = modelUtil.normalizeToArray(opts);
              for (var i = opts.length - 1; i >= 0; i--) {
                if (modelUtil.isIdInner(opts[i])) {
                  opts.splice(i, 1);
                }
              }
              option[mainType] = opts;
            }
          });
          delete option[OPTION_INNER_KEY];
          return option;
        },
        getTheme: function() {
          return this._theme;
        },
        getComponent: function(mainType, idx) {
          var list = this._componentsMap[mainType];
          if (list) {
            return list[idx || 0];
          }
        },
        queryComponents: function(condition) {
          var mainType = condition.mainType;
          if (!mainType) {
            return [];
          }
          var index = condition.index;
          var id = condition.id;
          var name = condition.name;
          var cpts = this._componentsMap[mainType];
          if (!cpts || !cpts.length) {
            return [];
          }
          var result;
          if (index != null) {
            if (!isArray(index)) {
              index = [index];
            }
            result = filter(map(index, function(idx) {
              return cpts[idx];
            }), function(val) {
              return !!val;
            });
          } else if (id != null) {
            var isIdArray = isArray(id);
            result = filter(cpts, function(cpt) {
              return (isIdArray && indexOf(id, cpt.id) >= 0) || (!isIdArray && cpt.id === id);
            });
          } else if (name != null) {
            var isNameArray = isArray(name);
            result = filter(cpts, function(cpt) {
              return (isNameArray && indexOf(name, cpt.name) >= 0) || (!isNameArray && cpt.name === name);
            });
          } else {
            result = cpts;
          }
          return filterBySubType(result, condition);
        },
        findComponents: function(condition) {
          var query = condition.query;
          var mainType = condition.mainType;
          var queryCond = getQueryCond(query);
          var result = queryCond ? this.queryComponents(queryCond) : this._componentsMap[mainType];
          return doFilter(filterBySubType(result, condition));
          function getQueryCond(q) {
            var indexAttr = mainType + 'Index';
            var idAttr = mainType + 'Id';
            var nameAttr = mainType + 'Name';
            return q && (q[indexAttr] != null || q[idAttr] != null || q[nameAttr] != null) ? {
              mainType: mainType,
              index: q[indexAttr],
              id: q[idAttr],
              name: q[nameAttr]
            } : null;
          }
          function doFilter(res) {
            return condition.filter ? filter(res, condition.filter) : res;
          }
        },
        eachComponent: function(mainType, cb, context) {
          var componentsMap = this._componentsMap;
          if (typeof mainType === 'function') {
            context = cb;
            cb = mainType;
            each(componentsMap, function(components, componentType) {
              each(components, function(component, index) {
                cb.call(context, componentType, component, index);
              });
            });
          } else if (zrUtil.isString(mainType)) {
            each(componentsMap[mainType], cb, context);
          } else if (isObject(mainType)) {
            var queryResult = this.findComponents(mainType);
            each(queryResult, cb, context);
          }
        },
        getSeriesByName: function(name) {
          var series = this._componentsMap.series;
          return filter(series, function(oneSeries) {
            return oneSeries.name === name;
          });
        },
        getSeriesByIndex: function(seriesIndex) {
          return this._componentsMap.series[seriesIndex];
        },
        getSeriesByType: function(subType) {
          var series = this._componentsMap.series;
          return filter(series, function(oneSeries) {
            return oneSeries.subType === subType;
          });
        },
        getSeries: function() {
          return this._componentsMap.series.slice();
        },
        eachSeries: function(cb, context) {
          assertSeriesInitialized(this);
          each(this._seriesIndices, function(rawSeriesIndex) {
            var series = this._componentsMap.series[rawSeriesIndex];
            cb.call(context, series, rawSeriesIndex);
          }, this);
        },
        eachRawSeries: function(cb, context) {
          each(this._componentsMap.series, cb, context);
        },
        eachSeriesByType: function(subType, cb, context) {
          assertSeriesInitialized(this);
          each(this._seriesIndices, function(rawSeriesIndex) {
            var series = this._componentsMap.series[rawSeriesIndex];
            if (series.subType === subType) {
              cb.call(context, series, rawSeriesIndex);
            }
          }, this);
        },
        eachRawSeriesByType: function(subType, cb, context) {
          return each(this.getSeriesByType(subType), cb, context);
        },
        isSeriesFiltered: function(seriesModel) {
          assertSeriesInitialized(this);
          return zrUtil.indexOf(this._seriesIndices, seriesModel.componentIndex) < 0;
        },
        filterSeries: function(cb, context) {
          assertSeriesInitialized(this);
          var filteredSeries = filter(this._componentsMap.series, cb, context);
          this._seriesIndices = createSeriesIndices(filteredSeries);
        },
        restoreData: function() {
          var componentsMap = this._componentsMap;
          this._seriesIndices = createSeriesIndices(componentsMap.series);
          var componentTypes = [];
          each(componentsMap, function(components, componentType) {
            componentTypes.push(componentType);
          });
          ComponentModel.topologicalTravel(componentTypes, ComponentModel.getAllClassMainTypes(), function(componentType, dependencies) {
            each(componentsMap[componentType], function(component) {
              component.restoreData();
            });
          });
        }
      });
      function mergeTheme(option, theme) {
        zrUtil.each(theme, function(themeItem, name) {
          if (!ComponentModel.hasClass(name)) {
            if (typeof themeItem === 'object') {
              option[name] = !option[name] ? zrUtil.clone(themeItem) : zrUtil.merge(option[name], themeItem, false);
            } else {
              if (option[name] == null) {
                option[name] = themeItem;
              }
            }
          }
        });
      }
      function initBase(baseOption) {
        baseOption = baseOption;
        this.option = {};
        this.option[OPTION_INNER_KEY] = 1;
        this._componentsMap = {};
        this._seriesIndices = null;
        mergeTheme(baseOption, this._theme.option);
        zrUtil.merge(baseOption, globalDefault, false);
        this.mergeOption(baseOption);
      }
      function getComponentsByTypes(componentsMap, types) {
        if (!zrUtil.isArray(types)) {
          types = types ? [types] : [];
        }
        var ret = {};
        each(types, function(type) {
          ret[type] = (componentsMap[type] || []).slice();
        });
        return ret;
      }
      function determineSubType(mainType, newCptOption, existComponent) {
        var subType = newCptOption.type ? newCptOption.type : existComponent ? existComponent.subType : ComponentModel.determineSubType(mainType, newCptOption);
        return subType;
      }
      function createSeriesIndices(seriesModels) {
        return map(seriesModels, function(series) {
          return series.componentIndex;
        }) || [];
      }
      function filterBySubType(components, condition) {
        return condition.hasOwnProperty('subType') ? filter(components, function(cpt) {
          return cpt.subType === condition.subType;
        }) : components;
      }
      function assertSeriesInitialized(ecModel) {
        if (true) {
          if (!ecModel._seriesIndices) {
            throw new Error('Series has not been initialized yet.');
          }
        }
      }
      zrUtil.mixin(GlobalModel, __webpack_require__(24));
      module.exports = GlobalModel;
    }, function(module, exports) {
      var BUILTIN_OBJECT = {
        '[object Function]': 1,
        '[object RegExp]': 1,
        '[object Date]': 1,
        '[object Error]': 1,
        '[object CanvasGradient]': 1,
        '[object CanvasPattern]': 1,
        '[object Image]': 1,
        '[object Canvas]': 1
      };
      var TYPED_ARRAY = {
        '[object Int8Array]': 1,
        '[object Uint8Array]': 1,
        '[object Uint8ClampedArray]': 1,
        '[object Int16Array]': 1,
        '[object Uint16Array]': 1,
        '[object Int32Array]': 1,
        '[object Uint32Array]': 1,
        '[object Float32Array]': 1,
        '[object Float64Array]': 1
      };
      var objToString = Object.prototype.toString;
      var arrayProto = Array.prototype;
      var nativeForEach = arrayProto.forEach;
      var nativeFilter = arrayProto.filter;
      var nativeSlice = arrayProto.slice;
      var nativeMap = arrayProto.map;
      var nativeReduce = arrayProto.reduce;
      function clone(source) {
        if (source == null || typeof source != 'object') {
          return source;
        }
        var result = source;
        var typeStr = objToString.call(source);
        if (typeStr === '[object Array]') {
          result = [];
          for (var i = 0,
              len = source.length; i < len; i++) {
            result[i] = clone(source[i]);
          }
        } else if (TYPED_ARRAY[typeStr]) {
          result = source.constructor.from(source);
        } else if (!BUILTIN_OBJECT[typeStr] && !isDom(source)) {
          result = {};
          for (var key in source) {
            if (source.hasOwnProperty(key)) {
              result[key] = clone(source[key]);
            }
          }
        }
        return result;
      }
      function merge(target, source, overwrite) {
        if (!isObject(source) || !isObject(target)) {
          return overwrite ? clone(source) : target;
        }
        for (var key in source) {
          if (source.hasOwnProperty(key)) {
            var targetProp = target[key];
            var sourceProp = source[key];
            if (isObject(sourceProp) && isObject(targetProp) && !isArray(sourceProp) && !isArray(targetProp) && !isDom(sourceProp) && !isDom(targetProp) && !isBuildInObject(sourceProp) && !isBuildInObject(targetProp)) {
              merge(targetProp, sourceProp, overwrite);
            } else if (overwrite || !(key in target)) {
              target[key] = clone(source[key], true);
            }
          }
        }
        return target;
      }
      function mergeAll(targetAndSources, overwrite) {
        var result = targetAndSources[0];
        for (var i = 1,
            len = targetAndSources.length; i < len; i++) {
          result = merge(result, targetAndSources[i], overwrite);
        }
        return result;
      }
      function extend(target, source) {
        for (var key in source) {
          if (source.hasOwnProperty(key)) {
            target[key] = source[key];
          }
        }
        return target;
      }
      function defaults(target, source, overlay) {
        for (var key in source) {
          if (source.hasOwnProperty(key) && (overlay ? source[key] != null : target[key] == null)) {
            target[key] = source[key];
          }
        }
        return target;
      }
      function createCanvas() {
        return document.createElement('canvas');
      }
      var _ctx;
      function getContext() {
        if (!_ctx) {
          _ctx = util.createCanvas().getContext('2d');
        }
        return _ctx;
      }
      function indexOf(array, value) {
        if (array) {
          if (array.indexOf) {
            return array.indexOf(value);
          }
          for (var i = 0,
              len = array.length; i < len; i++) {
            if (array[i] === value) {
              return i;
            }
          }
        }
        return -1;
      }
      function inherits(clazz, baseClazz) {
        var clazzPrototype = clazz.prototype;
        function F() {}
        F.prototype = baseClazz.prototype;
        clazz.prototype = new F();
        for (var prop in clazzPrototype) {
          clazz.prototype[prop] = clazzPrototype[prop];
        }
        clazz.prototype.constructor = clazz;
        clazz.superClass = baseClazz;
      }
      function mixin(target, source, overlay) {
        target = 'prototype' in target ? target.prototype : target;
        source = 'prototype' in source ? source.prototype : source;
        defaults(target, source, overlay);
      }
      function isArrayLike(data) {
        if (!data) {
          return;
        }
        if (typeof data == 'string') {
          return false;
        }
        return typeof data.length == 'number';
      }
      function each(obj, cb, context) {
        if (!(obj && cb)) {
          return;
        }
        if (obj.forEach && obj.forEach === nativeForEach) {
          obj.forEach(cb, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0,
              len = obj.length; i < len; i++) {
            cb.call(context, obj[i], i, obj);
          }
        } else {
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              cb.call(context, obj[key], key, obj);
            }
          }
        }
      }
      function map(obj, cb, context) {
        if (!(obj && cb)) {
          return;
        }
        if (obj.map && obj.map === nativeMap) {
          return obj.map(cb, context);
        } else {
          var result = [];
          for (var i = 0,
              len = obj.length; i < len; i++) {
            result.push(cb.call(context, obj[i], i, obj));
          }
          return result;
        }
      }
      function reduce(obj, cb, memo, context) {
        if (!(obj && cb)) {
          return;
        }
        if (obj.reduce && obj.reduce === nativeReduce) {
          return obj.reduce(cb, memo, context);
        } else {
          for (var i = 0,
              len = obj.length; i < len; i++) {
            memo = cb.call(context, memo, obj[i], i, obj);
          }
          return memo;
        }
      }
      function filter(obj, cb, context) {
        if (!(obj && cb)) {
          return;
        }
        if (obj.filter && obj.filter === nativeFilter) {
          return obj.filter(cb, context);
        } else {
          var result = [];
          for (var i = 0,
              len = obj.length; i < len; i++) {
            if (cb.call(context, obj[i], i, obj)) {
              result.push(obj[i]);
            }
          }
          return result;
        }
      }
      function find(obj, cb, context) {
        if (!(obj && cb)) {
          return;
        }
        for (var i = 0,
            len = obj.length; i < len; i++) {
          if (cb.call(context, obj[i], i, obj)) {
            return obj[i];
          }
        }
      }
      function bind(func, context) {
        var args = nativeSlice.call(arguments, 2);
        return function() {
          return func.apply(context, args.concat(nativeSlice.call(arguments)));
        };
      }
      function curry(func) {
        var args = nativeSlice.call(arguments, 1);
        return function() {
          return func.apply(this, args.concat(nativeSlice.call(arguments)));
        };
      }
      function isArray(value) {
        return objToString.call(value) === '[object Array]';
      }
      function isFunction(value) {
        return typeof value === 'function';
      }
      function isString(value) {
        return objToString.call(value) === '[object String]';
      }
      function isObject(value) {
        var type = typeof value;
        return type === 'function' || (!!value && type == 'object');
      }
      function isBuildInObject(value) {
        return !!BUILTIN_OBJECT[objToString.call(value)];
      }
      function isDom(value) {
        return typeof value === 'object' && typeof value.nodeType === 'number' && typeof value.ownerDocument === 'object';
      }
      function eqNaN(value) {
        return value !== value;
      }
      function retrieve(values) {
        for (var i = 0,
            len = arguments.length; i < len; i++) {
          if (arguments[i] != null) {
            return arguments[i];
          }
        }
      }
      function slice() {
        return Function.call.apply(nativeSlice, arguments);
      }
      function assert(condition, message) {
        if (!condition) {
          throw new Error(message);
        }
      }
      var util = {
        inherits: inherits,
        mixin: mixin,
        clone: clone,
        merge: merge,
        mergeAll: mergeAll,
        extend: extend,
        defaults: defaults,
        getContext: getContext,
        createCanvas: createCanvas,
        indexOf: indexOf,
        slice: slice,
        find: find,
        isArrayLike: isArrayLike,
        each: each,
        map: map,
        reduce: reduce,
        filter: filter,
        bind: bind,
        curry: curry,
        isArray: isArray,
        isString: isString,
        isObject: isObject,
        isFunction: isFunction,
        isBuildInObject: isBuildInObject,
        isDom: isDom,
        eqNaN: eqNaN,
        retrieve: retrieve,
        assert: assert,
        noop: function() {}
      };
      module.exports = util;
    }, function(module, exports, __webpack_require__) {
      var formatUtil = __webpack_require__(6);
      var nubmerUtil = __webpack_require__(7);
      var Model = __webpack_require__(12);
      var zrUtil = __webpack_require__(4);
      var each = zrUtil.each;
      var isObject = zrUtil.isObject;
      var modelUtil = {};
      modelUtil.normalizeToArray = function(value) {
        return value instanceof Array ? value : value == null ? [] : [value];
      };
      modelUtil.defaultEmphasis = function(opt, subOpts) {
        if (opt) {
          var emphasisOpt = opt.emphasis = opt.emphasis || {};
          var normalOpt = opt.normal = opt.normal || {};
          each(subOpts, function(subOptName) {
            var val = zrUtil.retrieve(emphasisOpt[subOptName], normalOpt[subOptName]);
            if (val != null) {
              emphasisOpt[subOptName] = val;
            }
          });
        }
      };
      modelUtil.LABEL_OPTIONS = ['position', 'offset', 'show', 'textStyle', 'distance', 'formatter'];
      modelUtil.getDataItemValue = function(dataItem) {
        return dataItem && (dataItem.value == null ? dataItem : dataItem.value);
      };
      modelUtil.isDataItemOption = function(dataItem) {
        return isObject(dataItem) && !(dataItem instanceof Array);
      };
      modelUtil.converDataValue = function(value, dimInfo) {
        var dimType = dimInfo && dimInfo.type;
        if (dimType === 'ordinal') {
          return value;
        }
        if (dimType === 'time' && !isFinite(value) && value != null && value !== '-') {
          value = +nubmerUtil.parseDate(value);
        }
        return (value == null || value === '') ? NaN : +value;
      };
      modelUtil.createDataFormatModel = function(data, opt) {
        var model = new Model();
        zrUtil.mixin(model, modelUtil.dataFormatMixin);
        model.seriesIndex = opt.seriesIndex;
        model.name = opt.name || '';
        model.mainType = opt.mainType;
        model.subType = opt.subType;
        model.getData = function() {
          return data;
        };
        return model;
      };
      modelUtil.dataFormatMixin = {
        getDataParams: function(dataIndex, dataType) {
          var data = this.getData(dataType);
          var seriesIndex = this.seriesIndex;
          var seriesName = this.name;
          var rawValue = this.getRawValue(dataIndex, dataType);
          var rawDataIndex = data.getRawIndex(dataIndex);
          var name = data.getName(dataIndex, true);
          var itemOpt = data.getRawDataItem(dataIndex);
          return {
            componentType: this.mainType,
            componentSubType: this.subType,
            seriesType: this.mainType === 'series' ? this.subType : null,
            seriesIndex: seriesIndex,
            seriesName: seriesName,
            name: name,
            dataIndex: rawDataIndex,
            data: itemOpt,
            dataType: dataType,
            value: rawValue,
            color: data.getItemVisual(dataIndex, 'color'),
            $vars: ['seriesName', 'name', 'value']
          };
        },
        getFormattedLabel: function(dataIndex, status, dataType, dimIndex) {
          status = status || 'normal';
          var data = this.getData(dataType);
          var itemModel = data.getItemModel(dataIndex);
          var params = this.getDataParams(dataIndex, dataType);
          if (dimIndex != null && (params.value instanceof Array)) {
            params.value = params.value[dimIndex];
          }
          var formatter = itemModel.get(['label', status, 'formatter']);
          if (typeof formatter === 'function') {
            params.status = status;
            return formatter(params);
          } else if (typeof formatter === 'string') {
            return formatUtil.formatTpl(formatter, params);
          }
        },
        getRawValue: function(idx, dataType) {
          var data = this.getData(dataType);
          var dataItem = data.getRawDataItem(idx);
          if (dataItem != null) {
            return (isObject(dataItem) && !(dataItem instanceof Array)) ? dataItem.value : dataItem;
          }
        },
        formatTooltip: zrUtil.noop
      };
      modelUtil.mappingToExists = function(exists, newCptOptions) {
        newCptOptions = (newCptOptions || []).slice();
        var result = zrUtil.map(exists || [], function(obj, index) {
          return {exist: obj};
        });
        each(newCptOptions, function(cptOption, index) {
          if (!isObject(cptOption)) {
            return;
          }
          for (var i = 0; i < result.length; i++) {
            if (!result[i].option && cptOption.id != null && result[i].exist.id === cptOption.id + '') {
              result[i].option = cptOption;
              newCptOptions[index] = null;
              return;
            }
          }
          for (var i = 0; i < result.length; i++) {
            var exist = result[i].exist;
            if (!result[i].option && (exist.id == null || cptOption.id == null) && cptOption.name != null && !modelUtil.isIdInner(cptOption) && !modelUtil.isIdInner(exist) && exist.name === cptOption.name + '') {
              result[i].option = cptOption;
              newCptOptions[index] = null;
              return;
            }
          }
        });
        each(newCptOptions, function(cptOption, index) {
          if (!isObject(cptOption)) {
            return;
          }
          var i = 0;
          for (; i < result.length; i++) {
            var exist = result[i].exist;
            if (!result[i].option && !modelUtil.isIdInner(exist) && cptOption.id == null) {
              result[i].option = cptOption;
              break;
            }
          }
          if (i >= result.length) {
            result.push({option: cptOption});
          }
        });
        return result;
      };
      modelUtil.makeIdAndName = function(mapResult) {
        var idMap = {};
        each(mapResult, function(item, index) {
          var existCpt = item.exist;
          existCpt && (idMap[existCpt.id] = item);
        });
        each(mapResult, function(item, index) {
          var opt = item.option;
          zrUtil.assert(!opt || opt.id == null || !idMap[opt.id] || idMap[opt.id] === item, 'id duplicates: ' + (opt && opt.id));
          opt && opt.id != null && (idMap[opt.id] = item);
          !item.keyInfo && (item.keyInfo = {});
        });
        each(mapResult, function(item, index) {
          var existCpt = item.exist;
          var opt = item.option;
          var keyInfo = item.keyInfo;
          if (!isObject(opt)) {
            return;
          }
          keyInfo.name = opt.name != null ? opt.name + '' : existCpt ? existCpt.name : '\0-';
          if (existCpt) {
            keyInfo.id = existCpt.id;
          } else if (opt.id != null) {
            keyInfo.id = opt.id + '';
          } else {
            var idNum = 0;
            do {
              keyInfo.id = '\0' + keyInfo.name + '\0' + idNum++;
            } while (idMap[keyInfo.id]);
          }
          idMap[keyInfo.id] = item;
        });
      };
      modelUtil.isIdInner = function(cptOption) {
        return isObject(cptOption) && cptOption.id && (cptOption.id + '').indexOf('\0_ec_\0') === 0;
      };
      modelUtil.compressBatches = function(batchA, batchB) {
        var mapA = {};
        var mapB = {};
        makeMap(batchA || [], mapA);
        makeMap(batchB || [], mapB, mapA);
        return [mapToArray(mapA), mapToArray(mapB)];
        function makeMap(sourceBatch, map, otherMap) {
          for (var i = 0,
              len = sourceBatch.length; i < len; i++) {
            var seriesId = sourceBatch[i].seriesId;
            var dataIndices = modelUtil.normalizeToArray(sourceBatch[i].dataIndex);
            var otherDataIndices = otherMap && otherMap[seriesId];
            for (var j = 0,
                lenj = dataIndices.length; j < lenj; j++) {
              var dataIndex = dataIndices[j];
              if (otherDataIndices && otherDataIndices[dataIndex]) {
                otherDataIndices[dataIndex] = null;
              } else {
                (map[seriesId] || (map[seriesId] = {}))[dataIndex] = 1;
              }
            }
          }
        }
        function mapToArray(map, isData) {
          var result = [];
          for (var i in map) {
            if (map.hasOwnProperty(i) && map[i] != null) {
              if (isData) {
                result.push(+i);
              } else {
                var dataIndices = mapToArray(map[i], true);
                dataIndices.length && result.push({
                  seriesId: i,
                  dataIndex: dataIndices
                });
              }
            }
          }
          return result;
        }
      };
      modelUtil.queryDataIndex = function(data, payload) {
        if (payload.dataIndexInside != null) {
          return payload.dataIndexInside;
        } else if (payload.dataIndex != null) {
          return zrUtil.isArray(payload.dataIndex) ? zrUtil.map(payload.dataIndex, function(value) {
            return data.indexOfRawIndex(value);
          }) : data.indexOfRawIndex(payload.dataIndex);
        } else if (payload.name != null) {
          return zrUtil.isArray(payload.name) ? zrUtil.map(payload.name, function(value) {
            return data.indexOfName(value);
          }) : data.indexOfName(payload.name);
        }
      };
      modelUtil.parseFinder = function(ecModel, finder, opt) {
        if (zrUtil.isString(finder)) {
          var obj = {};
          obj[finder + 'Index'] = 0;
          finder = obj;
        }
        var defaultMainType = opt && opt.defaultMainType;
        if (defaultMainType && !has(finder, defaultMainType + 'Index') && !has(finder, defaultMainType + 'Id') && !has(finder, defaultMainType + 'Name')) {
          finder[defaultMainType + 'Index'] = 0;
        }
        var result = {};
        each(finder, function(value, key) {
          var value = finder[key];
          if (key === 'dataIndex' || key === 'dataIndexInside') {
            result[key] = value;
            return;
          }
          var parsedKey = key.match(/^(\w+)(Index|Id|Name)$/) || [];
          var mainType = parsedKey[1];
          var queryType = parsedKey[2];
          if (!mainType || !queryType) {
            return;
          }
          var queryParam = {mainType: mainType};
          queryParam[queryType.toLowerCase()] = value;
          var models = ecModel.queryComponents(queryParam);
          result[mainType + 'Models'] = models;
          result[mainType + 'Model'] = models[0];
        });
        return result;
      };
      function has(obj, prop) {
        return obj && obj.hasOwnProperty(prop);
      }
      module.exports = modelUtil;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var textContain = __webpack_require__(8);
      var formatUtil = {};
      formatUtil.addCommas = function(x) {
        if (isNaN(x)) {
          return '-';
        }
        x = (x + '').split('.');
        return x[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,') + (x.length > 1 ? ('.' + x[1]) : '');
      };
      formatUtil.toCamelCase = function(str, upperCaseFirst) {
        str = (str || '').toLowerCase().replace(/-(.)/g, function(match, group1) {
          return group1.toUpperCase();
        });
        if (upperCaseFirst && str) {
          str = str.charAt(0).toUpperCase() + str.slice(1);
        }
        return str;
      };
      formatUtil.normalizeCssArray = function(val) {
        var len = val.length;
        if (typeof(val) === 'number') {
          return [val, val, val, val];
        } else if (len === 2) {
          return [val[0], val[1], val[0], val[1]];
        } else if (len === 3) {
          return [val[0], val[1], val[2], val[1]];
        }
        return val;
      };
      var encodeHTML = formatUtil.encodeHTML = function(source) {
        return String(source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      };
      var TPL_VAR_ALIAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      var wrapVar = function(varName, seriesIdx) {
        return '{' + varName + (seriesIdx == null ? '' : seriesIdx) + '}';
      };
      formatUtil.formatTpl = function(tpl, paramsList, encode) {
        if (!zrUtil.isArray(paramsList)) {
          paramsList = [paramsList];
        }
        var seriesLen = paramsList.length;
        if (!seriesLen) {
          return '';
        }
        var $vars = paramsList[0].$vars || [];
        for (var i = 0; i < $vars.length; i++) {
          var alias = TPL_VAR_ALIAS[i];
          var val = wrapVar(alias, 0);
          tpl = tpl.replace(wrapVar(alias), encode ? encodeHTML(val) : val);
        }
        for (var seriesIdx = 0; seriesIdx < seriesLen; seriesIdx++) {
          for (var k = 0; k < $vars.length; k++) {
            var val = paramsList[seriesIdx][$vars[k]];
            tpl = tpl.replace(wrapVar(TPL_VAR_ALIAS[k], seriesIdx), encode ? encodeHTML(val) : val);
          }
        }
        return tpl;
      };
      var s2d = function(str) {
        return str < 10 ? ('0' + str) : str;
      };
      formatUtil.formatTime = function(tpl, value) {
        if (tpl === 'week' || tpl === 'month' || tpl === 'quarter' || tpl === 'half-year' || tpl === 'year') {
          tpl = 'MM-dd\nyyyy';
        }
        var date = numberUtil.parseDate(value);
        var y = date.getFullYear();
        var M = date.getMonth() + 1;
        var d = date.getDate();
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        tpl = tpl.replace('MM', s2d(M)).toLowerCase().replace('yyyy', y).replace('yy', y % 100).replace('dd', s2d(d)).replace('d', d).replace('hh', s2d(h)).replace('h', h).replace('mm', s2d(m)).replace('m', m).replace('ss', s2d(s)).replace('s', s);
        return tpl;
      };
      formatUtil.capitalFirst = function(str) {
        return str ? str.charAt(0).toUpperCase() + str.substr(1) : str;
      };
      formatUtil.truncateText = textContain.truncateText;
      module.exports = formatUtil;
    }, function(module, exports) {
      var number = {};
      var RADIAN_EPSILON = 1e-4;
      function _trim(str) {
        return str.replace(/^\s+/, '').replace(/\s+$/, '');
      }
      number.linearMap = function(val, domain, range, clamp) {
        var subDomain = domain[1] - domain[0];
        var subRange = range[1] - range[0];
        if (subDomain === 0) {
          return subRange === 0 ? range[0] : (range[0] + range[1]) / 2;
        }
        if (clamp) {
          if (subDomain > 0) {
            if (val <= domain[0]) {
              return range[0];
            } else if (val >= domain[1]) {
              return range[1];
            }
          } else {
            if (val >= domain[0]) {
              return range[0];
            } else if (val <= domain[1]) {
              return range[1];
            }
          }
        } else {
          if (val === domain[0]) {
            return range[0];
          }
          if (val === domain[1]) {
            return range[1];
          }
        }
        return (val - domain[0]) / subDomain * subRange + range[0];
      };
      number.parsePercent = function(percent, all) {
        switch (percent) {
          case 'center':
          case 'middle':
            percent = '50%';
            break;
          case 'left':
          case 'top':
            percent = '0%';
            break;
          case 'right':
          case 'bottom':
            percent = '100%';
            break;
        }
        if (typeof percent === 'string') {
          if (_trim(percent).match(/%$/)) {
            return parseFloat(percent) / 100 * all;
          }
          return parseFloat(percent);
        }
        return percent == null ? NaN : +percent;
      };
      number.round = function(x, precision) {
        if (precision == null) {
          precision = 10;
        }
        precision = Math.min(Math.max(0, precision), 20);
        return +(+x).toFixed(precision);
      };
      number.asc = function(arr) {
        arr.sort(function(a, b) {
          return a - b;
        });
        return arr;
      };
      number.getPrecision = function(val) {
        val = +val;
        if (isNaN(val)) {
          return 0;
        }
        var e = 1;
        var count = 0;
        while (Math.round(val * e) / e !== val) {
          e *= 10;
          count++;
        }
        return count;
      };
      number.getPrecisionSafe = function(val) {
        var str = val.toString();
        var dotIndex = str.indexOf('.');
        if (dotIndex < 0) {
          return 0;
        }
        return str.length - 1 - dotIndex;
      };
      number.getPixelPrecision = function(dataExtent, pixelExtent) {
        var log = Math.log;
        var LN10 = Math.LN10;
        var dataQuantity = Math.floor(log(dataExtent[1] - dataExtent[0]) / LN10);
        var sizeQuantity = Math.round(log(Math.abs(pixelExtent[1] - pixelExtent[0])) / LN10);
        var precision = Math.min(Math.max(-dataQuantity + sizeQuantity, 0), 20);
        return !isFinite(precision) ? 20 : precision;
      };
      number.MAX_SAFE_INTEGER = 9007199254740991;
      number.remRadian = function(radian) {
        var pi2 = Math.PI * 2;
        return (radian % pi2 + pi2) % pi2;
      };
      number.isRadianAroundZero = function(val) {
        return val > -RADIAN_EPSILON && val < RADIAN_EPSILON;
      };
      number.parseDate = function(value) {
        if (value instanceof Date) {
          return value;
        } else if (typeof value === 'string') {
          var ret = new Date(value);
          if (isNaN(+ret)) {
            ret = new Date(new Date(value.replace(/-/g, '/')) - new Date('1970/01/01'));
          }
          return ret;
        }
        return new Date(Math.round(value));
      };
      number.quantity = function(val) {
        return Math.pow(10, Math.floor(Math.log(val) / Math.LN10));
      };
      number.nice = function(val, round) {
        var exp10 = number.quantity(val);
        var f = val / exp10;
        var nf;
        if (round) {
          if (f < 1.5) {
            nf = 1;
          } else if (f < 2.5) {
            nf = 2;
          } else if (f < 4) {
            nf = 3;
          } else if (f < 7) {
            nf = 5;
          } else {
            nf = 10;
          }
        } else {
          if (f < 1) {
            nf = 1;
          } else if (f < 2) {
            nf = 2;
          } else if (f < 3) {
            nf = 3;
          } else if (f < 5) {
            nf = 5;
          } else {
            nf = 10;
          }
        }
        return nf * exp10;
      };
      number.reformIntervals = function(list) {
        list.sort(function(a, b) {
          return littleThan(a, b, 0) ? -1 : 1;
        });
        var curr = -Infinity;
        var currClose = 1;
        for (var i = 0; i < list.length; ) {
          var interval = list[i].interval;
          var close = list[i].close;
          for (var lg = 0; lg < 2; lg++) {
            if (interval[lg] <= curr) {
              interval[lg] = curr;
              close[lg] = !lg ? 1 - currClose : 1;
            }
            curr = interval[lg];
            currClose = close[lg];
          }
          if (interval[0] === interval[1] && close[0] * close[1] !== 1) {
            list.splice(i, 1);
          } else {
            i++;
          }
        }
        return list;
        function littleThan(a, b, lg) {
          return a.interval[lg] < b.interval[lg] || (a.interval[lg] === b.interval[lg] && ((a.close[lg] - b.close[lg] === (!lg ? 1 : -1)) || (!lg && littleThan(a, b, 1))));
        }
      };
      number.isNumeric = function(v) {
        return v - parseFloat(v) >= 0;
      };
      module.exports = number;
    }, function(module, exports, __webpack_require__) {
      var textWidthCache = {};
      var textWidthCacheCounter = 0;
      var TEXT_CACHE_MAX = 5000;
      var util = __webpack_require__(4);
      var BoundingRect = __webpack_require__(9);
      var retrieve = util.retrieve;
      function getTextWidth(text, textFont) {
        var key = text + ':' + textFont;
        if (textWidthCache[key]) {
          return textWidthCache[key];
        }
        var textLines = (text + '').split('\n');
        var width = 0;
        for (var i = 0,
            l = textLines.length; i < l; i++) {
          width = Math.max(textContain.measureText(textLines[i], textFont).width, width);
        }
        if (textWidthCacheCounter > TEXT_CACHE_MAX) {
          textWidthCacheCounter = 0;
          textWidthCache = {};
        }
        textWidthCacheCounter++;
        textWidthCache[key] = width;
        return width;
      }
      function getTextRect(text, textFont, textAlign, textBaseline) {
        var textLineLen = ((text || '') + '').split('\n').length;
        var width = getTextWidth(text, textFont);
        var lineHeight = getTextWidth('国', textFont);
        var height = textLineLen * lineHeight;
        var rect = new BoundingRect(0, 0, width, height);
        rect.lineHeight = lineHeight;
        switch (textBaseline) {
          case 'bottom':
          case 'alphabetic':
            rect.y -= lineHeight;
            break;
          case 'middle':
            rect.y -= lineHeight / 2;
            break;
        }
        switch (textAlign) {
          case 'end':
          case 'right':
            rect.x -= rect.width;
            break;
          case 'center':
            rect.x -= rect.width / 2;
            break;
        }
        return rect;
      }
      function adjustTextPositionOnRect(textPosition, rect, textRect, distance) {
        var x = rect.x;
        var y = rect.y;
        var height = rect.height;
        var width = rect.width;
        var textHeight = textRect.height;
        var halfHeight = height / 2 - textHeight / 2;
        var textAlign = 'left';
        switch (textPosition) {
          case 'left':
            x -= distance;
            y += halfHeight;
            textAlign = 'right';
            break;
          case 'right':
            x += distance + width;
            y += halfHeight;
            textAlign = 'left';
            break;
          case 'top':
            x += width / 2;
            y -= distance + textHeight;
            textAlign = 'center';
            break;
          case 'bottom':
            x += width / 2;
            y += height + distance;
            textAlign = 'center';
            break;
          case 'inside':
            x += width / 2;
            y += halfHeight;
            textAlign = 'center';
            break;
          case 'insideLeft':
            x += distance;
            y += halfHeight;
            textAlign = 'left';
            break;
          case 'insideRight':
            x += width - distance;
            y += halfHeight;
            textAlign = 'right';
            break;
          case 'insideTop':
            x += width / 2;
            y += distance;
            textAlign = 'center';
            break;
          case 'insideBottom':
            x += width / 2;
            y += height - textHeight - distance;
            textAlign = 'center';
            break;
          case 'insideTopLeft':
            x += distance;
            y += distance;
            textAlign = 'left';
            break;
          case 'insideTopRight':
            x += width - distance;
            y += distance;
            textAlign = 'right';
            break;
          case 'insideBottomLeft':
            x += distance;
            y += height - textHeight - distance;
            break;
          case 'insideBottomRight':
            x += width - distance;
            y += height - textHeight - distance;
            textAlign = 'right';
            break;
        }
        return {
          x: x,
          y: y,
          textAlign: textAlign,
          textBaseline: 'top'
        };
      }
      function truncateText(text, containerWidth, textFont, ellipsis, options) {
        if (!containerWidth) {
          return '';
        }
        options = options || {};
        ellipsis = retrieve(ellipsis, '...');
        var maxIterations = retrieve(options.maxIterations, 2);
        var minChar = retrieve(options.minChar, 0);
        var cnCharWidth = getTextWidth('国', textFont);
        var ascCharWidth = getTextWidth('a', textFont);
        var placeholder = retrieve(options.placeholder, '');
        var contentWidth = containerWidth = Math.max(0, containerWidth - 1);
        for (var i = 0; i < minChar && contentWidth >= ascCharWidth; i++) {
          contentWidth -= ascCharWidth;
        }
        var ellipsisWidth = getTextWidth(ellipsis);
        if (ellipsisWidth > contentWidth) {
          ellipsis = '';
          ellipsisWidth = 0;
        }
        contentWidth = containerWidth - ellipsisWidth;
        var textLines = (text + '').split('\n');
        for (var i = 0,
            len = textLines.length; i < len; i++) {
          var textLine = textLines[i];
          var lineWidth = getTextWidth(textLine, textFont);
          if (lineWidth <= containerWidth) {
            continue;
          }
          for (var j = 0; ; j++) {
            if (lineWidth <= contentWidth || j >= maxIterations) {
              textLine += ellipsis;
              break;
            }
            var subLength = j === 0 ? estimateLength(textLine, contentWidth, ascCharWidth, cnCharWidth) : lineWidth > 0 ? Math.floor(textLine.length * contentWidth / lineWidth) : 0;
            textLine = textLine.substr(0, subLength);
            lineWidth = getTextWidth(textLine, textFont);
          }
          if (textLine === '') {
            textLine = placeholder;
          }
          textLines[i] = textLine;
        }
        return textLines.join('\n');
      }
      function estimateLength(text, contentWidth, ascCharWidth, cnCharWidth) {
        var width = 0;
        var i = 0;
        for (var len = text.length; i < len && width < contentWidth; i++) {
          var charCode = text.charCodeAt(i);
          width += (0 <= charCode && charCode <= 127) ? ascCharWidth : cnCharWidth;
        }
        return i;
      }
      var textContain = {
        getWidth: getTextWidth,
        getBoundingRect: getTextRect,
        adjustTextPositionOnRect: adjustTextPositionOnRect,
        truncateText: truncateText,
        measureText: function(text, textFont) {
          var ctx = util.getContext();
          ctx.font = textFont || '12px sans-serif';
          return ctx.measureText(text);
        }
      };
      module.exports = textContain;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var vec2 = __webpack_require__(10);
      var matrix = __webpack_require__(11);
      var v2ApplyTransform = vec2.applyTransform;
      var mathMin = Math.min;
      var mathMax = Math.max;
      function BoundingRect(x, y, width, height) {
        if (width < 0) {
          x = x + width;
          width = -width;
        }
        if (height < 0) {
          y = y + height;
          height = -height;
        }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }
      BoundingRect.prototype = {
        constructor: BoundingRect,
        union: function(other) {
          var x = mathMin(other.x, this.x);
          var y = mathMin(other.y, this.y);
          this.width = mathMax(other.x + other.width, this.x + this.width) - x;
          this.height = mathMax(other.y + other.height, this.y + this.height) - y;
          this.x = x;
          this.y = y;
        },
        applyTransform: (function() {
          var lt = [];
          var rb = [];
          var lb = [];
          var rt = [];
          return function(m) {
            if (!m) {
              return;
            }
            lt[0] = lb[0] = this.x;
            lt[1] = rt[1] = this.y;
            rb[0] = rt[0] = this.x + this.width;
            rb[1] = lb[1] = this.y + this.height;
            v2ApplyTransform(lt, lt, m);
            v2ApplyTransform(rb, rb, m);
            v2ApplyTransform(lb, lb, m);
            v2ApplyTransform(rt, rt, m);
            this.x = mathMin(lt[0], rb[0], lb[0], rt[0]);
            this.y = mathMin(lt[1], rb[1], lb[1], rt[1]);
            var maxX = mathMax(lt[0], rb[0], lb[0], rt[0]);
            var maxY = mathMax(lt[1], rb[1], lb[1], rt[1]);
            this.width = maxX - this.x;
            this.height = maxY - this.y;
          };
        })(),
        calculateTransform: function(b) {
          var a = this;
          var sx = b.width / a.width;
          var sy = b.height / a.height;
          var m = matrix.create();
          matrix.translate(m, m, [-a.x, -a.y]);
          matrix.scale(m, m, [sx, sy]);
          matrix.translate(m, m, [b.x, b.y]);
          return m;
        },
        intersect: function(b) {
          if (!b) {
            return false;
          }
          if (!(b instanceof BoundingRect)) {
            b = BoundingRect.create(b);
          }
          var a = this;
          var ax0 = a.x;
          var ax1 = a.x + a.width;
          var ay0 = a.y;
          var ay1 = a.y + a.height;
          var bx0 = b.x;
          var bx1 = b.x + b.width;
          var by0 = b.y;
          var by1 = b.y + b.height;
          return !(ax1 < bx0 || bx1 < ax0 || ay1 < by0 || by1 < ay0);
        },
        contain: function(x, y) {
          var rect = this;
          return x >= rect.x && x <= (rect.x + rect.width) && y >= rect.y && y <= (rect.y + rect.height);
        },
        clone: function() {
          return new BoundingRect(this.x, this.y, this.width, this.height);
        },
        copy: function(other) {
          this.x = other.x;
          this.y = other.y;
          this.width = other.width;
          this.height = other.height;
        },
        plain: function() {
          return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
          };
        }
      };
      BoundingRect.create = function(rect) {
        return new BoundingRect(rect.x, rect.y, rect.width, rect.height);
      };
      module.exports = BoundingRect;
    }, function(module, exports) {
      var ArrayCtor = typeof Float32Array === 'undefined' ? Array : Float32Array;
      var vector = {
        create: function(x, y) {
          var out = new ArrayCtor(2);
          if (x == null) {
            x = 0;
          }
          if (y == null) {
            y = 0;
          }
          out[0] = x;
          out[1] = y;
          return out;
        },
        copy: function(out, v) {
          out[0] = v[0];
          out[1] = v[1];
          return out;
        },
        clone: function(v) {
          var out = new ArrayCtor(2);
          out[0] = v[0];
          out[1] = v[1];
          return out;
        },
        set: function(out, a, b) {
          out[0] = a;
          out[1] = b;
          return out;
        },
        add: function(out, v1, v2) {
          out[0] = v1[0] + v2[0];
          out[1] = v1[1] + v2[1];
          return out;
        },
        scaleAndAdd: function(out, v1, v2, a) {
          out[0] = v1[0] + v2[0] * a;
          out[1] = v1[1] + v2[1] * a;
          return out;
        },
        sub: function(out, v1, v2) {
          out[0] = v1[0] - v2[0];
          out[1] = v1[1] - v2[1];
          return out;
        },
        len: function(v) {
          return Math.sqrt(this.lenSquare(v));
        },
        lenSquare: function(v) {
          return v[0] * v[0] + v[1] * v[1];
        },
        mul: function(out, v1, v2) {
          out[0] = v1[0] * v2[0];
          out[1] = v1[1] * v2[1];
          return out;
        },
        div: function(out, v1, v2) {
          out[0] = v1[0] / v2[0];
          out[1] = v1[1] / v2[1];
          return out;
        },
        dot: function(v1, v2) {
          return v1[0] * v2[0] + v1[1] * v2[1];
        },
        scale: function(out, v, s) {
          out[0] = v[0] * s;
          out[1] = v[1] * s;
          return out;
        },
        normalize: function(out, v) {
          var d = vector.len(v);
          if (d === 0) {
            out[0] = 0;
            out[1] = 0;
          } else {
            out[0] = v[0] / d;
            out[1] = v[1] / d;
          }
          return out;
        },
        distance: function(v1, v2) {
          return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]));
        },
        distanceSquare: function(v1, v2) {
          return (v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]);
        },
        negate: function(out, v) {
          out[0] = -v[0];
          out[1] = -v[1];
          return out;
        },
        lerp: function(out, v1, v2, t) {
          out[0] = v1[0] + t * (v2[0] - v1[0]);
          out[1] = v1[1] + t * (v2[1] - v1[1]);
          return out;
        },
        applyTransform: function(out, v, m) {
          var x = v[0];
          var y = v[1];
          out[0] = m[0] * x + m[2] * y + m[4];
          out[1] = m[1] * x + m[3] * y + m[5];
          return out;
        },
        min: function(out, v1, v2) {
          out[0] = Math.min(v1[0], v2[0]);
          out[1] = Math.min(v1[1], v2[1]);
          return out;
        },
        max: function(out, v1, v2) {
          out[0] = Math.max(v1[0], v2[0]);
          out[1] = Math.max(v1[1], v2[1]);
          return out;
        }
      };
      vector.length = vector.len;
      vector.lengthSquare = vector.lenSquare;
      vector.dist = vector.distance;
      vector.distSquare = vector.distanceSquare;
      module.exports = vector;
    }, function(module, exports) {
      var ArrayCtor = typeof Float32Array === 'undefined' ? Array : Float32Array;
      var matrix = {
        create: function() {
          var out = new ArrayCtor(6);
          matrix.identity(out);
          return out;
        },
        identity: function(out) {
          out[0] = 1;
          out[1] = 0;
          out[2] = 0;
          out[3] = 1;
          out[4] = 0;
          out[5] = 0;
          return out;
        },
        copy: function(out, m) {
          out[0] = m[0];
          out[1] = m[1];
          out[2] = m[2];
          out[3] = m[3];
          out[4] = m[4];
          out[5] = m[5];
          return out;
        },
        mul: function(out, m1, m2) {
          var out0 = m1[0] * m2[0] + m1[2] * m2[1];
          var out1 = m1[1] * m2[0] + m1[3] * m2[1];
          var out2 = m1[0] * m2[2] + m1[2] * m2[3];
          var out3 = m1[1] * m2[2] + m1[3] * m2[3];
          var out4 = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
          var out5 = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
          out[0] = out0;
          out[1] = out1;
          out[2] = out2;
          out[3] = out3;
          out[4] = out4;
          out[5] = out5;
          return out;
        },
        translate: function(out, a, v) {
          out[0] = a[0];
          out[1] = a[1];
          out[2] = a[2];
          out[3] = a[3];
          out[4] = a[4] + v[0];
          out[5] = a[5] + v[1];
          return out;
        },
        rotate: function(out, a, rad) {
          var aa = a[0];
          var ac = a[2];
          var atx = a[4];
          var ab = a[1];
          var ad = a[3];
          var aty = a[5];
          var st = Math.sin(rad);
          var ct = Math.cos(rad);
          out[0] = aa * ct + ab * st;
          out[1] = -aa * st + ab * ct;
          out[2] = ac * ct + ad * st;
          out[3] = -ac * st + ct * ad;
          out[4] = ct * atx + st * aty;
          out[5] = ct * aty - st * atx;
          return out;
        },
        scale: function(out, a, v) {
          var vx = v[0];
          var vy = v[1];
          out[0] = a[0] * vx;
          out[1] = a[1] * vy;
          out[2] = a[2] * vx;
          out[3] = a[3] * vy;
          out[4] = a[4] * vx;
          out[5] = a[5] * vy;
          return out;
        },
        invert: function(out, a) {
          var aa = a[0];
          var ac = a[2];
          var atx = a[4];
          var ab = a[1];
          var ad = a[3];
          var aty = a[5];
          var det = aa * ad - ab * ac;
          if (!det) {
            return null;
          }
          det = 1.0 / det;
          out[0] = ad * det;
          out[1] = -ab * det;
          out[2] = -ac * det;
          out[3] = aa * det;
          out[4] = (ac * aty - ad * atx) * det;
          out[5] = (ab * atx - aa * aty) * det;
          return out;
        }
      };
      module.exports = matrix;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var clazzUtil = __webpack_require__(13);
      var env = __webpack_require__(2);
      function Model(option, parentModel, ecModel) {
        this.parentModel = parentModel;
        this.ecModel = ecModel;
        this.option = option;
      }
      Model.prototype = {
        constructor: Model,
        init: null,
        mergeOption: function(option) {
          zrUtil.merge(this.option, option, true);
        },
        get: function(path, ignoreParent) {
          if (path == null) {
            return this.option;
          }
          return doGet(this.option, this.parsePath(path), !ignoreParent && getParent(this, path));
        },
        getShallow: function(key, ignoreParent) {
          var option = this.option;
          var val = option == null ? option : option[key];
          var parentModel = !ignoreParent && getParent(this, key);
          if (val == null && parentModel) {
            val = parentModel.getShallow(key);
          }
          return val;
        },
        getModel: function(path, parentModel) {
          var obj = path == null ? this.option : doGet(this.option, path = this.parsePath(path));
          var thisParentModel;
          parentModel = parentModel || ((thisParentModel = getParent(this, path)) && thisParentModel.getModel(path));
          return new Model(obj, parentModel, this.ecModel);
        },
        isEmpty: function() {
          return this.option == null;
        },
        restoreData: function() {},
        clone: function() {
          var Ctor = this.constructor;
          return new Ctor(zrUtil.clone(this.option));
        },
        setReadOnly: function(properties) {
          clazzUtil.setReadOnly(this, properties);
        },
        parsePath: function(path) {
          if (typeof path === 'string') {
            path = path.split('.');
          }
          return path;
        },
        customizeGetParent: function(getParentMethod) {
          clazzUtil.set(this, 'getParent', getParentMethod);
        },
        isAnimationEnabled: function() {
          if (!env.node) {
            if (this.option.animation != null) {
              return !!this.option.animation;
            } else if (this.parentModel) {
              return this.parentModel.isAnimationEnabled();
            }
          }
        }
      };
      function doGet(obj, pathArr, parentModel) {
        for (var i = 0; i < pathArr.length; i++) {
          if (!pathArr[i]) {
            continue;
          }
          obj = (obj && typeof obj === 'object') ? obj[pathArr[i]] : null;
          if (obj == null) {
            break;
          }
        }
        if (obj == null && parentModel) {
          obj = parentModel.get(pathArr);
        }
        return obj;
      }
      function getParent(model, path) {
        var getParentMethod = clazzUtil.get(model, 'getParent');
        return getParentMethod ? getParentMethod.call(model, path) : model.parentModel;
      }
      clazzUtil.enableClassExtend(Model);
      var mixin = zrUtil.mixin;
      mixin(Model, __webpack_require__(14));
      mixin(Model, __webpack_require__(16));
      mixin(Model, __webpack_require__(17));
      mixin(Model, __webpack_require__(18));
      module.exports = Model;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var clazz = {};
      var TYPE_DELIMITER = '.';
      var IS_CONTAINER = '___EC__COMPONENT__CONTAINER___';
      var MEMBER_PRIFIX = '\0ec_\0';
      clazz.set = function(host, name, value) {
        return (host[MEMBER_PRIFIX + name] = value);
      };
      clazz.get = function(host, name) {
        return host[MEMBER_PRIFIX + name];
      };
      clazz.hasOwn = function(host, name) {
        return host.hasOwnProperty(MEMBER_PRIFIX + name);
      };
      var parseClassType = clazz.parseClassType = function(componentType) {
        var ret = {
          main: '',
          sub: ''
        };
        if (componentType) {
          componentType = componentType.split(TYPE_DELIMITER);
          ret.main = componentType[0] || '';
          ret.sub = componentType[1] || '';
        }
        return ret;
      };
      function checkClassType(componentType) {
        zrUtil.assert(/^[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)?$/.test(componentType), 'componentType "' + componentType + '" illegal');
      }
      clazz.enableClassExtend = function(RootClass, mandatoryMethods) {
        RootClass.$constructor = RootClass;
        RootClass.extend = function(proto) {
          if (true) {
            zrUtil.each(mandatoryMethods, function(method) {
              if (!proto[method]) {
                console.warn('Method `' + method + '` should be implemented' + (proto.type ? ' in ' + proto.type : '') + '.');
              }
            });
          }
          var superClass = this;
          var ExtendedClass = function() {
            if (!proto.$constructor) {
              superClass.apply(this, arguments);
            } else {
              proto.$constructor.apply(this, arguments);
            }
          };
          zrUtil.extend(ExtendedClass.prototype, proto);
          ExtendedClass.extend = this.extend;
          ExtendedClass.superCall = superCall;
          ExtendedClass.superApply = superApply;
          zrUtil.inherits(ExtendedClass, this);
          ExtendedClass.superClass = superClass;
          return ExtendedClass;
        };
      };
      function superCall(context, methodName) {
        var args = zrUtil.slice(arguments, 2);
        return this.superClass.prototype[methodName].apply(context, args);
      }
      function superApply(context, methodName, args) {
        return this.superClass.prototype[methodName].apply(context, args);
      }
      clazz.enableClassManagement = function(entity, options) {
        options = options || {};
        var storage = {};
        entity.registerClass = function(Clazz, componentType) {
          if (componentType) {
            checkClassType(componentType);
            componentType = parseClassType(componentType);
            if (!componentType.sub) {
              if (true) {
                if (storage[componentType.main]) {
                  console.warn(componentType.main + ' exists.');
                }
              }
              storage[componentType.main] = Clazz;
            } else if (componentType.sub !== IS_CONTAINER) {
              var container = makeContainer(componentType);
              container[componentType.sub] = Clazz;
            }
          }
          return Clazz;
        };
        entity.getClass = function(componentMainType, subType, throwWhenNotFound) {
          var Clazz = storage[componentMainType];
          if (Clazz && Clazz[IS_CONTAINER]) {
            Clazz = subType ? Clazz[subType] : null;
          }
          if (throwWhenNotFound && !Clazz) {
            throw new Error(!subType ? componentMainType + '.' + 'type should be specified.' : 'Component ' + componentMainType + '.' + (subType || '') + ' not exists. Load it first.');
          }
          return Clazz;
        };
        entity.getClassesByMainType = function(componentType) {
          componentType = parseClassType(componentType);
          var result = [];
          var obj = storage[componentType.main];
          if (obj && obj[IS_CONTAINER]) {
            zrUtil.each(obj, function(o, type) {
              type !== IS_CONTAINER && result.push(o);
            });
          } else {
            result.push(obj);
          }
          return result;
        };
        entity.hasClass = function(componentType) {
          componentType = parseClassType(componentType);
          return !!storage[componentType.main];
        };
        entity.getAllClassMainTypes = function() {
          var types = [];
          zrUtil.each(storage, function(obj, type) {
            types.push(type);
          });
          return types;
        };
        entity.hasSubTypes = function(componentType) {
          componentType = parseClassType(componentType);
          var obj = storage[componentType.main];
          return obj && obj[IS_CONTAINER];
        };
        entity.parseClassType = parseClassType;
        function makeContainer(componentType) {
          var container = storage[componentType.main];
          if (!container || !container[IS_CONTAINER]) {
            container = storage[componentType.main] = {};
            container[IS_CONTAINER] = true;
          }
          return container;
        }
        if (options.registerWhenExtend) {
          var originalExtend = entity.extend;
          if (originalExtend) {
            entity.extend = function(proto) {
              var ExtendedClass = originalExtend.call(this, proto);
              return entity.registerClass(ExtendedClass, proto.type);
            };
          }
        }
        return entity;
      };
      clazz.setReadOnly = function(obj, properties) {};
      module.exports = clazz;
    }, function(module, exports, __webpack_require__) {
      var getLineStyle = __webpack_require__(15)([['lineWidth', 'width'], ['stroke', 'color'], ['opacity'], ['shadowBlur'], ['shadowOffsetX'], ['shadowOffsetY'], ['shadowColor']]);
      module.exports = {
        getLineStyle: function(excludes) {
          var style = getLineStyle.call(this, excludes);
          var lineDash = this.getLineDash(style.lineWidth);
          lineDash && (style.lineDash = lineDash);
          return style;
        },
        getLineDash: function(lineWidth) {
          if (lineWidth == null) {
            lineWidth = 1;
          }
          var lineType = this.get('type');
          var dotSize = Math.max(lineWidth, 2);
          var dashSize = lineWidth * 4;
          return (lineType === 'solid' || lineType == null) ? null : (lineType === 'dashed' ? [dashSize, dashSize] : [dotSize, dotSize]);
        }
      };
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      module.exports = function(properties) {
        for (var i = 0; i < properties.length; i++) {
          if (!properties[i][1]) {
            properties[i][1] = properties[i][0];
          }
        }
        return function(excludes) {
          var style = {};
          for (var i = 0; i < properties.length; i++) {
            var propName = properties[i][1];
            if (excludes && zrUtil.indexOf(excludes, propName) >= 0) {
              continue;
            }
            var val = this.getShallow(propName);
            if (val != null) {
              style[properties[i][0]] = val;
            }
          }
          return style;
        };
      };
    }, function(module, exports, __webpack_require__) {
      module.exports = {getAreaStyle: __webpack_require__(15)([['fill', 'color'], ['shadowBlur'], ['shadowOffsetX'], ['shadowOffsetY'], ['opacity'], ['shadowColor']])};
    }, function(module, exports, __webpack_require__) {
      var textContain = __webpack_require__(8);
      function getShallow(model, path) {
        return model && model.getShallow(path);
      }
      module.exports = {
        getTextColor: function() {
          var ecModel = this.ecModel;
          return this.getShallow('color') || (ecModel && ecModel.get('textStyle.color'));
        },
        getFont: function() {
          var ecModel = this.ecModel;
          var gTextStyleModel = ecModel && ecModel.getModel('textStyle');
          return [this.getShallow('fontStyle') || getShallow(gTextStyleModel, 'fontStyle'), this.getShallow('fontWeight') || getShallow(gTextStyleModel, 'fontWeight'), (this.getShallow('fontSize') || getShallow(gTextStyleModel, 'fontSize') || 12) + 'px', this.getShallow('fontFamily') || getShallow(gTextStyleModel, 'fontFamily') || 'sans-serif'].join(' ');
        },
        getTextRect: function(text) {
          return textContain.getBoundingRect(text, this.getFont(), this.getShallow('align'), this.getShallow('baseline'));
        },
        truncateText: function(text, containerWidth, ellipsis, options) {
          return textContain.truncateText(text, containerWidth, this.getFont(), ellipsis, options);
        }
      };
    }, function(module, exports, __webpack_require__) {
      var getItemStyle = __webpack_require__(15)([['fill', 'color'], ['stroke', 'borderColor'], ['lineWidth', 'borderWidth'], ['opacity'], ['shadowBlur'], ['shadowOffsetX'], ['shadowOffsetY'], ['shadowColor'], ['textPosition'], ['textAlign']]);
      module.exports = {
        getItemStyle: function(excludes) {
          var style = getItemStyle.call(this, excludes);
          var lineDash = this.getBorderLineDash();
          lineDash && (style.lineDash = lineDash);
          return style;
        },
        getBorderLineDash: function() {
          var lineType = this.get('borderType');
          return (lineType === 'solid' || lineType == null) ? null : (lineType === 'dashed' ? [5, 5] : [1, 1]);
        }
      };
    }, function(module, exports, __webpack_require__) {
      var Model = __webpack_require__(12);
      var zrUtil = __webpack_require__(4);
      var arrayPush = Array.prototype.push;
      var componentUtil = __webpack_require__(20);
      var clazzUtil = __webpack_require__(13);
      var layout = __webpack_require__(21);
      var ComponentModel = Model.extend({
        type: 'component',
        id: '',
        name: '',
        mainType: '',
        subType: '',
        componentIndex: 0,
        defaultOption: null,
        ecModel: null,
        dependentModels: [],
        uid: null,
        layoutMode: null,
        $constructor: function(option, parentModel, ecModel, extraOpt) {
          Model.call(this, option, parentModel, ecModel, extraOpt);
          this.uid = componentUtil.getUID('componentModel');
        },
        init: function(option, parentModel, ecModel, extraOpt) {
          this.mergeDefaultAndTheme(option, ecModel);
        },
        mergeDefaultAndTheme: function(option, ecModel) {
          var layoutMode = this.layoutMode;
          var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
          var themeModel = ecModel.getTheme();
          zrUtil.merge(option, themeModel.get(this.mainType));
          zrUtil.merge(option, this.getDefaultOption());
          if (layoutMode) {
            layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
          }
        },
        mergeOption: function(option, extraOpt) {
          zrUtil.merge(this.option, option, true);
          var layoutMode = this.layoutMode;
          if (layoutMode) {
            layout.mergeLayoutParam(this.option, option, layoutMode);
          }
        },
        optionUpdated: function(newCptOption, isInit) {},
        getDefaultOption: function() {
          if (!clazzUtil.hasOwn(this, '__defaultOption')) {
            var optList = [];
            var Class = this.constructor;
            while (Class) {
              var opt = Class.prototype.defaultOption;
              opt && optList.push(opt);
              Class = Class.superClass;
            }
            var defaultOption = {};
            for (var i = optList.length - 1; i >= 0; i--) {
              defaultOption = zrUtil.merge(defaultOption, optList[i], true);
            }
            clazzUtil.set(this, '__defaultOption', defaultOption);
          }
          return clazzUtil.get(this, '__defaultOption');
        },
        getReferringComponents: function(mainType) {
          return this.ecModel.queryComponents({
            mainType: mainType,
            index: this.get(mainType + 'Index', true),
            id: this.get(mainType + 'Id', true)
          });
        }
      });
      clazzUtil.enableClassManagement(ComponentModel, {registerWhenExtend: true});
      componentUtil.enableSubTypeDefaulter(ComponentModel);
      componentUtil.enableTopologicalTravel(ComponentModel, getDependencies);
      function getDependencies(componentType) {
        var deps = [];
        zrUtil.each(ComponentModel.getClassesByMainType(componentType), function(Clazz) {
          arrayPush.apply(deps, Clazz.prototype.dependencies || []);
        });
        return zrUtil.map(deps, function(type) {
          return clazzUtil.parseClassType(type).main;
        });
      }
      zrUtil.mixin(ComponentModel, __webpack_require__(22));
      module.exports = ComponentModel;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var clazz = __webpack_require__(13);
      var parseClassType = clazz.parseClassType;
      var base = 0;
      var componentUtil = {};
      var DELIMITER = '_';
      componentUtil.getUID = function(type) {
        return [(type || ''), base++, Math.random()].join(DELIMITER);
      };
      componentUtil.enableSubTypeDefaulter = function(entity) {
        var subTypeDefaulters = {};
        entity.registerSubTypeDefaulter = function(componentType, defaulter) {
          componentType = parseClassType(componentType);
          subTypeDefaulters[componentType.main] = defaulter;
        };
        entity.determineSubType = function(componentType, option) {
          var type = option.type;
          if (!type) {
            var componentTypeMain = parseClassType(componentType).main;
            if (entity.hasSubTypes(componentType) && subTypeDefaulters[componentTypeMain]) {
              type = subTypeDefaulters[componentTypeMain](option);
            }
          }
          return type;
        };
        return entity;
      };
      componentUtil.enableTopologicalTravel = function(entity, dependencyGetter) {
        entity.topologicalTravel = function(targetNameList, fullNameList, callback, context) {
          if (!targetNameList.length) {
            return;
          }
          var result = makeDepndencyGraph(fullNameList);
          var graph = result.graph;
          var stack = result.noEntryList;
          var targetNameSet = {};
          zrUtil.each(targetNameList, function(name) {
            targetNameSet[name] = true;
          });
          while (stack.length) {
            var currComponentType = stack.pop();
            var currVertex = graph[currComponentType];
            var isInTargetNameSet = !!targetNameSet[currComponentType];
            if (isInTargetNameSet) {
              callback.call(context, currComponentType, currVertex.originalDeps.slice());
              delete targetNameSet[currComponentType];
            }
            zrUtil.each(currVertex.successor, isInTargetNameSet ? removeEdgeAndAdd : removeEdge);
          }
          zrUtil.each(targetNameSet, function() {
            throw new Error('Circle dependency may exists');
          });
          function removeEdge(succComponentType) {
            graph[succComponentType].entryCount--;
            if (graph[succComponentType].entryCount === 0) {
              stack.push(succComponentType);
            }
          }
          function removeEdgeAndAdd(succComponentType) {
            targetNameSet[succComponentType] = true;
            removeEdge(succComponentType);
          }
        };
        function makeDepndencyGraph(fullNameList) {
          var graph = {};
          var noEntryList = [];
          zrUtil.each(fullNameList, function(name) {
            var thisItem = createDependencyGraphItem(graph, name);
            var originalDeps = thisItem.originalDeps = dependencyGetter(name);
            var availableDeps = getAvailableDependencies(originalDeps, fullNameList);
            thisItem.entryCount = availableDeps.length;
            if (thisItem.entryCount === 0) {
              noEntryList.push(name);
            }
            zrUtil.each(availableDeps, function(dependentName) {
              if (zrUtil.indexOf(thisItem.predecessor, dependentName) < 0) {
                thisItem.predecessor.push(dependentName);
              }
              var thatItem = createDependencyGraphItem(graph, dependentName);
              if (zrUtil.indexOf(thatItem.successor, dependentName) < 0) {
                thatItem.successor.push(name);
              }
            });
          });
          return {
            graph: graph,
            noEntryList: noEntryList
          };
        }
        function createDependencyGraphItem(graph, name) {
          if (!graph[name]) {
            graph[name] = {
              predecessor: [],
              successor: []
            };
          }
          return graph[name];
        }
        function getAvailableDependencies(originalDeps, fullNameList) {
          var availableDeps = [];
          zrUtil.each(originalDeps, function(dep) {
            zrUtil.indexOf(fullNameList, dep) >= 0 && availableDeps.push(dep);
          });
          return availableDeps;
        }
      };
      module.exports = componentUtil;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var BoundingRect = __webpack_require__(9);
      var numberUtil = __webpack_require__(7);
      var formatUtil = __webpack_require__(6);
      var parsePercent = numberUtil.parsePercent;
      var each = zrUtil.each;
      var layout = {};
      var LOCATION_PARAMS = layout.LOCATION_PARAMS = ['left', 'right', 'top', 'bottom', 'width', 'height'];
      function boxLayout(orient, group, gap, maxWidth, maxHeight) {
        var x = 0;
        var y = 0;
        if (maxWidth == null) {
          maxWidth = Infinity;
        }
        if (maxHeight == null) {
          maxHeight = Infinity;
        }
        var currentLineMaxSize = 0;
        group.eachChild(function(child, idx) {
          var position = child.position;
          var rect = child.getBoundingRect();
          var nextChild = group.childAt(idx + 1);
          var nextChildRect = nextChild && nextChild.getBoundingRect();
          var nextX;
          var nextY;
          if (orient === 'horizontal') {
            var moveX = rect.width + (nextChildRect ? (-nextChildRect.x + rect.x) : 0);
            nextX = x + moveX;
            if (nextX > maxWidth || child.newline) {
              x = 0;
              nextX = moveX;
              y += currentLineMaxSize + gap;
              currentLineMaxSize = rect.height;
            } else {
              currentLineMaxSize = Math.max(currentLineMaxSize, rect.height);
            }
          } else {
            var moveY = rect.height + (nextChildRect ? (-nextChildRect.y + rect.y) : 0);
            nextY = y + moveY;
            if (nextY > maxHeight || child.newline) {
              x += currentLineMaxSize + gap;
              y = 0;
              nextY = moveY;
              currentLineMaxSize = rect.width;
            } else {
              currentLineMaxSize = Math.max(currentLineMaxSize, rect.width);
            }
          }
          if (child.newline) {
            return;
          }
          position[0] = x;
          position[1] = y;
          orient === 'horizontal' ? (x = nextX + gap) : (y = nextY + gap);
        });
      }
      layout.box = boxLayout;
      layout.vbox = zrUtil.curry(boxLayout, 'vertical');
      layout.hbox = zrUtil.curry(boxLayout, 'horizontal');
      layout.getAvailableSize = function(positionInfo, containerRect, margin) {
        var containerWidth = containerRect.width;
        var containerHeight = containerRect.height;
        var x = parsePercent(positionInfo.x, containerWidth);
        var y = parsePercent(positionInfo.y, containerHeight);
        var x2 = parsePercent(positionInfo.x2, containerWidth);
        var y2 = parsePercent(positionInfo.y2, containerHeight);
        (isNaN(x) || isNaN(parseFloat(positionInfo.x))) && (x = 0);
        (isNaN(x2) || isNaN(parseFloat(positionInfo.x2))) && (x2 = containerWidth);
        (isNaN(y) || isNaN(parseFloat(positionInfo.y))) && (y = 0);
        (isNaN(y2) || isNaN(parseFloat(positionInfo.y2))) && (y2 = containerHeight);
        margin = formatUtil.normalizeCssArray(margin || 0);
        return {
          width: Math.max(x2 - x - margin[1] - margin[3], 0),
          height: Math.max(y2 - y - margin[0] - margin[2], 0)
        };
      };
      layout.getLayoutRect = function(positionInfo, containerRect, margin) {
        margin = formatUtil.normalizeCssArray(margin || 0);
        var containerWidth = containerRect.width;
        var containerHeight = containerRect.height;
        var left = parsePercent(positionInfo.left, containerWidth);
        var top = parsePercent(positionInfo.top, containerHeight);
        var right = parsePercent(positionInfo.right, containerWidth);
        var bottom = parsePercent(positionInfo.bottom, containerHeight);
        var width = parsePercent(positionInfo.width, containerWidth);
        var height = parsePercent(positionInfo.height, containerHeight);
        var verticalMargin = margin[2] + margin[0];
        var horizontalMargin = margin[1] + margin[3];
        var aspect = positionInfo.aspect;
        if (isNaN(width)) {
          width = containerWidth - right - horizontalMargin - left;
        }
        if (isNaN(height)) {
          height = containerHeight - bottom - verticalMargin - top;
        }
        if (isNaN(width) && isNaN(height)) {
          if (aspect > containerWidth / containerHeight) {
            width = containerWidth * 0.8;
          } else {
            height = containerHeight * 0.8;
          }
        }
        if (aspect != null) {
          if (isNaN(width)) {
            width = aspect * height;
          }
          if (isNaN(height)) {
            height = width / aspect;
          }
        }
        if (isNaN(left)) {
          left = containerWidth - right - width - horizontalMargin;
        }
        if (isNaN(top)) {
          top = containerHeight - bottom - height - verticalMargin;
        }
        switch (positionInfo.left || positionInfo.right) {
          case 'center':
            left = containerWidth / 2 - width / 2 - margin[3];
            break;
          case 'right':
            left = containerWidth - width - horizontalMargin;
            break;
        }
        switch (positionInfo.top || positionInfo.bottom) {
          case 'middle':
          case 'center':
            top = containerHeight / 2 - height / 2 - margin[0];
            break;
          case 'bottom':
            top = containerHeight - height - verticalMargin;
            break;
        }
        left = left || 0;
        top = top || 0;
        if (isNaN(width)) {
          width = containerWidth - left - (right || 0);
        }
        if (isNaN(height)) {
          height = containerHeight - top - (bottom || 0);
        }
        var rect = new BoundingRect(left + margin[3], top + margin[0], width, height);
        rect.margin = margin;
        return rect;
      };
      layout.positionElement = function(el, positionInfo, containerRect, margin, opt) {
        var h = !opt || !opt.hv || opt.hv[0];
        var v = !opt || !opt.hv || opt.hv[1];
        var boundingMode = opt && opt.boundingMode || 'all';
        if (!h && !v) {
          return;
        }
        var rect;
        if (boundingMode === 'raw') {
          rect = el.type === 'group' ? new BoundingRect(0, 0, +positionInfo.width || 0, +positionInfo.height || 0) : el.getBoundingRect();
        } else {
          rect = el.getBoundingRect();
          if (el.needLocalTransform()) {
            var transform = el.getLocalTransform();
            rect = rect.clone();
            rect.applyTransform(transform);
          }
        }
        positionInfo = layout.getLayoutRect(zrUtil.defaults({
          width: rect.width,
          height: rect.height
        }, positionInfo), containerRect, margin);
        var elPos = el.position;
        var dx = h ? positionInfo.x - rect.x : 0;
        var dy = v ? positionInfo.y - rect.y : 0;
        el.attr('position', boundingMode === 'raw' ? [dx, dy] : [elPos[0] + dx, elPos[1] + dy]);
      };
      layout.mergeLayoutParam = function(targetOption, newOption, opt) {
        !zrUtil.isObject(opt) && (opt = {});
        var hNames = ['width', 'left', 'right'];
        var vNames = ['height', 'top', 'bottom'];
        var hResult = merge(hNames);
        var vResult = merge(vNames);
        copy(hNames, targetOption, hResult);
        copy(vNames, targetOption, vResult);
        function merge(names) {
          var newParams = {};
          var newValueCount = 0;
          var merged = {};
          var mergedValueCount = 0;
          var enoughParamNumber = opt.ignoreSize ? 1 : 2;
          each(names, function(name) {
            merged[name] = targetOption[name];
          });
          each(names, function(name) {
            hasProp(newOption, name) && (newParams[name] = merged[name] = newOption[name]);
            hasValue(newParams, name) && newValueCount++;
            hasValue(merged, name) && mergedValueCount++;
          });
          if (mergedValueCount === enoughParamNumber || !newValueCount) {
            return merged;
          } else if (newValueCount >= enoughParamNumber) {
            return newParams;
          } else {
            for (var i = 0; i < names.length; i++) {
              var name = names[i];
              if (!hasProp(newParams, name) && hasProp(targetOption, name)) {
                newParams[name] = targetOption[name];
                break;
              }
            }
            return newParams;
          }
        }
        function hasProp(obj, name) {
          return obj.hasOwnProperty(name);
        }
        function hasValue(obj, name) {
          return obj[name] != null && obj[name] !== 'auto';
        }
        function copy(names, target, source) {
          each(names, function(name) {
            target[name] = source[name];
          });
        }
      };
      layout.getLayoutParams = function(source) {
        return layout.copyLayoutParams({}, source);
      };
      layout.copyLayoutParams = function(target, source) {
        source && target && each(LOCATION_PARAMS, function(name) {
          source.hasOwnProperty(name) && (target[name] = source[name]);
        });
        return target;
      };
      module.exports = layout;
    }, function(module, exports) {
      module.exports = {getBoxLayoutParams: function() {
          return {
            left: this.get('left'),
            top: this.get('top'),
            right: this.get('right'),
            bottom: this.get('bottom'),
            width: this.get('width'),
            height: this.get('height')
          };
        }};
    }, function(module, exports) {
      var platform = '';
      if (typeof navigator !== 'undefined') {
        platform = navigator.platform || '';
      }
      module.exports = {
        color: ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3'],
        textStyle: {
          fontFamily: platform.match(/^Win/) ? 'Microsoft YaHei' : 'sans-serif',
          fontSize: 12,
          fontStyle: 'normal',
          fontWeight: 'normal'
        },
        blendMode: null,
        animation: true,
        animationDuration: 1000,
        animationDurationUpdate: 300,
        animationEasing: 'exponentialOut',
        animationEasingUpdate: 'cubicOut',
        animationThreshold: 2000,
        progressiveThreshold: 3000,
        progressive: 400,
        hoverLayerThreshold: 3000
      };
    }, function(module, exports, __webpack_require__) {
      var classUtil = __webpack_require__(13);
      var set = classUtil.set;
      var get = classUtil.get;
      module.exports = {
        clearColorPalette: function() {
          set(this, 'colorIdx', 0);
          set(this, 'colorNameMap', {});
        },
        getColorFromPalette: function(name, scope) {
          scope = scope || this;
          var colorIdx = get(scope, 'colorIdx') || 0;
          var colorNameMap = get(scope, 'colorNameMap') || set(scope, 'colorNameMap', {});
          if (colorNameMap[name]) {
            return colorNameMap[name];
          }
          var colorPalette = this.get('color', true) || [];
          if (!colorPalette.length) {
            return;
          }
          var color = colorPalette[colorIdx];
          if (name) {
            colorNameMap[name] = color;
          }
          set(scope, 'colorIdx', (colorIdx + 1) % colorPalette.length);
          return color;
        }
      };
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var echartsAPIList = ['getDom', 'getZr', 'getWidth', 'getHeight', 'dispatchAction', 'isDisposed', 'on', 'off', 'getDataURL', 'getConnectedDataURL', 'getModel', 'getOption'];
      function ExtensionAPI(chartInstance) {
        zrUtil.each(echartsAPIList, function(name) {
          this[name] = zrUtil.bind(chartInstance[name], chartInstance);
        }, this);
      }
      module.exports = ExtensionAPI;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var coordinateSystemCreators = {};
      function CoordinateSystemManager() {
        this._coordinateSystems = [];
      }
      CoordinateSystemManager.prototype = {
        constructor: CoordinateSystemManager,
        create: function(ecModel, api) {
          var coordinateSystems = [];
          zrUtil.each(coordinateSystemCreators, function(creater, type) {
            var list = creater.create(ecModel, api);
            coordinateSystems = coordinateSystems.concat(list || []);
          });
          this._coordinateSystems = coordinateSystems;
        },
        update: function(ecModel, api) {
          zrUtil.each(this._coordinateSystems, function(coordSys) {
            coordSys.update && coordSys.update(ecModel, api);
          });
        },
        getCoordinateSystems: function() {
          return this._coordinateSystems.slice();
        }
      };
      CoordinateSystemManager.register = function(type, coordinateSystemCreator) {
        coordinateSystemCreators[type] = coordinateSystemCreator;
      };
      CoordinateSystemManager.get = function(type) {
        return coordinateSystemCreators[type];
      };
      module.exports = CoordinateSystemManager;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var modelUtil = __webpack_require__(5);
      var ComponentModel = __webpack_require__(19);
      var each = zrUtil.each;
      var clone = zrUtil.clone;
      var map = zrUtil.map;
      var merge = zrUtil.merge;
      var QUERY_REG = /^(min|max)?(.+)$/;
      function OptionManager(api) {
        this._api = api;
        this._timelineOptions = [];
        this._mediaList = [];
        this._mediaDefault;
        this._currentMediaIndices = [];
        this._optionBackup;
        this._newBaseOption;
      }
      OptionManager.prototype = {
        constructor: OptionManager,
        setOption: function(rawOption, optionPreprocessorFuncs) {
          rawOption = clone(rawOption, true);
          var oldOptionBackup = this._optionBackup;
          var newParsedOption = parseRawOption.call(this, rawOption, optionPreprocessorFuncs, !oldOptionBackup);
          this._newBaseOption = newParsedOption.baseOption;
          if (oldOptionBackup) {
            mergeOption(oldOptionBackup.baseOption, newParsedOption.baseOption);
            if (newParsedOption.timelineOptions.length) {
              oldOptionBackup.timelineOptions = newParsedOption.timelineOptions;
            }
            if (newParsedOption.mediaList.length) {
              oldOptionBackup.mediaList = newParsedOption.mediaList;
            }
            if (newParsedOption.mediaDefault) {
              oldOptionBackup.mediaDefault = newParsedOption.mediaDefault;
            }
          } else {
            this._optionBackup = newParsedOption;
          }
        },
        mountOption: function(isRecreate) {
          var optionBackup = this._optionBackup;
          this._timelineOptions = map(optionBackup.timelineOptions, clone);
          this._mediaList = map(optionBackup.mediaList, clone);
          this._mediaDefault = clone(optionBackup.mediaDefault);
          this._currentMediaIndices = [];
          return clone(isRecreate ? optionBackup.baseOption : this._newBaseOption);
        },
        getTimelineOption: function(ecModel) {
          var option;
          var timelineOptions = this._timelineOptions;
          if (timelineOptions.length) {
            var timelineModel = ecModel.getComponent('timeline');
            if (timelineModel) {
              option = clone(timelineOptions[timelineModel.getCurrentIndex()], true);
            }
          }
          return option;
        },
        getMediaOption: function(ecModel) {
          var ecWidth = this._api.getWidth();
          var ecHeight = this._api.getHeight();
          var mediaList = this._mediaList;
          var mediaDefault = this._mediaDefault;
          var indices = [];
          var result = [];
          if (!mediaList.length && !mediaDefault) {
            return result;
          }
          for (var i = 0,
              len = mediaList.length; i < len; i++) {
            if (applyMediaQuery(mediaList[i].query, ecWidth, ecHeight)) {
              indices.push(i);
            }
          }
          if (!indices.length && mediaDefault) {
            indices = [-1];
          }
          if (indices.length && !indicesEquals(indices, this._currentMediaIndices)) {
            result = map(indices, function(index) {
              return clone(index === -1 ? mediaDefault.option : mediaList[index].option);
            });
          }
          this._currentMediaIndices = indices;
          return result;
        }
      };
      function parseRawOption(rawOption, optionPreprocessorFuncs, isNew) {
        var timelineOptions = [];
        var mediaList = [];
        var mediaDefault;
        var baseOption;
        var timelineOpt = rawOption.timeline;
        if (rawOption.baseOption) {
          baseOption = rawOption.baseOption;
        }
        if (timelineOpt || rawOption.options) {
          baseOption = baseOption || {};
          timelineOptions = (rawOption.options || []).slice();
        }
        if (rawOption.media) {
          baseOption = baseOption || {};
          var media = rawOption.media;
          each(media, function(singleMedia) {
            if (singleMedia && singleMedia.option) {
              if (singleMedia.query) {
                mediaList.push(singleMedia);
              } else if (!mediaDefault) {
                mediaDefault = singleMedia;
              }
            }
          });
        }
        if (!baseOption) {
          baseOption = rawOption;
        }
        if (!baseOption.timeline) {
          baseOption.timeline = timelineOpt;
        }
        each([baseOption].concat(timelineOptions).concat(zrUtil.map(mediaList, function(media) {
          return media.option;
        })), function(option) {
          each(optionPreprocessorFuncs, function(preProcess) {
            preProcess(option, isNew);
          });
        });
        return {
          baseOption: baseOption,
          timelineOptions: timelineOptions,
          mediaDefault: mediaDefault,
          mediaList: mediaList
        };
      }
      function applyMediaQuery(query, ecWidth, ecHeight) {
        var realMap = {
          width: ecWidth,
          height: ecHeight,
          aspectratio: ecWidth / ecHeight
        };
        var applicatable = true;
        zrUtil.each(query, function(value, attr) {
          var matched = attr.match(QUERY_REG);
          if (!matched || !matched[1] || !matched[2]) {
            return;
          }
          var operator = matched[1];
          var realAttr = matched[2].toLowerCase();
          if (!compare(realMap[realAttr], value, operator)) {
            applicatable = false;
          }
        });
        return applicatable;
      }
      function compare(real, expect, operator) {
        if (operator === 'min') {
          return real >= expect;
        } else if (operator === 'max') {
          return real <= expect;
        } else {
          return real === expect;
        }
      }
      function indicesEquals(indices1, indices2) {
        return indices1.join(',') === indices2.join(',');
      }
      function mergeOption(oldOption, newOption) {
        newOption = newOption || {};
        each(newOption, function(newCptOpt, mainType) {
          if (newCptOpt == null) {
            return;
          }
          var oldCptOpt = oldOption[mainType];
          if (!ComponentModel.hasClass(mainType)) {
            oldOption[mainType] = merge(oldCptOpt, newCptOpt, true);
          } else {
            newCptOpt = modelUtil.normalizeToArray(newCptOpt);
            oldCptOpt = modelUtil.normalizeToArray(oldCptOpt);
            var mapResult = modelUtil.mappingToExists(oldCptOpt, newCptOpt);
            oldOption[mainType] = map(mapResult, function(item) {
              return (item.option && item.exist) ? merge(item.exist, item.option, true) : (item.exist || item.option);
            });
          }
        });
      }
      module.exports = OptionManager;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var formatUtil = __webpack_require__(6);
      var classUtil = __webpack_require__(13);
      var modelUtil = __webpack_require__(5);
      var ComponentModel = __webpack_require__(19);
      var colorPaletteMixin = __webpack_require__(24);
      var env = __webpack_require__(2);
      var layout = __webpack_require__(21);
      var set = classUtil.set;
      var get = classUtil.get;
      var encodeHTML = formatUtil.encodeHTML;
      var addCommas = formatUtil.addCommas;
      var SeriesModel = ComponentModel.extend({
        type: 'series.__base__',
        seriesIndex: 0,
        coordinateSystem: null,
        defaultOption: null,
        legendDataProvider: null,
        visualColorAccessPath: 'itemStyle.normal.color',
        layoutMode: null,
        init: function(option, parentModel, ecModel, extraOpt) {
          this.seriesIndex = this.componentIndex;
          this.mergeDefaultAndTheme(option, ecModel);
          set(this, 'dataBeforeProcessed', this.getInitialData(option, ecModel));
          this.restoreData();
        },
        mergeDefaultAndTheme: function(option, ecModel) {
          var layoutMode = this.layoutMode;
          var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
          zrUtil.merge(option, ecModel.getTheme().get(this.subType));
          zrUtil.merge(option, this.getDefaultOption());
          modelUtil.defaultEmphasis(option.label, modelUtil.LABEL_OPTIONS);
          this.fillDataTextStyle(option.data);
          if (layoutMode) {
            layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
          }
        },
        mergeOption: function(newSeriesOption, ecModel) {
          newSeriesOption = zrUtil.merge(this.option, newSeriesOption, true);
          this.fillDataTextStyle(newSeriesOption.data);
          var layoutMode = this.layoutMode;
          if (layoutMode) {
            layout.mergeLayoutParam(this.option, newSeriesOption, layoutMode);
          }
          var data = this.getInitialData(newSeriesOption, ecModel);
          if (data) {
            set(this, 'data', data);
            set(this, 'dataBeforeProcessed', data.cloneShallow());
          }
        },
        fillDataTextStyle: function(data) {
          if (data) {
            for (var i = 0; i < data.length; i++) {
              if (data[i] && data[i].label) {
                modelUtil.defaultEmphasis(data[i].label, modelUtil.LABEL_OPTIONS);
              }
            }
          }
        },
        getInitialData: function() {},
        getData: function(dataType) {
          var data = get(this, 'data');
          return dataType == null ? data : data.getLinkedData(dataType);
        },
        setData: function(data) {
          set(this, 'data', data);
        },
        getRawData: function() {
          return get(this, 'dataBeforeProcessed');
        },
        coordDimToDataDim: function(coordDim) {
          return [coordDim];
        },
        dataDimToCoordDim: function(dataDim) {
          return dataDim;
        },
        getBaseAxis: function() {
          var coordSys = this.coordinateSystem;
          return coordSys && coordSys.getBaseAxis && coordSys.getBaseAxis();
        },
        formatTooltip: function(dataIndex, multipleSeries, dataType) {
          function formatArrayValue(value) {
            var result = [];
            zrUtil.each(value, function(val, idx) {
              var dimInfo = data.getDimensionInfo(idx);
              var dimType = dimInfo && dimInfo.type;
              var valStr;
              if (dimType === 'ordinal') {
                valStr = val + '';
              } else if (dimType === 'time') {
                valStr = multipleSeries ? '' : formatUtil.formatTime('yyyy/MM/dd hh:mm:ss', val);
              } else {
                valStr = addCommas(val);
              }
              valStr && result.push(valStr);
            });
            return result.join(', ');
          }
          var data = get(this, 'data');
          var value = this.getRawValue(dataIndex);
          var formattedValue = encodeHTML(zrUtil.isArray(value) ? formatArrayValue(value) : addCommas(value));
          var name = data.getName(dataIndex);
          var color = data.getItemVisual(dataIndex, 'color');
          if (zrUtil.isObject(color) && color.colorStops) {
            color = (color.colorStops[0] || {}).color;
          }
          color = color || 'transparent';
          var colorEl = '<span style="display:inline-block;margin-right:5px;' + 'border-radius:10px;width:9px;height:9px;background-color:' + encodeHTML(color) + '"></span>';
          var seriesName = this.name;
          if (seriesName === '\0-') {
            seriesName = '';
          }
          return !multipleSeries ? ((seriesName && encodeHTML(seriesName) + '<br />') + colorEl + (name ? encodeHTML(name) + ' : ' + formattedValue : formattedValue)) : (colorEl + encodeHTML(this.name) + ' : ' + formattedValue);
        },
        isAnimationEnabled: function() {
          if (env.node) {
            return false;
          }
          var animationEnabled = this.getShallow('animation');
          if (animationEnabled) {
            if (this.getData().count() > this.getShallow('animationThreshold')) {
              animationEnabled = false;
            }
          }
          return animationEnabled;
        },
        restoreData: function() {
          set(this, 'data', get(this, 'dataBeforeProcessed').cloneShallow());
        },
        getColorFromPalette: function(name, scope) {
          var ecModel = this.ecModel;
          var color = colorPaletteMixin.getColorFromPalette.call(this, name, scope);
          if (!color) {
            color = ecModel.getColorFromPalette(name, scope);
          }
          return color;
        },
        getAxisTooltipDataIndex: null,
        getTooltipPosition: null
      });
      zrUtil.mixin(SeriesModel, modelUtil.dataFormatMixin);
      zrUtil.mixin(SeriesModel, colorPaletteMixin);
      module.exports = SeriesModel;
    }, function(module, exports, __webpack_require__) {
      var Group = __webpack_require__(30);
      var componentUtil = __webpack_require__(20);
      var clazzUtil = __webpack_require__(13);
      var Component = function() {
        this.group = new Group();
        this.uid = componentUtil.getUID('viewComponent');
      };
      Component.prototype = {
        constructor: Component,
        init: function(ecModel, api) {},
        render: function(componentModel, ecModel, api, payload) {},
        dispose: function() {}
      };
      var componentProto = Component.prototype;
      componentProto.updateView = componentProto.updateLayout = componentProto.updateVisual = function(seriesModel, ecModel, api, payload) {};
      clazzUtil.enableClassExtend(Component);
      clazzUtil.enableClassManagement(Component, {registerWhenExtend: true});
      module.exports = Component;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var Element = __webpack_require__(31);
      var BoundingRect = __webpack_require__(9);
      var Group = function(opts) {
        opts = opts || {};
        Element.call(this, opts);
        for (var key in opts) {
          if (opts.hasOwnProperty(key)) {
            this[key] = opts[key];
          }
        }
        this._children = [];
        this.__storage = null;
        this.__dirty = true;
      };
      Group.prototype = {
        constructor: Group,
        isGroup: true,
        type: 'group',
        silent: false,
        children: function() {
          return this._children.slice();
        },
        childAt: function(idx) {
          return this._children[idx];
        },
        childOfName: function(name) {
          var children = this._children;
          for (var i = 0; i < children.length; i++) {
            if (children[i].name === name) {
              return children[i];
            }
          }
        },
        childCount: function() {
          return this._children.length;
        },
        add: function(child) {
          if (child && child !== this && child.parent !== this) {
            this._children.push(child);
            this._doAdd(child);
          }
          return this;
        },
        addBefore: function(child, nextSibling) {
          if (child && child !== this && child.parent !== this && nextSibling && nextSibling.parent === this) {
            var children = this._children;
            var idx = children.indexOf(nextSibling);
            if (idx >= 0) {
              children.splice(idx, 0, child);
              this._doAdd(child);
            }
          }
          return this;
        },
        _doAdd: function(child) {
          if (child.parent) {
            child.parent.remove(child);
          }
          child.parent = this;
          var storage = this.__storage;
          var zr = this.__zr;
          if (storage && storage !== child.__storage) {
            storage.addToMap(child);
            if (child instanceof Group) {
              child.addChildrenToStorage(storage);
            }
          }
          zr && zr.refresh();
        },
        remove: function(child) {
          var zr = this.__zr;
          var storage = this.__storage;
          var children = this._children;
          var idx = zrUtil.indexOf(children, child);
          if (idx < 0) {
            return this;
          }
          children.splice(idx, 1);
          child.parent = null;
          if (storage) {
            storage.delFromMap(child.id);
            if (child instanceof Group) {
              child.delChildrenFromStorage(storage);
            }
          }
          zr && zr.refresh();
          return this;
        },
        removeAll: function() {
          var children = this._children;
          var storage = this.__storage;
          var child;
          var i;
          for (i = 0; i < children.length; i++) {
            child = children[i];
            if (storage) {
              storage.delFromMap(child.id);
              if (child instanceof Group) {
                child.delChildrenFromStorage(storage);
              }
            }
            child.parent = null;
          }
          children.length = 0;
          return this;
        },
        eachChild: function(cb, context) {
          var children = this._children;
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            cb.call(context, child, i);
          }
          return this;
        },
        traverse: function(cb, context) {
          for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            cb.call(context, child);
            if (child.type === 'group') {
              child.traverse(cb, context);
            }
          }
          return this;
        },
        addChildrenToStorage: function(storage) {
          for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.addToMap(child);
            if (child instanceof Group) {
              child.addChildrenToStorage(storage);
            }
          }
        },
        delChildrenFromStorage: function(storage) {
          for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.delFromMap(child.id);
            if (child instanceof Group) {
              child.delChildrenFromStorage(storage);
            }
          }
        },
        dirty: function() {
          this.__dirty = true;
          this.__zr && this.__zr.refresh();
          return this;
        },
        getBoundingRect: function(includeChildren) {
          var rect = null;
          var tmpRect = new BoundingRect(0, 0, 0, 0);
          var children = includeChildren || this._children;
          var tmpMat = [];
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.ignore || child.invisible) {
              continue;
            }
            var childRect = child.getBoundingRect();
            var transform = child.getLocalTransform(tmpMat);
            if (transform) {
              tmpRect.copy(childRect);
              tmpRect.applyTransform(transform);
              rect = rect || tmpRect.clone();
              rect.union(tmpRect);
            } else {
              rect = rect || childRect.clone();
              rect.union(childRect);
            }
          }
          return rect || tmpRect;
        }
      };
      zrUtil.inherits(Group, Element);
      module.exports = Group;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var guid = __webpack_require__(32);
      var Eventful = __webpack_require__(33);
      var Transformable = __webpack_require__(34);
      var Animatable = __webpack_require__(35);
      var zrUtil = __webpack_require__(4);
      var Element = function(opts) {
        Transformable.call(this, opts);
        Eventful.call(this, opts);
        Animatable.call(this, opts);
        this.id = opts.id || guid();
      };
      Element.prototype = {
        type: 'element',
        name: '',
        __zr: null,
        ignore: false,
        clipPath: null,
        drift: function(dx, dy) {
          switch (this.draggable) {
            case 'horizontal':
              dy = 0;
              break;
            case 'vertical':
              dx = 0;
              break;
          }
          var m = this.transform;
          if (!m) {
            m = this.transform = [1, 0, 0, 1, 0, 0];
          }
          m[4] += dx;
          m[5] += dy;
          this.decomposeTransform();
          this.dirty(false);
        },
        beforeUpdate: function() {},
        afterUpdate: function() {},
        update: function() {
          this.updateTransform();
        },
        traverse: function(cb, context) {},
        attrKV: function(key, value) {
          if (key === 'position' || key === 'scale' || key === 'origin') {
            if (value) {
              var target = this[key];
              if (!target) {
                target = this[key] = [];
              }
              target[0] = value[0];
              target[1] = value[1];
            }
          } else {
            this[key] = value;
          }
        },
        hide: function() {
          this.ignore = true;
          this.__zr && this.__zr.refresh();
        },
        show: function() {
          this.ignore = false;
          this.__zr && this.__zr.refresh();
        },
        attr: function(key, value) {
          if (typeof key === 'string') {
            this.attrKV(key, value);
          } else if (zrUtil.isObject(key)) {
            for (var name in key) {
              if (key.hasOwnProperty(name)) {
                this.attrKV(name, key[name]);
              }
            }
          }
          this.dirty(false);
          return this;
        },
        setClipPath: function(clipPath) {
          var zr = this.__zr;
          if (zr) {
            clipPath.addSelfToZr(zr);
          }
          if (this.clipPath && this.clipPath !== clipPath) {
            this.removeClipPath();
          }
          this.clipPath = clipPath;
          clipPath.__zr = zr;
          clipPath.__clipTarget = this;
          this.dirty(false);
        },
        removeClipPath: function() {
          var clipPath = this.clipPath;
          if (clipPath) {
            if (clipPath.__zr) {
              clipPath.removeSelfFromZr(clipPath.__zr);
            }
            clipPath.__zr = null;
            clipPath.__clipTarget = null;
            this.clipPath = null;
            this.dirty(false);
          }
        },
        addSelfToZr: function(zr) {
          this.__zr = zr;
          var animators = this.animators;
          if (animators) {
            for (var i = 0; i < animators.length; i++) {
              zr.animation.addAnimator(animators[i]);
            }
          }
          if (this.clipPath) {
            this.clipPath.addSelfToZr(zr);
          }
        },
        removeSelfFromZr: function(zr) {
          this.__zr = null;
          var animators = this.animators;
          if (animators) {
            for (var i = 0; i < animators.length; i++) {
              zr.animation.removeAnimator(animators[i]);
            }
          }
          if (this.clipPath) {
            this.clipPath.removeSelfFromZr(zr);
          }
        }
      };
      zrUtil.mixin(Element, Animatable);
      zrUtil.mixin(Element, Transformable);
      zrUtil.mixin(Element, Eventful);
      module.exports = Element;
    }, function(module, exports) {
      var idStart = 0x0907;
      module.exports = function() {
        return idStart++;
      };
    }, function(module, exports) {
      var arrySlice = Array.prototype.slice;
      var Eventful = function() {
        this._$handlers = {};
      };
      Eventful.prototype = {
        constructor: Eventful,
        one: function(event, handler, context) {
          var _h = this._$handlers;
          if (!handler || !event) {
            return this;
          }
          if (!_h[event]) {
            _h[event] = [];
          }
          for (var i = 0; i < _h[event].length; i++) {
            if (_h[event][i].h === handler) {
              return this;
            }
          }
          _h[event].push({
            h: handler,
            one: true,
            ctx: context || this
          });
          return this;
        },
        on: function(event, handler, context) {
          var _h = this._$handlers;
          if (!handler || !event) {
            return this;
          }
          if (!_h[event]) {
            _h[event] = [];
          }
          for (var i = 0; i < _h[event].length; i++) {
            if (_h[event][i].h === handler) {
              return this;
            }
          }
          _h[event].push({
            h: handler,
            one: false,
            ctx: context || this
          });
          return this;
        },
        isSilent: function(event) {
          var _h = this._$handlers;
          return _h[event] && _h[event].length;
        },
        off: function(event, handler) {
          var _h = this._$handlers;
          if (!event) {
            this._$handlers = {};
            return this;
          }
          if (handler) {
            if (_h[event]) {
              var newList = [];
              for (var i = 0,
                  l = _h[event].length; i < l; i++) {
                if (_h[event][i]['h'] != handler) {
                  newList.push(_h[event][i]);
                }
              }
              _h[event] = newList;
            }
            if (_h[event] && _h[event].length === 0) {
              delete _h[event];
            }
          } else {
            delete _h[event];
          }
          return this;
        },
        trigger: function(type) {
          if (this._$handlers[type]) {
            var args = arguments;
            var argLen = args.length;
            if (argLen > 3) {
              args = arrySlice.call(args, 1);
            }
            var _h = this._$handlers[type];
            var len = _h.length;
            for (var i = 0; i < len; ) {
              switch (argLen) {
                case 1:
                  _h[i]['h'].call(_h[i]['ctx']);
                  break;
                case 2:
                  _h[i]['h'].call(_h[i]['ctx'], args[1]);
                  break;
                case 3:
                  _h[i]['h'].call(_h[i]['ctx'], args[1], args[2]);
                  break;
                default:
                  _h[i]['h'].apply(_h[i]['ctx'], args);
                  break;
              }
              if (_h[i]['one']) {
                _h.splice(i, 1);
                len--;
              } else {
                i++;
              }
            }
          }
          return this;
        },
        triggerWithContext: function(type) {
          if (this._$handlers[type]) {
            var args = arguments;
            var argLen = args.length;
            if (argLen > 4) {
              args = arrySlice.call(args, 1, args.length - 1);
            }
            var ctx = args[args.length - 1];
            var _h = this._$handlers[type];
            var len = _h.length;
            for (var i = 0; i < len; ) {
              switch (argLen) {
                case 1:
                  _h[i]['h'].call(ctx);
                  break;
                case 2:
                  _h[i]['h'].call(ctx, args[1]);
                  break;
                case 3:
                  _h[i]['h'].call(ctx, args[1], args[2]);
                  break;
                default:
                  _h[i]['h'].apply(ctx, args);
                  break;
              }
              if (_h[i]['one']) {
                _h.splice(i, 1);
                len--;
              } else {
                i++;
              }
            }
          }
          return this;
        }
      };
      module.exports = Eventful;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var matrix = __webpack_require__(11);
      var vector = __webpack_require__(10);
      var mIdentity = matrix.identity;
      var EPSILON = 5e-5;
      function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
      }
      var Transformable = function(opts) {
        opts = opts || {};
        if (!opts.position) {
          this.position = [0, 0];
        }
        if (opts.rotation == null) {
          this.rotation = 0;
        }
        if (!opts.scale) {
          this.scale = [1, 1];
        }
        this.origin = this.origin || null;
      };
      var transformableProto = Transformable.prototype;
      transformableProto.transform = null;
      transformableProto.needLocalTransform = function() {
        return isNotAroundZero(this.rotation) || isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1]) || isNotAroundZero(this.scale[0] - 1) || isNotAroundZero(this.scale[1] - 1);
      };
      transformableProto.updateTransform = function() {
        var parent = this.parent;
        var parentHasTransform = parent && parent.transform;
        var needLocalTransform = this.needLocalTransform();
        var m = this.transform;
        if (!(needLocalTransform || parentHasTransform)) {
          m && mIdentity(m);
          return;
        }
        m = m || matrix.create();
        if (needLocalTransform) {
          this.getLocalTransform(m);
        } else {
          mIdentity(m);
        }
        if (parentHasTransform) {
          if (needLocalTransform) {
            matrix.mul(m, parent.transform, m);
          } else {
            matrix.copy(m, parent.transform);
          }
        }
        this.transform = m;
        this.invTransform = this.invTransform || matrix.create();
        matrix.invert(this.invTransform, m);
      };
      transformableProto.getLocalTransform = function(m) {
        m = m || [];
        mIdentity(m);
        var origin = this.origin;
        var scale = this.scale;
        var rotation = this.rotation;
        var position = this.position;
        if (origin) {
          m[4] -= origin[0];
          m[5] -= origin[1];
        }
        matrix.scale(m, m, scale);
        if (rotation) {
          matrix.rotate(m, m, rotation);
        }
        if (origin) {
          m[4] += origin[0];
          m[5] += origin[1];
        }
        m[4] += position[0];
        m[5] += position[1];
        return m;
      };
      transformableProto.setTransform = function(ctx) {
        var m = this.transform;
        var dpr = ctx.dpr || 1;
        if (m) {
          ctx.setTransform(dpr * m[0], dpr * m[1], dpr * m[2], dpr * m[3], dpr * m[4], dpr * m[5]);
        } else {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      };
      transformableProto.restoreTransform = function(ctx) {
        var m = this.transform;
        var dpr = ctx.dpr || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      var tmpTransform = [];
      transformableProto.decomposeTransform = function() {
        if (!this.transform) {
          return;
        }
        var parent = this.parent;
        var m = this.transform;
        if (parent && parent.transform) {
          matrix.mul(tmpTransform, parent.invTransform, m);
          m = tmpTransform;
        }
        var sx = m[0] * m[0] + m[1] * m[1];
        var sy = m[2] * m[2] + m[3] * m[3];
        var position = this.position;
        var scale = this.scale;
        if (isNotAroundZero(sx - 1)) {
          sx = Math.sqrt(sx);
        }
        if (isNotAroundZero(sy - 1)) {
          sy = Math.sqrt(sy);
        }
        if (m[0] < 0) {
          sx = -sx;
        }
        if (m[3] < 0) {
          sy = -sy;
        }
        position[0] = m[4];
        position[1] = m[5];
        scale[0] = sx;
        scale[1] = sy;
        this.rotation = Math.atan2(-m[1] / sy, m[0] / sx);
      };
      transformableProto.getGlobalScale = function() {
        var m = this.transform;
        if (!m) {
          return [1, 1];
        }
        var sx = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
        var sy = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
        if (m[0] < 0) {
          sx = -sx;
        }
        if (m[3] < 0) {
          sy = -sy;
        }
        return [sx, sy];
      };
      transformableProto.transformCoordToLocal = function(x, y) {
        var v2 = [x, y];
        var invTransform = this.invTransform;
        if (invTransform) {
          vector.applyTransform(v2, v2, invTransform);
        }
        return v2;
      };
      transformableProto.transformCoordToGlobal = function(x, y) {
        var v2 = [x, y];
        var transform = this.transform;
        if (transform) {
          vector.applyTransform(v2, v2, transform);
        }
        return v2;
      };
      module.exports = Transformable;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var Animator = __webpack_require__(36);
      var util = __webpack_require__(4);
      var isString = util.isString;
      var isFunction = util.isFunction;
      var isObject = util.isObject;
      var log = __webpack_require__(40);
      var Animatable = function() {
        this.animators = [];
      };
      Animatable.prototype = {
        constructor: Animatable,
        animate: function(path, loop) {
          var target;
          var animatingShape = false;
          var el = this;
          var zr = this.__zr;
          if (path) {
            var pathSplitted = path.split('.');
            var prop = el;
            animatingShape = pathSplitted[0] === 'shape';
            for (var i = 0,
                l = pathSplitted.length; i < l; i++) {
              if (!prop) {
                continue;
              }
              prop = prop[pathSplitted[i]];
            }
            if (prop) {
              target = prop;
            }
          } else {
            target = el;
          }
          if (!target) {
            log('Property "' + path + '" is not existed in element ' + el.id);
            return;
          }
          var animators = el.animators;
          var animator = new Animator(target, loop);
          animator.during(function(target) {
            el.dirty(animatingShape);
          }).done(function() {
            animators.splice(util.indexOf(animators, animator), 1);
          });
          animators.push(animator);
          if (zr) {
            zr.animation.addAnimator(animator);
          }
          return animator;
        },
        stopAnimation: function(forwardToLast) {
          var animators = this.animators;
          var len = animators.length;
          for (var i = 0; i < len; i++) {
            animators[i].stop(forwardToLast);
          }
          animators.length = 0;
          return this;
        },
        animateTo: function(target, time, delay, easing, callback) {
          if (isString(delay)) {
            callback = easing;
            easing = delay;
            delay = 0;
          } else if (isFunction(easing)) {
            callback = easing;
            easing = 'linear';
            delay = 0;
          } else if (isFunction(delay)) {
            callback = delay;
            delay = 0;
          } else if (isFunction(time)) {
            callback = time;
            time = 500;
          } else if (!time) {
            time = 500;
          }
          this.stopAnimation();
          this._animateToShallow('', this, target, time, delay, easing, callback);
          var animators = this.animators.slice();
          var count = animators.length;
          function done() {
            count--;
            if (!count) {
              callback && callback();
            }
          }
          if (!count) {
            callback && callback();
          }
          for (var i = 0; i < animators.length; i++) {
            animators[i].done(done).start(easing);
          }
        },
        _animateToShallow: function(path, source, target, time, delay) {
          var objShallow = {};
          var propertyCount = 0;
          for (var name in target) {
            if (!target.hasOwnProperty(name)) {
              continue;
            }
            if (source[name] != null) {
              if (isObject(target[name]) && !util.isArrayLike(target[name])) {
                this._animateToShallow(path ? path + '.' + name : name, source[name], target[name], time, delay);
              } else {
                objShallow[name] = target[name];
                propertyCount++;
              }
            } else if (target[name] != null) {
              if (!path) {
                this.attr(name, target[name]);
              } else {
                var props = {};
                props[path] = {};
                props[path][name] = target[name];
                this.attr(props);
              }
            }
          }
          if (propertyCount > 0) {
            this.animate(path, false).when(time == null ? 500 : time, objShallow).delay(delay || 0);
          }
          return this;
        }
      };
      module.exports = Animatable;
    }, function(module, exports, __webpack_require__) {
      var Clip = __webpack_require__(37);
      var color = __webpack_require__(39);
      var util = __webpack_require__(4);
      var isArrayLike = util.isArrayLike;
      var arraySlice = Array.prototype.slice;
      function defaultGetter(target, key) {
        return target[key];
      }
      function defaultSetter(target, key, value) {
        target[key] = value;
      }
      function interpolateNumber(p0, p1, percent) {
        return (p1 - p0) * percent + p0;
      }
      function interpolateString(p0, p1, percent) {
        return percent > 0.5 ? p1 : p0;
      }
      function interpolateArray(p0, p1, percent, out, arrDim) {
        var len = p0.length;
        if (arrDim == 1) {
          for (var i = 0; i < len; i++) {
            out[i] = interpolateNumber(p0[i], p1[i], percent);
          }
        } else {
          var len2 = p0[0].length;
          for (var i = 0; i < len; i++) {
            for (var j = 0; j < len2; j++) {
              out[i][j] = interpolateNumber(p0[i][j], p1[i][j], percent);
            }
          }
        }
      }
      function fillArr(arr0, arr1, arrDim) {
        var arr0Len = arr0.length;
        var arr1Len = arr1.length;
        if (arr0Len !== arr1Len) {
          var isPreviousLarger = arr0Len > arr1Len;
          if (isPreviousLarger) {
            arr0.length = arr1Len;
          } else {
            for (var i = arr0Len; i < arr1Len; i++) {
              arr0.push(arrDim === 1 ? arr1[i] : arraySlice.call(arr1[i]));
            }
          }
        }
        var len2 = arr0[0] && arr0[0].length;
        for (var i = 0; i < arr0.length; i++) {
          if (arrDim === 1) {
            if (isNaN(arr0[i])) {
              arr0[i] = arr1[i];
            }
          } else {
            for (var j = 0; j < len2; j++) {
              if (isNaN(arr0[i][j])) {
                arr0[i][j] = arr1[i][j];
              }
            }
          }
        }
      }
      function isArraySame(arr0, arr1, arrDim) {
        if (arr0 === arr1) {
          return true;
        }
        var len = arr0.length;
        if (len !== arr1.length) {
          return false;
        }
        if (arrDim === 1) {
          for (var i = 0; i < len; i++) {
            if (arr0[i] !== arr1[i]) {
              return false;
            }
          }
        } else {
          var len2 = arr0[0].length;
          for (var i = 0; i < len; i++) {
            for (var j = 0; j < len2; j++) {
              if (arr0[i][j] !== arr1[i][j]) {
                return false;
              }
            }
          }
        }
        return true;
      }
      function catmullRomInterpolateArray(p0, p1, p2, p3, t, t2, t3, out, arrDim) {
        var len = p0.length;
        if (arrDim == 1) {
          for (var i = 0; i < len; i++) {
            out[i] = catmullRomInterpolate(p0[i], p1[i], p2[i], p3[i], t, t2, t3);
          }
        } else {
          var len2 = p0[0].length;
          for (var i = 0; i < len; i++) {
            for (var j = 0; j < len2; j++) {
              out[i][j] = catmullRomInterpolate(p0[i][j], p1[i][j], p2[i][j], p3[i][j], t, t2, t3);
            }
          }
        }
      }
      function catmullRomInterpolate(p0, p1, p2, p3, t, t2, t3) {
        var v0 = (p2 - p0) * 0.5;
        var v1 = (p3 - p1) * 0.5;
        return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
      }
      function cloneValue(value) {
        if (isArrayLike(value)) {
          var len = value.length;
          if (isArrayLike(value[0])) {
            var ret = [];
            for (var i = 0; i < len; i++) {
              ret.push(arraySlice.call(value[i]));
            }
            return ret;
          }
          return arraySlice.call(value);
        }
        return value;
      }
      function rgba2String(rgba) {
        rgba[0] = Math.floor(rgba[0]);
        rgba[1] = Math.floor(rgba[1]);
        rgba[2] = Math.floor(rgba[2]);
        return 'rgba(' + rgba.join(',') + ')';
      }
      function createTrackClip(animator, easing, oneTrackDone, keyframes, propName) {
        var getter = animator._getter;
        var setter = animator._setter;
        var useSpline = easing === 'spline';
        var trackLen = keyframes.length;
        if (!trackLen) {
          return;
        }
        var firstVal = keyframes[0].value;
        var isValueArray = isArrayLike(firstVal);
        var isValueColor = false;
        var isValueString = false;
        var arrDim = (isValueArray && isArrayLike(firstVal[0])) ? 2 : 1;
        var trackMaxTime;
        keyframes.sort(function(a, b) {
          return a.time - b.time;
        });
        trackMaxTime = keyframes[trackLen - 1].time;
        var kfPercents = [];
        var kfValues = [];
        var prevValue = keyframes[0].value;
        var isAllValueEqual = true;
        for (var i = 0; i < trackLen; i++) {
          kfPercents.push(keyframes[i].time / trackMaxTime);
          var value = keyframes[i].value;
          if (!((isValueArray && isArraySame(value, prevValue, arrDim)) || (!isValueArray && value === prevValue))) {
            isAllValueEqual = false;
          }
          prevValue = value;
          if (typeof value == 'string') {
            var colorArray = color.parse(value);
            if (colorArray) {
              value = colorArray;
              isValueColor = true;
            } else {
              isValueString = true;
            }
          }
          kfValues.push(value);
        }
        if (isAllValueEqual) {
          return;
        }
        var lastValue = kfValues[trackLen - 1];
        for (var i = 0; i < trackLen - 1; i++) {
          if (isValueArray) {
            fillArr(kfValues[i], lastValue, arrDim);
          } else {
            if (isNaN(kfValues[i]) && !isNaN(lastValue) && !isValueString && !isValueColor) {
              kfValues[i] = lastValue;
            }
          }
        }
        isValueArray && fillArr(getter(animator._target, propName), lastValue, arrDim);
        var lastFrame = 0;
        var lastFramePercent = 0;
        var start;
        var w;
        var p0;
        var p1;
        var p2;
        var p3;
        if (isValueColor) {
          var rgba = [0, 0, 0, 0];
        }
        var onframe = function(target, percent) {
          var frame;
          if (percent < 0) {
            frame = 0;
          } else if (percent < lastFramePercent) {
            start = Math.min(lastFrame + 1, trackLen - 1);
            for (frame = start; frame >= 0; frame--) {
              if (kfPercents[frame] <= percent) {
                break;
              }
            }
            frame = Math.min(frame, trackLen - 2);
          } else {
            for (frame = lastFrame; frame < trackLen; frame++) {
              if (kfPercents[frame] > percent) {
                break;
              }
            }
            frame = Math.min(frame - 1, trackLen - 2);
          }
          lastFrame = frame;
          lastFramePercent = percent;
          var range = (kfPercents[frame + 1] - kfPercents[frame]);
          if (range === 0) {
            return;
          } else {
            w = (percent - kfPercents[frame]) / range;
          }
          if (useSpline) {
            p1 = kfValues[frame];
            p0 = kfValues[frame === 0 ? frame : frame - 1];
            p2 = kfValues[frame > trackLen - 2 ? trackLen - 1 : frame + 1];
            p3 = kfValues[frame > trackLen - 3 ? trackLen - 1 : frame + 2];
            if (isValueArray) {
              catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, getter(target, propName), arrDim);
            } else {
              var value;
              if (isValueColor) {
                value = catmullRomInterpolateArray(p0, p1, p2, p3, w, w * w, w * w * w, rgba, 1);
                value = rgba2String(rgba);
              } else if (isValueString) {
                return interpolateString(p1, p2, w);
              } else {
                value = catmullRomInterpolate(p0, p1, p2, p3, w, w * w, w * w * w);
              }
              setter(target, propName, value);
            }
          } else {
            if (isValueArray) {
              interpolateArray(kfValues[frame], kfValues[frame + 1], w, getter(target, propName), arrDim);
            } else {
              var value;
              if (isValueColor) {
                interpolateArray(kfValues[frame], kfValues[frame + 1], w, rgba, 1);
                value = rgba2String(rgba);
              } else if (isValueString) {
                return interpolateString(kfValues[frame], kfValues[frame + 1], w);
              } else {
                value = interpolateNumber(kfValues[frame], kfValues[frame + 1], w);
              }
              setter(target, propName, value);
            }
          }
        };
        var clip = new Clip({
          target: animator._target,
          life: trackMaxTime,
          loop: animator._loop,
          delay: animator._delay,
          onframe: onframe,
          ondestroy: oneTrackDone
        });
        if (easing && easing !== 'spline') {
          clip.easing = easing;
        }
        return clip;
      }
      var Animator = function(target, loop, getter, setter) {
        this._tracks = {};
        this._target = target;
        this._loop = loop || false;
        this._getter = getter || defaultGetter;
        this._setter = setter || defaultSetter;
        this._clipCount = 0;
        this._delay = 0;
        this._doneList = [];
        this._onframeList = [];
        this._clipList = [];
      };
      Animator.prototype = {
        when: function(time, props) {
          var tracks = this._tracks;
          for (var propName in props) {
            if (!props.hasOwnProperty(propName)) {
              continue;
            }
            if (!tracks[propName]) {
              tracks[propName] = [];
              var value = this._getter(this._target, propName);
              if (value == null) {
                continue;
              }
              if (time !== 0) {
                tracks[propName].push({
                  time: 0,
                  value: cloneValue(value)
                });
              }
            }
            tracks[propName].push({
              time: time,
              value: props[propName]
            });
          }
          return this;
        },
        during: function(callback) {
          this._onframeList.push(callback);
          return this;
        },
        _doneCallback: function() {
          this._tracks = {};
          this._clipList.length = 0;
          var doneList = this._doneList;
          var len = doneList.length;
          for (var i = 0; i < len; i++) {
            doneList[i].call(this);
          }
        },
        start: function(easing) {
          var self = this;
          var clipCount = 0;
          var oneTrackDone = function() {
            clipCount--;
            if (!clipCount) {
              self._doneCallback();
            }
          };
          var lastClip;
          for (var propName in this._tracks) {
            if (!this._tracks.hasOwnProperty(propName)) {
              continue;
            }
            var clip = createTrackClip(this, easing, oneTrackDone, this._tracks[propName], propName);
            if (clip) {
              this._clipList.push(clip);
              clipCount++;
              if (this.animation) {
                this.animation.addClip(clip);
              }
              lastClip = clip;
            }
          }
          if (lastClip) {
            var oldOnFrame = lastClip.onframe;
            lastClip.onframe = function(target, percent) {
              oldOnFrame(target, percent);
              for (var i = 0; i < self._onframeList.length; i++) {
                self._onframeList[i](target, percent);
              }
            };
          }
          if (!clipCount) {
            this._doneCallback();
          }
          return this;
        },
        stop: function(forwardToLast) {
          var clipList = this._clipList;
          var animation = this.animation;
          for (var i = 0; i < clipList.length; i++) {
            var clip = clipList[i];
            if (forwardToLast) {
              clip.onframe(this._target, 1);
            }
            animation && animation.removeClip(clip);
          }
          clipList.length = 0;
        },
        delay: function(time) {
          this._delay = time;
          return this;
        },
        done: function(cb) {
          if (cb) {
            this._doneList.push(cb);
          }
          return this;
        },
        getClips: function() {
          return this._clipList;
        }
      };
      module.exports = Animator;
    }, function(module, exports, __webpack_require__) {
      var easingFuncs = __webpack_require__(38);
      function Clip(options) {
        this._target = options.target;
        this._life = options.life || 1000;
        this._delay = options.delay || 0;
        this._initialized = false;
        this.loop = options.loop == null ? false : options.loop;
        this.gap = options.gap || 0;
        this.easing = options.easing || 'Linear';
        this.onframe = options.onframe;
        this.ondestroy = options.ondestroy;
        this.onrestart = options.onrestart;
      }
      Clip.prototype = {
        constructor: Clip,
        step: function(globalTime) {
          if (!this._initialized) {
            this._startTime = globalTime + this._delay;
            this._initialized = true;
          }
          var percent = (globalTime - this._startTime) / this._life;
          if (percent < 0) {
            return;
          }
          percent = Math.min(percent, 1);
          var easing = this.easing;
          var easingFunc = typeof easing == 'string' ? easingFuncs[easing] : easing;
          var schedule = typeof easingFunc === 'function' ? easingFunc(percent) : percent;
          this.fire('frame', schedule);
          if (percent == 1) {
            if (this.loop) {
              this.restart(globalTime);
              return 'restart';
            }
            this._needsRemove = true;
            return 'destroy';
          }
          return null;
        },
        restart: function(globalTime) {
          var remainder = (globalTime - this._startTime) % this._life;
          this._startTime = globalTime - remainder + this.gap;
          this._needsRemove = false;
        },
        fire: function(eventType, arg) {
          eventType = 'on' + eventType;
          if (this[eventType]) {
            this[eventType](this._target, arg);
          }
        }
      };
      module.exports = Clip;
    }, function(module, exports) {
      var easing = {
        linear: function(k) {
          return k;
        },
        quadraticIn: function(k) {
          return k * k;
        },
        quadraticOut: function(k) {
          return k * (2 - k);
        },
        quadraticInOut: function(k) {
          if ((k *= 2) < 1) {
            return 0.5 * k * k;
          }
          return -0.5 * (--k * (k - 2) - 1);
        },
        cubicIn: function(k) {
          return k * k * k;
        },
        cubicOut: function(k) {
          return --k * k * k + 1;
        },
        cubicInOut: function(k) {
          if ((k *= 2) < 1) {
            return 0.5 * k * k * k;
          }
          return 0.5 * ((k -= 2) * k * k + 2);
        },
        quarticIn: function(k) {
          return k * k * k * k;
        },
        quarticOut: function(k) {
          return 1 - (--k * k * k * k);
        },
        quarticInOut: function(k) {
          if ((k *= 2) < 1) {
            return 0.5 * k * k * k * k;
          }
          return -0.5 * ((k -= 2) * k * k * k - 2);
        },
        quinticIn: function(k) {
          return k * k * k * k * k;
        },
        quinticOut: function(k) {
          return --k * k * k * k * k + 1;
        },
        quinticInOut: function(k) {
          if ((k *= 2) < 1) {
            return 0.5 * k * k * k * k * k;
          }
          return 0.5 * ((k -= 2) * k * k * k * k + 2);
        },
        sinusoidalIn: function(k) {
          return 1 - Math.cos(k * Math.PI / 2);
        },
        sinusoidalOut: function(k) {
          return Math.sin(k * Math.PI / 2);
        },
        sinusoidalInOut: function(k) {
          return 0.5 * (1 - Math.cos(Math.PI * k));
        },
        exponentialIn: function(k) {
          return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        exponentialOut: function(k) {
          return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        exponentialInOut: function(k) {
          if (k === 0) {
            return 0;
          }
          if (k === 1) {
            return 1;
          }
          if ((k *= 2) < 1) {
            return 0.5 * Math.pow(1024, k - 1);
          }
          return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        },
        circularIn: function(k) {
          return 1 - Math.sqrt(1 - k * k);
        },
        circularOut: function(k) {
          return Math.sqrt(1 - (--k * k));
        },
        circularInOut: function(k) {
          if ((k *= 2) < 1) {
            return -0.5 * (Math.sqrt(1 - k * k) - 1);
          }
          return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        },
        elasticIn: function(k) {
          var s;
          var a = 0.1;
          var p = 0.4;
          if (k === 0) {
            return 0;
          }
          if (k === 1) {
            return 1;
          }
          if (!a || a < 1) {
            a = 1;
            s = p / 4;
          } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
          }
          return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        },
        elasticOut: function(k) {
          var s;
          var a = 0.1;
          var p = 0.4;
          if (k === 0) {
            return 0;
          }
          if (k === 1) {
            return 1;
          }
          if (!a || a < 1) {
            a = 1;
            s = p / 4;
          } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
          }
          return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
        },
        elasticInOut: function(k) {
          var s;
          var a = 0.1;
          var p = 0.4;
          if (k === 0) {
            return 0;
          }
          if (k === 1) {
            return 1;
          }
          if (!a || a < 1) {
            a = 1;
            s = p / 4;
          } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
          }
          if ((k *= 2) < 1) {
            return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
          }
          return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
        },
        backIn: function(k) {
          var s = 1.70158;
          return k * k * ((s + 1) * k - s);
        },
        backOut: function(k) {
          var s = 1.70158;
          return --k * k * ((s + 1) * k + s) + 1;
        },
        backInOut: function(k) {
          var s = 1.70158 * 1.525;
          if ((k *= 2) < 1) {
            return 0.5 * (k * k * ((s + 1) * k - s));
          }
          return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        },
        bounceIn: function(k) {
          return 1 - easing.bounceOut(1 - k);
        },
        bounceOut: function(k) {
          if (k < (1 / 2.75)) {
            return 7.5625 * k * k;
          } else if (k < (2 / 2.75)) {
            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
          } else if (k < (2.5 / 2.75)) {
            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
          } else {
            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
          }
        },
        bounceInOut: function(k) {
          if (k < 0.5) {
            return easing.bounceIn(k * 2) * 0.5;
          }
          return easing.bounceOut(k * 2 - 1) * 0.5 + 0.5;
        }
      };
      module.exports = easing;
    }, function(module, exports) {
      var kCSSColorTable = {
        'transparent': [0, 0, 0, 0],
        'aliceblue': [240, 248, 255, 1],
        'antiquewhite': [250, 235, 215, 1],
        'aqua': [0, 255, 255, 1],
        'aquamarine': [127, 255, 212, 1],
        'azure': [240, 255, 255, 1],
        'beige': [245, 245, 220, 1],
        'bisque': [255, 228, 196, 1],
        'black': [0, 0, 0, 1],
        'blanchedalmond': [255, 235, 205, 1],
        'blue': [0, 0, 255, 1],
        'blueviolet': [138, 43, 226, 1],
        'brown': [165, 42, 42, 1],
        'burlywood': [222, 184, 135, 1],
        'cadetblue': [95, 158, 160, 1],
        'chartreuse': [127, 255, 0, 1],
        'chocolate': [210, 105, 30, 1],
        'coral': [255, 127, 80, 1],
        'cornflowerblue': [100, 149, 237, 1],
        'cornsilk': [255, 248, 220, 1],
        'crimson': [220, 20, 60, 1],
        'cyan': [0, 255, 255, 1],
        'darkblue': [0, 0, 139, 1],
        'darkcyan': [0, 139, 139, 1],
        'darkgoldenrod': [184, 134, 11, 1],
        'darkgray': [169, 169, 169, 1],
        'darkgreen': [0, 100, 0, 1],
        'darkgrey': [169, 169, 169, 1],
        'darkkhaki': [189, 183, 107, 1],
        'darkmagenta': [139, 0, 139, 1],
        'darkolivegreen': [85, 107, 47, 1],
        'darkorange': [255, 140, 0, 1],
        'darkorchid': [153, 50, 204, 1],
        'darkred': [139, 0, 0, 1],
        'darksalmon': [233, 150, 122, 1],
        'darkseagreen': [143, 188, 143, 1],
        'darkslateblue': [72, 61, 139, 1],
        'darkslategray': [47, 79, 79, 1],
        'darkslategrey': [47, 79, 79, 1],
        'darkturquoise': [0, 206, 209, 1],
        'darkviolet': [148, 0, 211, 1],
        'deeppink': [255, 20, 147, 1],
        'deepskyblue': [0, 191, 255, 1],
        'dimgray': [105, 105, 105, 1],
        'dimgrey': [105, 105, 105, 1],
        'dodgerblue': [30, 144, 255, 1],
        'firebrick': [178, 34, 34, 1],
        'floralwhite': [255, 250, 240, 1],
        'forestgreen': [34, 139, 34, 1],
        'fuchsia': [255, 0, 255, 1],
        'gainsboro': [220, 220, 220, 1],
        'ghostwhite': [248, 248, 255, 1],
        'gold': [255, 215, 0, 1],
        'goldenrod': [218, 165, 32, 1],
        'gray': [128, 128, 128, 1],
        'green': [0, 128, 0, 1],
        'greenyellow': [173, 255, 47, 1],
        'grey': [128, 128, 128, 1],
        'honeydew': [240, 255, 240, 1],
        'hotpink': [255, 105, 180, 1],
        'indianred': [205, 92, 92, 1],
        'indigo': [75, 0, 130, 1],
        'ivory': [255, 255, 240, 1],
        'khaki': [240, 230, 140, 1],
        'lavender': [230, 230, 250, 1],
        'lavenderblush': [255, 240, 245, 1],
        'lawngreen': [124, 252, 0, 1],
        'lemonchiffon': [255, 250, 205, 1],
        'lightblue': [173, 216, 230, 1],
        'lightcoral': [240, 128, 128, 1],
        'lightcyan': [224, 255, 255, 1],
        'lightgoldenrodyellow': [250, 250, 210, 1],
        'lightgray': [211, 211, 211, 1],
        'lightgreen': [144, 238, 144, 1],
        'lightgrey': [211, 211, 211, 1],
        'lightpink': [255, 182, 193, 1],
        'lightsalmon': [255, 160, 122, 1],
        'lightseagreen': [32, 178, 170, 1],
        'lightskyblue': [135, 206, 250, 1],
        'lightslategray': [119, 136, 153, 1],
        'lightslategrey': [119, 136, 153, 1],
        'lightsteelblue': [176, 196, 222, 1],
        'lightyellow': [255, 255, 224, 1],
        'lime': [0, 255, 0, 1],
        'limegreen': [50, 205, 50, 1],
        'linen': [250, 240, 230, 1],
        'magenta': [255, 0, 255, 1],
        'maroon': [128, 0, 0, 1],
        'mediumaquamarine': [102, 205, 170, 1],
        'mediumblue': [0, 0, 205, 1],
        'mediumorchid': [186, 85, 211, 1],
        'mediumpurple': [147, 112, 219, 1],
        'mediumseagreen': [60, 179, 113, 1],
        'mediumslateblue': [123, 104, 238, 1],
        'mediumspringgreen': [0, 250, 154, 1],
        'mediumturquoise': [72, 209, 204, 1],
        'mediumvioletred': [199, 21, 133, 1],
        'midnightblue': [25, 25, 112, 1],
        'mintcream': [245, 255, 250, 1],
        'mistyrose': [255, 228, 225, 1],
        'moccasin': [255, 228, 181, 1],
        'navajowhite': [255, 222, 173, 1],
        'navy': [0, 0, 128, 1],
        'oldlace': [253, 245, 230, 1],
        'olive': [128, 128, 0, 1],
        'olivedrab': [107, 142, 35, 1],
        'orange': [255, 165, 0, 1],
        'orangered': [255, 69, 0, 1],
        'orchid': [218, 112, 214, 1],
        'palegoldenrod': [238, 232, 170, 1],
        'palegreen': [152, 251, 152, 1],
        'paleturquoise': [175, 238, 238, 1],
        'palevioletred': [219, 112, 147, 1],
        'papayawhip': [255, 239, 213, 1],
        'peachpuff': [255, 218, 185, 1],
        'peru': [205, 133, 63, 1],
        'pink': [255, 192, 203, 1],
        'plum': [221, 160, 221, 1],
        'powderblue': [176, 224, 230, 1],
        'purple': [128, 0, 128, 1],
        'red': [255, 0, 0, 1],
        'rosybrown': [188, 143, 143, 1],
        'royalblue': [65, 105, 225, 1],
        'saddlebrown': [139, 69, 19, 1],
        'salmon': [250, 128, 114, 1],
        'sandybrown': [244, 164, 96, 1],
        'seagreen': [46, 139, 87, 1],
        'seashell': [255, 245, 238, 1],
        'sienna': [160, 82, 45, 1],
        'silver': [192, 192, 192, 1],
        'skyblue': [135, 206, 235, 1],
        'slateblue': [106, 90, 205, 1],
        'slategray': [112, 128, 144, 1],
        'slategrey': [112, 128, 144, 1],
        'snow': [255, 250, 250, 1],
        'springgreen': [0, 255, 127, 1],
        'steelblue': [70, 130, 180, 1],
        'tan': [210, 180, 140, 1],
        'teal': [0, 128, 128, 1],
        'thistle': [216, 191, 216, 1],
        'tomato': [255, 99, 71, 1],
        'turquoise': [64, 224, 208, 1],
        'violet': [238, 130, 238, 1],
        'wheat': [245, 222, 179, 1],
        'white': [255, 255, 255, 1],
        'whitesmoke': [245, 245, 245, 1],
        'yellow': [255, 255, 0, 1],
        'yellowgreen': [154, 205, 50, 1]
      };
      function clampCssByte(i) {
        i = Math.round(i);
        return i < 0 ? 0 : i > 255 ? 255 : i;
      }
      function clampCssAngle(i) {
        i = Math.round(i);
        return i < 0 ? 0 : i > 360 ? 360 : i;
      }
      function clampCssFloat(f) {
        return f < 0 ? 0 : f > 1 ? 1 : f;
      }
      function parseCssInt(str) {
        if (str.length && str.charAt(str.length - 1) === '%') {
          return clampCssByte(parseFloat(str) / 100 * 255);
        }
        return clampCssByte(parseInt(str, 10));
      }
      function parseCssFloat(str) {
        if (str.length && str.charAt(str.length - 1) === '%') {
          return clampCssFloat(parseFloat(str) / 100);
        }
        return clampCssFloat(parseFloat(str));
      }
      function cssHueToRgb(m1, m2, h) {
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
        if (h * 6 < 1) {
          return m1 + (m2 - m1) * h * 6;
        }
        if (h * 2 < 1) {
          return m2;
        }
        if (h * 3 < 2) {
          return m1 + (m2 - m1) * (2 / 3 - h) * 6;
        }
        return m1;
      }
      function lerp(a, b, p) {
        return a + (b - a) * p;
      }
      function parse(colorStr) {
        if (!colorStr) {
          return;
        }
        colorStr = colorStr + '';
        var str = colorStr.replace(/ /g, '').toLowerCase();
        if (str in kCSSColorTable) {
          return kCSSColorTable[str].slice();
        }
        if (str.charAt(0) === '#') {
          if (str.length === 4) {
            var iv = parseInt(str.substr(1), 16);
            if (!(iv >= 0 && iv <= 0xfff)) {
              return;
            }
            return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8), (iv & 0xf0) | ((iv & 0xf0) >> 4), (iv & 0xf) | ((iv & 0xf) << 4), 1];
          } else if (str.length === 7) {
            var iv = parseInt(str.substr(1), 16);
            if (!(iv >= 0 && iv <= 0xffffff)) {
              return;
            }
            return [(iv & 0xff0000) >> 16, (iv & 0xff00) >> 8, iv & 0xff, 1];
          }
          return;
        }
        var op = str.indexOf('('),
            ep = str.indexOf(')');
        if (op !== -1 && ep + 1 === str.length) {
          var fname = str.substr(0, op);
          var params = str.substr(op + 1, ep - (op + 1)).split(',');
          var alpha = 1;
          switch (fname) {
            case 'rgba':
              if (params.length !== 4) {
                return;
              }
              alpha = parseCssFloat(params.pop());
            case 'rgb':
              if (params.length !== 3) {
                return;
              }
              return [parseCssInt(params[0]), parseCssInt(params[1]), parseCssInt(params[2]), alpha];
            case 'hsla':
              if (params.length !== 4) {
                return;
              }
              params[3] = parseCssFloat(params[3]);
              return hsla2rgba(params);
            case 'hsl':
              if (params.length !== 3) {
                return;
              }
              return hsla2rgba(params);
            default:
              return;
          }
        }
        return;
      }
      function hsla2rgba(hsla) {
        var h = (((parseFloat(hsla[0]) % 360) + 360) % 360) / 360;
        var s = parseCssFloat(hsla[1]);
        var l = parseCssFloat(hsla[2]);
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;
        var rgba = [clampCssByte(cssHueToRgb(m1, m2, h + 1 / 3) * 255), clampCssByte(cssHueToRgb(m1, m2, h) * 255), clampCssByte(cssHueToRgb(m1, m2, h - 1 / 3) * 255)];
        if (hsla.length === 4) {
          rgba[3] = hsla[3];
        }
        return rgba;
      }
      function rgba2hsla(rgba) {
        if (!rgba) {
          return;
        }
        var R = rgba[0] / 255;
        var G = rgba[1] / 255;
        var B = rgba[2] / 255;
        var vMin = Math.min(R, G, B);
        var vMax = Math.max(R, G, B);
        var delta = vMax - vMin;
        var L = (vMax + vMin) / 2;
        var H;
        var S;
        if (delta === 0) {
          H = 0;
          S = 0;
        } else {
          if (L < 0.5) {
            S = delta / (vMax + vMin);
          } else {
            S = delta / (2 - vMax - vMin);
          }
          var deltaR = (((vMax - R) / 6) + (delta / 2)) / delta;
          var deltaG = (((vMax - G) / 6) + (delta / 2)) / delta;
          var deltaB = (((vMax - B) / 6) + (delta / 2)) / delta;
          if (R === vMax) {
            H = deltaB - deltaG;
          } else if (G === vMax) {
            H = (1 / 3) + deltaR - deltaB;
          } else if (B === vMax) {
            H = (2 / 3) + deltaG - deltaR;
          }
          if (H < 0) {
            H += 1;
          }
          if (H > 1) {
            H -= 1;
          }
        }
        var hsla = [H * 360, S, L];
        if (rgba[3] != null) {
          hsla.push(rgba[3]);
        }
        return hsla;
      }
      function lift(color, level) {
        var colorArr = parse(color);
        if (colorArr) {
          for (var i = 0; i < 3; i++) {
            if (level < 0) {
              colorArr[i] = colorArr[i] * (1 - level) | 0;
            } else {
              colorArr[i] = ((255 - colorArr[i]) * level + colorArr[i]) | 0;
            }
          }
          return stringify(colorArr, colorArr.length === 4 ? 'rgba' : 'rgb');
        }
      }
      function toHex(color, level) {
        var colorArr = parse(color);
        if (colorArr) {
          return ((1 << 24) + (colorArr[0] << 16) + (colorArr[1] << 8) + (+colorArr[2])).toString(16).slice(1);
        }
      }
      function fastMapToColor(normalizedValue, colors, out) {
        if (!(colors && colors.length) || !(normalizedValue >= 0 && normalizedValue <= 1)) {
          return;
        }
        out = out || [0, 0, 0, 0];
        var value = normalizedValue * (colors.length - 1);
        var leftIndex = Math.floor(value);
        var rightIndex = Math.ceil(value);
        var leftColor = colors[leftIndex];
        var rightColor = colors[rightIndex];
        var dv = value - leftIndex;
        out[0] = clampCssByte(lerp(leftColor[0], rightColor[0], dv));
        out[1] = clampCssByte(lerp(leftColor[1], rightColor[1], dv));
        out[2] = clampCssByte(lerp(leftColor[2], rightColor[2], dv));
        out[3] = clampCssByte(lerp(leftColor[3], rightColor[3], dv));
        return out;
      }
      function mapToColor(normalizedValue, colors, fullOutput) {
        if (!(colors && colors.length) || !(normalizedValue >= 0 && normalizedValue <= 1)) {
          return;
        }
        var value = normalizedValue * (colors.length - 1);
        var leftIndex = Math.floor(value);
        var rightIndex = Math.ceil(value);
        var leftColor = parse(colors[leftIndex]);
        var rightColor = parse(colors[rightIndex]);
        var dv = value - leftIndex;
        var color = stringify([clampCssByte(lerp(leftColor[0], rightColor[0], dv)), clampCssByte(lerp(leftColor[1], rightColor[1], dv)), clampCssByte(lerp(leftColor[2], rightColor[2], dv)), clampCssFloat(lerp(leftColor[3], rightColor[3], dv))], 'rgba');
        return fullOutput ? {
          color: color,
          leftIndex: leftIndex,
          rightIndex: rightIndex,
          value: value
        } : color;
      }
      function modifyHSL(color, h, s, l) {
        color = parse(color);
        if (color) {
          color = rgba2hsla(color);
          h != null && (color[0] = clampCssAngle(h));
          s != null && (color[1] = parseCssFloat(s));
          l != null && (color[2] = parseCssFloat(l));
          return stringify(hsla2rgba(color), 'rgba');
        }
      }
      function modifyAlpha(color, alpha) {
        color = parse(color);
        if (color && alpha != null) {
          color[3] = clampCssFloat(alpha);
          return stringify(color, 'rgba');
        }
      }
      function stringify(arrColor, type) {
        var colorStr = arrColor[0] + ',' + arrColor[1] + ',' + arrColor[2];
        if (type === 'rgba' || type === 'hsva' || type === 'hsla') {
          colorStr += ',' + arrColor[3];
        }
        return type + '(' + colorStr + ')';
      }
      module.exports = {
        parse: parse,
        lift: lift,
        toHex: toHex,
        fastMapToColor: fastMapToColor,
        mapToColor: mapToColor,
        modifyHSL: modifyHSL,
        modifyAlpha: modifyAlpha,
        stringify: stringify
      };
    }, function(module, exports, __webpack_require__) {
      var config = __webpack_require__(41);
      module.exports = function() {
        if (config.debugMode === 0) {
          return;
        } else if (config.debugMode == 1) {
          for (var k in arguments) {
            throw new Error(arguments[k]);
          }
        } else if (config.debugMode > 1) {
          for (var k in arguments) {
            console.log(arguments[k]);
          }
        }
      };
    }, function(module, exports) {
      var dpr = 1;
      if (typeof window !== 'undefined') {
        dpr = Math.max(window.devicePixelRatio || 1, 1);
      }
      var config = {
        debugMode: 0,
        devicePixelRatio: dpr
      };
      module.exports = config;
    }, function(module, exports, __webpack_require__) {
      var Group = __webpack_require__(30);
      var componentUtil = __webpack_require__(20);
      var clazzUtil = __webpack_require__(13);
      var modelUtil = __webpack_require__(5);
      var zrUtil = __webpack_require__(4);
      function Chart() {
        this.group = new Group();
        this.uid = componentUtil.getUID('viewChart');
      }
      Chart.prototype = {
        type: 'chart',
        init: function(ecModel, api) {},
        render: function(seriesModel, ecModel, api, payload) {},
        highlight: function(seriesModel, ecModel, api, payload) {
          toggleHighlight(seriesModel.getData(), payload, 'emphasis');
        },
        downplay: function(seriesModel, ecModel, api, payload) {
          toggleHighlight(seriesModel.getData(), payload, 'normal');
        },
        remove: function(ecModel, api) {
          this.group.removeAll();
        },
        dispose: function() {}
      };
      var chartProto = Chart.prototype;
      chartProto.updateView = chartProto.updateLayout = chartProto.updateVisual = function(seriesModel, ecModel, api, payload) {
        this.render(seriesModel, ecModel, api, payload);
      };
      function elSetState(el, state) {
        if (el) {
          el.trigger(state);
          if (el.type === 'group') {
            for (var i = 0; i < el.childCount(); i++) {
              elSetState(el.childAt(i), state);
            }
          }
        }
      }
      function toggleHighlight(data, payload, state) {
        var dataIndex = modelUtil.queryDataIndex(data, payload);
        if (dataIndex != null) {
          zrUtil.each(modelUtil.normalizeToArray(dataIndex), function(dataIdx) {
            elSetState(data.getItemGraphicEl(dataIdx), state);
          });
        } else {
          data.eachItemGraphicEl(function(el) {
            elSetState(el, state);
          });
        }
      }
      clazzUtil.enableClassExtend(Chart, ['dispose']);
      clazzUtil.enableClassManagement(Chart, {registerWhenExtend: true});
      module.exports = Chart;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var pathTool = __webpack_require__(44);
      var round = Math.round;
      var Path = __webpack_require__(45);
      var colorTool = __webpack_require__(39);
      var matrix = __webpack_require__(11);
      var vector = __webpack_require__(10);
      var graphic = {};
      graphic.Group = __webpack_require__(30);
      graphic.Image = __webpack_require__(61);
      graphic.Text = __webpack_require__(63);
      graphic.Circle = __webpack_require__(64);
      graphic.Sector = __webpack_require__(65);
      graphic.Ring = __webpack_require__(66);
      graphic.Polygon = __webpack_require__(67);
      graphic.Polyline = __webpack_require__(71);
      graphic.Rect = __webpack_require__(72);
      graphic.Line = __webpack_require__(74);
      graphic.BezierCurve = __webpack_require__(75);
      graphic.Arc = __webpack_require__(76);
      graphic.CompoundPath = __webpack_require__(77);
      graphic.LinearGradient = __webpack_require__(78);
      graphic.RadialGradient = __webpack_require__(80);
      graphic.BoundingRect = __webpack_require__(9);
      graphic.extendShape = function(opts) {
        return Path.extend(opts);
      };
      graphic.extendPath = function(pathData, opts) {
        return pathTool.extendFromString(pathData, opts);
      };
      graphic.makePath = function(pathData, opts, rect, layout) {
        var path = pathTool.createFromString(pathData, opts);
        var boundingRect = path.getBoundingRect();
        if (rect) {
          var aspect = boundingRect.width / boundingRect.height;
          if (layout === 'center') {
            var width = rect.height * aspect;
            var height;
            if (width <= rect.width) {
              height = rect.height;
            } else {
              width = rect.width;
              height = width / aspect;
            }
            var cx = rect.x + rect.width / 2;
            var cy = rect.y + rect.height / 2;
            rect.x = cx - width / 2;
            rect.y = cy - height / 2;
            rect.width = width;
            rect.height = height;
          }
          graphic.resizePath(path, rect);
        }
        return path;
      };
      graphic.mergePath = pathTool.mergePath, graphic.resizePath = function(path, rect) {
        if (!path.applyTransform) {
          return;
        }
        var pathRect = path.getBoundingRect();
        var m = pathRect.calculateTransform(rect);
        path.applyTransform(m);
      };
      graphic.subPixelOptimizeLine = function(param) {
        var subPixelOptimize = graphic.subPixelOptimize;
        var shape = param.shape;
        var lineWidth = param.style.lineWidth;
        if (round(shape.x1 * 2) === round(shape.x2 * 2)) {
          shape.x1 = shape.x2 = subPixelOptimize(shape.x1, lineWidth, true);
        }
        if (round(shape.y1 * 2) === round(shape.y2 * 2)) {
          shape.y1 = shape.y2 = subPixelOptimize(shape.y1, lineWidth, true);
        }
        return param;
      };
      graphic.subPixelOptimizeRect = function(param) {
        var subPixelOptimize = graphic.subPixelOptimize;
        var shape = param.shape;
        var lineWidth = param.style.lineWidth;
        var originX = shape.x;
        var originY = shape.y;
        var originWidth = shape.width;
        var originHeight = shape.height;
        shape.x = subPixelOptimize(shape.x, lineWidth, true);
        shape.y = subPixelOptimize(shape.y, lineWidth, true);
        shape.width = Math.max(subPixelOptimize(originX + originWidth, lineWidth, false) - shape.x, originWidth === 0 ? 0 : 1);
        shape.height = Math.max(subPixelOptimize(originY + originHeight, lineWidth, false) - shape.y, originHeight === 0 ? 0 : 1);
        return param;
      };
      graphic.subPixelOptimize = function(position, lineWidth, positiveOrNegative) {
        var doubledPosition = round(position * 2);
        return (doubledPosition + round(lineWidth)) % 2 === 0 ? doubledPosition / 2 : (doubledPosition + (positiveOrNegative ? 1 : -1)) / 2;
      };
      function hasFillOrStroke(fillOrStroke) {
        return fillOrStroke != null && fillOrStroke != 'none';
      }
      function liftColor(color) {
        return typeof color === 'string' ? colorTool.lift(color, -0.1) : color;
      }
      function cacheElementStl(el) {
        if (el.__hoverStlDirty) {
          var stroke = el.style.stroke;
          var fill = el.style.fill;
          var hoverStyle = el.__hoverStl;
          hoverStyle.fill = hoverStyle.fill || (hasFillOrStroke(fill) ? liftColor(fill) : null);
          hoverStyle.stroke = hoverStyle.stroke || (hasFillOrStroke(stroke) ? liftColor(stroke) : null);
          var normalStyle = {};
          for (var name in hoverStyle) {
            if (hoverStyle.hasOwnProperty(name)) {
              normalStyle[name] = el.style[name];
            }
          }
          el.__normalStl = normalStyle;
          el.__hoverStlDirty = false;
        }
      }
      function doSingleEnterHover(el) {
        if (el.__isHover) {
          return;
        }
        cacheElementStl(el);
        if (el.useHoverLayer) {
          el.__zr && el.__zr.addHover(el, el.__hoverStl);
        } else {
          el.setStyle(el.__hoverStl);
          el.z2 += 1;
        }
        el.__isHover = true;
      }
      function doSingleLeaveHover(el) {
        if (!el.__isHover) {
          return;
        }
        var normalStl = el.__normalStl;
        if (el.useHoverLayer) {
          el.__zr && el.__zr.removeHover(el);
        } else {
          normalStl && el.setStyle(normalStl);
          el.z2 -= 1;
        }
        el.__isHover = false;
      }
      function doEnterHover(el) {
        el.type === 'group' ? el.traverse(function(child) {
          if (child.type !== 'group') {
            doSingleEnterHover(child);
          }
        }) : doSingleEnterHover(el);
      }
      function doLeaveHover(el) {
        el.type === 'group' ? el.traverse(function(child) {
          if (child.type !== 'group') {
            doSingleLeaveHover(child);
          }
        }) : doSingleLeaveHover(el);
      }
      function setElementHoverStl(el, hoverStl) {
        el.__hoverStl = el.hoverStyle || hoverStl || {};
        el.__hoverStlDirty = true;
        if (el.__isHover) {
          cacheElementStl(el);
        }
      }
      function onElementMouseOver(e) {
        if (this.__hoverSilentOnTouch && e.zrByTouch) {
          return;
        }
        !this.__isEmphasis && doEnterHover(this);
      }
      function onElementMouseOut(e) {
        if (this.__hoverSilentOnTouch && e.zrByTouch) {
          return;
        }
        !this.__isEmphasis && doLeaveHover(this);
      }
      function enterEmphasis() {
        this.__isEmphasis = true;
        doEnterHover(this);
      }
      function leaveEmphasis() {
        this.__isEmphasis = false;
        doLeaveHover(this);
      }
      graphic.setHoverStyle = function(el, hoverStyle, opt) {
        el.__hoverSilentOnTouch = opt && opt.hoverSilentOnTouch;
        el.type === 'group' ? el.traverse(function(child) {
          if (child.type !== 'group') {
            setElementHoverStl(child, hoverStyle);
          }
        }) : setElementHoverStl(el, hoverStyle);
        el.on('mouseover', onElementMouseOver).on('mouseout', onElementMouseOut);
        el.on('emphasis', enterEmphasis).on('normal', leaveEmphasis);
      };
      graphic.setText = function(textStyle, labelModel, color) {
        var labelPosition = labelModel.getShallow('position') || 'inside';
        var labelOffset = labelModel.getShallow('offset');
        var labelColor = labelPosition.indexOf('inside') >= 0 ? 'white' : color;
        var textStyleModel = labelModel.getModel('textStyle');
        zrUtil.extend(textStyle, {
          textDistance: labelModel.getShallow('distance') || 5,
          textFont: textStyleModel.getFont(),
          textPosition: labelPosition,
          textOffset: labelOffset,
          textFill: textStyleModel.getTextColor() || labelColor
        });
      };
      function animateOrSetProps(isUpdate, el, props, animatableModel, dataIndex, cb) {
        if (typeof dataIndex === 'function') {
          cb = dataIndex;
          dataIndex = null;
        }
        var animationEnabled = animatableModel && animatableModel.isAnimationEnabled();
        if (animationEnabled) {
          var postfix = isUpdate ? 'Update' : '';
          var duration = animatableModel.getShallow('animationDuration' + postfix);
          var animationEasing = animatableModel.getShallow('animationEasing' + postfix);
          var animationDelay = animatableModel.getShallow('animationDelay' + postfix);
          if (typeof animationDelay === 'function') {
            animationDelay = animationDelay(dataIndex, animatableModel.getAnimationDelayParams ? animatableModel.getAnimationDelayParams(el, dataIndex) : null);
          }
          if (typeof duration === 'function') {
            duration = duration(dataIndex);
          }
          duration > 0 ? el.animateTo(props, duration, animationDelay || 0, animationEasing, cb) : (el.attr(props), cb && cb());
        } else {
          el.attr(props);
          cb && cb();
        }
      }
      graphic.updateProps = function(el, props, animatableModel, dataIndex, cb) {
        animateOrSetProps(true, el, props, animatableModel, dataIndex, cb);
      };
      graphic.initProps = function(el, props, animatableModel, dataIndex, cb) {
        animateOrSetProps(false, el, props, animatableModel, dataIndex, cb);
      };
      graphic.getTransform = function(target, ancestor) {
        var mat = matrix.identity([]);
        while (target && target !== ancestor) {
          matrix.mul(mat, target.getLocalTransform(), mat);
          target = target.parent;
        }
        return mat;
      };
      graphic.applyTransform = function(vertex, transform, invert) {
        if (invert) {
          transform = matrix.invert([], transform);
        }
        return vector.applyTransform([], vertex, transform);
      };
      graphic.transformDirection = function(direction, transform, invert) {
        var hBase = (transform[4] === 0 || transform[5] === 0 || transform[0] === 0) ? 1 : Math.abs(2 * transform[4] / transform[0]);
        var vBase = (transform[4] === 0 || transform[5] === 0 || transform[2] === 0) ? 1 : Math.abs(2 * transform[4] / transform[2]);
        var vertex = [direction === 'left' ? -hBase : direction === 'right' ? hBase : 0, direction === 'top' ? -vBase : direction === 'bottom' ? vBase : 0];
        vertex = graphic.applyTransform(vertex, transform, invert);
        return Math.abs(vertex[0]) > Math.abs(vertex[1]) ? (vertex[0] > 0 ? 'right' : 'left') : (vertex[1] > 0 ? 'bottom' : 'top');
      };
      graphic.groupTransition = function(g1, g2, animatableModel, cb) {
        if (!g1 || !g2) {
          return;
        }
        function getElMap(g) {
          var elMap = {};
          g.traverse(function(el) {
            if (!el.isGroup && el.anid) {
              elMap[el.anid] = el;
            }
          });
          return elMap;
        }
        function getAnimatableProps(el) {
          var obj = {
            position: vector.clone(el.position),
            rotation: el.rotation
          };
          if (el.shape) {
            obj.shape = zrUtil.extend({}, el.shape);
          }
          return obj;
        }
        var elMap1 = getElMap(g1);
        g2.traverse(function(el) {
          if (!el.isGroup && el.anid) {
            var oldEl = elMap1[el.anid];
            if (oldEl) {
              var newProp = getAnimatableProps(el);
              el.attr(getAnimatableProps(oldEl));
              graphic.updateProps(el, newProp, animatableModel, el.dataIndex);
            }
          }
        });
      };
      module.exports = graphic;
    }, function(module, exports, __webpack_require__) {
      var Path = __webpack_require__(45);
      var PathProxy = __webpack_require__(49);
      var transformPath = __webpack_require__(60);
      var matrix = __webpack_require__(11);
      var cc = ['m', 'M', 'l', 'L', 'v', 'V', 'h', 'H', 'z', 'Z', 'c', 'C', 'q', 'Q', 't', 'T', 's', 'S', 'a', 'A'];
      var mathSqrt = Math.sqrt;
      var mathSin = Math.sin;
      var mathCos = Math.cos;
      var PI = Math.PI;
      var vMag = function(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      };
      var vRatio = function(u, v) {
        return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
      };
      var vAngle = function(u, v) {
        return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
      };
      function processArc(x1, y1, x2, y2, fa, fs, rx, ry, psiDeg, cmd, path) {
        var psi = psiDeg * (PI / 180.0);
        var xp = mathCos(psi) * (x1 - x2) / 2.0 + mathSin(psi) * (y1 - y2) / 2.0;
        var yp = -1 * mathSin(psi) * (x1 - x2) / 2.0 + mathCos(psi) * (y1 - y2) / 2.0;
        var lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
        if (lambda > 1) {
          rx *= mathSqrt(lambda);
          ry *= mathSqrt(lambda);
        }
        var f = (fa === fs ? -1 : 1) * mathSqrt((((rx * rx) * (ry * ry)) - ((rx * rx) * (yp * yp)) - ((ry * ry) * (xp * xp))) / ((rx * rx) * (yp * yp) + (ry * ry) * (xp * xp))) || 0;
        var cxp = f * rx * yp / ry;
        var cyp = f * -ry * xp / rx;
        var cx = (x1 + x2) / 2.0 + mathCos(psi) * cxp - mathSin(psi) * cyp;
        var cy = (y1 + y2) / 2.0 + mathSin(psi) * cxp + mathCos(psi) * cyp;
        var theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
        var u = [(xp - cxp) / rx, (yp - cyp) / ry];
        var v = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
        var dTheta = vAngle(u, v);
        if (vRatio(u, v) <= -1) {
          dTheta = PI;
        }
        if (vRatio(u, v) >= 1) {
          dTheta = 0;
        }
        if (fs === 0 && dTheta > 0) {
          dTheta = dTheta - 2 * PI;
        }
        if (fs === 1 && dTheta < 0) {
          dTheta = dTheta + 2 * PI;
        }
        path.addData(cmd, cx, cy, rx, ry, theta, dTheta, psi, fs);
      }
      function createPathProxyFromString(data) {
        if (!data) {
          return [];
        }
        var cs = data.replace(/-/g, ' -').replace(/  /g, ' ').replace(/ /g, ',').replace(/,,/g, ',');
        var n;
        for (n = 0; n < cc.length; n++) {
          cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
        }
        var arr = cs.split('|');
        var cpx = 0;
        var cpy = 0;
        var path = new PathProxy();
        var CMD = PathProxy.CMD;
        var prevCmd;
        for (n = 1; n < arr.length; n++) {
          var str = arr[n];
          var c = str.charAt(0);
          var off = 0;
          var p = str.slice(1).replace(/e,-/g, 'e-').split(',');
          var cmd;
          if (p.length > 0 && p[0] === '') {
            p.shift();
          }
          for (var i = 0; i < p.length; i++) {
            p[i] = parseFloat(p[i]);
          }
          while (off < p.length && !isNaN(p[off])) {
            if (isNaN(p[0])) {
              break;
            }
            var ctlPtx;
            var ctlPty;
            var rx;
            var ry;
            var psi;
            var fa;
            var fs;
            var x1 = cpx;
            var y1 = cpy;
            switch (c) {
              case 'l':
                cpx += p[off++];
                cpy += p[off++];
                cmd = CMD.L;
                path.addData(cmd, cpx, cpy);
                break;
              case 'L':
                cpx = p[off++];
                cpy = p[off++];
                cmd = CMD.L;
                path.addData(cmd, cpx, cpy);
                break;
              case 'm':
                cpx += p[off++];
                cpy += p[off++];
                cmd = CMD.M;
                path.addData(cmd, cpx, cpy);
                c = 'l';
                break;
              case 'M':
                cpx = p[off++];
                cpy = p[off++];
                cmd = CMD.M;
                path.addData(cmd, cpx, cpy);
                c = 'L';
                break;
              case 'h':
                cpx += p[off++];
                cmd = CMD.L;
                path.addData(cmd, cpx, cpy);
                break;
              case 'H':
                cpx = p[off++];
                cmd = CMD.L;
                path.addData(cmd, cpx, cpy);
                break;
              case 'v':
                cpy += p[off++];
                cmd = CMD.L;
                path.addData(cmd, cpx, cpy);
                break;
              case 'V':
                cpy = p[off++];
                cmd = CMD.L;
                path.addData(cmd, cpx, cpy);
                break;
              case 'C':
                cmd = CMD.C;
                path.addData(cmd, p[off++], p[off++], p[off++], p[off++], p[off++], p[off++]);
                cpx = p[off - 2];
                cpy = p[off - 1];
                break;
              case 'c':
                cmd = CMD.C;
                path.addData(cmd, p[off++] + cpx, p[off++] + cpy, p[off++] + cpx, p[off++] + cpy, p[off++] + cpx, p[off++] + cpy);
                cpx += p[off - 2];
                cpy += p[off - 1];
                break;
              case 'S':
                ctlPtx = cpx;
                ctlPty = cpy;
                var len = path.len();
                var pathData = path.data;
                if (prevCmd === CMD.C) {
                  ctlPtx += cpx - pathData[len - 4];
                  ctlPty += cpy - pathData[len - 3];
                }
                cmd = CMD.C;
                x1 = p[off++];
                y1 = p[off++];
                cpx = p[off++];
                cpy = p[off++];
                path.addData(cmd, ctlPtx, ctlPty, x1, y1, cpx, cpy);
                break;
              case 's':
                ctlPtx = cpx;
                ctlPty = cpy;
                var len = path.len();
                var pathData = path.data;
                if (prevCmd === CMD.C) {
                  ctlPtx += cpx - pathData[len - 4];
                  ctlPty += cpy - pathData[len - 3];
                }
                cmd = CMD.C;
                x1 = cpx + p[off++];
                y1 = cpy + p[off++];
                cpx += p[off++];
                cpy += p[off++];
                path.addData(cmd, ctlPtx, ctlPty, x1, y1, cpx, cpy);
                break;
              case 'Q':
                x1 = p[off++];
                y1 = p[off++];
                cpx = p[off++];
                cpy = p[off++];
                cmd = CMD.Q;
                path.addData(cmd, x1, y1, cpx, cpy);
                break;
              case 'q':
                x1 = p[off++] + cpx;
                y1 = p[off++] + cpy;
                cpx += p[off++];
                cpy += p[off++];
                cmd = CMD.Q;
                path.addData(cmd, x1, y1, cpx, cpy);
                break;
              case 'T':
                ctlPtx = cpx;
                ctlPty = cpy;
                var len = path.len();
                var pathData = path.data;
                if (prevCmd === CMD.Q) {
                  ctlPtx += cpx - pathData[len - 4];
                  ctlPty += cpy - pathData[len - 3];
                }
                cpx = p[off++];
                cpy = p[off++];
                cmd = CMD.Q;
                path.addData(cmd, ctlPtx, ctlPty, cpx, cpy);
                break;
              case 't':
                ctlPtx = cpx;
                ctlPty = cpy;
                var len = path.len();
                var pathData = path.data;
                if (prevCmd === CMD.Q) {
                  ctlPtx += cpx - pathData[len - 4];
                  ctlPty += cpy - pathData[len - 3];
                }
                cpx += p[off++];
                cpy += p[off++];
                cmd = CMD.Q;
                path.addData(cmd, ctlPtx, ctlPty, cpx, cpy);
                break;
              case 'A':
                rx = p[off++];
                ry = p[off++];
                psi = p[off++];
                fa = p[off++];
                fs = p[off++];
                x1 = cpx, y1 = cpy;
                cpx = p[off++];
                cpy = p[off++];
                cmd = CMD.A;
                processArc(x1, y1, cpx, cpy, fa, fs, rx, ry, psi, cmd, path);
                break;
              case 'a':
                rx = p[off++];
                ry = p[off++];
                psi = p[off++];
                fa = p[off++];
                fs = p[off++];
                x1 = cpx, y1 = cpy;
                cpx += p[off++];
                cpy += p[off++];
                cmd = CMD.A;
                processArc(x1, y1, cpx, cpy, fa, fs, rx, ry, psi, cmd, path);
                break;
            }
          }
          if (c === 'z' || c === 'Z') {
            cmd = CMD.Z;
            path.addData(cmd);
          }
          prevCmd = cmd;
        }
        path.toStatic();
        return path;
      }
      function createPathOptions(str, opts) {
        var pathProxy = createPathProxyFromString(str);
        var transform;
        opts = opts || {};
        opts.buildPath = function(path) {
          path.setData(pathProxy.data);
          transform && transformPath(path, transform);
          var ctx = path.getContext();
          if (ctx) {
            path.rebuildPath(ctx);
          }
        };
        opts.applyTransform = function(m) {
          if (!transform) {
            transform = matrix.create();
          }
          matrix.mul(transform, m, transform);
          this.dirty(true);
        };
        return opts;
      }
      module.exports = {
        createFromString: function(str, opts) {
          return new Path(createPathOptions(str, opts));
        },
        extendFromString: function(str, opts) {
          return Path.extend(createPathOptions(str, opts));
        },
        mergePath: function(pathEls, opts) {
          var pathList = [];
          var len = pathEls.length;
          for (var i = 0; i < len; i++) {
            var pathEl = pathEls[i];
            if (pathEl.__dirty) {
              pathEl.buildPath(pathEl.path, pathEl.shape, true);
            }
            pathList.push(pathEl.path);
          }
          var pathBundle = new Path(opts);
          pathBundle.buildPath = function(path) {
            path.appendPath(pathList);
            var ctx = path.getContext();
            if (ctx) {
              path.rebuildPath(ctx);
            }
          };
          return pathBundle;
        }
      };
    }, function(module, exports, __webpack_require__) {
      var Displayable = __webpack_require__(46);
      var zrUtil = __webpack_require__(4);
      var PathProxy = __webpack_require__(49);
      var pathContain = __webpack_require__(52);
      var Pattern = __webpack_require__(59);
      var getCanvasPattern = Pattern.prototype.getCanvasPattern;
      var abs = Math.abs;
      function Path(opts) {
        Displayable.call(this, opts);
        this.path = new PathProxy();
      }
      Path.prototype = {
        constructor: Path,
        type: 'path',
        __dirtyPath: true,
        strokeContainThreshold: 5,
        brush: function(ctx, prevEl) {
          var style = this.style;
          var path = this.path;
          var hasStroke = style.hasStroke();
          var hasFill = style.hasFill();
          var fill = style.fill;
          var stroke = style.stroke;
          var hasFillGradient = hasFill && !!(fill.colorStops);
          var hasStrokeGradient = hasStroke && !!(stroke.colorStops);
          var hasFillPattern = hasFill && !!(fill.image);
          var hasStrokePattern = hasStroke && !!(stroke.image);
          style.bind(ctx, this, prevEl);
          this.setTransform(ctx);
          if (this.__dirty) {
            var rect = this.getBoundingRect();
            if (hasFillGradient) {
              this._fillGradient = style.getGradient(ctx, fill, rect);
            }
            if (hasStrokeGradient) {
              this._strokeGradient = style.getGradient(ctx, stroke, rect);
            }
          }
          if (hasFillGradient) {
            ctx.fillStyle = this._fillGradient;
          } else if (hasFillPattern) {
            ctx.fillStyle = getCanvasPattern.call(fill, ctx);
          }
          if (hasStrokeGradient) {
            ctx.strokeStyle = this._strokeGradient;
          } else if (hasStrokePattern) {
            ctx.strokeStyle = getCanvasPattern.call(stroke, ctx);
          }
          var lineDash = style.lineDash;
          var lineDashOffset = style.lineDashOffset;
          var ctxLineDash = !!ctx.setLineDash;
          var scale = this.getGlobalScale();
          path.setScale(scale[0], scale[1]);
          if (this.__dirtyPath || (lineDash && !ctxLineDash && hasStroke)) {
            path = this.path.beginPath(ctx);
            if (lineDash && !ctxLineDash) {
              path.setLineDash(lineDash);
              path.setLineDashOffset(lineDashOffset);
            }
            this.buildPath(path, this.shape, false);
            this.__dirtyPath = false;
          } else {
            ctx.beginPath();
            this.path.rebuildPath(ctx);
          }
          hasFill && path.fill(ctx);
          if (lineDash && ctxLineDash) {
            ctx.setLineDash(lineDash);
            ctx.lineDashOffset = lineDashOffset;
          }
          hasStroke && path.stroke(ctx);
          if (lineDash && ctxLineDash) {
            ctx.setLineDash([]);
          }
          this.restoreTransform(ctx);
          if (style.text != null) {
            this.drawRectText(ctx, this.getBoundingRect());
          }
        },
        buildPath: function(ctx, shapeCfg, inBundle) {},
        getBoundingRect: function() {
          var rect = this._rect;
          var style = this.style;
          var needsUpdateRect = !rect;
          if (needsUpdateRect) {
            var path = this.path;
            if (this.__dirtyPath) {
              path.beginPath();
              this.buildPath(path, this.shape, false);
            }
            rect = path.getBoundingRect();
          }
          this._rect = rect;
          if (style.hasStroke()) {
            var rectWithStroke = this._rectWithStroke || (this._rectWithStroke = rect.clone());
            if (this.__dirty || needsUpdateRect) {
              rectWithStroke.copy(rect);
              var w = style.lineWidth;
              var lineScale = style.strokeNoScale ? this.getLineScale() : 1;
              if (!style.hasFill()) {
                w = Math.max(w, this.strokeContainThreshold || 4);
              }
              if (lineScale > 1e-10) {
                rectWithStroke.width += w / lineScale;
                rectWithStroke.height += w / lineScale;
                rectWithStroke.x -= w / lineScale / 2;
                rectWithStroke.y -= w / lineScale / 2;
              }
            }
            return rectWithStroke;
          }
          return rect;
        },
        contain: function(x, y) {
          var localPos = this.transformCoordToLocal(x, y);
          var rect = this.getBoundingRect();
          var style = this.style;
          x = localPos[0];
          y = localPos[1];
          if (rect.contain(x, y)) {
            var pathData = this.path.data;
            if (style.hasStroke()) {
              var lineWidth = style.lineWidth;
              var lineScale = style.strokeNoScale ? this.getLineScale() : 1;
              if (lineScale > 1e-10) {
                if (!style.hasFill()) {
                  lineWidth = Math.max(lineWidth, this.strokeContainThreshold);
                }
                if (pathContain.containStroke(pathData, lineWidth / lineScale, x, y)) {
                  return true;
                }
              }
            }
            if (style.hasFill()) {
              return pathContain.contain(pathData, x, y);
            }
          }
          return false;
        },
        dirty: function(dirtyPath) {
          if (dirtyPath == null) {
            dirtyPath = true;
          }
          if (dirtyPath) {
            this.__dirtyPath = dirtyPath;
            this._rect = null;
          }
          this.__dirty = true;
          this.__zr && this.__zr.refresh();
          if (this.__clipTarget) {
            this.__clipTarget.dirty();
          }
        },
        animateShape: function(loop) {
          return this.animate('shape', loop);
        },
        attrKV: function(key, value) {
          if (key === 'shape') {
            this.setShape(value);
            this.__dirtyPath = true;
            this._rect = null;
          } else {
            Displayable.prototype.attrKV.call(this, key, value);
          }
        },
        setShape: function(key, value) {
          var shape = this.shape;
          if (shape) {
            if (zrUtil.isObject(key)) {
              for (var name in key) {
                if (key.hasOwnProperty(name)) {
                  shape[name] = key[name];
                }
              }
            } else {
              shape[key] = value;
            }
            this.dirty(true);
          }
          return this;
        },
        getLineScale: function() {
          var m = this.transform;
          return m && abs(m[0] - 1) > 1e-10 && abs(m[3] - 1) > 1e-10 ? Math.sqrt(abs(m[0] * m[3] - m[2] * m[1])) : 1;
        }
      };
      Path.extend = function(defaults) {
        var Sub = function(opts) {
          Path.call(this, opts);
          if (defaults.style) {
            this.style.extendFrom(defaults.style, false);
          }
          var defaultShape = defaults.shape;
          if (defaultShape) {
            this.shape = this.shape || {};
            var thisShape = this.shape;
            for (var name in defaultShape) {
              if (!thisShape.hasOwnProperty(name) && defaultShape.hasOwnProperty(name)) {
                thisShape[name] = defaultShape[name];
              }
            }
          }
          defaults.init && defaults.init.call(this, opts);
        };
        zrUtil.inherits(Sub, Path);
        for (var name in defaults) {
          if (name !== 'style' && name !== 'shape') {
            Sub.prototype[name] = defaults[name];
          }
        }
        return Sub;
      };
      zrUtil.inherits(Path, Displayable);
      module.exports = Path;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var Style = __webpack_require__(47);
      var Element = __webpack_require__(31);
      var RectText = __webpack_require__(48);
      function Displayable(opts) {
        opts = opts || {};
        Element.call(this, opts);
        for (var name in opts) {
          if (opts.hasOwnProperty(name) && name !== 'style') {
            this[name] = opts[name];
          }
        }
        this.style = new Style(opts.style);
        this._rect = null;
        this.__clipPaths = [];
      }
      Displayable.prototype = {
        constructor: Displayable,
        type: 'displayable',
        __dirty: true,
        invisible: false,
        z: 0,
        z2: 0,
        zlevel: 0,
        draggable: false,
        dragging: false,
        silent: false,
        culling: false,
        cursor: 'pointer',
        rectHover: false,
        progressive: -1,
        beforeBrush: function(ctx) {},
        afterBrush: function(ctx) {},
        brush: function(ctx, prevEl) {},
        getBoundingRect: function() {},
        contain: function(x, y) {
          return this.rectContain(x, y);
        },
        traverse: function(cb, context) {
          cb.call(context, this);
        },
        rectContain: function(x, y) {
          var coord = this.transformCoordToLocal(x, y);
          var rect = this.getBoundingRect();
          return rect.contain(coord[0], coord[1]);
        },
        dirty: function() {
          this.__dirty = true;
          this._rect = null;
          this.__zr && this.__zr.refresh();
        },
        animateStyle: function(loop) {
          return this.animate('style', loop);
        },
        attrKV: function(key, value) {
          if (key !== 'style') {
            Element.prototype.attrKV.call(this, key, value);
          } else {
            this.style.set(value);
          }
        },
        setStyle: function(key, value) {
          this.style.set(key, value);
          this.dirty(false);
          return this;
        },
        useStyle: function(obj) {
          this.style = new Style(obj);
          this.dirty(false);
          return this;
        }
      };
      zrUtil.inherits(Displayable, Element);
      zrUtil.mixin(Displayable, RectText);
      module.exports = Displayable;
    }, function(module, exports) {
      var STYLE_COMMON_PROPS = [['shadowBlur', 0], ['shadowOffsetX', 0], ['shadowOffsetY', 0], ['shadowColor', '#000'], ['lineCap', 'butt'], ['lineJoin', 'miter'], ['miterLimit', 10]];
      var Style = function(opts) {
        this.extendFrom(opts);
      };
      function createLinearGradient(ctx, obj, rect) {
        var x = obj.x;
        var x2 = obj.x2;
        var y = obj.y;
        var y2 = obj.y2;
        if (!obj.global) {
          x = x * rect.width + rect.x;
          x2 = x2 * rect.width + rect.x;
          y = y * rect.height + rect.y;
          y2 = y2 * rect.height + rect.y;
        }
        var canvasGradient = ctx.createLinearGradient(x, y, x2, y2);
        return canvasGradient;
      }
      function createRadialGradient(ctx, obj, rect) {
        var width = rect.width;
        var height = rect.height;
        var min = Math.min(width, height);
        var x = obj.x;
        var y = obj.y;
        var r = obj.r;
        if (!obj.global) {
          x = x * width + rect.x;
          y = y * height + rect.y;
          r = r * min;
        }
        var canvasGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        return canvasGradient;
      }
      Style.prototype = {
        constructor: Style,
        fill: '#000000',
        stroke: null,
        opacity: 1,
        lineDash: null,
        lineDashOffset: 0,
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        lineWidth: 1,
        strokeNoScale: false,
        text: null,
        textFill: '#000',
        textStroke: null,
        textPosition: 'inside',
        textOffset: null,
        textBaseline: null,
        textAlign: null,
        textVerticalAlign: null,
        textDistance: 5,
        textShadowBlur: 0,
        textShadowOffsetX: 0,
        textShadowOffsetY: 0,
        textTransform: false,
        textRotation: 0,
        blend: null,
        bind: function(ctx, el, prevEl) {
          var style = this;
          var prevStyle = prevEl && prevEl.style;
          var firstDraw = !prevStyle;
          for (var i = 0; i < STYLE_COMMON_PROPS.length; i++) {
            var prop = STYLE_COMMON_PROPS[i];
            var styleName = prop[0];
            if (firstDraw || style[styleName] !== prevStyle[styleName]) {
              ctx[styleName] = style[styleName] || prop[1];
            }
          }
          if ((firstDraw || style.fill !== prevStyle.fill)) {
            ctx.fillStyle = style.fill;
          }
          if ((firstDraw || style.stroke !== prevStyle.stroke)) {
            ctx.strokeStyle = style.stroke;
          }
          if ((firstDraw || style.opacity !== prevStyle.opacity)) {
            ctx.globalAlpha = style.opacity == null ? 1 : style.opacity;
          }
          if ((firstDraw || style.blend !== prevStyle.blend)) {
            ctx.globalCompositeOperation = style.blend || 'source-over';
          }
          if (this.hasStroke()) {
            var lineWidth = style.lineWidth;
            ctx.lineWidth = lineWidth / ((this.strokeNoScale && el && el.getLineScale) ? el.getLineScale() : 1);
          }
        },
        hasFill: function() {
          var fill = this.fill;
          return fill != null && fill !== 'none';
        },
        hasStroke: function() {
          var stroke = this.stroke;
          return stroke != null && stroke !== 'none' && this.lineWidth > 0;
        },
        extendFrom: function(otherStyle, overwrite) {
          if (otherStyle) {
            var target = this;
            for (var name in otherStyle) {
              if (otherStyle.hasOwnProperty(name) && (overwrite || !target.hasOwnProperty(name))) {
                target[name] = otherStyle[name];
              }
            }
          }
        },
        set: function(obj, value) {
          if (typeof obj === 'string') {
            this[obj] = value;
          } else {
            this.extendFrom(obj, true);
          }
        },
        clone: function() {
          var newStyle = new this.constructor();
          newStyle.extendFrom(this, true);
          return newStyle;
        },
        getGradient: function(ctx, obj, rect) {
          var method = obj.type === 'radial' ? createRadialGradient : createLinearGradient;
          var canvasGradient = method(ctx, obj, rect);
          var colorStops = obj.colorStops;
          for (var i = 0; i < colorStops.length; i++) {
            canvasGradient.addColorStop(colorStops[i].offset, colorStops[i].color);
          }
          return canvasGradient;
        }
      };
      var styleProto = Style.prototype;
      for (var i = 0; i < STYLE_COMMON_PROPS.length; i++) {
        var prop = STYLE_COMMON_PROPS[i];
        if (!(prop[0] in styleProto)) {
          styleProto[prop[0]] = prop[1];
        }
      }
      Style.getGradient = styleProto.getGradient;
      module.exports = Style;
    }, function(module, exports, __webpack_require__) {
      var textContain = __webpack_require__(8);
      var BoundingRect = __webpack_require__(9);
      var tmpRect = new BoundingRect();
      var RectText = function() {};
      function parsePercent(value, maxValue) {
        if (typeof value === 'string') {
          if (value.lastIndexOf('%') >= 0) {
            return parseFloat(value) / 100 * maxValue;
          }
          return parseFloat(value);
        }
        return value;
      }
      RectText.prototype = {
        constructor: RectText,
        drawRectText: function(ctx, rect, textRect) {
          var style = this.style;
          var text = style.text;
          text != null && (text += '');
          if (!text) {
            return;
          }
          ctx.save();
          var x;
          var y;
          var textPosition = style.textPosition;
          var textOffset = style.textOffset;
          var distance = style.textDistance;
          var align = style.textAlign;
          var font = style.textFont || style.font;
          var baseline = style.textBaseline;
          var verticalAlign = style.textVerticalAlign;
          textRect = textRect || textContain.getBoundingRect(text, font, align, baseline);
          var transform = this.transform;
          if (!style.textTransform) {
            if (transform) {
              tmpRect.copy(rect);
              tmpRect.applyTransform(transform);
              rect = tmpRect;
            }
          } else {
            this.setTransform(ctx);
          }
          if (textPosition instanceof Array) {
            x = rect.x + parsePercent(textPosition[0], rect.width);
            y = rect.y + parsePercent(textPosition[1], rect.height);
            align = align || 'left';
            baseline = baseline || 'top';
            if (verticalAlign) {
              switch (verticalAlign) {
                case 'middle':
                  y -= textRect.height / 2 - textRect.lineHeight / 2;
                  break;
                case 'bottom':
                  y -= textRect.height - textRect.lineHeight / 2;
                  break;
                default:
                  y += textRect.lineHeight / 2;
              }
              baseline = 'middle';
            }
          } else {
            var res = textContain.adjustTextPositionOnRect(textPosition, rect, textRect, distance);
            x = res.x;
            y = res.y;
            align = align || res.textAlign;
            baseline = baseline || res.textBaseline;
          }
          if (textOffset) {
            x += textOffset[0];
            y += textOffset[1];
          }
          ctx.textAlign = align || 'left';
          ctx.textBaseline = baseline || 'alphabetic';
          var textFill = style.textFill;
          var textStroke = style.textStroke;
          textFill && (ctx.fillStyle = textFill);
          textStroke && (ctx.strokeStyle = textStroke);
          ctx.font = font || '12px sans-serif';
          ctx.shadowBlur = style.textShadowBlur;
          ctx.shadowColor = style.textShadowColor || 'transparent';
          ctx.shadowOffsetX = style.textShadowOffsetX;
          ctx.shadowOffsetY = style.textShadowOffsetY;
          var textLines = text.split('\n');
          if (style.textRotation) {
            transform && ctx.translate(transform[4], transform[5]);
            ctx.rotate(style.textRotation);
            transform && ctx.translate(-transform[4], -transform[5]);
          }
          for (var i = 0; i < textLines.length; i++) {
            textFill && ctx.fillText(textLines[i], x, y);
            textStroke && ctx.strokeText(textLines[i], x, y);
            y += textRect.lineHeight;
          }
          ctx.restore();
        }
      };
      module.exports = RectText;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var curve = __webpack_require__(50);
      var vec2 = __webpack_require__(10);
      var bbox = __webpack_require__(51);
      var BoundingRect = __webpack_require__(9);
      var dpr = __webpack_require__(41).devicePixelRatio;
      var CMD = {
        M: 1,
        L: 2,
        C: 3,
        Q: 4,
        A: 5,
        Z: 6,
        R: 7
      };
      var min = [];
      var max = [];
      var min2 = [];
      var max2 = [];
      var mathMin = Math.min;
      var mathMax = Math.max;
      var mathCos = Math.cos;
      var mathSin = Math.sin;
      var mathSqrt = Math.sqrt;
      var mathAbs = Math.abs;
      var hasTypedArray = typeof Float32Array != 'undefined';
      var PathProxy = function() {
        this.data = [];
        this._len = 0;
        this._ctx = null;
        this._xi = 0;
        this._yi = 0;
        this._x0 = 0;
        this._y0 = 0;
        this._ux = 0;
        this._uy = 0;
      };
      PathProxy.prototype = {
        constructor: PathProxy,
        _lineDash: null,
        _dashOffset: 0,
        _dashIdx: 0,
        _dashSum: 0,
        setScale: function(sx, sy) {
          this._ux = mathAbs(1 / dpr / sx) || 0;
          this._uy = mathAbs(1 / dpr / sy) || 0;
        },
        getContext: function() {
          return this._ctx;
        },
        beginPath: function(ctx) {
          this._ctx = ctx;
          ctx && ctx.beginPath();
          ctx && (this.dpr = ctx.dpr);
          this._len = 0;
          if (this._lineDash) {
            this._lineDash = null;
            this._dashOffset = 0;
          }
          return this;
        },
        moveTo: function(x, y) {
          this.addData(CMD.M, x, y);
          this._ctx && this._ctx.moveTo(x, y);
          this._x0 = x;
          this._y0 = y;
          this._xi = x;
          this._yi = y;
          return this;
        },
        lineTo: function(x, y) {
          var exceedUnit = mathAbs(x - this._xi) > this._ux || mathAbs(y - this._yi) > this._uy || this._len < 5;
          this.addData(CMD.L, x, y);
          if (this._ctx && exceedUnit) {
            this._needsDash() ? this._dashedLineTo(x, y) : this._ctx.lineTo(x, y);
          }
          if (exceedUnit) {
            this._xi = x;
            this._yi = y;
          }
          return this;
        },
        bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
          this.addData(CMD.C, x1, y1, x2, y2, x3, y3);
          if (this._ctx) {
            this._needsDash() ? this._dashedBezierTo(x1, y1, x2, y2, x3, y3) : this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
          }
          this._xi = x3;
          this._yi = y3;
          return this;
        },
        quadraticCurveTo: function(x1, y1, x2, y2) {
          this.addData(CMD.Q, x1, y1, x2, y2);
          if (this._ctx) {
            this._needsDash() ? this._dashedQuadraticTo(x1, y1, x2, y2) : this._ctx.quadraticCurveTo(x1, y1, x2, y2);
          }
          this._xi = x2;
          this._yi = y2;
          return this;
        },
        arc: function(cx, cy, r, startAngle, endAngle, anticlockwise) {
          this.addData(CMD.A, cx, cy, r, r, startAngle, endAngle - startAngle, 0, anticlockwise ? 0 : 1);
          this._ctx && this._ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
          this._xi = mathCos(endAngle) * r + cx;
          this._yi = mathSin(endAngle) * r + cx;
          return this;
        },
        arcTo: function(x1, y1, x2, y2, radius) {
          if (this._ctx) {
            this._ctx.arcTo(x1, y1, x2, y2, radius);
          }
          return this;
        },
        rect: function(x, y, w, h) {
          this._ctx && this._ctx.rect(x, y, w, h);
          this.addData(CMD.R, x, y, w, h);
          return this;
        },
        closePath: function() {
          this.addData(CMD.Z);
          var ctx = this._ctx;
          var x0 = this._x0;
          var y0 = this._y0;
          if (ctx) {
            this._needsDash() && this._dashedLineTo(x0, y0);
            ctx.closePath();
          }
          this._xi = x0;
          this._yi = y0;
          return this;
        },
        fill: function(ctx) {
          ctx && ctx.fill();
          this.toStatic();
        },
        stroke: function(ctx) {
          ctx && ctx.stroke();
          this.toStatic();
        },
        setLineDash: function(lineDash) {
          if (lineDash instanceof Array) {
            this._lineDash = lineDash;
            this._dashIdx = 0;
            var lineDashSum = 0;
            for (var i = 0; i < lineDash.length; i++) {
              lineDashSum += lineDash[i];
            }
            this._dashSum = lineDashSum;
          }
          return this;
        },
        setLineDashOffset: function(offset) {
          this._dashOffset = offset;
          return this;
        },
        len: function() {
          return this._len;
        },
        setData: function(data) {
          var len = data.length;
          if (!(this.data && this.data.length == len) && hasTypedArray) {
            this.data = new Float32Array(len);
          }
          for (var i = 0; i < len; i++) {
            this.data[i] = data[i];
          }
          this._len = len;
        },
        appendPath: function(path) {
          if (!(path instanceof Array)) {
            path = [path];
          }
          var len = path.length;
          var appendSize = 0;
          var offset = this._len;
          for (var i = 0; i < len; i++) {
            appendSize += path[i].len();
          }
          if (hasTypedArray && (this.data instanceof Float32Array)) {
            this.data = new Float32Array(offset + appendSize);
          }
          for (var i = 0; i < len; i++) {
            var appendPathData = path[i].data;
            for (var k = 0; k < appendPathData.length; k++) {
              this.data[offset++] = appendPathData[k];
            }
          }
          this._len = offset;
        },
        addData: function(cmd) {
          var data = this.data;
          if (this._len + arguments.length > data.length) {
            this._expandData();
            data = this.data;
          }
          for (var i = 0; i < arguments.length; i++) {
            data[this._len++] = arguments[i];
          }
          this._prevCmd = cmd;
        },
        _expandData: function() {
          if (!(this.data instanceof Array)) {
            var newData = [];
            for (var i = 0; i < this._len; i++) {
              newData[i] = this.data[i];
            }
            this.data = newData;
          }
        },
        _needsDash: function() {
          return this._lineDash;
        },
        _dashedLineTo: function(x1, y1) {
          var dashSum = this._dashSum;
          var offset = this._dashOffset;
          var lineDash = this._lineDash;
          var ctx = this._ctx;
          var x0 = this._xi;
          var y0 = this._yi;
          var dx = x1 - x0;
          var dy = y1 - y0;
          var dist = mathSqrt(dx * dx + dy * dy);
          var x = x0;
          var y = y0;
          var dash;
          var nDash = lineDash.length;
          var idx;
          dx /= dist;
          dy /= dist;
          if (offset < 0) {
            offset = dashSum + offset;
          }
          offset %= dashSum;
          x -= offset * dx;
          y -= offset * dy;
          while ((dx > 0 && x <= x1) || (dx < 0 && x >= x1) || (dx == 0 && ((dy > 0 && y <= y1) || (dy < 0 && y >= y1)))) {
            idx = this._dashIdx;
            dash = lineDash[idx];
            x += dx * dash;
            y += dy * dash;
            this._dashIdx = (idx + 1) % nDash;
            if ((dx > 0 && x < x0) || (dx < 0 && x > x0) || (dy > 0 && y < y0) || (dy < 0 && y > y0)) {
              continue;
            }
            ctx[idx % 2 ? 'moveTo' : 'lineTo'](dx >= 0 ? mathMin(x, x1) : mathMax(x, x1), dy >= 0 ? mathMin(y, y1) : mathMax(y, y1));
          }
          dx = x - x1;
          dy = y - y1;
          this._dashOffset = -mathSqrt(dx * dx + dy * dy);
        },
        _dashedBezierTo: function(x1, y1, x2, y2, x3, y3) {
          var dashSum = this._dashSum;
          var offset = this._dashOffset;
          var lineDash = this._lineDash;
          var ctx = this._ctx;
          var x0 = this._xi;
          var y0 = this._yi;
          var t;
          var dx;
          var dy;
          var cubicAt = curve.cubicAt;
          var bezierLen = 0;
          var idx = this._dashIdx;
          var nDash = lineDash.length;
          var x;
          var y;
          var tmpLen = 0;
          if (offset < 0) {
            offset = dashSum + offset;
          }
          offset %= dashSum;
          for (t = 0; t < 1; t += 0.1) {
            dx = cubicAt(x0, x1, x2, x3, t + 0.1) - cubicAt(x0, x1, x2, x3, t);
            dy = cubicAt(y0, y1, y2, y3, t + 0.1) - cubicAt(y0, y1, y2, y3, t);
            bezierLen += mathSqrt(dx * dx + dy * dy);
          }
          for (; idx < nDash; idx++) {
            tmpLen += lineDash[idx];
            if (tmpLen > offset) {
              break;
            }
          }
          t = (tmpLen - offset) / bezierLen;
          while (t <= 1) {
            x = cubicAt(x0, x1, x2, x3, t);
            y = cubicAt(y0, y1, y2, y3, t);
            idx % 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            t += lineDash[idx] / bezierLen;
            idx = (idx + 1) % nDash;
          }
          (idx % 2 !== 0) && ctx.lineTo(x3, y3);
          dx = x3 - x;
          dy = y3 - y;
          this._dashOffset = -mathSqrt(dx * dx + dy * dy);
        },
        _dashedQuadraticTo: function(x1, y1, x2, y2) {
          var x3 = x2;
          var y3 = y2;
          x2 = (x2 + 2 * x1) / 3;
          y2 = (y2 + 2 * y1) / 3;
          x1 = (this._xi + 2 * x1) / 3;
          y1 = (this._yi + 2 * y1) / 3;
          this._dashedBezierTo(x1, y1, x2, y2, x3, y3);
        },
        toStatic: function() {
          var data = this.data;
          if (data instanceof Array) {
            data.length = this._len;
            if (hasTypedArray) {
              this.data = new Float32Array(data);
            }
          }
        },
        getBoundingRect: function() {
          min[0] = min[1] = min2[0] = min2[1] = Number.MAX_VALUE;
          max[0] = max[1] = max2[0] = max2[1] = -Number.MAX_VALUE;
          var data = this.data;
          var xi = 0;
          var yi = 0;
          var x0 = 0;
          var y0 = 0;
          for (var i = 0; i < data.length; ) {
            var cmd = data[i++];
            if (i == 1) {
              xi = data[i];
              yi = data[i + 1];
              x0 = xi;
              y0 = yi;
            }
            switch (cmd) {
              case CMD.M:
                x0 = data[i++];
                y0 = data[i++];
                xi = x0;
                yi = y0;
                min2[0] = x0;
                min2[1] = y0;
                max2[0] = x0;
                max2[1] = y0;
                break;
              case CMD.L:
                bbox.fromLine(xi, yi, data[i], data[i + 1], min2, max2);
                xi = data[i++];
                yi = data[i++];
                break;
              case CMD.C:
                bbox.fromCubic(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], min2, max2);
                xi = data[i++];
                yi = data[i++];
                break;
              case CMD.Q:
                bbox.fromQuadratic(xi, yi, data[i++], data[i++], data[i], data[i + 1], min2, max2);
                xi = data[i++];
                yi = data[i++];
                break;
              case CMD.A:
                var cx = data[i++];
                var cy = data[i++];
                var rx = data[i++];
                var ry = data[i++];
                var startAngle = data[i++];
                var endAngle = data[i++] + startAngle;
                var psi = data[i++];
                var anticlockwise = 1 - data[i++];
                if (i == 1) {
                  x0 = mathCos(startAngle) * rx + cx;
                  y0 = mathSin(startAngle) * ry + cy;
                }
                bbox.fromArc(cx, cy, rx, ry, startAngle, endAngle, anticlockwise, min2, max2);
                xi = mathCos(endAngle) * rx + cx;
                yi = mathSin(endAngle) * ry + cy;
                break;
              case CMD.R:
                x0 = xi = data[i++];
                y0 = yi = data[i++];
                var width = data[i++];
                var height = data[i++];
                bbox.fromLine(x0, y0, x0 + width, y0 + height, min2, max2);
                break;
              case CMD.Z:
                xi = x0;
                yi = y0;
                break;
            }
            vec2.min(min, min, min2);
            vec2.max(max, max, max2);
          }
          if (i === 0) {
            min[0] = min[1] = max[0] = max[1] = 0;
          }
          return new BoundingRect(min[0], min[1], max[0] - min[0], max[1] - min[1]);
        },
        rebuildPath: function(ctx) {
          var d = this.data;
          var x0,
              y0;
          var xi,
              yi;
          var x,
              y;
          var ux = this._ux;
          var uy = this._uy;
          var len = this._len;
          for (var i = 0; i < len; ) {
            var cmd = d[i++];
            if (i == 1) {
              xi = d[i];
              yi = d[i + 1];
              x0 = xi;
              y0 = yi;
            }
            switch (cmd) {
              case CMD.M:
                x0 = xi = d[i++];
                y0 = yi = d[i++];
                ctx.moveTo(xi, yi);
                break;
              case CMD.L:
                x = d[i++];
                y = d[i++];
                if (mathAbs(x - xi) > ux || mathAbs(y - yi) > uy || i === len - 1) {
                  ctx.lineTo(x, y);
                  xi = x;
                  yi = y;
                }
                break;
              case CMD.C:
                ctx.bezierCurveTo(d[i++], d[i++], d[i++], d[i++], d[i++], d[i++]);
                xi = d[i - 2];
                yi = d[i - 1];
                break;
              case CMD.Q:
                ctx.quadraticCurveTo(d[i++], d[i++], d[i++], d[i++]);
                xi = d[i - 2];
                yi = d[i - 1];
                break;
              case CMD.A:
                var cx = d[i++];
                var cy = d[i++];
                var rx = d[i++];
                var ry = d[i++];
                var theta = d[i++];
                var dTheta = d[i++];
                var psi = d[i++];
                var fs = d[i++];
                var r = (rx > ry) ? rx : ry;
                var scaleX = (rx > ry) ? 1 : rx / ry;
                var scaleY = (rx > ry) ? ry / rx : 1;
                var isEllipse = Math.abs(rx - ry) > 1e-3;
                var endAngle = theta + dTheta;
                if (isEllipse) {
                  ctx.translate(cx, cy);
                  ctx.rotate(psi);
                  ctx.scale(scaleX, scaleY);
                  ctx.arc(0, 0, r, theta, endAngle, 1 - fs);
                  ctx.scale(1 / scaleX, 1 / scaleY);
                  ctx.rotate(-psi);
                  ctx.translate(-cx, -cy);
                } else {
                  ctx.arc(cx, cy, r, theta, endAngle, 1 - fs);
                }
                if (i == 1) {
                  x0 = mathCos(theta) * rx + cx;
                  y0 = mathSin(theta) * ry + cy;
                }
                xi = mathCos(endAngle) * rx + cx;
                yi = mathSin(endAngle) * ry + cy;
                break;
              case CMD.R:
                x0 = xi = d[i];
                y0 = yi = d[i + 1];
                ctx.rect(d[i++], d[i++], d[i++], d[i++]);
                break;
              case CMD.Z:
                ctx.closePath();
                xi = x0;
                yi = y0;
            }
          }
        }
      };
      PathProxy.CMD = CMD;
      module.exports = PathProxy;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var vec2 = __webpack_require__(10);
      var v2Create = vec2.create;
      var v2DistSquare = vec2.distSquare;
      var mathPow = Math.pow;
      var mathSqrt = Math.sqrt;
      var EPSILON = 1e-8;
      var EPSILON_NUMERIC = 1e-4;
      var THREE_SQRT = mathSqrt(3);
      var ONE_THIRD = 1 / 3;
      var _v0 = v2Create();
      var _v1 = v2Create();
      var _v2 = v2Create();
      function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
      }
      function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
      }
      function cubicAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return onet * onet * (onet * p0 + 3 * t * p1) + t * t * (t * p3 + 3 * onet * p2);
      }
      function cubicDerivativeAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return 3 * (((p1 - p0) * onet + 2 * (p2 - p1) * t) * onet + (p3 - p2) * t * t);
      }
      function cubicRootAt(p0, p1, p2, p3, val, roots) {
        var a = p3 + 3 * (p1 - p2) - p0;
        var b = 3 * (p2 - p1 * 2 + p0);
        var c = 3 * (p1 - p0);
        var d = p0 - val;
        var A = b * b - 3 * a * c;
        var B = b * c - 9 * a * d;
        var C = c * c - 3 * b * d;
        var n = 0;
        if (isAroundZero(A) && isAroundZero(B)) {
          if (isAroundZero(b)) {
            roots[0] = 0;
          } else {
            var t1 = -c / b;
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
          }
        } else {
          var disc = B * B - 4 * A * C;
          if (isAroundZero(disc)) {
            var K = B / A;
            var t1 = -b / a + K;
            var t2 = -K / 2;
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
            if (t2 >= 0 && t2 <= 1) {
              roots[n++] = t2;
            }
          } else if (disc > 0) {
            var discSqrt = mathSqrt(disc);
            var Y1 = A * b + 1.5 * a * (-B + discSqrt);
            var Y2 = A * b + 1.5 * a * (-B - discSqrt);
            if (Y1 < 0) {
              Y1 = -mathPow(-Y1, ONE_THIRD);
            } else {
              Y1 = mathPow(Y1, ONE_THIRD);
            }
            if (Y2 < 0) {
              Y2 = -mathPow(-Y2, ONE_THIRD);
            } else {
              Y2 = mathPow(Y2, ONE_THIRD);
            }
            var t1 = (-b - (Y1 + Y2)) / (3 * a);
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
          } else {
            var T = (2 * A * b - 3 * a * B) / (2 * mathSqrt(A * A * A));
            var theta = Math.acos(T) / 3;
            var ASqrt = mathSqrt(A);
            var tmp = Math.cos(theta);
            var t1 = (-b - 2 * ASqrt * tmp) / (3 * a);
            var t2 = (-b + ASqrt * (tmp + THREE_SQRT * Math.sin(theta))) / (3 * a);
            var t3 = (-b + ASqrt * (tmp - THREE_SQRT * Math.sin(theta))) / (3 * a);
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
            if (t2 >= 0 && t2 <= 1) {
              roots[n++] = t2;
            }
            if (t3 >= 0 && t3 <= 1) {
              roots[n++] = t3;
            }
          }
        }
        return n;
      }
      function cubicExtrema(p0, p1, p2, p3, extrema) {
        var b = 6 * p2 - 12 * p1 + 6 * p0;
        var a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
        var c = 3 * p1 - 3 * p0;
        var n = 0;
        if (isAroundZero(a)) {
          if (isNotAroundZero(b)) {
            var t1 = -c / b;
            if (t1 >= 0 && t1 <= 1) {
              extrema[n++] = t1;
            }
          }
        } else {
          var disc = b * b - 4 * a * c;
          if (isAroundZero(disc)) {
            extrema[0] = -b / (2 * a);
          } else if (disc > 0) {
            var discSqrt = mathSqrt(disc);
            var t1 = (-b + discSqrt) / (2 * a);
            var t2 = (-b - discSqrt) / (2 * a);
            if (t1 >= 0 && t1 <= 1) {
              extrema[n++] = t1;
            }
            if (t2 >= 0 && t2 <= 1) {
              extrema[n++] = t2;
            }
          }
        }
        return n;
      }
      function cubicSubdivide(p0, p1, p2, p3, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p23 = (p3 - p2) * t + p2;
        var p012 = (p12 - p01) * t + p01;
        var p123 = (p23 - p12) * t + p12;
        var p0123 = (p123 - p012) * t + p012;
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        out[3] = p0123;
        out[4] = p0123;
        out[5] = p123;
        out[6] = p23;
        out[7] = p3;
      }
      function cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, out) {
        var t;
        var interval = 0.005;
        var d = Infinity;
        var prev;
        var next;
        var d1;
        var d2;
        _v0[0] = x;
        _v0[1] = y;
        for (var _t = 0; _t < 1; _t += 0.05) {
          _v1[0] = cubicAt(x0, x1, x2, x3, _t);
          _v1[1] = cubicAt(y0, y1, y2, y3, _t);
          d1 = v2DistSquare(_v0, _v1);
          if (d1 < d) {
            t = _t;
            d = d1;
          }
        }
        d = Infinity;
        for (var i = 0; i < 32; i++) {
          if (interval < EPSILON_NUMERIC) {
            break;
          }
          prev = t - interval;
          next = t + interval;
          _v1[0] = cubicAt(x0, x1, x2, x3, prev);
          _v1[1] = cubicAt(y0, y1, y2, y3, prev);
          d1 = v2DistSquare(_v1, _v0);
          if (prev >= 0 && d1 < d) {
            t = prev;
            d = d1;
          } else {
            _v2[0] = cubicAt(x0, x1, x2, x3, next);
            _v2[1] = cubicAt(y0, y1, y2, y3, next);
            d2 = v2DistSquare(_v2, _v0);
            if (next <= 1 && d2 < d) {
              t = next;
              d = d2;
            } else {
              interval *= 0.5;
            }
          }
        }
        if (out) {
          out[0] = cubicAt(x0, x1, x2, x3, t);
          out[1] = cubicAt(y0, y1, y2, y3, t);
        }
        return mathSqrt(d);
      }
      function quadraticAt(p0, p1, p2, t) {
        var onet = 1 - t;
        return onet * (onet * p0 + 2 * t * p1) + t * t * p2;
      }
      function quadraticDerivativeAt(p0, p1, p2, t) {
        return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1));
      }
      function quadraticRootAt(p0, p1, p2, val, roots) {
        var a = p0 - 2 * p1 + p2;
        var b = 2 * (p1 - p0);
        var c = p0 - val;
        var n = 0;
        if (isAroundZero(a)) {
          if (isNotAroundZero(b)) {
            var t1 = -c / b;
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
          }
        } else {
          var disc = b * b - 4 * a * c;
          if (isAroundZero(disc)) {
            var t1 = -b / (2 * a);
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
          } else if (disc > 0) {
            var discSqrt = mathSqrt(disc);
            var t1 = (-b + discSqrt) / (2 * a);
            var t2 = (-b - discSqrt) / (2 * a);
            if (t1 >= 0 && t1 <= 1) {
              roots[n++] = t1;
            }
            if (t2 >= 0 && t2 <= 1) {
              roots[n++] = t2;
            }
          }
        }
        return n;
      }
      function quadraticExtremum(p0, p1, p2) {
        var divider = p0 + p2 - 2 * p1;
        if (divider === 0) {
          return 0.5;
        } else {
          return (p0 - p1) / divider;
        }
      }
      function quadraticSubdivide(p0, p1, p2, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p012 = (p12 - p01) * t + p01;
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        out[3] = p012;
        out[4] = p12;
        out[5] = p2;
      }
      function quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, out) {
        var t;
        var interval = 0.005;
        var d = Infinity;
        _v0[0] = x;
        _v0[1] = y;
        for (var _t = 0; _t < 1; _t += 0.05) {
          _v1[0] = quadraticAt(x0, x1, x2, _t);
          _v1[1] = quadraticAt(y0, y1, y2, _t);
          var d1 = v2DistSquare(_v0, _v1);
          if (d1 < d) {
            t = _t;
            d = d1;
          }
        }
        d = Infinity;
        for (var i = 0; i < 32; i++) {
          if (interval < EPSILON_NUMERIC) {
            break;
          }
          var prev = t - interval;
          var next = t + interval;
          _v1[0] = quadraticAt(x0, x1, x2, prev);
          _v1[1] = quadraticAt(y0, y1, y2, prev);
          var d1 = v2DistSquare(_v1, _v0);
          if (prev >= 0 && d1 < d) {
            t = prev;
            d = d1;
          } else {
            _v2[0] = quadraticAt(x0, x1, x2, next);
            _v2[1] = quadraticAt(y0, y1, y2, next);
            var d2 = v2DistSquare(_v2, _v0);
            if (next <= 1 && d2 < d) {
              t = next;
              d = d2;
            } else {
              interval *= 0.5;
            }
          }
        }
        if (out) {
          out[0] = quadraticAt(x0, x1, x2, t);
          out[1] = quadraticAt(y0, y1, y2, t);
        }
        return mathSqrt(d);
      }
      module.exports = {
        cubicAt: cubicAt,
        cubicDerivativeAt: cubicDerivativeAt,
        cubicRootAt: cubicRootAt,
        cubicExtrema: cubicExtrema,
        cubicSubdivide: cubicSubdivide,
        cubicProjectPoint: cubicProjectPoint,
        quadraticAt: quadraticAt,
        quadraticDerivativeAt: quadraticDerivativeAt,
        quadraticRootAt: quadraticRootAt,
        quadraticExtremum: quadraticExtremum,
        quadraticSubdivide: quadraticSubdivide,
        quadraticProjectPoint: quadraticProjectPoint
      };
    }, function(module, exports, __webpack_require__) {
      var vec2 = __webpack_require__(10);
      var curve = __webpack_require__(50);
      var bbox = {};
      var mathMin = Math.min;
      var mathMax = Math.max;
      var mathSin = Math.sin;
      var mathCos = Math.cos;
      var start = vec2.create();
      var end = vec2.create();
      var extremity = vec2.create();
      var PI2 = Math.PI * 2;
      bbox.fromPoints = function(points, min, max) {
        if (points.length === 0) {
          return;
        }
        var p = points[0];
        var left = p[0];
        var right = p[0];
        var top = p[1];
        var bottom = p[1];
        var i;
        for (i = 1; i < points.length; i++) {
          p = points[i];
          left = mathMin(left, p[0]);
          right = mathMax(right, p[0]);
          top = mathMin(top, p[1]);
          bottom = mathMax(bottom, p[1]);
        }
        min[0] = left;
        min[1] = top;
        max[0] = right;
        max[1] = bottom;
      };
      bbox.fromLine = function(x0, y0, x1, y1, min, max) {
        min[0] = mathMin(x0, x1);
        min[1] = mathMin(y0, y1);
        max[0] = mathMax(x0, x1);
        max[1] = mathMax(y0, y1);
      };
      var xDim = [];
      var yDim = [];
      bbox.fromCubic = function(x0, y0, x1, y1, x2, y2, x3, y3, min, max) {
        var cubicExtrema = curve.cubicExtrema;
        var cubicAt = curve.cubicAt;
        var i;
        var n = cubicExtrema(x0, x1, x2, x3, xDim);
        min[0] = Infinity;
        min[1] = Infinity;
        max[0] = -Infinity;
        max[1] = -Infinity;
        for (i = 0; i < n; i++) {
          var x = cubicAt(x0, x1, x2, x3, xDim[i]);
          min[0] = mathMin(x, min[0]);
          max[0] = mathMax(x, max[0]);
        }
        n = cubicExtrema(y0, y1, y2, y3, yDim);
        for (i = 0; i < n; i++) {
          var y = cubicAt(y0, y1, y2, y3, yDim[i]);
          min[1] = mathMin(y, min[1]);
          max[1] = mathMax(y, max[1]);
        }
        min[0] = mathMin(x0, min[0]);
        max[0] = mathMax(x0, max[0]);
        min[0] = mathMin(x3, min[0]);
        max[0] = mathMax(x3, max[0]);
        min[1] = mathMin(y0, min[1]);
        max[1] = mathMax(y0, max[1]);
        min[1] = mathMin(y3, min[1]);
        max[1] = mathMax(y3, max[1]);
      };
      bbox.fromQuadratic = function(x0, y0, x1, y1, x2, y2, min, max) {
        var quadraticExtremum = curve.quadraticExtremum;
        var quadraticAt = curve.quadraticAt;
        var tx = mathMax(mathMin(quadraticExtremum(x0, x1, x2), 1), 0);
        var ty = mathMax(mathMin(quadraticExtremum(y0, y1, y2), 1), 0);
        var x = quadraticAt(x0, x1, x2, tx);
        var y = quadraticAt(y0, y1, y2, ty);
        min[0] = mathMin(x0, x2, x);
        min[1] = mathMin(y0, y2, y);
        max[0] = mathMax(x0, x2, x);
        max[1] = mathMax(y0, y2, y);
      };
      bbox.fromArc = function(x, y, rx, ry, startAngle, endAngle, anticlockwise, min, max) {
        var vec2Min = vec2.min;
        var vec2Max = vec2.max;
        var diff = Math.abs(startAngle - endAngle);
        if (diff % PI2 < 1e-4 && diff > 1e-4) {
          min[0] = x - rx;
          min[1] = y - ry;
          max[0] = x + rx;
          max[1] = y + ry;
          return;
        }
        start[0] = mathCos(startAngle) * rx + x;
        start[1] = mathSin(startAngle) * ry + y;
        end[0] = mathCos(endAngle) * rx + x;
        end[1] = mathSin(endAngle) * ry + y;
        vec2Min(min, start, end);
        vec2Max(max, start, end);
        startAngle = startAngle % (PI2);
        if (startAngle < 0) {
          startAngle = startAngle + PI2;
        }
        endAngle = endAngle % (PI2);
        if (endAngle < 0) {
          endAngle = endAngle + PI2;
        }
        if (startAngle > endAngle && !anticlockwise) {
          endAngle += PI2;
        } else if (startAngle < endAngle && anticlockwise) {
          startAngle += PI2;
        }
        if (anticlockwise) {
          var tmp = endAngle;
          endAngle = startAngle;
          startAngle = tmp;
        }
        for (var angle = 0; angle < endAngle; angle += Math.PI / 2) {
          if (angle > startAngle) {
            extremity[0] = mathCos(angle) * rx + x;
            extremity[1] = mathSin(angle) * ry + y;
            vec2Min(min, extremity, min);
            vec2Max(max, extremity, max);
          }
        }
      };
      module.exports = bbox;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var CMD = __webpack_require__(49).CMD;
      var line = __webpack_require__(53);
      var cubic = __webpack_require__(54);
      var quadratic = __webpack_require__(55);
      var arc = __webpack_require__(56);
      var normalizeRadian = __webpack_require__(57).normalizeRadian;
      var curve = __webpack_require__(50);
      var windingLine = __webpack_require__(58);
      var containStroke = line.containStroke;
      var PI2 = Math.PI * 2;
      var EPSILON = 1e-4;
      function isAroundEqual(a, b) {
        return Math.abs(a - b) < EPSILON;
      }
      var roots = [-1, -1, -1];
      var extrema = [-1, -1];
      function swapExtrema() {
        var tmp = extrema[0];
        extrema[0] = extrema[1];
        extrema[1] = tmp;
      }
      function windingCubic(x0, y0, x1, y1, x2, y2, x3, y3, x, y) {
        if ((y > y0 && y > y1 && y > y2 && y > y3) || (y < y0 && y < y1 && y < y2 && y < y3)) {
          return 0;
        }
        var nRoots = curve.cubicRootAt(y0, y1, y2, y3, y, roots);
        if (nRoots === 0) {
          return 0;
        } else {
          var w = 0;
          var nExtrema = -1;
          var y0_,
              y1_;
          for (var i = 0; i < nRoots; i++) {
            var t = roots[i];
            var unit = (t === 0 || t === 1) ? 0.5 : 1;
            var x_ = curve.cubicAt(x0, x1, x2, x3, t);
            if (x_ < x) {
              continue;
            }
            if (nExtrema < 0) {
              nExtrema = curve.cubicExtrema(y0, y1, y2, y3, extrema);
              if (extrema[1] < extrema[0] && nExtrema > 1) {
                swapExtrema();
              }
              y0_ = curve.cubicAt(y0, y1, y2, y3, extrema[0]);
              if (nExtrema > 1) {
                y1_ = curve.cubicAt(y0, y1, y2, y3, extrema[1]);
              }
            }
            if (nExtrema == 2) {
              if (t < extrema[0]) {
                w += y0_ < y0 ? unit : -unit;
              } else if (t < extrema[1]) {
                w += y1_ < y0_ ? unit : -unit;
              } else {
                w += y3 < y1_ ? unit : -unit;
              }
            } else {
              if (t < extrema[0]) {
                w += y0_ < y0 ? unit : -unit;
              } else {
                w += y3 < y0_ ? unit : -unit;
              }
            }
          }
          return w;
        }
      }
      function windingQuadratic(x0, y0, x1, y1, x2, y2, x, y) {
        if ((y > y0 && y > y1 && y > y2) || (y < y0 && y < y1 && y < y2)) {
          return 0;
        }
        var nRoots = curve.quadraticRootAt(y0, y1, y2, y, roots);
        if (nRoots === 0) {
          return 0;
        } else {
          var t = curve.quadraticExtremum(y0, y1, y2);
          if (t >= 0 && t <= 1) {
            var w = 0;
            var y_ = curve.quadraticAt(y0, y1, y2, t);
            for (var i = 0; i < nRoots; i++) {
              var unit = (roots[i] === 0 || roots[i] === 1) ? 0.5 : 1;
              var x_ = curve.quadraticAt(x0, x1, x2, roots[i]);
              if (x_ < x) {
                continue;
              }
              if (roots[i] < t) {
                w += y_ < y0 ? unit : -unit;
              } else {
                w += y2 < y_ ? unit : -unit;
              }
            }
            return w;
          } else {
            var unit = (roots[0] === 0 || roots[0] === 1) ? 0.5 : 1;
            var x_ = curve.quadraticAt(x0, x1, x2, roots[0]);
            if (x_ < x) {
              return 0;
            }
            return y2 < y0 ? unit : -unit;
          }
        }
      }
      function windingArc(cx, cy, r, startAngle, endAngle, anticlockwise, x, y) {
        y -= cy;
        if (y > r || y < -r) {
          return 0;
        }
        var tmp = Math.sqrt(r * r - y * y);
        roots[0] = -tmp;
        roots[1] = tmp;
        var diff = Math.abs(startAngle - endAngle);
        if (diff < 1e-4) {
          return 0;
        }
        if (diff % PI2 < 1e-4) {
          startAngle = 0;
          endAngle = PI2;
          var dir = anticlockwise ? 1 : -1;
          if (x >= roots[0] + cx && x <= roots[1] + cx) {
            return dir;
          } else {
            return 0;
          }
        }
        if (anticlockwise) {
          var tmp = startAngle;
          startAngle = normalizeRadian(endAngle);
          endAngle = normalizeRadian(tmp);
        } else {
          startAngle = normalizeRadian(startAngle);
          endAngle = normalizeRadian(endAngle);
        }
        if (startAngle > endAngle) {
          endAngle += PI2;
        }
        var w = 0;
        for (var i = 0; i < 2; i++) {
          var x_ = roots[i];
          if (x_ + cx > x) {
            var angle = Math.atan2(y, x_);
            var dir = anticlockwise ? 1 : -1;
            if (angle < 0) {
              angle = PI2 + angle;
            }
            if ((angle >= startAngle && angle <= endAngle) || (angle + PI2 >= startAngle && angle + PI2 <= endAngle)) {
              if (angle > Math.PI / 2 && angle < Math.PI * 1.5) {
                dir = -dir;
              }
              w += dir;
            }
          }
        }
        return w;
      }
      function containPath(data, lineWidth, isStroke, x, y) {
        var w = 0;
        var xi = 0;
        var yi = 0;
        var x0 = 0;
        var y0 = 0;
        for (var i = 0; i < data.length; ) {
          var cmd = data[i++];
          if (cmd === CMD.M && i > 1) {
            if (!isStroke) {
              w += windingLine(xi, yi, x0, y0, x, y);
            }
          }
          if (i == 1) {
            xi = data[i];
            yi = data[i + 1];
            x0 = xi;
            y0 = yi;
          }
          switch (cmd) {
            case CMD.M:
              x0 = data[i++];
              y0 = data[i++];
              xi = x0;
              yi = y0;
              break;
            case CMD.L:
              if (isStroke) {
                if (containStroke(xi, yi, data[i], data[i + 1], lineWidth, x, y)) {
                  return true;
                }
              } else {
                w += windingLine(xi, yi, data[i], data[i + 1], x, y) || 0;
              }
              xi = data[i++];
              yi = data[i++];
              break;
            case CMD.C:
              if (isStroke) {
                if (cubic.containStroke(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], lineWidth, x, y)) {
                  return true;
                }
              } else {
                w += windingCubic(xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1], x, y) || 0;
              }
              xi = data[i++];
              yi = data[i++];
              break;
            case CMD.Q:
              if (isStroke) {
                if (quadratic.containStroke(xi, yi, data[i++], data[i++], data[i], data[i + 1], lineWidth, x, y)) {
                  return true;
                }
              } else {
                w += windingQuadratic(xi, yi, data[i++], data[i++], data[i], data[i + 1], x, y) || 0;
              }
              xi = data[i++];
              yi = data[i++];
              break;
            case CMD.A:
              var cx = data[i++];
              var cy = data[i++];
              var rx = data[i++];
              var ry = data[i++];
              var theta = data[i++];
              var dTheta = data[i++];
              var psi = data[i++];
              var anticlockwise = 1 - data[i++];
              var x1 = Math.cos(theta) * rx + cx;
              var y1 = Math.sin(theta) * ry + cy;
              if (i > 1) {
                w += windingLine(xi, yi, x1, y1, x, y);
              } else {
                x0 = x1;
                y0 = y1;
              }
              var _x = (x - cx) * ry / rx + cx;
              if (isStroke) {
                if (arc.containStroke(cx, cy, ry, theta, theta + dTheta, anticlockwise, lineWidth, _x, y)) {
                  return true;
                }
              } else {
                w += windingArc(cx, cy, ry, theta, theta + dTheta, anticlockwise, _x, y);
              }
              xi = Math.cos(theta + dTheta) * rx + cx;
              yi = Math.sin(theta + dTheta) * ry + cy;
              break;
            case CMD.R:
              x0 = xi = data[i++];
              y0 = yi = data[i++];
              var width = data[i++];
              var height = data[i++];
              var x1 = x0 + width;
              var y1 = y0 + height;
              if (isStroke) {
                if (containStroke(x0, y0, x1, y0, lineWidth, x, y) || containStroke(x1, y0, x1, y1, lineWidth, x, y) || containStroke(x1, y1, x0, y1, lineWidth, x, y) || containStroke(x0, y1, x0, y0, lineWidth, x, y)) {
                  return true;
                }
              } else {
                w += windingLine(x1, y0, x1, y1, x, y);
                w += windingLine(x0, y1, x0, y0, x, y);
              }
              break;
            case CMD.Z:
              if (isStroke) {
                if (containStroke(xi, yi, x0, y0, lineWidth, x, y)) {
                  return true;
                }
              } else {
                w += windingLine(xi, yi, x0, y0, x, y);
              }
              xi = x0;
              yi = y0;
              break;
          }
        }
        if (!isStroke && !isAroundEqual(yi, y0)) {
          w += windingLine(xi, yi, x0, y0, x, y) || 0;
        }
        return w !== 0;
      }
      module.exports = {
        contain: function(pathData, x, y) {
          return containPath(pathData, 0, false, x, y);
        },
        containStroke: function(pathData, lineWidth, x, y) {
          return containPath(pathData, lineWidth, true, x, y);
        }
      };
    }, function(module, exports) {
      module.exports = {containStroke: function(x0, y0, x1, y1, lineWidth, x, y) {
          if (lineWidth === 0) {
            return false;
          }
          var _l = lineWidth;
          var _a = 0;
          var _b = x0;
          if ((y > y0 + _l && y > y1 + _l) || (y < y0 - _l && y < y1 - _l) || (x > x0 + _l && x > x1 + _l) || (x < x0 - _l && x < x1 - _l)) {
            return false;
          }
          if (x0 !== x1) {
            _a = (y0 - y1) / (x0 - x1);
            _b = (x0 * y1 - x1 * y0) / (x0 - x1);
          } else {
            return Math.abs(x - x0) <= _l / 2;
          }
          var tmp = _a * x - y + _b;
          var _s = tmp * tmp / (_a * _a + 1);
          return _s <= _l / 2 * _l / 2;
        }};
    }, function(module, exports, __webpack_require__) {
      var curve = __webpack_require__(50);
      module.exports = {containStroke: function(x0, y0, x1, y1, x2, y2, x3, y3, lineWidth, x, y) {
          if (lineWidth === 0) {
            return false;
          }
          var _l = lineWidth;
          if ((y > y0 + _l && y > y1 + _l && y > y2 + _l && y > y3 + _l) || (y < y0 - _l && y < y1 - _l && y < y2 - _l && y < y3 - _l) || (x > x0 + _l && x > x1 + _l && x > x2 + _l && x > x3 + _l) || (x < x0 - _l && x < x1 - _l && x < x2 - _l && x < x3 - _l)) {
            return false;
          }
          var d = curve.cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, null);
          return d <= _l / 2;
        }};
    }, function(module, exports, __webpack_require__) {
      var curve = __webpack_require__(50);
      module.exports = {containStroke: function(x0, y0, x1, y1, x2, y2, lineWidth, x, y) {
          if (lineWidth === 0) {
            return false;
          }
          var _l = lineWidth;
          if ((y > y0 + _l && y > y1 + _l && y > y2 + _l) || (y < y0 - _l && y < y1 - _l && y < y2 - _l) || (x > x0 + _l && x > x1 + _l && x > x2 + _l) || (x < x0 - _l && x < x1 - _l && x < x2 - _l)) {
            return false;
          }
          var d = curve.quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, null);
          return d <= _l / 2;
        }};
    }, function(module, exports, __webpack_require__) {
      var normalizeRadian = __webpack_require__(57).normalizeRadian;
      var PI2 = Math.PI * 2;
      module.exports = {containStroke: function(cx, cy, r, startAngle, endAngle, anticlockwise, lineWidth, x, y) {
          if (lineWidth === 0) {
            return false;
          }
          var _l = lineWidth;
          x -= cx;
          y -= cy;
          var d = Math.sqrt(x * x + y * y);
          if ((d - _l > r) || (d + _l < r)) {
            return false;
          }
          if (Math.abs(startAngle - endAngle) % PI2 < 1e-4) {
            return true;
          }
          if (anticlockwise) {
            var tmp = startAngle;
            startAngle = normalizeRadian(endAngle);
            endAngle = normalizeRadian(tmp);
          } else {
            startAngle = normalizeRadian(startAngle);
            endAngle = normalizeRadian(endAngle);
          }
          if (startAngle > endAngle) {
            endAngle += PI2;
          }
          var angle = Math.atan2(y, x);
          if (angle < 0) {
            angle += PI2;
          }
          return (angle >= startAngle && angle <= endAngle) || (angle + PI2 >= startAngle && angle + PI2 <= endAngle);
        }};
    }, function(module, exports) {
      var PI2 = Math.PI * 2;
      module.exports = {normalizeRadian: function(angle) {
          angle %= PI2;
          if (angle < 0) {
            angle += PI2;
          }
          return angle;
        }};
    }, function(module, exports) {
      module.exports = function windingLine(x0, y0, x1, y1, x, y) {
        if ((y > y0 && y > y1) || (y < y0 && y < y1)) {
          return 0;
        }
        if (y1 === y0) {
          return 0;
        }
        var dir = y1 < y0 ? 1 : -1;
        var t = (y - y0) / (y1 - y0);
        if (t === 1 || t === 0) {
          dir = y1 < y0 ? 0.5 : -0.5;
        }
        var x_ = t * (x1 - x0) + x0;
        return x_ > x ? dir : 0;
      };
    }, function(module, exports) {
      var Pattern = function(image, repeat) {
        this.image = image;
        this.repeat = repeat;
        this.type = 'pattern';
      };
      Pattern.prototype.getCanvasPattern = function(ctx) {
        return this._canvasPattern || (this._canvasPattern = ctx.createPattern(this.image, this.repeat));
      };
      module.exports = Pattern;
    }, function(module, exports, __webpack_require__) {
      var CMD = __webpack_require__(49).CMD;
      var vec2 = __webpack_require__(10);
      var v2ApplyTransform = vec2.applyTransform;
      var points = [[], [], []];
      var mathSqrt = Math.sqrt;
      var mathAtan2 = Math.atan2;
      function transformPath(path, m) {
        var data = path.data;
        var cmd;
        var nPoint;
        var i;
        var j;
        var k;
        var p;
        var M = CMD.M;
        var C = CMD.C;
        var L = CMD.L;
        var R = CMD.R;
        var A = CMD.A;
        var Q = CMD.Q;
        for (i = 0, j = 0; i < data.length; ) {
          cmd = data[i++];
          j = i;
          nPoint = 0;
          switch (cmd) {
            case M:
              nPoint = 1;
              break;
            case L:
              nPoint = 1;
              break;
            case C:
              nPoint = 3;
              break;
            case Q:
              nPoint = 2;
              break;
            case A:
              var x = m[4];
              var y = m[5];
              var sx = mathSqrt(m[0] * m[0] + m[1] * m[1]);
              var sy = mathSqrt(m[2] * m[2] + m[3] * m[3]);
              var angle = mathAtan2(-m[1] / sy, m[0] / sx);
              data[i++] += x;
              data[i++] += y;
              data[i++] *= sx;
              data[i++] *= sy;
              data[i++] += angle;
              data[i++] += angle;
              i += 2;
              j = i;
              break;
            case R:
              p[0] = data[i++];
              p[1] = data[i++];
              v2ApplyTransform(p, p, m);
              data[j++] = p[0];
              data[j++] = p[1];
              p[0] += data[i++];
              p[1] += data[i++];
              v2ApplyTransform(p, p, m);
              data[j++] = p[0];
              data[j++] = p[1];
          }
          for (k = 0; k < nPoint; k++) {
            var p = points[k];
            p[0] = data[i++];
            p[1] = data[i++];
            v2ApplyTransform(p, p, m);
            data[j++] = p[0];
            data[j++] = p[1];
          }
        }
      }
      module.exports = transformPath;
    }, function(module, exports, __webpack_require__) {
      var Displayable = __webpack_require__(46);
      var BoundingRect = __webpack_require__(9);
      var zrUtil = __webpack_require__(4);
      var LRU = __webpack_require__(62);
      var globalImageCache = new LRU(50);
      function ZImage(opts) {
        Displayable.call(this, opts);
      }
      ZImage.prototype = {
        constructor: ZImage,
        type: 'image',
        brush: function(ctx, prevEl) {
          var style = this.style;
          var src = style.image;
          var image;
          style.bind(ctx, this, prevEl);
          if (typeof src === 'string') {
            image = this._image;
          } else {
            image = src;
          }
          if (!image && src) {
            var cachedImgObj = globalImageCache.get(src);
            if (!cachedImgObj) {
              image = new Image();
              image.onload = function() {
                image.onload = null;
                for (var i = 0; i < cachedImgObj.pending.length; i++) {
                  cachedImgObj.pending[i].dirty();
                }
              };
              cachedImgObj = {
                image: image,
                pending: [this]
              };
              image.src = src;
              globalImageCache.put(src, cachedImgObj);
              this._image = image;
              return;
            } else {
              image = cachedImgObj.image;
              this._image = image;
              if (!image.width || !image.height) {
                cachedImgObj.pending.push(this);
                return;
              }
            }
          }
          if (image) {
            var width = style.width || image.width;
            var height = style.height || image.height;
            var x = style.x || 0;
            var y = style.y || 0;
            if (!image.width || !image.height) {
              return;
            }
            this.setTransform(ctx);
            if (style.sWidth && style.sHeight) {
              var sx = style.sx || 0;
              var sy = style.sy || 0;
              ctx.drawImage(image, sx, sy, style.sWidth, style.sHeight, x, y, width, height);
            } else if (style.sx && style.sy) {
              var sx = style.sx;
              var sy = style.sy;
              var sWidth = width - sx;
              var sHeight = height - sy;
              ctx.drawImage(image, sx, sy, sWidth, sHeight, x, y, width, height);
            } else {
              ctx.drawImage(image, x, y, width, height);
            }
            if (style.width == null) {
              style.width = width;
            }
            if (style.height == null) {
              style.height = height;
            }
            this.restoreTransform(ctx);
            if (style.text != null) {
              this.drawRectText(ctx, this.getBoundingRect());
            }
          }
        },
        getBoundingRect: function() {
          var style = this.style;
          if (!this._rect) {
            this._rect = new BoundingRect(style.x || 0, style.y || 0, style.width || 0, style.height || 0);
          }
          return this._rect;
        }
      };
      zrUtil.inherits(ZImage, Displayable);
      module.exports = ZImage;
    }, function(module, exports) {
      var LinkedList = function() {
        this.head = null;
        this.tail = null;
        this._len = 0;
      };
      var linkedListProto = LinkedList.prototype;
      linkedListProto.insert = function(val) {
        var entry = new Entry(val);
        this.insertEntry(entry);
        return entry;
      };
      linkedListProto.insertEntry = function(entry) {
        if (!this.head) {
          this.head = this.tail = entry;
        } else {
          this.tail.next = entry;
          entry.prev = this.tail;
          this.tail = entry;
        }
        this._len++;
      };
      linkedListProto.remove = function(entry) {
        var prev = entry.prev;
        var next = entry.next;
        if (prev) {
          prev.next = next;
        } else {
          this.head = next;
        }
        if (next) {
          next.prev = prev;
        } else {
          this.tail = prev;
        }
        entry.next = entry.prev = null;
        this._len--;
      };
      linkedListProto.len = function() {
        return this._len;
      };
      var Entry = function(val) {
        this.value = val;
        this.next;
        this.prev;
      };
      var LRU = function(maxSize) {
        this._list = new LinkedList();
        this._map = {};
        this._maxSize = maxSize || 10;
      };
      var LRUProto = LRU.prototype;
      LRUProto.put = function(key, value) {
        var list = this._list;
        var map = this._map;
        if (map[key] == null) {
          var len = list.len();
          if (len >= this._maxSize && len > 0) {
            var leastUsedEntry = list.head;
            list.remove(leastUsedEntry);
            delete map[leastUsedEntry.key];
          }
          var entry = list.insert(value);
          entry.key = key;
          map[key] = entry;
        }
      };
      LRUProto.get = function(key) {
        var entry = this._map[key];
        var list = this._list;
        if (entry != null) {
          if (entry !== list.tail) {
            list.remove(entry);
            list.insertEntry(entry);
          }
          return entry.value;
        }
      };
      LRUProto.clear = function() {
        this._list.clear();
        this._map = {};
      };
      module.exports = LRU;
    }, function(module, exports, __webpack_require__) {
      var Displayable = __webpack_require__(46);
      var zrUtil = __webpack_require__(4);
      var textContain = __webpack_require__(8);
      var Text = function(opts) {
        Displayable.call(this, opts);
      };
      Text.prototype = {
        constructor: Text,
        type: 'text',
        brush: function(ctx, prevEl) {
          var style = this.style;
          var x = style.x || 0;
          var y = style.y || 0;
          var text = style.text;
          text != null && (text += '');
          style.bind(ctx, this, prevEl);
          if (text) {
            this.setTransform(ctx);
            var textBaseline;
            var textAlign = style.textAlign;
            var font = style.textFont || style.font;
            if (style.textVerticalAlign) {
              var rect = textContain.getBoundingRect(text, font, style.textAlign, 'top');
              textBaseline = 'middle';
              switch (style.textVerticalAlign) {
                case 'middle':
                  y -= rect.height / 2 - rect.lineHeight / 2;
                  break;
                case 'bottom':
                  y -= rect.height - rect.lineHeight / 2;
                  break;
                default:
                  y += rect.lineHeight / 2;
              }
            } else {
              textBaseline = style.textBaseline;
            }
            ctx.font = font || '12px sans-serif';
            ctx.textAlign = textAlign || 'left';
            if (ctx.textAlign !== textAlign) {
              ctx.textAlign = 'left';
            }
            ctx.textBaseline = textBaseline || 'alphabetic';
            if (ctx.textBaseline !== textBaseline) {
              ctx.textBaseline = 'alphabetic';
            }
            var lineHeight = textContain.measureText('国', ctx.font).width;
            var textLines = text.split('\n');
            for (var i = 0; i < textLines.length; i++) {
              style.hasFill() && ctx.fillText(textLines[i], x, y);
              style.hasStroke() && ctx.strokeText(textLines[i], x, y);
              y += lineHeight;
            }
            this.restoreTransform(ctx);
          }
        },
        getBoundingRect: function() {
          if (!this._rect) {
            var style = this.style;
            var textVerticalAlign = style.textVerticalAlign;
            var rect = textContain.getBoundingRect(style.text + '', style.textFont || style.font, style.textAlign, textVerticalAlign ? 'top' : style.textBaseline);
            switch (textVerticalAlign) {
              case 'middle':
                rect.y -= rect.height / 2;
                break;
              case 'bottom':
                rect.y -= rect.height;
                break;
            }
            rect.x += style.x || 0;
            rect.y += style.y || 0;
            this._rect = rect;
          }
          return this._rect;
        }
      };
      zrUtil.inherits(Text, Displayable);
      module.exports = Text;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      module.exports = __webpack_require__(45).extend({
        type: 'circle',
        shape: {
          cx: 0,
          cy: 0,
          r: 0
        },
        buildPath: function(ctx, shape, inBundle) {
          if (inBundle) {
            ctx.moveTo(shape.cx + shape.r, shape.cy);
          }
          ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2, true);
        }
      });
    }, function(module, exports, __webpack_require__) {
      var env = __webpack_require__(2);
      var Path = __webpack_require__(45);
      var shadowTemp = [['shadowBlur', 0], ['shadowColor', '#000'], ['shadowOffsetX', 0], ['shadowOffsetY', 0]];
      module.exports = Path.extend({
        type: 'sector',
        shape: {
          cx: 0,
          cy: 0,
          r0: 0,
          r: 0,
          startAngle: 0,
          endAngle: Math.PI * 2,
          clockwise: true
        },
        brush: (env.browser.ie && env.browser.version >= 11) ? function() {
          var clipPaths = this.__clipPaths;
          var style = this.style;
          var modified;
          if (clipPaths) {
            for (var i = 0; i < clipPaths.length; i++) {
              var shape = clipPaths[i] && clipPaths[i].shape;
              if (shape && shape.startAngle === shape.endAngle) {
                for (var j = 0; j < shadowTemp.length; j++) {
                  shadowTemp[j][2] = style[shadowTemp[j][0]];
                  style[shadowTemp[j][0]] = shadowTemp[j][1];
                }
                modified = true;
                break;
              }
            }
          }
          Path.prototype.brush.apply(this, arguments);
          if (modified) {
            for (var j = 0; j < shadowTemp.length; j++) {
              style[shadowTemp[j][0]] = shadowTemp[j][2];
            }
          }
        } : Path.prototype.brush,
        buildPath: function(ctx, shape) {
          var x = shape.cx;
          var y = shape.cy;
          var r0 = Math.max(shape.r0 || 0, 0);
          var r = Math.max(shape.r, 0);
          var startAngle = shape.startAngle;
          var endAngle = shape.endAngle;
          var clockwise = shape.clockwise;
          var unitX = Math.cos(startAngle);
          var unitY = Math.sin(startAngle);
          ctx.moveTo(unitX * r0 + x, unitY * r0 + y);
          ctx.lineTo(unitX * r + x, unitY * r + y);
          ctx.arc(x, y, r, startAngle, endAngle, !clockwise);
          ctx.lineTo(Math.cos(endAngle) * r0 + x, Math.sin(endAngle) * r0 + y);
          if (r0 !== 0) {
            ctx.arc(x, y, r0, endAngle, startAngle, clockwise);
          }
          ctx.closePath();
        }
      });
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(45).extend({
        type: 'ring',
        shape: {
          cx: 0,
          cy: 0,
          r: 0,
          r0: 0
        },
        buildPath: function(ctx, shape) {
          var x = shape.cx;
          var y = shape.cy;
          var PI2 = Math.PI * 2;
          ctx.moveTo(x + shape.r, y);
          ctx.arc(x, y, shape.r, 0, PI2, false);
          ctx.moveTo(x + shape.r0, y);
          ctx.arc(x, y, shape.r0, 0, PI2, true);
        }
      });
    }, function(module, exports, __webpack_require__) {
      var polyHelper = __webpack_require__(68);
      module.exports = __webpack_require__(45).extend({
        type: 'polygon',
        shape: {
          points: null,
          smooth: false,
          smoothConstraint: null
        },
        buildPath: function(ctx, shape) {
          polyHelper.buildPath(ctx, shape, true);
        }
      });
    }, function(module, exports, __webpack_require__) {
      var smoothSpline = __webpack_require__(69);
      var smoothBezier = __webpack_require__(70);
      module.exports = {buildPath: function(ctx, shape, closePath) {
          var points = shape.points;
          var smooth = shape.smooth;
          if (points && points.length >= 2) {
            if (smooth && smooth !== 'spline') {
              var controlPoints = smoothBezier(points, smooth, closePath, shape.smoothConstraint);
              ctx.moveTo(points[0][0], points[0][1]);
              var len = points.length;
              for (var i = 0; i < (closePath ? len : len - 1); i++) {
                var cp1 = controlPoints[i * 2];
                var cp2 = controlPoints[i * 2 + 1];
                var p = points[(i + 1) % len];
                ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], p[0], p[1]);
              }
            } else {
              if (smooth === 'spline') {
                points = smoothSpline(points, closePath);
              }
              ctx.moveTo(points[0][0], points[0][1]);
              for (var i = 1,
                  l = points.length; i < l; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
              }
            }
            closePath && ctx.closePath();
          }
        }};
    }, function(module, exports, __webpack_require__) {
      var vec2 = __webpack_require__(10);
      function interpolate(p0, p1, p2, p3, t, t2, t3) {
        var v0 = (p2 - p0) * 0.5;
        var v1 = (p3 - p1) * 0.5;
        return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
      }
      module.exports = function(points, isLoop) {
        var len = points.length;
        var ret = [];
        var distance = 0;
        for (var i = 1; i < len; i++) {
          distance += vec2.distance(points[i - 1], points[i]);
        }
        var segs = distance / 2;
        segs = segs < len ? len : segs;
        for (var i = 0; i < segs; i++) {
          var pos = i / (segs - 1) * (isLoop ? len : len - 1);
          var idx = Math.floor(pos);
          var w = pos - idx;
          var p0;
          var p1 = points[idx % len];
          var p2;
          var p3;
          if (!isLoop) {
            p0 = points[idx === 0 ? idx : idx - 1];
            p2 = points[idx > len - 2 ? len - 1 : idx + 1];
            p3 = points[idx > len - 3 ? len - 1 : idx + 2];
          } else {
            p0 = points[(idx - 1 + len) % len];
            p2 = points[(idx + 1) % len];
            p3 = points[(idx + 2) % len];
          }
          var w2 = w * w;
          var w3 = w * w2;
          ret.push([interpolate(p0[0], p1[0], p2[0], p3[0], w, w2, w3), interpolate(p0[1], p1[1], p2[1], p3[1], w, w2, w3)]);
        }
        return ret;
      };
    }, function(module, exports, __webpack_require__) {
      var vec2 = __webpack_require__(10);
      var v2Min = vec2.min;
      var v2Max = vec2.max;
      var v2Scale = vec2.scale;
      var v2Distance = vec2.distance;
      var v2Add = vec2.add;
      module.exports = function(points, smooth, isLoop, constraint) {
        var cps = [];
        var v = [];
        var v1 = [];
        var v2 = [];
        var prevPoint;
        var nextPoint;
        var min,
            max;
        if (constraint) {
          min = [Infinity, Infinity];
          max = [-Infinity, -Infinity];
          for (var i = 0,
              len = points.length; i < len; i++) {
            v2Min(min, min, points[i]);
            v2Max(max, max, points[i]);
          }
          v2Min(min, min, constraint[0]);
          v2Max(max, max, constraint[1]);
        }
        for (var i = 0,
            len = points.length; i < len; i++) {
          var point = points[i];
          if (isLoop) {
            prevPoint = points[i ? i - 1 : len - 1];
            nextPoint = points[(i + 1) % len];
          } else {
            if (i === 0 || i === len - 1) {
              cps.push(vec2.clone(points[i]));
              continue;
            } else {
              prevPoint = points[i - 1];
              nextPoint = points[i + 1];
            }
          }
          vec2.sub(v, nextPoint, prevPoint);
          v2Scale(v, v, smooth);
          var d0 = v2Distance(point, prevPoint);
          var d1 = v2Distance(point, nextPoint);
          var sum = d0 + d1;
          if (sum !== 0) {
            d0 /= sum;
            d1 /= sum;
          }
          v2Scale(v1, v, -d0);
          v2Scale(v2, v, d1);
          var cp0 = v2Add([], point, v1);
          var cp1 = v2Add([], point, v2);
          if (constraint) {
            v2Max(cp0, cp0, min);
            v2Min(cp0, cp0, max);
            v2Max(cp1, cp1, min);
            v2Min(cp1, cp1, max);
          }
          cps.push(cp0);
          cps.push(cp1);
        }
        if (isLoop) {
          cps.push(cps.shift());
        }
        return cps;
      };
    }, function(module, exports, __webpack_require__) {
      var polyHelper = __webpack_require__(68);
      module.exports = __webpack_require__(45).extend({
        type: 'polyline',
        shape: {
          points: null,
          smooth: false,
          smoothConstraint: null
        },
        style: {
          stroke: '#000',
          fill: null
        },
        buildPath: function(ctx, shape) {
          polyHelper.buildPath(ctx, shape, false);
        }
      });
    }, function(module, exports, __webpack_require__) {
      var roundRectHelper = __webpack_require__(73);
      module.exports = __webpack_require__(45).extend({
        type: 'rect',
        shape: {
          r: 0,
          x: 0,
          y: 0,
          width: 0,
          height: 0
        },
        buildPath: function(ctx, shape) {
          var x = shape.x;
          var y = shape.y;
          var width = shape.width;
          var height = shape.height;
          if (!shape.r) {
            ctx.rect(x, y, width, height);
          } else {
            roundRectHelper.buildPath(ctx, shape);
          }
          ctx.closePath();
          return;
        }
      });
    }, function(module, exports) {
      module.exports = {buildPath: function(ctx, shape) {
          var x = shape.x;
          var y = shape.y;
          var width = shape.width;
          var height = shape.height;
          var r = shape.r;
          var r1;
          var r2;
          var r3;
          var r4;
          if (width < 0) {
            x = x + width;
            width = -width;
          }
          if (height < 0) {
            y = y + height;
            height = -height;
          }
          if (typeof r === 'number') {
            r1 = r2 = r3 = r4 = r;
          } else if (r instanceof Array) {
            if (r.length === 1) {
              r1 = r2 = r3 = r4 = r[0];
            } else if (r.length === 2) {
              r1 = r3 = r[0];
              r2 = r4 = r[1];
            } else if (r.length === 3) {
              r1 = r[0];
              r2 = r4 = r[1];
              r3 = r[2];
            } else {
              r1 = r[0];
              r2 = r[1];
              r3 = r[2];
              r4 = r[3];
            }
          } else {
            r1 = r2 = r3 = r4 = 0;
          }
          var total;
          if (r1 + r2 > width) {
            total = r1 + r2;
            r1 *= width / total;
            r2 *= width / total;
          }
          if (r3 + r4 > width) {
            total = r3 + r4;
            r3 *= width / total;
            r4 *= width / total;
          }
          if (r2 + r3 > height) {
            total = r2 + r3;
            r2 *= height / total;
            r3 *= height / total;
          }
          if (r1 + r4 > height) {
            total = r1 + r4;
            r1 *= height / total;
            r4 *= height / total;
          }
          ctx.moveTo(x + r1, y);
          ctx.lineTo(x + width - r2, y);
          r2 !== 0 && ctx.quadraticCurveTo(x + width, y, x + width, y + r2);
          ctx.lineTo(x + width, y + height - r3);
          r3 !== 0 && ctx.quadraticCurveTo(x + width, y + height, x + width - r3, y + height);
          ctx.lineTo(x + r4, y + height);
          r4 !== 0 && ctx.quadraticCurveTo(x, y + height, x, y + height - r4);
          ctx.lineTo(x, y + r1);
          r1 !== 0 && ctx.quadraticCurveTo(x, y, x + r1, y);
        }};
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(45).extend({
        type: 'line',
        shape: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          percent: 1
        },
        style: {
          stroke: '#000',
          fill: null
        },
        buildPath: function(ctx, shape) {
          var x1 = shape.x1;
          var y1 = shape.y1;
          var x2 = shape.x2;
          var y2 = shape.y2;
          var percent = shape.percent;
          if (percent === 0) {
            return;
          }
          ctx.moveTo(x1, y1);
          if (percent < 1) {
            x2 = x1 * (1 - percent) + x2 * percent;
            y2 = y1 * (1 - percent) + y2 * percent;
          }
          ctx.lineTo(x2, y2);
        },
        pointAt: function(p) {
          var shape = this.shape;
          return [shape.x1 * (1 - p) + shape.x2 * p, shape.y1 * (1 - p) + shape.y2 * p];
        }
      });
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var curveTool = __webpack_require__(50);
      var vec2 = __webpack_require__(10);
      var quadraticSubdivide = curveTool.quadraticSubdivide;
      var cubicSubdivide = curveTool.cubicSubdivide;
      var quadraticAt = curveTool.quadraticAt;
      var cubicAt = curveTool.cubicAt;
      var quadraticDerivativeAt = curveTool.quadraticDerivativeAt;
      var cubicDerivativeAt = curveTool.cubicDerivativeAt;
      var out = [];
      function someVectorAt(shape, t, isTangent) {
        var cpx2 = shape.cpx2;
        var cpy2 = shape.cpy2;
        if (cpx2 === null || cpy2 === null) {
          return [(isTangent ? cubicDerivativeAt : cubicAt)(shape.x1, shape.cpx1, shape.cpx2, shape.x2, t), (isTangent ? cubicDerivativeAt : cubicAt)(shape.y1, shape.cpy1, shape.cpy2, shape.y2, t)];
        } else {
          return [(isTangent ? quadraticDerivativeAt : quadraticAt)(shape.x1, shape.cpx1, shape.x2, t), (isTangent ? quadraticDerivativeAt : quadraticAt)(shape.y1, shape.cpy1, shape.y2, t)];
        }
      }
      module.exports = __webpack_require__(45).extend({
        type: 'bezier-curve',
        shape: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          cpx1: 0,
          cpy1: 0,
          percent: 1
        },
        style: {
          stroke: '#000',
          fill: null
        },
        buildPath: function(ctx, shape) {
          var x1 = shape.x1;
          var y1 = shape.y1;
          var x2 = shape.x2;
          var y2 = shape.y2;
          var cpx1 = shape.cpx1;
          var cpy1 = shape.cpy1;
          var cpx2 = shape.cpx2;
          var cpy2 = shape.cpy2;
          var percent = shape.percent;
          if (percent === 0) {
            return;
          }
          ctx.moveTo(x1, y1);
          if (cpx2 == null || cpy2 == null) {
            if (percent < 1) {
              quadraticSubdivide(x1, cpx1, x2, percent, out);
              cpx1 = out[1];
              x2 = out[2];
              quadraticSubdivide(y1, cpy1, y2, percent, out);
              cpy1 = out[1];
              y2 = out[2];
            }
            ctx.quadraticCurveTo(cpx1, cpy1, x2, y2);
          } else {
            if (percent < 1) {
              cubicSubdivide(x1, cpx1, cpx2, x2, percent, out);
              cpx1 = out[1];
              cpx2 = out[2];
              x2 = out[3];
              cubicSubdivide(y1, cpy1, cpy2, y2, percent, out);
              cpy1 = out[1];
              cpy2 = out[2];
              y2 = out[3];
            }
            ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
          }
        },
        pointAt: function(t) {
          return someVectorAt(this.shape, t, false);
        },
        tangentAt: function(t) {
          var p = someVectorAt(this.shape, t, true);
          return vec2.normalize(p, p);
        }
      });
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(45).extend({
        type: 'arc',
        shape: {
          cx: 0,
          cy: 0,
          r: 0,
          startAngle: 0,
          endAngle: Math.PI * 2,
          clockwise: true
        },
        style: {
          stroke: '#000',
          fill: null
        },
        buildPath: function(ctx, shape) {
          var x = shape.cx;
          var y = shape.cy;
          var r = Math.max(shape.r, 0);
          var startAngle = shape.startAngle;
          var endAngle = shape.endAngle;
          var clockwise = shape.clockwise;
          var unitX = Math.cos(startAngle);
          var unitY = Math.sin(startAngle);
          ctx.moveTo(unitX * r + x, unitY * r + y);
          ctx.arc(x, y, r, startAngle, endAngle, !clockwise);
        }
      });
    }, function(module, exports, __webpack_require__) {
      var Path = __webpack_require__(45);
      module.exports = Path.extend({
        type: 'compound',
        shape: {paths: null},
        _updatePathDirty: function() {
          var dirtyPath = this.__dirtyPath;
          var paths = this.shape.paths;
          for (var i = 0; i < paths.length; i++) {
            dirtyPath = dirtyPath || paths[i].__dirtyPath;
          }
          this.__dirtyPath = dirtyPath;
          this.__dirty = this.__dirty || dirtyPath;
        },
        beforeBrush: function() {
          this._updatePathDirty();
          var paths = this.shape.paths || [];
          var scale = this.getGlobalScale();
          for (var i = 0; i < paths.length; i++) {
            paths[i].path.setScale(scale[0], scale[1]);
          }
        },
        buildPath: function(ctx, shape) {
          var paths = shape.paths || [];
          for (var i = 0; i < paths.length; i++) {
            paths[i].buildPath(ctx, paths[i].shape, true);
          }
        },
        afterBrush: function() {
          var paths = this.shape.paths;
          for (var i = 0; i < paths.length; i++) {
            paths[i].__dirtyPath = false;
          }
        },
        getBoundingRect: function() {
          this._updatePathDirty();
          return Path.prototype.getBoundingRect.call(this);
        }
      });
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var Gradient = __webpack_require__(79);
      var LinearGradient = function(x, y, x2, y2, colorStops, globalCoord) {
        this.x = x == null ? 0 : x;
        this.y = y == null ? 0 : y;
        this.x2 = x2 == null ? 1 : x2;
        this.y2 = y2 == null ? 0 : y2;
        this.type = 'linear';
        this.global = globalCoord || false;
        Gradient.call(this, colorStops);
      };
      LinearGradient.prototype = {constructor: LinearGradient};
      zrUtil.inherits(LinearGradient, Gradient);
      module.exports = LinearGradient;
    }, function(module, exports) {
      var Gradient = function(colorStops) {
        this.colorStops = colorStops || [];
      };
      Gradient.prototype = {
        constructor: Gradient,
        addColorStop: function(offset, color) {
          this.colorStops.push({
            offset: offset,
            color: color
          });
        }
      };
      module.exports = Gradient;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var Gradient = __webpack_require__(79);
      var RadialGradient = function(x, y, r, colorStops, globalCoord) {
        this.x = x == null ? 0.5 : x;
        this.y = y == null ? 0.5 : y;
        this.r = r == null ? 0.5 : r;
        this.type = 'radial';
        this.global = globalCoord || false;
        Gradient.call(this, colorStops);
      };
      RadialGradient.prototype = {constructor: RadialGradient};
      zrUtil.inherits(RadialGradient, Gradient);
      module.exports = RadialGradient;
    }, function(module, exports) {
      var lib = {};
      var ORIGIN_METHOD = '\0__throttleOriginMethod';
      var RATE = '\0__throttleRate';
      var THROTTLE_TYPE = '\0__throttleType';
      lib.throttle = function(fn, delay, debounce) {
        var currCall;
        var lastCall = 0;
        var lastExec = 0;
        var timer = null;
        var diff;
        var scope;
        var args;
        delay = delay || 0;
        function exec() {
          lastExec = (new Date()).getTime();
          timer = null;
          fn.apply(scope, args || []);
        }
        var cb = function() {
          currCall = (new Date()).getTime();
          scope = this;
          args = arguments;
          diff = currCall - (debounce ? lastCall : lastExec) - delay;
          clearTimeout(timer);
          if (debounce) {
            timer = setTimeout(exec, delay);
          } else {
            if (diff >= 0) {
              exec();
            } else {
              timer = setTimeout(exec, -diff);
            }
          }
          lastCall = currCall;
        };
        cb.clear = function() {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        };
        return cb;
      };
      lib.createOrUpdate = function(obj, fnAttr, rate, throttleType) {
        var fn = obj[fnAttr];
        if (!fn) {
          return;
        }
        var originFn = fn[ORIGIN_METHOD] || fn;
        var lastThrottleType = fn[THROTTLE_TYPE];
        var lastRate = fn[RATE];
        if (lastRate !== rate || lastThrottleType !== throttleType) {
          if (rate == null || !throttleType) {
            return (obj[fnAttr] = originFn);
          }
          fn = obj[fnAttr] = lib.throttle(originFn, rate, throttleType === 'debounce');
          fn[ORIGIN_METHOD] = originFn;
          fn[THROTTLE_TYPE] = throttleType;
          fn[RATE] = rate;
        }
        return fn;
      };
      lib.clear = function(obj, fnAttr) {
        var fn = obj[fnAttr];
        if (fn && fn[ORIGIN_METHOD]) {
          obj[fnAttr] = fn[ORIGIN_METHOD];
        }
      };
      module.exports = lib;
    }, function(module, exports, __webpack_require__) {
      var guid = __webpack_require__(32);
      var env = __webpack_require__(2);
      var zrUtil = __webpack_require__(4);
      var Handler = __webpack_require__(83);
      var Storage = __webpack_require__(85);
      var Animation = __webpack_require__(87);
      var HandlerProxy = __webpack_require__(90);
      var useVML = !env.canvasSupported;
      var painterCtors = {canvas: __webpack_require__(92)};
      var instances = {};
      var zrender = {};
      zrender.version = '3.3.0';
      zrender.init = function(dom, opts) {
        var zr = new ZRender(guid(), dom, opts);
        instances[zr.id] = zr;
        return zr;
      };
      zrender.dispose = function(zr) {
        if (zr) {
          zr.dispose();
        } else {
          for (var key in instances) {
            if (instances.hasOwnProperty(key)) {
              instances[key].dispose();
            }
          }
          instances = {};
        }
        return zrender;
      };
      zrender.getInstance = function(id) {
        return instances[id];
      };
      zrender.registerPainter = function(name, Ctor) {
        painterCtors[name] = Ctor;
      };
      function delInstance(id) {
        delete instances[id];
      }
      var ZRender = function(id, dom, opts) {
        opts = opts || {};
        this.dom = dom;
        this.id = id;
        var self = this;
        var storage = new Storage();
        var rendererType = opts.renderer;
        if (useVML) {
          if (!painterCtors.vml) {
            throw new Error('You need to require \'zrender/vml/vml\' to support IE8');
          }
          rendererType = 'vml';
        } else if (!rendererType || !painterCtors[rendererType]) {
          rendererType = 'canvas';
        }
        var painter = new painterCtors[rendererType](dom, storage, opts);
        this.storage = storage;
        this.painter = painter;
        var handerProxy = !env.node ? new HandlerProxy(painter.getViewportRoot()) : null;
        this.handler = new Handler(storage, painter, handerProxy, painter.root);
        this.animation = new Animation({stage: {update: zrUtil.bind(this.flush, this)}});
        this.animation.start();
        this._needsRefresh;
        var oldDelFromMap = storage.delFromMap;
        var oldAddToMap = storage.addToMap;
        storage.delFromMap = function(elId) {
          var el = storage.get(elId);
          oldDelFromMap.call(storage, elId);
          el && el.removeSelfFromZr(self);
        };
        storage.addToMap = function(el) {
          oldAddToMap.call(storage, el);
          el.addSelfToZr(self);
        };
      };
      ZRender.prototype = {
        constructor: ZRender,
        getId: function() {
          return this.id;
        },
        add: function(el) {
          this.storage.addRoot(el);
          this._needsRefresh = true;
        },
        remove: function(el) {
          this.storage.delRoot(el);
          this._needsRefresh = true;
        },
        configLayer: function(zLevel, config) {
          this.painter.configLayer(zLevel, config);
          this._needsRefresh = true;
        },
        refreshImmediately: function() {
          this._needsRefresh = false;
          this.painter.refresh();
          this._needsRefresh = false;
        },
        refresh: function() {
          this._needsRefresh = true;
        },
        flush: function() {
          if (this._needsRefresh) {
            this.refreshImmediately();
          }
          if (this._needsRefreshHover) {
            this.refreshHoverImmediately();
          }
        },
        addHover: function(el, style) {
          if (this.painter.addHover) {
            this.painter.addHover(el, style);
            this.refreshHover();
          }
        },
        removeHover: function(el) {
          if (this.painter.removeHover) {
            this.painter.removeHover(el);
            this.refreshHover();
          }
        },
        clearHover: function() {
          if (this.painter.clearHover) {
            this.painter.clearHover();
            this.refreshHover();
          }
        },
        refreshHover: function() {
          this._needsRefreshHover = true;
        },
        refreshHoverImmediately: function() {
          this._needsRefreshHover = false;
          this.painter.refreshHover && this.painter.refreshHover();
        },
        resize: function(opts) {
          opts = opts || {};
          this.painter.resize(opts.width, opts.height);
          this.handler.resize();
        },
        clearAnimation: function() {
          this.animation.clear();
        },
        getWidth: function() {
          return this.painter.getWidth();
        },
        getHeight: function() {
          return this.painter.getHeight();
        },
        pathToImage: function(e, width, height) {
          var id = guid();
          return this.painter.pathToImage(id, e, width, height);
        },
        setCursorStyle: function(cursorStyle) {
          this.handler.setCursorStyle(cursorStyle);
        },
        on: function(eventName, eventHandler, context) {
          this.handler.on(eventName, eventHandler, context);
        },
        off: function(eventName, eventHandler) {
          this.handler.off(eventName, eventHandler);
        },
        trigger: function(eventName, event) {
          this.handler.trigger(eventName, event);
        },
        clear: function() {
          this.storage.delRoot();
          this.painter.clear();
        },
        dispose: function() {
          this.animation.stop();
          this.clear();
          this.storage.dispose();
          this.painter.dispose();
          this.handler.dispose();
          this.animation = this.storage = this.painter = this.handler = null;
          delInstance(this.id);
        }
      };
      module.exports = zrender;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var util = __webpack_require__(4);
      var Draggable = __webpack_require__(84);
      var Eventful = __webpack_require__(33);
      function makeEventPacket(eveType, target, event) {
        return {
          type: eveType,
          event: event,
          target: target,
          cancelBubble: false,
          offsetX: event.zrX,
          offsetY: event.zrY,
          gestureEvent: event.gestureEvent,
          pinchX: event.pinchX,
          pinchY: event.pinchY,
          pinchScale: event.pinchScale,
          wheelDelta: event.zrDelta,
          zrByTouch: event.zrByTouch
        };
      }
      function EmptyProxy() {}
      EmptyProxy.prototype.dispose = function() {};
      var handlerNames = ['click', 'dblclick', 'mousewheel', 'mouseout', 'mouseup', 'mousedown', 'mousemove', 'contextmenu'];
      var Handler = function(storage, painter, proxy, painterRoot) {
        Eventful.call(this);
        this.storage = storage;
        this.painter = painter;
        this.painterRoot = painterRoot;
        proxy = proxy || new EmptyProxy();
        this.proxy = proxy;
        proxy.handler = this;
        this._hovered;
        this._lastTouchMoment;
        this._lastX;
        this._lastY;
        Draggable.call(this);
        util.each(handlerNames, function(name) {
          proxy.on && proxy.on(name, this[name], this);
        }, this);
      };
      Handler.prototype = {
        constructor: Handler,
        mousemove: function(event) {
          var x = event.zrX;
          var y = event.zrY;
          var hovered = this.findHover(x, y, null);
          var lastHovered = this._hovered;
          var proxy = this.proxy;
          this._hovered = hovered;
          proxy.setCursor && proxy.setCursor(hovered ? hovered.cursor : 'default');
          if (lastHovered && hovered !== lastHovered && lastHovered.__zr) {
            this.dispatchToElement(lastHovered, 'mouseout', event);
          }
          this.dispatchToElement(hovered, 'mousemove', event);
          if (hovered && hovered !== lastHovered) {
            this.dispatchToElement(hovered, 'mouseover', event);
          }
        },
        mouseout: function(event) {
          this.dispatchToElement(this._hovered, 'mouseout', event);
          var element = event.toElement || event.relatedTarget;
          var innerDom;
          do {
            element = element && element.parentNode;
          } while (element && element.nodeType != 9 && !(innerDom = element === this.painterRoot));
          !innerDom && this.trigger('globalout', {event: event});
        },
        resize: function(event) {
          this._hovered = null;
        },
        dispatch: function(eventName, eventArgs) {
          var handler = this[eventName];
          handler && handler.call(this, eventArgs);
        },
        dispose: function() {
          this.proxy.dispose();
          this.storage = this.proxy = this.painter = null;
        },
        setCursorStyle: function(cursorStyle) {
          var proxy = this.proxy;
          proxy.setCursor && proxy.setCursor(cursorStyle);
        },
        dispatchToElement: function(targetEl, eventName, event) {
          var eventHandler = 'on' + eventName;
          var eventPacket = makeEventPacket(eventName, targetEl, event);
          var el = targetEl;
          while (el) {
            el[eventHandler] && (eventPacket.cancelBubble = el[eventHandler].call(el, eventPacket));
            el.trigger(eventName, eventPacket);
            el = el.parent;
            if (eventPacket.cancelBubble) {
              break;
            }
          }
          if (!eventPacket.cancelBubble) {
            this.trigger(eventName, eventPacket);
            this.painter && this.painter.eachOtherLayer(function(layer) {
              if (typeof(layer[eventHandler]) == 'function') {
                layer[eventHandler].call(layer, eventPacket);
              }
              if (layer.trigger) {
                layer.trigger(eventName, eventPacket);
              }
            });
          }
        },
        findHover: function(x, y, exclude) {
          var list = this.storage.getDisplayList();
          for (var i = list.length - 1; i >= 0; i--) {
            if (!list[i].silent && list[i] !== exclude && !list[i].ignore && isHover(list[i], x, y)) {
              return list[i];
            }
          }
        }
      };
      util.each(['click', 'mousedown', 'mouseup', 'mousewheel', 'dblclick', 'contextmenu'], function(name) {
        Handler.prototype[name] = function(event) {
          var hovered = this.findHover(event.zrX, event.zrY, null);
          if (name === 'mousedown') {
            this._downel = hovered;
            this._upel = hovered;
          } else if (name === 'mosueup') {
            this._upel = hovered;
          } else if (name === 'click') {
            if (this._downel !== this._upel) {
              return;
            }
          }
          this.dispatchToElement(hovered, name, event);
        };
      });
      function isHover(displayable, x, y) {
        if (displayable[displayable.rectHover ? 'rectContain' : 'contain'](x, y)) {
          var el = displayable;
          while (el) {
            if (el.silent || (el.clipPath && !el.clipPath.contain(x, y))) {
              return false;
            }
            el = el.parent;
          }
          return true;
        }
        return false;
      }
      util.mixin(Handler, Eventful);
      util.mixin(Handler, Draggable);
      module.exports = Handler;
    }, function(module, exports) {
      function Draggable() {
        this.on('mousedown', this._dragStart, this);
        this.on('mousemove', this._drag, this);
        this.on('mouseup', this._dragEnd, this);
        this.on('globalout', this._dragEnd, this);
      }
      Draggable.prototype = {
        constructor: Draggable,
        _dragStart: function(e) {
          var draggingTarget = e.target;
          if (draggingTarget && draggingTarget.draggable) {
            this._draggingTarget = draggingTarget;
            draggingTarget.dragging = true;
            this._x = e.offsetX;
            this._y = e.offsetY;
            this.dispatchToElement(draggingTarget, 'dragstart', e.event);
          }
        },
        _drag: function(e) {
          var draggingTarget = this._draggingTarget;
          if (draggingTarget) {
            var x = e.offsetX;
            var y = e.offsetY;
            var dx = x - this._x;
            var dy = y - this._y;
            this._x = x;
            this._y = y;
            draggingTarget.drift(dx, dy, e);
            this.dispatchToElement(draggingTarget, 'drag', e.event);
            var dropTarget = this.findHover(x, y, draggingTarget);
            var lastDropTarget = this._dropTarget;
            this._dropTarget = dropTarget;
            if (draggingTarget !== dropTarget) {
              if (lastDropTarget && dropTarget !== lastDropTarget) {
                this.dispatchToElement(lastDropTarget, 'dragleave', e.event);
              }
              if (dropTarget && dropTarget !== lastDropTarget) {
                this.dispatchToElement(dropTarget, 'dragenter', e.event);
              }
            }
          }
        },
        _dragEnd: function(e) {
          var draggingTarget = this._draggingTarget;
          if (draggingTarget) {
            draggingTarget.dragging = false;
          }
          this.dispatchToElement(draggingTarget, 'dragend', e.event);
          if (this._dropTarget) {
            this.dispatchToElement(this._dropTarget, 'drop', e.event);
          }
          this._draggingTarget = null;
          this._dropTarget = null;
        }
      };
      module.exports = Draggable;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var util = __webpack_require__(4);
      var env = __webpack_require__(2);
      var Group = __webpack_require__(30);
      var timsort = __webpack_require__(86);
      function shapeCompareFunc(a, b) {
        if (a.zlevel === b.zlevel) {
          if (a.z === b.z) {
            return a.z2 - b.z2;
          }
          return a.z - b.z;
        }
        return a.zlevel - b.zlevel;
      }
      var Storage = function() {
        this._elements = {};
        this._roots = [];
        this._displayList = [];
        this._displayListLen = 0;
      };
      Storage.prototype = {
        constructor: Storage,
        traverse: function(cb, context) {
          for (var i = 0; i < this._roots.length; i++) {
            this._roots[i].traverse(cb, context);
          }
        },
        getDisplayList: function(update, includeIgnore) {
          includeIgnore = includeIgnore || false;
          if (update) {
            this.updateDisplayList(includeIgnore);
          }
          return this._displayList;
        },
        updateDisplayList: function(includeIgnore) {
          this._displayListLen = 0;
          var roots = this._roots;
          var displayList = this._displayList;
          for (var i = 0,
              len = roots.length; i < len; i++) {
            this._updateAndAddDisplayable(roots[i], null, includeIgnore);
          }
          displayList.length = this._displayListLen;
          env.canvasSupported && timsort(displayList, shapeCompareFunc);
        },
        _updateAndAddDisplayable: function(el, clipPaths, includeIgnore) {
          if (el.ignore && !includeIgnore) {
            return;
          }
          el.beforeUpdate();
          if (el.__dirty) {
            el.update();
          }
          el.afterUpdate();
          var userSetClipPath = el.clipPath;
          if (userSetClipPath) {
            if (clipPaths) {
              clipPaths = clipPaths.slice();
            } else {
              clipPaths = [];
            }
            var currentClipPath = userSetClipPath;
            var parentClipPath = el;
            while (currentClipPath) {
              currentClipPath.parent = parentClipPath;
              currentClipPath.updateTransform();
              clipPaths.push(currentClipPath);
              parentClipPath = currentClipPath;
              currentClipPath = currentClipPath.clipPath;
            }
          }
          if (el.isGroup) {
            var children = el._children;
            for (var i = 0; i < children.length; i++) {
              var child = children[i];
              if (el.__dirty) {
                child.__dirty = true;
              }
              this._updateAndAddDisplayable(child, clipPaths, includeIgnore);
            }
            el.__dirty = false;
          } else {
            el.__clipPaths = clipPaths;
            this._displayList[this._displayListLen++] = el;
          }
        },
        addRoot: function(el) {
          if (this._elements[el.id]) {
            return;
          }
          if (el instanceof Group) {
            el.addChildrenToStorage(this);
          }
          this.addToMap(el);
          this._roots.push(el);
        },
        delRoot: function(elId) {
          if (elId == null) {
            for (var i = 0; i < this._roots.length; i++) {
              var root = this._roots[i];
              if (root instanceof Group) {
                root.delChildrenFromStorage(this);
              }
            }
            this._elements = {};
            this._roots = [];
            this._displayList = [];
            this._displayListLen = 0;
            return;
          }
          if (elId instanceof Array) {
            for (var i = 0,
                l = elId.length; i < l; i++) {
              this.delRoot(elId[i]);
            }
            return;
          }
          var el;
          if (typeof(elId) == 'string') {
            el = this._elements[elId];
          } else {
            el = elId;
          }
          var idx = util.indexOf(this._roots, el);
          if (idx >= 0) {
            this.delFromMap(el.id);
            this._roots.splice(idx, 1);
            if (el instanceof Group) {
              el.delChildrenFromStorage(this);
            }
          }
        },
        addToMap: function(el) {
          if (el instanceof Group) {
            el.__storage = this;
          }
          el.dirty(false);
          this._elements[el.id] = el;
          return this;
        },
        get: function(elId) {
          return this._elements[elId];
        },
        delFromMap: function(elId) {
          var elements = this._elements;
          var el = elements[elId];
          if (el) {
            delete elements[elId];
            if (el instanceof Group) {
              el.__storage = null;
            }
          }
          return this;
        },
        dispose: function() {
          this._elements = this._renderList = this._roots = null;
        },
        displayableSortFunc: shapeCompareFunc
      };
      module.exports = Storage;
    }, function(module, exports) {
      var DEFAULT_MIN_MERGE = 32;
      var DEFAULT_MIN_GALLOPING = 7;
      var DEFAULT_TMP_STORAGE_LENGTH = 256;
      function minRunLength(n) {
        var r = 0;
        while (n >= DEFAULT_MIN_MERGE) {
          r |= n & 1;
          n >>= 1;
        }
        return n + r;
      }
      function makeAscendingRun(array, lo, hi, compare) {
        var runHi = lo + 1;
        if (runHi === hi) {
          return 1;
        }
        if (compare(array[runHi++], array[lo]) < 0) {
          while (runHi < hi && compare(array[runHi], array[runHi - 1]) < 0) {
            runHi++;
          }
          reverseRun(array, lo, runHi);
        } else {
          while (runHi < hi && compare(array[runHi], array[runHi - 1]) >= 0) {
            runHi++;
          }
        }
        return runHi - lo;
      }
      function reverseRun(array, lo, hi) {
        hi--;
        while (lo < hi) {
          var t = array[lo];
          array[lo++] = array[hi];
          array[hi--] = t;
        }
      }
      function binaryInsertionSort(array, lo, hi, start, compare) {
        if (start === lo) {
          start++;
        }
        for (; start < hi; start++) {
          var pivot = array[start];
          var left = lo;
          var right = start;
          var mid;
          while (left < right) {
            mid = left + right >>> 1;
            if (compare(pivot, array[mid]) < 0) {
              right = mid;
            } else {
              left = mid + 1;
            }
          }
          var n = start - left;
          switch (n) {
            case 3:
              array[left + 3] = array[left + 2];
            case 2:
              array[left + 2] = array[left + 1];
            case 1:
              array[left + 1] = array[left];
              break;
            default:
              while (n > 0) {
                array[left + n] = array[left + n - 1];
                n--;
              }
          }
          array[left] = pivot;
        }
      }
      function gallopLeft(value, array, start, length, hint, compare) {
        var lastOffset = 0;
        var maxOffset = 0;
        var offset = 1;
        if (compare(value, array[start + hint]) > 0) {
          maxOffset = length - hint;
          while (offset < maxOffset && compare(value, array[start + hint + offset]) > 0) {
            lastOffset = offset;
            offset = (offset << 1) + 1;
            if (offset <= 0) {
              offset = maxOffset;
            }
          }
          if (offset > maxOffset) {
            offset = maxOffset;
          }
          lastOffset += hint;
          offset += hint;
        } else {
          maxOffset = hint + 1;
          while (offset < maxOffset && compare(value, array[start + hint - offset]) <= 0) {
            lastOffset = offset;
            offset = (offset << 1) + 1;
            if (offset <= 0) {
              offset = maxOffset;
            }
          }
          if (offset > maxOffset) {
            offset = maxOffset;
          }
          var tmp = lastOffset;
          lastOffset = hint - offset;
          offset = hint - tmp;
        }
        lastOffset++;
        while (lastOffset < offset) {
          var m = lastOffset + (offset - lastOffset >>> 1);
          if (compare(value, array[start + m]) > 0) {
            lastOffset = m + 1;
          } else {
            offset = m;
          }
        }
        return offset;
      }
      function gallopRight(value, array, start, length, hint, compare) {
        var lastOffset = 0;
        var maxOffset = 0;
        var offset = 1;
        if (compare(value, array[start + hint]) < 0) {
          maxOffset = hint + 1;
          while (offset < maxOffset && compare(value, array[start + hint - offset]) < 0) {
            lastOffset = offset;
            offset = (offset << 1) + 1;
            if (offset <= 0) {
              offset = maxOffset;
            }
          }
          if (offset > maxOffset) {
            offset = maxOffset;
          }
          var tmp = lastOffset;
          lastOffset = hint - offset;
          offset = hint - tmp;
        } else {
          maxOffset = length - hint;
          while (offset < maxOffset && compare(value, array[start + hint + offset]) >= 0) {
            lastOffset = offset;
            offset = (offset << 1) + 1;
            if (offset <= 0) {
              offset = maxOffset;
            }
          }
          if (offset > maxOffset) {
            offset = maxOffset;
          }
          lastOffset += hint;
          offset += hint;
        }
        lastOffset++;
        while (lastOffset < offset) {
          var m = lastOffset + (offset - lastOffset >>> 1);
          if (compare(value, array[start + m]) < 0) {
            offset = m;
          } else {
            lastOffset = m + 1;
          }
        }
        return offset;
      }
      function TimSort(array, compare) {
        var minGallop = DEFAULT_MIN_GALLOPING;
        var length = 0;
        var tmpStorageLength = DEFAULT_TMP_STORAGE_LENGTH;
        var stackLength = 0;
        var runStart;
        var runLength;
        var stackSize = 0;
        length = array.length;
        if (length < 2 * DEFAULT_TMP_STORAGE_LENGTH) {
          tmpStorageLength = length >>> 1;
        }
        var tmp = [];
        stackLength = length < 120 ? 5 : length < 1542 ? 10 : length < 119151 ? 19 : 40;
        runStart = [];
        runLength = [];
        function pushRun(_runStart, _runLength) {
          runStart[stackSize] = _runStart;
          runLength[stackSize] = _runLength;
          stackSize += 1;
        }
        function mergeRuns() {
          while (stackSize > 1) {
            var n = stackSize - 2;
            if (n >= 1 && runLength[n - 1] <= runLength[n] + runLength[n + 1] || n >= 2 && runLength[n - 2] <= runLength[n] + runLength[n - 1]) {
              if (runLength[n - 1] < runLength[n + 1]) {
                n--;
              }
            } else if (runLength[n] > runLength[n + 1]) {
              break;
            }
            mergeAt(n);
          }
        }
        function forceMergeRuns() {
          while (stackSize > 1) {
            var n = stackSize - 2;
            if (n > 0 && runLength[n - 1] < runLength[n + 1]) {
              n--;
            }
            mergeAt(n);
          }
        }
        function mergeAt(i) {
          var start1 = runStart[i];
          var length1 = runLength[i];
          var start2 = runStart[i + 1];
          var length2 = runLength[i + 1];
          runLength[i] = length1 + length2;
          if (i === stackSize - 3) {
            runStart[i + 1] = runStart[i + 2];
            runLength[i + 1] = runLength[i + 2];
          }
          stackSize--;
          var k = gallopRight(array[start2], array, start1, length1, 0, compare);
          start1 += k;
          length1 -= k;
          if (length1 === 0) {
            return;
          }
          length2 = gallopLeft(array[start1 + length1 - 1], array, start2, length2, length2 - 1, compare);
          if (length2 === 0) {
            return;
          }
          if (length1 <= length2) {
            mergeLow(start1, length1, start2, length2);
          } else {
            mergeHigh(start1, length1, start2, length2);
          }
        }
        function mergeLow(start1, length1, start2, length2) {
          var i = 0;
          for (i = 0; i < length1; i++) {
            tmp[i] = array[start1 + i];
          }
          var cursor1 = 0;
          var cursor2 = start2;
          var dest = start1;
          array[dest++] = array[cursor2++];
          if (--length2 === 0) {
            for (i = 0; i < length1; i++) {
              array[dest + i] = tmp[cursor1 + i];
            }
            return;
          }
          if (length1 === 1) {
            for (i = 0; i < length2; i++) {
              array[dest + i] = array[cursor2 + i];
            }
            array[dest + length2] = tmp[cursor1];
            return;
          }
          var _minGallop = minGallop;
          var count1,
              count2,
              exit;
          while (1) {
            count1 = 0;
            count2 = 0;
            exit = false;
            do {
              if (compare(array[cursor2], tmp[cursor1]) < 0) {
                array[dest++] = array[cursor2++];
                count2++;
                count1 = 0;
                if (--length2 === 0) {
                  exit = true;
                  break;
                }
              } else {
                array[dest++] = tmp[cursor1++];
                count1++;
                count2 = 0;
                if (--length1 === 1) {
                  exit = true;
                  break;
                }
              }
            } while ((count1 | count2) < _minGallop);
            if (exit) {
              break;
            }
            do {
              count1 = gallopRight(array[cursor2], tmp, cursor1, length1, 0, compare);
              if (count1 !== 0) {
                for (i = 0; i < count1; i++) {
                  array[dest + i] = tmp[cursor1 + i];
                }
                dest += count1;
                cursor1 += count1;
                length1 -= count1;
                if (length1 <= 1) {
                  exit = true;
                  break;
                }
              }
              array[dest++] = array[cursor2++];
              if (--length2 === 0) {
                exit = true;
                break;
              }
              count2 = gallopLeft(tmp[cursor1], array, cursor2, length2, 0, compare);
              if (count2 !== 0) {
                for (i = 0; i < count2; i++) {
                  array[dest + i] = array[cursor2 + i];
                }
                dest += count2;
                cursor2 += count2;
                length2 -= count2;
                if (length2 === 0) {
                  exit = true;
                  break;
                }
              }
              array[dest++] = tmp[cursor1++];
              if (--length1 === 1) {
                exit = true;
                break;
              }
              _minGallop--;
            } while (count1 >= DEFAULT_MIN_GALLOPING || count2 >= DEFAULT_MIN_GALLOPING);
            if (exit) {
              break;
            }
            if (_minGallop < 0) {
              _minGallop = 0;
            }
            _minGallop += 2;
          }
          minGallop = _minGallop;
          minGallop < 1 && (minGallop = 1);
          if (length1 === 1) {
            for (i = 0; i < length2; i++) {
              array[dest + i] = array[cursor2 + i];
            }
            array[dest + length2] = tmp[cursor1];
          } else if (length1 === 0) {
            throw new Error();
          } else {
            for (i = 0; i < length1; i++) {
              array[dest + i] = tmp[cursor1 + i];
            }
          }
        }
        function mergeHigh(start1, length1, start2, length2) {
          var i = 0;
          for (i = 0; i < length2; i++) {
            tmp[i] = array[start2 + i];
          }
          var cursor1 = start1 + length1 - 1;
          var cursor2 = length2 - 1;
          var dest = start2 + length2 - 1;
          var customCursor = 0;
          var customDest = 0;
          array[dest--] = array[cursor1--];
          if (--length1 === 0) {
            customCursor = dest - (length2 - 1);
            for (i = 0; i < length2; i++) {
              array[customCursor + i] = tmp[i];
            }
            return;
          }
          if (length2 === 1) {
            dest -= length1;
            cursor1 -= length1;
            customDest = dest + 1;
            customCursor = cursor1 + 1;
            for (i = length1 - 1; i >= 0; i--) {
              array[customDest + i] = array[customCursor + i];
            }
            array[dest] = tmp[cursor2];
            return;
          }
          var _minGallop = minGallop;
          while (true) {
            var count1 = 0;
            var count2 = 0;
            var exit = false;
            do {
              if (compare(tmp[cursor2], array[cursor1]) < 0) {
                array[dest--] = array[cursor1--];
                count1++;
                count2 = 0;
                if (--length1 === 0) {
                  exit = true;
                  break;
                }
              } else {
                array[dest--] = tmp[cursor2--];
                count2++;
                count1 = 0;
                if (--length2 === 1) {
                  exit = true;
                  break;
                }
              }
            } while ((count1 | count2) < _minGallop);
            if (exit) {
              break;
            }
            do {
              count1 = length1 - gallopRight(tmp[cursor2], array, start1, length1, length1 - 1, compare);
              if (count1 !== 0) {
                dest -= count1;
                cursor1 -= count1;
                length1 -= count1;
                customDest = dest + 1;
                customCursor = cursor1 + 1;
                for (i = count1 - 1; i >= 0; i--) {
                  array[customDest + i] = array[customCursor + i];
                }
                if (length1 === 0) {
                  exit = true;
                  break;
                }
              }
              array[dest--] = tmp[cursor2--];
              if (--length2 === 1) {
                exit = true;
                break;
              }
              count2 = length2 - gallopLeft(array[cursor1], tmp, 0, length2, length2 - 1, compare);
              if (count2 !== 0) {
                dest -= count2;
                cursor2 -= count2;
                length2 -= count2;
                customDest = dest + 1;
                customCursor = cursor2 + 1;
                for (i = 0; i < count2; i++) {
                  array[customDest + i] = tmp[customCursor + i];
                }
                if (length2 <= 1) {
                  exit = true;
                  break;
                }
              }
              array[dest--] = array[cursor1--];
              if (--length1 === 0) {
                exit = true;
                break;
              }
              _minGallop--;
            } while (count1 >= DEFAULT_MIN_GALLOPING || count2 >= DEFAULT_MIN_GALLOPING);
            if (exit) {
              break;
            }
            if (_minGallop < 0) {
              _minGallop = 0;
            }
            _minGallop += 2;
          }
          minGallop = _minGallop;
          if (minGallop < 1) {
            minGallop = 1;
          }
          if (length2 === 1) {
            dest -= length1;
            cursor1 -= length1;
            customDest = dest + 1;
            customCursor = cursor1 + 1;
            for (i = length1 - 1; i >= 0; i--) {
              array[customDest + i] = array[customCursor + i];
            }
            array[dest] = tmp[cursor2];
          } else if (length2 === 0) {
            throw new Error();
          } else {
            customCursor = dest - (length2 - 1);
            for (i = 0; i < length2; i++) {
              array[customCursor + i] = tmp[i];
            }
          }
        }
        this.mergeRuns = mergeRuns;
        this.forceMergeRuns = forceMergeRuns;
        this.pushRun = pushRun;
      }
      function sort(array, compare, lo, hi) {
        if (!lo) {
          lo = 0;
        }
        if (!hi) {
          hi = array.length;
        }
        var remaining = hi - lo;
        if (remaining < 2) {
          return;
        }
        var runLength = 0;
        if (remaining < DEFAULT_MIN_MERGE) {
          runLength = makeAscendingRun(array, lo, hi, compare);
          binaryInsertionSort(array, lo, hi, lo + runLength, compare);
          return;
        }
        var ts = new TimSort(array, compare);
        var minRun = minRunLength(remaining);
        do {
          runLength = makeAscendingRun(array, lo, hi, compare);
          if (runLength < minRun) {
            var force = remaining;
            if (force > minRun) {
              force = minRun;
            }
            binaryInsertionSort(array, lo, lo + force, lo + runLength, compare);
            runLength = force;
          }
          ts.pushRun(lo, runLength);
          ts.mergeRuns();
          remaining -= runLength;
          lo += runLength;
        } while (remaining !== 0);
        ts.forceMergeRuns();
      }
      module.exports = sort;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var util = __webpack_require__(4);
      var Dispatcher = __webpack_require__(88).Dispatcher;
      var requestAnimationFrame = __webpack_require__(89);
      var Animator = __webpack_require__(36);
      var Animation = function(options) {
        options = options || {};
        this.stage = options.stage || {};
        this.onframe = options.onframe || function() {};
        this._clips = [];
        this._running = false;
        this._time;
        this._pausedTime;
        this._pauseStart;
        this._paused = false;
        Dispatcher.call(this);
      };
      Animation.prototype = {
        constructor: Animation,
        addClip: function(clip) {
          this._clips.push(clip);
        },
        addAnimator: function(animator) {
          animator.animation = this;
          var clips = animator.getClips();
          for (var i = 0; i < clips.length; i++) {
            this.addClip(clips[i]);
          }
        },
        removeClip: function(clip) {
          var idx = util.indexOf(this._clips, clip);
          if (idx >= 0) {
            this._clips.splice(idx, 1);
          }
        },
        removeAnimator: function(animator) {
          var clips = animator.getClips();
          for (var i = 0; i < clips.length; i++) {
            this.removeClip(clips[i]);
          }
          animator.animation = null;
        },
        _update: function() {
          var time = new Date().getTime() - this._pausedTime;
          var delta = time - this._time;
          var clips = this._clips;
          var len = clips.length;
          var deferredEvents = [];
          var deferredClips = [];
          for (var i = 0; i < len; i++) {
            var clip = clips[i];
            var e = clip.step(time);
            if (e) {
              deferredEvents.push(e);
              deferredClips.push(clip);
            }
          }
          for (var i = 0; i < len; ) {
            if (clips[i]._needsRemove) {
              clips[i] = clips[len - 1];
              clips.pop();
              len--;
            } else {
              i++;
            }
          }
          len = deferredEvents.length;
          for (var i = 0; i < len; i++) {
            deferredClips[i].fire(deferredEvents[i]);
          }
          this._time = time;
          this.onframe(delta);
          this.trigger('frame', delta);
          if (this.stage.update) {
            this.stage.update();
          }
        },
        _startLoop: function() {
          var self = this;
          this._running = true;
          function step() {
            if (self._running) {
              requestAnimationFrame(step);
              !self._paused && self._update();
            }
          }
          requestAnimationFrame(step);
        },
        start: function() {
          this._time = new Date().getTime();
          this._pausedTime = 0;
          this._startLoop();
        },
        stop: function() {
          this._running = false;
        },
        pause: function() {
          if (!this._paused) {
            this._pauseStart = new Date().getTime();
            this._paused = true;
          }
        },
        resume: function() {
          if (this._paused) {
            this._pausedTime += (new Date().getTime()) - this._pauseStart;
            this._paused = false;
          }
        },
        clear: function() {
          this._clips = [];
        },
        animate: function(target, options) {
          options = options || {};
          var animator = new Animator(target, options.loop, options.getter, options.setter);
          this.addAnimator(animator);
          return animator;
        }
      };
      util.mixin(Animation, Dispatcher);
      module.exports = Animation;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var Eventful = __webpack_require__(33);
      var env = __webpack_require__(2);
      var isDomLevel2 = (typeof window !== 'undefined') && !!window.addEventListener;
      function getBoundingClientRect(el) {
        return el.getBoundingClientRect ? el.getBoundingClientRect() : {
          left: 0,
          top: 0
        };
      }
      function clientToLocal(el, e, out, calculate) {
        out = out || {};
        if (calculate || !env.canvasSupported) {
          defaultGetZrXY(el, e, out);
        } else if (env.browser.firefox && e.layerX != null && e.layerX !== e.offsetX) {
          out.zrX = e.layerX;
          out.zrY = e.layerY;
        } else if (e.offsetX != null) {
          out.zrX = e.offsetX;
          out.zrY = e.offsetY;
        } else {
          defaultGetZrXY(el, e, out);
        }
        return out;
      }
      function defaultGetZrXY(el, e, out) {
        var box = getBoundingClientRect(el);
        out.zrX = e.clientX - box.left;
        out.zrY = e.clientY - box.top;
      }
      function normalizeEvent(el, e, calculate) {
        e = e || window.event;
        if (e.zrX != null) {
          return e;
        }
        var eventType = e.type;
        var isTouch = eventType && eventType.indexOf('touch') >= 0;
        if (!isTouch) {
          clientToLocal(el, e, e, calculate);
          e.zrDelta = (e.wheelDelta) ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
        } else {
          var touch = eventType != 'touchend' ? e.targetTouches[0] : e.changedTouches[0];
          touch && clientToLocal(el, touch, e, calculate);
        }
        return e;
      }
      function addEventListener(el, name, handler) {
        if (isDomLevel2) {
          el.addEventListener(name, handler);
        } else {
          el.attachEvent('on' + name, handler);
        }
      }
      function removeEventListener(el, name, handler) {
        if (isDomLevel2) {
          el.removeEventListener(name, handler);
        } else {
          el.detachEvent('on' + name, handler);
        }
      }
      var stop = isDomLevel2 ? function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.cancelBubble = true;
      } : function(e) {
        e.returnValue = false;
        e.cancelBubble = true;
      };
      module.exports = {
        clientToLocal: clientToLocal,
        normalizeEvent: normalizeEvent,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        stop: stop,
        Dispatcher: Eventful
      };
    }, function(module, exports) {
      module.exports = (typeof window !== 'undefined' && (window.requestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame)) || function(func) {
        setTimeout(func, 16);
      };
    }, function(module, exports, __webpack_require__) {
      var eventTool = __webpack_require__(88);
      var zrUtil = __webpack_require__(4);
      var Eventful = __webpack_require__(33);
      var env = __webpack_require__(2);
      var GestureMgr = __webpack_require__(91);
      var addEventListener = eventTool.addEventListener;
      var removeEventListener = eventTool.removeEventListener;
      var normalizeEvent = eventTool.normalizeEvent;
      var TOUCH_CLICK_DELAY = 300;
      var mouseHandlerNames = ['click', 'dblclick', 'mousewheel', 'mouseout', 'mouseup', 'mousedown', 'mousemove', 'contextmenu'];
      var touchHandlerNames = ['touchstart', 'touchend', 'touchmove'];
      var pointerEventNames = {
        pointerdown: 1,
        pointerup: 1,
        pointermove: 1,
        pointerout: 1
      };
      var pointerHandlerNames = zrUtil.map(mouseHandlerNames, function(name) {
        var nm = name.replace('mouse', 'pointer');
        return pointerEventNames[nm] ? nm : name;
      });
      function eventNameFix(name) {
        return (name === 'mousewheel' && env.browser.firefox) ? 'DOMMouseScroll' : name;
      }
      function processGesture(proxy, event, stage) {
        var gestureMgr = proxy._gestureMgr;
        stage === 'start' && gestureMgr.clear();
        var gestureInfo = gestureMgr.recognize(event, proxy.handler.findHover(event.zrX, event.zrY, null), proxy.dom);
        stage === 'end' && gestureMgr.clear();
        if (gestureInfo) {
          var type = gestureInfo.type;
          event.gestureEvent = type;
          proxy.handler.dispatchToElement(gestureInfo.target, type, gestureInfo.event);
        }
      }
      function setTouchTimer(instance) {
        instance._touching = true;
        clearTimeout(instance._touchTimer);
        instance._touchTimer = setTimeout(function() {
          instance._touching = false;
        }, 700);
      }
      var domHandlers = {
        mousemove: function(event) {
          event = normalizeEvent(this.dom, event);
          this.trigger('mousemove', event);
        },
        mouseout: function(event) {
          event = normalizeEvent(this.dom, event);
          var element = event.toElement || event.relatedTarget;
          if (element != this.dom) {
            while (element && element.nodeType != 9) {
              if (element === this.dom) {
                return;
              }
              element = element.parentNode;
            }
          }
          this.trigger('mouseout', event);
        },
        touchstart: function(event) {
          event = normalizeEvent(this.dom, event);
          event.zrByTouch = true;
          this._lastTouchMoment = new Date();
          processGesture(this, event, 'start');
          domHandlers.mousemove.call(this, event);
          domHandlers.mousedown.call(this, event);
          setTouchTimer(this);
        },
        touchmove: function(event) {
          event = normalizeEvent(this.dom, event);
          event.zrByTouch = true;
          processGesture(this, event, 'change');
          domHandlers.mousemove.call(this, event);
          setTouchTimer(this);
        },
        touchend: function(event) {
          event = normalizeEvent(this.dom, event);
          event.zrByTouch = true;
          processGesture(this, event, 'end');
          domHandlers.mouseup.call(this, event);
          if (+new Date() - this._lastTouchMoment < TOUCH_CLICK_DELAY) {
            domHandlers.click.call(this, event);
          }
          setTouchTimer(this);
        },
        pointerdown: function(event) {
          domHandlers.mousedown.call(this, event);
        },
        pointermove: function(event) {
          if (!isPointerFromTouch(event)) {
            domHandlers.mousemove.call(this, event);
          }
        },
        pointerup: function(event) {
          domHandlers.mouseup.call(this, event);
        },
        pointerout: function(event) {
          if (!isPointerFromTouch(event)) {
            domHandlers.mouseout.call(this, event);
          }
        }
      };
      function isPointerFromTouch(event) {
        var pointerType = event.pointerType;
        return pointerType === 'pen' || pointerType === 'touch';
      }
      zrUtil.each(['click', 'mousedown', 'mouseup', 'mousewheel', 'dblclick', 'contextmenu'], function(name) {
        domHandlers[name] = function(event) {
          event = normalizeEvent(this.dom, event);
          this.trigger(name, event);
        };
      });
      function initDomHandler(instance) {
        zrUtil.each(touchHandlerNames, function(name) {
          instance._handlers[name] = zrUtil.bind(domHandlers[name], instance);
        });
        zrUtil.each(pointerHandlerNames, function(name) {
          instance._handlers[name] = zrUtil.bind(domHandlers[name], instance);
        });
        zrUtil.each(mouseHandlerNames, function(name) {
          instance._handlers[name] = makeMouseHandler(domHandlers[name], instance);
        });
        function makeMouseHandler(fn, instance) {
          return function() {
            if (instance._touching) {
              return;
            }
            return fn.apply(instance, arguments);
          };
        }
      }
      function HandlerDomProxy(dom) {
        Eventful.call(this);
        this.dom = dom;
        this._touching = false;
        this._touchTimer;
        this._gestureMgr = new GestureMgr();
        this._handlers = {};
        initDomHandler(this);
        if (env.pointerEventsSupported) {
          mountHandlers(pointerHandlerNames, this);
        } else {
          if (env.touchEventsSupported) {
            mountHandlers(touchHandlerNames, this);
          }
          mountHandlers(mouseHandlerNames, this);
        }
        function mountHandlers(handlerNames, instance) {
          zrUtil.each(handlerNames, function(name) {
            addEventListener(dom, eventNameFix(name), instance._handlers[name]);
          }, instance);
        }
      }
      var handlerDomProxyProto = HandlerDomProxy.prototype;
      handlerDomProxyProto.dispose = function() {
        var handlerNames = mouseHandlerNames.concat(touchHandlerNames);
        for (var i = 0; i < handlerNames.length; i++) {
          var name = handlerNames[i];
          removeEventListener(this.dom, eventNameFix(name), this._handlers[name]);
        }
      };
      handlerDomProxyProto.setCursor = function(cursorStyle) {
        this.dom.style.cursor = cursorStyle || 'default';
      };
      zrUtil.mixin(HandlerDomProxy, Eventful);
      module.exports = HandlerDomProxy;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var eventUtil = __webpack_require__(88);
      var GestureMgr = function() {
        this._track = [];
      };
      GestureMgr.prototype = {
        constructor: GestureMgr,
        recognize: function(event, target, root) {
          this._doTrack(event, target, root);
          return this._recognize(event);
        },
        clear: function() {
          this._track.length = 0;
          return this;
        },
        _doTrack: function(event, target, root) {
          var touches = event.touches;
          if (!touches) {
            return;
          }
          var trackItem = {
            points: [],
            touches: [],
            target: target,
            event: event
          };
          for (var i = 0,
              len = touches.length; i < len; i++) {
            var touch = touches[i];
            var pos = eventUtil.clientToLocal(root, touch, {});
            trackItem.points.push([pos.zrX, pos.zrY]);
            trackItem.touches.push(touch);
          }
          this._track.push(trackItem);
        },
        _recognize: function(event) {
          for (var eventName in recognizers) {
            if (recognizers.hasOwnProperty(eventName)) {
              var gestureInfo = recognizers[eventName](this._track, event);
              if (gestureInfo) {
                return gestureInfo;
              }
            }
          }
        }
      };
      function dist(pointPair) {
        var dx = pointPair[1][0] - pointPair[0][0];
        var dy = pointPair[1][1] - pointPair[0][1];
        return Math.sqrt(dx * dx + dy * dy);
      }
      function center(pointPair) {
        return [(pointPair[0][0] + pointPair[1][0]) / 2, (pointPair[0][1] + pointPair[1][1]) / 2];
      }
      var recognizers = {pinch: function(track, event) {
          var trackLen = track.length;
          if (!trackLen) {
            return;
          }
          var pinchEnd = (track[trackLen - 1] || {}).points;
          var pinchPre = (track[trackLen - 2] || {}).points || pinchEnd;
          if (pinchPre && pinchPre.length > 1 && pinchEnd && pinchEnd.length > 1) {
            var pinchScale = dist(pinchEnd) / dist(pinchPre);
            !isFinite(pinchScale) && (pinchScale = 1);
            event.pinchScale = pinchScale;
            var pinchCenter = center(pinchEnd);
            event.pinchX = pinchCenter[0];
            event.pinchY = pinchCenter[1];
            return {
              type: 'pinch',
              target: track[0].target,
              event: event
            };
          }
        }};
      module.exports = GestureMgr;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var config = __webpack_require__(41);
      var util = __webpack_require__(4);
      var log = __webpack_require__(40);
      var BoundingRect = __webpack_require__(9);
      var timsort = __webpack_require__(86);
      var Layer = __webpack_require__(93);
      var requestAnimationFrame = __webpack_require__(89);
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
          var ImageShape = __webpack_require__(61);
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
      module.exports = Painter;
    }, function(module, exports, __webpack_require__) {
      var util = __webpack_require__(4);
      var config = __webpack_require__(41);
      var Style = __webpack_require__(47);
      var Pattern = __webpack_require__(59);
      function returnFalse() {
        return false;
      }
      function createDom(id, type, painter, dpr) {
        var newDom = document.createElement(type);
        var width = painter.getWidth();
        var height = painter.getHeight();
        var newDomStyle = newDom.style;
        newDomStyle.position = 'absolute';
        newDomStyle.left = 0;
        newDomStyle.top = 0;
        newDomStyle.width = width + 'px';
        newDomStyle.height = height + 'px';
        newDom.width = width * dpr;
        newDom.height = height * dpr;
        newDom.setAttribute('data-zr-dom-id', id);
        return newDom;
      }
      var Layer = function(id, painter, dpr) {
        var dom;
        dpr = dpr || config.devicePixelRatio;
        if (typeof id === 'string') {
          dom = createDom(id, 'canvas', painter, dpr);
        } else if (util.isObject(id)) {
          dom = id;
          id = dom.id;
        }
        this.id = id;
        this.dom = dom;
        var domStyle = dom.style;
        if (domStyle) {
          dom.onselectstart = returnFalse;
          domStyle['-webkit-user-select'] = 'none';
          domStyle['user-select'] = 'none';
          domStyle['-webkit-touch-callout'] = 'none';
          domStyle['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';
          domStyle['padding'] = 0;
          domStyle['margin'] = 0;
          domStyle['border-width'] = 0;
        }
        this.domBack = null;
        this.ctxBack = null;
        this.painter = painter;
        this.config = null;
        this.clearColor = 0;
        this.motionBlur = false;
        this.lastFrameAlpha = 0.7;
        this.dpr = dpr;
      };
      Layer.prototype = {
        constructor: Layer,
        elCount: 0,
        __dirty: true,
        initContext: function() {
          this.ctx = this.dom.getContext('2d');
          this.ctx.dpr = this.dpr;
        },
        createBackBuffer: function() {
          var dpr = this.dpr;
          this.domBack = createDom('back-' + this.id, 'canvas', this.painter, dpr);
          this.ctxBack = this.domBack.getContext('2d');
          if (dpr != 1) {
            this.ctxBack.scale(dpr, dpr);
          }
        },
        resize: function(width, height) {
          var dpr = this.dpr;
          var dom = this.dom;
          var domStyle = dom.style;
          var domBack = this.domBack;
          domStyle.width = width + 'px';
          domStyle.height = height + 'px';
          dom.width = width * dpr;
          dom.height = height * dpr;
          if (domBack) {
            domBack.width = width * dpr;
            domBack.height = height * dpr;
            if (dpr != 1) {
              this.ctxBack.scale(dpr, dpr);
            }
          }
        },
        clear: function(clearAll) {
          var dom = this.dom;
          var ctx = this.ctx;
          var width = dom.width;
          var height = dom.height;
          var clearColor = this.clearColor;
          var haveMotionBLur = this.motionBlur && !clearAll;
          var lastFrameAlpha = this.lastFrameAlpha;
          var dpr = this.dpr;
          if (haveMotionBLur) {
            if (!this.domBack) {
              this.createBackBuffer();
            }
            this.ctxBack.globalCompositeOperation = 'copy';
            this.ctxBack.drawImage(dom, 0, 0, width / dpr, height / dpr);
          }
          ctx.clearRect(0, 0, width, height);
          if (clearColor) {
            var clearColorGradientOrPattern;
            if (clearColor.colorStops) {
              clearColorGradientOrPattern = clearColor.__canvasGradient || Style.getGradient(ctx, clearColor, {
                x: 0,
                y: 0,
                width: width,
                height: height
              });
              clearColor.__canvasGradient = clearColorGradientOrPattern;
            } else if (clearColor.image) {
              clearColorGradientOrPattern = Pattern.prototype.getCanvasPattern.call(clearColor, ctx);
            }
            ctx.save();
            ctx.fillStyle = clearColorGradientOrPattern || clearColor;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
          }
          if (haveMotionBLur) {
            var domBack = this.domBack;
            ctx.save();
            ctx.globalAlpha = lastFrameAlpha;
            ctx.drawImage(domBack, 0, 0, width, height);
            ctx.restore();
          }
        }
      };
      module.exports = Layer;
    }, function(module, exports, __webpack_require__) {
      var Gradient = __webpack_require__(79);
      module.exports = function(ecModel) {
        function encodeColor(seriesModel) {
          var colorAccessPath = (seriesModel.visualColorAccessPath || 'itemStyle.normal.color').split('.');
          var data = seriesModel.getData();
          var color = seriesModel.get(colorAccessPath) || seriesModel.getColorFromPalette(seriesModel.get('name'));
          data.setVisual('color', color);
          if (!ecModel.isSeriesFiltered(seriesModel)) {
            if (typeof color === 'function' && !(color instanceof Gradient)) {
              data.each(function(idx) {
                data.setItemVisual(idx, 'color', color(seriesModel.getDataParams(idx)));
              });
            }
            data.each(function(idx) {
              var itemModel = data.getItemModel(idx);
              var color = itemModel.get(colorAccessPath, true);
              if (color != null) {
                data.setItemVisual(idx, 'color', color);
              }
            });
          }
        }
        ecModel.eachRawSeries(encodeColor);
      };
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var compatStyle = __webpack_require__(96);
      function get(opt, path) {
        path = path.split(',');
        var obj = opt;
        for (var i = 0; i < path.length; i++) {
          obj = obj && obj[path[i]];
          if (obj == null) {
            break;
          }
        }
        return obj;
      }
      function set(opt, path, val, overwrite) {
        path = path.split(',');
        var obj = opt;
        var key;
        for (var i = 0; i < path.length - 1; i++) {
          key = path[i];
          if (obj[key] == null) {
            obj[key] = {};
          }
          obj = obj[key];
        }
        if (overwrite || obj[path[i]] == null) {
          obj[path[i]] = val;
        }
      }
      function compatLayoutProperties(option) {
        each(LAYOUT_PROPERTIES, function(prop) {
          if (prop[0] in option && !(prop[1] in option)) {
            option[prop[1]] = option[prop[0]];
          }
        });
      }
      var LAYOUT_PROPERTIES = [['x', 'left'], ['y', 'top'], ['x2', 'right'], ['y2', 'bottom']];
      var COMPATITABLE_COMPONENTS = ['grid', 'geo', 'parallel', 'legend', 'toolbox', 'title', 'visualMap', 'dataZoom', 'timeline'];
      var COMPATITABLE_SERIES = ['bar', 'boxplot', 'candlestick', 'chord', 'effectScatter', 'funnel', 'gauge', 'lines', 'graph', 'heatmap', 'line', 'map', 'parallel', 'pie', 'radar', 'sankey', 'scatter', 'treemap'];
      var each = zrUtil.each;
      module.exports = function(option) {
        each(option.series, function(seriesOpt) {
          if (!zrUtil.isObject(seriesOpt)) {
            return;
          }
          var seriesType = seriesOpt.type;
          compatStyle(seriesOpt);
          if (seriesType === 'pie' || seriesType === 'gauge') {
            if (seriesOpt.clockWise != null) {
              seriesOpt.clockwise = seriesOpt.clockWise;
            }
          }
          if (seriesType === 'gauge') {
            var pointerColor = get(seriesOpt, 'pointer.color');
            pointerColor != null && set(seriesOpt, 'itemStyle.normal.color', pointerColor);
          }
          for (var i = 0; i < COMPATITABLE_SERIES.length; i++) {
            if (COMPATITABLE_SERIES[i] === seriesOpt.type) {
              compatLayoutProperties(seriesOpt);
              break;
            }
          }
        });
        if (option.dataRange) {
          option.visualMap = option.dataRange;
        }
        each(COMPATITABLE_COMPONENTS, function(componentName) {
          var options = option[componentName];
          if (options) {
            if (!zrUtil.isArray(options)) {
              options = [options];
            }
            each(options, function(option) {
              compatLayoutProperties(option);
            });
          }
        });
      };
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var POSSIBLE_STYLES = ['areaStyle', 'lineStyle', 'nodeStyle', 'linkStyle', 'chordStyle', 'label', 'labelLine'];
      function compatItemStyle(opt) {
        var itemStyleOpt = opt && opt.itemStyle;
        if (itemStyleOpt) {
          zrUtil.each(POSSIBLE_STYLES, function(styleName) {
            var normalItemStyleOpt = itemStyleOpt.normal;
            var emphasisItemStyleOpt = itemStyleOpt.emphasis;
            if (normalItemStyleOpt && normalItemStyleOpt[styleName]) {
              opt[styleName] = opt[styleName] || {};
              if (!opt[styleName].normal) {
                opt[styleName].normal = normalItemStyleOpt[styleName];
              } else {
                zrUtil.merge(opt[styleName].normal, normalItemStyleOpt[styleName]);
              }
              normalItemStyleOpt[styleName] = null;
            }
            if (emphasisItemStyleOpt && emphasisItemStyleOpt[styleName]) {
              opt[styleName] = opt[styleName] || {};
              if (!opt[styleName].emphasis) {
                opt[styleName].emphasis = emphasisItemStyleOpt[styleName];
              } else {
                zrUtil.merge(opt[styleName].emphasis, emphasisItemStyleOpt[styleName]);
              }
              emphasisItemStyleOpt[styleName] = null;
            }
          });
        }
      }
      module.exports = function(seriesOpt) {
        if (!seriesOpt) {
          return;
        }
        compatItemStyle(seriesOpt);
        compatItemStyle(seriesOpt.markPoint);
        compatItemStyle(seriesOpt.markLine);
        var data = seriesOpt.data;
        if (data) {
          for (var i = 0; i < data.length; i++) {
            compatItemStyle(data[i]);
          }
          var markPoint = seriesOpt.markPoint;
          if (markPoint && markPoint.data) {
            var mpData = markPoint.data;
            for (var i = 0; i < mpData.length; i++) {
              compatItemStyle(mpData[i]);
            }
          }
          var markLine = seriesOpt.markLine;
          if (markLine && markLine.data) {
            var mlData = markLine.data;
            for (var i = 0; i < mlData.length; i++) {
              if (zrUtil.isArray(mlData[i])) {
                compatItemStyle(mlData[i][0]);
                compatItemStyle(mlData[i][1]);
              } else {
                compatItemStyle(mlData[i]);
              }
            }
          }
        }
      };
    }, function(module, exports, __webpack_require__) {
      var graphic = __webpack_require__(43);
      var zrUtil = __webpack_require__(4);
      var PI = Math.PI;
      module.exports = function(api, opts) {
        opts = opts || {};
        zrUtil.defaults(opts, {
          text: 'loading',
          color: '#c23531',
          textColor: '#000',
          maskColor: 'rgba(255, 255, 255, 0.8)',
          zlevel: 0
        });
        var mask = new graphic.Rect({
          style: {fill: opts.maskColor},
          zlevel: opts.zlevel,
          z: 10000
        });
        var arc = new graphic.Arc({
          shape: {
            startAngle: -PI / 2,
            endAngle: -PI / 2 + 0.1,
            r: 10
          },
          style: {
            stroke: opts.color,
            lineCap: 'round',
            lineWidth: 5
          },
          zlevel: opts.zlevel,
          z: 10001
        });
        var labelRect = new graphic.Rect({
          style: {
            fill: 'none',
            text: opts.text,
            textPosition: 'right',
            textDistance: 10,
            textFill: opts.textColor
          },
          zlevel: opts.zlevel,
          z: 10001
        });
        arc.animateShape(true).when(1000, {endAngle: PI * 3 / 2}).start('circularInOut');
        arc.animateShape(true).when(1000, {startAngle: PI * 3 / 2}).delay(300).start('circularInOut');
        var group = new graphic.Group();
        group.add(arc);
        group.add(labelRect);
        group.add(mask);
        group.resize = function() {
          var cx = api.getWidth() / 2;
          var cy = api.getHeight() / 2;
          arc.setShape({
            cx: cx,
            cy: cy
          });
          var r = arc.shape.r;
          labelRect.setShape({
            x: cx - r,
            y: cy - r,
            width: r * 2,
            height: r * 2
          });
          mask.setShape({
            x: 0,
            y: 0,
            width: api.getWidth(),
            height: api.getHeight()
          });
        };
        group.resize();
        return group;
      };
    }, function(module, exports, __webpack_require__) {
      (function(global) {
        var UNDEFINED = 'undefined';
        var globalObj = typeof window === 'undefined' ? global : window;
        var Float64Array = typeof globalObj.Float64Array === UNDEFINED ? Array : globalObj.Float64Array;
        var Int32Array = typeof globalObj.Int32Array === UNDEFINED ? Array : globalObj.Int32Array;
        var dataCtors = {
          'float': Float64Array,
          'int': Int32Array,
          'ordinal': Array,
          'number': Array,
          'time': Array
        };
        var Model = __webpack_require__(12);
        var DataDiffer = __webpack_require__(99);
        var zrUtil = __webpack_require__(4);
        var modelUtil = __webpack_require__(5);
        var isObject = zrUtil.isObject;
        var TRANSFERABLE_PROPERTIES = ['stackedOn', 'hasItemOption', '_nameList', '_idList', '_rawData'];
        var transferProperties = function(a, b) {
          zrUtil.each(TRANSFERABLE_PROPERTIES.concat(b.__wrappedMethods || []), function(propName) {
            if (b.hasOwnProperty(propName)) {
              a[propName] = b[propName];
            }
          });
          a.__wrappedMethods = b.__wrappedMethods;
        };
        var List = function(dimensions, hostModel) {
          dimensions = dimensions || ['x', 'y'];
          var dimensionInfos = {};
          var dimensionNames = [];
          for (var i = 0; i < dimensions.length; i++) {
            var dimensionName;
            var dimensionInfo = {};
            if (typeof dimensions[i] === 'string') {
              dimensionName = dimensions[i];
              dimensionInfo = {
                name: dimensionName,
                stackable: false,
                type: 'number'
              };
            } else {
              dimensionInfo = dimensions[i];
              dimensionName = dimensionInfo.name;
              dimensionInfo.type = dimensionInfo.type || 'number';
            }
            dimensionNames.push(dimensionName);
            dimensionInfos[dimensionName] = dimensionInfo;
          }
          this.dimensions = dimensionNames;
          this._dimensionInfos = dimensionInfos;
          this.hostModel = hostModel;
          this.dataType;
          this.indices = [];
          this._storage = {};
          this._nameList = [];
          this._idList = [];
          this._optionModels = [];
          this.stackedOn = null;
          this._visual = {};
          this._layout = {};
          this._itemVisuals = [];
          this._itemLayouts = [];
          this._graphicEls = [];
          this._rawData;
          this._extent;
        };
        var listProto = List.prototype;
        listProto.type = 'list';
        listProto.hasItemOption = true;
        listProto.getDimension = function(dim) {
          if (!isNaN(dim)) {
            dim = this.dimensions[dim] || dim;
          }
          return dim;
        };
        listProto.getDimensionInfo = function(dim) {
          return zrUtil.clone(this._dimensionInfos[this.getDimension(dim)]);
        };
        listProto.initData = function(data, nameList, dimValueGetter) {
          data = data || [];
          if (true) {
            if (!zrUtil.isArray(data)) {
              throw new Error('Invalid data.');
            }
          }
          this._rawData = data;
          var storage = this._storage = {};
          var indices = this.indices = [];
          var dimensions = this.dimensions;
          var size = data.length;
          var dimensionInfoMap = this._dimensionInfos;
          var idList = [];
          var nameRepeatCount = {};
          nameList = nameList || [];
          for (var i = 0; i < dimensions.length; i++) {
            var dimInfo = dimensionInfoMap[dimensions[i]];
            var DataCtor = dataCtors[dimInfo.type];
            storage[dimensions[i]] = new DataCtor(size);
          }
          var self = this;
          if (!dimValueGetter) {
            self.hasItemOption = false;
          }
          dimValueGetter = dimValueGetter || function(dataItem, dimName, dataIndex, dimIndex) {
            var value = modelUtil.getDataItemValue(dataItem);
            if (modelUtil.isDataItemOption(dataItem)) {
              self.hasItemOption = true;
            }
            return modelUtil.converDataValue((value instanceof Array) ? value[dimIndex] : value, dimensionInfoMap[dimName]);
          };
          for (var idx = 0; idx < data.length; idx++) {
            var dataItem = data[idx];
            for (var k = 0; k < dimensions.length; k++) {
              var dim = dimensions[k];
              var dimStorage = storage[dim];
              dimStorage[idx] = dimValueGetter(dataItem, dim, idx, k);
            }
            indices.push(idx);
          }
          for (var i = 0; i < data.length; i++) {
            if (!nameList[i]) {
              if (data[i] && data[i].name != null) {
                nameList[i] = data[i].name;
              }
            }
            var name = nameList[i] || '';
            var id = data[i] && data[i].id;
            if (!id && name) {
              nameRepeatCount[name] = nameRepeatCount[name] || 0;
              id = name;
              if (nameRepeatCount[name] > 0) {
                id += '__ec__' + nameRepeatCount[name];
              }
              nameRepeatCount[name]++;
            }
            id && (idList[i] = id);
          }
          this._nameList = nameList;
          this._idList = idList;
        };
        listProto.count = function() {
          return this.indices.length;
        };
        listProto.get = function(dim, idx, stack) {
          var storage = this._storage;
          var dataIndex = this.indices[idx];
          if (dataIndex == null) {
            return NaN;
          }
          var value = storage[dim] && storage[dim][dataIndex];
          if (stack) {
            var dimensionInfo = this._dimensionInfos[dim];
            if (dimensionInfo && dimensionInfo.stackable) {
              var stackedOn = this.stackedOn;
              while (stackedOn) {
                var stackedValue = stackedOn.get(dim, idx);
                if ((value >= 0 && stackedValue > 0) || (value <= 0 && stackedValue < 0)) {
                  value += stackedValue;
                }
                stackedOn = stackedOn.stackedOn;
              }
            }
          }
          return value;
        };
        listProto.getValues = function(dimensions, idx, stack) {
          var values = [];
          if (!zrUtil.isArray(dimensions)) {
            stack = idx;
            idx = dimensions;
            dimensions = this.dimensions;
          }
          for (var i = 0,
              len = dimensions.length; i < len; i++) {
            values.push(this.get(dimensions[i], idx, stack));
          }
          return values;
        };
        listProto.hasValue = function(idx) {
          var dimensions = this.dimensions;
          var dimensionInfos = this._dimensionInfos;
          for (var i = 0,
              len = dimensions.length; i < len; i++) {
            if (dimensionInfos[dimensions[i]].type !== 'ordinal' && isNaN(this.get(dimensions[i], idx))) {
              return false;
            }
          }
          return true;
        };
        listProto.getDataExtent = function(dim, stack, filter) {
          dim = this.getDimension(dim);
          var dimData = this._storage[dim];
          var dimInfo = this.getDimensionInfo(dim);
          stack = (dimInfo && dimInfo.stackable) && stack;
          var dimExtent = (this._extent || (this._extent = {}))[dim + (!!stack)];
          var value;
          if (dimExtent) {
            return dimExtent;
          }
          if (dimData) {
            var min = Infinity;
            var max = -Infinity;
            for (var i = 0,
                len = this.count(); i < len; i++) {
              value = this.get(dim, i, stack);
              if (!filter || filter(value, dim, i)) {
                value < min && (min = value);
                value > max && (max = value);
              }
            }
            return (this._extent[dim + !!stack] = [min, max]);
          } else {
            return [Infinity, -Infinity];
          }
        };
        listProto.getSum = function(dim, stack) {
          var dimData = this._storage[dim];
          var sum = 0;
          if (dimData) {
            for (var i = 0,
                len = this.count(); i < len; i++) {
              var value = this.get(dim, i, stack);
              if (!isNaN(value)) {
                sum += value;
              }
            }
          }
          return sum;
        };
        listProto.indexOf = function(dim, value) {
          var storage = this._storage;
          var dimData = storage[dim];
          var indices = this.indices;
          if (dimData) {
            for (var i = 0,
                len = indices.length; i < len; i++) {
              var rawIndex = indices[i];
              if (dimData[rawIndex] === value) {
                return i;
              }
            }
          }
          return -1;
        };
        listProto.indexOfName = function(name) {
          var indices = this.indices;
          var nameList = this._nameList;
          for (var i = 0,
              len = indices.length; i < len; i++) {
            var rawIndex = indices[i];
            if (nameList[rawIndex] === name) {
              return i;
            }
          }
          return -1;
        };
        listProto.indexOfRawIndex = function(rawIndex) {
          var indices = this.indices;
          var rawDataIndex = indices[rawIndex];
          if (rawDataIndex != null && rawDataIndex === rawIndex) {
            return rawIndex;
          }
          var left = 0;
          var right = indices.length - 1;
          while (left <= right) {
            var mid = (left + right) / 2 | 0;
            if (indices[mid] < rawIndex) {
              left = mid + 1;
            } else if (indices[mid] > rawIndex) {
              right = mid - 1;
            } else {
              return mid;
            }
          }
          return -1;
        };
        listProto.indexOfNearest = function(dim, value, stack, maxDistance) {
          var storage = this._storage;
          var dimData = storage[dim];
          if (maxDistance == null) {
            maxDistance = Infinity;
          }
          var nearestIdx = -1;
          if (dimData) {
            var minDist = Number.MAX_VALUE;
            for (var i = 0,
                len = this.count(); i < len; i++) {
              var diff = value - this.get(dim, i, stack);
              var dist = Math.abs(diff);
              if (diff <= maxDistance && (dist < minDist || (dist === minDist && diff > 0))) {
                minDist = dist;
                nearestIdx = i;
              }
            }
          }
          return nearestIdx;
        };
        listProto.getRawIndex = function(idx) {
          var rawIdx = this.indices[idx];
          return rawIdx == null ? -1 : rawIdx;
        };
        listProto.getRawDataItem = function(idx) {
          return this._rawData[this.getRawIndex(idx)];
        };
        listProto.getName = function(idx) {
          return this._nameList[this.indices[idx]] || '';
        };
        listProto.getId = function(idx) {
          return this._idList[this.indices[idx]] || (this.getRawIndex(idx) + '');
        };
        function normalizeDimensions(dimensions) {
          if (!zrUtil.isArray(dimensions)) {
            dimensions = [dimensions];
          }
          return dimensions;
        }
        listProto.each = function(dims, cb, stack, context) {
          if (typeof dims === 'function') {
            context = stack;
            stack = cb;
            cb = dims;
            dims = [];
          }
          dims = zrUtil.map(normalizeDimensions(dims), this.getDimension, this);
          var value = [];
          var dimSize = dims.length;
          var indices = this.indices;
          context = context || this;
          for (var i = 0; i < indices.length; i++) {
            switch (dimSize) {
              case 0:
                cb.call(context, i);
                break;
              case 1:
                cb.call(context, this.get(dims[0], i, stack), i);
                break;
              case 2:
                cb.call(context, this.get(dims[0], i, stack), this.get(dims[1], i, stack), i);
                break;
              default:
                for (var k = 0; k < dimSize; k++) {
                  value[k] = this.get(dims[k], i, stack);
                }
                value[k] = i;
                cb.apply(context, value);
            }
          }
        };
        listProto.filterSelf = function(dimensions, cb, stack, context) {
          if (typeof dimensions === 'function') {
            context = stack;
            stack = cb;
            cb = dimensions;
            dimensions = [];
          }
          dimensions = zrUtil.map(normalizeDimensions(dimensions), this.getDimension, this);
          var newIndices = [];
          var value = [];
          var dimSize = dimensions.length;
          var indices = this.indices;
          context = context || this;
          for (var i = 0; i < indices.length; i++) {
            var keep;
            if (dimSize === 1) {
              keep = cb.call(context, this.get(dimensions[0], i, stack), i);
            } else {
              for (var k = 0; k < dimSize; k++) {
                value[k] = this.get(dimensions[k], i, stack);
              }
              value[k] = i;
              keep = cb.apply(context, value);
            }
            if (keep) {
              newIndices.push(indices[i]);
            }
          }
          this.indices = newIndices;
          this._extent = {};
          return this;
        };
        listProto.mapArray = function(dimensions, cb, stack, context) {
          if (typeof dimensions === 'function') {
            context = stack;
            stack = cb;
            cb = dimensions;
            dimensions = [];
          }
          var result = [];
          this.each(dimensions, function() {
            result.push(cb && cb.apply(this, arguments));
          }, stack, context);
          return result;
        };
        function cloneListForMapAndSample(original, excludeDimensions) {
          var allDimensions = original.dimensions;
          var list = new List(zrUtil.map(allDimensions, original.getDimensionInfo, original), original.hostModel);
          transferProperties(list, original);
          var storage = list._storage = {};
          var originalStorage = original._storage;
          for (var i = 0; i < allDimensions.length; i++) {
            var dim = allDimensions[i];
            var dimStore = originalStorage[dim];
            if (zrUtil.indexOf(excludeDimensions, dim) >= 0) {
              storage[dim] = new dimStore.constructor(originalStorage[dim].length);
            } else {
              storage[dim] = originalStorage[dim];
            }
          }
          return list;
        }
        listProto.map = function(dimensions, cb, stack, context) {
          dimensions = zrUtil.map(normalizeDimensions(dimensions), this.getDimension, this);
          var list = cloneListForMapAndSample(this, dimensions);
          var indices = list.indices = this.indices;
          var storage = list._storage;
          var tmpRetValue = [];
          this.each(dimensions, function() {
            var idx = arguments[arguments.length - 1];
            var retValue = cb && cb.apply(this, arguments);
            if (retValue != null) {
              if (typeof retValue === 'number') {
                tmpRetValue[0] = retValue;
                retValue = tmpRetValue;
              }
              for (var i = 0; i < retValue.length; i++) {
                var dim = dimensions[i];
                var dimStore = storage[dim];
                var rawIdx = indices[idx];
                if (dimStore) {
                  dimStore[rawIdx] = retValue[i];
                }
              }
            }
          }, stack, context);
          return list;
        };
        listProto.downSample = function(dimension, rate, sampleValue, sampleIndex) {
          var list = cloneListForMapAndSample(this, [dimension]);
          var storage = this._storage;
          var targetStorage = list._storage;
          var originalIndices = this.indices;
          var indices = list.indices = [];
          var frameValues = [];
          var frameIndices = [];
          var frameSize = Math.floor(1 / rate);
          var dimStore = targetStorage[dimension];
          var len = this.count();
          for (var i = 0; i < storage[dimension].length; i++) {
            targetStorage[dimension][i] = storage[dimension][i];
          }
          for (var i = 0; i < len; i += frameSize) {
            if (frameSize > len - i) {
              frameSize = len - i;
              frameValues.length = frameSize;
            }
            for (var k = 0; k < frameSize; k++) {
              var idx = originalIndices[i + k];
              frameValues[k] = dimStore[idx];
              frameIndices[k] = idx;
            }
            var value = sampleValue(frameValues);
            var idx = frameIndices[sampleIndex(frameValues, value) || 0];
            dimStore[idx] = value;
            indices.push(idx);
          }
          return list;
        };
        listProto.getItemModel = function(idx) {
          var hostModel = this.hostModel;
          idx = this.indices[idx];
          return new Model(this._rawData[idx], hostModel, hostModel && hostModel.ecModel);
        };
        listProto.diff = function(otherList) {
          var idList = this._idList;
          var otherIdList = otherList && otherList._idList;
          var val;
          var prefix = 'e\0\0';
          return new DataDiffer(otherList ? otherList.indices : [], this.indices, function(idx) {
            return (val = otherIdList[idx]) != null ? val : prefix + idx;
          }, function(idx) {
            return (val = idList[idx]) != null ? val : prefix + idx;
          });
        };
        listProto.getVisual = function(key) {
          var visual = this._visual;
          return visual && visual[key];
        };
        listProto.setVisual = function(key, val) {
          if (isObject(key)) {
            for (var name in key) {
              if (key.hasOwnProperty(name)) {
                this.setVisual(name, key[name]);
              }
            }
            return;
          }
          this._visual = this._visual || {};
          this._visual[key] = val;
        };
        listProto.setLayout = function(key, val) {
          if (isObject(key)) {
            for (var name in key) {
              if (key.hasOwnProperty(name)) {
                this.setLayout(name, key[name]);
              }
            }
            return;
          }
          this._layout[key] = val;
        };
        listProto.getLayout = function(key) {
          return this._layout[key];
        };
        listProto.getItemLayout = function(idx) {
          return this._itemLayouts[idx];
        };
        listProto.setItemLayout = function(idx, layout, merge) {
          this._itemLayouts[idx] = merge ? zrUtil.extend(this._itemLayouts[idx] || {}, layout) : layout;
        };
        listProto.clearItemLayouts = function() {
          this._itemLayouts.length = 0;
        };
        listProto.getItemVisual = function(idx, key, ignoreParent) {
          var itemVisual = this._itemVisuals[idx];
          var val = itemVisual && itemVisual[key];
          if (val == null && !ignoreParent) {
            return this.getVisual(key);
          }
          return val;
        };
        listProto.setItemVisual = function(idx, key, value) {
          var itemVisual = this._itemVisuals[idx] || {};
          this._itemVisuals[idx] = itemVisual;
          if (isObject(key)) {
            for (var name in key) {
              if (key.hasOwnProperty(name)) {
                itemVisual[name] = key[name];
              }
            }
            return;
          }
          itemVisual[key] = value;
        };
        listProto.clearAllVisual = function() {
          this._visual = {};
          this._itemVisuals = [];
        };
        var setItemDataAndSeriesIndex = function(child) {
          child.seriesIndex = this.seriesIndex;
          child.dataIndex = this.dataIndex;
          child.dataType = this.dataType;
        };
        listProto.setItemGraphicEl = function(idx, el) {
          var hostModel = this.hostModel;
          if (el) {
            el.dataIndex = idx;
            el.dataType = this.dataType;
            el.seriesIndex = hostModel && hostModel.seriesIndex;
            if (el.type === 'group') {
              el.traverse(setItemDataAndSeriesIndex, el);
            }
          }
          this._graphicEls[idx] = el;
        };
        listProto.getItemGraphicEl = function(idx) {
          return this._graphicEls[idx];
        };
        listProto.eachItemGraphicEl = function(cb, context) {
          zrUtil.each(this._graphicEls, function(el, idx) {
            if (el) {
              cb && cb.call(context, el, idx);
            }
          });
        };
        listProto.cloneShallow = function() {
          var dimensionInfoList = zrUtil.map(this.dimensions, this.getDimensionInfo, this);
          var list = new List(dimensionInfoList, this.hostModel);
          list._storage = this._storage;
          transferProperties(list, this);
          list.indices = this.indices.slice();
          if (this._extent) {
            list._extent = zrUtil.extend({}, this._extent);
          }
          return list;
        };
        listProto.wrapMethod = function(methodName, injectFunction) {
          var originalMethod = this[methodName];
          if (typeof originalMethod !== 'function') {
            return;
          }
          this.__wrappedMethods = this.__wrappedMethods || [];
          this.__wrappedMethods.push(methodName);
          this[methodName] = function() {
            var res = originalMethod.apply(this, arguments);
            return injectFunction.apply(this, [res].concat(zrUtil.slice(arguments)));
          };
        };
        listProto.TRANSFERABLE_METHODS = ['cloneShallow', 'downSample', 'map'];
        listProto.CHANGABLE_METHODS = ['filterSelf'];
        module.exports = List;
      }.call(exports, (function() {
        return this;
      }())));
    }, function(module, exports) {
      'use strict';
      function defaultKeyGetter(item) {
        return item;
      }
      function DataDiffer(oldArr, newArr, oldKeyGetter, newKeyGetter) {
        this._old = oldArr;
        this._new = newArr;
        this._oldKeyGetter = oldKeyGetter || defaultKeyGetter;
        this._newKeyGetter = newKeyGetter || defaultKeyGetter;
      }
      DataDiffer.prototype = {
        constructor: DataDiffer,
        add: function(func) {
          this._add = func;
          return this;
        },
        update: function(func) {
          this._update = func;
          return this;
        },
        remove: function(func) {
          this._remove = func;
          return this;
        },
        execute: function() {
          var oldArr = this._old;
          var newArr = this._new;
          var oldKeyGetter = this._oldKeyGetter;
          var newKeyGetter = this._newKeyGetter;
          var oldDataIndexMap = {};
          var newDataIndexMap = {};
          var oldDataKeyArr = [];
          var newDataKeyArr = [];
          var i;
          initIndexMap(oldArr, oldDataIndexMap, oldDataKeyArr, oldKeyGetter);
          initIndexMap(newArr, newDataIndexMap, newDataKeyArr, newKeyGetter);
          for (i = 0; i < oldArr.length; i++) {
            var key = oldDataKeyArr[i];
            var idx = newDataIndexMap[key];
            if (idx != null) {
              var len = idx.length;
              if (len) {
                len === 1 && (newDataIndexMap[key] = null);
                idx = idx.unshift();
              } else {
                newDataIndexMap[key] = null;
              }
              this._update && this._update(idx, i);
            } else {
              this._remove && this._remove(i);
            }
          }
          for (var i = 0; i < newDataKeyArr.length; i++) {
            var key = newDataKeyArr[i];
            if (newDataIndexMap.hasOwnProperty(key)) {
              var idx = newDataIndexMap[key];
              if (idx == null) {
                continue;
              }
              if (!idx.length) {
                this._add && this._add(idx);
              } else {
                for (var j = 0,
                    len = idx.length; j < len; j++) {
                  this._add && this._add(idx[j]);
                }
              }
            }
          }
        }
      };
      function initIndexMap(arr, map, keyArr, keyGetter) {
        for (var i = 0; i < arr.length; i++) {
          var key = keyGetter(arr[i], i);
          var existence = map[key];
          if (existence == null) {
            keyArr.push(key);
            map[key] = i;
          } else {
            if (!existence.length) {
              map[key] = existence = [existence];
            }
            existence.push(i);
          }
        }
      }
      module.exports = DataDiffer;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var echarts = __webpack_require__(1);
      var PRIORITY = echarts.PRIORITY;
      __webpack_require__(101);
      __webpack_require__(104);
      echarts.registerVisual(zrUtil.curry(__webpack_require__(110), 'line', 'circle', 'line'));
      echarts.registerLayout(zrUtil.curry(__webpack_require__(111), 'line'));
      echarts.registerProcessor(PRIORITY.PROCESSOR.STATISTIC, zrUtil.curry(__webpack_require__(112), 'line'));
      __webpack_require__(113);
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var createListFromArray = __webpack_require__(102);
      var SeriesModel = __webpack_require__(28);
      module.exports = SeriesModel.extend({
        type: 'series.line',
        dependencies: ['grid', 'polar'],
        getInitialData: function(option, ecModel) {
          if (true) {
            var coordSys = option.coordinateSystem;
            if (coordSys !== 'polar' && coordSys !== 'cartesian2d') {
              throw new Error('Line not support coordinateSystem besides cartesian and polar');
            }
          }
          return createListFromArray(option.data, this, ecModel);
        },
        defaultOption: {
          zlevel: 0,
          z: 2,
          coordinateSystem: 'cartesian2d',
          legendHoverLink: true,
          hoverAnimation: true,
          clipOverflow: true,
          label: {normal: {position: 'top'}},
          lineStyle: {normal: {
              width: 2,
              type: 'solid'
            }},
          step: false,
          smooth: false,
          smoothMonotone: null,
          symbol: 'emptyCircle',
          symbolSize: 4,
          symbolRotate: null,
          showSymbol: true,
          showAllSymbol: false,
          connectNulls: false,
          sampling: 'none',
          animationEasing: 'linear',
          progressive: 0,
          hoverLayerThreshold: Infinity
        }
      });
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var List = __webpack_require__(98);
      var completeDimensions = __webpack_require__(103);
      var zrUtil = __webpack_require__(4);
      var modelUtil = __webpack_require__(5);
      var CoordinateSystem = __webpack_require__(26);
      var getDataItemValue = modelUtil.getDataItemValue;
      var converDataValue = modelUtil.converDataValue;
      function firstDataNotNull(data) {
        var i = 0;
        while (i < data.length && data[i] == null) {
          i++;
        }
        return data[i];
      }
      function ifNeedCompleteOrdinalData(data) {
        var sampleItem = firstDataNotNull(data);
        return sampleItem != null && !zrUtil.isArray(getDataItemValue(sampleItem));
      }
      function createListFromArray(data, seriesModel, ecModel) {
        data = data || [];
        if (true) {
          if (!zrUtil.isArray(data)) {
            throw new Error('Invalid data.');
          }
        }
        var coordSysName = seriesModel.get('coordinateSystem');
        var creator = creators[coordSysName];
        var registeredCoordSys = CoordinateSystem.get(coordSysName);
        var axesInfo = creator && creator(data, seriesModel, ecModel);
        var dimensions = axesInfo && axesInfo.dimensions;
        if (!dimensions) {
          dimensions = (registeredCoordSys && registeredCoordSys.dimensions) || ['x', 'y'];
          dimensions = completeDimensions(dimensions, data, dimensions.concat(['value']));
        }
        var categoryIndex = axesInfo ? axesInfo.categoryIndex : -1;
        var list = new List(dimensions, seriesModel);
        var nameList = createNameList(axesInfo, data);
        var categories = {};
        var dimValueGetter = (categoryIndex >= 0 && ifNeedCompleteOrdinalData(data)) ? function(itemOpt, dimName, dataIndex, dimIndex) {
          if (modelUtil.isDataItemOption(itemOpt)) {
            list.hasItemOption = true;
          }
          return dimIndex === categoryIndex ? dataIndex : converDataValue(getDataItemValue(itemOpt), dimensions[dimIndex]);
        } : function(itemOpt, dimName, dataIndex, dimIndex) {
          var value = getDataItemValue(itemOpt);
          var val = converDataValue(value && value[dimIndex], dimensions[dimIndex]);
          if (modelUtil.isDataItemOption(itemOpt)) {
            list.hasItemOption = true;
          }
          var categoryAxesModels = axesInfo && axesInfo.categoryAxesModels;
          if (categoryAxesModels && categoryAxesModels[dimName]) {
            if (typeof val === 'string') {
              categories[dimName] = categories[dimName] || categoryAxesModels[dimName].getCategories();
              val = zrUtil.indexOf(categories[dimName], val);
              if (val < 0 && !isNaN(val)) {
                val = +val;
              }
            }
          }
          return val;
        };
        list.hasItemOption = false;
        list.initData(data, nameList, dimValueGetter);
        return list;
      }
      function isStackable(axisType) {
        return axisType !== 'category' && axisType !== 'time';
      }
      function getDimTypeByAxis(axisType) {
        return axisType === 'category' ? 'ordinal' : axisType === 'time' ? 'time' : 'float';
      }
      var creators = {
        cartesian2d: function(data, seriesModel, ecModel) {
          var axesModels = zrUtil.map(['xAxis', 'yAxis'], function(name) {
            return ecModel.queryComponents({
              mainType: name,
              index: seriesModel.get(name + 'Index'),
              id: seriesModel.get(name + 'Id')
            })[0];
          });
          var xAxisModel = axesModels[0];
          var yAxisModel = axesModels[1];
          if (true) {
            if (!xAxisModel) {
              throw new Error('xAxis "' + zrUtil.retrieve(seriesModel.get('xAxisIndex'), seriesModel.get('xAxisId'), 0) + '" not found');
            }
            if (!yAxisModel) {
              throw new Error('yAxis "' + zrUtil.retrieve(seriesModel.get('xAxisIndex'), seriesModel.get('yAxisId'), 0) + '" not found');
            }
          }
          var xAxisType = xAxisModel.get('type');
          var yAxisType = yAxisModel.get('type');
          var dimensions = [{
            name: 'x',
            type: getDimTypeByAxis(xAxisType),
            stackable: isStackable(xAxisType)
          }, {
            name: 'y',
            type: getDimTypeByAxis(yAxisType),
            stackable: isStackable(yAxisType)
          }];
          var isXAxisCateogry = xAxisType === 'category';
          var isYAxisCategory = yAxisType === 'category';
          completeDimensions(dimensions, data, ['x', 'y', 'z']);
          var categoryAxesModels = {};
          if (isXAxisCateogry) {
            categoryAxesModels.x = xAxisModel;
          }
          if (isYAxisCategory) {
            categoryAxesModels.y = yAxisModel;
          }
          return {
            dimensions: dimensions,
            categoryIndex: isXAxisCateogry ? 0 : (isYAxisCategory ? 1 : -1),
            categoryAxesModels: categoryAxesModels
          };
        },
        singleAxis: function(data, seriesModel, ecModel) {
          var singleAxisModel = ecModel.queryComponents({
            mainType: 'singleAxis',
            index: seriesModel.get('singleAxisIndex'),
            id: seriesModel.get('singleAxisId')
          })[0];
          if (true) {
            if (!singleAxisModel) {
              throw new Error('singleAxis should be specified.');
            }
          }
          var singleAxisType = singleAxisModel.get('type');
          var isCategory = singleAxisType === 'category';
          var dimensions = [{
            name: 'single',
            type: getDimTypeByAxis(singleAxisType),
            stackable: isStackable(singleAxisType)
          }];
          completeDimensions(dimensions, data);
          var categoryAxesModels = {};
          if (isCategory) {
            categoryAxesModels.single = singleAxisModel;
          }
          return {
            dimensions: dimensions,
            categoryIndex: isCategory ? 0 : -1,
            categoryAxesModels: categoryAxesModels
          };
        },
        polar: function(data, seriesModel, ecModel) {
          var polarModel = ecModel.queryComponents({
            mainType: 'polar',
            index: seriesModel.get('polarIndex'),
            id: seriesModel.get('polarId')
          })[0];
          var angleAxisModel = polarModel.findAxisModel('angleAxis');
          var radiusAxisModel = polarModel.findAxisModel('radiusAxis');
          if (true) {
            if (!angleAxisModel) {
              throw new Error('angleAxis option not found');
            }
            if (!radiusAxisModel) {
              throw new Error('radiusAxis option not found');
            }
          }
          var radiusAxisType = radiusAxisModel.get('type');
          var angleAxisType = angleAxisModel.get('type');
          var dimensions = [{
            name: 'radius',
            type: getDimTypeByAxis(radiusAxisType),
            stackable: isStackable(radiusAxisType)
          }, {
            name: 'angle',
            type: getDimTypeByAxis(angleAxisType),
            stackable: isStackable(angleAxisType)
          }];
          var isAngleAxisCateogry = angleAxisType === 'category';
          var isRadiusAxisCateogry = radiusAxisType === 'category';
          completeDimensions(dimensions, data, ['radius', 'angle', 'value']);
          var categoryAxesModels = {};
          if (isRadiusAxisCateogry) {
            categoryAxesModels.radius = radiusAxisModel;
          }
          if (isAngleAxisCateogry) {
            categoryAxesModels.angle = angleAxisModel;
          }
          return {
            dimensions: dimensions,
            categoryIndex: isAngleAxisCateogry ? 1 : (isRadiusAxisCateogry ? 0 : -1),
            categoryAxesModels: categoryAxesModels
          };
        },
        geo: function(data, seriesModel, ecModel) {
          return {dimensions: completeDimensions([{name: 'lng'}, {name: 'lat'}], data, ['lng', 'lat', 'value'])};
        }
      };
      function createNameList(result, data) {
        var nameList = [];
        var categoryDim = result && result.dimensions[result.categoryIndex];
        var categoryAxisModel;
        if (categoryDim) {
          categoryAxisModel = result.categoryAxesModels[categoryDim.name];
        }
        if (categoryAxisModel) {
          var categories = categoryAxisModel.getCategories();
          if (categories) {
            var dataLen = data.length;
            if (zrUtil.isArray(data[0]) && data[0].length > 1) {
              nameList = [];
              for (var i = 0; i < dataLen; i++) {
                nameList[i] = categories[data[i][result.categoryIndex || 0]];
              }
            } else {
              nameList = categories.slice(0);
            }
          }
        }
        return nameList;
      }
      module.exports = createListFromArray;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      function completeDimensions(dimensions, data, defaultNames, extraPrefix) {
        if (!data) {
          return dimensions;
        }
        var value0 = retrieveValue(data[0]);
        var dimSize = zrUtil.isArray(value0) && value0.length || 1;
        defaultNames = defaultNames || [];
        extraPrefix = extraPrefix || 'extra';
        for (var i = 0; i < dimSize; i++) {
          if (!dimensions[i]) {
            var name = defaultNames[i] || (extraPrefix + (i - defaultNames.length));
            dimensions[i] = guessOrdinal(data, i) ? {
              type: 'ordinal',
              name: name
            } : name;
          }
        }
        return dimensions;
      }
      var guessOrdinal = completeDimensions.guessOrdinal = function(data, dimIndex) {
        for (var i = 0,
            len = data.length; i < len; i++) {
          var value = retrieveValue(data[i]);
          if (!zrUtil.isArray(value)) {
            return false;
          }
          var value = value[dimIndex];
          if (value != null && isFinite(value)) {
            return false;
          } else if (zrUtil.isString(value) && value !== '-') {
            return true;
          }
        }
        return false;
      };
      function retrieveValue(o) {
        return zrUtil.isArray(o) ? o : zrUtil.isObject(o) ? o.value : o;
      }
      module.exports = completeDimensions;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var SymbolDraw = __webpack_require__(105);
      var Symbol = __webpack_require__(106);
      var lineAnimationDiff = __webpack_require__(108);
      var graphic = __webpack_require__(43);
      var modelUtil = __webpack_require__(5);
      var polyHelper = __webpack_require__(109);
      var ChartView = __webpack_require__(42);
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
          if (true) {
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
    }, function(module, exports, __webpack_require__) {
      var graphic = __webpack_require__(43);
      var Symbol = __webpack_require__(106);
      function SymbolDraw(symbolCtor) {
        this.group = new graphic.Group();
        this._symbolCtor = symbolCtor || Symbol;
      }
      var symbolDrawProto = SymbolDraw.prototype;
      function symbolNeedsDraw(data, idx, isIgnore) {
        var point = data.getItemLayout(idx);
        return point && !isNaN(point[0]) && !isNaN(point[1]) && !(isIgnore && isIgnore(idx)) && data.getItemVisual(idx, 'symbol') !== 'none';
      }
      symbolDrawProto.updateData = function(data, isIgnore) {
        var group = this.group;
        var seriesModel = data.hostModel;
        var oldData = this._data;
        var SymbolCtor = this._symbolCtor;
        var seriesScope = {
          itemStyle: seriesModel.getModel('itemStyle.normal').getItemStyle(['color']),
          hoverItemStyle: seriesModel.getModel('itemStyle.emphasis').getItemStyle(),
          symbolRotate: seriesModel.get('symbolRotate'),
          symbolOffset: seriesModel.get('symbolOffset'),
          hoverAnimation: seriesModel.get('hoverAnimation'),
          labelModel: seriesModel.getModel('label.normal'),
          hoverLabelModel: seriesModel.getModel('label.emphasis')
        };
        data.diff(oldData).add(function(newIdx) {
          var point = data.getItemLayout(newIdx);
          if (symbolNeedsDraw(data, newIdx, isIgnore)) {
            var symbolEl = new SymbolCtor(data, newIdx, seriesScope);
            symbolEl.attr('position', point);
            data.setItemGraphicEl(newIdx, symbolEl);
            group.add(symbolEl);
          }
        }).update(function(newIdx, oldIdx) {
          var symbolEl = oldData.getItemGraphicEl(oldIdx);
          var point = data.getItemLayout(newIdx);
          if (!symbolNeedsDraw(data, newIdx, isIgnore)) {
            group.remove(symbolEl);
            return;
          }
          if (!symbolEl) {
            symbolEl = new SymbolCtor(data, newIdx);
            symbolEl.attr('position', point);
          } else {
            symbolEl.updateData(data, newIdx, seriesScope);
            graphic.updateProps(symbolEl, {position: point}, seriesModel);
          }
          group.add(symbolEl);
          data.setItemGraphicEl(newIdx, symbolEl);
        }).remove(function(oldIdx) {
          var el = oldData.getItemGraphicEl(oldIdx);
          el && el.fadeOut(function() {
            group.remove(el);
          });
        }).execute();
        this._data = data;
      };
      symbolDrawProto.updateLayout = function() {
        var data = this._data;
        if (data) {
          data.eachItemGraphicEl(function(el, idx) {
            var point = data.getItemLayout(idx);
            el.attr('position', point);
          });
        }
      };
      symbolDrawProto.remove = function(enableAnimation) {
        var group = this.group;
        var data = this._data;
        if (data) {
          if (enableAnimation) {
            data.eachItemGraphicEl(function(el) {
              el.fadeOut(function() {
                group.remove(el);
              });
            });
          } else {
            group.removeAll();
          }
        }
      };
      module.exports = SymbolDraw;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var symbolUtil = __webpack_require__(107);
      var graphic = __webpack_require__(43);
      var numberUtil = __webpack_require__(7);
      function getSymbolSize(data, idx) {
        var symbolSize = data.getItemVisual(idx, 'symbolSize');
        return symbolSize instanceof Array ? symbolSize.slice() : [+symbolSize, +symbolSize];
      }
      function getScale(symbolSize) {
        return [symbolSize[0] / 2, symbolSize[1] / 2];
      }
      function Symbol(data, idx, seriesScope) {
        graphic.Group.call(this);
        this.updateData(data, idx, seriesScope);
      }
      var symbolProto = Symbol.prototype;
      function driftSymbol(dx, dy) {
        this.parent.drift(dx, dy);
      }
      symbolProto._createSymbol = function(symbolType, data, idx, symbolSize) {
        this.removeAll();
        var seriesModel = data.hostModel;
        var color = data.getItemVisual(idx, 'color');
        var symbolPath = symbolUtil.createSymbol(symbolType, -1, -1, 2, 2, color);
        symbolPath.attr({
          z2: 100,
          culling: true,
          scale: [0, 0]
        });
        symbolPath.drift = driftSymbol;
        graphic.initProps(symbolPath, {scale: getScale(symbolSize)}, seriesModel, idx);
        this._symbolType = symbolType;
        this.add(symbolPath);
      };
      symbolProto.stopSymbolAnimation = function(toLastFrame) {
        this.childAt(0).stopAnimation(toLastFrame);
      };
      symbolProto.getSymbolPath = function() {
        return this.childAt(0);
      };
      symbolProto.getScale = function() {
        return this.childAt(0).scale;
      };
      symbolProto.highlight = function() {
        this.childAt(0).trigger('emphasis');
      };
      symbolProto.downplay = function() {
        this.childAt(0).trigger('normal');
      };
      symbolProto.setZ = function(zlevel, z) {
        var symbolPath = this.childAt(0);
        symbolPath.zlevel = zlevel;
        symbolPath.z = z;
      };
      symbolProto.setDraggable = function(draggable) {
        var symbolPath = this.childAt(0);
        symbolPath.draggable = draggable;
        symbolPath.cursor = draggable ? 'move' : 'pointer';
      };
      symbolProto.updateData = function(data, idx, seriesScope) {
        this.silent = false;
        var symbolType = data.getItemVisual(idx, 'symbol') || 'circle';
        var seriesModel = data.hostModel;
        var symbolSize = getSymbolSize(data, idx);
        if (symbolType !== this._symbolType) {
          this._createSymbol(symbolType, data, idx, symbolSize);
        } else {
          var symbolPath = this.childAt(0);
          graphic.updateProps(symbolPath, {scale: getScale(symbolSize)}, seriesModel, idx);
        }
        this._updateCommon(data, idx, symbolSize, seriesScope);
        this._seriesModel = seriesModel;
      };
      var normalStyleAccessPath = ['itemStyle', 'normal'];
      var emphasisStyleAccessPath = ['itemStyle', 'emphasis'];
      var normalLabelAccessPath = ['label', 'normal'];
      var emphasisLabelAccessPath = ['label', 'emphasis'];
      symbolProto._updateCommon = function(data, idx, symbolSize, seriesScope) {
        var symbolPath = this.childAt(0);
        var seriesModel = data.hostModel;
        var color = data.getItemVisual(idx, 'color');
        if (symbolPath.type !== 'image') {
          symbolPath.useStyle({strokeNoScale: true});
        }
        seriesScope = seriesScope || null;
        var itemStyle = seriesScope && seriesScope.itemStyle;
        var hoverItemStyle = seriesScope && seriesScope.hoverItemStyle;
        var symbolRotate = seriesScope && seriesScope.symbolRotate;
        var symbolOffset = seriesScope && seriesScope.symbolOffset;
        var labelModel = seriesScope && seriesScope.labelModel;
        var hoverLabelModel = seriesScope && seriesScope.hoverLabelModel;
        var hoverAnimation = seriesScope && seriesScope.hoverAnimation;
        if (!seriesScope || data.hasItemOption) {
          var itemModel = data.getItemModel(idx);
          itemStyle = itemModel.getModel(normalStyleAccessPath).getItemStyle(['color']);
          hoverItemStyle = itemModel.getModel(emphasisStyleAccessPath).getItemStyle();
          symbolRotate = itemModel.getShallow('symbolRotate');
          symbolOffset = itemModel.getShallow('symbolOffset');
          labelModel = itemModel.getModel(normalLabelAccessPath);
          hoverLabelModel = itemModel.getModel(emphasisLabelAccessPath);
          hoverAnimation = itemModel.getShallow('hoverAnimation');
        } else {
          hoverItemStyle = zrUtil.extend({}, hoverItemStyle);
        }
        var elStyle = symbolPath.style;
        symbolPath.attr('rotation', (symbolRotate || 0) * Math.PI / 180 || 0);
        if (symbolOffset) {
          symbolPath.attr('position', [numberUtil.parsePercent(symbolOffset[0], symbolSize[0]), numberUtil.parsePercent(symbolOffset[1], symbolSize[1])]);
        }
        symbolPath.setColor(color);
        symbolPath.setStyle(itemStyle);
        var opacity = data.getItemVisual(idx, 'opacity');
        if (opacity != null) {
          elStyle.opacity = opacity;
        }
        var dimensions = data.dimensions.slice();
        var valueDim;
        var dataType;
        while (dimensions.length && (valueDim = dimensions.pop(), dataType = data.getDimensionInfo(valueDim).type, dataType === 'ordinal' || dataType === 'time')) {}
        if (valueDim != null && labelModel.getShallow('show')) {
          graphic.setText(elStyle, labelModel, color);
          elStyle.text = zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'normal'), data.get(valueDim, idx));
        } else {
          elStyle.text = '';
        }
        if (valueDim != null && hoverLabelModel.getShallow('show')) {
          graphic.setText(hoverItemStyle, hoverLabelModel, color);
          hoverItemStyle.text = zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'emphasis'), data.get(valueDim, idx));
        } else {
          hoverItemStyle.text = '';
        }
        symbolPath.off('mouseover').off('mouseout').off('emphasis').off('normal');
        symbolPath.hoverStyle = hoverItemStyle;
        graphic.setHoverStyle(symbolPath);
        var scale = getScale(symbolSize);
        if (hoverAnimation && seriesModel.isAnimationEnabled()) {
          var onEmphasis = function() {
            var ratio = scale[1] / scale[0];
            this.animateTo({scale: [Math.max(scale[0] * 1.1, scale[0] + 3), Math.max(scale[1] * 1.1, scale[1] + 3 * ratio)]}, 400, 'elasticOut');
          };
          var onNormal = function() {
            this.animateTo({scale: scale}, 400, 'elasticOut');
          };
          symbolPath.on('mouseover', onEmphasis).on('mouseout', onNormal).on('emphasis', onEmphasis).on('normal', onNormal);
        }
      };
      symbolProto.fadeOut = function(cb) {
        var symbolPath = this.childAt(0);
        this.silent = true;
        symbolPath.style.text = '';
        graphic.updateProps(symbolPath, {scale: [0, 0]}, this._seriesModel, this.dataIndex, cb);
      };
      zrUtil.inherits(Symbol, graphic.Group);
      module.exports = Symbol;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var graphic = __webpack_require__(43);
      var BoundingRect = __webpack_require__(9);
      var Triangle = graphic.extendShape({
        type: 'triangle',
        shape: {
          cx: 0,
          cy: 0,
          width: 0,
          height: 0
        },
        buildPath: function(path, shape) {
          var cx = shape.cx;
          var cy = shape.cy;
          var width = shape.width / 2;
          var height = shape.height / 2;
          path.moveTo(cx, cy - height);
          path.lineTo(cx + width, cy + height);
          path.lineTo(cx - width, cy + height);
          path.closePath();
        }
      });
      var Diamond = graphic.extendShape({
        type: 'diamond',
        shape: {
          cx: 0,
          cy: 0,
          width: 0,
          height: 0
        },
        buildPath: function(path, shape) {
          var cx = shape.cx;
          var cy = shape.cy;
          var width = shape.width / 2;
          var height = shape.height / 2;
          path.moveTo(cx, cy - height);
          path.lineTo(cx + width, cy);
          path.lineTo(cx, cy + height);
          path.lineTo(cx - width, cy);
          path.closePath();
        }
      });
      var Pin = graphic.extendShape({
        type: 'pin',
        shape: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        },
        buildPath: function(path, shape) {
          var x = shape.x;
          var y = shape.y;
          var w = shape.width / 5 * 3;
          var h = Math.max(w, shape.height);
          var r = w / 2;
          var dy = r * r / (h - r);
          var cy = y - h + r + dy;
          var angle = Math.asin(dy / r);
          var dx = Math.cos(angle) * r;
          var tanX = Math.sin(angle);
          var tanY = Math.cos(angle);
          path.arc(x, cy, r, Math.PI - angle, Math.PI * 2 + angle);
          var cpLen = r * 0.6;
          var cpLen2 = r * 0.7;
          path.bezierCurveTo(x + dx - tanX * cpLen, cy + dy + tanY * cpLen, x, y - cpLen2, x, y);
          path.bezierCurveTo(x, y - cpLen2, x - dx + tanX * cpLen, cy + dy + tanY * cpLen, x - dx, cy + dy);
          path.closePath();
        }
      });
      var Arrow = graphic.extendShape({
        type: 'arrow',
        shape: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        },
        buildPath: function(ctx, shape) {
          var height = shape.height;
          var width = shape.width;
          var x = shape.x;
          var y = shape.y;
          var dx = width / 3 * 2;
          ctx.moveTo(x, y);
          ctx.lineTo(x + dx, y + height);
          ctx.lineTo(x, y + height / 4 * 3);
          ctx.lineTo(x - dx, y + height);
          ctx.lineTo(x, y);
          ctx.closePath();
        }
      });
      var symbolCtors = {
        line: graphic.Line,
        rect: graphic.Rect,
        roundRect: graphic.Rect,
        square: graphic.Rect,
        circle: graphic.Circle,
        diamond: Diamond,
        pin: Pin,
        arrow: Arrow,
        triangle: Triangle
      };
      var symbolShapeMakers = {
        line: function(x, y, w, h, shape) {
          shape.x1 = x;
          shape.y1 = y + h / 2;
          shape.x2 = x + w;
          shape.y2 = y + h / 2;
        },
        rect: function(x, y, w, h, shape) {
          shape.x = x;
          shape.y = y;
          shape.width = w;
          shape.height = h;
        },
        roundRect: function(x, y, w, h, shape) {
          shape.x = x;
          shape.y = y;
          shape.width = w;
          shape.height = h;
          shape.r = Math.min(w, h) / 4;
        },
        square: function(x, y, w, h, shape) {
          var size = Math.min(w, h);
          shape.x = x;
          shape.y = y;
          shape.width = size;
          shape.height = size;
        },
        circle: function(x, y, w, h, shape) {
          shape.cx = x + w / 2;
          shape.cy = y + h / 2;
          shape.r = Math.min(w, h) / 2;
        },
        diamond: function(x, y, w, h, shape) {
          shape.cx = x + w / 2;
          shape.cy = y + h / 2;
          shape.width = w;
          shape.height = h;
        },
        pin: function(x, y, w, h, shape) {
          shape.x = x + w / 2;
          shape.y = y + h / 2;
          shape.width = w;
          shape.height = h;
        },
        arrow: function(x, y, w, h, shape) {
          shape.x = x + w / 2;
          shape.y = y + h / 2;
          shape.width = w;
          shape.height = h;
        },
        triangle: function(x, y, w, h, shape) {
          shape.cx = x + w / 2;
          shape.cy = y + h / 2;
          shape.width = w;
          shape.height = h;
        }
      };
      var symbolBuildProxies = {};
      for (var name in symbolCtors) {
        if (symbolCtors.hasOwnProperty(name)) {
          symbolBuildProxies[name] = new symbolCtors[name]();
        }
      }
      var Symbol = graphic.extendShape({
        type: 'symbol',
        shape: {
          symbolType: '',
          x: 0,
          y: 0,
          width: 0,
          height: 0
        },
        beforeBrush: function() {
          var style = this.style;
          var shape = this.shape;
          if (shape.symbolType === 'pin' && style.textPosition === 'inside') {
            style.textPosition = ['50%', '40%'];
            style.textAlign = 'center';
            style.textVerticalAlign = 'middle';
          }
        },
        buildPath: function(ctx, shape, inBundle) {
          var symbolType = shape.symbolType;
          var proxySymbol = symbolBuildProxies[symbolType];
          if (shape.symbolType !== 'none') {
            if (!proxySymbol) {
              symbolType = 'rect';
              proxySymbol = symbolBuildProxies[symbolType];
            }
            symbolShapeMakers[symbolType](shape.x, shape.y, shape.width, shape.height, proxySymbol.shape);
            proxySymbol.buildPath(ctx, proxySymbol.shape, inBundle);
          }
        }
      });
      var symbolPathSetColor = function(color) {
        if (this.type !== 'image') {
          var symbolStyle = this.style;
          var symbolShape = this.shape;
          if (symbolShape && symbolShape.symbolType === 'line') {
            symbolStyle.stroke = color;
          } else if (this.__isEmptyBrush) {
            symbolStyle.stroke = color;
            symbolStyle.fill = '#fff';
          } else {
            symbolStyle.fill && (symbolStyle.fill = color);
            symbolStyle.stroke && (symbolStyle.stroke = color);
          }
          this.dirty(false);
        }
      };
      var symbolUtil = {createSymbol: function(symbolType, x, y, w, h, color) {
          var isEmpty = symbolType.indexOf('empty') === 0;
          if (isEmpty) {
            symbolType = symbolType.substr(5, 1).toLowerCase() + symbolType.substr(6);
          }
          var symbolPath;
          if (symbolType.indexOf('image://') === 0) {
            symbolPath = new graphic.Image({style: {
                image: symbolType.slice(8),
                x: x,
                y: y,
                width: w,
                height: h
              }});
          } else if (symbolType.indexOf('path://') === 0) {
            symbolPath = graphic.makePath(symbolType.slice(7), {}, new BoundingRect(x, y, w, h));
          } else {
            symbolPath = new Symbol({shape: {
                symbolType: symbolType,
                x: x,
                y: y,
                width: w,
                height: h
              }});
          }
          symbolPath.__isEmptyBrush = isEmpty;
          symbolPath.setColor = symbolPathSetColor;
          symbolPath.setColor(color);
          return symbolPath;
        }};
      module.exports = symbolUtil;
    }, function(module, exports) {
      function sign(val) {
        return val >= 0 ? 1 : -1;
      }
      function getStackedOnPoint(coordSys, data, idx) {
        var baseAxis = coordSys.getBaseAxis();
        var valueAxis = coordSys.getOtherAxis(baseAxis);
        var valueStart = baseAxis.onZero ? 0 : valueAxis.scale.getExtent()[0];
        var valueDim = valueAxis.dim;
        var baseDataOffset = valueDim === 'x' || valueDim === 'radius' ? 1 : 0;
        var stackedOnSameSign;
        var stackedOn = data.stackedOn;
        var val = data.get(valueDim, idx);
        while (stackedOn && sign(stackedOn.get(valueDim, idx)) === sign(val)) {
          stackedOnSameSign = stackedOn;
          break;
        }
        var stackedData = [];
        stackedData[baseDataOffset] = data.get(baseAxis.dim, idx);
        stackedData[1 - baseDataOffset] = stackedOnSameSign ? stackedOnSameSign.get(valueDim, idx, true) : valueStart;
        return coordSys.dataToPoint(stackedData);
      }
      function diffData(oldData, newData) {
        var diffResult = [];
        newData.diff(oldData).add(function(idx) {
          diffResult.push({
            cmd: '+',
            idx: idx
          });
        }).update(function(newIdx, oldIdx) {
          diffResult.push({
            cmd: '=',
            idx: oldIdx,
            idx1: newIdx
          });
        }).remove(function(idx) {
          diffResult.push({
            cmd: '-',
            idx: idx
          });
        }).execute();
        return diffResult;
      }
      module.exports = function(oldData, newData, oldStackedOnPoints, newStackedOnPoints, oldCoordSys, newCoordSys) {
        var diff = diffData(oldData, newData);
        var currPoints = [];
        var nextPoints = [];
        var currStackedPoints = [];
        var nextStackedPoints = [];
        var status = [];
        var sortedIndices = [];
        var rawIndices = [];
        var dims = newCoordSys.dimensions;
        for (var i = 0; i < diff.length; i++) {
          var diffItem = diff[i];
          var pointAdded = true;
          switch (diffItem.cmd) {
            case '=':
              var currentPt = oldData.getItemLayout(diffItem.idx);
              var nextPt = newData.getItemLayout(diffItem.idx1);
              if (isNaN(currentPt[0]) || isNaN(currentPt[1])) {
                currentPt = nextPt.slice();
              }
              currPoints.push(currentPt);
              nextPoints.push(nextPt);
              currStackedPoints.push(oldStackedOnPoints[diffItem.idx]);
              nextStackedPoints.push(newStackedOnPoints[diffItem.idx1]);
              rawIndices.push(newData.getRawIndex(diffItem.idx1));
              break;
            case '+':
              var idx = diffItem.idx;
              currPoints.push(oldCoordSys.dataToPoint([newData.get(dims[0], idx, true), newData.get(dims[1], idx, true)]));
              nextPoints.push(newData.getItemLayout(idx).slice());
              currStackedPoints.push(getStackedOnPoint(oldCoordSys, newData, idx));
              nextStackedPoints.push(newStackedOnPoints[idx]);
              rawIndices.push(newData.getRawIndex(idx));
              break;
            case '-':
              var idx = diffItem.idx;
              var rawIndex = oldData.getRawIndex(idx);
              if (rawIndex !== idx) {
                currPoints.push(oldData.getItemLayout(idx));
                nextPoints.push(newCoordSys.dataToPoint([oldData.get(dims[0], idx, true), oldData.get(dims[1], idx, true)]));
                currStackedPoints.push(oldStackedOnPoints[idx]);
                nextStackedPoints.push(getStackedOnPoint(newCoordSys, oldData, idx));
                rawIndices.push(rawIndex);
              } else {
                pointAdded = false;
              }
          }
          if (pointAdded) {
            status.push(diffItem);
            sortedIndices.push(sortedIndices.length);
          }
        }
        sortedIndices.sort(function(a, b) {
          return rawIndices[a] - rawIndices[b];
        });
        var sortedCurrPoints = [];
        var sortedNextPoints = [];
        var sortedCurrStackedPoints = [];
        var sortedNextStackedPoints = [];
        var sortedStatus = [];
        for (var i = 0; i < sortedIndices.length; i++) {
          var idx = sortedIndices[i];
          sortedCurrPoints[i] = currPoints[idx];
          sortedNextPoints[i] = nextPoints[idx];
          sortedCurrStackedPoints[i] = currStackedPoints[idx];
          sortedNextStackedPoints[i] = nextStackedPoints[idx];
          sortedStatus[i] = status[idx];
        }
        return {
          current: sortedCurrPoints,
          next: sortedNextPoints,
          stackedOnCurrent: sortedCurrStackedPoints,
          stackedOnNext: sortedNextStackedPoints,
          status: sortedStatus
        };
      };
    }, function(module, exports, __webpack_require__) {
      var Path = __webpack_require__(45);
      var vec2 = __webpack_require__(10);
      var vec2Min = vec2.min;
      var vec2Max = vec2.max;
      var scaleAndAdd = vec2.scaleAndAdd;
      var v2Copy = vec2.copy;
      var v = [];
      var cp0 = [];
      var cp1 = [];
      function isPointNull(p) {
        return isNaN(p[0]) || isNaN(p[1]);
      }
      function drawSegment(ctx, points, start, segLen, allLen, dir, smoothMin, smoothMax, smooth, smoothMonotone, connectNulls) {
        var prevIdx = 0;
        var idx = start;
        for (var k = 0; k < segLen; k++) {
          var p = points[idx];
          if (idx >= allLen || idx < 0) {
            break;
          }
          if (isPointNull(p)) {
            if (connectNulls) {
              idx += dir;
              continue;
            }
            break;
          }
          if (idx === start) {
            ctx[dir > 0 ? 'moveTo' : 'lineTo'](p[0], p[1]);
            v2Copy(cp0, p);
          } else {
            if (smooth > 0) {
              var nextIdx = idx + dir;
              var nextP = points[nextIdx];
              if (connectNulls) {
                while (nextP && isPointNull(points[nextIdx])) {
                  nextIdx += dir;
                  nextP = points[nextIdx];
                }
              }
              var ratioNextSeg = 0.5;
              var prevP = points[prevIdx];
              var nextP = points[nextIdx];
              if (!nextP || isPointNull(nextP)) {
                v2Copy(cp1, p);
              } else {
                if (isPointNull(nextP) && !connectNulls) {
                  nextP = p;
                }
                vec2.sub(v, nextP, prevP);
                var lenPrevSeg;
                var lenNextSeg;
                if (smoothMonotone === 'x' || smoothMonotone === 'y') {
                  var dim = smoothMonotone === 'x' ? 0 : 1;
                  lenPrevSeg = Math.abs(p[dim] - prevP[dim]);
                  lenNextSeg = Math.abs(p[dim] - nextP[dim]);
                } else {
                  lenPrevSeg = vec2.dist(p, prevP);
                  lenNextSeg = vec2.dist(p, nextP);
                }
                ratioNextSeg = lenNextSeg / (lenNextSeg + lenPrevSeg);
                scaleAndAdd(cp1, p, v, -smooth * (1 - ratioNextSeg));
              }
              vec2Min(cp0, cp0, smoothMax);
              vec2Max(cp0, cp0, smoothMin);
              vec2Min(cp1, cp1, smoothMax);
              vec2Max(cp1, cp1, smoothMin);
              ctx.bezierCurveTo(cp0[0], cp0[1], cp1[0], cp1[1], p[0], p[1]);
              scaleAndAdd(cp0, p, v, smooth * ratioNextSeg);
            } else {
              ctx.lineTo(p[0], p[1]);
            }
          }
          prevIdx = idx;
          idx += dir;
        }
        return k;
      }
      function getBoundingBox(points, smoothConstraint) {
        var ptMin = [Infinity, Infinity];
        var ptMax = [-Infinity, -Infinity];
        if (smoothConstraint) {
          for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            if (pt[0] < ptMin[0]) {
              ptMin[0] = pt[0];
            }
            if (pt[1] < ptMin[1]) {
              ptMin[1] = pt[1];
            }
            if (pt[0] > ptMax[0]) {
              ptMax[0] = pt[0];
            }
            if (pt[1] > ptMax[1]) {
              ptMax[1] = pt[1];
            }
          }
        }
        return {
          min: smoothConstraint ? ptMin : ptMax,
          max: smoothConstraint ? ptMax : ptMin
        };
      }
      module.exports = {
        Polyline: Path.extend({
          type: 'ec-polyline',
          shape: {
            points: [],
            smooth: 0,
            smoothConstraint: true,
            smoothMonotone: null,
            connectNulls: false
          },
          style: {
            fill: null,
            stroke: '#000'
          },
          buildPath: function(ctx, shape) {
            var points = shape.points;
            var i = 0;
            var len = points.length;
            var result = getBoundingBox(points, shape.smoothConstraint);
            if (shape.connectNulls) {
              for (; len > 0; len--) {
                if (!isPointNull(points[len - 1])) {
                  break;
                }
              }
              for (; i < len; i++) {
                if (!isPointNull(points[i])) {
                  break;
                }
              }
            }
            while (i < len) {
              i += drawSegment(ctx, points, i, len, len, 1, result.min, result.max, shape.smooth, shape.smoothMonotone, shape.connectNulls) + 1;
            }
          }
        }),
        Polygon: Path.extend({
          type: 'ec-polygon',
          shape: {
            points: [],
            stackedOnPoints: [],
            smooth: 0,
            stackedOnSmooth: 0,
            smoothConstraint: true,
            smoothMonotone: null,
            connectNulls: false
          },
          buildPath: function(ctx, shape) {
            var points = shape.points;
            var stackedOnPoints = shape.stackedOnPoints;
            var i = 0;
            var len = points.length;
            var smoothMonotone = shape.smoothMonotone;
            var bbox = getBoundingBox(points, shape.smoothConstraint);
            var stackedOnBBox = getBoundingBox(stackedOnPoints, shape.smoothConstraint);
            if (shape.connectNulls) {
              for (; len > 0; len--) {
                if (!isPointNull(points[len - 1])) {
                  break;
                }
              }
              for (; i < len; i++) {
                if (!isPointNull(points[i])) {
                  break;
                }
              }
            }
            while (i < len) {
              var k = drawSegment(ctx, points, i, len, len, 1, bbox.min, bbox.max, shape.smooth, smoothMonotone, shape.connectNulls);
              drawSegment(ctx, stackedOnPoints, i + k - 1, k, len, -1, stackedOnBBox.min, stackedOnBBox.max, shape.stackedOnSmooth, smoothMonotone, shape.connectNulls);
              i += k + 1;
              ctx.closePath();
            }
          }
        })
      };
    }, function(module, exports) {
      module.exports = function(seriesType, defaultSymbolType, legendSymbol, ecModel, api) {
        ecModel.eachRawSeriesByType(seriesType, function(seriesModel) {
          var data = seriesModel.getData();
          var symbolType = seriesModel.get('symbol') || defaultSymbolType;
          var symbolSize = seriesModel.get('symbolSize');
          data.setVisual({
            legendSymbol: legendSymbol || symbolType,
            symbol: symbolType,
            symbolSize: symbolSize
          });
          if (!ecModel.isSeriesFiltered(seriesModel)) {
            if (typeof symbolSize === 'function') {
              data.each(function(idx) {
                var rawValue = seriesModel.getRawValue(idx);
                var params = seriesModel.getDataParams(idx);
                data.setItemVisual(idx, 'symbolSize', symbolSize(rawValue, params));
              });
            }
            data.each(function(idx) {
              var itemModel = data.getItemModel(idx);
              var itemSymbolType = itemModel.getShallow('symbol', true);
              var itemSymbolSize = itemModel.getShallow('symbolSize', true);
              if (itemSymbolType != null) {
                data.setItemVisual(idx, 'symbol', itemSymbolType);
              }
              if (itemSymbolSize != null) {
                data.setItemVisual(idx, 'symbolSize', itemSymbolSize);
              }
            });
          }
        });
      };
    }, function(module, exports) {
      module.exports = function(seriesType, ecModel) {
        ecModel.eachSeriesByType(seriesType, function(seriesModel) {
          var data = seriesModel.getData();
          var coordSys = seriesModel.coordinateSystem;
          if (coordSys) {
            var dims = coordSys.dimensions;
            if (coordSys.type === 'singleAxis') {
              data.each(dims[0], function(x, idx) {
                data.setItemLayout(idx, isNaN(x) ? [NaN, NaN] : coordSys.dataToPoint(x));
              });
            } else {
              data.each(dims, function(x, y, idx) {
                data.setItemLayout(idx, (isNaN(x) || isNaN(y)) ? [NaN, NaN] : coordSys.dataToPoint([x, y]));
              }, true);
            }
          }
        });
      };
    }, function(module, exports) {
      var samplers = {
        average: function(frame) {
          var sum = 0;
          var count = 0;
          for (var i = 0; i < frame.length; i++) {
            if (!isNaN(frame[i])) {
              sum += frame[i];
              count++;
            }
          }
          return count === 0 ? NaN : sum / count;
        },
        sum: function(frame) {
          var sum = 0;
          for (var i = 0; i < frame.length; i++) {
            sum += frame[i] || 0;
          }
          return sum;
        },
        max: function(frame) {
          var max = -Infinity;
          for (var i = 0; i < frame.length; i++) {
            frame[i] > max && (max = frame[i]);
          }
          return max;
        },
        min: function(frame) {
          var min = Infinity;
          for (var i = 0; i < frame.length; i++) {
            frame[i] < min && (min = frame[i]);
          }
          return min;
        },
        nearest: function(frame) {
          return frame[0];
        }
      };
      var indexSampler = function(frame, value) {
        return Math.round(frame.length / 2);
      };
      module.exports = function(seriesType, ecModel, api) {
        ecModel.eachSeriesByType(seriesType, function(seriesModel) {
          var data = seriesModel.getData();
          var sampling = seriesModel.get('sampling');
          var coordSys = seriesModel.coordinateSystem;
          if (coordSys.type === 'cartesian2d' && sampling) {
            var baseAxis = coordSys.getBaseAxis();
            var valueAxis = coordSys.getOtherAxis(baseAxis);
            var extent = baseAxis.getExtent();
            var size = extent[1] - extent[0];
            var rate = Math.round(data.count() / size);
            if (rate > 1) {
              var sampler;
              if (typeof sampling === 'string') {
                sampler = samplers[sampling];
              } else if (typeof sampling === 'function') {
                sampler = sampling;
              }
              if (sampler) {
                data = data.downSample(valueAxis.dim, 1 / rate, sampler, indexSampler);
                seriesModel.setData(data);
              }
            }
          }
        }, this);
      };
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var graphic = __webpack_require__(43);
      var zrUtil = __webpack_require__(4);
      var echarts = __webpack_require__(1);
      __webpack_require__(114);
      __webpack_require__(131);
      echarts.extendComponentView({
        type: 'grid',
        render: function(gridModel, ecModel) {
          this.group.removeAll();
          if (gridModel.get('show')) {
            this.group.add(new graphic.Rect({
              shape: gridModel.coordinateSystem.getRect(),
              style: zrUtil.defaults({fill: gridModel.get('backgroundColor')}, gridModel.getItemStyle()),
              silent: true,
              z2: -1
            }));
          }
        }
      });
      echarts.registerPreprocessor(function(option) {
        if (option.xAxis && option.yAxis && !option.grid) {
          option.grid = {};
        }
      });
    }, function(module, exports, __webpack_require__) {
      var factory = exports;
      var layout = __webpack_require__(21);
      var axisHelper = __webpack_require__(115);
      var zrUtil = __webpack_require__(4);
      var Cartesian2D = __webpack_require__(121);
      var Axis2D = __webpack_require__(123);
      var each = zrUtil.each;
      var ifAxisCrossZero = axisHelper.ifAxisCrossZero;
      var niceScaleExtent = axisHelper.niceScaleExtent;
      __webpack_require__(126);
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
          if (true) {
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
          if (true) {
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
      __webpack_require__(26).register('cartesian2d', Grid);
      module.exports = Grid;
    }, function(module, exports, __webpack_require__) {
      var OrdinalScale = __webpack_require__(116);
      var IntervalScale = __webpack_require__(118);
      __webpack_require__(119);
      __webpack_require__(120);
      var Scale = __webpack_require__(117);
      var numberUtil = __webpack_require__(7);
      var zrUtil = __webpack_require__(4);
      var textContain = __webpack_require__(8);
      var axisHelper = {};
      axisHelper.getScaleExtent = function(axis, model) {
        var scale = axis.scale;
        var scaleType = scale.type;
        var min = model.getMin();
        var max = model.getMax();
        var fixMin = min != null;
        var fixMax = max != null;
        var originalExtent = scale.getExtent();
        var axisDataLen;
        var boundaryGap;
        var span;
        if (scaleType === 'ordinal') {
          axisDataLen = (model.get('data') || []).length;
        } else {
          boundaryGap = model.get('boundaryGap');
          if (!zrUtil.isArray(boundaryGap)) {
            boundaryGap = [boundaryGap || 0, boundaryGap || 0];
          }
          boundaryGap[0] = numberUtil.parsePercent(boundaryGap[0], 1);
          boundaryGap[1] = numberUtil.parsePercent(boundaryGap[1], 1);
          span = originalExtent[1] - originalExtent[0];
        }
        if (min == null) {
          min = scaleType === 'ordinal' ? (axisDataLen ? 0 : NaN) : originalExtent[0] - boundaryGap[0] * span;
        }
        if (max == null) {
          max = scaleType === 'ordinal' ? (axisDataLen ? axisDataLen - 1 : NaN) : originalExtent[1] + boundaryGap[1] * span;
        }
        if (min === 'dataMin') {
          min = originalExtent[0];
        }
        if (max === 'dataMax') {
          max = originalExtent[1];
        }
        (min == null || !isFinite(min)) && (min = NaN);
        (max == null || !isFinite(max)) && (max = NaN);
        axis.setBlank(zrUtil.eqNaN(min) || zrUtil.eqNaN(max));
        if (model.getNeedCrossZero()) {
          if (min > 0 && max > 0 && !fixMin) {
            min = 0;
          }
          if (min < 0 && max < 0 && !fixMax) {
            max = 0;
          }
        }
        return [min, max];
      };
      axisHelper.niceScaleExtent = function(axis, model) {
        var scale = axis.scale;
        var extent = axisHelper.getScaleExtent(axis, model);
        var fixMin = model.getMin() != null;
        var fixMax = model.getMax() != null;
        var splitNumber = model.get('splitNumber');
        if (scale.type === 'log') {
          scale.base = model.get('logBase');
        }
        scale.setExtent(extent[0], extent[1]);
        scale.niceExtent(splitNumber, fixMin, fixMax);
        var minInterval = model.get('minInterval');
        if (isFinite(minInterval) && !fixMin && !fixMax && scale.type === 'interval') {
          var interval = scale.getInterval();
          var intervalScale = Math.max(Math.abs(interval), minInterval) / interval;
          extent = scale.getExtent();
          var origin = (extent[1] + extent[0]) / 2;
          scale.setExtent(intervalScale * (extent[0] - origin) + origin, intervalScale * (extent[1] - origin) + origin);
          scale.niceExtent(splitNumber);
        }
        var interval = model.get('interval');
        if (interval != null) {
          scale.setInterval && scale.setInterval(interval);
        }
      };
      axisHelper.createScaleByModel = function(model, axisType) {
        axisType = axisType || model.get('type');
        if (axisType) {
          switch (axisType) {
            case 'category':
              return new OrdinalScale(model.getCategories(), [Infinity, -Infinity]);
            case 'value':
              return new IntervalScale();
            default:
              return (Scale.getClass(axisType) || IntervalScale).create(model);
          }
        }
      };
      axisHelper.ifAxisCrossZero = function(axis) {
        var dataExtent = axis.scale.getExtent();
        var min = dataExtent[0];
        var max = dataExtent[1];
        return !((min > 0 && max > 0) || (min < 0 && max < 0));
      };
      axisHelper.getAxisLabelInterval = function(tickCoords, labels, font, isAxisHorizontal) {
        var textSpaceTakenRect;
        var autoLabelInterval = 0;
        var accumulatedLabelInterval = 0;
        var step = 1;
        if (labels.length > 40) {
          step = Math.floor(labels.length / 40);
        }
        for (var i = 0; i < tickCoords.length; i += step) {
          var tickCoord = tickCoords[i];
          var rect = textContain.getBoundingRect(labels[i], font, 'center', 'top');
          rect[isAxisHorizontal ? 'x' : 'y'] += tickCoord;
          rect[isAxisHorizontal ? 'width' : 'height'] *= 1.3;
          if (!textSpaceTakenRect) {
            textSpaceTakenRect = rect.clone();
          } else if (textSpaceTakenRect.intersect(rect)) {
            accumulatedLabelInterval++;
            autoLabelInterval = Math.max(autoLabelInterval, accumulatedLabelInterval);
          } else {
            textSpaceTakenRect.union(rect);
            accumulatedLabelInterval = 0;
          }
        }
        if (autoLabelInterval === 0 && step > 1) {
          return step;
        }
        return (autoLabelInterval + 1) * step - 1;
      };
      axisHelper.getFormattedLabels = function(axis, labelFormatter) {
        var scale = axis.scale;
        var labels = scale.getTicksLabels();
        var ticks = scale.getTicks();
        if (typeof labelFormatter === 'string') {
          labelFormatter = (function(tpl) {
            return function(val) {
              return tpl.replace('{value}', val != null ? val : '');
            };
          })(labelFormatter);
          return zrUtil.map(labels, labelFormatter);
        } else if (typeof labelFormatter === 'function') {
          return zrUtil.map(ticks, function(tick, idx) {
            return labelFormatter(axis.type === 'category' ? scale.getLabel(tick) : tick, idx);
          }, this);
        } else {
          return labels;
        }
      };
      module.exports = axisHelper;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var Scale = __webpack_require__(117);
      var scaleProto = Scale.prototype;
      var OrdinalScale = Scale.extend({
        type: 'ordinal',
        init: function(data, extent) {
          this._data = data;
          this._extent = extent || [0, data.length - 1];
        },
        parse: function(val) {
          return typeof val === 'string' ? zrUtil.indexOf(this._data, val) : Math.round(val);
        },
        contain: function(rank) {
          rank = this.parse(rank);
          return scaleProto.contain.call(this, rank) && this._data[rank] != null;
        },
        normalize: function(val) {
          return scaleProto.normalize.call(this, this.parse(val));
        },
        scale: function(val) {
          return Math.round(scaleProto.scale.call(this, val));
        },
        getTicks: function() {
          var ticks = [];
          var extent = this._extent;
          var rank = extent[0];
          while (rank <= extent[1]) {
            ticks.push(rank);
            rank++;
          }
          return ticks;
        },
        getLabel: function(n) {
          return this._data[n];
        },
        count: function() {
          return this._extent[1] - this._extent[0] + 1;
        },
        unionExtentFromData: function(data, dim) {
          this.unionExtent(data.getDataExtent(dim, false));
        },
        niceTicks: zrUtil.noop,
        niceExtent: zrUtil.noop
      });
      OrdinalScale.create = function() {
        return new OrdinalScale();
      };
      module.exports = OrdinalScale;
    }, function(module, exports, __webpack_require__) {
      var clazzUtil = __webpack_require__(13);
      function Scale() {
        this._extent = [Infinity, -Infinity];
        this._interval = 0;
        this.init && this.init.apply(this, arguments);
      }
      var scaleProto = Scale.prototype;
      scaleProto.parse = function(val) {
        return val;
      };
      scaleProto.contain = function(val) {
        var extent = this._extent;
        return val >= extent[0] && val <= extent[1];
      };
      scaleProto.normalize = function(val) {
        var extent = this._extent;
        if (extent[1] === extent[0]) {
          return 0.5;
        }
        return (val - extent[0]) / (extent[1] - extent[0]);
      };
      scaleProto.scale = function(val) {
        var extent = this._extent;
        return val * (extent[1] - extent[0]) + extent[0];
      };
      scaleProto.unionExtent = function(other) {
        var extent = this._extent;
        other[0] < extent[0] && (extent[0] = other[0]);
        other[1] > extent[1] && (extent[1] = other[1]);
      };
      scaleProto.unionExtentFromData = function(data, dim) {
        this.unionExtent(data.getDataExtent(dim, true));
      };
      scaleProto.getExtent = function() {
        return this._extent.slice();
      };
      scaleProto.setExtent = function(start, end) {
        var thisExtent = this._extent;
        if (!isNaN(start)) {
          thisExtent[0] = start;
        }
        if (!isNaN(end)) {
          thisExtent[1] = end;
        }
      };
      scaleProto.getTicksLabels = function() {
        var labels = [];
        var ticks = this.getTicks();
        for (var i = 0; i < ticks.length; i++) {
          labels.push(this.getLabel(ticks[i]));
        }
        return labels;
      };
      clazzUtil.enableClassExtend(Scale);
      clazzUtil.enableClassManagement(Scale, {registerWhenExtend: true});
      module.exports = Scale;
    }, function(module, exports, __webpack_require__) {
      var numberUtil = __webpack_require__(7);
      var formatUtil = __webpack_require__(6);
      var Scale = __webpack_require__(117);
      var mathFloor = Math.floor;
      var mathCeil = Math.ceil;
      var getPrecisionSafe = numberUtil.getPrecisionSafe;
      var roundingErrorFix = numberUtil.round;
      var IntervalScale = Scale.extend({
        type: 'interval',
        _interval: 0,
        setExtent: function(start, end) {
          var thisExtent = this._extent;
          if (!isNaN(start)) {
            thisExtent[0] = parseFloat(start);
          }
          if (!isNaN(end)) {
            thisExtent[1] = parseFloat(end);
          }
        },
        unionExtent: function(other) {
          var extent = this._extent;
          other[0] < extent[0] && (extent[0] = other[0]);
          other[1] > extent[1] && (extent[1] = other[1]);
          IntervalScale.prototype.setExtent.call(this, extent[0], extent[1]);
        },
        getInterval: function() {
          if (!this._interval) {
            this.niceTicks();
          }
          return this._interval;
        },
        setInterval: function(interval) {
          this._interval = interval;
          this._niceExtent = this._extent.slice();
        },
        getTicks: function() {
          if (!this._interval) {
            this.niceTicks();
          }
          var interval = this._interval;
          var extent = this._extent;
          var ticks = [];
          var safeLimit = 10000;
          if (interval) {
            var niceExtent = this._niceExtent;
            var precision = getPrecisionSafe(interval) + 2;
            if (extent[0] < niceExtent[0]) {
              ticks.push(extent[0]);
            }
            var tick = niceExtent[0];
            while (tick <= niceExtent[1]) {
              ticks.push(tick);
              tick = roundingErrorFix(tick + interval, precision);
              if (ticks.length > safeLimit) {
                return [];
              }
            }
            if (extent[1] > (ticks.length ? ticks[ticks.length - 1] : niceExtent[1])) {
              ticks.push(extent[1]);
            }
          }
          return ticks;
        },
        getTicksLabels: function() {
          var labels = [];
          var ticks = this.getTicks();
          for (var i = 0; i < ticks.length; i++) {
            labels.push(this.getLabel(ticks[i]));
          }
          return labels;
        },
        getLabel: function(data) {
          return formatUtil.addCommas(data);
        },
        niceTicks: function(splitNumber) {
          splitNumber = splitNumber || 5;
          var extent = this._extent;
          var span = extent[1] - extent[0];
          if (!isFinite(span)) {
            return;
          }
          if (span < 0) {
            span = -span;
            extent.reverse();
          }
          var step = roundingErrorFix(numberUtil.nice(span / splitNumber, true), Math.max(getPrecisionSafe(extent[0]), getPrecisionSafe(extent[1])) + 2);
          var precision = getPrecisionSafe(step) + 2;
          var niceExtent = [roundingErrorFix(mathCeil(extent[0] / step) * step, precision), roundingErrorFix(mathFloor(extent[1] / step) * step, precision)];
          this._interval = step;
          this._niceExtent = niceExtent;
        },
        niceExtent: function(splitNumber, fixMin, fixMax) {
          var extent = this._extent;
          if (extent[0] === extent[1]) {
            if (extent[0] !== 0) {
              var expandSize = extent[0];
              if (!fixMax) {
                extent[1] += expandSize / 2;
                extent[0] -= expandSize / 2;
              } else {
                extent[0] -= expandSize / 2;
              }
            } else {
              extent[1] = 1;
            }
          }
          var span = extent[1] - extent[0];
          if (!isFinite(span)) {
            extent[0] = 0;
            extent[1] = 1;
          }
          this.niceTicks(splitNumber);
          var interval = this._interval;
          if (!fixMin) {
            extent[0] = roundingErrorFix(mathFloor(extent[0] / interval) * interval);
          }
          if (!fixMax) {
            extent[1] = roundingErrorFix(mathCeil(extent[1] / interval) * interval);
          }
        }
      });
      IntervalScale.create = function() {
        return new IntervalScale();
      };
      module.exports = IntervalScale;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var formatUtil = __webpack_require__(6);
      var IntervalScale = __webpack_require__(118);
      var intervalScaleProto = IntervalScale.prototype;
      var mathCeil = Math.ceil;
      var mathFloor = Math.floor;
      var ONE_SECOND = 1000;
      var ONE_MINUTE = ONE_SECOND * 60;
      var ONE_HOUR = ONE_MINUTE * 60;
      var ONE_DAY = ONE_HOUR * 24;
      var bisect = function(a, x, lo, hi) {
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (a[mid][2] < x) {
            lo = mid + 1;
          } else {
            hi = mid;
          }
        }
        return lo;
      };
      var TimeScale = IntervalScale.extend({
        type: 'time',
        getLabel: function(val) {
          var stepLvl = this._stepLvl;
          var date = new Date(val);
          return formatUtil.formatTime(stepLvl[0], date);
        },
        niceExtent: function(approxTickNum, fixMin, fixMax) {
          var extent = this._extent;
          if (extent[0] === extent[1]) {
            extent[0] -= ONE_DAY;
            extent[1] += ONE_DAY;
          }
          if (extent[1] === -Infinity && extent[0] === Infinity) {
            var d = new Date();
            extent[1] = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            extent[0] = extent[1] - ONE_DAY;
          }
          this.niceTicks(approxTickNum);
          var interval = this._interval;
          if (!fixMin) {
            extent[0] = numberUtil.round(mathFloor(extent[0] / interval) * interval);
          }
          if (!fixMax) {
            extent[1] = numberUtil.round(mathCeil(extent[1] / interval) * interval);
          }
        },
        niceTicks: function(approxTickNum) {
          approxTickNum = approxTickNum || 10;
          var extent = this._extent;
          var span = extent[1] - extent[0];
          var approxInterval = span / approxTickNum;
          var scaleLevelsLen = scaleLevels.length;
          var idx = bisect(scaleLevels, approxInterval, 0, scaleLevelsLen);
          var level = scaleLevels[Math.min(idx, scaleLevelsLen - 1)];
          var interval = level[2];
          if (level[0] === 'year') {
            var yearSpan = span / interval;
            var yearStep = numberUtil.nice(yearSpan / approxTickNum, true);
            interval *= yearStep;
          }
          var niceExtent = [mathCeil(extent[0] / interval) * interval, mathFloor(extent[1] / interval) * interval];
          this._stepLvl = level;
          this._interval = interval;
          this._niceExtent = niceExtent;
        },
        parse: function(val) {
          return +numberUtil.parseDate(val);
        }
      });
      zrUtil.each(['contain', 'normalize'], function(methodName) {
        TimeScale.prototype[methodName] = function(val) {
          return intervalScaleProto[methodName].call(this, this.parse(val));
        };
      });
      var scaleLevels = [['hh:mm:ss', 1, ONE_SECOND], ['hh:mm:ss', 5, ONE_SECOND * 5], ['hh:mm:ss', 10, ONE_SECOND * 10], ['hh:mm:ss', 15, ONE_SECOND * 15], ['hh:mm:ss', 30, ONE_SECOND * 30], ['hh:mm\nMM-dd', 1, ONE_MINUTE], ['hh:mm\nMM-dd', 5, ONE_MINUTE * 5], ['hh:mm\nMM-dd', 10, ONE_MINUTE * 10], ['hh:mm\nMM-dd', 15, ONE_MINUTE * 15], ['hh:mm\nMM-dd', 30, ONE_MINUTE * 30], ['hh:mm\nMM-dd', 1, ONE_HOUR], ['hh:mm\nMM-dd', 2, ONE_HOUR * 2], ['hh:mm\nMM-dd', 6, ONE_HOUR * 6], ['hh:mm\nMM-dd', 12, ONE_HOUR * 12], ['MM-dd\nyyyy', 1, ONE_DAY], ['week', 7, ONE_DAY * 7], ['month', 1, ONE_DAY * 31], ['quarter', 3, ONE_DAY * 380 / 4], ['half-year', 6, ONE_DAY * 380 / 2], ['year', 1, ONE_DAY * 380]];
      TimeScale.create = function() {
        return new TimeScale();
      };
      module.exports = TimeScale;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var Scale = __webpack_require__(117);
      var numberUtil = __webpack_require__(7);
      var IntervalScale = __webpack_require__(118);
      var scaleProto = Scale.prototype;
      var intervalScaleProto = IntervalScale.prototype;
      var getPrecisionSafe = numberUtil.getPrecisionSafe;
      var roundingErrorFix = numberUtil.round;
      var mathFloor = Math.floor;
      var mathCeil = Math.ceil;
      var mathPow = Math.pow;
      var mathLog = Math.log;
      var LogScale = Scale.extend({
        type: 'log',
        base: 10,
        $constructor: function() {
          Scale.apply(this, arguments);
          this._originalScale = new IntervalScale();
        },
        getTicks: function() {
          var originalScale = this._originalScale;
          var extent = this._extent;
          var originalExtent = originalScale.getExtent();
          return zrUtil.map(intervalScaleProto.getTicks.call(this), function(val) {
            var powVal = numberUtil.round(mathPow(this.base, val));
            powVal = (val === extent[0] && originalScale.__fixMin) ? fixRoundingError(powVal, originalExtent[0]) : powVal;
            powVal = (val === extent[1] && originalScale.__fixMax) ? fixRoundingError(powVal, originalExtent[1]) : powVal;
            return powVal;
          }, this);
        },
        getLabel: intervalScaleProto.getLabel,
        scale: function(val) {
          val = scaleProto.scale.call(this, val);
          return mathPow(this.base, val);
        },
        setExtent: function(start, end) {
          var base = this.base;
          start = mathLog(start) / mathLog(base);
          end = mathLog(end) / mathLog(base);
          intervalScaleProto.setExtent.call(this, start, end);
        },
        getExtent: function() {
          var base = this.base;
          var extent = scaleProto.getExtent.call(this);
          extent[0] = mathPow(base, extent[0]);
          extent[1] = mathPow(base, extent[1]);
          var originalScale = this._originalScale;
          var originalExtent = originalScale.getExtent();
          originalScale.__fixMin && (extent[0] = fixRoundingError(extent[0], originalExtent[0]));
          originalScale.__fixMax && (extent[1] = fixRoundingError(extent[1], originalExtent[1]));
          return extent;
        },
        unionExtent: function(extent) {
          this._originalScale.unionExtent(extent);
          var base = this.base;
          extent[0] = mathLog(extent[0]) / mathLog(base);
          extent[1] = mathLog(extent[1]) / mathLog(base);
          scaleProto.unionExtent.call(this, extent);
        },
        unionExtentFromData: function(data, dim) {
          this.unionExtent(data.getDataExtent(dim, true, function(val) {
            return val > 0;
          }));
        },
        niceTicks: function(approxTickNum) {
          approxTickNum = approxTickNum || 10;
          var extent = this._extent;
          var span = extent[1] - extent[0];
          if (span === Infinity || span <= 0) {
            return;
          }
          var interval = numberUtil.quantity(span);
          var err = approxTickNum / span * interval;
          if (err <= 0.5) {
            interval *= 10;
          }
          while (!isNaN(interval) && Math.abs(interval) < 1 && Math.abs(interval) > 0) {
            interval *= 10;
          }
          var niceExtent = [numberUtil.round(mathCeil(extent[0] / interval) * interval), numberUtil.round(mathFloor(extent[1] / interval) * interval)];
          this._interval = interval;
          this._niceExtent = niceExtent;
        },
        niceExtent: function(splitNumber, fixMin, fixMax) {
          intervalScaleProto.niceExtent.call(this, splitNumber, fixMin, fixMax);
          var originalScale = this._originalScale;
          originalScale.__fixMin = fixMin;
          originalScale.__fixMax = fixMax;
        }
      });
      zrUtil.each(['contain', 'normalize'], function(methodName) {
        LogScale.prototype[methodName] = function(val) {
          val = mathLog(val) / mathLog(this.base);
          return scaleProto[methodName].call(this, val);
        };
      });
      LogScale.create = function() {
        return new LogScale();
      };
      function fixRoundingError(val, originalVal) {
        return roundingErrorFix(val, getPrecisionSafe(originalVal));
      }
      module.exports = LogScale;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var Cartesian = __webpack_require__(122);
      function Cartesian2D(name) {
        Cartesian.call(this, name);
      }
      Cartesian2D.prototype = {
        constructor: Cartesian2D,
        type: 'cartesian2d',
        dimensions: ['x', 'y'],
        getBaseAxis: function() {
          return this.getAxesByScale('ordinal')[0] || this.getAxesByScale('time')[0] || this.getAxis('x');
        },
        containPoint: function(point) {
          var axisX = this.getAxis('x');
          var axisY = this.getAxis('y');
          return axisX.contain(axisX.toLocalCoord(point[0])) && axisY.contain(axisY.toLocalCoord(point[1]));
        },
        containData: function(data) {
          return this.getAxis('x').containData(data[0]) && this.getAxis('y').containData(data[1]);
        },
        dataToPoints: function(data, stack) {
          return data.mapArray(['x', 'y'], function(x, y) {
            return this.dataToPoint([x, y]);
          }, stack, this);
        },
        dataToPoint: function(data, clamp) {
          var xAxis = this.getAxis('x');
          var yAxis = this.getAxis('y');
          return [xAxis.toGlobalCoord(xAxis.dataToCoord(data[0], clamp)), yAxis.toGlobalCoord(yAxis.dataToCoord(data[1], clamp))];
        },
        pointToData: function(point, clamp) {
          var xAxis = this.getAxis('x');
          var yAxis = this.getAxis('y');
          return [xAxis.coordToData(xAxis.toLocalCoord(point[0]), clamp), yAxis.coordToData(yAxis.toLocalCoord(point[1]), clamp)];
        },
        getOtherAxis: function(axis) {
          return this.getAxis(axis.dim === 'x' ? 'y' : 'x');
        }
      };
      zrUtil.inherits(Cartesian2D, Cartesian);
      module.exports = Cartesian2D;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      function dimAxisMapper(dim) {
        return this._axes[dim];
      }
      var Cartesian = function(name) {
        this._axes = {};
        this._dimList = [];
        this.name = name || '';
      };
      Cartesian.prototype = {
        constructor: Cartesian,
        type: 'cartesian',
        getAxis: function(dim) {
          return this._axes[dim];
        },
        getAxes: function() {
          return zrUtil.map(this._dimList, dimAxisMapper, this);
        },
        getAxesByScale: function(scaleType) {
          scaleType = scaleType.toLowerCase();
          return zrUtil.filter(this.getAxes(), function(axis) {
            return axis.scale.type === scaleType;
          });
        },
        addAxis: function(axis) {
          var dim = axis.dim;
          this._axes[dim] = axis;
          this._dimList.push(dim);
        },
        dataToCoord: function(val) {
          return this._dataCoordConvert(val, 'dataToCoord');
        },
        coordToData: function(val) {
          return this._dataCoordConvert(val, 'coordToData');
        },
        _dataCoordConvert: function(input, method) {
          var dimList = this._dimList;
          var output = input instanceof Array ? [] : {};
          for (var i = 0; i < dimList.length; i++) {
            var dim = dimList[i];
            var axis = this._axes[dim];
            output[dim] = axis[method](input[dim]);
          }
          return output;
        }
      };
      module.exports = Cartesian;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var Axis = __webpack_require__(124);
      var axisLabelInterval = __webpack_require__(125);
      var Axis2D = function(dim, scale, coordExtent, axisType, position) {
        Axis.call(this, dim, scale, coordExtent);
        this.type = axisType || 'value';
        this.position = position || 'bottom';
      };
      Axis2D.prototype = {
        constructor: Axis2D,
        index: 0,
        onZero: false,
        model: null,
        isHorizontal: function() {
          var position = this.position;
          return position === 'top' || position === 'bottom';
        },
        getGlobalExtent: function() {
          var ret = this.getExtent();
          ret[0] = this.toGlobalCoord(ret[0]);
          ret[1] = this.toGlobalCoord(ret[1]);
          return ret;
        },
        getLabelInterval: function() {
          var labelInterval = this._labelInterval;
          if (!labelInterval) {
            labelInterval = this._labelInterval = axisLabelInterval(this);
          }
          return labelInterval;
        },
        isLabelIgnored: function(idx) {
          if (this.type === 'category') {
            var labelInterval = this.getLabelInterval();
            return ((typeof labelInterval === 'function') && !labelInterval(idx, this.scale.getLabel(idx))) || idx % (labelInterval + 1);
          }
        },
        toLocalCoord: null,
        toGlobalCoord: null
      };
      zrUtil.inherits(Axis2D, Axis);
      module.exports = Axis2D;
    }, function(module, exports, __webpack_require__) {
      var numberUtil = __webpack_require__(7);
      var linearMap = numberUtil.linearMap;
      var zrUtil = __webpack_require__(4);
      function fixExtentWithBands(extent, nTick) {
        var size = extent[1] - extent[0];
        var len = nTick;
        var margin = size / len / 2;
        extent[0] += margin;
        extent[1] -= margin;
      }
      var normalizedExtent = [0, 1];
      var Axis = function(dim, scale, extent) {
        this.dim = dim;
        this.scale = scale;
        this._extent = extent || [0, 0];
        this.inverse = false;
        this.onBand = false;
      };
      Axis.prototype = {
        constructor: Axis,
        contain: function(coord) {
          var extent = this._extent;
          var min = Math.min(extent[0], extent[1]);
          var max = Math.max(extent[0], extent[1]);
          return coord >= min && coord <= max;
        },
        containData: function(data) {
          return this.contain(this.dataToCoord(data));
        },
        getExtent: function() {
          var ret = this._extent.slice();
          return ret;
        },
        getPixelPrecision: function(dataExtent) {
          return numberUtil.getPixelPrecision(dataExtent || this.scale.getExtent(), this._extent);
        },
        setExtent: function(start, end) {
          var extent = this._extent;
          extent[0] = start;
          extent[1] = end;
        },
        dataToCoord: function(data, clamp) {
          var extent = this._extent;
          var scale = this.scale;
          data = scale.normalize(data);
          if (this.onBand && scale.type === 'ordinal') {
            extent = extent.slice();
            fixExtentWithBands(extent, scale.count());
          }
          return linearMap(data, normalizedExtent, extent, clamp);
        },
        coordToData: function(coord, clamp) {
          var extent = this._extent;
          var scale = this.scale;
          if (this.onBand && scale.type === 'ordinal') {
            extent = extent.slice();
            fixExtentWithBands(extent, scale.count());
          }
          var t = linearMap(coord, extent, normalizedExtent, clamp);
          return this.scale.scale(t);
        },
        getTicksCoords: function(alignWithLabel) {
          if (this.onBand && !alignWithLabel) {
            var bands = this.getBands();
            var coords = [];
            for (var i = 0; i < bands.length; i++) {
              coords.push(bands[i][0]);
            }
            if (bands[i - 1]) {
              coords.push(bands[i - 1][1]);
            }
            return coords;
          } else {
            return zrUtil.map(this.scale.getTicks(), this.dataToCoord, this);
          }
        },
        getLabelsCoords: function() {
          return zrUtil.map(this.scale.getTicks(), this.dataToCoord, this);
        },
        getBands: function() {
          var extent = this.getExtent();
          var bands = [];
          var len = this.scale.count();
          var start = extent[0];
          var end = extent[1];
          var span = end - start;
          for (var i = 0; i < len; i++) {
            bands.push([span * i / len + start, span * (i + 1) / len + start]);
          }
          return bands;
        },
        getBandWidth: function() {
          var axisExtent = this._extent;
          var dataExtent = this.scale.getExtent();
          var len = dataExtent[1] - dataExtent[0] + (this.onBand ? 1 : 0);
          len === 0 && (len = 1);
          var size = Math.abs(axisExtent[1] - axisExtent[0]);
          return Math.abs(size) / len;
        },
        isBlank: function() {
          return this._isBlank;
        },
        setBlank: function(isBlank) {
          this._isBlank = isBlank;
        }
      };
      module.exports = Axis;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var axisHelper = __webpack_require__(115);
      module.exports = function(axis) {
        var axisModel = axis.model;
        var labelModel = axisModel.getModel('axisLabel');
        var labelInterval = labelModel.get('interval');
        if (!(axis.type === 'category' && labelInterval === 'auto')) {
          return labelInterval === 'auto' ? 0 : labelInterval;
        }
        return axisHelper.getAxisLabelInterval(zrUtil.map(axis.scale.getTicks(), axis.dataToCoord, axis), axisModel.getFormattedLabels(), labelModel.getModel('textStyle').getFont(), axis.isHorizontal());
      };
    }, function(module, exports, __webpack_require__) {
      'use strict';
      __webpack_require__(127);
      var ComponentModel = __webpack_require__(19);
      module.exports = ComponentModel.extend({
        type: 'grid',
        dependencies: ['xAxis', 'yAxis'],
        layoutMode: 'box',
        coordinateSystem: null,
        defaultOption: {
          show: false,
          zlevel: 0,
          z: 0,
          left: '10%',
          top: 60,
          right: '10%',
          bottom: 60,
          containLabel: false,
          backgroundColor: 'rgba(0,0,0,0)',
          borderWidth: 1,
          borderColor: '#ccc'
        }
      });
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var ComponentModel = __webpack_require__(19);
      var zrUtil = __webpack_require__(4);
      var axisModelCreator = __webpack_require__(128);
      var AxisModel = ComponentModel.extend({
        type: 'cartesian2dAxis',
        axis: null,
        init: function() {
          AxisModel.superApply(this, 'init', arguments);
          this.resetRange();
        },
        mergeOption: function() {
          AxisModel.superApply(this, 'mergeOption', arguments);
          this.resetRange();
        },
        restoreData: function() {
          AxisModel.superApply(this, 'restoreData', arguments);
          this.resetRange();
        },
        getCoordSysModel: function() {
          return this.ecModel.queryComponents({
            mainType: 'grid',
            index: this.option.gridIndex,
            id: this.option.gridId
          })[0];
        }
      });
      function getAxisType(axisDim, option) {
        return option.type || (option.data ? 'category' : 'value');
      }
      zrUtil.merge(AxisModel.prototype, __webpack_require__(130));
      var extraOption = {offset: 0};
      axisModelCreator('x', AxisModel, getAxisType, extraOption);
      axisModelCreator('y', AxisModel, getAxisType, extraOption);
      module.exports = AxisModel;
    }, function(module, exports, __webpack_require__) {
      var axisDefault = __webpack_require__(129);
      var zrUtil = __webpack_require__(4);
      var ComponentModel = __webpack_require__(19);
      var layout = __webpack_require__(21);
      var AXIS_TYPES = ['value', 'category', 'time', 'log'];
      module.exports = function(axisName, BaseAxisModelClass, axisTypeDefaulter, extraDefaultOption) {
        zrUtil.each(AXIS_TYPES, function(axisType) {
          BaseAxisModelClass.extend({
            type: axisName + 'Axis.' + axisType,
            mergeDefaultAndTheme: function(option, ecModel) {
              var layoutMode = this.layoutMode;
              var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
              var themeModel = ecModel.getTheme();
              zrUtil.merge(option, themeModel.get(axisType + 'Axis'));
              zrUtil.merge(option, this.getDefaultOption());
              option.type = axisTypeDefaulter(axisName, option);
              if (layoutMode) {
                layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
              }
            },
            defaultOption: zrUtil.mergeAll([{}, axisDefault[axisType + 'Axis'], extraDefaultOption], true)
          });
        });
        ComponentModel.registerSubTypeDefaulter(axisName + 'Axis', zrUtil.curry(axisTypeDefaulter, axisName));
      };
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var defaultOption = {
        show: true,
        zlevel: 0,
        z: 0,
        inverse: false,
        name: '',
        nameLocation: 'end',
        nameRotate: null,
        nameTruncate: {
          maxWidth: null,
          ellipsis: '...',
          placeholder: '.'
        },
        nameTextStyle: {},
        nameGap: 15,
        silent: false,
        triggerEvent: false,
        tooltip: {show: false},
        axisLine: {
          show: true,
          onZero: true,
          lineStyle: {
            color: '#333',
            width: 1,
            type: 'solid'
          }
        },
        axisTick: {
          show: true,
          inside: false,
          length: 5,
          lineStyle: {width: 1}
        },
        axisLabel: {
          show: true,
          inside: false,
          rotate: 0,
          margin: 8,
          textStyle: {fontSize: 12}
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: ['#ccc'],
            width: 1,
            type: 'solid'
          }
        },
        splitArea: {
          show: false,
          areaStyle: {color: ['rgba(250,250,250,0.3)', 'rgba(200,200,200,0.3)']}
        }
      };
      var categoryAxis = zrUtil.merge({
        boundaryGap: true,
        splitLine: {show: false},
        axisTick: {
          alignWithLabel: false,
          interval: 'auto'
        },
        axisLabel: {interval: 'auto'}
      }, defaultOption);
      var valueAxis = zrUtil.merge({
        boundaryGap: [0, 0],
        splitNumber: 5
      }, defaultOption);
      var timeAxis = zrUtil.defaults({
        scale: true,
        min: 'dataMin',
        max: 'dataMax'
      }, valueAxis);
      var logAxis = zrUtil.defaults({logBase: 10}, valueAxis);
      logAxis.scale = true;
      module.exports = {
        categoryAxis: categoryAxis,
        valueAxis: valueAxis,
        timeAxis: timeAxis,
        logAxis: logAxis
      };
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var axisHelper = __webpack_require__(115);
      function getName(obj) {
        if (zrUtil.isObject(obj) && obj.value != null) {
          return obj.value;
        } else {
          return obj;
        }
      }
      module.exports = {
        getFormattedLabels: function() {
          return axisHelper.getFormattedLabels(this.axis, this.get('axisLabel.formatter'));
        },
        getCategories: function() {
          return this.get('type') === 'category' && zrUtil.map(this.get('data'), getName);
        },
        getMin: function(origin) {
          var option = this.option;
          var min = (!origin && option.rangeStart != null) ? option.rangeStart : option.min;
          if (min != null && min !== 'dataMin' && !zrUtil.eqNaN(min)) {
            min = this.axis.scale.parse(min);
          }
          return min;
        },
        getMax: function(origin) {
          var option = this.option;
          var max = (!origin && option.rangeEnd != null) ? option.rangeEnd : option.max;
          if (max != null && max !== 'dataMax' && !zrUtil.eqNaN(max)) {
            max = this.axis.scale.parse(max);
          }
          return max;
        },
        getNeedCrossZero: function() {
          var option = this.option;
          return (option.rangeStart != null || option.rangeEnd != null) ? false : !option.scale;
        },
        getCoordSysModel: zrUtil.noop,
        setRange: function(rangeStart, rangeEnd) {
          this.option.rangeStart = rangeStart;
          this.option.rangeEnd = rangeEnd;
        },
        resetRange: function() {
          this.option.rangeStart = this.option.rangeEnd = null;
        }
      };
    }, function(module, exports, __webpack_require__) {
      'use strict';
      __webpack_require__(127);
      __webpack_require__(132);
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var graphic = __webpack_require__(43);
      var AxisBuilder = __webpack_require__(133);
      var ifIgnoreOnTick = AxisBuilder.ifIgnoreOnTick;
      var getInterval = AxisBuilder.getInterval;
      var axisBuilderAttrs = ['axisLine', 'axisLabel', 'axisTick', 'axisName'];
      var selfBuilderAttrs = ['splitArea', 'splitLine'];
      var AxisView = __webpack_require__(1).extendComponentView({
        type: 'axis',
        render: function(axisModel, ecModel) {
          this.group.removeAll();
          var oldAxisGroup = this._axisGroup;
          this._axisGroup = new graphic.Group();
          this.group.add(this._axisGroup);
          if (!axisModel.get('show')) {
            return;
          }
          var gridModel = axisModel.getCoordSysModel();
          var layout = layoutAxis(gridModel, axisModel);
          var axisBuilder = new AxisBuilder(axisModel, layout);
          zrUtil.each(axisBuilderAttrs, axisBuilder.add, axisBuilder);
          this._axisGroup.add(axisBuilder.getGroup());
          zrUtil.each(selfBuilderAttrs, function(name) {
            if (axisModel.get(name + '.show')) {
              this['_' + name](axisModel, gridModel, layout.labelInterval);
            }
          }, this);
          graphic.groupTransition(oldAxisGroup, this._axisGroup, axisModel);
        },
        _splitLine: function(axisModel, gridModel, labelInterval) {
          var axis = axisModel.axis;
          if (axis.isBlank()) {
            return;
          }
          var splitLineModel = axisModel.getModel('splitLine');
          var lineStyleModel = splitLineModel.getModel('lineStyle');
          var lineColors = lineStyleModel.get('color');
          var lineInterval = getInterval(splitLineModel, labelInterval);
          lineColors = zrUtil.isArray(lineColors) ? lineColors : [lineColors];
          var gridRect = gridModel.coordinateSystem.getRect();
          var isHorizontal = axis.isHorizontal();
          var lineCount = 0;
          var ticksCoords = axis.getTicksCoords();
          var ticks = axis.scale.getTicks();
          var p1 = [];
          var p2 = [];
          var lineStyle = lineStyleModel.getLineStyle();
          for (var i = 0; i < ticksCoords.length; i++) {
            if (ifIgnoreOnTick(axis, i, lineInterval)) {
              continue;
            }
            var tickCoord = axis.toGlobalCoord(ticksCoords[i]);
            if (isHorizontal) {
              p1[0] = tickCoord;
              p1[1] = gridRect.y;
              p2[0] = tickCoord;
              p2[1] = gridRect.y + gridRect.height;
            } else {
              p1[0] = gridRect.x;
              p1[1] = tickCoord;
              p2[0] = gridRect.x + gridRect.width;
              p2[1] = tickCoord;
            }
            var colorIndex = (lineCount++) % lineColors.length;
            this._axisGroup.add(new graphic.Line(graphic.subPixelOptimizeLine({
              anid: 'line_' + ticks[i],
              shape: {
                x1: p1[0],
                y1: p1[1],
                x2: p2[0],
                y2: p2[1]
              },
              style: zrUtil.defaults({stroke: lineColors[colorIndex]}, lineStyle),
              silent: true
            })));
          }
        },
        _splitArea: function(axisModel, gridModel, labelInterval) {
          var axis = axisModel.axis;
          if (axis.isBlank()) {
            return;
          }
          var splitAreaModel = axisModel.getModel('splitArea');
          var areaStyleModel = splitAreaModel.getModel('areaStyle');
          var areaColors = areaStyleModel.get('color');
          var gridRect = gridModel.coordinateSystem.getRect();
          var ticksCoords = axis.getTicksCoords();
          var ticks = axis.scale.getTicks();
          var prevX = axis.toGlobalCoord(ticksCoords[0]);
          var prevY = axis.toGlobalCoord(ticksCoords[0]);
          var count = 0;
          var areaInterval = getInterval(splitAreaModel, labelInterval);
          var areaStyle = areaStyleModel.getAreaStyle();
          areaColors = zrUtil.isArray(areaColors) ? areaColors : [areaColors];
          for (var i = 1; i < ticksCoords.length; i++) {
            if (ifIgnoreOnTick(axis, i, areaInterval)) {
              continue;
            }
            var tickCoord = axis.toGlobalCoord(ticksCoords[i]);
            var x;
            var y;
            var width;
            var height;
            if (axis.isHorizontal()) {
              x = prevX;
              y = gridRect.y;
              width = tickCoord - x;
              height = gridRect.height;
            } else {
              x = gridRect.x;
              y = prevY;
              width = gridRect.width;
              height = tickCoord - y;
            }
            var colorIndex = (count++) % areaColors.length;
            this._axisGroup.add(new graphic.Rect({
              anid: 'area_' + ticks[i],
              shape: {
                x: x,
                y: y,
                width: width,
                height: height
              },
              style: zrUtil.defaults({fill: areaColors[colorIndex]}, areaStyle),
              silent: true
            }));
            prevX = x + width;
            prevY = y + height;
          }
        }
      });
      AxisView.extend({type: 'xAxis'});
      AxisView.extend({type: 'yAxis'});
      function layoutAxis(gridModel, axisModel) {
        var grid = gridModel.coordinateSystem;
        var axis = axisModel.axis;
        var layout = {};
        var rawAxisPosition = axis.position;
        var axisPosition = axis.onZero ? 'onZero' : rawAxisPosition;
        var axisDim = axis.dim;
        var rect = grid.getRect();
        var rectBound = [rect.x, rect.x + rect.width, rect.y, rect.y + rect.height];
        var axisOffset = axisModel.get('offset') || 0;
        var posMap = {
          x: {
            top: rectBound[2] - axisOffset,
            bottom: rectBound[3] + axisOffset
          },
          y: {
            left: rectBound[0] - axisOffset,
            right: rectBound[1] + axisOffset
          }
        };
        posMap.x.onZero = Math.max(Math.min(getZero('y'), posMap.x.bottom), posMap.x.top);
        posMap.y.onZero = Math.max(Math.min(getZero('x'), posMap.y.right), posMap.y.left);
        function getZero(dim, val) {
          var theAxis = grid.getAxis(dim);
          return theAxis.toGlobalCoord(theAxis.dataToCoord(0));
        }
        layout.position = [axisDim === 'y' ? posMap.y[axisPosition] : rectBound[0], axisDim === 'x' ? posMap.x[axisPosition] : rectBound[3]];
        layout.rotation = Math.PI / 2 * (axisDim === 'x' ? 0 : 1);
        var dirMap = {
          top: -1,
          bottom: 1,
          left: -1,
          right: 1
        };
        layout.labelDirection = layout.tickDirection = layout.nameDirection = dirMap[rawAxisPosition];
        if (axis.onZero) {
          layout.labelOffset = posMap[axisDim][rawAxisPosition] - posMap[axisDim].onZero;
        }
        if (axisModel.getModel('axisTick').get('inside')) {
          layout.tickDirection = -layout.tickDirection;
        }
        if (axisModel.getModel('axisLabel').get('inside')) {
          layout.labelDirection = -layout.labelDirection;
        }
        var labelRotation = axisModel.getModel('axisLabel').get('rotate');
        layout.labelRotation = axisPosition === 'top' ? -labelRotation : labelRotation;
        layout.labelInterval = axis.getLabelInterval();
        layout.z2 = 1;
        return layout;
      }
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var formatUtil = __webpack_require__(6);
      var graphic = __webpack_require__(43);
      var Model = __webpack_require__(12);
      var numberUtil = __webpack_require__(7);
      var remRadian = numberUtil.remRadian;
      var isRadianAroundZero = numberUtil.isRadianAroundZero;
      var vec2 = __webpack_require__(10);
      var v2ApplyTransform = vec2.applyTransform;
      var retrieve = zrUtil.retrieve;
      var PI = Math.PI;
      function makeAxisEventDataBase(axisModel) {
        var eventData = {componentType: axisModel.mainType};
        eventData[axisModel.mainType + 'Index'] = axisModel.componentIndex;
        return eventData;
      }
      var AxisBuilder = function(axisModel, opt) {
        this.opt = opt;
        this.axisModel = axisModel;
        zrUtil.defaults(opt, {
          labelOffset: 0,
          nameDirection: 1,
          tickDirection: 1,
          labelDirection: 1,
          silent: true
        });
        this.group = new graphic.Group();
        var dumbGroup = new graphic.Group({
          position: opt.position.slice(),
          rotation: opt.rotation
        });
        dumbGroup.updateTransform();
        this._transform = dumbGroup.transform;
        this._dumbGroup = dumbGroup;
      };
      AxisBuilder.prototype = {
        constructor: AxisBuilder,
        hasBuilder: function(name) {
          return !!builders[name];
        },
        add: function(name) {
          builders[name].call(this);
        },
        getGroup: function() {
          return this.group;
        }
      };
      var builders = {
        axisLine: function() {
          var opt = this.opt;
          var axisModel = this.axisModel;
          if (!axisModel.get('axisLine.show')) {
            return;
          }
          var extent = this.axisModel.axis.getExtent();
          var matrix = this._transform;
          var pt1 = [extent[0], 0];
          var pt2 = [extent[1], 0];
          if (matrix) {
            v2ApplyTransform(pt1, pt1, matrix);
            v2ApplyTransform(pt2, pt2, matrix);
          }
          this.group.add(new graphic.Line(graphic.subPixelOptimizeLine({
            anid: 'line',
            shape: {
              x1: pt1[0],
              y1: pt1[1],
              x2: pt2[0],
              y2: pt2[1]
            },
            style: zrUtil.extend({lineCap: 'round'}, axisModel.getModel('axisLine.lineStyle').getLineStyle()),
            strokeContainThreshold: opt.strokeContainThreshold || 5,
            silent: true,
            z2: 1
          })));
        },
        axisTick: function() {
          var axisModel = this.axisModel;
          var axis = axisModel.axis;
          if (!axisModel.get('axisTick.show') || axis.isBlank()) {
            return;
          }
          var tickModel = axisModel.getModel('axisTick');
          var opt = this.opt;
          var lineStyleModel = tickModel.getModel('lineStyle');
          var tickLen = tickModel.get('length');
          var tickInterval = getInterval(tickModel, opt.labelInterval);
          var ticksCoords = axis.getTicksCoords(tickModel.get('alignWithLabel'));
          var ticks = axis.scale.getTicks();
          var pt1 = [];
          var pt2 = [];
          var matrix = this._transform;
          for (var i = 0; i < ticksCoords.length; i++) {
            if (ifIgnoreOnTick(axis, i, tickInterval)) {
              continue;
            }
            var tickCoord = ticksCoords[i];
            pt1[0] = tickCoord;
            pt1[1] = 0;
            pt2[0] = tickCoord;
            pt2[1] = opt.tickDirection * tickLen;
            if (matrix) {
              v2ApplyTransform(pt1, pt1, matrix);
              v2ApplyTransform(pt2, pt2, matrix);
            }
            this.group.add(new graphic.Line(graphic.subPixelOptimizeLine({
              anid: 'tick_' + ticks[i],
              shape: {
                x1: pt1[0],
                y1: pt1[1],
                x2: pt2[0],
                y2: pt2[1]
              },
              style: zrUtil.defaults(lineStyleModel.getLineStyle(), {stroke: axisModel.get('axisLine.lineStyle.color')}),
              z2: 2,
              silent: true
            })));
          }
        },
        axisLabel: function() {
          var opt = this.opt;
          var axisModel = this.axisModel;
          var axis = axisModel.axis;
          var show = retrieve(opt.axisLabelShow, axisModel.get('axisLabel.show'));
          if (!show || axis.isBlank()) {
            return;
          }
          var labelModel = axisModel.getModel('axisLabel');
          var textStyleModel = labelModel.getModel('textStyle');
          var labelMargin = labelModel.get('margin');
          var ticks = axis.scale.getTicks();
          var labels = axisModel.getFormattedLabels();
          var labelRotation = retrieve(opt.labelRotation, labelModel.get('rotate')) || 0;
          labelRotation = labelRotation * PI / 180;
          var labelLayout = innerTextLayout(opt, labelRotation, opt.labelDirection);
          var categoryData = axisModel.get('data');
          var textEls = [];
          var silent = isSilent(axisModel);
          var triggerEvent = axisModel.get('triggerEvent');
          zrUtil.each(ticks, function(tickVal, index) {
            if (ifIgnoreOnTick(axis, index, opt.labelInterval)) {
              return;
            }
            var itemTextStyleModel = textStyleModel;
            if (categoryData && categoryData[tickVal] && categoryData[tickVal].textStyle) {
              itemTextStyleModel = new Model(categoryData[tickVal].textStyle, textStyleModel, axisModel.ecModel);
            }
            var textColor = itemTextStyleModel.getTextColor() || axisModel.get('axisLine.lineStyle.color');
            var tickCoord = axis.dataToCoord(tickVal);
            var pos = [tickCoord, opt.labelOffset + opt.labelDirection * labelMargin];
            var labelBeforeFormat = axis.scale.getLabel(tickVal);
            var textEl = new graphic.Text({
              anid: 'label_' + tickVal,
              style: {
                text: labels[index],
                textAlign: itemTextStyleModel.get('align', true) || labelLayout.textAlign,
                textVerticalAlign: itemTextStyleModel.get('baseline', true) || labelLayout.verticalAlign,
                textFont: itemTextStyleModel.getFont(),
                fill: typeof textColor === 'function' ? textColor(labelBeforeFormat) : textColor
              },
              position: pos,
              rotation: labelLayout.rotation,
              silent: silent,
              z2: 10
            });
            if (triggerEvent) {
              textEl.eventData = makeAxisEventDataBase(axisModel);
              textEl.eventData.targetType = 'axisLabel';
              textEl.eventData.value = labelBeforeFormat;
            }
            this._dumbGroup.add(textEl);
            textEl.updateTransform();
            textEls.push(textEl);
            this.group.add(textEl);
            textEl.decomposeTransform();
          }, this);
          function isTwoLabelOverlapped(current, next) {
            var firstRect = current && current.getBoundingRect().clone();
            var nextRect = next && next.getBoundingRect().clone();
            if (firstRect && nextRect) {
              firstRect.applyTransform(current.getLocalTransform());
              nextRect.applyTransform(next.getLocalTransform());
              return firstRect.intersect(nextRect);
            }
          }
          if (axisModel.getMin() != null) {
            var firstLabel = textEls[0];
            var nextLabel = textEls[1];
            if (isTwoLabelOverlapped(firstLabel, nextLabel)) {
              firstLabel.ignore = true;
            }
          }
          if (axisModel.getMax() != null) {
            var lastLabel = textEls[textEls.length - 1];
            var prevLabel = textEls[textEls.length - 2];
            if (isTwoLabelOverlapped(prevLabel, lastLabel)) {
              lastLabel.ignore = true;
            }
          }
        },
        axisName: function() {
          var opt = this.opt;
          var axisModel = this.axisModel;
          var name = retrieve(opt.axisName, axisModel.get('name'));
          if (!name) {
            return;
          }
          var nameLocation = axisModel.get('nameLocation');
          var nameDirection = opt.nameDirection;
          var textStyleModel = axisModel.getModel('nameTextStyle');
          var gap = axisModel.get('nameGap') || 0;
          var extent = this.axisModel.axis.getExtent();
          var gapSignal = extent[0] > extent[1] ? -1 : 1;
          var pos = [nameLocation === 'start' ? extent[0] - gapSignal * gap : nameLocation === 'end' ? extent[1] + gapSignal * gap : (extent[0] + extent[1]) / 2, nameLocation === 'middle' ? opt.labelOffset + nameDirection * gap : 0];
          var labelLayout;
          var nameRotation = axisModel.get('nameRotate');
          if (nameRotation != null) {
            nameRotation = nameRotation * PI / 180;
          }
          var axisNameAvailableWidth;
          if (nameLocation === 'middle') {
            labelLayout = innerTextLayout(opt, nameRotation != null ? nameRotation : opt.rotation, nameDirection);
          } else {
            labelLayout = endTextLayout(opt, nameLocation, nameRotation || 0, extent);
            axisNameAvailableWidth = opt.axisNameAvailableWidth;
            if (axisNameAvailableWidth != null) {
              axisNameAvailableWidth = Math.abs(axisNameAvailableWidth / Math.sin(labelLayout.rotation));
              !isFinite(axisNameAvailableWidth) && (axisNameAvailableWidth = null);
            }
          }
          var textFont = textStyleModel.getFont();
          var truncateOpt = axisModel.get('nameTruncate', true) || {};
          var ellipsis = truncateOpt.ellipsis;
          var maxWidth = retrieve(truncateOpt.maxWidth, axisNameAvailableWidth);
          var truncatedText = (ellipsis != null && maxWidth != null) ? formatUtil.truncateText(name, maxWidth, textFont, ellipsis, {
            minChar: 2,
            placeholder: truncateOpt.placeholder
          }) : name;
          var tooltipOpt = axisModel.get('tooltip', true);
          var mainType = axisModel.mainType;
          var formatterParams = {
            componentType: mainType,
            name: name,
            $vars: ['name']
          };
          formatterParams[mainType + 'Index'] = axisModel.componentIndex;
          var textEl = new graphic.Text({
            anid: 'name',
            __fullText: name,
            __truncatedText: truncatedText,
            style: {
              text: truncatedText,
              textFont: textFont,
              fill: textStyleModel.getTextColor() || axisModel.get('axisLine.lineStyle.color'),
              textAlign: labelLayout.textAlign,
              textVerticalAlign: labelLayout.verticalAlign
            },
            position: pos,
            rotation: labelLayout.rotation,
            silent: isSilent(axisModel),
            z2: 1,
            tooltip: (tooltipOpt && tooltipOpt.show) ? zrUtil.extend({
              content: name,
              formatter: function() {
                return name;
              },
              formatterParams: formatterParams
            }, tooltipOpt) : null
          });
          if (axisModel.get('triggerEvent')) {
            textEl.eventData = makeAxisEventDataBase(axisModel);
            textEl.eventData.targetType = 'axisName';
            textEl.eventData.name = name;
          }
          this._dumbGroup.add(textEl);
          textEl.updateTransform();
          this.group.add(textEl);
          textEl.decomposeTransform();
        }
      };
      function innerTextLayout(opt, textRotation, direction) {
        var rotationDiff = remRadian(textRotation - opt.rotation);
        var textAlign;
        var verticalAlign;
        if (isRadianAroundZero(rotationDiff)) {
          verticalAlign = direction > 0 ? 'top' : 'bottom';
          textAlign = 'center';
        } else if (isRadianAroundZero(rotationDiff - PI)) {
          verticalAlign = direction > 0 ? 'bottom' : 'top';
          textAlign = 'center';
        } else {
          verticalAlign = 'middle';
          if (rotationDiff > 0 && rotationDiff < PI) {
            textAlign = direction > 0 ? 'right' : 'left';
          } else {
            textAlign = direction > 0 ? 'left' : 'right';
          }
        }
        return {
          rotation: rotationDiff,
          textAlign: textAlign,
          verticalAlign: verticalAlign
        };
      }
      function endTextLayout(opt, textPosition, textRotate, extent) {
        var rotationDiff = remRadian(textRotate - opt.rotation);
        var textAlign;
        var verticalAlign;
        var inverse = extent[0] > extent[1];
        var onLeft = (textPosition === 'start' && !inverse) || (textPosition !== 'start' && inverse);
        if (isRadianAroundZero(rotationDiff - PI / 2)) {
          verticalAlign = onLeft ? 'bottom' : 'top';
          textAlign = 'center';
        } else if (isRadianAroundZero(rotationDiff - PI * 1.5)) {
          verticalAlign = onLeft ? 'top' : 'bottom';
          textAlign = 'center';
        } else {
          verticalAlign = 'middle';
          if (rotationDiff < PI * 1.5 && rotationDiff > PI / 2) {
            textAlign = onLeft ? 'left' : 'right';
          } else {
            textAlign = onLeft ? 'right' : 'left';
          }
        }
        return {
          rotation: rotationDiff,
          textAlign: textAlign,
          verticalAlign: verticalAlign
        };
      }
      function isSilent(axisModel) {
        var tooltipOpt = axisModel.get('tooltip');
        return axisModel.get('silent') || !(axisModel.get('triggerEvent') || (tooltipOpt && tooltipOpt.show));
      }
      var ifIgnoreOnTick = AxisBuilder.ifIgnoreOnTick = function(axis, i, interval) {
        var rawTick;
        var scale = axis.scale;
        return scale.type === 'ordinal' && (typeof interval === 'function' ? (rawTick = scale.getTicks()[i], !interval(rawTick, scale.getLabel(rawTick))) : i % (interval + 1));
      };
      var getInterval = AxisBuilder.getInterval = function(model, labelInterval) {
        var interval = model.get('interval');
        if (interval == null || interval == 'auto') {
          interval = labelInterval;
        }
        return interval;
      };
      module.exports = AxisBuilder;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      __webpack_require__(114);
      __webpack_require__(135);
      __webpack_require__(137);
      var barLayoutGrid = __webpack_require__(140);
      var echarts = __webpack_require__(1);
      echarts.registerLayout(zrUtil.curry(barLayoutGrid, 'bar'));
      echarts.registerVisual(function(ecModel) {
        ecModel.eachSeriesByType('bar', function(seriesModel) {
          var data = seriesModel.getData();
          data.setVisual('legendSymbol', 'roundRect');
        });
      });
      __webpack_require__(113);
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(136).extend({
        type: 'series.bar',
        dependencies: ['grid', 'polar'],
        brushSelector: 'rect'
      });
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var SeriesModel = __webpack_require__(28);
      var createListFromArray = __webpack_require__(102);
      module.exports = SeriesModel.extend({
        type: 'series.__base_bar__',
        getInitialData: function(option, ecModel) {
          if (true) {
            var coordSys = option.coordinateSystem;
            if (coordSys !== 'cartesian2d') {
              throw new Error('Bar only support cartesian2d coordinateSystem');
            }
          }
          return createListFromArray(option.data, this, ecModel);
        },
        getMarkerPosition: function(value) {
          var coordSys = this.coordinateSystem;
          if (coordSys) {
            var pt = coordSys.dataToPoint(value, true);
            var data = this.getData();
            var offset = data.getLayout('offset');
            var size = data.getLayout('size');
            var offsetIndex = coordSys.getBaseAxis().isHorizontal() ? 0 : 1;
            pt[offsetIndex] += offset + size / 2;
            return pt;
          }
          return [NaN, NaN];
        },
        defaultOption: {
          zlevel: 0,
          z: 2,
          coordinateSystem: 'cartesian2d',
          legendHoverLink: true,
          barMinHeight: 0,
          itemStyle: {
            normal: {},
            emphasis: {}
          }
        }
      });
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var graphic = __webpack_require__(43);
      var helper = __webpack_require__(138);
      var BAR_BORDER_WIDTH_QUERY = ['itemStyle', 'normal', 'barBorderWidth'];
      zrUtil.extend(__webpack_require__(12).prototype, __webpack_require__(139));
      var BarView = __webpack_require__(1).extendChartView({
        type: 'bar',
        render: function(seriesModel, ecModel, api) {
          var coordinateSystemType = seriesModel.get('coordinateSystem');
          if (coordinateSystemType === 'cartesian2d') {
            this._renderOnCartesian(seriesModel, ecModel, api);
          }
          return this.group;
        },
        dispose: zrUtil.noop,
        _renderOnCartesian: function(seriesModel, ecModel, api) {
          var group = this.group;
          var data = seriesModel.getData();
          var oldData = this._data;
          var cartesian = seriesModel.coordinateSystem;
          var baseAxis = cartesian.getBaseAxis();
          var isHorizontal = baseAxis.isHorizontal();
          var animationModel = seriesModel.isAnimationEnabled() ? seriesModel : null;
          data.diff(oldData).add(function(dataIndex) {
            if (!data.hasValue(dataIndex)) {
              return;
            }
            var itemModel = data.getItemModel(dataIndex);
            var layout = getRectItemLayout(data, dataIndex, itemModel);
            var el = createRect(data, dataIndex, itemModel, layout, isHorizontal, animationModel);
            data.setItemGraphicEl(dataIndex, el);
            group.add(el);
            updateStyle(el, data, dataIndex, itemModel, layout, seriesModel, isHorizontal);
          }).update(function(newIndex, oldIndex) {
            var el = oldData.getItemGraphicEl(oldIndex);
            if (!data.hasValue(newIndex)) {
              group.remove(el);
              return;
            }
            var itemModel = data.getItemModel(newIndex);
            var layout = getRectItemLayout(data, newIndex, itemModel);
            if (el) {
              graphic.updateProps(el, {shape: layout}, animationModel, newIndex);
            } else {
              el = createRect(data, newIndex, itemModel, layout, isHorizontal, animationModel, true);
            }
            data.setItemGraphicEl(newIndex, el);
            group.add(el);
            updateStyle(el, data, newIndex, itemModel, layout, seriesModel, isHorizontal);
          }).remove(function(dataIndex) {
            var el = oldData.getItemGraphicEl(dataIndex);
            el && removeRect(dataIndex, animationModel, el);
          }).execute();
          this._data = data;
        },
        remove: function(ecModel, api) {
          var group = this.group;
          var data = this._data;
          if (ecModel.get('animation')) {
            if (data) {
              data.eachItemGraphicEl(function(el) {
                removeRect(el.dataIndex, ecModel, el);
              });
            }
          } else {
            group.removeAll();
          }
        }
      });
      function createRect(data, dataIndex, itemModel, layout, isHorizontal, animationModel, isUpdate) {
        var rect = new graphic.Rect({shape: zrUtil.extend({}, layout)});
        if (animationModel) {
          var rectShape = rect.shape;
          var animateProperty = isHorizontal ? 'height' : 'width';
          var animateTarget = {};
          rectShape[animateProperty] = 0;
          animateTarget[animateProperty] = layout[animateProperty];
          graphic[isUpdate ? 'updateProps' : 'initProps'](rect, {shape: animateTarget}, animationModel, dataIndex);
        }
        return rect;
      }
      function removeRect(dataIndex, animationModel, el) {
        el.style.text = '';
        graphic.updateProps(el, {shape: {width: 0}}, animationModel, dataIndex, function() {
          el.parent && el.parent.remove(el);
        });
      }
      function getRectItemLayout(data, dataIndex, itemModel) {
        var layout = data.getItemLayout(dataIndex);
        var fixedLineWidth = getLineWidth(itemModel, layout);
        var signX = layout.width > 0 ? 1 : -1;
        var signY = layout.height > 0 ? 1 : -1;
        return {
          x: layout.x + signX * fixedLineWidth / 2,
          y: layout.y + signY * fixedLineWidth / 2,
          width: layout.width - signX * fixedLineWidth,
          height: layout.height - signY * fixedLineWidth
        };
      }
      function updateStyle(el, data, dataIndex, itemModel, layout, seriesModel, isHorizontal) {
        var color = data.getItemVisual(dataIndex, 'color');
        var opacity = data.getItemVisual(dataIndex, 'opacity');
        var itemStyleModel = itemModel.getModel('itemStyle.normal');
        var hoverStyle = itemModel.getModel('itemStyle.emphasis').getBarItemStyle();
        el.setShape('r', itemStyleModel.get('barBorderRadius') || 0);
        el.useStyle(zrUtil.defaults({
          fill: color,
          opacity: opacity
        }, itemStyleModel.getBarItemStyle()));
        var labelPositionOutside = isHorizontal ? (layout.height > 0 ? 'bottom' : 'top') : (layout.width > 0 ? 'left' : 'right');
        helper.setLabel(el.style, hoverStyle, itemModel, color, seriesModel, dataIndex, labelPositionOutside);
        graphic.setHoverStyle(el, hoverStyle);
      }
      function getLineWidth(itemModel, rawLayout) {
        var lineWidth = itemModel.get(BAR_BORDER_WIDTH_QUERY) || 0;
        return Math.min(lineWidth, Math.abs(rawLayout.width), Math.abs(rawLayout.height));
      }
      module.exports = BarView;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var graphic = __webpack_require__(43);
      var helper = {};
      helper.setLabel = function(normalStyle, hoverStyle, itemModel, color, seriesModel, dataIndex, labelPositionOutside) {
        var labelModel = itemModel.getModel('label.normal');
        var hoverLabelModel = itemModel.getModel('label.emphasis');
        if (labelModel.get('show')) {
          setLabel(normalStyle, labelModel, color, zrUtil.retrieve(seriesModel.getFormattedLabel(dataIndex, 'normal'), seriesModel.getRawValue(dataIndex)), labelPositionOutside);
        } else {
          normalStyle.text = '';
        }
        if (hoverLabelModel.get('show')) {
          setLabel(hoverStyle, hoverLabelModel, color, zrUtil.retrieve(seriesModel.getFormattedLabel(dataIndex, 'emphasis'), seriesModel.getRawValue(dataIndex)), labelPositionOutside);
        } else {
          hoverStyle.text = '';
        }
      };
      function setLabel(style, model, color, labelText, labelPositionOutside) {
        graphic.setText(style, model, color);
        style.text = labelText;
        if (style.textPosition === 'outside') {
          style.textPosition = labelPositionOutside;
        }
      }
      module.exports = helper;
    }, function(module, exports, __webpack_require__) {
      var getBarItemStyle = __webpack_require__(15)([['fill', 'color'], ['stroke', 'borderColor'], ['lineWidth', 'borderWidth'], ['stroke', 'barBorderColor'], ['lineWidth', 'barBorderWidth'], ['opacity'], ['shadowBlur'], ['shadowOffsetX'], ['shadowOffsetY'], ['shadowColor']]);
      module.exports = {getBarItemStyle: function(excludes) {
          var style = getBarItemStyle.call(this, excludes);
          if (this.getBorderLineDash) {
            var lineDash = this.getBorderLineDash();
            lineDash && (style.lineDash = lineDash);
          }
          return style;
        }};
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var parsePercent = numberUtil.parsePercent;
      function getSeriesStackId(seriesModel) {
        return seriesModel.get('stack') || '__ec_stack_' + seriesModel.seriesIndex;
      }
      function getAxisKey(axis) {
        return axis.dim + axis.index;
      }
      function calBarWidthAndOffset(barSeries, api) {
        var columnsMap = {};
        zrUtil.each(barSeries, function(seriesModel, idx) {
          var data = seriesModel.getData();
          var cartesian = seriesModel.coordinateSystem;
          var baseAxis = cartesian.getBaseAxis();
          var axisExtent = baseAxis.getExtent();
          var bandWidth = baseAxis.type === 'category' ? baseAxis.getBandWidth() : (Math.abs(axisExtent[1] - axisExtent[0]) / data.count());
          var columnsOnAxis = columnsMap[getAxisKey(baseAxis)] || {
            bandWidth: bandWidth,
            remainedWidth: bandWidth,
            autoWidthCount: 0,
            categoryGap: '20%',
            gap: '30%',
            stacks: {}
          };
          var stacks = columnsOnAxis.stacks;
          columnsMap[getAxisKey(baseAxis)] = columnsOnAxis;
          var stackId = getSeriesStackId(seriesModel);
          if (!stacks[stackId]) {
            columnsOnAxis.autoWidthCount++;
          }
          stacks[stackId] = stacks[stackId] || {
            width: 0,
            maxWidth: 0
          };
          var barWidth = parsePercent(seriesModel.get('barWidth'), bandWidth);
          var barMaxWidth = parsePercent(seriesModel.get('barMaxWidth'), bandWidth);
          var barGap = seriesModel.get('barGap');
          var barCategoryGap = seriesModel.get('barCategoryGap');
          if (barWidth && !stacks[stackId].width) {
            barWidth = Math.min(columnsOnAxis.remainedWidth, barWidth);
            stacks[stackId].width = barWidth;
            columnsOnAxis.remainedWidth -= barWidth;
          }
          barMaxWidth && (stacks[stackId].maxWidth = barMaxWidth);
          (barGap != null) && (columnsOnAxis.gap = barGap);
          (barCategoryGap != null) && (columnsOnAxis.categoryGap = barCategoryGap);
        });
        var result = {};
        zrUtil.each(columnsMap, function(columnsOnAxis, coordSysName) {
          result[coordSysName] = {};
          var stacks = columnsOnAxis.stacks;
          var bandWidth = columnsOnAxis.bandWidth;
          var categoryGap = parsePercent(columnsOnAxis.categoryGap, bandWidth);
          var barGapPercent = parsePercent(columnsOnAxis.gap, 1);
          var remainedWidth = columnsOnAxis.remainedWidth;
          var autoWidthCount = columnsOnAxis.autoWidthCount;
          var autoWidth = (remainedWidth - categoryGap) / (autoWidthCount + (autoWidthCount - 1) * barGapPercent);
          autoWidth = Math.max(autoWidth, 0);
          zrUtil.each(stacks, function(column, stack) {
            var maxWidth = column.maxWidth;
            if (!column.width && maxWidth && maxWidth < autoWidth) {
              maxWidth = Math.min(maxWidth, remainedWidth);
              remainedWidth -= maxWidth;
              column.width = maxWidth;
              autoWidthCount--;
            }
          });
          autoWidth = (remainedWidth - categoryGap) / (autoWidthCount + (autoWidthCount - 1) * barGapPercent);
          autoWidth = Math.max(autoWidth, 0);
          var widthSum = 0;
          var lastColumn;
          zrUtil.each(stacks, function(column, idx) {
            if (!column.width) {
              column.width = autoWidth;
            }
            lastColumn = column;
            widthSum += column.width * (1 + barGapPercent);
          });
          if (lastColumn) {
            widthSum -= lastColumn.width * barGapPercent;
          }
          var offset = -widthSum / 2;
          zrUtil.each(stacks, function(column, stackId) {
            result[coordSysName][stackId] = result[coordSysName][stackId] || {
              offset: offset,
              width: column.width
            };
            offset += column.width * (1 + barGapPercent);
          });
        });
        return result;
      }
      function barLayoutGrid(seriesType, ecModel, api) {
        var barWidthAndOffset = calBarWidthAndOffset(zrUtil.filter(ecModel.getSeriesByType(seriesType), function(seriesModel) {
          return !ecModel.isSeriesFiltered(seriesModel) && seriesModel.coordinateSystem && seriesModel.coordinateSystem.type === 'cartesian2d';
        }));
        var lastStackCoords = {};
        var lastStackCoordsOrigin = {};
        ecModel.eachSeriesByType(seriesType, function(seriesModel) {
          var data = seriesModel.getData();
          var cartesian = seriesModel.coordinateSystem;
          var baseAxis = cartesian.getBaseAxis();
          var stackId = getSeriesStackId(seriesModel);
          var columnLayoutInfo = barWidthAndOffset[getAxisKey(baseAxis)][stackId];
          var columnOffset = columnLayoutInfo.offset;
          var columnWidth = columnLayoutInfo.width;
          var valueAxis = cartesian.getOtherAxis(baseAxis);
          var barMinHeight = seriesModel.get('barMinHeight') || 0;
          var valueAxisStart = baseAxis.onZero ? valueAxis.toGlobalCoord(valueAxis.dataToCoord(0)) : valueAxis.getGlobalExtent()[0];
          var coords = cartesian.dataToPoints(data, true);
          lastStackCoords[stackId] = lastStackCoords[stackId] || [];
          lastStackCoordsOrigin[stackId] = lastStackCoordsOrigin[stackId] || [];
          data.setLayout({
            offset: columnOffset,
            size: columnWidth
          });
          data.each(valueAxis.dim, function(value, idx) {
            if (isNaN(value)) {
              return;
            }
            if (!lastStackCoords[stackId][idx]) {
              lastStackCoords[stackId][idx] = {
                p: valueAxisStart,
                n: valueAxisStart
              };
              lastStackCoordsOrigin[stackId][idx] = {
                p: valueAxisStart,
                n: valueAxisStart
              };
            }
            var sign = value >= 0 ? 'p' : 'n';
            var coord = coords[idx];
            var lastCoord = lastStackCoords[stackId][idx][sign];
            var lastCoordOrigin = lastStackCoordsOrigin[stackId][idx][sign];
            var x;
            var y;
            var width;
            var height;
            if (valueAxis.isHorizontal()) {
              x = lastCoord;
              y = coord[1] + columnOffset;
              width = coord[0] - lastCoordOrigin;
              height = columnWidth;
              lastStackCoordsOrigin[stackId][idx][sign] += width;
              if (Math.abs(width) < barMinHeight) {
                width = (width < 0 ? -1 : 1) * barMinHeight;
              }
              lastStackCoords[stackId][idx][sign] += width;
            } else {
              x = coord[0] + columnOffset;
              y = lastCoord;
              width = columnWidth;
              height = coord[1] - lastCoordOrigin;
              lastStackCoordsOrigin[stackId][idx][sign] += height;
              if (Math.abs(height) < barMinHeight) {
                height = (height <= 0 ? -1 : 1) * barMinHeight;
              }
              lastStackCoords[stackId][idx][sign] += height;
            }
            data.setItemLayout(idx, {
              x: x,
              y: y,
              width: width,
              height: height
            });
          }, true);
        }, this);
      }
      module.exports = barLayoutGrid;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var echarts = __webpack_require__(1);
      __webpack_require__(142);
      __webpack_require__(144);
      __webpack_require__(145)('pie', [{
        type: 'pieToggleSelect',
        event: 'pieselectchanged',
        method: 'toggleSelected'
      }, {
        type: 'pieSelect',
        event: 'pieselected',
        method: 'select'
      }, {
        type: 'pieUnSelect',
        event: 'pieunselected',
        method: 'unSelect'
      }]);
      echarts.registerVisual(zrUtil.curry(__webpack_require__(146), 'pie'));
      echarts.registerLayout(zrUtil.curry(__webpack_require__(147), 'pie'));
      echarts.registerProcessor(zrUtil.curry(__webpack_require__(149), 'pie'));
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var List = __webpack_require__(98);
      var zrUtil = __webpack_require__(4);
      var modelUtil = __webpack_require__(5);
      var completeDimensions = __webpack_require__(103);
      var dataSelectableMixin = __webpack_require__(143);
      var PieSeries = __webpack_require__(1).extendSeriesModel({
        type: 'series.pie',
        init: function(option) {
          PieSeries.superApply(this, 'init', arguments);
          this.legendDataProvider = function() {
            return this.getRawData();
          };
          this.updateSelectedMap(option.data);
          this._defaultLabelLine(option);
        },
        mergeOption: function(newOption) {
          PieSeries.superCall(this, 'mergeOption', newOption);
          this.updateSelectedMap(this.option.data);
        },
        getInitialData: function(option, ecModel) {
          var dimensions = completeDimensions(['value'], option.data);
          var list = new List(dimensions, this);
          list.initData(option.data);
          return list;
        },
        getDataParams: function(dataIndex) {
          var data = this.getData();
          var params = PieSeries.superCall(this, 'getDataParams', dataIndex);
          var sum = data.getSum('value');
          params.percent = !sum ? 0 : +(data.get('value', dataIndex) / sum * 100).toFixed(2);
          params.$vars.push('percent');
          return params;
        },
        _defaultLabelLine: function(option) {
          modelUtil.defaultEmphasis(option.labelLine, ['show']);
          var labelLineNormalOpt = option.labelLine.normal;
          var labelLineEmphasisOpt = option.labelLine.emphasis;
          labelLineNormalOpt.show = labelLineNormalOpt.show && option.label.normal.show;
          labelLineEmphasisOpt.show = labelLineEmphasisOpt.show && option.label.emphasis.show;
        },
        defaultOption: {
          zlevel: 0,
          z: 2,
          legendHoverLink: true,
          hoverAnimation: true,
          center: ['50%', '50%'],
          radius: [0, '75%'],
          clockwise: true,
          startAngle: 90,
          minAngle: 0,
          selectedOffset: 10,
          avoidLabelOverlap: true,
          stillShowZeroSum: true,
          label: {
            normal: {
              rotate: false,
              show: true,
              position: 'outer'
            },
            emphasis: {}
          },
          labelLine: {normal: {
              show: true,
              length: 15,
              length2: 15,
              smooth: false,
              lineStyle: {
                width: 1,
                type: 'solid'
              }
            }},
          itemStyle: {
            normal: {borderWidth: 1},
            emphasis: {}
          },
          animationType: 'expansion',
          animationEasing: 'cubicOut',
          data: []
        }
      });
      zrUtil.mixin(PieSeries, dataSelectableMixin);
      module.exports = PieSeries;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      module.exports = {
        updateSelectedMap: function(targetList) {
          this._selectTargetMap = zrUtil.reduce(targetList || [], function(targetMap, target) {
            targetMap[target.name] = target;
            return targetMap;
          }, {});
        },
        select: function(name) {
          var targetMap = this._selectTargetMap;
          var target = targetMap[name];
          var selectedMode = this.get('selectedMode');
          if (selectedMode === 'single') {
            zrUtil.each(targetMap, function(target) {
              target.selected = false;
            });
          }
          target && (target.selected = true);
        },
        unSelect: function(name) {
          var target = this._selectTargetMap[name];
          target && (target.selected = false);
        },
        toggleSelected: function(name) {
          var target = this._selectTargetMap[name];
          if (target != null) {
            this[target.selected ? 'unSelect' : 'select'](name);
            return target.selected;
          }
        },
        isSelected: function(name) {
          var target = this._selectTargetMap[name];
          return target && target.selected;
        }
      };
    }, function(module, exports, __webpack_require__) {
      var graphic = __webpack_require__(43);
      var zrUtil = __webpack_require__(4);
      function updateDataSelected(uid, seriesModel, hasAnimation, api) {
        var data = seriesModel.getData();
        var dataIndex = this.dataIndex;
        var name = data.getName(dataIndex);
        var selectedOffset = seriesModel.get('selectedOffset');
        api.dispatchAction({
          type: 'pieToggleSelect',
          from: uid,
          name: name,
          seriesId: seriesModel.id
        });
        data.each(function(idx) {
          toggleItemSelected(data.getItemGraphicEl(idx), data.getItemLayout(idx), seriesModel.isSelected(data.getName(idx)), selectedOffset, hasAnimation);
        });
      }
      function toggleItemSelected(el, layout, isSelected, selectedOffset, hasAnimation) {
        var midAngle = (layout.startAngle + layout.endAngle) / 2;
        var dx = Math.cos(midAngle);
        var dy = Math.sin(midAngle);
        var offset = isSelected ? selectedOffset : 0;
        var position = [dx * offset, dy * offset];
        hasAnimation ? el.animate().when(200, {position: position}).start('bounceOut') : el.attr('position', position);
      }
      function PiePiece(data, idx) {
        graphic.Group.call(this);
        var sector = new graphic.Sector({z2: 2});
        var polyline = new graphic.Polyline();
        var text = new graphic.Text();
        this.add(sector);
        this.add(polyline);
        this.add(text);
        this.updateData(data, idx, true);
        function onEmphasis() {
          polyline.ignore = polyline.hoverIgnore;
          text.ignore = text.hoverIgnore;
        }
        function onNormal() {
          polyline.ignore = polyline.normalIgnore;
          text.ignore = text.normalIgnore;
        }
        this.on('emphasis', onEmphasis).on('normal', onNormal).on('mouseover', onEmphasis).on('mouseout', onNormal);
      }
      var piePieceProto = PiePiece.prototype;
      function getLabelStyle(data, idx, state, labelModel, labelPosition) {
        var textStyleModel = labelModel.getModel('textStyle');
        var isLabelInside = labelPosition === 'inside' || labelPosition === 'inner';
        return {
          fill: textStyleModel.getTextColor() || (isLabelInside ? '#fff' : data.getItemVisual(idx, 'color')),
          opacity: data.getItemVisual(idx, 'opacity'),
          textFont: textStyleModel.getFont(),
          text: zrUtil.retrieve(data.hostModel.getFormattedLabel(idx, state), data.getName(idx))
        };
      }
      piePieceProto.updateData = function(data, idx, firstCreate) {
        var sector = this.childAt(0);
        var seriesModel = data.hostModel;
        var itemModel = data.getItemModel(idx);
        var layout = data.getItemLayout(idx);
        var sectorShape = zrUtil.extend({}, layout);
        sectorShape.label = null;
        if (firstCreate) {
          sector.setShape(sectorShape);
          var animationType = seriesModel.getShallow('animationType');
          if (animationType === 'scale') {
            sector.shape.r = layout.r0;
            graphic.initProps(sector, {shape: {r: layout.r}}, seriesModel, idx);
          } else {
            sector.shape.endAngle = layout.startAngle;
            graphic.updateProps(sector, {shape: {endAngle: layout.endAngle}}, seriesModel, idx);
          }
        } else {
          graphic.updateProps(sector, {shape: sectorShape}, seriesModel, idx);
        }
        var itemStyleModel = itemModel.getModel('itemStyle');
        var visualColor = data.getItemVisual(idx, 'color');
        sector.useStyle(zrUtil.defaults({
          lineJoin: 'bevel',
          fill: visualColor
        }, itemStyleModel.getModel('normal').getItemStyle()));
        sector.hoverStyle = itemStyleModel.getModel('emphasis').getItemStyle();
        toggleItemSelected(this, data.getItemLayout(idx), itemModel.get('selected'), seriesModel.get('selectedOffset'), seriesModel.get('animation'));
        function onEmphasis() {
          sector.stopAnimation(true);
          sector.animateTo({shape: {r: layout.r + 10}}, 300, 'elasticOut');
        }
        function onNormal() {
          sector.stopAnimation(true);
          sector.animateTo({shape: {r: layout.r}}, 300, 'elasticOut');
        }
        sector.off('mouseover').off('mouseout').off('emphasis').off('normal');
        if (itemModel.get('hoverAnimation') && seriesModel.isAnimationEnabled()) {
          sector.on('mouseover', onEmphasis).on('mouseout', onNormal).on('emphasis', onEmphasis).on('normal', onNormal);
        }
        this._updateLabel(data, idx);
        graphic.setHoverStyle(this);
      };
      piePieceProto._updateLabel = function(data, idx) {
        var labelLine = this.childAt(1);
        var labelText = this.childAt(2);
        var seriesModel = data.hostModel;
        var itemModel = data.getItemModel(idx);
        var layout = data.getItemLayout(idx);
        var labelLayout = layout.label;
        var visualColor = data.getItemVisual(idx, 'color');
        graphic.updateProps(labelLine, {shape: {points: labelLayout.linePoints || [[labelLayout.x, labelLayout.y], [labelLayout.x, labelLayout.y], [labelLayout.x, labelLayout.y]]}}, seriesModel, idx);
        graphic.updateProps(labelText, {style: {
            x: labelLayout.x,
            y: labelLayout.y
          }}, seriesModel, idx);
        labelText.attr({
          style: {
            textVerticalAlign: labelLayout.verticalAlign,
            textAlign: labelLayout.textAlign,
            textFont: labelLayout.font
          },
          rotation: labelLayout.rotation,
          origin: [labelLayout.x, labelLayout.y],
          z2: 10
        });
        var labelModel = itemModel.getModel('label.normal');
        var labelHoverModel = itemModel.getModel('label.emphasis');
        var labelLineModel = itemModel.getModel('labelLine.normal');
        var labelLineHoverModel = itemModel.getModel('labelLine.emphasis');
        var labelPosition = labelModel.get('position') || labelHoverModel.get('position');
        labelText.setStyle(getLabelStyle(data, idx, 'normal', labelModel, labelPosition));
        labelText.ignore = labelText.normalIgnore = !labelModel.get('show');
        labelText.hoverIgnore = !labelHoverModel.get('show');
        labelLine.ignore = labelLine.normalIgnore = !labelLineModel.get('show');
        labelLine.hoverIgnore = !labelLineHoverModel.get('show');
        labelLine.setStyle({
          stroke: visualColor,
          opacity: data.getItemVisual(idx, 'opacity')
        });
        labelLine.setStyle(labelLineModel.getModel('lineStyle').getLineStyle());
        labelText.hoverStyle = getLabelStyle(data, idx, 'emphasis', labelHoverModel, labelPosition);
        labelLine.hoverStyle = labelLineHoverModel.getModel('lineStyle').getLineStyle();
        var smooth = labelLineModel.get('smooth');
        if (smooth && smooth === true) {
          smooth = 0.4;
        }
        labelLine.setShape({smooth: smooth});
      };
      zrUtil.inherits(PiePiece, graphic.Group);
      var Pie = __webpack_require__(42).extend({
        type: 'pie',
        init: function() {
          var sectorGroup = new graphic.Group();
          this._sectorGroup = sectorGroup;
        },
        render: function(seriesModel, ecModel, api, payload) {
          if (payload && (payload.from === this.uid)) {
            return;
          }
          var data = seriesModel.getData();
          var oldData = this._data;
          var group = this.group;
          var hasAnimation = ecModel.get('animation');
          var isFirstRender = !oldData;
          var animationType = seriesModel.get('animationType');
          var onSectorClick = zrUtil.curry(updateDataSelected, this.uid, seriesModel, hasAnimation, api);
          var selectedMode = seriesModel.get('selectedMode');
          data.diff(oldData).add(function(idx) {
            var piePiece = new PiePiece(data, idx);
            if (isFirstRender && animationType !== 'scale') {
              piePiece.eachChild(function(child) {
                child.stopAnimation(true);
              });
            }
            selectedMode && piePiece.on('click', onSectorClick);
            data.setItemGraphicEl(idx, piePiece);
            group.add(piePiece);
          }).update(function(newIdx, oldIdx) {
            var piePiece = oldData.getItemGraphicEl(oldIdx);
            piePiece.updateData(data, newIdx);
            piePiece.off('click');
            selectedMode && piePiece.on('click', onSectorClick);
            group.add(piePiece);
            data.setItemGraphicEl(newIdx, piePiece);
          }).remove(function(idx) {
            var piePiece = oldData.getItemGraphicEl(idx);
            group.remove(piePiece);
          }).execute();
          if (hasAnimation && isFirstRender && data.count() > 0 && animationType !== 'scale') {
            var shape = data.getItemLayout(0);
            var r = Math.max(api.getWidth(), api.getHeight()) / 2;
            var removeClipPath = zrUtil.bind(group.removeClipPath, group);
            group.setClipPath(this._createClipPath(shape.cx, shape.cy, r, shape.startAngle, shape.clockwise, removeClipPath, seriesModel));
          }
          this._data = data;
        },
        dispose: function() {},
        _createClipPath: function(cx, cy, r, startAngle, clockwise, cb, seriesModel) {
          var clipPath = new graphic.Sector({shape: {
              cx: cx,
              cy: cy,
              r0: 0,
              r: r,
              startAngle: startAngle,
              endAngle: startAngle,
              clockwise: clockwise
            }});
          graphic.initProps(clipPath, {shape: {endAngle: startAngle + (clockwise ? 1 : -1) * Math.PI * 2}}, seriesModel, cb);
          return clipPath;
        },
        containPoint: function(point, seriesModel) {
          var data = seriesModel.getData();
          var itemLayout = data.getItemLayout(0);
          if (itemLayout) {
            var dx = point[0] - itemLayout.cx;
            var dy = point[1] - itemLayout.cy;
            var radius = Math.sqrt(dx * dx + dy * dy);
            return radius <= itemLayout.r && radius >= itemLayout.r0;
          }
        }
      });
      module.exports = Pie;
    }, function(module, exports, __webpack_require__) {
      var echarts = __webpack_require__(1);
      var zrUtil = __webpack_require__(4);
      module.exports = function(seriesType, actionInfos) {
        zrUtil.each(actionInfos, function(actionInfo) {
          actionInfo.update = 'updateView';
          echarts.registerAction(actionInfo, function(payload, ecModel) {
            var selected = {};
            ecModel.eachComponent({
              mainType: 'series',
              subType: seriesType,
              query: payload
            }, function(seriesModel) {
              if (seriesModel[actionInfo.method]) {
                seriesModel[actionInfo.method](payload.name);
              }
              var data = seriesModel.getData();
              data.each(function(idx) {
                var name = data.getName(idx);
                selected[name] = seriesModel.isSelected(name) || false;
              });
            });
            return {
              name: payload.name,
              selected: selected
            };
          });
        });
      };
    }, function(module, exports) {
      module.exports = function(seriesType, ecModel) {
        var paletteScope = {};
        ecModel.eachRawSeriesByType(seriesType, function(seriesModel) {
          var dataAll = seriesModel.getRawData();
          var idxMap = {};
          if (!ecModel.isSeriesFiltered(seriesModel)) {
            var data = seriesModel.getData();
            data.each(function(idx) {
              var rawIdx = data.getRawIndex(idx);
              idxMap[rawIdx] = idx;
            });
            dataAll.each(function(rawIdx) {
              var filteredIdx = idxMap[rawIdx];
              var singleDataColor = filteredIdx != null && data.getItemVisual(filteredIdx, 'color', true);
              if (!singleDataColor) {
                var itemModel = dataAll.getItemModel(rawIdx);
                var color = itemModel.get('itemStyle.normal.color') || seriesModel.getColorFromPalette(dataAll.getName(rawIdx), paletteScope);
                dataAll.setItemVisual(rawIdx, 'color', color);
                if (filteredIdx != null) {
                  data.setItemVisual(filteredIdx, 'color', color);
                }
              } else {
                dataAll.setItemVisual(rawIdx, 'color', singleDataColor);
              }
            });
          }
        });
      };
    }, function(module, exports, __webpack_require__) {
      var numberUtil = __webpack_require__(7);
      var parsePercent = numberUtil.parsePercent;
      var labelLayout = __webpack_require__(148);
      var zrUtil = __webpack_require__(4);
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
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var textContain = __webpack_require__(8);
      function adjustSingleSide(list, cx, cy, r, dir, viewWidth, viewHeight) {
        list.sort(function(a, b) {
          return a.y - b.y;
        });
        function shiftDown(start, end, delta, dir) {
          for (var j = start; j < end; j++) {
            list[j].y += delta;
            if (j > start && j + 1 < end && list[j + 1].y > list[j].y + list[j].height) {
              shiftUp(j, delta / 2);
              return;
            }
          }
          shiftUp(end - 1, delta / 2);
        }
        function shiftUp(end, delta) {
          for (var j = end; j >= 0; j--) {
            list[j].y -= delta;
            if (j > 0 && list[j].y > list[j - 1].y + list[j - 1].height) {
              break;
            }
          }
        }
        function changeX(list, isDownList, cx, cy, r, dir) {
          var lastDeltaX = dir > 0 ? isDownList ? Number.MAX_VALUE : 0 : isDownList ? Number.MAX_VALUE : 0;
          for (var i = 0,
              l = list.length; i < l; i++) {
            if (list[i].position === 'center') {
              continue;
            }
            var deltaY = Math.abs(list[i].y - cy);
            var length = list[i].len;
            var length2 = list[i].len2;
            var deltaX = (deltaY < r + length) ? Math.sqrt((r + length + length2) * (r + length + length2) - deltaY * deltaY) : Math.abs(list[i].x - cx);
            if (isDownList && deltaX >= lastDeltaX) {
              deltaX = lastDeltaX - 10;
            }
            if (!isDownList && deltaX <= lastDeltaX) {
              deltaX = lastDeltaX + 10;
            }
            list[i].x = cx + deltaX * dir;
            lastDeltaX = deltaX;
          }
        }
        var lastY = 0;
        var delta;
        var len = list.length;
        var upList = [];
        var downList = [];
        for (var i = 0; i < len; i++) {
          delta = list[i].y - lastY;
          if (delta < 0) {
            shiftDown(i, len, -delta, dir);
          }
          lastY = list[i].y + list[i].height;
        }
        if (viewHeight - lastY < 0) {
          shiftUp(len - 1, lastY - viewHeight);
        }
        for (var i = 0; i < len; i++) {
          if (list[i].y >= cy) {
            downList.push(list[i]);
          } else {
            upList.push(list[i]);
          }
        }
        changeX(upList, false, cx, cy, r, dir);
        changeX(downList, true, cx, cy, r, dir);
      }
      function avoidOverlap(labelLayoutList, cx, cy, r, viewWidth, viewHeight) {
        var leftList = [];
        var rightList = [];
        for (var i = 0; i < labelLayoutList.length; i++) {
          if (labelLayoutList[i].x < cx) {
            leftList.push(labelLayoutList[i]);
          } else {
            rightList.push(labelLayoutList[i]);
          }
        }
        adjustSingleSide(rightList, cx, cy, r, 1, viewWidth, viewHeight);
        adjustSingleSide(leftList, cx, cy, r, -1, viewWidth, viewHeight);
        for (var i = 0; i < labelLayoutList.length; i++) {
          var linePoints = labelLayoutList[i].linePoints;
          if (linePoints) {
            var dist = linePoints[1][0] - linePoints[2][0];
            if (labelLayoutList[i].x < cx) {
              linePoints[2][0] = labelLayoutList[i].x + 3;
            } else {
              linePoints[2][0] = labelLayoutList[i].x - 3;
            }
            linePoints[1][1] = linePoints[2][1] = labelLayoutList[i].y;
            linePoints[1][0] = linePoints[2][0] + dist;
          }
        }
      }
      module.exports = function(seriesModel, r, viewWidth, viewHeight) {
        var data = seriesModel.getData();
        var labelLayoutList = [];
        var cx;
        var cy;
        var hasLabelRotate = false;
        data.each(function(idx) {
          var layout = data.getItemLayout(idx);
          var itemModel = data.getItemModel(idx);
          var labelModel = itemModel.getModel('label.normal');
          var labelPosition = labelModel.get('position') || itemModel.get('label.emphasis.position');
          var labelLineModel = itemModel.getModel('labelLine.normal');
          var labelLineLen = labelLineModel.get('length');
          var labelLineLen2 = labelLineModel.get('length2');
          var midAngle = (layout.startAngle + layout.endAngle) / 2;
          var dx = Math.cos(midAngle);
          var dy = Math.sin(midAngle);
          var textX;
          var textY;
          var linePoints;
          var textAlign;
          cx = layout.cx;
          cy = layout.cy;
          var isLabelInside = labelPosition === 'inside' || labelPosition === 'inner';
          if (labelPosition === 'center') {
            textX = layout.cx;
            textY = layout.cy;
            textAlign = 'center';
          } else {
            var x1 = (isLabelInside ? (layout.r + layout.r0) / 2 * dx : layout.r * dx) + cx;
            var y1 = (isLabelInside ? (layout.r + layout.r0) / 2 * dy : layout.r * dy) + cy;
            textX = x1 + dx * 3;
            textY = y1 + dy * 3;
            if (!isLabelInside) {
              var x2 = x1 + dx * (labelLineLen + r - layout.r);
              var y2 = y1 + dy * (labelLineLen + r - layout.r);
              var x3 = x2 + ((dx < 0 ? -1 : 1) * labelLineLen2);
              var y3 = y2;
              textX = x3 + (dx < 0 ? -5 : 5);
              textY = y3;
              linePoints = [[x1, y1], [x2, y2], [x3, y3]];
            }
            textAlign = isLabelInside ? 'center' : (dx > 0 ? 'left' : 'right');
          }
          var font = labelModel.getModel('textStyle').getFont();
          var labelRotate = labelModel.get('rotate') ? (dx < 0 ? -midAngle + Math.PI : -midAngle) : 0;
          var text = seriesModel.getFormattedLabel(idx, 'normal') || data.getName(idx);
          var textRect = textContain.getBoundingRect(text, font, textAlign, 'top');
          hasLabelRotate = !!labelRotate;
          layout.label = {
            x: textX,
            y: textY,
            position: labelPosition,
            height: textRect.height,
            len: labelLineLen,
            len2: labelLineLen2,
            linePoints: linePoints,
            textAlign: textAlign,
            verticalAlign: 'middle',
            font: font,
            rotation: labelRotate
          };
          if (!isLabelInside) {
            labelLayoutList.push(layout.label);
          }
        });
        if (!hasLabelRotate && seriesModel.get('avoidLabelOverlap')) {
          avoidOverlap(labelLayoutList, cx, cy, r, viewWidth, viewHeight);
        }
      };
    }, function(module, exports) {
      module.exports = function(seriesType, ecModel) {
        var legendModels = ecModel.findComponents({mainType: 'legend'});
        if (!legendModels || !legendModels.length) {
          return;
        }
        ecModel.eachSeriesByType(seriesType, function(series) {
          var data = series.getData();
          data.filterSelf(function(idx) {
            var name = data.getName(idx);
            for (var i = 0; i < legendModels.length; i++) {
              if (!legendModels[i].isSelected(name)) {
                return false;
              }
            }
            return true;
          }, this);
        }, this);
      };
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var echarts = __webpack_require__(1);
      __webpack_require__(151);
      __webpack_require__(152);
      echarts.registerVisual(zrUtil.curry(__webpack_require__(110), 'scatter', 'circle', null));
      echarts.registerLayout(zrUtil.curry(__webpack_require__(111), 'scatter'));
      __webpack_require__(113);
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var createListFromArray = __webpack_require__(102);
      var SeriesModel = __webpack_require__(28);
      module.exports = SeriesModel.extend({
        type: 'series.scatter',
        dependencies: ['grid', 'polar'],
        getInitialData: function(option, ecModel) {
          var list = createListFromArray(option.data, this, ecModel);
          return list;
        },
        brushSelector: 'point',
        defaultOption: {
          coordinateSystem: 'cartesian2d',
          zlevel: 0,
          z: 2,
          legendHoverLink: true,
          hoverAnimation: true,
          symbolSize: 10,
          large: false,
          largeThreshold: 2000,
          itemStyle: {normal: {opacity: 0.8}}
        }
      });
    }, function(module, exports, __webpack_require__) {
      var SymbolDraw = __webpack_require__(105);
      var LargeSymbolDraw = __webpack_require__(153);
      __webpack_require__(1).extendChartView({
        type: 'scatter',
        init: function() {
          this._normalSymbolDraw = new SymbolDraw();
          this._largeSymbolDraw = new LargeSymbolDraw();
        },
        render: function(seriesModel, ecModel, api) {
          var data = seriesModel.getData();
          var largeSymbolDraw = this._largeSymbolDraw;
          var normalSymbolDraw = this._normalSymbolDraw;
          var group = this.group;
          var symbolDraw = seriesModel.get('large') && data.count() > seriesModel.get('largeThreshold') ? largeSymbolDraw : normalSymbolDraw;
          this._symbolDraw = symbolDraw;
          symbolDraw.updateData(data);
          group.add(symbolDraw.group);
          group.remove(symbolDraw === largeSymbolDraw ? normalSymbolDraw.group : largeSymbolDraw.group);
        },
        updateLayout: function(seriesModel) {
          this._symbolDraw.updateLayout(seriesModel);
        },
        remove: function(ecModel, api) {
          this._symbolDraw && this._symbolDraw.remove(api, true);
        },
        dispose: function() {}
      });
    }, function(module, exports, __webpack_require__) {
      var graphic = __webpack_require__(43);
      var symbolUtil = __webpack_require__(107);
      var LargeSymbolPath = graphic.extendShape({
        shape: {
          points: null,
          sizes: null
        },
        symbolProxy: null,
        buildPath: function(path, shape) {
          var points = shape.points;
          var sizes = shape.sizes;
          var symbolProxy = this.symbolProxy;
          var symbolProxyShape = symbolProxy.shape;
          for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            var size = sizes[i];
            if (size[0] < 4) {
              path.rect(pt[0] - size[0] / 2, pt[1] - size[1] / 2, size[0], size[1]);
            } else {
              symbolProxyShape.x = pt[0] - size[0] / 2;
              symbolProxyShape.y = pt[1] - size[1] / 2;
              symbolProxyShape.width = size[0];
              symbolProxyShape.height = size[1];
              symbolProxy.buildPath(path, symbolProxyShape, true);
            }
          }
        },
        findDataIndex: function(x, y) {
          var shape = this.shape;
          var points = shape.points;
          var sizes = shape.sizes;
          for (var i = points.length - 1; i >= 0; i--) {
            var pt = points[i];
            var size = sizes[i];
            var x0 = pt[0] - size[0] / 2;
            var y0 = pt[1] - size[1] / 2;
            if (x >= x0 && y >= y0 && x <= x0 + size[0] && y <= y0 + size[1]) {
              return i;
            }
          }
          return -1;
        }
      });
      function LargeSymbolDraw() {
        this.group = new graphic.Group();
        this._symbolEl = new LargeSymbolPath({});
      }
      var largeSymbolProto = LargeSymbolDraw.prototype;
      largeSymbolProto.updateData = function(data) {
        this.group.removeAll();
        var symbolEl = this._symbolEl;
        var seriesModel = data.hostModel;
        symbolEl.setShape({
          points: data.mapArray(data.getItemLayout),
          sizes: data.mapArray(function(idx) {
            var size = data.getItemVisual(idx, 'symbolSize');
            if (!(size instanceof Array)) {
              size = [size, size];
            }
            return size;
          })
        });
        symbolEl.symbolProxy = symbolUtil.createSymbol(data.getVisual('symbol'), 0, 0, 0, 0);
        symbolEl.setColor = symbolEl.symbolProxy.setColor;
        symbolEl.useStyle(seriesModel.getModel('itemStyle.normal').getItemStyle(['color']));
        var visualColor = data.getVisual('color');
        if (visualColor) {
          symbolEl.setColor(visualColor);
        }
        symbolEl.seriesIndex = seriesModel.seriesIndex;
        symbolEl.on('mousemove', function(e) {
          symbolEl.dataIndex = null;
          var dataIndex = symbolEl.findDataIndex(e.offsetX, e.offsetY);
          if (dataIndex > 0) {
            symbolEl.dataIndex = dataIndex;
          }
        });
        this.group.add(symbolEl);
      };
      largeSymbolProto.updateLayout = function(seriesModel) {
        var data = seriesModel.getData();
        this._symbolEl.setShape({points: data.mapArray(data.getItemLayout)});
      };
      largeSymbolProto.remove = function() {
        this.group.removeAll();
      };
      module.exports = LargeSymbolDraw;
    }, , , , , , , , , , , , , , , , , , , , , , , , function(module, exports, __webpack_require__) {
      var Eventful = __webpack_require__(33);
      var zrUtil = __webpack_require__(4);
      var eventTool = __webpack_require__(88);
      var interactionMutex = __webpack_require__(178);
      function mousedown(e) {
        if (e.target && e.target.draggable) {
          return;
        }
        var x = e.offsetX;
        var y = e.offsetY;
        if (this.containsPoint && this.containsPoint(x, y)) {
          this._x = x;
          this._y = y;
          this._dragging = true;
        }
      }
      function mousemove(e) {
        if (!this._dragging) {
          return;
        }
        eventTool.stop(e.event);
        if (e.gestureEvent !== 'pinch') {
          if (interactionMutex.isTaken(this._zr, 'globalPan')) {
            return;
          }
          var x = e.offsetX;
          var y = e.offsetY;
          var oldX = this._x;
          var oldY = this._y;
          var dx = x - oldX;
          var dy = y - oldY;
          this._x = x;
          this._y = y;
          var target = this.target;
          if (target) {
            var pos = target.position;
            pos[0] += dx;
            pos[1] += dy;
            target.dirty();
          }
          eventTool.stop(e.event);
          this.trigger('pan', dx, dy, oldX, oldY, x, y);
        }
      }
      function mouseup(e) {
        this._dragging = false;
      }
      function mousewheel(e) {
        var zoomDelta = e.wheelDelta > 0 ? 1.1 : 1 / 1.1;
        zoom.call(this, e, zoomDelta, e.offsetX, e.offsetY);
      }
      function pinch(e) {
        if (interactionMutex.isTaken(this._zr, 'globalPan')) {
          return;
        }
        var zoomDelta = e.pinchScale > 1 ? 1.1 : 1 / 1.1;
        zoom.call(this, e, zoomDelta, e.pinchX, e.pinchY);
      }
      function zoom(e, zoomDelta, zoomX, zoomY) {
        if (this.containsPoint && this.containsPoint(zoomX, zoomY)) {
          eventTool.stop(e.event);
          var target = this.target;
          var zoomLimit = this.zoomLimit;
          if (target) {
            var pos = target.position;
            var scale = target.scale;
            var newZoom = this.zoom = this.zoom || 1;
            newZoom *= zoomDelta;
            if (zoomLimit) {
              var zoomMin = zoomLimit.min || 0;
              var zoomMax = zoomLimit.max || Infinity;
              newZoom = Math.max(Math.min(zoomMax, newZoom), zoomMin);
            }
            var zoomScale = newZoom / this.zoom;
            this.zoom = newZoom;
            pos[0] -= (zoomX - pos[0]) * (zoomScale - 1);
            pos[1] -= (zoomY - pos[1]) * (zoomScale - 1);
            scale[0] *= zoomScale;
            scale[1] *= zoomScale;
            target.dirty();
          }
          this.trigger('zoom', zoomDelta, zoomX, zoomY);
        }
      }
      function RoamController(zr, target) {
        this.target = target;
        this.containsPoint;
        this.zoomLimit;
        this.zoom;
        this._zr = zr;
        var bind = zrUtil.bind;
        var mousedownHandler = bind(mousedown, this);
        var mousemoveHandler = bind(mousemove, this);
        var mouseupHandler = bind(mouseup, this);
        var mousewheelHandler = bind(mousewheel, this);
        var pinchHandler = bind(pinch, this);
        Eventful.call(this);
        this.setContainsPoint = function(containsPoint) {
          this.containsPoint = containsPoint;
        };
        this.enable = function(controlType) {
          this.disable();
          if (controlType == null) {
            controlType = true;
          }
          if (controlType === true || (controlType === 'move' || controlType === 'pan')) {
            zr.on('mousedown', mousedownHandler);
            zr.on('mousemove', mousemoveHandler);
            zr.on('mouseup', mouseupHandler);
          }
          if (controlType === true || (controlType === 'scale' || controlType === 'zoom')) {
            zr.on('mousewheel', mousewheelHandler);
            zr.on('pinch', pinchHandler);
          }
        };
        this.disable = function() {
          zr.off('mousedown', mousedownHandler);
          zr.off('mousemove', mousemoveHandler);
          zr.off('mouseup', mouseupHandler);
          zr.off('mousewheel', mousewheelHandler);
          zr.off('pinch', pinchHandler);
        };
        this.dispose = this.disable;
        this.isDragging = function() {
          return this._dragging;
        };
        this.isPinching = function() {
          return this._pinching;
        };
      }
      zrUtil.mixin(RoamController, Eventful);
      module.exports = RoamController;
    }, function(module, exports, __webpack_require__) {
      var ATTR = '\0_ec_interaction_mutex';
      var interactionMutex = {
        take: function(zr, resourceKey, userKey) {
          var store = getStore(zr);
          store[resourceKey] = userKey;
        },
        release: function(zr, resourceKey, userKey) {
          var store = getStore(zr);
          var uKey = store[resourceKey];
          if (uKey === userKey) {
            store[resourceKey] = null;
          }
        },
        isTaken: function(zr, resourceKey) {
          return !!getStore(zr)[resourceKey];
        }
      };
      function getStore(zr) {
        return zr[ATTR] || (zr[ATTR] = {});
      }
      __webpack_require__(1).registerAction({
        type: 'takeGlobalCursor',
        event: 'globalCursorTaken',
        update: 'update'
      }, function() {});
      module.exports = interactionMutex;
    }, , , , , , , , , , , , , , , , , , , , , , , , function(module, exports, __webpack_require__) {
      var graphic = __webpack_require__(43);
      var LineGroup = __webpack_require__(203);
      function isPointNaN(pt) {
        return isNaN(pt[0]) || isNaN(pt[1]);
      }
      function lineNeedsDraw(pts) {
        return !isPointNaN(pts[0]) && !isPointNaN(pts[1]);
      }
      function LineDraw(ctor) {
        this._ctor = ctor || LineGroup;
        this.group = new graphic.Group();
      }
      var lineDrawProto = LineDraw.prototype;
      lineDrawProto.updateData = function(lineData) {
        var oldLineData = this._lineData;
        var group = this.group;
        var LineCtor = this._ctor;
        var hostModel = lineData.hostModel;
        var seriesScope = {
          lineStyle: hostModel.getModel('lineStyle.normal').getLineStyle(),
          hoverLineStyle: hostModel.getModel('lineStyle.emphasis').getLineStyle(),
          labelModel: hostModel.getModel('label.normal'),
          hoverLabelModel: hostModel.getModel('label.emphasis')
        };
        lineData.diff(oldLineData).add(function(idx) {
          if (!lineNeedsDraw(lineData.getItemLayout(idx))) {
            return;
          }
          var lineGroup = new LineCtor(lineData, idx, seriesScope);
          lineData.setItemGraphicEl(idx, lineGroup);
          group.add(lineGroup);
        }).update(function(newIdx, oldIdx) {
          var lineGroup = oldLineData.getItemGraphicEl(oldIdx);
          if (!lineNeedsDraw(lineData.getItemLayout(newIdx))) {
            group.remove(lineGroup);
            return;
          }
          if (!lineGroup) {
            lineGroup = new LineCtor(lineData, newIdx, seriesScope);
          } else {
            lineGroup.updateData(lineData, newIdx, seriesScope);
          }
          lineData.setItemGraphicEl(newIdx, lineGroup);
          group.add(lineGroup);
        }).remove(function(idx) {
          group.remove(oldLineData.getItemGraphicEl(idx));
        }).execute();
        this._lineData = lineData;
      };
      lineDrawProto.updateLayout = function() {
        var lineData = this._lineData;
        lineData.eachItemGraphicEl(function(el, idx) {
          el.updateLayout(lineData, idx);
        }, this);
      };
      lineDrawProto.remove = function() {
        this.group.removeAll();
      };
      module.exports = LineDraw;
    }, function(module, exports, __webpack_require__) {
      var symbolUtil = __webpack_require__(107);
      var vector = __webpack_require__(10);
      var LinePath = __webpack_require__(204);
      var graphic = __webpack_require__(43);
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var SYMBOL_CATEGORIES = ['fromSymbol', 'toSymbol'];
      function makeSymbolTypeKey(symbolCategory) {
        return '_' + symbolCategory + 'Type';
      }
      function createSymbol(name, lineData, idx) {
        var color = lineData.getItemVisual(idx, 'color');
        var symbolType = lineData.getItemVisual(idx, name);
        var symbolSize = lineData.getItemVisual(idx, name + 'Size');
        if (!symbolType || symbolType === 'none') {
          return;
        }
        if (!zrUtil.isArray(symbolSize)) {
          symbolSize = [symbolSize, symbolSize];
        }
        var symbolPath = symbolUtil.createSymbol(symbolType, -symbolSize[0] / 2, -symbolSize[1] / 2, symbolSize[0], symbolSize[1], color);
        symbolPath.name = name;
        return symbolPath;
      }
      function createLine(points) {
        var line = new LinePath({name: 'line'});
        setLinePoints(line.shape, points);
        return line;
      }
      function setLinePoints(targetShape, points) {
        var p1 = points[0];
        var p2 = points[1];
        var cp1 = points[2];
        targetShape.x1 = p1[0];
        targetShape.y1 = p1[1];
        targetShape.x2 = p2[0];
        targetShape.y2 = p2[1];
        targetShape.percent = 1;
        if (cp1) {
          targetShape.cpx1 = cp1[0];
          targetShape.cpy1 = cp1[1];
        } else {
          targetShape.cpx1 = NaN;
          targetShape.cpy1 = NaN;
        }
      }
      function updateSymbolAndLabelBeforeLineUpdate() {
        var lineGroup = this;
        var symbolFrom = lineGroup.childOfName('fromSymbol');
        var symbolTo = lineGroup.childOfName('toSymbol');
        var label = lineGroup.childOfName('label');
        if (!symbolFrom && !symbolTo && label.ignore) {
          return;
        }
        var invScale = 1;
        var parentNode = this.parent;
        while (parentNode) {
          if (parentNode.scale) {
            invScale /= parentNode.scale[0];
          }
          parentNode = parentNode.parent;
        }
        var line = lineGroup.childOfName('line');
        if (!this.__dirty && !line.__dirty) {
          return;
        }
        var percent = line.shape.percent;
        var fromPos = line.pointAt(0);
        var toPos = line.pointAt(percent);
        var d = vector.sub([], toPos, fromPos);
        vector.normalize(d, d);
        if (symbolFrom) {
          symbolFrom.attr('position', fromPos);
          var tangent = line.tangentAt(0);
          symbolFrom.attr('rotation', Math.PI / 2 - Math.atan2(tangent[1], tangent[0]));
          symbolFrom.attr('scale', [invScale * percent, invScale * percent]);
        }
        if (symbolTo) {
          symbolTo.attr('position', toPos);
          var tangent = line.tangentAt(1);
          symbolTo.attr('rotation', -Math.PI / 2 - Math.atan2(tangent[1], tangent[0]));
          symbolTo.attr('scale', [invScale * percent, invScale * percent]);
        }
        if (!label.ignore) {
          label.attr('position', toPos);
          var textPosition;
          var textAlign;
          var textVerticalAlign;
          var distance = 5 * invScale;
          if (label.__position === 'end') {
            textPosition = [d[0] * distance + toPos[0], d[1] * distance + toPos[1]];
            textAlign = d[0] > 0.8 ? 'left' : (d[0] < -0.8 ? 'right' : 'center');
            textVerticalAlign = d[1] > 0.8 ? 'top' : (d[1] < -0.8 ? 'bottom' : 'middle');
          } else if (label.__position === 'middle') {
            var halfPercent = percent / 2;
            var tangent = line.tangentAt(halfPercent);
            var n = [tangent[1], -tangent[0]];
            var cp = line.pointAt(halfPercent);
            if (n[1] > 0) {
              n[0] = -n[0];
              n[1] = -n[1];
            }
            textPosition = [cp[0] + n[0] * distance, cp[1] + n[1] * distance];
            textAlign = 'center';
            textVerticalAlign = 'bottom';
            var rotation = -Math.atan2(tangent[1], tangent[0]);
            if (toPos[0] < fromPos[0]) {
              rotation = Math.PI + rotation;
            }
            label.attr('rotation', rotation);
          } else {
            textPosition = [-d[0] * distance + fromPos[0], -d[1] * distance + fromPos[1]];
            textAlign = d[0] > 0.8 ? 'right' : (d[0] < -0.8 ? 'left' : 'center');
            textVerticalAlign = d[1] > 0.8 ? 'bottom' : (d[1] < -0.8 ? 'top' : 'middle');
          }
          label.attr({
            style: {
              textVerticalAlign: label.__verticalAlign || textVerticalAlign,
              textAlign: label.__textAlign || textAlign
            },
            position: textPosition,
            scale: [invScale, invScale]
          });
        }
      }
      function Line(lineData, idx, seriesScope) {
        graphic.Group.call(this);
        this._createLine(lineData, idx, seriesScope);
      }
      var lineProto = Line.prototype;
      lineProto.beforeUpdate = updateSymbolAndLabelBeforeLineUpdate;
      lineProto._createLine = function(lineData, idx, seriesScope) {
        var seriesModel = lineData.hostModel;
        var linePoints = lineData.getItemLayout(idx);
        var line = createLine(linePoints);
        line.shape.percent = 0;
        graphic.initProps(line, {shape: {percent: 1}}, seriesModel, idx);
        this.add(line);
        var label = new graphic.Text({name: 'label'});
        this.add(label);
        zrUtil.each(SYMBOL_CATEGORIES, function(symbolCategory) {
          var symbol = createSymbol(symbolCategory, lineData, idx);
          this.add(symbol);
          this[makeSymbolTypeKey(symbolCategory)] = lineData.getItemVisual(idx, symbolCategory);
        }, this);
        this._updateCommonStl(lineData, idx, seriesScope);
      };
      lineProto.updateData = function(lineData, idx, seriesScope) {
        var seriesModel = lineData.hostModel;
        var line = this.childOfName('line');
        var linePoints = lineData.getItemLayout(idx);
        var target = {shape: {}};
        setLinePoints(target.shape, linePoints);
        graphic.updateProps(line, target, seriesModel, idx);
        zrUtil.each(SYMBOL_CATEGORIES, function(symbolCategory) {
          var symbolType = lineData.getItemVisual(idx, symbolCategory);
          var key = makeSymbolTypeKey(symbolCategory);
          if (this[key] !== symbolType) {
            this.remove(this.childOfName(symbolCategory));
            var symbol = createSymbol(symbolCategory, lineData, idx);
            this.add(symbol);
          }
          this[key] = symbolType;
        }, this);
        this._updateCommonStl(lineData, idx, seriesScope);
      };
      lineProto._updateCommonStl = function(lineData, idx, seriesScope) {
        var seriesModel = lineData.hostModel;
        var line = this.childOfName('line');
        var lineStyle = seriesScope && seriesScope.lineStyle;
        var hoverLineStyle = seriesScope && seriesScope.hoverLineStyle;
        var labelModel = seriesScope && seriesScope.labelModel;
        var hoverLabelModel = seriesScope && seriesScope.hoverLabelModel;
        if (!seriesScope || lineData.hasItemOption) {
          var itemModel = lineData.getItemModel(idx);
          lineStyle = itemModel.getModel('lineStyle.normal').getLineStyle();
          hoverLineStyle = itemModel.getModel('lineStyle.emphasis').getLineStyle();
          labelModel = itemModel.getModel('label.normal');
          hoverLabelModel = itemModel.getModel('label.emphasis');
        }
        var visualColor = lineData.getItemVisual(idx, 'color');
        var visualOpacity = zrUtil.retrieve(lineData.getItemVisual(idx, 'opacity'), lineStyle.opacity, 1);
        line.useStyle(zrUtil.defaults({
          strokeNoScale: true,
          fill: 'none',
          stroke: visualColor,
          opacity: visualOpacity
        }, lineStyle));
        line.hoverStyle = hoverLineStyle;
        zrUtil.each(SYMBOL_CATEGORIES, function(symbolCategory) {
          var symbol = this.childOfName(symbolCategory);
          if (symbol) {
            symbol.setColor(visualColor);
            symbol.setStyle({opacity: visualOpacity});
          }
        }, this);
        var showLabel = labelModel.getShallow('show');
        var hoverShowLabel = hoverLabelModel.getShallow('show');
        var label = this.childOfName('label');
        var defaultLabelColor;
        var defaultText;
        if (showLabel || hoverShowLabel) {
          var rawVal = seriesModel.getRawValue(idx);
          defaultText = rawVal == null ? defaultText = lineData.getName(idx) : isFinite(rawVal) ? numberUtil.round(rawVal) : rawVal;
          defaultLabelColor = visualColor || '#000';
        }
        if (showLabel) {
          var textStyleModel = labelModel.getModel('textStyle');
          label.setStyle({
            text: zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'normal', lineData.dataType), defaultText),
            textFont: textStyleModel.getFont(),
            fill: textStyleModel.getTextColor() || defaultLabelColor
          });
          label.__textAlign = textStyleModel.get('align');
          label.__verticalAlign = textStyleModel.get('baseline');
          label.__position = labelModel.get('position');
        } else {
          label.setStyle('text', '');
        }
        if (hoverShowLabel) {
          var textStyleHoverModel = hoverLabelModel.getModel('textStyle');
          label.hoverStyle = {
            text: zrUtil.retrieve(seriesModel.getFormattedLabel(idx, 'emphasis', lineData.dataType), defaultText),
            textFont: textStyleHoverModel.getFont(),
            fill: textStyleHoverModel.getTextColor() || defaultLabelColor
          };
        } else {
          label.hoverStyle = {text: ''};
        }
        label.ignore = !showLabel && !hoverShowLabel;
        graphic.setHoverStyle(this);
      };
      lineProto.updateLayout = function(lineData, idx) {
        this.setLinePoints(lineData.getItemLayout(idx));
      };
      lineProto.setLinePoints = function(points) {
        var linePath = this.childOfName('line');
        setLinePoints(linePath.shape, points);
        linePath.dirty();
      };
      zrUtil.inherits(Line, graphic.Group);
      module.exports = Line;
    }, function(module, exports, __webpack_require__) {
      var graphic = __webpack_require__(43);
      var vec2 = __webpack_require__(10);
      var straightLineProto = graphic.Line.prototype;
      var bezierCurveProto = graphic.BezierCurve.prototype;
      function isLine(shape) {
        return isNaN(+shape.cpx1) || isNaN(+shape.cpy1);
      }
      module.exports = graphic.extendShape({
        type: 'ec-line',
        style: {
          stroke: '#000',
          fill: null
        },
        shape: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          percent: 1,
          cpx1: null,
          cpy1: null
        },
        buildPath: function(ctx, shape) {
          (isLine(shape) ? straightLineProto : bezierCurveProto).buildPath(ctx, shape);
        },
        pointAt: function(t) {
          return isLine(this.shape) ? straightLineProto.pointAt.call(this, t) : bezierCurveProto.pointAt.call(this, t);
        },
        tangentAt: function(t) {
          var shape = this.shape;
          var p = isLine(shape) ? [shape.x2 - shape.x1, shape.y2 - shape.y1] : bezierCurveProto.tangentAt.call(this, t);
          return vec2.normalize(p, p);
        }
      });
    }, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , function(module, exports, __webpack_require__) {
      var Eventful = __webpack_require__(33);
      var zrUtil = __webpack_require__(4);
      var BoundingRect = __webpack_require__(9);
      var graphic = __webpack_require__(43);
      var interactionMutex = __webpack_require__(178);
      var DataDiffer = __webpack_require__(99);
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
        if (true) {
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
        if (true) {
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
          if (true) {
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
          if (true) {
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
          if (true) {
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
          if (true) {
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
      module.exports = BrushController;
    }, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , function(module, exports) {
      var process = module.exports = {};
      var cachedSetTimeout;
      var cachedClearTimeout;
      function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
      }
      function defaultClearTimeout() {
        throw new Error('clearTimeout has not been defined');
      }
      (function() {
        try {
          if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
          } else {
            cachedSetTimeout = defaultSetTimout;
          }
        } catch (e) {
          cachedSetTimeout = defaultSetTimout;
        }
        try {
          if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
          } else {
            cachedClearTimeout = defaultClearTimeout;
          }
        } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
        }
      }());
      function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
          return setTimeout(fun, 0);
        }
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
        }
        try {
          return cachedSetTimeout(fun, 0);
        } catch (e) {
          try {
            return cachedSetTimeout.call(null, fun, 0);
          } catch (e) {
            return cachedSetTimeout.call(this, fun, 0);
          }
        }
      }
      function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
          return clearTimeout(marker);
        }
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
        }
        try {
          return cachedClearTimeout(marker);
        } catch (e) {
          try {
            return cachedClearTimeout.call(null, marker);
          } catch (e) {
            return cachedClearTimeout.call(this, marker);
          }
        }
      }
      var queue = [];
      var draining = false;
      var currentQueue;
      var queueIndex = -1;
      function cleanUpNextTick() {
        if (!draining || !currentQueue) {
          return;
        }
        draining = false;
        if (currentQueue.length) {
          queue = currentQueue.concat(queue);
        } else {
          queueIndex = -1;
        }
        if (queue.length) {
          drainQueue();
        }
      }
      function drainQueue() {
        if (draining) {
          return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
        var len = queue.length;
        while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
            if (currentQueue) {
              currentQueue[queueIndex].run();
            }
          }
          queueIndex = -1;
          len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
      }
      process.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
          }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
        }
      };
      function Item(fun, array) {
        this.fun = fun;
        this.array = array;
      }
      Item.prototype.run = function() {
        this.fun.apply(null, this.array);
      };
      process.title = 'browser';
      process.browser = true;
      process.env = {};
      process.argv = [];
      process.version = '';
      process.versions = {};
      function noop() {}
      process.on = noop;
      process.addListener = noop;
      process.once = noop;
      process.off = noop;
      process.removeListener = noop;
      process.removeAllListeners = noop;
      process.emit = noop;
      process.binding = function(name) {
        throw new Error('process.binding is not supported');
      };
      process.cwd = function() {
        return '/';
      };
      process.chdir = function(dir) {
        throw new Error('process.chdir is not supported');
      };
      process.umask = function() {
        return 0;
      };
    }, , , function(module, exports, __webpack_require__) {
      var echarts = __webpack_require__(1);
      var zrUtil = __webpack_require__(4);
      var modelUtil = __webpack_require__(5);
      var graphicUtil = __webpack_require__(43);
      var layoutUtil = __webpack_require__(21);
      echarts.registerPreprocessor(function(option) {
        var graphicOption = option && option.graphic;
        if (zrUtil.isArray(graphicOption)) {
          if (!graphicOption[0] || !graphicOption[0].elements) {
            option.graphic = [{elements: graphicOption}];
          } else {
            option.graphic = [option.graphic[0]];
          }
        } else if (graphicOption && !graphicOption.elements) {
          option.graphic = [{elements: [graphicOption]}];
        }
      });
      var GraphicModel = echarts.extendComponentModel({
        type: 'graphic',
        defaultOption: {
          elements: [],
          parentId: null
        },
        _elOptionsToUpdate: null,
        mergeOption: function(option) {
          var elements = this.option.elements;
          this.option.elements = null;
          GraphicModel.superApply(this, 'mergeOption', arguments);
          this.option.elements = elements;
        },
        optionUpdated: function(newOption, isInit) {
          var thisOption = this.option;
          var newList = (isInit ? thisOption : newOption).elements;
          var existList = thisOption.elements = isInit ? [] : thisOption.elements;
          var flattenedList = [];
          this._flatten(newList, flattenedList);
          var mappingResult = modelUtil.mappingToExists(existList, flattenedList);
          modelUtil.makeIdAndName(mappingResult);
          var elOptionsToUpdate = this._elOptionsToUpdate = [];
          zrUtil.each(mappingResult, function(resultItem, index) {
            var existElOption = resultItem.exist;
            var newElOption = resultItem.option;
            if (true) {
              zrUtil.assert(zrUtil.isObject(newElOption) || existElOption, 'Empty graphic option definition');
            }
            if (!newElOption) {
              return;
            }
            newElOption.id = resultItem.keyInfo.id;
            var newElParentId = newElOption.parentId;
            var newElParentOption = newElOption.parentOption;
            var existElParentId = existElOption && existElOption.parentId;
            !newElOption.type && existElOption && (newElOption.type = existElOption.type);
            newElOption.parentId = newElParentId ? newElParentId : newElParentOption ? newElParentOption.id : existElParentId ? existElParentId : null;
            newElOption.parentOption = null;
            elOptionsToUpdate.push(newElOption);
            var newElOptCopy = zrUtil.extend({}, newElOption);
            var $action = newElOption.$action;
            if (!$action || $action === 'merge') {
              if (existElOption) {
                if (true) {
                  var newType = newElOption.type;
                  zrUtil.assert(!newType || existElOption.type === newType, 'Please set $action: "replace" to change `type`');
                }
                zrUtil.merge(existElOption, newElOptCopy, true);
                layoutUtil.mergeLayoutParam(existElOption, newElOptCopy, {ignoreSize: true});
                layoutUtil.copyLayoutParams(newElOption, existElOption);
              } else {
                existList[index] = newElOptCopy;
              }
            } else if ($action === 'replace') {
              existList[index] = newElOptCopy;
            } else if ($action === 'remove') {
              existElOption && (existList[index] = null);
            }
            if (existList[index]) {
              existList[index].hv = newElOption.hv = [isSetLoc(newElOption, ['left', 'right']), isSetLoc(newElOption, ['top', 'bottom'])];
              if (existList[index].type === 'group') {
                existList[index].width == null && (existList[index].width = newElOption.width = 0);
                existList[index].height == null && (existList[index].height = newElOption.height = 0);
              }
            }
          }, this);
          for (var i = existList.length - 1; i >= 0; i--) {
            if (existList[i] == null) {
              existList.splice(i, 1);
            } else {
              delete existList[i].$action;
            }
          }
        },
        _flatten: function(optionList, result, parentOption) {
          zrUtil.each(optionList, function(option) {
            if (option) {
              if (parentOption) {
                option.parentOption = parentOption;
              }
              result.push(option);
              var children = option.children;
              if (option.type === 'group' && children) {
                this._flatten(children, result, option);
              }
              delete option.children;
            }
          }, this);
        },
        useElOptionsToUpdate: function() {
          var els = this._elOptionsToUpdate;
          this._elOptionsToUpdate = null;
          return els;
        }
      });
      echarts.extendComponentView({
        type: 'graphic',
        init: function(ecModel, api) {
          this._elMap = {};
          this._lastGraphicModel;
        },
        render: function(graphicModel, ecModel, api) {
          if (graphicModel !== this._lastGraphicModel) {
            this._clear();
          }
          this._lastGraphicModel = graphicModel;
          this._updateElements(graphicModel, api);
          this._relocate(graphicModel, api);
        },
        _updateElements: function(graphicModel, api) {
          var elOptionsToUpdate = graphicModel.useElOptionsToUpdate();
          if (!elOptionsToUpdate) {
            return;
          }
          var elMap = this._elMap;
          var rootGroup = this.group;
          zrUtil.each(elOptionsToUpdate, function(elOption) {
            var $action = elOption.$action;
            var id = elOption.id;
            var existEl = elMap[id];
            var parentId = elOption.parentId;
            var targetElParent = parentId != null ? elMap[parentId] : rootGroup;
            if (elOption.hv && elOption.hv[1] && elOption.type === 'text') {
              elOption.style = zrUtil.defaults({textBaseline: 'middle'}, elOption.style);
              elOption.style.textVerticalAlign = null;
            }
            var elOptionCleaned = getCleanedElOption(elOption);
            if (true) {
              existEl && zrUtil.assert(targetElParent === existEl.parent, 'Changing parent is not supported.');
            }
            if (!$action || $action === 'merge') {
              existEl ? existEl.attr(elOptionCleaned) : createEl(id, targetElParent, elOptionCleaned, elMap);
            } else if ($action === 'replace') {
              removeEl(existEl, elMap);
              createEl(id, targetElParent, elOptionCleaned, elMap);
            } else if ($action === 'remove') {
              removeEl(existEl, elMap);
            }
            if (elMap[id]) {
              elMap[id].__ecGraphicWidth = elOption.width;
              elMap[id].__ecGraphicHeight = elOption.height;
            }
          });
        },
        _relocate: function(graphicModel, api) {
          var elOptions = graphicModel.option.elements;
          var rootGroup = this.group;
          var elMap = this._elMap;
          for (var i = elOptions.length - 1; i >= 0; i--) {
            var elOption = elOptions[i];
            var el = elMap[elOption.id];
            if (!el) {
              continue;
            }
            var parentEl = el.parent;
            var containerInfo = parentEl === rootGroup ? {
              width: api.getWidth(),
              height: api.getHeight()
            } : {
              width: parentEl.__ecGraphicWidth || 0,
              height: parentEl.__ecGraphicHeight || 0
            };
            layoutUtil.positionElement(el, elOption, containerInfo, null, {
              hv: elOption.hv,
              boundingMode: elOption.bounding
            });
          }
        },
        _clear: function() {
          var elMap = this._elMap;
          zrUtil.each(elMap, function(el) {
            removeEl(el, elMap);
          });
          this._elMap = {};
        },
        dispose: function() {
          this._clear();
        }
      });
      function createEl(id, targetElParent, elOption, elMap) {
        var graphicType = elOption.type;
        if (true) {
          zrUtil.assert(graphicType, 'graphic type MUST be set');
        }
        var Clz = graphicUtil[graphicType.charAt(0).toUpperCase() + graphicType.slice(1)];
        if (true) {
          zrUtil.assert(Clz, 'graphic type can not be found');
        }
        var el = new Clz(elOption);
        targetElParent.add(el);
        elMap[id] = el;
        el.__ecGraphicId = id;
      }
      function removeEl(existEl, elMap) {
        var existElParent = existEl && existEl.parent;
        if (existElParent) {
          existEl.type === 'group' && existEl.traverse(function(el) {
            removeEl(el, elMap);
          });
          delete elMap[existEl.__ecGraphicId];
          existElParent.remove(existEl);
        }
      }
      function getCleanedElOption(elOption) {
        elOption = zrUtil.extend({}, elOption);
        zrUtil.each(['id', 'parentId', '$action', 'hv', 'bounding'].concat(layoutUtil.LOCATION_PARAMS), function(name) {
          delete elOption[name];
        });
        return elOption;
      }
      function isSetLoc(obj, props) {
        var isSet;
        zrUtil.each(props, function(prop) {
          obj[prop] != null && obj[prop] !== 'auto' && (isSet = true);
        });
        return isSet;
      }
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(294);
      __webpack_require__(295);
      __webpack_require__(296);
      var echarts = __webpack_require__(1);
      echarts.registerProcessor(__webpack_require__(298));
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var Model = __webpack_require__(12);
      var LegendModel = __webpack_require__(1).extendComponentModel({
        type: 'legend',
        dependencies: ['series'],
        layoutMode: {
          type: 'box',
          ignoreSize: true
        },
        init: function(option, parentModel, ecModel) {
          this.mergeDefaultAndTheme(option, ecModel);
          option.selected = option.selected || {};
        },
        mergeOption: function(option) {
          LegendModel.superCall(this, 'mergeOption', option);
        },
        optionUpdated: function() {
          this._updateData(this.ecModel);
          var legendData = this._data;
          if (legendData[0] && this.get('selectedMode') === 'single') {
            var hasSelected = false;
            for (var i = 0; i < legendData.length; i++) {
              var name = legendData[i].get('name');
              if (this.isSelected(name)) {
                this.select(name);
                hasSelected = true;
                break;
              }
            }
            !hasSelected && this.select(legendData[0].get('name'));
          }
        },
        _updateData: function(ecModel) {
          var legendData = zrUtil.map(this.get('data') || [], function(dataItem) {
            if (typeof dataItem === 'string' || typeof dataItem === 'number') {
              dataItem = {name: dataItem};
            }
            return new Model(dataItem, this, this.ecModel);
          }, this);
          this._data = legendData;
          var availableNames = zrUtil.map(ecModel.getSeries(), function(series) {
            return series.name;
          });
          ecModel.eachSeries(function(seriesModel) {
            if (seriesModel.legendDataProvider) {
              var data = seriesModel.legendDataProvider();
              availableNames = availableNames.concat(data.mapArray(data.getName));
            }
          });
          this._availableNames = availableNames;
        },
        getData: function() {
          return this._data;
        },
        select: function(name) {
          var selected = this.option.selected;
          var selectedMode = this.get('selectedMode');
          if (selectedMode === 'single') {
            var data = this._data;
            zrUtil.each(data, function(dataItem) {
              selected[dataItem.get('name')] = false;
            });
          }
          selected[name] = true;
        },
        unSelect: function(name) {
          if (this.get('selectedMode') !== 'single') {
            this.option.selected[name] = false;
          }
        },
        toggleSelected: function(name) {
          var selected = this.option.selected;
          if (!selected.hasOwnProperty(name)) {
            selected[name] = true;
          }
          this[selected[name] ? 'unSelect' : 'select'](name);
        },
        isSelected: function(name) {
          var selected = this.option.selected;
          return !(selected.hasOwnProperty(name) && !selected[name]) && zrUtil.indexOf(this._availableNames, name) >= 0;
        },
        defaultOption: {
          zlevel: 0,
          z: 4,
          show: true,
          orient: 'horizontal',
          left: 'center',
          top: 'top',
          align: 'auto',
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: '#ccc',
          borderWidth: 0,
          padding: 5,
          itemGap: 10,
          itemWidth: 25,
          itemHeight: 14,
          inactiveColor: '#ccc',
          textStyle: {color: '#333'},
          selectedMode: true,
          tooltip: {show: false}
        }
      });
      module.exports = LegendModel;
    }, function(module, exports, __webpack_require__) {
      var echarts = __webpack_require__(1);
      var zrUtil = __webpack_require__(4);
      function legendSelectActionHandler(methodName, payload, ecModel) {
        var selectedMap = {};
        var isToggleSelect = methodName === 'toggleSelected';
        var isSelected;
        ecModel.eachComponent('legend', function(legendModel) {
          if (isToggleSelect && isSelected != null) {
            legendModel[isSelected ? 'select' : 'unSelect'](payload.name);
          } else {
            legendModel[methodName](payload.name);
            isSelected = legendModel.isSelected(payload.name);
          }
          var legendData = legendModel.getData();
          zrUtil.each(legendData, function(model) {
            var name = model.get('name');
            if (name === '\n' || name === '') {
              return;
            }
            var isItemSelected = legendModel.isSelected(name);
            if (name in selectedMap) {
              selectedMap[name] = selectedMap[name] && isItemSelected;
            } else {
              selectedMap[name] = isItemSelected;
            }
          });
        });
        return {
          name: payload.name,
          selected: selectedMap
        };
      }
      echarts.registerAction('legendToggleSelect', 'legendselectchanged', zrUtil.curry(legendSelectActionHandler, 'toggleSelected'));
      echarts.registerAction('legendSelect', 'legendselected', zrUtil.curry(legendSelectActionHandler, 'select'));
      echarts.registerAction('legendUnSelect', 'legendunselected', zrUtil.curry(legendSelectActionHandler, 'unSelect'));
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var symbolCreator = __webpack_require__(107);
      var graphic = __webpack_require__(43);
      var listComponentHelper = __webpack_require__(297);
      var curry = zrUtil.curry;
      function dispatchSelectAction(name, api) {
        api.dispatchAction({
          type: 'legendToggleSelect',
          name: name
        });
      }
      function dispatchHighlightAction(seriesModel, dataName, api) {
        var el = api.getZr().storage.getDisplayList()[0];
        if (!(el && el.useHoverLayer)) {
          seriesModel.get('legendHoverLink') && api.dispatchAction({
            type: 'highlight',
            seriesName: seriesModel.name,
            name: dataName
          });
        }
      }
      function dispatchDownplayAction(seriesModel, dataName, api) {
        var el = api.getZr().storage.getDisplayList()[0];
        if (!(el && el.useHoverLayer)) {
          seriesModel.get('legendHoverLink') && api.dispatchAction({
            type: 'downplay',
            seriesName: seriesModel.name,
            name: dataName
          });
        }
      }
      module.exports = __webpack_require__(1).extendComponentView({
        type: 'legend',
        init: function() {
          this._symbolTypeStore = {};
        },
        render: function(legendModel, ecModel, api) {
          var group = this.group;
          group.removeAll();
          if (!legendModel.get('show')) {
            return;
          }
          var selectMode = legendModel.get('selectedMode');
          var itemAlign = legendModel.get('align');
          if (itemAlign === 'auto') {
            itemAlign = (legendModel.get('left') === 'right' && legendModel.get('orient') === 'vertical') ? 'right' : 'left';
          }
          var legendDrawedMap = {};
          zrUtil.each(legendModel.getData(), function(itemModel) {
            var name = itemModel.get('name');
            if (name === '' || name === '\n') {
              group.add(new graphic.Group({newline: true}));
              return;
            }
            var seriesModel = ecModel.getSeriesByName(name)[0];
            if (legendDrawedMap[name]) {
              return;
            }
            if (seriesModel) {
              var data = seriesModel.getData();
              var color = data.getVisual('color');
              if (typeof color === 'function') {
                color = color(seriesModel.getDataParams(0));
              }
              var legendSymbolType = data.getVisual('legendSymbol') || 'roundRect';
              var symbolType = data.getVisual('symbol');
              var itemGroup = this._createItem(name, itemModel, legendModel, legendSymbolType, symbolType, itemAlign, color, selectMode);
              itemGroup.on('click', curry(dispatchSelectAction, name, api)).on('mouseover', curry(dispatchHighlightAction, seriesModel, null, api)).on('mouseout', curry(dispatchDownplayAction, seriesModel, null, api));
              legendDrawedMap[name] = true;
            } else {
              ecModel.eachRawSeries(function(seriesModel) {
                if (legendDrawedMap[name]) {
                  return;
                }
                if (seriesModel.legendDataProvider) {
                  var data = seriesModel.legendDataProvider();
                  var idx = data.indexOfName(name);
                  if (idx < 0) {
                    return;
                  }
                  var color = data.getItemVisual(idx, 'color');
                  var legendSymbolType = 'roundRect';
                  var itemGroup = this._createItem(name, itemModel, legendModel, legendSymbolType, null, itemAlign, color, selectMode);
                  itemGroup.on('click', curry(dispatchSelectAction, name, api)).on('mouseover', curry(dispatchHighlightAction, seriesModel, name, api)).on('mouseout', curry(dispatchDownplayAction, seriesModel, name, api));
                  legendDrawedMap[name] = true;
                }
              }, this);
            }
            if (true) {
              if (!legendDrawedMap[name]) {
                console.warn(name + ' series not exists. Legend data should be same with series name or data name.');
              }
            }
          }, this);
          listComponentHelper.layout(group, legendModel, api);
          listComponentHelper.addBackground(group, legendModel);
        },
        _createItem: function(name, itemModel, legendModel, legendSymbolType, symbolType, itemAlign, color, selectMode) {
          var itemWidth = legendModel.get('itemWidth');
          var itemHeight = legendModel.get('itemHeight');
          var inactiveColor = legendModel.get('inactiveColor');
          var isSelected = legendModel.isSelected(name);
          var itemGroup = new graphic.Group();
          var textStyleModel = itemModel.getModel('textStyle');
          var itemIcon = itemModel.get('icon');
          var tooltipModel = itemModel.getModel('tooltip');
          var legendGlobalTooltipModel = tooltipModel.parentModel;
          legendSymbolType = itemIcon || legendSymbolType;
          itemGroup.add(symbolCreator.createSymbol(legendSymbolType, 0, 0, itemWidth, itemHeight, isSelected ? color : inactiveColor));
          if (!itemIcon && symbolType && ((symbolType !== legendSymbolType) || symbolType == 'none')) {
            var size = itemHeight * 0.8;
            if (symbolType === 'none') {
              symbolType = 'circle';
            }
            itemGroup.add(symbolCreator.createSymbol(symbolType, (itemWidth - size) / 2, (itemHeight - size) / 2, size, size, isSelected ? color : inactiveColor));
          }
          var textX = itemAlign === 'left' ? itemWidth + 5 : -5;
          var textAlign = itemAlign;
          var formatter = legendModel.get('formatter');
          var content = name;
          if (typeof formatter === 'string' && formatter) {
            content = formatter.replace('{name}', name != null ? name : '');
          } else if (typeof formatter === 'function') {
            content = formatter(name);
          }
          var text = new graphic.Text({style: {
              text: content,
              x: textX,
              y: itemHeight / 2,
              fill: isSelected ? textStyleModel.getTextColor() : inactiveColor,
              textFont: textStyleModel.getFont(),
              textAlign: textAlign,
              textVerticalAlign: 'middle'
            }});
          itemGroup.add(text);
          var hitRect = new graphic.Rect({
            shape: itemGroup.getBoundingRect(),
            invisible: true,
            tooltip: tooltipModel.get('show') ? zrUtil.extend({
              content: name,
              formatter: legendGlobalTooltipModel.get('formatter', true) || function() {
                return name;
              },
              formatterParams: {
                componentType: 'legend',
                legendIndex: legendModel.componentIndex,
                name: name,
                $vars: ['name']
              }
            }, tooltipModel.option) : null
          });
          itemGroup.add(hitRect);
          itemGroup.eachChild(function(child) {
            child.silent = true;
          });
          hitRect.silent = !selectMode;
          this.group.add(itemGroup);
          graphic.setHoverStyle(itemGroup);
          return itemGroup;
        }
      });
    }, function(module, exports, __webpack_require__) {
      var layout = __webpack_require__(21);
      var formatUtil = __webpack_require__(6);
      var graphic = __webpack_require__(43);
      function positionGroup(group, model, api) {
        layout.positionElement(group, model.getBoxLayoutParams(), {
          width: api.getWidth(),
          height: api.getHeight()
        }, model.get('padding'));
      }
      module.exports = {
        layout: function(group, componentModel, api) {
          var rect = layout.getLayoutRect(componentModel.getBoxLayoutParams(), {
            width: api.getWidth(),
            height: api.getHeight()
          }, componentModel.get('padding'));
          layout.box(componentModel.get('orient'), group, componentModel.get('itemGap'), rect.width, rect.height);
          positionGroup(group, componentModel, api);
        },
        addBackground: function(group, componentModel) {
          var padding = formatUtil.normalizeCssArray(componentModel.get('padding'));
          var boundingRect = group.getBoundingRect();
          var style = componentModel.getItemStyle(['color', 'opacity']);
          style.fill = componentModel.get('backgroundColor');
          var rect = new graphic.Rect({
            shape: {
              x: boundingRect.x - padding[3],
              y: boundingRect.y - padding[0],
              width: boundingRect.width + padding[1] + padding[3],
              height: boundingRect.height + padding[0] + padding[2]
            },
            style: style,
            silent: true,
            z2: -1
          });
          graphic.subPixelOptimizeRect(rect);
          group.add(rect);
        }
      };
    }, function(module, exports) {
      module.exports = function(ecModel) {
        var legendModels = ecModel.findComponents({mainType: 'legend'});
        if (legendModels && legendModels.length) {
          ecModel.filterSeries(function(series) {
            for (var i = 0; i < legendModels.length; i++) {
              if (!legendModels[i].isSelected(series.name)) {
                return false;
              }
            }
            return true;
          });
        }
      };
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(300);
      __webpack_require__(301);
      __webpack_require__(1).registerAction({
        type: 'showTip',
        event: 'showTip',
        update: 'tooltip:manuallyShowTip'
      }, function() {});
      __webpack_require__(1).registerAction({
        type: 'hideTip',
        event: 'hideTip',
        update: 'tooltip:manuallyHideTip'
      }, function() {});
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(1).extendComponentModel({
        type: 'tooltip',
        defaultOption: {
          zlevel: 0,
          z: 8,
          show: true,
          showContent: true,
          trigger: 'item',
          triggerOn: 'mousemove',
          alwaysShowContent: false,
          confine: false,
          showDelay: 0,
          hideDelay: 100,
          transitionDuration: 0.4,
          enterable: false,
          backgroundColor: 'rgba(50,50,50,0.7)',
          borderColor: '#333',
          borderRadius: 4,
          borderWidth: 0,
          padding: 5,
          extraCssText: '',
          axisPointer: {
            type: 'line',
            axis: 'auto',
            animation: true,
            animationDurationUpdate: 200,
            animationEasingUpdate: 'exponentialOut',
            lineStyle: {
              color: '#555',
              width: 1,
              type: 'solid'
            },
            crossStyle: {
              color: '#555',
              width: 1,
              type: 'dashed',
              textStyle: {}
            },
            shadowStyle: {color: 'rgba(150,150,150,0.3)'}
          },
          textStyle: {
            color: '#fff',
            fontSize: 14
          }
        }
      });
    }, function(module, exports, __webpack_require__) {
      var TooltipContent = __webpack_require__(302);
      var graphic = __webpack_require__(43);
      var zrUtil = __webpack_require__(4);
      var formatUtil = __webpack_require__(6);
      var numberUtil = __webpack_require__(7);
      var modelUtil = __webpack_require__(5);
      var parsePercent = numberUtil.parsePercent;
      var env = __webpack_require__(2);
      var Model = __webpack_require__(12);
      function dataEqual(a, b) {
        if (!a || !b) {
          return false;
        }
        var round = numberUtil.round;
        return round(a[0]) === round(b[0]) && round(a[1]) === round(b[1]);
      }
      function makeLineShape(x1, y1, x2, y2) {
        return {
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2
        };
      }
      function makeRectShape(x, y, width, height) {
        return {
          x: x,
          y: y,
          width: width,
          height: height
        };
      }
      function makeSectorShape(cx, cy, r0, r, startAngle, endAngle) {
        return {
          cx: cx,
          cy: cy,
          r0: r0,
          r: r,
          startAngle: startAngle,
          endAngle: endAngle,
          clockwise: true
        };
      }
      function refixTooltipPosition(x, y, el, viewWidth, viewHeight) {
        var width = el.clientWidth;
        var height = el.clientHeight;
        var gap = 20;
        if (x + width + gap > viewWidth) {
          x -= width + gap;
        } else {
          x += gap;
        }
        if (y + height + gap > viewHeight) {
          y -= height + gap;
        } else {
          y += gap;
        }
        return [x, y];
      }
      function confineTooltipPosition(x, y, el, viewWidth, viewHeight) {
        var width = el.clientWidth;
        var height = el.clientHeight;
        x = Math.min(x + width, viewWidth) - width;
        y = Math.min(y + height, viewHeight) - height;
        x = Math.max(x, 0);
        y = Math.max(y, 0);
        return [x, y];
      }
      function calcTooltipPosition(position, rect, dom) {
        var domWidth = dom.clientWidth;
        var domHeight = dom.clientHeight;
        var gap = 5;
        var x = 0;
        var y = 0;
        var rectWidth = rect.width;
        var rectHeight = rect.height;
        switch (position) {
          case 'inside':
            x = rect.x + rectWidth / 2 - domWidth / 2;
            y = rect.y + rectHeight / 2 - domHeight / 2;
            break;
          case 'top':
            x = rect.x + rectWidth / 2 - domWidth / 2;
            y = rect.y - domHeight - gap;
            break;
          case 'bottom':
            x = rect.x + rectWidth / 2 - domWidth / 2;
            y = rect.y + rectHeight + gap;
            break;
          case 'left':
            x = rect.x - domWidth - gap;
            y = rect.y + rectHeight / 2 - domHeight / 2;
            break;
          case 'right':
            x = rect.x + rectWidth + gap;
            y = rect.y + rectHeight / 2 - domHeight / 2;
        }
        return [x, y];
      }
      function updatePosition(positionExpr, x, y, confine, content, params, el, api) {
        var viewWidth = api.getWidth();
        var viewHeight = api.getHeight();
        var rect = el && el.getBoundingRect().clone();
        el && rect.applyTransform(el.transform);
        if (typeof positionExpr === 'function') {
          positionExpr = positionExpr([x, y], params, content.el, rect);
        }
        if (zrUtil.isArray(positionExpr)) {
          x = parsePercent(positionExpr[0], viewWidth);
          y = parsePercent(positionExpr[1], viewHeight);
        } else if (typeof positionExpr === 'string' && el) {
          var pos = calcTooltipPosition(positionExpr, rect, content.el);
          x = pos[0];
          y = pos[1];
        } else {
          var pos = refixTooltipPosition(x, y, content.el, viewWidth, viewHeight);
          x = pos[0];
          y = pos[1];
        }
        if (confine) {
          var pos = confineTooltipPosition(x, y, content.el, viewWidth, viewHeight);
          x = pos[0];
          y = pos[1];
        }
        content.moveTo(x, y);
      }
      function ifSeriesSupportAxisTrigger(seriesModel) {
        var coordSys = seriesModel.coordinateSystem;
        var trigger = seriesModel.get('tooltip.trigger', true);
        return !(!coordSys || (coordSys.type !== 'cartesian2d' && coordSys.type !== 'polar' && coordSys.type !== 'singleAxis') || trigger === 'item');
      }
      __webpack_require__(1).extendComponentView({
        type: 'tooltip',
        _axisPointers: {},
        init: function(ecModel, api) {
          if (env.node) {
            return;
          }
          var tooltipContent = new TooltipContent(api.getDom(), api);
          this._tooltipContent = tooltipContent;
        },
        render: function(tooltipModel, ecModel, api) {
          if (env.node) {
            return;
          }
          this.group.removeAll();
          this._axisPointers = {};
          this._tooltipModel = tooltipModel;
          this._ecModel = ecModel;
          this._api = api;
          this._lastHover = {};
          var tooltipContent = this._tooltipContent;
          tooltipContent.update();
          tooltipContent.enterable = tooltipModel.get('enterable');
          this._alwaysShowContent = tooltipModel.get('alwaysShowContent');
          this._seriesGroupByAxis = this._prepareAxisTriggerData(tooltipModel, ecModel);
          var crossText = this._crossText;
          if (crossText) {
            this.group.add(crossText);
          }
          var triggerOn = tooltipModel.get('triggerOn');
          if (this._lastX != null && this._lastY != null && triggerOn !== 'none') {
            var self = this;
            clearTimeout(this._refreshUpdateTimeout);
            this._refreshUpdateTimeout = setTimeout(function() {
              self.manuallyShowTip(tooltipModel, ecModel, api, {
                x: self._lastX,
                y: self._lastY
              });
            });
          }
          var zr = this._api.getZr();
          zr.off('click', this._tryShow);
          zr.off('mousemove', this._mousemove);
          zr.off('mouseout', this._hide);
          zr.off('globalout', this._hide);
          if (triggerOn === 'click') {
            zr.on('click', this._tryShow, this);
          } else if (triggerOn === 'mousemove') {
            zr.on('mousemove', this._mousemove, this);
            zr.on('mouseout', this._hide, this);
            zr.on('globalout', this._hide, this);
          }
        },
        _mousemove: function(e) {
          var showDelay = this._tooltipModel.get('showDelay');
          var self = this;
          clearTimeout(this._showTimeout);
          if (showDelay > 0) {
            this._showTimeout = setTimeout(function() {
              self._tryShow(e);
            }, showDelay);
          } else {
            this._tryShow(e);
          }
        },
        manuallyShowTip: function(tooltipModel, ecModel, api, payload) {
          if (payload.from === this.uid) {
            return;
          }
          var ecModel = this._ecModel;
          var seriesIndex = payload.seriesIndex;
          var seriesModel = ecModel.getSeriesByIndex(seriesIndex);
          var api = this._api;
          var isTriggerAxis = this._tooltipModel.get('trigger') === 'axis';
          function seriesHaveDataOnIndex(_series) {
            var data = _series.getData();
            var dataIndex = modelUtil.queryDataIndex(data, payload);
            if (dataIndex != null && !zrUtil.isArray(dataIndex) && data.hasValue(dataIndex)) {
              return true;
            }
          }
          if (payload.x == null || payload.y == null) {
            if (isTriggerAxis) {
              if (seriesModel && !seriesHaveDataOnIndex(seriesModel)) {
                seriesModel = null;
              }
              if (!seriesModel) {
                ecModel.eachSeries(function(_series) {
                  if (ifSeriesSupportAxisTrigger(_series) && !seriesModel) {
                    if (seriesHaveDataOnIndex(_series)) {
                      seriesModel = _series;
                    }
                  }
                });
              }
            } else {
              seriesModel = seriesModel || ecModel.getSeriesByIndex(0);
            }
            if (seriesModel) {
              var data = seriesModel.getData();
              var dataIndex = modelUtil.queryDataIndex(data, payload);
              if (dataIndex == null || zrUtil.isArray(dataIndex)) {
                return;
              }
              var el = data.getItemGraphicEl(dataIndex);
              var cx;
              var cy;
              var coordSys = seriesModel.coordinateSystem;
              if (seriesModel.getTooltipPosition) {
                var point = seriesModel.getTooltipPosition(dataIndex) || [];
                cx = point[0];
                cy = point[1];
              } else if (coordSys && coordSys.dataToPoint) {
                var point = coordSys.dataToPoint(data.getValues(zrUtil.map(coordSys.dimensions, function(dim) {
                  return seriesModel.coordDimToDataDim(dim)[0];
                }), dataIndex, true));
                cx = point && point[0];
                cy = point && point[1];
              } else if (el) {
                var rect = el.getBoundingRect().clone();
                rect.applyTransform(el.transform);
                cx = rect.x + rect.width / 2;
                cy = rect.y + rect.height / 2;
              }
              if (cx != null && cy != null) {
                this._tryShow({
                  offsetX: cx,
                  offsetY: cy,
                  position: payload.position,
                  target: el,
                  event: {}
                });
              }
            }
          } else {
            var el = api.getZr().handler.findHover(payload.x, payload.y);
            this._tryShow({
              offsetX: payload.x,
              offsetY: payload.y,
              position: payload.position,
              target: el,
              event: {}
            });
          }
        },
        manuallyHideTip: function(tooltipModel, ecModel, api, payload) {
          if (payload.from === this.uid) {
            return;
          }
          this._hide();
        },
        _prepareAxisTriggerData: function(tooltipModel, ecModel) {
          var seriesGroupByAxis = {};
          ecModel.eachSeries(function(seriesModel) {
            if (ifSeriesSupportAxisTrigger(seriesModel)) {
              var coordSys = seriesModel.coordinateSystem;
              var baseAxis;
              var key;
              if (coordSys.type === 'cartesian2d') {
                baseAxis = coordSys.getBaseAxis();
                key = baseAxis.dim + baseAxis.index;
              } else if (coordSys.type === 'singleAxis') {
                baseAxis = coordSys.getAxis();
                key = baseAxis.dim + baseAxis.type;
              } else {
                baseAxis = coordSys.getBaseAxis();
                key = baseAxis.dim + coordSys.name;
              }
              seriesGroupByAxis[key] = seriesGroupByAxis[key] || {
                coordSys: [],
                series: []
              };
              seriesGroupByAxis[key].coordSys.push(coordSys);
              seriesGroupByAxis[key].series.push(seriesModel);
            }
          }, this);
          return seriesGroupByAxis;
        },
        _tryShow: function(e) {
          var el = e.target;
          var tooltipModel = this._tooltipModel;
          var globalTrigger = tooltipModel.get('trigger');
          var ecModel = this._ecModel;
          var api = this._api;
          if (!tooltipModel) {
            return;
          }
          this._lastX = e.offsetX;
          this._lastY = e.offsetY;
          if (el && el.dataIndex != null) {
            var dataModel = el.dataModel || ecModel.getSeriesByIndex(el.seriesIndex);
            var dataIndex = el.dataIndex;
            var data = dataModel.getData();
            var itemModel = data.getItemModel(dataIndex);
            if ((itemModel.get('tooltip.trigger') || globalTrigger) === 'axis') {
              this._showAxisTooltip(tooltipModel, ecModel, e);
            } else {
              this._ticket = '';
              this._hideAxisPointer();
              this._resetLastHover();
              this._showItemTooltipContent(dataModel, dataIndex, el.dataType, e);
            }
            api.dispatchAction({
              type: 'showTip',
              from: this.uid,
              dataIndexInside: dataIndex,
              dataIndex: data.getRawIndex(dataIndex),
              seriesIndex: el.seriesIndex
            });
          } else if (el && el.tooltip) {
            var tooltipOpt = el.tooltip;
            if (typeof tooltipOpt === 'string') {
              var content = tooltipOpt;
              tooltipOpt = {
                content: content,
                formatter: content
              };
            }
            var subTooltipModel = new Model(tooltipOpt, tooltipModel);
            var defaultHtml = subTooltipModel.get('content');
            var asyncTicket = Math.random();
            this._showTooltipContent(subTooltipModel, defaultHtml, subTooltipModel.get('formatterParams') || {}, asyncTicket, e.offsetX, e.offsetY, e.position, el, api);
          } else {
            if (globalTrigger === 'item') {
              this._hide();
            } else {
              this._showAxisTooltip(tooltipModel, ecModel, e);
            }
            if (tooltipModel.get('axisPointer.type') === 'cross') {
              api.dispatchAction({
                type: 'showTip',
                from: this.uid,
                x: e.offsetX,
                y: e.offsetY
              });
            }
          }
        },
        _showAxisTooltip: function(tooltipModel, ecModel, e) {
          var axisPointerModel = tooltipModel.getModel('axisPointer');
          var axisPointerType = axisPointerModel.get('type');
          if (axisPointerType === 'cross') {
            var el = e.target;
            if (el && el.dataIndex != null) {
              var seriesModel = ecModel.getSeriesByIndex(el.seriesIndex);
              var dataIndex = el.dataIndex;
              this._showItemTooltipContent(seriesModel, dataIndex, el.dataType, e);
            }
          }
          this._showAxisPointer();
          var allNotShow = true;
          zrUtil.each(this._seriesGroupByAxis, function(seriesCoordSysSameAxis) {
            var allCoordSys = seriesCoordSysSameAxis.coordSys;
            var coordSys = allCoordSys[0];
            var point = [e.offsetX, e.offsetY];
            if (!coordSys.containPoint(point)) {
              this._hideAxisPointer(coordSys.name);
              return;
            }
            allNotShow = false;
            var dimensions = coordSys.dimensions;
            var value = coordSys.pointToData(point, true);
            point = coordSys.dataToPoint(value);
            var baseAxis = coordSys.getBaseAxis();
            var axisType = axisPointerModel.get('axis');
            if (axisType === 'auto') {
              axisType = baseAxis.dim;
            }
            if (baseAxis.isBlank() || zrUtil.eqNaN(point[0]) || zrUtil.eqNaN(point[1])) {
              this._hideAxisPointer(coordSys.name);
              return;
            }
            var contentNotChange = false;
            var lastHover = this._lastHover;
            if (axisPointerType === 'cross') {
              if (dataEqual(lastHover.data, value)) {
                contentNotChange = true;
              }
              lastHover.data = value;
            } else {
              var valIndex = zrUtil.indexOf(dimensions, axisType);
              if (lastHover.data === value[valIndex]) {
                contentNotChange = true;
              }
              lastHover.data = value[valIndex];
            }
            var enableAnimation = tooltipModel.get('animation');
            if (coordSys.type === 'cartesian2d' && !contentNotChange) {
              this._showCartesianPointer(axisPointerModel, coordSys, axisType, point, enableAnimation);
            } else if (coordSys.type === 'polar' && !contentNotChange) {
              this._showPolarPointer(axisPointerModel, coordSys, axisType, point, enableAnimation);
            } else if (coordSys.type === 'singleAxis' && !contentNotChange) {
              this._showSinglePointer(axisPointerModel, coordSys, axisType, point, enableAnimation);
            }
            if (axisPointerType !== 'cross') {
              this._dispatchAndShowSeriesTooltipContent(coordSys, seriesCoordSysSameAxis.series, point, value, contentNotChange, e.position);
            }
          }, this);
          if (!this._tooltipModel.get('show')) {
            this._hideAxisPointer();
          }
          if (allNotShow) {
            this._hide();
          }
        },
        _showCartesianPointer: function(axisPointerModel, cartesian, axisType, point, enableAnimation) {
          var self = this;
          var axisPointerType = axisPointerModel.get('type');
          var baseAxis = cartesian.getBaseAxis();
          var moveAnimation = enableAnimation && axisPointerType !== 'cross' && baseAxis.type === 'category' && baseAxis.getBandWidth() > 20;
          if (axisPointerType === 'cross') {
            moveGridLine('x', point, cartesian.getAxis('y').getGlobalExtent());
            moveGridLine('y', point, cartesian.getAxis('x').getGlobalExtent());
            this._updateCrossText(cartesian, point, axisPointerModel);
          } else {
            var otherAxis = cartesian.getAxis(axisType === 'x' ? 'y' : 'x');
            var otherExtent = otherAxis.getGlobalExtent();
            if (cartesian.type === 'cartesian2d') {
              (axisPointerType === 'line' ? moveGridLine : moveGridShadow)(axisType, point, otherExtent);
            }
          }
          function moveGridLine(axisType, point, otherExtent) {
            var targetShape = axisType === 'x' ? makeLineShape(point[0], otherExtent[0], point[0], otherExtent[1]) : makeLineShape(otherExtent[0], point[1], otherExtent[1], point[1]);
            var pointerEl = self._getPointerElement(cartesian, axisPointerModel, axisType, targetShape);
            graphic.subPixelOptimizeLine({
              shape: targetShape,
              style: pointerEl.style
            });
            moveAnimation ? graphic.updateProps(pointerEl, {shape: targetShape}, axisPointerModel) : pointerEl.attr({shape: targetShape});
          }
          function moveGridShadow(axisType, point, otherExtent) {
            var axis = cartesian.getAxis(axisType);
            var bandWidth = axis.getBandWidth();
            var span = otherExtent[1] - otherExtent[0];
            var targetShape = axisType === 'x' ? makeRectShape(point[0] - bandWidth / 2, otherExtent[0], bandWidth, span) : makeRectShape(otherExtent[0], point[1] - bandWidth / 2, span, bandWidth);
            var pointerEl = self._getPointerElement(cartesian, axisPointerModel, axisType, targetShape);
            moveAnimation ? graphic.updateProps(pointerEl, {shape: targetShape}, axisPointerModel) : pointerEl.attr({shape: targetShape});
          }
        },
        _showSinglePointer: function(axisPointerModel, single, axisType, point, enableAnimation) {
          var self = this;
          var axisPointerType = axisPointerModel.get('type');
          var moveAnimation = enableAnimation && axisPointerType !== 'cross' && single.getBaseAxis().type === 'category';
          var rect = single.getRect();
          var otherExtent = [rect.y, rect.y + rect.height];
          moveSingleLine(axisType, point, otherExtent);
          function moveSingleLine(axisType, point, otherExtent) {
            var axis = single.getAxis();
            var orient = axis.orient;
            var targetShape = orient === 'horizontal' ? makeLineShape(point[0], otherExtent[0], point[0], otherExtent[1]) : makeLineShape(otherExtent[0], point[1], otherExtent[1], point[1]);
            var pointerEl = self._getPointerElement(single, axisPointerModel, axisType, targetShape);
            moveAnimation ? graphic.updateProps(pointerEl, {shape: targetShape}, axisPointerModel) : pointerEl.attr({shape: targetShape});
          }
        },
        _showPolarPointer: function(axisPointerModel, polar, axisType, point, enableAnimation) {
          var self = this;
          var axisPointerType = axisPointerModel.get('type');
          var angleAxis = polar.getAngleAxis();
          var radiusAxis = polar.getRadiusAxis();
          var moveAnimation = enableAnimation && axisPointerType !== 'cross' && polar.getBaseAxis().type === 'category';
          if (axisPointerType === 'cross') {
            movePolarLine('angle', point, radiusAxis.getExtent());
            movePolarLine('radius', point, angleAxis.getExtent());
            this._updateCrossText(polar, point, axisPointerModel);
          } else {
            var otherAxis = polar.getAxis(axisType === 'radius' ? 'angle' : 'radius');
            var otherExtent = otherAxis.getExtent();
            (axisPointerType === 'line' ? movePolarLine : movePolarShadow)(axisType, point, otherExtent);
          }
          function movePolarLine(axisType, point, otherExtent) {
            var mouseCoord = polar.pointToCoord(point);
            var targetShape;
            if (axisType === 'angle') {
              var p1 = polar.coordToPoint([otherExtent[0], mouseCoord[1]]);
              var p2 = polar.coordToPoint([otherExtent[1], mouseCoord[1]]);
              targetShape = makeLineShape(p1[0], p1[1], p2[0], p2[1]);
            } else {
              targetShape = {
                cx: polar.cx,
                cy: polar.cy,
                r: mouseCoord[0]
              };
            }
            var pointerEl = self._getPointerElement(polar, axisPointerModel, axisType, targetShape);
            moveAnimation ? graphic.updateProps(pointerEl, {shape: targetShape}, axisPointerModel) : pointerEl.attr({shape: targetShape});
          }
          function movePolarShadow(axisType, point, otherExtent) {
            var axis = polar.getAxis(axisType);
            var bandWidth = axis.getBandWidth();
            var mouseCoord = polar.pointToCoord(point);
            var targetShape;
            var radian = Math.PI / 180;
            if (axisType === 'angle') {
              targetShape = makeSectorShape(polar.cx, polar.cy, otherExtent[0], otherExtent[1], (-mouseCoord[1] - bandWidth / 2) * radian, (-mouseCoord[1] + bandWidth / 2) * radian);
            } else {
              targetShape = makeSectorShape(polar.cx, polar.cy, mouseCoord[0] - bandWidth / 2, mouseCoord[0] + bandWidth / 2, 0, Math.PI * 2);
            }
            var pointerEl = self._getPointerElement(polar, axisPointerModel, axisType, targetShape);
            moveAnimation ? graphic.updateProps(pointerEl, {shape: targetShape}, axisPointerModel) : pointerEl.attr({shape: targetShape});
          }
        },
        _updateCrossText: function(coordSys, point, axisPointerModel) {
          var crossStyleModel = axisPointerModel.getModel('crossStyle');
          var textStyleModel = crossStyleModel.getModel('textStyle');
          var tooltipModel = this._tooltipModel;
          var text = this._crossText;
          if (!text) {
            text = this._crossText = new graphic.Text({style: {
                textAlign: 'left',
                textVerticalAlign: 'bottom'
              }});
            this.group.add(text);
          }
          var value = coordSys.pointToData(point);
          var dims = coordSys.dimensions;
          value = zrUtil.map(value, function(val, idx) {
            var axis = coordSys.getAxis(dims[idx]);
            if (axis.type === 'category' || axis.type === 'time') {
              val = axis.scale.getLabel(val);
            } else {
              val = formatUtil.addCommas(val.toFixed(axis.getPixelPrecision()));
            }
            return val;
          });
          text.setStyle({
            fill: textStyleModel.getTextColor() || crossStyleModel.get('color'),
            textFont: textStyleModel.getFont(),
            text: value.join(', '),
            x: point[0] + 5,
            y: point[1] - 5
          });
          text.z = tooltipModel.get('z');
          text.zlevel = tooltipModel.get('zlevel');
        },
        _getPointerElement: function(coordSys, pointerModel, axisType, initShape) {
          var tooltipModel = this._tooltipModel;
          var z = tooltipModel.get('z');
          var zlevel = tooltipModel.get('zlevel');
          var axisPointers = this._axisPointers;
          var coordSysName = coordSys.name;
          axisPointers[coordSysName] = axisPointers[coordSysName] || {};
          if (axisPointers[coordSysName][axisType]) {
            return axisPointers[coordSysName][axisType];
          }
          var pointerType = pointerModel.get('type');
          var styleModel = pointerModel.getModel(pointerType + 'Style');
          var isShadow = pointerType === 'shadow';
          var style = styleModel[isShadow ? 'getAreaStyle' : 'getLineStyle']();
          var elementType = coordSys.type === 'polar' ? (isShadow ? 'Sector' : (axisType === 'radius' ? 'Circle' : 'Line')) : (isShadow ? 'Rect' : 'Line');
          isShadow ? (style.stroke = null) : (style.fill = null);
          var el = axisPointers[coordSysName][axisType] = new graphic[elementType]({
            style: style,
            z: z,
            zlevel: zlevel,
            silent: true,
            shape: initShape
          });
          this.group.add(el);
          return el;
        },
        _dispatchAndShowSeriesTooltipContent: function(coordSys, seriesList, point, value, contentNotChange, positionExpr) {
          var rootTooltipModel = this._tooltipModel;
          var baseAxis = coordSys.getBaseAxis();
          var baseDimIndex = ({
            x: 1,
            radius: 1,
            single: 1
          })[baseAxis.dim] ? 0 : 1;
          if (!seriesList.length) {
            return;
          }
          var payloadBatch = zrUtil.map(seriesList, function(series) {
            return {
              seriesIndex: series.seriesIndex,
              dataIndexInside: series.getAxisTooltipDataIndex ? series.getAxisTooltipDataIndex(series.coordDimToDataDim(baseAxis.dim), value, baseAxis) : series.getData().indexOfNearest(series.coordDimToDataDim(baseAxis.dim)[0], value[baseDimIndex], false, baseAxis.type === 'category' ? 0.5 : null)
            };
          });
          var sampleSeriesIndex;
          zrUtil.each(payloadBatch, function(payload, idx) {
            if (seriesList[idx].getData().hasValue(payload.dataIndexInside)) {
              sampleSeriesIndex = idx;
            }
          });
          sampleSeriesIndex = sampleSeriesIndex || 0;
          var lastHover = this._lastHover;
          var api = this._api;
          if (lastHover.payloadBatch && !contentNotChange) {
            api.dispatchAction({
              type: 'downplay',
              batch: lastHover.payloadBatch
            });
          }
          if (!contentNotChange) {
            api.dispatchAction({
              type: 'highlight',
              batch: payloadBatch
            });
            lastHover.payloadBatch = payloadBatch;
          }
          var dataIndex = payloadBatch[sampleSeriesIndex].dataIndexInside;
          api.dispatchAction({
            type: 'showTip',
            dataIndexInside: dataIndex,
            dataIndex: seriesList[sampleSeriesIndex].getData().getRawIndex(dataIndex),
            seriesIndex: payloadBatch[sampleSeriesIndex].seriesIndex,
            from: this.uid
          });
          if (baseAxis && rootTooltipModel.get('showContent') && rootTooltipModel.get('show')) {
            var paramsList = zrUtil.map(seriesList, function(series, index) {
              return series.getDataParams(payloadBatch[index].dataIndexInside);
            });
            if (!contentNotChange) {
              var firstDataIndex = payloadBatch[sampleSeriesIndex].dataIndexInside;
              var firstLine = baseAxis.type === 'time' ? baseAxis.scale.getLabel(value[baseDimIndex]) : seriesList[sampleSeriesIndex].getData().getName(firstDataIndex);
              var defaultHtml = (firstLine ? formatUtil.encodeHTML(firstLine) + '<br />' : '') + zrUtil.map(seriesList, function(series, index) {
                return series.formatTooltip(payloadBatch[index].dataIndexInside, true);
              }).join('<br />');
              var asyncTicket = 'axis_' + coordSys.name + '_' + firstDataIndex;
              this._showTooltipContent(rootTooltipModel, defaultHtml, paramsList, asyncTicket, point[0], point[1], positionExpr, null, api);
            } else {
              updatePosition(positionExpr || rootTooltipModel.get('position'), point[0], point[1], rootTooltipModel.get('confine'), this._tooltipContent, paramsList, null, api);
            }
          }
        },
        _showItemTooltipContent: function(seriesModel, dataIndex, dataType, e) {
          var api = this._api;
          var data = seriesModel.getData(dataType);
          var itemModel = data.getItemModel(dataIndex);
          var tooltipOpt = itemModel.get('tooltip', true);
          if (typeof tooltipOpt === 'string') {
            var tooltipContent = tooltipOpt;
            tooltipOpt = {formatter: tooltipContent};
          }
          var rootTooltipModel = this._tooltipModel;
          var seriesTooltipModel = seriesModel.getModel('tooltip', rootTooltipModel);
          var tooltipModel = new Model(tooltipOpt, seriesTooltipModel, seriesTooltipModel.ecModel);
          var params = seriesModel.getDataParams(dataIndex, dataType);
          var defaultHtml = seriesModel.formatTooltip(dataIndex, false, dataType);
          var asyncTicket = 'item_' + seriesModel.name + '_' + dataIndex;
          this._showTooltipContent(tooltipModel, defaultHtml, params, asyncTicket, e.offsetX, e.offsetY, e.position, e.target, api);
        },
        _showTooltipContent: function(tooltipModel, defaultHtml, params, asyncTicket, x, y, positionExpr, target, api) {
          this._ticket = '';
          if (tooltipModel.get('showContent') && tooltipModel.get('show')) {
            var tooltipContent = this._tooltipContent;
            var confine = tooltipModel.get('confine');
            var formatter = tooltipModel.get('formatter');
            positionExpr = positionExpr || tooltipModel.get('position');
            var html = defaultHtml;
            if (formatter) {
              if (typeof formatter === 'string') {
                html = formatUtil.formatTpl(formatter, params, true);
              } else if (typeof formatter === 'function') {
                var self = this;
                var ticket = asyncTicket;
                var callback = function(cbTicket, html) {
                  if (cbTicket === self._ticket) {
                    tooltipContent.setContent(html);
                    updatePosition(positionExpr, x, y, confine, tooltipContent, params, target, api);
                  }
                };
                self._ticket = ticket;
                html = formatter(params, ticket, callback);
              }
            }
            tooltipContent.show(tooltipModel);
            tooltipContent.setContent(html);
            updatePosition(positionExpr, x, y, confine, tooltipContent, params, target, api);
          }
        },
        _showAxisPointer: function(coordSysName) {
          if (coordSysName) {
            var axisPointers = this._axisPointers[coordSysName];
            axisPointers && zrUtil.each(axisPointers, function(el) {
              el.show();
            });
          } else {
            this.group.eachChild(function(child) {
              child.show();
            });
            this.group.show();
          }
        },
        _resetLastHover: function() {
          var lastHover = this._lastHover;
          if (lastHover.payloadBatch) {
            this._api.dispatchAction({
              type: 'downplay',
              batch: lastHover.payloadBatch
            });
          }
          this._lastHover = {};
        },
        _hideAxisPointer: function(coordSysName) {
          if (coordSysName) {
            var axisPointers = this._axisPointers[coordSysName];
            axisPointers && zrUtil.each(axisPointers, function(el) {
              el.hide();
            });
          } else {
            if (this.group.children().length) {
              this.group.hide();
            }
          }
        },
        _hide: function() {
          clearTimeout(this._showTimeout);
          this._hideAxisPointer();
          this._resetLastHover();
          if (!this._alwaysShowContent) {
            this._tooltipContent.hideLater(this._tooltipModel.get('hideDelay'));
          }
          this._api.dispatchAction({
            type: 'hideTip',
            from: this.uid
          });
          this._lastX = this._lastY = null;
        },
        dispose: function(ecModel, api) {
          if (env.node) {
            return;
          }
          var zr = api.getZr();
          this._tooltipContent.hide();
          zr.off('click', this._tryShow);
          zr.off('mousemove', this._mousemove);
          zr.off('mouseout', this._hide);
          zr.off('globalout', this._hide);
        }
      });
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var zrColor = __webpack_require__(39);
      var eventUtil = __webpack_require__(88);
      var formatUtil = __webpack_require__(6);
      var each = zrUtil.each;
      var toCamelCase = formatUtil.toCamelCase;
      var env = __webpack_require__(2);
      var vendors = ['', '-webkit-', '-moz-', '-o-'];
      var gCssText = 'position:absolute;display:block;border-style:solid;white-space:nowrap;z-index:9999999;';
      function assembleTransition(duration) {
        var transitionCurve = 'cubic-bezier(0.23, 1, 0.32, 1)';
        var transitionText = 'left ' + duration + 's ' + transitionCurve + ',' + 'top ' + duration + 's ' + transitionCurve;
        return zrUtil.map(vendors, function(vendorPrefix) {
          return vendorPrefix + 'transition:' + transitionText;
        }).join(';');
      }
      function assembleFont(textStyleModel) {
        var cssText = [];
        var fontSize = textStyleModel.get('fontSize');
        var color = textStyleModel.getTextColor();
        color && cssText.push('color:' + color);
        cssText.push('font:' + textStyleModel.getFont());
        fontSize && cssText.push('line-height:' + Math.round(fontSize * 3 / 2) + 'px');
        each(['decoration', 'align'], function(name) {
          var val = textStyleModel.get(name);
          val && cssText.push('text-' + name + ':' + val);
        });
        return cssText.join(';');
      }
      function assembleCssText(tooltipModel) {
        tooltipModel = tooltipModel;
        var cssText = [];
        var transitionDuration = tooltipModel.get('transitionDuration');
        var backgroundColor = tooltipModel.get('backgroundColor');
        var textStyleModel = tooltipModel.getModel('textStyle');
        var padding = tooltipModel.get('padding');
        transitionDuration && cssText.push(assembleTransition(transitionDuration));
        if (backgroundColor) {
          if (env.canvasSupported) {
            cssText.push('background-Color:' + backgroundColor);
          } else {
            cssText.push('background-Color:#' + zrColor.toHex(backgroundColor));
            cssText.push('filter:alpha(opacity=70)');
          }
        }
        each(['width', 'color', 'radius'], function(name) {
          var borderName = 'border-' + name;
          var camelCase = toCamelCase(borderName);
          var val = tooltipModel.get(camelCase);
          val != null && cssText.push(borderName + ':' + val + (name === 'color' ? '' : 'px'));
        });
        cssText.push(assembleFont(textStyleModel));
        if (padding != null) {
          cssText.push('padding:' + formatUtil.normalizeCssArray(padding).join('px ') + 'px');
        }
        return cssText.join(';') + ';';
      }
      function TooltipContent(container, api) {
        var el = document.createElement('div');
        var zr = api.getZr();
        this.el = el;
        this._x = api.getWidth() / 2;
        this._y = api.getHeight() / 2;
        container.appendChild(el);
        this._container = container;
        this._show = false;
        this._hideTimeout;
        var self = this;
        el.onmouseenter = function() {
          if (self.enterable) {
            clearTimeout(self._hideTimeout);
            self._show = true;
          }
          self._inContent = true;
        };
        el.onmousemove = function(e) {
          e = e || window.event;
          if (!self.enterable) {
            var handler = zr.handler;
            eventUtil.normalizeEvent(container, e, true);
            handler.dispatch('mousemove', e);
          }
        };
        el.onmouseleave = function() {
          if (self.enterable) {
            if (self._show) {
              self.hideLater(self._hideDelay);
            }
          }
          self._inContent = false;
        };
      }
      TooltipContent.prototype = {
        constructor: TooltipContent,
        enterable: true,
        update: function() {
          var container = this._container;
          var stl = container.currentStyle || document.defaultView.getComputedStyle(container);
          var domStyle = container.style;
          if (domStyle.position !== 'absolute' && stl.position !== 'absolute') {
            domStyle.position = 'relative';
          }
        },
        show: function(tooltipModel) {
          clearTimeout(this._hideTimeout);
          var el = this.el;
          el.style.cssText = gCssText + assembleCssText(tooltipModel) + ';left:' + this._x + 'px;top:' + this._y + 'px;' + (tooltipModel.get('extraCssText') || '');
          el.style.display = el.innerHTML ? 'block' : 'none';
          this._show = true;
        },
        setContent: function(content) {
          var el = this.el;
          el.innerHTML = content;
          el.style.display = content ? 'block' : 'none';
        },
        moveTo: function(x, y) {
          var style = this.el.style;
          style.left = x + 'px';
          style.top = y + 'px';
          this._x = x;
          this._y = y;
        },
        hide: function() {
          this.el.style.display = 'none';
          this._show = false;
        },
        hideLater: function(time) {
          if (this._show && !(this._inContent && this.enterable)) {
            if (time) {
              this._hideDelay = time;
              this._show = false;
              this._hideTimeout = setTimeout(zrUtil.bind(this.hide, this), time);
            } else {
              this.hide();
            }
          }
        },
        isShow: function() {
          return this._show;
        }
      };
      module.exports = TooltipContent;
    }, , , , , , , , , , , , , , , , , , , , function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var graphic = __webpack_require__(43);
      var each = zrUtil.each;
      var helper = {};
      var COMPONENT_NAMES = ['geo', 'xAxis', 'yAxis'];
      var PANEL_ID_SPLIT = '--';
      var COORD_CONVERTS = ['dataToPoint', 'pointToData'];
      helper.parseOutputRanges = function(areas, coordInfoList, ecModel, rangesCoordInfo) {
        each(areas, function(area, index) {
          var panelId = area.panelId;
          if (panelId) {
            panelId = panelId.split(PANEL_ID_SPLIT);
            area[panelId[0] + 'Index'] = +panelId[1];
            var coordInfo = findCoordInfo(area, coordInfoList);
            area.coordRange = coordConvert[area.brushType](1, coordInfo, area.range);
            rangesCoordInfo && (rangesCoordInfo[index] = coordInfo);
          }
        });
      };
      helper.parseInputRanges = function(brushModel, ecModel) {
        each(brushModel.areas, function(area) {
          var coordInfo = findCoordInfo(area, brushModel.coordInfoList);
          if (true) {
            zrUtil.assert(!coordInfo || coordInfo === true || area.coordRange, 'coordRange must be specified when coord index specified.');
            zrUtil.assert(!coordInfo || coordInfo !== true || area.range, 'range must be specified.');
          }
          area.range = area.range || [];
          if (coordInfo && coordInfo !== true) {
            area.range = coordConvert[area.brushType](0, coordInfo, area.coordRange);
            area.panelId = coordInfo.panelId;
          }
        });
      };
      helper.makePanelOpts = function(coordInfoList) {
        var panelOpts = [];
        each(coordInfoList, function(coordInfo) {
          var coordSys = coordInfo.coordSys;
          var rect;
          if (coordInfo.geoIndex >= 0) {
            rect = coordSys.getBoundingRect().clone();
            rect.applyTransform(graphic.getTransform(coordSys));
          } else {
            rect = coordSys.grid.getRect().clone();
          }
          panelOpts.push({
            panelId: coordInfo.panelId,
            rect: rect
          });
        });
        return panelOpts;
      };
      helper.makeCoordInfoList = function(option, ecModel) {
        var coordInfoList = [];
        each(COMPONENT_NAMES, function(componentName) {
          var componentIndices = option[componentName + 'Index'];
          if (componentIndices == null || componentIndices === 'none') {
            return;
          }
          if (componentIndices !== 'all' && !zrUtil.isArray(componentIndices)) {
            componentIndices = [componentIndices];
          }
          ecModel.eachComponent({mainType: componentName}, function(componentModel, index) {
            if (componentIndices !== 'all' && zrUtil.indexOf(componentIndices, index) < 0) {
              return;
            }
            var grid;
            var coordSys;
            (componentName === 'xAxis' || componentName === 'yAxis') ? (grid = componentModel.axis.grid) : (coordSys = componentModel.coordinateSystem);
            var coordInfo;
            for (var i = 0,
                len = coordInfoList.length; i < len; i++) {
              var cInfo = coordInfoList[i];
              if (true) {
                zrUtil.assert(cInfo[componentName + 'Index'] != index, 'Coord should not be defined duplicately: ' + componentName + index);
              }
              if (componentName === 'yAxis' && !cInfo.yAxis && cInfo.xAxis) {
                var aCoordSys = grid.getCartesian(cInfo.xAxisIndex, index);
                if (aCoordSys) {
                  coordSys = aCoordSys;
                  coordInfo = cInfo;
                  break;
                }
              }
            }
            !coordInfo && coordInfoList.push(coordInfo = {});
            coordInfo[componentName] = componentModel;
            coordInfo[componentName + 'Index'] = index;
            coordInfo.panelId = componentName + PANEL_ID_SPLIT + index;
            coordInfo.coordSys = coordSys || grid.getCartesian(coordInfo.xAxisIndex, coordInfo.yAxisIndex);
            coordInfo.coordSys ? (coordInfoList[componentName + 'Has'] = true) : coordInfoList.pop();
          });
        });
        return coordInfoList;
      };
      helper.controlSeries = function(area, brushModel, seriesModel) {
        var coordInfo = findCoordInfo(area, brushModel.coordInfoList);
        return coordInfo === true || (coordInfo && coordInfo.coordSys === seriesModel.coordinateSystem);
      };
      function formatMinMax(minMax) {
        minMax[0] > minMax[1] && minMax.reverse();
        return minMax;
      }
      function findCoordInfo(area, coordInfoList) {
        var isGlobal = true;
        for (var j = 0; j < COMPONENT_NAMES.length; j++) {
          var indexAttr = COMPONENT_NAMES[j] + 'Index';
          if (area[indexAttr] >= 0) {
            isGlobal = false;
            for (var i = 0; i < coordInfoList.length; i++) {
              if (coordInfoList[i][indexAttr] === area[indexAttr]) {
                return coordInfoList[i];
              }
            }
          }
        }
        return isGlobal;
      }
      function axisConvert(axisName, to, coordInfo, coordRange) {
        var axis = coordInfo.coordSys.getAxis(axisName);
        if (true) {
          zrUtil.assert(axis, 'line brush is only available in cartesian (grid).');
        }
        return formatMinMax(zrUtil.map([0, 1], function(i) {
          return to ? axis.coordToData(axis.toLocalCoord(coordRange[i])) : axis.toGlobalCoord(axis.dataToCoord(coordRange[i]));
        }));
      }
      var coordConvert = {
        lineX: zrUtil.curry(axisConvert, 'x'),
        lineY: zrUtil.curry(axisConvert, 'y'),
        rect: function(to, coordInfo, coordRange) {
          var coordSys = coordInfo.coordSys;
          var xminymin = coordSys[COORD_CONVERTS[to]]([coordRange[0][0], coordRange[1][0]]);
          var xmaxymax = coordSys[COORD_CONVERTS[to]]([coordRange[0][1], coordRange[1][1]]);
          return [formatMinMax([xminymin[0], xmaxymax[0]]), formatMinMax([xminymin[1], xmaxymax[1]])];
        },
        polygon: function(to, coordInfo, coordRange) {
          var coordSys = coordInfo.coordSys;
          return zrUtil.map(coordRange, coordSys[COORD_CONVERTS[to]], coordSys);
        }
      };
      module.exports = helper;
    }, , , , , function(module, exports) {
      'use strict';
      var features = {};
      module.exports = {
        register: function(name, ctor) {
          features[name] = ctor;
        },
        get: function(name) {
          return features[name];
        }
      };
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var echarts = __webpack_require__(1);
      var graphic = __webpack_require__(43);
      var layout = __webpack_require__(21);
      echarts.extendComponentModel({
        type: 'title',
        layoutMode: {
          type: 'box',
          ignoreSize: true
        },
        defaultOption: {
          zlevel: 0,
          z: 6,
          show: true,
          text: '',
          target: 'blank',
          subtext: '',
          subtarget: 'blank',
          left: 0,
          top: 0,
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: '#ccc',
          borderWidth: 0,
          padding: 5,
          itemGap: 10,
          textStyle: {
            fontSize: 18,
            fontWeight: 'bolder',
            color: '#333'
          },
          subtextStyle: {color: '#aaa'}
        }
      });
      echarts.extendComponentView({
        type: 'title',
        render: function(titleModel, ecModel, api) {
          this.group.removeAll();
          if (!titleModel.get('show')) {
            return;
          }
          var group = this.group;
          var textStyleModel = titleModel.getModel('textStyle');
          var subtextStyleModel = titleModel.getModel('subtextStyle');
          var textAlign = titleModel.get('textAlign');
          var textBaseline = titleModel.get('textBaseline');
          var textEl = new graphic.Text({
            style: {
              text: titleModel.get('text'),
              textFont: textStyleModel.getFont(),
              fill: textStyleModel.getTextColor()
            },
            z2: 10
          });
          var textRect = textEl.getBoundingRect();
          var subText = titleModel.get('subtext');
          var subTextEl = new graphic.Text({
            style: {
              text: subText,
              textFont: subtextStyleModel.getFont(),
              fill: subtextStyleModel.getTextColor(),
              y: textRect.height + titleModel.get('itemGap'),
              textBaseline: 'top'
            },
            z2: 10
          });
          var link = titleModel.get('link');
          var sublink = titleModel.get('sublink');
          textEl.silent = !link;
          subTextEl.silent = !sublink;
          if (link) {
            textEl.on('click', function() {
              window.open(link, '_' + titleModel.get('target'));
            });
          }
          if (sublink) {
            subTextEl.on('click', function() {
              window.open(sublink, '_' + titleModel.get('subtarget'));
            });
          }
          group.add(textEl);
          subText && group.add(subTextEl);
          var groupRect = group.getBoundingRect();
          var layoutOption = titleModel.getBoxLayoutParams();
          layoutOption.width = groupRect.width;
          layoutOption.height = groupRect.height;
          var layoutRect = layout.getLayoutRect(layoutOption, {
            width: api.getWidth(),
            height: api.getHeight()
          }, titleModel.get('padding'));
          if (!textAlign) {
            textAlign = titleModel.get('left') || titleModel.get('right');
            if (textAlign === 'middle') {
              textAlign = 'center';
            }
            if (textAlign === 'right') {
              layoutRect.x += layoutRect.width;
            } else if (textAlign === 'center') {
              layoutRect.x += layoutRect.width / 2;
            }
          }
          if (!textBaseline) {
            textBaseline = titleModel.get('top') || titleModel.get('bottom');
            if (textBaseline === 'center') {
              textBaseline = 'middle';
            }
            if (textBaseline === 'bottom') {
              layoutRect.y += layoutRect.height;
            } else if (textBaseline === 'middle') {
              layoutRect.y += layoutRect.height / 2;
            }
            textBaseline = textBaseline || 'top';
          }
          group.attr('position', [layoutRect.x, layoutRect.y]);
          var alignStyle = {
            textAlign: textAlign,
            textVerticalAlign: textBaseline
          };
          textEl.setStyle(alignStyle);
          subTextEl.setStyle(alignStyle);
          groupRect = group.getBoundingRect();
          var padding = layoutRect.margin;
          var style = titleModel.getItemStyle(['color', 'opacity']);
          style.fill = titleModel.get('backgroundColor');
          var rect = new graphic.Rect({
            shape: {
              x: groupRect.x - padding[3],
              y: groupRect.y - padding[0],
              width: groupRect.width + padding[1] + padding[3],
              height: groupRect.height + padding[0] + padding[2]
            },
            style: style,
            silent: true
          });
          graphic.subPixelOptimizeRect(rect);
          group.add(rect);
        }
      });
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(330);
      __webpack_require__(331);
      __webpack_require__(334);
      __webpack_require__(335);
      __webpack_require__(336);
      __webpack_require__(338);
      __webpack_require__(339);
      __webpack_require__(341);
      __webpack_require__(342);
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(19).registerSubTypeDefaulter('dataZoom', function(option) {
        return 'slider';
      });
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var env = __webpack_require__(2);
      var echarts = __webpack_require__(1);
      var modelUtil = __webpack_require__(5);
      var helper = __webpack_require__(332);
      var AxisProxy = __webpack_require__(333);
      var each = zrUtil.each;
      var eachAxisDim = helper.eachAxisDim;
      var DataZoomModel = echarts.extendComponentModel({
        type: 'dataZoom',
        dependencies: ['xAxis', 'yAxis', 'zAxis', 'radiusAxis', 'angleAxis', 'singleAxis', 'series'],
        defaultOption: {
          zlevel: 0,
          z: 4,
          orient: null,
          xAxisIndex: null,
          yAxisIndex: null,
          filterMode: 'filter',
          throttle: null,
          start: 0,
          end: 100,
          startValue: null,
          endValue: null
        },
        init: function(option, parentModel, ecModel) {
          this._dataIntervalByAxis = {};
          this._dataInfo = {};
          this._axisProxies = {};
          this.textStyleModel;
          this._autoThrottle = true;
          var rawOption = retrieveRaw(option);
          this.mergeDefaultAndTheme(option, ecModel);
          this.doInit(rawOption);
        },
        mergeOption: function(newOption) {
          var rawOption = retrieveRaw(newOption);
          zrUtil.merge(this.option, newOption, true);
          this.doInit(rawOption);
        },
        doInit: function(rawOption) {
          var thisOption = this.option;
          if (!env.canvasSupported) {
            thisOption.realtime = false;
          }
          this._setDefaultThrottle(rawOption);
          processRangeProp('start', 'startValue', rawOption, thisOption);
          processRangeProp('end', 'endValue', rawOption, thisOption);
          this.textStyleModel = this.getModel('textStyle');
          this._resetTarget();
          this._giveAxisProxies();
        },
        _giveAxisProxies: function() {
          var axisProxies = this._axisProxies;
          this.eachTargetAxis(function(dimNames, axisIndex, dataZoomModel, ecModel) {
            var axisModel = this.dependentModels[dimNames.axis][axisIndex];
            var axisProxy = axisModel.__dzAxisProxy || (axisModel.__dzAxisProxy = new AxisProxy(dimNames.name, axisIndex, this, ecModel));
            axisProxies[dimNames.name + '_' + axisIndex] = axisProxy;
          }, this);
        },
        _resetTarget: function() {
          var thisOption = this.option;
          var autoMode = this._judgeAutoMode();
          eachAxisDim(function(dimNames) {
            var axisIndexName = dimNames.axisIndex;
            thisOption[axisIndexName] = modelUtil.normalizeToArray(thisOption[axisIndexName]);
          }, this);
          if (autoMode === 'axisIndex') {
            this._autoSetAxisIndex();
          } else if (autoMode === 'orient') {
            this._autoSetOrient();
          }
        },
        _judgeAutoMode: function() {
          var thisOption = this.option;
          var hasIndexSpecified = false;
          eachAxisDim(function(dimNames) {
            if (thisOption[dimNames.axisIndex] != null) {
              hasIndexSpecified = true;
            }
          }, this);
          var orient = thisOption.orient;
          if (orient == null && hasIndexSpecified) {
            return 'orient';
          } else if (!hasIndexSpecified) {
            if (orient == null) {
              thisOption.orient = 'horizontal';
            }
            return 'axisIndex';
          }
        },
        _autoSetAxisIndex: function() {
          var autoAxisIndex = true;
          var orient = this.get('orient', true);
          var thisOption = this.option;
          var dependentModels = this.dependentModels;
          if (autoAxisIndex) {
            var dimName = orient === 'vertical' ? 'y' : 'x';
            if (dependentModels[dimName + 'Axis'].length) {
              thisOption[dimName + 'AxisIndex'] = [0];
              autoAxisIndex = false;
            } else {
              each(dependentModels.singleAxis, function(singleAxisModel) {
                if (autoAxisIndex && singleAxisModel.get('orient', true) === orient) {
                  thisOption.singleAxisIndex = [singleAxisModel.componentIndex];
                  autoAxisIndex = false;
                }
              });
            }
          }
          if (autoAxisIndex) {
            eachAxisDim(function(dimNames) {
              if (!autoAxisIndex) {
                return;
              }
              var axisIndices = [];
              var axisModels = this.dependentModels[dimNames.axis];
              if (axisModels.length && !axisIndices.length) {
                for (var i = 0,
                    len = axisModels.length; i < len; i++) {
                  if (axisModels[i].get('type') === 'category') {
                    axisIndices.push(i);
                  }
                }
              }
              thisOption[dimNames.axisIndex] = axisIndices;
              if (axisIndices.length) {
                autoAxisIndex = false;
              }
            }, this);
          }
          if (autoAxisIndex) {
            this.ecModel.eachSeries(function(seriesModel) {
              if (this._isSeriesHasAllAxesTypeOf(seriesModel, 'value')) {
                eachAxisDim(function(dimNames) {
                  var axisIndices = thisOption[dimNames.axisIndex];
                  var axisIndex = seriesModel.get(dimNames.axisIndex);
                  var axisId = seriesModel.get(dimNames.axisId);
                  var axisModel = seriesModel.ecModel.queryComponents({
                    mainType: dimNames.axis,
                    index: axisIndex,
                    id: axisId
                  })[0];
                  if (true) {
                    if (!axisModel) {
                      throw new Error(dimNames.axis + ' "' + zrUtil.retrieve(axisIndex, axisId, 0) + '" not found');
                    }
                  }
                  axisIndex = axisModel.componentIndex;
                  if (zrUtil.indexOf(axisIndices, axisIndex) < 0) {
                    axisIndices.push(axisIndex);
                  }
                });
              }
            }, this);
          }
        },
        _autoSetOrient: function() {
          var dim;
          this.eachTargetAxis(function(dimNames) {
            !dim && (dim = dimNames.name);
          }, this);
          this.option.orient = dim === 'y' ? 'vertical' : 'horizontal';
        },
        _isSeriesHasAllAxesTypeOf: function(seriesModel, axisType) {
          var is = true;
          eachAxisDim(function(dimNames) {
            var seriesAxisIndex = seriesModel.get(dimNames.axisIndex);
            var axisModel = this.dependentModels[dimNames.axis][seriesAxisIndex];
            if (!axisModel || axisModel.get('type') !== axisType) {
              is = false;
            }
          }, this);
          return is;
        },
        _setDefaultThrottle: function(rawOption) {
          if (rawOption.hasOwnProperty('throttle')) {
            this._autoThrottle = false;
          }
          if (this._autoThrottle) {
            var globalOption = this.ecModel.option;
            this.option.throttle = (globalOption.animation && globalOption.animationDurationUpdate > 0) ? 100 : 20;
          }
        },
        getFirstTargetAxisModel: function() {
          var firstAxisModel;
          eachAxisDim(function(dimNames) {
            if (firstAxisModel == null) {
              var indices = this.get(dimNames.axisIndex);
              if (indices.length) {
                firstAxisModel = this.dependentModels[dimNames.axis][indices[0]];
              }
            }
          }, this);
          return firstAxisModel;
        },
        eachTargetAxis: function(callback, context) {
          var ecModel = this.ecModel;
          eachAxisDim(function(dimNames) {
            each(this.get(dimNames.axisIndex), function(axisIndex) {
              callback.call(context, dimNames, axisIndex, this, ecModel);
            }, this);
          }, this);
        },
        getAxisProxy: function(dimName, axisIndex) {
          return this._axisProxies[dimName + '_' + axisIndex];
        },
        setRawRange: function(opt) {
          each(['start', 'end', 'startValue', 'endValue'], function(name) {
            this.option[name] = opt[name];
          }, this);
        },
        getPercentRange: function() {
          var axisProxy = this.findRepresentativeAxisProxy();
          if (axisProxy) {
            return axisProxy.getDataPercentWindow();
          }
        },
        getValueRange: function(axisDimName, axisIndex) {
          if (axisDimName == null && axisIndex == null) {
            var axisProxy = this.findRepresentativeAxisProxy();
            if (axisProxy) {
              return axisProxy.getDataValueWindow();
            }
          } else {
            return this.getAxisProxy(axisDimName, axisIndex).getDataValueWindow();
          }
        },
        findRepresentativeAxisProxy: function() {
          var axisProxies = this._axisProxies;
          for (var key in axisProxies) {
            if (axisProxies.hasOwnProperty(key) && axisProxies[key].hostedBy(this)) {
              return axisProxies[key];
            }
          }
          for (var key in axisProxies) {
            if (axisProxies.hasOwnProperty(key) && !axisProxies[key].hostedBy(this)) {
              return axisProxies[key];
            }
          }
        }
      });
      function retrieveRaw(option) {
        var ret = {};
        each(['start', 'end', 'startValue', 'endValue', 'throttle'], function(name) {
          option.hasOwnProperty(name) && (ret[name] = option[name]);
        });
        return ret;
      }
      function processRangeProp(percentProp, valueProp, rawOption, thisOption) {
        if (rawOption[valueProp] != null && rawOption[percentProp] == null) {
          thisOption[percentProp] = null;
        }
      }
      module.exports = DataZoomModel;
    }, function(module, exports, __webpack_require__) {
      var formatUtil = __webpack_require__(6);
      var zrUtil = __webpack_require__(4);
      var helper = {};
      var AXIS_DIMS = ['x', 'y', 'z', 'radius', 'angle', 'single'];
      var COORDS = ['cartesian2d', 'polar', 'singleAxis'];
      helper.isCoordSupported = function(coordType) {
        return zrUtil.indexOf(COORDS, coordType) >= 0;
      };
      helper.createNameEach = function(names, attrs) {
        names = names.slice();
        var capitalNames = zrUtil.map(names, formatUtil.capitalFirst);
        attrs = (attrs || []).slice();
        var capitalAttrs = zrUtil.map(attrs, formatUtil.capitalFirst);
        return function(callback, context) {
          zrUtil.each(names, function(name, index) {
            var nameObj = {
              name: name,
              capital: capitalNames[index]
            };
            for (var j = 0; j < attrs.length; j++) {
              nameObj[attrs[j]] = name + capitalAttrs[j];
            }
            callback.call(context, nameObj);
          });
        };
      };
      helper.eachAxisDim = helper.createNameEach(AXIS_DIMS, ['axisIndex', 'axis', 'index', 'id']);
      helper.createLinkedNodesFinder = function(forEachNode, forEachEdgeType, edgeIdGetter) {
        return function(sourceNode) {
          var result = {
            nodes: [],
            records: {}
          };
          forEachEdgeType(function(edgeType) {
            result.records[edgeType.name] = {};
          });
          if (!sourceNode) {
            return result;
          }
          absorb(sourceNode, result);
          var existsLink;
          do {
            existsLink = false;
            forEachNode(processSingleNode);
          } while (existsLink);
          function processSingleNode(node) {
            if (!isNodeAbsorded(node, result) && isLinked(node, result)) {
              absorb(node, result);
              existsLink = true;
            }
          }
          return result;
        };
        function isNodeAbsorded(node, result) {
          return zrUtil.indexOf(result.nodes, node) >= 0;
        }
        function isLinked(node, result) {
          var hasLink = false;
          forEachEdgeType(function(edgeType) {
            zrUtil.each(edgeIdGetter(node, edgeType) || [], function(edgeId) {
              result.records[edgeType.name][edgeId] && (hasLink = true);
            });
          });
          return hasLink;
        }
        function absorb(node, result) {
          result.nodes.push(node);
          forEachEdgeType(function(edgeType) {
            zrUtil.each(edgeIdGetter(node, edgeType) || [], function(edgeId) {
              result.records[edgeType.name][edgeId] = true;
            });
          });
        }
      };
      module.exports = helper;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var helper = __webpack_require__(332);
      var each = zrUtil.each;
      var asc = numberUtil.asc;
      var AxisProxy = function(dimName, axisIndex, dataZoomModel, ecModel) {
        this._dimName = dimName;
        this._axisIndex = axisIndex;
        this._valueWindow;
        this._percentWindow;
        this._dataExtent;
        this.ecModel = ecModel;
        this._dataZoomModel = dataZoomModel;
      };
      AxisProxy.prototype = {
        constructor: AxisProxy,
        hostedBy: function(dataZoomModel) {
          return this._dataZoomModel === dataZoomModel;
        },
        getDataValueWindow: function() {
          return this._valueWindow.slice();
        },
        getDataPercentWindow: function() {
          return this._percentWindow.slice();
        },
        getTargetSeriesModels: function() {
          var seriesModels = [];
          var ecModel = this.ecModel;
          ecModel.eachSeries(function(seriesModel) {
            if (helper.isCoordSupported(seriesModel.get('coordinateSystem'))) {
              var dimName = this._dimName;
              var axisModel = ecModel.queryComponents({
                mainType: dimName + 'Axis',
                index: seriesModel.get(dimName + 'AxisIndex'),
                id: seriesModel.get(dimName + 'AxisId')
              })[0];
              if (this._axisIndex === (axisModel && axisModel.componentIndex)) {
                seriesModels.push(seriesModel);
              }
            }
          }, this);
          return seriesModels;
        },
        getAxisModel: function() {
          return this.ecModel.getComponent(this._dimName + 'Axis', this._axisIndex);
        },
        getOtherAxisModel: function() {
          var axisDim = this._dimName;
          var ecModel = this.ecModel;
          var axisModel = this.getAxisModel();
          var isCartesian = axisDim === 'x' || axisDim === 'y';
          var otherAxisDim;
          var coordSysIndexName;
          if (isCartesian) {
            coordSysIndexName = 'gridIndex';
            otherAxisDim = axisDim === 'x' ? 'y' : 'x';
          } else {
            coordSysIndexName = 'polarIndex';
            otherAxisDim = axisDim === 'angle' ? 'radius' : 'angle';
          }
          var foundOtherAxisModel;
          ecModel.eachComponent(otherAxisDim + 'Axis', function(otherAxisModel) {
            if ((otherAxisModel.get(coordSysIndexName) || 0) === (axisModel.get(coordSysIndexName) || 0)) {
              foundOtherAxisModel = otherAxisModel;
            }
          });
          return foundOtherAxisModel;
        },
        calculateDataWindow: function(opt) {
          var dataExtent = this._dataExtent;
          var axisModel = this.getAxisModel();
          var scale = axisModel.axis.scale;
          var percentExtent = [0, 100];
          var percentWindow = [opt.start, opt.end];
          var valueWindow = [];
          dataExtent = dataExtent.slice();
          fixExtentByAxis(dataExtent, axisModel);
          each(['startValue', 'endValue'], function(prop) {
            valueWindow.push(opt[prop] != null ? scale.parse(opt[prop]) : null);
          });
          each([0, 1], function(idx) {
            var boundValue = valueWindow[idx];
            var boundPercent = percentWindow[idx];
            if (boundPercent != null || boundValue == null) {
              if (boundPercent == null) {
                boundPercent = percentExtent[idx];
              }
              boundValue = scale.parse(numberUtil.linearMap(boundPercent, percentExtent, dataExtent, true));
            } else {
              boundPercent = numberUtil.linearMap(boundValue, dataExtent, percentExtent, true);
            }
            valueWindow[idx] = boundValue;
            percentWindow[idx] = boundPercent;
          });
          return {
            valueWindow: asc(valueWindow),
            percentWindow: asc(percentWindow)
          };
        },
        reset: function(dataZoomModel) {
          if (dataZoomModel !== this._dataZoomModel) {
            return;
          }
          this._dataExtent = calculateDataExtent(this._dimName, this.getTargetSeriesModels());
          var dataWindow = this.calculateDataWindow(dataZoomModel.option);
          this._valueWindow = dataWindow.valueWindow;
          this._percentWindow = dataWindow.percentWindow;
          setAxisModel(this);
        },
        restore: function(dataZoomModel) {
          if (dataZoomModel !== this._dataZoomModel) {
            return;
          }
          this._valueWindow = this._percentWindow = null;
          setAxisModel(this, true);
        },
        filterData: function(dataZoomModel) {
          if (dataZoomModel !== this._dataZoomModel) {
            return;
          }
          var axisDim = this._dimName;
          var seriesModels = this.getTargetSeriesModels();
          var filterMode = dataZoomModel.get('filterMode');
          var valueWindow = this._valueWindow;
          var otherAxisModel = this.getOtherAxisModel();
          if (dataZoomModel.get('$fromToolbox') && otherAxisModel && otherAxisModel.get('type') === 'category') {
            filterMode = 'empty';
          }
          each(seriesModels, function(seriesModel) {
            var seriesData = seriesModel.getData();
            seriesData && each(seriesModel.coordDimToDataDim(axisDim), function(dim) {
              if (filterMode === 'empty') {
                seriesModel.setData(seriesData.map(dim, function(value) {
                  return !isInWindow(value) ? NaN : value;
                }));
              } else {
                seriesData.filterSelf(dim, isInWindow);
              }
            });
          });
          function isInWindow(value) {
            return value >= valueWindow[0] && value <= valueWindow[1];
          }
        }
      };
      function calculateDataExtent(axisDim, seriesModels) {
        var dataExtent = [Infinity, -Infinity];
        each(seriesModels, function(seriesModel) {
          var seriesData = seriesModel.getData();
          if (seriesData) {
            each(seriesModel.coordDimToDataDim(axisDim), function(dim) {
              var seriesExtent = seriesData.getDataExtent(dim);
              seriesExtent[0] < dataExtent[0] && (dataExtent[0] = seriesExtent[0]);
              seriesExtent[1] > dataExtent[1] && (dataExtent[1] = seriesExtent[1]);
            });
          }
        }, this);
        if (dataExtent[1] < dataExtent[0]) {
          dataExtent = [NaN, NaN];
        }
        return dataExtent;
      }
      function fixExtentByAxis(dataExtent, axisModel) {
        var min = axisModel.getMin(true);
        if (min != null && min !== 'dataMin') {
          dataExtent[0] = min;
        }
        var max = axisModel.getMax(true);
        if (max != null && max !== 'dataMax') {
          dataExtent[1] = max;
        }
        if (!axisModel.get('scale', true)) {
          dataExtent[0] > 0 && (dataExtent[0] = 0);
          dataExtent[1] < 0 && (dataExtent[1] = 0);
        }
        return dataExtent;
      }
      function setAxisModel(axisProxy, isRestore) {
        var axisModel = axisProxy.getAxisModel();
        var percentWindow = axisProxy._percentWindow;
        var valueWindow = axisProxy._valueWindow;
        if (!percentWindow) {
          return;
        }
        var precision = numberUtil.getPixelPrecision(valueWindow, [0, 500]);
        var useOrigin = isRestore || (percentWindow[0] === 0 && percentWindow[1] === 100);
        axisModel.setRange(useOrigin ? null : +valueWindow[0].toFixed(precision), useOrigin ? null : +valueWindow[1].toFixed(precision));
      }
      module.exports = AxisProxy;
    }, function(module, exports, __webpack_require__) {
      var ComponentView = __webpack_require__(29);
      module.exports = ComponentView.extend({
        type: 'dataZoom',
        render: function(dataZoomModel, ecModel, api, payload) {
          this.dataZoomModel = dataZoomModel;
          this.ecModel = ecModel;
          this.api = api;
        },
        getTargetCoordInfo: function() {
          var dataZoomModel = this.dataZoomModel;
          var ecModel = this.ecModel;
          var coordSysLists = {};
          dataZoomModel.eachTargetAxis(function(dimNames, axisIndex) {
            var axisModel = ecModel.getComponent(dimNames.axis, axisIndex);
            if (axisModel) {
              var coordModel = axisModel.getCoordSysModel();
              coordModel && save(coordModel, axisModel, coordSysLists[coordModel.mainType] || (coordSysLists[coordModel.mainType] = []), coordModel.componentIndex);
            }
          }, this);
          function save(coordModel, axisModel, store, coordIndex) {
            var item;
            for (var i = 0; i < store.length; i++) {
              if (store[i].model === coordModel) {
                item = store[i];
                break;
              }
            }
            if (!item) {
              store.push(item = {
                model: coordModel,
                axisModels: [],
                coordIndex: coordIndex
              });
            }
            item.axisModels.push(axisModel);
          }
          return coordSysLists;
        }
      });
    }, function(module, exports, __webpack_require__) {
      var DataZoomModel = __webpack_require__(331);
      var SliderZoomModel = DataZoomModel.extend({
        type: 'dataZoom.slider',
        layoutMode: 'box',
        defaultOption: {
          show: true,
          right: 'ph',
          top: 'ph',
          width: 'ph',
          height: 'ph',
          left: null,
          bottom: null,
          backgroundColor: 'rgba(47,69,84,0)',
          dataBackground: {
            lineStyle: {
              color: '#2f4554',
              width: 0.5,
              opacity: 0.3
            },
            areaStyle: {
              color: 'rgba(47,69,84,0.3)',
              opacity: 0.3
            }
          },
          borderColor: '#ddd',
          fillerColor: 'rgba(167,183,204,0.4)',
          handleIcon: 'M8.2,13.6V3.9H6.3v9.7H3.1v14.9h3.3v9.7h1.8v-9.7h3.3V13.6H8.2z M9.7,24.4H4.8v-1.4h4.9V24.4z M9.7,19.1H4.8v-1.4h4.9V19.1z',
          handleSize: '100%',
          handleStyle: {color: '#a7b7cc'},
          labelPrecision: null,
          labelFormatter: null,
          showDetail: true,
          showDataShadow: 'auto',
          realtime: true,
          zoomLock: false,
          textStyle: {color: '#333'}
        }
      });
      module.exports = SliderZoomModel;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var graphic = __webpack_require__(43);
      var throttle = __webpack_require__(81);
      var DataZoomView = __webpack_require__(334);
      var Rect = graphic.Rect;
      var numberUtil = __webpack_require__(7);
      var linearMap = numberUtil.linearMap;
      var layout = __webpack_require__(21);
      var sliderMove = __webpack_require__(337);
      var asc = numberUtil.asc;
      var bind = zrUtil.bind;
      var each = zrUtil.each;
      var DEFAULT_LOCATION_EDGE_GAP = 7;
      var DEFAULT_FRAME_BORDER_WIDTH = 1;
      var DEFAULT_FILLER_SIZE = 30;
      var HORIZONTAL = 'horizontal';
      var VERTICAL = 'vertical';
      var LABEL_GAP = 5;
      var SHOW_DATA_SHADOW_SERIES_TYPE = ['line', 'bar', 'candlestick', 'scatter'];
      var SliderZoomView = DataZoomView.extend({
        type: 'dataZoom.slider',
        init: function(ecModel, api) {
          this._displayables = {};
          this._orient;
          this._range;
          this._handleEnds;
          this._size;
          this._handleWidth;
          this._handleHeight;
          this._location;
          this._dragging;
          this._dataShadowInfo;
          this.api = api;
        },
        render: function(dataZoomModel, ecModel, api, payload) {
          SliderZoomView.superApply(this, 'render', arguments);
          throttle.createOrUpdate(this, '_dispatchZoomAction', this.dataZoomModel.get('throttle'), 'fixRate');
          this._orient = dataZoomModel.get('orient');
          if (this.dataZoomModel.get('show') === false) {
            this.group.removeAll();
            return;
          }
          if (!payload || payload.type !== 'dataZoom' || payload.from !== this.uid) {
            this._buildView();
          }
          this._updateView();
        },
        remove: function() {
          SliderZoomView.superApply(this, 'remove', arguments);
          throttle.clear(this, '_dispatchZoomAction');
        },
        dispose: function() {
          SliderZoomView.superApply(this, 'dispose', arguments);
          throttle.clear(this, '_dispatchZoomAction');
        },
        _buildView: function() {
          var thisGroup = this.group;
          thisGroup.removeAll();
          this._resetLocation();
          this._resetInterval();
          var barGroup = this._displayables.barGroup = new graphic.Group();
          this._renderBackground();
          this._renderHandle();
          this._renderDataShadow();
          thisGroup.add(barGroup);
          this._positionGroup();
        },
        _resetLocation: function() {
          var dataZoomModel = this.dataZoomModel;
          var api = this.api;
          var coordRect = this._findCoordRect();
          var ecSize = {
            width: api.getWidth(),
            height: api.getHeight()
          };
          var positionInfo = this._orient === HORIZONTAL ? {
            right: ecSize.width - coordRect.x - coordRect.width,
            top: (ecSize.height - DEFAULT_FILLER_SIZE - DEFAULT_LOCATION_EDGE_GAP),
            width: coordRect.width,
            height: DEFAULT_FILLER_SIZE
          } : {
            right: DEFAULT_LOCATION_EDGE_GAP,
            top: coordRect.y,
            width: DEFAULT_FILLER_SIZE,
            height: coordRect.height
          };
          var layoutParams = layout.getLayoutParams(dataZoomModel.option);
          zrUtil.each(['right', 'top', 'width', 'height'], function(name) {
            if (layoutParams[name] === 'ph') {
              layoutParams[name] = positionInfo[name];
            }
          });
          var layoutRect = layout.getLayoutRect(layoutParams, ecSize, dataZoomModel.padding);
          this._location = {
            x: layoutRect.x,
            y: layoutRect.y
          };
          this._size = [layoutRect.width, layoutRect.height];
          this._orient === VERTICAL && this._size.reverse();
        },
        _positionGroup: function() {
          var thisGroup = this.group;
          var location = this._location;
          var orient = this._orient;
          var targetAxisModel = this.dataZoomModel.getFirstTargetAxisModel();
          var inverse = targetAxisModel && targetAxisModel.get('inverse');
          var barGroup = this._displayables.barGroup;
          var otherAxisInverse = (this._dataShadowInfo || {}).otherAxisInverse;
          barGroup.attr((orient === HORIZONTAL && !inverse) ? {scale: otherAxisInverse ? [1, 1] : [1, -1]} : (orient === HORIZONTAL && inverse) ? {scale: otherAxisInverse ? [-1, 1] : [-1, -1]} : (orient === VERTICAL && !inverse) ? {
            scale: otherAxisInverse ? [1, -1] : [1, 1],
            rotation: Math.PI / 2
          } : {
            scale: otherAxisInverse ? [-1, -1] : [-1, 1],
            rotation: Math.PI / 2
          });
          var rect = thisGroup.getBoundingRect([barGroup]);
          thisGroup.attr('position', [location.x - rect.x, location.y - rect.y]);
        },
        _getViewExtent: function() {
          return [0, this._size[0]];
        },
        _renderBackground: function() {
          var dataZoomModel = this.dataZoomModel;
          var size = this._size;
          this._displayables.barGroup.add(new Rect({
            silent: true,
            shape: {
              x: 0,
              y: 0,
              width: size[0],
              height: size[1]
            },
            style: {fill: dataZoomModel.get('backgroundColor')},
            z2: -40
          }));
        },
        _renderDataShadow: function() {
          var info = this._dataShadowInfo = this._prepareDataShadowInfo();
          if (!info) {
            return;
          }
          var size = this._size;
          var seriesModel = info.series;
          var data = seriesModel.getRawData();
          var otherDim = seriesModel.getShadowDim ? seriesModel.getShadowDim() : info.otherDim;
          if (otherDim == null) {
            return;
          }
          var otherDataExtent = data.getDataExtent(otherDim);
          var otherOffset = (otherDataExtent[1] - otherDataExtent[0]) * 0.3;
          otherDataExtent = [otherDataExtent[0] - otherOffset, otherDataExtent[1] + otherOffset];
          var otherShadowExtent = [0, size[1]];
          var thisShadowExtent = [0, size[0]];
          var areaPoints = [[size[0], 0], [0, 0]];
          var linePoints = [];
          var step = thisShadowExtent[1] / (data.count() - 1);
          var thisCoord = 0;
          var stride = Math.round(data.count() / size[0]);
          var lastIsEmpty;
          data.each([otherDim], function(value, index) {
            if (stride > 0 && (index % stride)) {
              thisCoord += step;
              return;
            }
            var isEmpty = value == null || isNaN(value) || value === '';
            var otherCoord = isEmpty ? 0 : linearMap(value, otherDataExtent, otherShadowExtent, true);
            if (isEmpty && !lastIsEmpty && index) {
              areaPoints.push([areaPoints[areaPoints.length - 1][0], 0]);
              linePoints.push([linePoints[linePoints.length - 1][0], 0]);
            } else if (!isEmpty && lastIsEmpty) {
              areaPoints.push([thisCoord, 0]);
              linePoints.push([thisCoord, 0]);
            }
            areaPoints.push([thisCoord, otherCoord]);
            linePoints.push([thisCoord, otherCoord]);
            thisCoord += step;
            lastIsEmpty = isEmpty;
          });
          var dataZoomModel = this.dataZoomModel;
          this._displayables.barGroup.add(new graphic.Polygon({
            shape: {points: areaPoints},
            style: zrUtil.defaults({fill: dataZoomModel.get('dataBackgroundColor')}, dataZoomModel.getModel('dataBackground.areaStyle').getAreaStyle()),
            silent: true,
            z2: -20
          }));
          this._displayables.barGroup.add(new graphic.Polyline({
            shape: {points: linePoints},
            style: dataZoomModel.getModel('dataBackground.lineStyle').getLineStyle(),
            silent: true,
            z2: -19
          }));
        },
        _prepareDataShadowInfo: function() {
          var dataZoomModel = this.dataZoomModel;
          var showDataShadow = dataZoomModel.get('showDataShadow');
          if (showDataShadow === false) {
            return;
          }
          var result;
          var ecModel = this.ecModel;
          dataZoomModel.eachTargetAxis(function(dimNames, axisIndex) {
            var seriesModels = dataZoomModel.getAxisProxy(dimNames.name, axisIndex).getTargetSeriesModels();
            zrUtil.each(seriesModels, function(seriesModel) {
              if (result) {
                return;
              }
              if (showDataShadow !== true && zrUtil.indexOf(SHOW_DATA_SHADOW_SERIES_TYPE, seriesModel.get('type')) < 0) {
                return;
              }
              var thisAxis = ecModel.getComponent(dimNames.axis, axisIndex).axis;
              var otherDim = getOtherDim(dimNames.name);
              var otherAxisInverse;
              var coordSys = seriesModel.coordinateSystem;
              if (otherDim != null && coordSys.getOtherAxis) {
                otherAxisInverse = coordSys.getOtherAxis(thisAxis).inverse;
              }
              result = {
                thisAxis: thisAxis,
                series: seriesModel,
                thisDim: dimNames.name,
                otherDim: otherDim,
                otherAxisInverse: otherAxisInverse
              };
            }, this);
          }, this);
          return result;
        },
        _renderHandle: function() {
          var displaybles = this._displayables;
          var handles = displaybles.handles = [];
          var handleLabels = displaybles.handleLabels = [];
          var barGroup = this._displayables.barGroup;
          var size = this._size;
          var dataZoomModel = this.dataZoomModel;
          barGroup.add(displaybles.filler = new Rect({
            draggable: true,
            cursor: 'move',
            drift: bind(this._onDragMove, this, 'all'),
            ondragstart: bind(this._showDataInfo, this, true),
            ondragend: bind(this._onDragEnd, this),
            onmouseover: bind(this._showDataInfo, this, true),
            onmouseout: bind(this._showDataInfo, this, false),
            style: {
              fill: dataZoomModel.get('fillerColor'),
              textPosition: 'inside'
            }
          }));
          barGroup.add(new Rect(graphic.subPixelOptimizeRect({
            silent: true,
            shape: {
              x: 0,
              y: 0,
              width: size[0],
              height: size[1]
            },
            style: {
              stroke: dataZoomModel.get('dataBackgroundColor') || dataZoomModel.get('borderColor'),
              lineWidth: DEFAULT_FRAME_BORDER_WIDTH,
              fill: 'rgba(0,0,0,0)'
            }
          })));
          var iconStr = dataZoomModel.get('handleIcon');
          each([0, 1], function(handleIndex) {
            var path = graphic.makePath(iconStr, {
              style: {strokeNoScale: true},
              rectHover: true,
              cursor: this._orient === 'vertical' ? 'ns-resize' : 'ew-resize',
              draggable: true,
              drift: bind(this._onDragMove, this, handleIndex),
              ondragend: bind(this._onDragEnd, this),
              onmouseover: bind(this._showDataInfo, this, true),
              onmouseout: bind(this._showDataInfo, this, false)
            }, {
              x: -0.5,
              y: 0,
              width: 1,
              height: 1
            }, 'center');
            var bRect = path.getBoundingRect();
            this._handleHeight = numberUtil.parsePercent(dataZoomModel.get('handleSize'), this._size[1]);
            this._handleWidth = bRect.width / bRect.height * this._handleHeight;
            path.setStyle(dataZoomModel.getModel('handleStyle').getItemStyle());
            var handleColor = dataZoomModel.get('handleColor');
            if (handleColor != null) {
              path.style.fill = handleColor;
            }
            barGroup.add(handles[handleIndex] = path);
            var textStyleModel = dataZoomModel.textStyleModel;
            this.group.add(handleLabels[handleIndex] = new graphic.Text({
              silent: true,
              invisible: true,
              style: {
                x: 0,
                y: 0,
                text: '',
                textVerticalAlign: 'middle',
                textAlign: 'center',
                fill: textStyleModel.getTextColor(),
                textFont: textStyleModel.getFont()
              },
              z2: 10
            }));
          }, this);
        },
        _resetInterval: function() {
          var range = this._range = this.dataZoomModel.getPercentRange();
          var viewExtent = this._getViewExtent();
          this._handleEnds = [linearMap(range[0], [0, 100], viewExtent, true), linearMap(range[1], [0, 100], viewExtent, true)];
        },
        _updateInterval: function(handleIndex, delta) {
          var handleEnds = this._handleEnds;
          var viewExtend = this._getViewExtent();
          sliderMove(delta, handleEnds, viewExtend, (handleIndex === 'all' || this.dataZoomModel.get('zoomLock')) ? 'rigid' : 'cross', handleIndex);
          this._range = asc([linearMap(handleEnds[0], viewExtend, [0, 100], true), linearMap(handleEnds[1], viewExtend, [0, 100], true)]);
        },
        _updateView: function(nonRealtime) {
          var displaybles = this._displayables;
          var handleEnds = this._handleEnds;
          var handleInterval = asc(handleEnds.slice());
          var size = this._size;
          each([0, 1], function(handleIndex) {
            var handle = displaybles.handles[handleIndex];
            var handleHeight = this._handleHeight;
            handle.attr({
              scale: [handleHeight, handleHeight],
              position: [handleEnds[handleIndex], size[1] / 2 - handleHeight / 2]
            });
          }, this);
          displaybles.filler.setShape({
            x: handleInterval[0],
            y: 0,
            width: handleInterval[1] - handleInterval[0],
            height: size[1]
          });
          this._updateDataInfo(nonRealtime);
        },
        _updateDataInfo: function(nonRealtime) {
          var dataZoomModel = this.dataZoomModel;
          var displaybles = this._displayables;
          var handleLabels = displaybles.handleLabels;
          var orient = this._orient;
          var labelTexts = ['', ''];
          if (dataZoomModel.get('showDetail')) {
            var axisProxy = dataZoomModel.findRepresentativeAxisProxy();
            if (axisProxy) {
              var axis = axisProxy.getAxisModel().axis;
              var range = this._range;
              var dataInterval = nonRealtime ? axisProxy.calculateDataWindow({
                start: range[0],
                end: range[1]
              }).valueWindow : axisProxy.getDataValueWindow();
              labelTexts = [this._formatLabel(dataInterval[0], axis), this._formatLabel(dataInterval[1], axis)];
            }
          }
          var orderedHandleEnds = asc(this._handleEnds.slice());
          setLabel.call(this, 0);
          setLabel.call(this, 1);
          function setLabel(handleIndex) {
            var barTransform = graphic.getTransform(displaybles.handles[handleIndex].parent, this.group);
            var direction = graphic.transformDirection(handleIndex === 0 ? 'right' : 'left', barTransform);
            var offset = this._handleWidth / 2 + LABEL_GAP;
            var textPoint = graphic.applyTransform([orderedHandleEnds[handleIndex] + (handleIndex === 0 ? -offset : offset), this._size[1] / 2], barTransform);
            handleLabels[handleIndex].setStyle({
              x: textPoint[0],
              y: textPoint[1],
              textVerticalAlign: orient === HORIZONTAL ? 'middle' : direction,
              textAlign: orient === HORIZONTAL ? direction : 'center',
              text: labelTexts[handleIndex]
            });
          }
        },
        _formatLabel: function(value, axis) {
          var dataZoomModel = this.dataZoomModel;
          var labelFormatter = dataZoomModel.get('labelFormatter');
          var labelPrecision = dataZoomModel.get('labelPrecision');
          if (labelPrecision == null || labelPrecision === 'auto') {
            labelPrecision = axis.getPixelPrecision();
          }
          var valueStr = (value == null || isNaN(value)) ? '' : (axis.type === 'category' || axis.type === 'time') ? axis.scale.getLabel(Math.round(value)) : value.toFixed(Math.min(labelPrecision, 20));
          return zrUtil.isFunction(labelFormatter) ? labelFormatter(value, valueStr) : zrUtil.isString(labelFormatter) ? labelFormatter.replace('{value}', valueStr) : valueStr;
        },
        _showDataInfo: function(showOrHide) {
          showOrHide = this._dragging || showOrHide;
          var handleLabels = this._displayables.handleLabels;
          handleLabels[0].attr('invisible', !showOrHide);
          handleLabels[1].attr('invisible', !showOrHide);
        },
        _onDragMove: function(handleIndex, dx, dy) {
          this._dragging = true;
          var vertex = this._applyBarTransform([dx, dy], true);
          this._updateInterval(handleIndex, vertex[0]);
          var realtime = this.dataZoomModel.get('realtime');
          this._updateView(!realtime);
          if (realtime) {
            realtime && this._dispatchZoomAction();
          }
        },
        _onDragEnd: function() {
          this._dragging = false;
          this._showDataInfo(false);
          this._dispatchZoomAction();
        },
        _dispatchZoomAction: function() {
          var range = this._range;
          this.api.dispatchAction({
            type: 'dataZoom',
            from: this.uid,
            dataZoomId: this.dataZoomModel.id,
            start: range[0],
            end: range[1]
          });
        },
        _applyBarTransform: function(vertex, inverse) {
          var barTransform = this._displayables.barGroup.getLocalTransform();
          return graphic.applyTransform(vertex, barTransform, inverse);
        },
        _findCoordRect: function() {
          var rect;
          each(this.getTargetCoordInfo(), function(coordInfoList) {
            if (!rect && coordInfoList.length) {
              var coordSys = coordInfoList[0].model.coordinateSystem;
              rect = coordSys.getRect && coordSys.getRect();
            }
          });
          if (!rect) {
            var width = this.api.getWidth();
            var height = this.api.getHeight();
            rect = {
              x: width * 0.2,
              y: height * 0.2,
              width: width * 0.6,
              height: height * 0.6
            };
          }
          return rect;
        }
      });
      function getOtherDim(thisDim) {
        var map = {
          x: 'y',
          y: 'x',
          radius: 'angle',
          angle: 'radius'
        };
        return map[thisDim];
      }
      module.exports = SliderZoomView;
    }, function(module, exports) {
      module.exports = function(delta, handleEnds, extent, mode, handleIndex) {
        if (!delta) {
          return handleEnds;
        }
        if (mode === 'rigid') {
          delta = getRealDelta(delta, handleEnds, extent);
          handleEnds[0] += delta;
          handleEnds[1] += delta;
        } else {
          delta = getRealDelta(delta, handleEnds[handleIndex], extent);
          handleEnds[handleIndex] += delta;
          if (mode === 'push' && handleEnds[0] > handleEnds[1]) {
            handleEnds[1 - handleIndex] = handleEnds[handleIndex];
          }
        }
        return handleEnds;
        function getRealDelta(delta, handleEnds, extent) {
          var handleMinMax = !handleEnds.length ? [handleEnds, handleEnds] : handleEnds.slice();
          handleEnds[0] > handleEnds[1] && handleMinMax.reverse();
          if (delta < 0 && handleMinMax[0] + delta < extent[0]) {
            delta = extent[0] - handleMinMax[0];
          }
          if (delta > 0 && handleMinMax[1] + delta > extent[1]) {
            delta = extent[1] - handleMinMax[1];
          }
          return delta;
        }
      };
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(331).extend({
        type: 'dataZoom.inside',
        defaultOption: {
          disabled: false,
          zoomLock: false
        }
      });
    }, function(module, exports, __webpack_require__) {
      var DataZoomView = __webpack_require__(334);
      var zrUtil = __webpack_require__(4);
      var sliderMove = __webpack_require__(337);
      var roams = __webpack_require__(340);
      var bind = zrUtil.bind;
      var InsideZoomView = DataZoomView.extend({
        type: 'dataZoom.inside',
        init: function(ecModel, api) {
          this._range;
        },
        render: function(dataZoomModel, ecModel, api, payload) {
          InsideZoomView.superApply(this, 'render', arguments);
          if (roams.shouldRecordRange(payload, dataZoomModel.id)) {
            this._range = dataZoomModel.getPercentRange();
          }
          zrUtil.each(this.getTargetCoordInfo(), function(coordInfoList, coordSysName) {
            var allCoordIds = zrUtil.map(coordInfoList, function(coordInfo) {
              return roams.generateCoordId(coordInfo.model);
            });
            zrUtil.each(coordInfoList, function(coordInfo) {
              var coordModel = coordInfo.model;
              roams.register(api, {
                coordId: roams.generateCoordId(coordModel),
                allCoordIds: allCoordIds,
                containsPoint: function(x, y) {
                  return coordModel.coordinateSystem.containPoint([x, y]);
                },
                dataZoomId: dataZoomModel.id,
                throttleRate: dataZoomModel.get('throttle', true),
                panGetRange: bind(this._onPan, this, coordInfo, coordSysName),
                zoomGetRange: bind(this._onZoom, this, coordInfo, coordSysName)
              });
            }, this);
          }, this);
        },
        dispose: function() {
          roams.unregister(this.api, this.dataZoomModel.id);
          InsideZoomView.superApply(this, 'dispose', arguments);
          this._range = null;
        },
        _onPan: function(coordInfo, coordSysName, controller, dx, dy, oldX, oldY, newX, newY) {
          if (this.dataZoomModel.option.disabled) {
            return this._range;
          }
          var range = this._range.slice();
          var axisModel = coordInfo.axisModels[0];
          if (!axisModel) {
            return;
          }
          var directionInfo = getDirectionInfo[coordSysName]([oldX, oldY], [newX, newY], axisModel, controller, coordInfo);
          var percentDelta = directionInfo.signal * (range[1] - range[0]) * directionInfo.pixel / directionInfo.pixelLength;
          sliderMove(percentDelta, range, [0, 100], 'rigid');
          return (this._range = range);
        },
        _onZoom: function(coordInfo, coordSysName, controller, scale, mouseX, mouseY) {
          var option = this.dataZoomModel.option;
          if (option.disabled || option.zoomLock) {
            return this._range;
          }
          var range = this._range.slice();
          var axisModel = coordInfo.axisModels[0];
          if (!axisModel) {
            return;
          }
          var directionInfo = getDirectionInfo[coordSysName](null, [mouseX, mouseY], axisModel, controller, coordInfo);
          var percentPoint = (directionInfo.pixel - directionInfo.pixelStart) / directionInfo.pixelLength * (range[1] - range[0]) + range[0];
          scale = Math.max(1 / scale, 0);
          range[0] = (range[0] - percentPoint) * scale + percentPoint;
          range[1] = (range[1] - percentPoint) * scale + percentPoint;
          return (this._range = fixRange(range));
        }
      });
      var getDirectionInfo = {
        grid: function(oldPoint, newPoint, axisModel, controller, coordInfo) {
          var axis = axisModel.axis;
          var ret = {};
          var rect = coordInfo.model.coordinateSystem.getRect();
          oldPoint = oldPoint || [0, 0];
          if (axis.dim === 'x') {
            ret.pixel = newPoint[0] - oldPoint[0];
            ret.pixelLength = rect.width;
            ret.pixelStart = rect.x;
            ret.signal = axis.inverse ? 1 : -1;
          } else {
            ret.pixel = newPoint[1] - oldPoint[1];
            ret.pixelLength = rect.height;
            ret.pixelStart = rect.y;
            ret.signal = axis.inverse ? -1 : 1;
          }
          return ret;
        },
        polar: function(oldPoint, newPoint, axisModel, controller, coordInfo) {
          var axis = axisModel.axis;
          var ret = {};
          var polar = coordInfo.model.coordinateSystem;
          var radiusExtent = polar.getRadiusAxis().getExtent();
          var angleExtent = polar.getAngleAxis().getExtent();
          oldPoint = oldPoint ? polar.pointToCoord(oldPoint) : [0, 0];
          newPoint = polar.pointToCoord(newPoint);
          if (axisModel.mainType === 'radiusAxis') {
            ret.pixel = newPoint[0] - oldPoint[0];
            ret.pixelLength = radiusExtent[1] - radiusExtent[0];
            ret.pixelStart = radiusExtent[0];
            ret.signal = axis.inverse ? 1 : -1;
          } else {
            ret.pixel = newPoint[1] - oldPoint[1];
            ret.pixelLength = angleExtent[1] - angleExtent[0];
            ret.pixelStart = angleExtent[0];
            ret.signal = axis.inverse ? -1 : 1;
          }
          return ret;
        },
        singleAxis: function(oldPoint, newPoint, axisModel, controller, coordInfo) {
          var axis = axisModel.axis;
          var rect = coordInfo.model.coordinateSystem.getRect();
          var ret = {};
          oldPoint = oldPoint || [0, 0];
          if (axis.orient === 'horizontal') {
            ret.pixel = newPoint[0] - oldPoint[0];
            ret.pixelLength = rect.width;
            ret.pixelStart = rect.x;
            ret.signal = axis.inverse ? 1 : -1;
          } else {
            ret.pixel = newPoint[1] - oldPoint[1];
            ret.pixelLength = rect.height;
            ret.pixelStart = rect.y;
            ret.signal = axis.inverse ? -1 : 1;
          }
          return ret;
        }
      };
      function fixRange(range) {
        var bound = [0, 100];
        !(range[0] <= bound[1]) && (range[0] = bound[1]);
        !(range[1] <= bound[1]) && (range[1] = bound[1]);
        !(range[0] >= bound[0]) && (range[0] = bound[0]);
        !(range[1] >= bound[0]) && (range[1] = bound[0]);
        return range;
      }
      module.exports = InsideZoomView;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var RoamController = __webpack_require__(177);
      var throttle = __webpack_require__(81);
      var curry = zrUtil.curry;
      var ATTR = '\0_ec_dataZoom_roams';
      var roams = {
        register: function(api, dataZoomInfo) {
          var store = giveStore(api);
          var theDataZoomId = dataZoomInfo.dataZoomId;
          var theCoordId = dataZoomInfo.coordId;
          zrUtil.each(store, function(record, coordId) {
            var dataZoomInfos = record.dataZoomInfos;
            if (dataZoomInfos[theDataZoomId] && zrUtil.indexOf(dataZoomInfo.allCoordIds, theCoordId) < 0) {
              delete dataZoomInfos[theDataZoomId];
              record.count--;
            }
          });
          cleanStore(store);
          var record = store[theCoordId];
          if (!record) {
            record = store[theCoordId] = {
              coordId: theCoordId,
              dataZoomInfos: {},
              count: 0
            };
            record.controller = createController(api, dataZoomInfo, record);
            record.dispatchAction = zrUtil.curry(dispatchAction, api);
          }
          record.controller.setContainsPoint(dataZoomInfo.containsPoint);
          throttle.createOrUpdate(record, 'dispatchAction', dataZoomInfo.throttleRate, 'fixRate');
          !(record.dataZoomInfos[theDataZoomId]) && record.count++;
          record.dataZoomInfos[theDataZoomId] = dataZoomInfo;
        },
        unregister: function(api, dataZoomId) {
          var store = giveStore(api);
          zrUtil.each(store, function(record) {
            record.controller.dispose();
            var dataZoomInfos = record.dataZoomInfos;
            if (dataZoomInfos[dataZoomId]) {
              delete dataZoomInfos[dataZoomId];
              record.count--;
            }
          });
          cleanStore(store);
        },
        shouldRecordRange: function(payload, dataZoomId) {
          if (payload && payload.type === 'dataZoom' && payload.batch) {
            for (var i = 0,
                len = payload.batch.length; i < len; i++) {
              if (payload.batch[i].dataZoomId === dataZoomId) {
                return false;
              }
            }
          }
          return true;
        },
        generateCoordId: function(coordModel) {
          return coordModel.type + '\0_' + coordModel.id;
        }
      };
      function giveStore(api) {
        var zr = api.getZr();
        return zr[ATTR] || (zr[ATTR] = {});
      }
      function createController(api, dataZoomInfo, newRecord) {
        var controller = new RoamController(api.getZr());
        controller.enable();
        controller.on('pan', curry(onPan, newRecord));
        controller.on('zoom', curry(onZoom, newRecord));
        return controller;
      }
      function cleanStore(store) {
        zrUtil.each(store, function(record, coordId) {
          if (!record.count) {
            record.controller.dispose();
            delete store[coordId];
          }
        });
      }
      function onPan(record, dx, dy, oldX, oldY, newX, newY) {
        wrapAndDispatch(record, function(info) {
          return info.panGetRange(record.controller, dx, dy, oldX, oldY, newX, newY);
        });
      }
      function onZoom(record, scale, mouseX, mouseY) {
        wrapAndDispatch(record, function(info) {
          return info.zoomGetRange(record.controller, scale, mouseX, mouseY);
        });
      }
      function wrapAndDispatch(record, getRange) {
        var batch = [];
        zrUtil.each(record.dataZoomInfos, function(info) {
          var range = getRange(info);
          range && batch.push({
            dataZoomId: info.dataZoomId,
            start: range[0],
            end: range[1]
          });
        });
        record.dispatchAction(batch);
      }
      function dispatchAction(api, batch) {
        api.dispatchAction({
          type: 'dataZoom',
          batch: batch
        });
      }
      module.exports = roams;
    }, function(module, exports, __webpack_require__) {
      var echarts = __webpack_require__(1);
      echarts.registerProcessor(function(ecModel, api) {
        ecModel.eachComponent('dataZoom', function(dataZoomModel) {
          dataZoomModel.eachTargetAxis(resetSingleAxis);
          dataZoomModel.eachTargetAxis(filterSingleAxis);
        });
        ecModel.eachComponent('dataZoom', function(dataZoomModel) {
          var axisProxy = dataZoomModel.findRepresentativeAxisProxy();
          var percentRange = axisProxy.getDataPercentWindow();
          var valueRange = axisProxy.getDataValueWindow();
          dataZoomModel.setRawRange({
            start: percentRange[0],
            end: percentRange[1],
            startValue: valueRange[0],
            endValue: valueRange[1]
          });
        });
      });
      function resetSingleAxis(dimNames, axisIndex, dataZoomModel) {
        dataZoomModel.getAxisProxy(dimNames.name, axisIndex).reset(dataZoomModel);
      }
      function filterSingleAxis(dimNames, axisIndex, dataZoomModel) {
        dataZoomModel.getAxisProxy(dimNames.name, axisIndex).filterData(dataZoomModel);
      }
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var helper = __webpack_require__(332);
      var echarts = __webpack_require__(1);
      echarts.registerAction('dataZoom', function(payload, ecModel) {
        var linkedNodesFinder = helper.createLinkedNodesFinder(zrUtil.bind(ecModel.eachComponent, ecModel, 'dataZoom'), helper.eachAxisDim, function(model, dimNames) {
          return model.get(dimNames.axisIndex);
        });
        var effectedModels = [];
        ecModel.eachComponent({
          mainType: 'dataZoom',
          query: payload
        }, function(model, index) {
          effectedModels.push.apply(effectedModels, linkedNodesFinder(model).nodes);
        });
        zrUtil.each(effectedModels, function(dataZoomModel, index) {
          dataZoomModel.setRawRange({
            start: payload.start,
            end: payload.end,
            startValue: payload.startValue,
            endValue: payload.endValue
          });
        });
      });
    }, , , , , , , , , , , , , , , , function(module, exports, __webpack_require__) {
      __webpack_require__(359);
      __webpack_require__(361);
      __webpack_require__(1).registerPreprocessor(function(opt) {
        opt.markPoint = opt.markPoint || {};
      });
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(360).extend({
        type: 'markPoint',
        defaultOption: {
          zlevel: 0,
          z: 5,
          symbol: 'pin',
          symbolSize: 50,
          tooltip: {trigger: 'item'},
          label: {
            normal: {
              show: true,
              position: 'inside'
            },
            emphasis: {show: true}
          },
          itemStyle: {normal: {borderWidth: 2}}
        }
      });
    }, function(module, exports, __webpack_require__) {
      var modelUtil = __webpack_require__(5);
      var zrUtil = __webpack_require__(4);
      var env = __webpack_require__(2);
      var formatUtil = __webpack_require__(6);
      var addCommas = formatUtil.addCommas;
      var encodeHTML = formatUtil.encodeHTML;
      function fillLabel(opt) {
        modelUtil.defaultEmphasis(opt.label, modelUtil.LABEL_OPTIONS);
      }
      var MarkerModel = __webpack_require__(1).extendComponentModel({
        type: 'marker',
        dependencies: ['series', 'grid', 'polar', 'geo'],
        init: function(option, parentModel, ecModel, extraOpt) {
          if (true) {
            if (this.type === 'marker') {
              throw new Error('Marker component is abstract component. Use markLine, markPoint, markArea instead.');
            }
          }
          this.mergeDefaultAndTheme(option, ecModel);
          this.mergeOption(option, ecModel, extraOpt.createdBySelf, true);
        },
        isAnimationEnabled: function() {
          if (env.node) {
            return false;
          }
          var hostSeries = this.__hostSeries;
          return this.getShallow('animation') && hostSeries && hostSeries.isAnimationEnabled();
        },
        mergeOption: function(newOpt, ecModel, createdBySelf, isInit) {
          var MarkerModel = this.constructor;
          var modelPropName = this.mainType + 'Model';
          if (!createdBySelf) {
            ecModel.eachSeries(function(seriesModel) {
              var markerOpt = seriesModel.get(this.mainType);
              var markerModel = seriesModel[modelPropName];
              if (!markerOpt || !markerOpt.data) {
                seriesModel[modelPropName] = null;
                return;
              }
              if (!markerModel) {
                if (isInit) {
                  fillLabel(markerOpt);
                }
                zrUtil.each(markerOpt.data, function(item) {
                  if (item instanceof Array) {
                    fillLabel(item[0]);
                    fillLabel(item[1]);
                  } else {
                    fillLabel(item);
                  }
                });
                markerModel = new MarkerModel(markerOpt, this, ecModel);
                zrUtil.extend(markerModel, {
                  mainType: this.mainType,
                  seriesIndex: seriesModel.seriesIndex,
                  name: seriesModel.name,
                  createdBySelf: true
                });
                markerModel.__hostSeries = seriesModel;
              } else {
                markerModel.mergeOption(markerOpt, ecModel, true);
              }
              seriesModel[modelPropName] = markerModel;
            }, this);
          }
        },
        formatTooltip: function(dataIndex) {
          var data = this.getData();
          var value = this.getRawValue(dataIndex);
          var formattedValue = zrUtil.isArray(value) ? zrUtil.map(value, addCommas).join(', ') : addCommas(value);
          var name = data.getName(dataIndex);
          var html = encodeHTML(this.name);
          if (value != null || name) {
            html += '<br />';
          }
          if (name) {
            html += encodeHTML(name);
            if (value != null) {
              html += ' : ';
            }
          }
          if (value != null) {
            html += encodeHTML(formattedValue);
          }
          return html;
        },
        getData: function() {
          return this._data;
        },
        setData: function(data) {
          this._data = data;
        }
      });
      zrUtil.mixin(MarkerModel, modelUtil.dataFormatMixin);
      module.exports = MarkerModel;
    }, function(module, exports, __webpack_require__) {
      var SymbolDraw = __webpack_require__(105);
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var List = __webpack_require__(98);
      var markerHelper = __webpack_require__(362);
      function updateMarkerLayout(mpData, seriesModel, api) {
        var coordSys = seriesModel.coordinateSystem;
        mpData.each(function(idx) {
          var itemModel = mpData.getItemModel(idx);
          var point;
          var xPx = numberUtil.parsePercent(itemModel.get('x'), api.getWidth());
          var yPx = numberUtil.parsePercent(itemModel.get('y'), api.getHeight());
          if (!isNaN(xPx) && !isNaN(yPx)) {
            point = [xPx, yPx];
          } else if (seriesModel.getMarkerPosition) {
            point = seriesModel.getMarkerPosition(mpData.getValues(mpData.dimensions, idx));
          } else if (coordSys) {
            var x = mpData.get(coordSys.dimensions[0], idx);
            var y = mpData.get(coordSys.dimensions[1], idx);
            point = coordSys.dataToPoint([x, y]);
          }
          if (!isNaN(xPx)) {
            point[0] = xPx;
          }
          if (!isNaN(yPx)) {
            point[1] = yPx;
          }
          mpData.setItemLayout(idx, point);
        });
      }
      __webpack_require__(363).extend({
        type: 'markPoint',
        updateLayout: function(markPointModel, ecModel, api) {
          ecModel.eachSeries(function(seriesModel) {
            var mpModel = seriesModel.markPointModel;
            if (mpModel) {
              updateMarkerLayout(mpModel.getData(), seriesModel, api);
              this.markerGroupMap[seriesModel.name].updateLayout(mpModel);
            }
          }, this);
        },
        renderSeries: function(seriesModel, mpModel, ecModel, api) {
          var coordSys = seriesModel.coordinateSystem;
          var seriesName = seriesModel.name;
          var seriesData = seriesModel.getData();
          var symbolDrawMap = this.markerGroupMap;
          var symbolDraw = symbolDrawMap[seriesName];
          if (!symbolDraw) {
            symbolDraw = symbolDrawMap[seriesName] = new SymbolDraw();
          }
          var mpData = createList(coordSys, seriesModel, mpModel);
          mpModel.setData(mpData);
          updateMarkerLayout(mpModel.getData(), seriesModel, api);
          mpData.each(function(idx) {
            var itemModel = mpData.getItemModel(idx);
            var symbolSize = itemModel.getShallow('symbolSize');
            if (typeof symbolSize === 'function') {
              symbolSize = symbolSize(mpModel.getRawValue(idx), mpModel.getDataParams(idx));
            }
            mpData.setItemVisual(idx, {
              symbolSize: symbolSize,
              color: itemModel.get('itemStyle.normal.color') || seriesData.getVisual('color'),
              symbol: itemModel.getShallow('symbol')
            });
          });
          symbolDraw.updateData(mpData);
          this.group.add(symbolDraw.group);
          mpData.eachItemGraphicEl(function(el) {
            el.traverse(function(child) {
              child.dataModel = mpModel;
            });
          });
          symbolDraw.__keep = true;
          symbolDraw.group.silent = mpModel.get('silent') || seriesModel.get('silent');
        }
      });
      function createList(coordSys, seriesModel, mpModel) {
        var coordDimsInfos;
        if (coordSys) {
          coordDimsInfos = zrUtil.map(coordSys && coordSys.dimensions, function(coordDim) {
            var info = seriesModel.getData().getDimensionInfo(seriesModel.coordDimToDataDim(coordDim)[0]) || {};
            info.name = coordDim;
            return info;
          });
        } else {
          coordDimsInfos = [{
            name: 'value',
            type: 'float'
          }];
        }
        var mpData = new List(coordDimsInfos, mpModel);
        var dataOpt = zrUtil.map(mpModel.get('data'), zrUtil.curry(markerHelper.dataTransform, seriesModel));
        if (coordSys) {
          dataOpt = zrUtil.filter(dataOpt, zrUtil.curry(markerHelper.dataFilter, coordSys));
        }
        mpData.initData(dataOpt, null, coordSys ? markerHelper.dimValueGetter : function(item) {
          return item.value;
        });
        return mpData;
      }
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var numberUtil = __webpack_require__(7);
      var indexOf = zrUtil.indexOf;
      function hasXOrY(item) {
        return !(isNaN(parseFloat(item.x)) && isNaN(parseFloat(item.y)));
      }
      function hasXAndY(item) {
        return !isNaN(parseFloat(item.x)) && !isNaN(parseFloat(item.y));
      }
      function getPrecision(data, valueAxisDim, dataIndex) {
        var precision = -1;
        do {
          precision = Math.max(numberUtil.getPrecision(data.get(valueAxisDim, dataIndex)), precision);
          data = data.stackedOn;
        } while (data);
        return precision;
      }
      function markerTypeCalculatorWithExtent(mlType, data, otherDataDim, targetDataDim, otherCoordIndex, targetCoordIndex) {
        var coordArr = [];
        var value = numCalculate(data, targetDataDim, mlType);
        var dataIndex = data.indexOfNearest(targetDataDim, value, true);
        coordArr[otherCoordIndex] = data.get(otherDataDim, dataIndex, true);
        coordArr[targetCoordIndex] = data.get(targetDataDim, dataIndex, true);
        var precision = getPrecision(data, targetDataDim, dataIndex);
        if (precision >= 0) {
          coordArr[targetCoordIndex] = +coordArr[targetCoordIndex].toFixed(precision);
        }
        return coordArr;
      }
      var curry = zrUtil.curry;
      var markerTypeCalculator = {
        min: curry(markerTypeCalculatorWithExtent, 'min'),
        max: curry(markerTypeCalculatorWithExtent, 'max'),
        average: curry(markerTypeCalculatorWithExtent, 'average')
      };
      var dataTransform = function(seriesModel, item) {
        var data = seriesModel.getData();
        var coordSys = seriesModel.coordinateSystem;
        if (item && !hasXAndY(item) && !zrUtil.isArray(item.coord) && coordSys) {
          var dims = coordSys.dimensions;
          var axisInfo = getAxisInfo(item, data, coordSys, seriesModel);
          item = zrUtil.clone(item);
          if (item.type && markerTypeCalculator[item.type] && axisInfo.baseAxis && axisInfo.valueAxis) {
            var otherCoordIndex = indexOf(dims, axisInfo.baseAxis.dim);
            var targetCoordIndex = indexOf(dims, axisInfo.valueAxis.dim);
            item.coord = markerTypeCalculator[item.type](data, axisInfo.baseDataDim, axisInfo.valueDataDim, otherCoordIndex, targetCoordIndex);
            item.value = item.coord[targetCoordIndex];
          } else {
            var coord = [item.xAxis != null ? item.xAxis : item.radiusAxis, item.yAxis != null ? item.yAxis : item.angleAxis];
            for (var i = 0; i < 2; i++) {
              if (markerTypeCalculator[coord[i]]) {
                var dataDim = seriesModel.coordDimToDataDim(dims[i])[0];
                coord[i] = numCalculate(data, dataDim, coord[i]);
              }
            }
            item.coord = coord;
          }
        }
        return item;
      };
      var getAxisInfo = function(item, data, coordSys, seriesModel) {
        var ret = {};
        if (item.valueIndex != null || item.valueDim != null) {
          ret.valueDataDim = item.valueIndex != null ? data.getDimension(item.valueIndex) : item.valueDim;
          ret.valueAxis = coordSys.getAxis(seriesModel.dataDimToCoordDim(ret.valueDataDim));
          ret.baseAxis = coordSys.getOtherAxis(ret.valueAxis);
          ret.baseDataDim = seriesModel.coordDimToDataDim(ret.baseAxis.dim)[0];
        } else {
          ret.baseAxis = seriesModel.getBaseAxis();
          ret.valueAxis = coordSys.getOtherAxis(ret.baseAxis);
          ret.baseDataDim = seriesModel.coordDimToDataDim(ret.baseAxis.dim)[0];
          ret.valueDataDim = seriesModel.coordDimToDataDim(ret.valueAxis.dim)[0];
        }
        return ret;
      };
      var dataFilter = function(coordSys, item) {
        return (coordSys && coordSys.containData && item.coord && !hasXOrY(item)) ? coordSys.containData(item.coord) : true;
      };
      var dimValueGetter = function(item, dimName, dataIndex, dimIndex) {
        if (dimIndex < 2) {
          return item.coord && item.coord[dimIndex];
        }
        return item.value;
      };
      var numCalculate = function(data, valueDataDim, type) {
        if (type === 'average') {
          var sum = 0;
          var count = 0;
          data.each(valueDataDim, function(val, idx) {
            if (!isNaN(val)) {
              sum += val;
              count++;
            }
          }, true);
          return sum / count;
        } else {
          return data.getDataExtent(valueDataDim, true)[type === 'max' ? 1 : 0];
        }
      };
      module.exports = {
        dataTransform: dataTransform,
        dataFilter: dataFilter,
        dimValueGetter: dimValueGetter,
        getAxisInfo: getAxisInfo,
        numCalculate: numCalculate
      };
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(1).extendComponentView({
        type: 'marker',
        init: function() {
          this.markerGroupMap = {};
        },
        render: function(markerModel, ecModel, api) {
          var markerGroupMap = this.markerGroupMap;
          for (var name in markerGroupMap) {
            if (markerGroupMap.hasOwnProperty(name)) {
              markerGroupMap[name].__keep = false;
            }
          }
          var markerModelKey = this.type + 'Model';
          ecModel.eachSeries(function(seriesModel) {
            var markerModel = seriesModel[markerModelKey];
            markerModel && this.renderSeries(seriesModel, markerModel, ecModel, api);
          }, this);
          for (var name in markerGroupMap) {
            if (markerGroupMap.hasOwnProperty(name) && !markerGroupMap[name].__keep) {
              this.group.remove(markerGroupMap[name].group);
            }
          }
        },
        renderSeries: function() {}
      });
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(365);
      __webpack_require__(366);
      __webpack_require__(1).registerPreprocessor(function(opt) {
        opt.markLine = opt.markLine || {};
      });
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(360).extend({
        type: 'markLine',
        defaultOption: {
          zlevel: 0,
          z: 5,
          symbol: ['circle', 'arrow'],
          symbolSize: [8, 16],
          precision: 2,
          tooltip: {trigger: 'item'},
          label: {
            normal: {
              show: true,
              position: 'end'
            },
            emphasis: {show: true}
          },
          lineStyle: {
            normal: {type: 'dashed'},
            emphasis: {width: 3}
          },
          animationEasing: 'linear'
        }
      });
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var List = __webpack_require__(98);
      var numberUtil = __webpack_require__(7);
      var markerHelper = __webpack_require__(362);
      var LineDraw = __webpack_require__(202);
      var markLineTransform = function(seriesModel, coordSys, mlModel, item) {
        var data = seriesModel.getData();
        var mlType = item.type;
        if (!zrUtil.isArray(item) && (mlType === 'min' || mlType === 'max' || mlType === 'average' || (item.xAxis != null || item.yAxis != null))) {
          var valueAxis;
          var valueDataDim;
          var value;
          if (item.yAxis != null || item.xAxis != null) {
            valueDataDim = item.yAxis != null ? 'y' : 'x';
            valueAxis = coordSys.getAxis(valueDataDim);
            value = zrUtil.retrieve(item.yAxis, item.xAxis);
          } else {
            var axisInfo = markerHelper.getAxisInfo(item, data, coordSys, seriesModel);
            valueDataDim = axisInfo.valueDataDim;
            valueAxis = axisInfo.valueAxis;
            value = markerHelper.numCalculate(data, valueDataDim, mlType);
          }
          var valueIndex = valueDataDim === 'x' ? 0 : 1;
          var baseIndex = 1 - valueIndex;
          var mlFrom = zrUtil.clone(item);
          var mlTo = {};
          mlFrom.type = null;
          mlFrom.coord = [];
          mlTo.coord = [];
          mlFrom.coord[baseIndex] = -Infinity;
          mlTo.coord[baseIndex] = Infinity;
          var precision = mlModel.get('precision');
          if (precision >= 0 && typeof value === 'number') {
            value = +value.toFixed(precision);
          }
          mlFrom.coord[valueIndex] = mlTo.coord[valueIndex] = value;
          item = [mlFrom, mlTo, {
            type: mlType,
            valueIndex: item.valueIndex,
            value: value
          }];
        }
        item = [markerHelper.dataTransform(seriesModel, item[0]), markerHelper.dataTransform(seriesModel, item[1]), zrUtil.extend({}, item[2])];
        item[2].type = item[2].type || '';
        zrUtil.merge(item[2], item[0]);
        zrUtil.merge(item[2], item[1]);
        return item;
      };
      function isInifinity(val) {
        return !isNaN(val) && !isFinite(val);
      }
      function ifMarkLineHasOnlyDim(dimIndex, fromCoord, toCoord, coordSys) {
        var otherDimIndex = 1 - dimIndex;
        var dimName = coordSys.dimensions[dimIndex];
        return isInifinity(fromCoord[otherDimIndex]) && isInifinity(toCoord[otherDimIndex]) && fromCoord[dimIndex] === toCoord[dimIndex] && coordSys.getAxis(dimName).containData(fromCoord[dimIndex]);
      }
      function markLineFilter(coordSys, item) {
        if (coordSys.type === 'cartesian2d') {
          var fromCoord = item[0].coord;
          var toCoord = item[1].coord;
          if (fromCoord && toCoord && (ifMarkLineHasOnlyDim(1, fromCoord, toCoord, coordSys) || ifMarkLineHasOnlyDim(0, fromCoord, toCoord, coordSys))) {
            return true;
          }
        }
        return markerHelper.dataFilter(coordSys, item[0]) && markerHelper.dataFilter(coordSys, item[1]);
      }
      function updateSingleMarkerEndLayout(data, idx, isFrom, seriesModel, api) {
        var coordSys = seriesModel.coordinateSystem;
        var itemModel = data.getItemModel(idx);
        var point;
        var xPx = numberUtil.parsePercent(itemModel.get('x'), api.getWidth());
        var yPx = numberUtil.parsePercent(itemModel.get('y'), api.getHeight());
        if (!isNaN(xPx) && !isNaN(yPx)) {
          point = [xPx, yPx];
        } else {
          if (seriesModel.getMarkerPosition) {
            point = seriesModel.getMarkerPosition(data.getValues(data.dimensions, idx));
          } else {
            var dims = coordSys.dimensions;
            var x = data.get(dims[0], idx);
            var y = data.get(dims[1], idx);
            point = coordSys.dataToPoint([x, y]);
          }
          if (coordSys.type === 'cartesian2d') {
            var xAxis = coordSys.getAxis('x');
            var yAxis = coordSys.getAxis('y');
            var dims = coordSys.dimensions;
            if (isInifinity(data.get(dims[0], idx))) {
              point[0] = xAxis.toGlobalCoord(xAxis.getExtent()[isFrom ? 0 : 1]);
            } else if (isInifinity(data.get(dims[1], idx))) {
              point[1] = yAxis.toGlobalCoord(yAxis.getExtent()[isFrom ? 0 : 1]);
            }
          }
          if (!isNaN(xPx)) {
            point[0] = xPx;
          }
          if (!isNaN(yPx)) {
            point[1] = yPx;
          }
        }
        data.setItemLayout(idx, point);
      }
      __webpack_require__(363).extend({
        type: 'markLine',
        updateLayout: function(markLineModel, ecModel, api) {
          ecModel.eachSeries(function(seriesModel) {
            var mlModel = seriesModel.markLineModel;
            if (mlModel) {
              var mlData = mlModel.getData();
              var fromData = mlModel.__from;
              var toData = mlModel.__to;
              fromData.each(function(idx) {
                updateSingleMarkerEndLayout(fromData, idx, true, seriesModel, api);
                updateSingleMarkerEndLayout(toData, idx, false, seriesModel, api);
              });
              mlData.each(function(idx) {
                mlData.setItemLayout(idx, [fromData.getItemLayout(idx), toData.getItemLayout(idx)]);
              });
              this.markerGroupMap[seriesModel.name].updateLayout();
            }
          }, this);
        },
        renderSeries: function(seriesModel, mlModel, ecModel, api) {
          var coordSys = seriesModel.coordinateSystem;
          var seriesName = seriesModel.name;
          var seriesData = seriesModel.getData();
          var lineDrawMap = this.markerGroupMap;
          var lineDraw = lineDrawMap[seriesName];
          if (!lineDraw) {
            lineDraw = lineDrawMap[seriesName] = new LineDraw();
          }
          this.group.add(lineDraw.group);
          var mlData = createList(coordSys, seriesModel, mlModel);
          var fromData = mlData.from;
          var toData = mlData.to;
          var lineData = mlData.line;
          mlModel.__from = fromData;
          mlModel.__to = toData;
          mlModel.setData(lineData);
          var symbolType = mlModel.get('symbol');
          var symbolSize = mlModel.get('symbolSize');
          if (!zrUtil.isArray(symbolType)) {
            symbolType = [symbolType, symbolType];
          }
          if (typeof symbolSize === 'number') {
            symbolSize = [symbolSize, symbolSize];
          }
          mlData.from.each(function(idx) {
            updateDataVisualAndLayout(fromData, idx, true);
            updateDataVisualAndLayout(toData, idx, false);
          });
          lineData.each(function(idx) {
            var lineColor = lineData.getItemModel(idx).get('lineStyle.normal.color');
            lineData.setItemVisual(idx, {color: lineColor || fromData.getItemVisual(idx, 'color')});
            lineData.setItemLayout(idx, [fromData.getItemLayout(idx), toData.getItemLayout(idx)]);
            lineData.setItemVisual(idx, {
              'fromSymbolSize': fromData.getItemVisual(idx, 'symbolSize'),
              'fromSymbol': fromData.getItemVisual(idx, 'symbol'),
              'toSymbolSize': toData.getItemVisual(idx, 'symbolSize'),
              'toSymbol': toData.getItemVisual(idx, 'symbol')
            });
          });
          lineDraw.updateData(lineData);
          mlData.line.eachItemGraphicEl(function(el, idx) {
            el.traverse(function(child) {
              child.dataModel = mlModel;
            });
          });
          function updateDataVisualAndLayout(data, idx, isFrom) {
            var itemModel = data.getItemModel(idx);
            updateSingleMarkerEndLayout(data, idx, isFrom, seriesModel, api);
            data.setItemVisual(idx, {
              symbolSize: itemModel.get('symbolSize') || symbolSize[isFrom ? 0 : 1],
              symbol: itemModel.get('symbol', true) || symbolType[isFrom ? 0 : 1],
              color: itemModel.get('itemStyle.normal.color') || seriesData.getVisual('color')
            });
          }
          lineDraw.__keep = true;
          lineDraw.group.silent = mlModel.get('silent') || seriesModel.get('silent');
        }
      });
      function createList(coordSys, seriesModel, mlModel) {
        var coordDimsInfos;
        if (coordSys) {
          coordDimsInfos = zrUtil.map(coordSys && coordSys.dimensions, function(coordDim) {
            var info = seriesModel.getData().getDimensionInfo(seriesModel.coordDimToDataDim(coordDim)[0]) || {};
            info.name = coordDim;
            return info;
          });
        } else {
          coordDimsInfos = [{
            name: 'value',
            type: 'float'
          }];
        }
        var fromData = new List(coordDimsInfos, mlModel);
        var toData = new List(coordDimsInfos, mlModel);
        var lineData = new List([], mlModel);
        var optData = zrUtil.map(mlModel.get('data'), zrUtil.curry(markLineTransform, seriesModel, coordSys, mlModel));
        if (coordSys) {
          optData = zrUtil.filter(optData, zrUtil.curry(markLineFilter, coordSys));
        }
        var dimValueGetter = coordSys ? markerHelper.dimValueGetter : function(item) {
          return item.value;
        };
        fromData.initData(zrUtil.map(optData, function(item) {
          return item[0];
        }), null, dimValueGetter);
        toData.initData(zrUtil.map(optData, function(item) {
          return item[1];
        }), null, dimValueGetter);
        lineData.initData(zrUtil.map(optData, function(item) {
          return item[2];
        }));
        lineData.hasItemOption = true;
        return {
          from: fromData,
          to: toData,
          line: lineData
        };
      }
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(368);
      __webpack_require__(369);
      __webpack_require__(1).registerPreprocessor(function(opt) {
        opt.markArea = opt.markArea || {};
      });
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(360).extend({
        type: 'markArea',
        defaultOption: {
          zlevel: 0,
          z: 1,
          tooltip: {trigger: 'item'},
          animation: false,
          label: {
            normal: {
              show: true,
              position: 'top'
            },
            emphasis: {
              show: true,
              position: 'top'
            }
          },
          itemStyle: {normal: {borderWidth: 0}}
        }
      });
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var List = __webpack_require__(98);
      var numberUtil = __webpack_require__(7);
      var graphic = __webpack_require__(43);
      var colorUtil = __webpack_require__(39);
      var markerHelper = __webpack_require__(362);
      var markAreaTransform = function(seriesModel, coordSys, maModel, item) {
        var lt = markerHelper.dataTransform(seriesModel, item[0]);
        var rb = markerHelper.dataTransform(seriesModel, item[1]);
        var retrieve = zrUtil.retrieve;
        var ltCoord = lt.coord;
        var rbCoord = rb.coord;
        ltCoord[0] = retrieve(ltCoord[0], -Infinity);
        ltCoord[1] = retrieve(ltCoord[1], -Infinity);
        rbCoord[0] = retrieve(rbCoord[0], Infinity);
        rbCoord[1] = retrieve(rbCoord[1], Infinity);
        var result = zrUtil.mergeAll([{}, lt, rb]);
        result.coord = [lt.coord, rb.coord];
        result.x0 = lt.x;
        result.y0 = lt.y;
        result.x1 = rb.x;
        result.y1 = rb.y;
        return result;
      };
      function isInifinity(val) {
        return !isNaN(val) && !isFinite(val);
      }
      function ifMarkLineHasOnlyDim(dimIndex, fromCoord, toCoord, coordSys) {
        var otherDimIndex = 1 - dimIndex;
        return isInifinity(fromCoord[otherDimIndex]) && isInifinity(toCoord[otherDimIndex]);
      }
      function markAreaFilter(coordSys, item) {
        var fromCoord = item.coord[0];
        var toCoord = item.coord[1];
        if (coordSys.type === 'cartesian2d') {
          if (fromCoord && toCoord && (ifMarkLineHasOnlyDim(1, fromCoord, toCoord, coordSys) || ifMarkLineHasOnlyDim(0, fromCoord, toCoord, coordSys))) {
            return true;
          }
        }
        return markerHelper.dataFilter(coordSys, {
          coord: fromCoord,
          x: item.x0,
          y: item.y0
        }) || markerHelper.dataFilter(coordSys, {
          coord: toCoord,
          x: item.x1,
          y: item.y1
        });
      }
      function getSingleMarkerEndPoint(data, idx, dims, seriesModel, api) {
        var coordSys = seriesModel.coordinateSystem;
        var itemModel = data.getItemModel(idx);
        var point;
        var xPx = numberUtil.parsePercent(itemModel.get(dims[0]), api.getWidth());
        var yPx = numberUtil.parsePercent(itemModel.get(dims[1]), api.getHeight());
        if (!isNaN(xPx) && !isNaN(yPx)) {
          point = [xPx, yPx];
        } else {
          if (seriesModel.getMarkerPosition) {
            point = seriesModel.getMarkerPosition(data.getValues(dims, idx));
          } else {
            var x = data.get(dims[0], idx);
            var y = data.get(dims[1], idx);
            point = coordSys.dataToPoint([x, y], true);
          }
          if (coordSys.type === 'cartesian2d') {
            var xAxis = coordSys.getAxis('x');
            var yAxis = coordSys.getAxis('y');
            var x = data.get(dims[0], idx);
            var y = data.get(dims[1], idx);
            if (isInifinity(x)) {
              point[0] = xAxis.toGlobalCoord(xAxis.getExtent()[dims[0] === 'x0' ? 0 : 1]);
            } else if (isInifinity(y)) {
              point[1] = yAxis.toGlobalCoord(yAxis.getExtent()[dims[1] === 'y0' ? 0 : 1]);
            }
          }
          if (!isNaN(xPx)) {
            point[0] = xPx;
          }
          if (!isNaN(yPx)) {
            point[1] = yPx;
          }
        }
        return point;
      }
      var dimPermutations = [['x0', 'y0'], ['x1', 'y0'], ['x1', 'y1'], ['x0', 'y1']];
      __webpack_require__(363).extend({
        type: 'markArea',
        updateLayout: function(markAreaModel, ecModel, api) {
          ecModel.eachSeries(function(seriesModel) {
            var maModel = seriesModel.markAreaModel;
            if (maModel) {
              var areaData = maModel.getData();
              areaData.each(function(idx) {
                var points = zrUtil.map(dimPermutations, function(dim) {
                  return getSingleMarkerEndPoint(areaData, idx, dim, seriesModel, api);
                });
                areaData.setItemLayout(idx, points);
                var el = areaData.getItemGraphicEl(idx);
                el.setShape('points', points);
              });
            }
          }, this);
        },
        renderSeries: function(seriesModel, maModel, ecModel, api) {
          var coordSys = seriesModel.coordinateSystem;
          var seriesName = seriesModel.name;
          var seriesData = seriesModel.getData();
          var areaGroupMap = this.markerGroupMap;
          var polygonGroup = areaGroupMap[seriesName];
          if (!polygonGroup) {
            polygonGroup = areaGroupMap[seriesName] = {group: new graphic.Group()};
          }
          this.group.add(polygonGroup.group);
          polygonGroup.__keep = true;
          var areaData = createList(coordSys, seriesModel, maModel);
          maModel.setData(areaData);
          areaData.each(function(idx) {
            areaData.setItemLayout(idx, zrUtil.map(dimPermutations, function(dim) {
              return getSingleMarkerEndPoint(areaData, idx, dim, seriesModel, api);
            }));
            areaData.setItemVisual(idx, {color: seriesData.getVisual('color')});
          });
          areaData.diff(polygonGroup.__data).add(function(idx) {
            var polygon = new graphic.Polygon({shape: {points: areaData.getItemLayout(idx)}});
            areaData.setItemGraphicEl(idx, polygon);
            polygonGroup.group.add(polygon);
          }).update(function(newIdx, oldIdx) {
            var polygon = polygonGroup.__data.getItemGraphicEl(oldIdx);
            graphic.updateProps(polygon, {shape: {points: areaData.getItemLayout(newIdx)}}, maModel, newIdx);
            polygonGroup.group.add(polygon);
            areaData.setItemGraphicEl(newIdx, polygon);
          }).remove(function(idx) {
            var polygon = polygonGroup.__data.getItemGraphicEl(idx);
            polygonGroup.group.remove(polygon);
          }).execute();
          areaData.eachItemGraphicEl(function(polygon, idx) {
            var itemModel = areaData.getItemModel(idx);
            var labelModel = itemModel.getModel('label.normal');
            var labelHoverModel = itemModel.getModel('label.emphasis');
            var color = areaData.getItemVisual(idx, 'color');
            polygon.useStyle(zrUtil.defaults(itemModel.getModel('itemStyle.normal').getItemStyle(), {
              fill: colorUtil.modifyAlpha(color, 0.4),
              stroke: color
            }));
            polygon.hoverStyle = itemModel.getModel('itemStyle.normal').getItemStyle();
            var defaultValue = areaData.getName(idx) || '';
            var textColor = color || polygon.style.fill;
            if (labelModel.getShallow('show')) {
              graphic.setText(polygon.style, labelModel, textColor);
              polygon.style.text = zrUtil.retrieve(maModel.getFormattedLabel(idx, 'normal'), defaultValue);
            } else {
              polygon.style.text = '';
            }
            if (labelHoverModel.getShallow('show')) {
              graphic.setText(polygon.hoverStyle, labelHoverModel, textColor);
              polygon.hoverStyle.text = zrUtil.retrieve(maModel.getFormattedLabel(idx, 'emphasis'), defaultValue);
            } else {
              polygon.hoverStyle.text = '';
            }
            graphic.setHoverStyle(polygon, {});
            polygon.dataModel = maModel;
          });
          polygonGroup.__data = areaData;
          polygonGroup.group.silent = maModel.get('silent') || seriesModel.get('silent');
        }
      });
      function createList(coordSys, seriesModel, maModel) {
        var coordDimsInfos;
        var areaData;
        var dims = ['x0', 'y0', 'x1', 'y1'];
        if (coordSys) {
          coordDimsInfos = zrUtil.map(coordSys && coordSys.dimensions, function(coordDim) {
            var info = seriesModel.getData().getDimensionInfo(seriesModel.coordDimToDataDim(coordDim)[0]) || {};
            info.name = coordDim;
            return info;
          });
          areaData = new List(zrUtil.map(dims, function(dim, idx) {
            return {
              name: dim,
              type: coordDimsInfos[idx % 2].type
            };
          }), maModel);
        } else {
          coordDimsInfos = [{
            name: 'value',
            type: 'float'
          }];
          areaData = new List(coordDimsInfos, maModel);
        }
        var optData = zrUtil.map(maModel.get('data'), zrUtil.curry(markAreaTransform, seriesModel, coordSys, maModel));
        if (coordSys) {
          optData = zrUtil.filter(optData, zrUtil.curry(markAreaFilter, coordSys));
        }
        var dimValueGetter = coordSys ? function(item, dimName, dataIndex, dimIndex) {
          return item.coord[Math.floor(dimIndex / 2)][dimIndex % 2];
        } : function(item) {
          return item.value;
        };
        areaData.initData(optData, null, dimValueGetter);
        areaData.hasItemOption = true;
        return areaData;
      }
    }, , , , , , , , , , function(module, exports, __webpack_require__) {
      __webpack_require__(380);
      __webpack_require__(381);
      __webpack_require__(382);
      __webpack_require__(383);
      __webpack_require__(384);
      __webpack_require__(385);
      __webpack_require__(390);
    }, function(module, exports, __webpack_require__) {
      var featureManager = __webpack_require__(327);
      var zrUtil = __webpack_require__(4);
      var ToolboxModel = __webpack_require__(1).extendComponentModel({
        type: 'toolbox',
        layoutMode: {
          type: 'box',
          ignoreSize: true
        },
        mergeDefaultAndTheme: function(option) {
          ToolboxModel.superApply(this, 'mergeDefaultAndTheme', arguments);
          zrUtil.each(this.option.feature, function(featureOpt, featureName) {
            var Feature = featureManager.get(featureName);
            Feature && zrUtil.merge(featureOpt, Feature.defaultOption);
          });
        },
        defaultOption: {
          show: true,
          z: 6,
          zlevel: 0,
          orient: 'horizontal',
          left: 'right',
          top: 'top',
          backgroundColor: 'transparent',
          borderColor: '#ccc',
          borderWidth: 0,
          padding: 5,
          itemSize: 15,
          itemGap: 8,
          showTitle: true,
          iconStyle: {
            normal: {
              borderColor: '#666',
              color: 'none'
            },
            emphasis: {borderColor: '#3E98C5'}
          }
        }
      });
      module.exports = ToolboxModel;
    }, function(module, exports, __webpack_require__) {
      (function(process) {
        var featureManager = __webpack_require__(327);
        var zrUtil = __webpack_require__(4);
        var graphic = __webpack_require__(43);
        var Model = __webpack_require__(12);
        var DataDiffer = __webpack_require__(99);
        var listComponentHelper = __webpack_require__(297);
        var textContain = __webpack_require__(8);
        module.exports = __webpack_require__(1).extendComponentView({
          type: 'toolbox',
          render: function(toolboxModel, ecModel, api, payload) {
            var group = this.group;
            group.removeAll();
            if (!toolboxModel.get('show')) {
              return;
            }
            var itemSize = +toolboxModel.get('itemSize');
            var featureOpts = toolboxModel.get('feature') || {};
            var features = this._features || (this._features = {});
            var featureNames = [];
            zrUtil.each(featureOpts, function(opt, name) {
              featureNames.push(name);
            });
            (new DataDiffer(this._featureNames || [], featureNames)).add(process).update(process).remove(zrUtil.curry(process, null)).execute();
            this._featureNames = featureNames;
            function process(newIndex, oldIndex) {
              var featureName = featureNames[newIndex];
              var oldName = featureNames[oldIndex];
              var featureOpt = featureOpts[featureName];
              var featureModel = new Model(featureOpt, toolboxModel, toolboxModel.ecModel);
              var feature;
              if (featureName && !oldName) {
                if (isUserFeatureName(featureName)) {
                  feature = {
                    model: featureModel,
                    onclick: featureModel.option.onclick,
                    featureName: featureName
                  };
                } else {
                  var Feature = featureManager.get(featureName);
                  if (!Feature) {
                    return;
                  }
                  feature = new Feature(featureModel, ecModel, api);
                }
                features[featureName] = feature;
              } else {
                feature = features[oldName];
                if (!feature) {
                  return;
                }
                feature.model = featureModel;
                feature.ecModel = ecModel;
                feature.api = api;
              }
              if (!featureName && oldName) {
                feature.dispose && feature.dispose(ecModel, api);
                return;
              }
              if (!featureModel.get('show') || feature.unusable) {
                feature.remove && feature.remove(ecModel, api);
                return;
              }
              createIconPaths(featureModel, feature, featureName);
              featureModel.setIconStatus = function(iconName, status) {
                var option = this.option;
                var iconPaths = this.iconPaths;
                option.iconStatus = option.iconStatus || {};
                option.iconStatus[iconName] = status;
                iconPaths[iconName] && iconPaths[iconName].trigger(status);
              };
              if (feature.render) {
                feature.render(featureModel, ecModel, api, payload);
              }
            }
            function createIconPaths(featureModel, feature, featureName) {
              var iconStyleModel = featureModel.getModel('iconStyle');
              var icons = feature.getIcons ? feature.getIcons() : featureModel.get('icon');
              var titles = featureModel.get('title') || {};
              if (typeof icons === 'string') {
                var icon = icons;
                var title = titles;
                icons = {};
                titles = {};
                icons[featureName] = icon;
                titles[featureName] = title;
              }
              var iconPaths = featureModel.iconPaths = {};
              zrUtil.each(icons, function(icon, iconName) {
                var normalStyle = iconStyleModel.getModel('normal').getItemStyle();
                var hoverStyle = iconStyleModel.getModel('emphasis').getItemStyle();
                var style = {
                  x: -itemSize / 2,
                  y: -itemSize / 2,
                  width: itemSize,
                  height: itemSize
                };
                var path = icon.indexOf('image://') === 0 ? (style.image = icon.slice(8), new graphic.Image({style: style})) : graphic.makePath(icon.replace('path://', ''), {
                  style: normalStyle,
                  hoverStyle: hoverStyle,
                  rectHover: true
                }, style, 'center');
                graphic.setHoverStyle(path);
                if (toolboxModel.get('showTitle')) {
                  path.__title = titles[iconName];
                  path.on('mouseover', function() {
                    var hoverStyle = iconStyleModel.getModel('emphasis').getItemStyle();
                    path.setStyle({
                      text: titles[iconName],
                      textPosition: hoverStyle.textPosition || 'bottom',
                      textFill: hoverStyle.fill || hoverStyle.stroke || '#000',
                      textAlign: hoverStyle.textAlign || 'center'
                    });
                  }).on('mouseout', function() {
                    path.setStyle({textFill: null});
                  });
                }
                path.trigger(featureModel.get('iconStatus.' + iconName) || 'normal');
                group.add(path);
                path.on('click', zrUtil.bind(feature.onclick, feature, ecModel, api, iconName));
                iconPaths[iconName] = path;
              });
            }
            listComponentHelper.layout(group, toolboxModel, api);
            listComponentHelper.addBackground(group, toolboxModel);
            group.eachChild(function(icon) {
              var titleText = icon.__title;
              var hoverStyle = icon.hoverStyle;
              if (hoverStyle && titleText) {
                var rect = textContain.getBoundingRect(titleText, hoverStyle.font);
                var offsetX = icon.position[0] + group.position[0];
                var offsetY = icon.position[1] + group.position[1] + itemSize;
                var needPutOnTop = false;
                if (offsetY + rect.height > api.getHeight()) {
                  hoverStyle.textPosition = 'top';
                  needPutOnTop = true;
                }
                var topOffset = needPutOnTop ? (-5 - rect.height) : (itemSize + 8);
                if (offsetX + rect.width / 2 > api.getWidth()) {
                  hoverStyle.textPosition = ['100%', topOffset];
                  hoverStyle.textAlign = 'right';
                } else if (offsetX - rect.width / 2 < 0) {
                  hoverStyle.textPosition = [0, topOffset];
                  hoverStyle.textAlign = 'left';
                }
              }
            });
          },
          updateView: function(toolboxModel, ecModel, api, payload) {
            zrUtil.each(this._features, function(feature) {
              feature.updateView && feature.updateView(feature.model, ecModel, api, payload);
            });
          },
          updateLayout: function(toolboxModel, ecModel, api, payload) {
            zrUtil.each(this._features, function(feature) {
              feature.updateLayout && feature.updateLayout(feature.model, ecModel, api, payload);
            });
          },
          remove: function(ecModel, api) {
            zrUtil.each(this._features, function(feature) {
              feature.remove && feature.remove(ecModel, api);
            });
            this.group.removeAll();
          },
          dispose: function(ecModel, api) {
            zrUtil.each(this._features, function(feature) {
              feature.dispose && feature.dispose(ecModel, api);
            });
          }
        });
        function isUserFeatureName(featureName) {
          return featureName.indexOf('my') === 0;
        }
      }.call(exports, __webpack_require__(289)));
    }, function(module, exports, __webpack_require__) {
      var env = __webpack_require__(2);
      function SaveAsImage(model) {
        this.model = model;
      }
      SaveAsImage.defaultOption = {
        show: true,
        icon: 'M4.7,22.9L29.3,45.5L54.7,23.4M4.6,43.6L4.6,58L53.8,58L53.8,43.6M29.2,45.1L29.2,0',
        title: '保存为图片',
        type: 'png',
        name: '',
        excludeComponents: ['toolbox'],
        pixelRatio: 1,
        lang: ['右键另存为图片']
      };
      SaveAsImage.prototype.unusable = !env.canvasSupported;
      var proto = SaveAsImage.prototype;
      proto.onclick = function(ecModel, api) {
        var model = this.model;
        var title = model.get('name') || ecModel.get('title.0.text') || 'echarts';
        var $a = document.createElement('a');
        var type = model.get('type', true) || 'png';
        $a.download = title + '.' + type;
        $a.target = '_blank';
        var url = api.getConnectedDataURL({
          type: type,
          backgroundColor: model.get('backgroundColor', true) || ecModel.get('backgroundColor') || '#fff',
          excludeComponents: model.get('excludeComponents'),
          pixelRatio: model.get('pixelRatio')
        });
        $a.href = url;
        if (typeof MouseEvent === 'function' && !env.browser.ie && !env.browser.edge) {
          var evt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
          });
          $a.dispatchEvent(evt);
        } else {
          var lang = model.get('lang');
          var html = '' + '<body style="margin:0;">' + '<img src="' + url + '" style="max-width:100%;" title="' + ((lang && lang[0]) || '') + '" />' + '</body>';
          var tab = window.open();
          tab.document.write(html);
        }
      };
      __webpack_require__(327).register('saveAsImage', SaveAsImage);
      module.exports = SaveAsImage;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      function MagicType(model) {
        this.model = model;
      }
      MagicType.defaultOption = {
        show: true,
        type: [],
        icon: {
          line: 'M4.1,28.9h7.1l9.3-22l7.4,38l9.7-19.7l3,12.8h14.9M4.1,58h51.4',
          bar: 'M6.7,22.9h10V48h-10V22.9zM24.9,13h10v35h-10V13zM43.2,2h10v46h-10V2zM3.1,58h53.7',
          stack: 'M8.2,38.4l-8.4,4.1l30.6,15.3L60,42.5l-8.1-4.1l-21.5,11L8.2,38.4z M51.9,30l-8.1,4.2l-13.4,6.9l-13.9-6.9L8.2,30l-8.4,4.2l8.4,4.2l22.2,11l21.5-11l8.1-4.2L51.9,30z M51.9,21.7l-8.1,4.2L35.7,30l-5.3,2.8L24.9,30l-8.4-4.1l-8.3-4.2l-8.4,4.2L8.2,30l8.3,4.2l13.9,6.9l13.4-6.9l8.1-4.2l8.1-4.1L51.9,21.7zM30.4,2.2L-0.2,17.5l8.4,4.1l8.3,4.2l8.4,4.2l5.5,2.7l5.3-2.7l8.1-4.2l8.1-4.2l8.1-4.1L30.4,2.2z',
          tiled: 'M2.3,2.2h22.8V25H2.3V2.2z M35,2.2h22.8V25H35V2.2zM2.3,35h22.8v22.8H2.3V35z M35,35h22.8v22.8H35V35z'
        },
        title: {
          line: '切换为折线图',
          bar: '切换为柱状图',
          stack: '切换为堆叠',
          tiled: '切换为平铺'
        },
        option: {},
        seriesIndex: {}
      };
      var proto = MagicType.prototype;
      proto.getIcons = function() {
        var model = this.model;
        var availableIcons = model.get('icon');
        var icons = {};
        zrUtil.each(model.get('type'), function(type) {
          if (availableIcons[type]) {
            icons[type] = availableIcons[type];
          }
        });
        return icons;
      };
      var seriesOptGenreator = {
        'line': function(seriesType, seriesId, seriesModel, model) {
          if (seriesType === 'bar') {
            return zrUtil.merge({
              id: seriesId,
              type: 'line',
              data: seriesModel.get('data'),
              stack: seriesModel.get('stack'),
              markPoint: seriesModel.get('markPoint'),
              markLine: seriesModel.get('markLine')
            }, model.get('option.line') || {}, true);
          }
        },
        'bar': function(seriesType, seriesId, seriesModel, model) {
          if (seriesType === 'line') {
            return zrUtil.merge({
              id: seriesId,
              type: 'bar',
              data: seriesModel.get('data'),
              stack: seriesModel.get('stack'),
              markPoint: seriesModel.get('markPoint'),
              markLine: seriesModel.get('markLine')
            }, model.get('option.bar') || {}, true);
          }
        },
        'stack': function(seriesType, seriesId, seriesModel, model) {
          if (seriesType === 'line' || seriesType === 'bar') {
            return zrUtil.merge({
              id: seriesId,
              stack: '__ec_magicType_stack__'
            }, model.get('option.stack') || {}, true);
          }
        },
        'tiled': function(seriesType, seriesId, seriesModel, model) {
          if (seriesType === 'line' || seriesType === 'bar') {
            return zrUtil.merge({
              id: seriesId,
              stack: ''
            }, model.get('option.tiled') || {}, true);
          }
        }
      };
      var radioTypes = [['line', 'bar'], ['stack', 'tiled']];
      proto.onclick = function(ecModel, api, type) {
        var model = this.model;
        var seriesIndex = model.get('seriesIndex.' + type);
        if (!seriesOptGenreator[type]) {
          return;
        }
        var newOption = {series: []};
        var generateNewSeriesTypes = function(seriesModel) {
          var seriesType = seriesModel.subType;
          var seriesId = seriesModel.id;
          var newSeriesOpt = seriesOptGenreator[type](seriesType, seriesId, seriesModel, model);
          if (newSeriesOpt) {
            zrUtil.defaults(newSeriesOpt, seriesModel.option);
            newOption.series.push(newSeriesOpt);
          }
          var coordSys = seriesModel.coordinateSystem;
          if (coordSys && coordSys.type === 'cartesian2d' && (type === 'line' || type === 'bar')) {
            var categoryAxis = coordSys.getAxesByScale('ordinal')[0];
            if (categoryAxis) {
              var axisDim = categoryAxis.dim;
              var axisType = axisDim + 'Axis';
              var axisModel = ecModel.queryComponents({
                mainType: axisType,
                index: seriesModel.get(name + 'Index'),
                id: seriesModel.get(name + 'Id')
              })[0];
              var axisIndex = axisModel.componentIndex;
              newOption[axisType] = newOption[axisType] || [];
              for (var i = 0; i <= axisIndex; i++) {
                newOption[axisType][axisIndex] = newOption[axisType][axisIndex] || {};
              }
              newOption[axisType][axisIndex].boundaryGap = type === 'bar' ? true : false;
            }
          }
        };
        zrUtil.each(radioTypes, function(radio) {
          if (zrUtil.indexOf(radio, type) >= 0) {
            zrUtil.each(radio, function(item) {
              model.setIconStatus(item, 'normal');
            });
          }
        });
        model.setIconStatus(type, 'emphasis');
        ecModel.eachComponent({
          mainType: 'series',
          query: seriesIndex == null ? null : {seriesIndex: seriesIndex}
        }, generateNewSeriesTypes);
        api.dispatchAction({
          type: 'changeMagicType',
          currentType: type,
          newOption: newOption
        });
      };
      var echarts = __webpack_require__(1);
      echarts.registerAction({
        type: 'changeMagicType',
        event: 'magicTypeChanged',
        update: 'prepareAndUpdate'
      }, function(payload, ecModel) {
        ecModel.mergeOption(payload.newOption);
      });
      __webpack_require__(327).register('magicType', MagicType);
      module.exports = MagicType;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var eventTool = __webpack_require__(88);
      var BLOCK_SPLITER = new Array(60).join('-');
      var ITEM_SPLITER = '\t';
      function groupSeries(ecModel) {
        var seriesGroupByCategoryAxis = {};
        var otherSeries = [];
        var meta = [];
        ecModel.eachRawSeries(function(seriesModel) {
          var coordSys = seriesModel.coordinateSystem;
          if (coordSys && (coordSys.type === 'cartesian2d' || coordSys.type === 'polar')) {
            var baseAxis = coordSys.getBaseAxis();
            if (baseAxis.type === 'category') {
              var key = baseAxis.dim + '_' + baseAxis.index;
              if (!seriesGroupByCategoryAxis[key]) {
                seriesGroupByCategoryAxis[key] = {
                  categoryAxis: baseAxis,
                  valueAxis: coordSys.getOtherAxis(baseAxis),
                  series: []
                };
                meta.push({
                  axisDim: baseAxis.dim,
                  axisIndex: baseAxis.index
                });
              }
              seriesGroupByCategoryAxis[key].series.push(seriesModel);
            } else {
              otherSeries.push(seriesModel);
            }
          } else {
            otherSeries.push(seriesModel);
          }
        });
        return {
          seriesGroupByCategoryAxis: seriesGroupByCategoryAxis,
          other: otherSeries,
          meta: meta
        };
      }
      function assembleSeriesWithCategoryAxis(series) {
        var tables = [];
        zrUtil.each(series, function(group, key) {
          var categoryAxis = group.categoryAxis;
          var valueAxis = group.valueAxis;
          var valueAxisDim = valueAxis.dim;
          var headers = [' '].concat(zrUtil.map(group.series, function(series) {
            return series.name;
          }));
          var columns = [categoryAxis.model.getCategories()];
          zrUtil.each(group.series, function(series) {
            columns.push(series.getRawData().mapArray(valueAxisDim, function(val) {
              return val;
            }));
          });
          var lines = [headers.join(ITEM_SPLITER)];
          for (var i = 0; i < columns[0].length; i++) {
            var items = [];
            for (var j = 0; j < columns.length; j++) {
              items.push(columns[j][i]);
            }
            lines.push(items.join(ITEM_SPLITER));
          }
          tables.push(lines.join('\n'));
        });
        return tables.join('\n\n' + BLOCK_SPLITER + '\n\n');
      }
      function assembleOtherSeries(series) {
        return zrUtil.map(series, function(series) {
          var data = series.getRawData();
          var lines = [series.name];
          var vals = [];
          data.each(data.dimensions, function() {
            var argLen = arguments.length;
            var dataIndex = arguments[argLen - 1];
            var name = data.getName(dataIndex);
            for (var i = 0; i < argLen - 1; i++) {
              vals[i] = arguments[i];
            }
            lines.push((name ? (name + ITEM_SPLITER) : '') + vals.join(ITEM_SPLITER));
          });
          return lines.join('\n');
        }).join('\n\n' + BLOCK_SPLITER + '\n\n');
      }
      function getContentFromModel(ecModel) {
        var result = groupSeries(ecModel);
        return {
          value: zrUtil.filter([assembleSeriesWithCategoryAxis(result.seriesGroupByCategoryAxis), assembleOtherSeries(result.other)], function(str) {
            return str.replace(/[\n\t\s]/g, '');
          }).join('\n\n' + BLOCK_SPLITER + '\n\n'),
          meta: result.meta
        };
      }
      function trim(str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      }
      function isTSVFormat(block) {
        var firstLine = block.slice(0, block.indexOf('\n'));
        if (firstLine.indexOf(ITEM_SPLITER) >= 0) {
          return true;
        }
      }
      var itemSplitRegex = new RegExp('[' + ITEM_SPLITER + ']+', 'g');
      function parseTSVContents(tsv) {
        var tsvLines = tsv.split(/\n+/g);
        var headers = trim(tsvLines.shift()).split(itemSplitRegex);
        var categories = [];
        var series = zrUtil.map(headers, function(header) {
          return {
            name: header,
            data: []
          };
        });
        for (var i = 0; i < tsvLines.length; i++) {
          var items = trim(tsvLines[i]).split(itemSplitRegex);
          categories.push(items.shift());
          for (var j = 0; j < items.length; j++) {
            series[j] && (series[j].data[i] = items[j]);
          }
        }
        return {
          series: series,
          categories: categories
        };
      }
      function parseListContents(str) {
        var lines = str.split(/\n+/g);
        var seriesName = trim(lines.shift());
        var data = [];
        for (var i = 0; i < lines.length; i++) {
          var items = trim(lines[i]).split(itemSplitRegex);
          var name = '';
          var value;
          var hasName = false;
          if (isNaN(items[0])) {
            hasName = true;
            name = items[0];
            items = items.slice(1);
            data[i] = {
              name: name,
              value: []
            };
            value = data[i].value;
          } else {
            value = data[i] = [];
          }
          for (var j = 0; j < items.length; j++) {
            value.push(+items[j]);
          }
          if (value.length === 1) {
            hasName ? (data[i].value = value[0]) : (data[i] = value[0]);
          }
        }
        return {
          name: seriesName,
          data: data
        };
      }
      function parseContents(str, blockMetaList) {
        var blocks = str.split(new RegExp('\n*' + BLOCK_SPLITER + '\n*', 'g'));
        var newOption = {series: []};
        zrUtil.each(blocks, function(block, idx) {
          if (isTSVFormat(block)) {
            var result = parseTSVContents(block);
            var blockMeta = blockMetaList[idx];
            var axisKey = blockMeta.axisDim + 'Axis';
            if (blockMeta) {
              newOption[axisKey] = newOption[axisKey] || [];
              newOption[axisKey][blockMeta.axisIndex] = {data: result.categories};
              newOption.series = newOption.series.concat(result.series);
            }
          } else {
            var result = parseListContents(block);
            newOption.series.push(result);
          }
        });
        return newOption;
      }
      function DataView(model) {
        this._dom = null;
        this.model = model;
      }
      DataView.defaultOption = {
        show: true,
        readOnly: false,
        optionToContent: null,
        contentToOption: null,
        icon: 'M17.5,17.3H33 M17.5,17.3H33 M45.4,29.5h-28 M11.5,2v56H51V14.8L38.4,2H11.5z M38.4,2.2v12.7H51 M45.4,41.7h-28',
        title: '数据视图',
        lang: ['数据视图', '关闭', '刷新'],
        backgroundColor: '#fff',
        textColor: '#000',
        textareaColor: '#fff',
        textareaBorderColor: '#333',
        buttonColor: '#c23531',
        buttonTextColor: '#fff'
      };
      DataView.prototype.onclick = function(ecModel, api) {
        var container = api.getDom();
        var model = this.model;
        if (this._dom) {
          container.removeChild(this._dom);
        }
        var root = document.createElement('div');
        root.style.cssText = 'position:absolute;left:5px;top:5px;bottom:5px;right:5px;';
        root.style.backgroundColor = model.get('backgroundColor') || '#fff';
        var header = document.createElement('h4');
        var lang = model.get('lang') || [];
        header.innerHTML = lang[0] || model.get('title');
        header.style.cssText = 'margin: 10px 20px;';
        header.style.color = model.get('textColor');
        var viewMain = document.createElement('div');
        var textarea = document.createElement('textarea');
        viewMain.style.cssText = 'display:block;width:100%;overflow:hidden;';
        var optionToContent = model.get('optionToContent');
        var contentToOption = model.get('contentToOption');
        var result = getContentFromModel(ecModel);
        if (typeof optionToContent === 'function') {
          var htmlOrDom = optionToContent(api.getOption());
          if (typeof htmlOrDom === 'string') {
            viewMain.innerHTML = htmlOrDom;
          } else if (zrUtil.isDom(htmlOrDom)) {
            viewMain.appendChild(htmlOrDom);
          }
        } else {
          viewMain.appendChild(textarea);
          textarea.readOnly = model.get('readOnly');
          textarea.style.cssText = 'width:100%;height:100%;font-family:monospace;font-size:14px;line-height:1.6rem;';
          textarea.style.color = model.get('textColor');
          textarea.style.borderColor = model.get('textareaBorderColor');
          textarea.style.backgroundColor = model.get('textareaColor');
          textarea.value = result.value;
        }
        var blockMetaList = result.meta;
        var buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'position:absolute;bottom:0;left:0;right:0;';
        var buttonStyle = 'float:right;margin-right:20px;border:none;' + 'cursor:pointer;padding:2px 5px;font-size:12px;border-radius:3px';
        var closeButton = document.createElement('div');
        var refreshButton = document.createElement('div');
        buttonStyle += ';background-color:' + model.get('buttonColor');
        buttonStyle += ';color:' + model.get('buttonTextColor');
        var self = this;
        function close() {
          container.removeChild(root);
          self._dom = null;
        }
        eventTool.addEventListener(closeButton, 'click', close);
        eventTool.addEventListener(refreshButton, 'click', function() {
          var newOption;
          try {
            if (typeof contentToOption === 'function') {
              newOption = contentToOption(viewMain, api.getOption());
            } else {
              newOption = parseContents(textarea.value, blockMetaList);
            }
          } catch (e) {
            close();
            throw new Error('Data view format error ' + e);
          }
          if (newOption) {
            api.dispatchAction({
              type: 'changeDataView',
              newOption: newOption
            });
          }
          close();
        });
        closeButton.innerHTML = lang[1];
        refreshButton.innerHTML = lang[2];
        refreshButton.style.cssText = buttonStyle;
        closeButton.style.cssText = buttonStyle;
        !model.get('readOnly') && buttonContainer.appendChild(refreshButton);
        buttonContainer.appendChild(closeButton);
        eventTool.addEventListener(textarea, 'keydown', function(e) {
          if ((e.keyCode || e.which) === 9) {
            var val = this.value;
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = val.substring(0, start) + ITEM_SPLITER + val.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            eventTool.stop(e);
          }
        });
        root.appendChild(header);
        root.appendChild(viewMain);
        root.appendChild(buttonContainer);
        viewMain.style.height = (container.clientHeight - 80) + 'px';
        container.appendChild(root);
        this._dom = root;
      };
      DataView.prototype.remove = function(ecModel, api) {
        this._dom && api.getDom().removeChild(this._dom);
      };
      DataView.prototype.dispose = function(ecModel, api) {
        this.remove(ecModel, api);
      };
      function tryMergeDataOption(newData, originalData) {
        return zrUtil.map(newData, function(newVal, idx) {
          var original = originalData && originalData[idx];
          if (zrUtil.isObject(original) && !zrUtil.isArray(original)) {
            if (zrUtil.isObject(newVal) && !zrUtil.isArray(newVal)) {
              newVal = newVal.value;
            }
            return zrUtil.defaults({value: newVal}, original);
          } else {
            return newVal;
          }
        });
      }
      __webpack_require__(327).register('dataView', DataView);
      __webpack_require__(1).registerAction({
        type: 'changeDataView',
        event: 'dataViewChanged',
        update: 'prepareAndUpdate'
      }, function(payload, ecModel) {
        var newSeriesOptList = [];
        zrUtil.each(payload.newOption.series, function(seriesOpt) {
          var seriesModel = ecModel.getSeriesByName(seriesOpt.name)[0];
          if (!seriesModel) {
            newSeriesOptList.push(zrUtil.extend({type: 'scatter'}, seriesOpt));
          } else {
            var originalData = seriesModel.get('data');
            newSeriesOptList.push({
              name: seriesOpt.name,
              data: tryMergeDataOption(seriesOpt.data, originalData)
            });
          }
        });
        ecModel.mergeOption(zrUtil.defaults({series: newSeriesOptList}, payload.newOption));
      });
      module.exports = DataView;
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var zrUtil = __webpack_require__(4);
      var BrushController = __webpack_require__(236);
      var brushHelper = __webpack_require__(322);
      var history = __webpack_require__(386);
      var each = zrUtil.each;
      __webpack_require__(387);
      var DATA_ZOOM_ID_BASE = '\0_ec_\0toolbox-dataZoom_';
      function DataZoom(model, ecModel, api) {
        (this._brushController = new BrushController(api.getZr())).on('brush', zrUtil.bind(this._onBrush, this)).mount();
        this._isZoomActive;
      }
      DataZoom.defaultOption = {
        show: true,
        icon: {
          zoom: 'M0,13.5h26.9 M13.5,26.9V0 M32.1,13.5H58V58H13.5 V32.1',
          back: 'M22,1.4L9.9,13.5l12.3,12.3 M10.3,13.5H54.9v44.6 H10.3v-26'
        },
        title: {
          zoom: '区域缩放',
          back: '区域缩放还原'
        }
      };
      var proto = DataZoom.prototype;
      proto.render = function(featureModel, ecModel, api, payload) {
        this.model = featureModel;
        this.ecModel = ecModel;
        this.api = api;
        updateZoomBtnStatus(featureModel, ecModel, this, payload);
        updateBackBtnStatus(featureModel, ecModel);
      };
      proto.onclick = function(ecModel, api, type) {
        handlers[type].call(this);
      };
      proto.remove = function(ecModel, api) {
        this._brushController.unmount();
      };
      proto.dispose = function(ecModel, api) {
        this._brushController.dispose();
      };
      var handlers = {
        zoom: function() {
          var nextActive = !this._isZoomActive;
          this.api.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'dataZoomSelect',
            dataZoomSelectActive: nextActive
          });
        },
        back: function() {
          this._dispatchZoomAction(history.pop(this.ecModel));
        }
      };
      proto._onBrush = function(areas, opt) {
        if (!opt.isEnd || !areas.length) {
          return;
        }
        var snapshot = {};
        var ecModel = this.ecModel;
        this._brushController.updateCovers([]);
        var coordInfoList = brushHelper.makeCoordInfoList(retrieveAxisSetting(this.model.option), ecModel);
        var rangesCoordInfoList = [];
        brushHelper.parseOutputRanges(areas, coordInfoList, ecModel, rangesCoordInfoList);
        var area = areas[0];
        var coordInfo = rangesCoordInfoList[0];
        var coordRange = area.coordRange;
        var brushType = area.brushType;
        if (coordInfo && coordRange) {
          if (brushType === 'rect') {
            setBatch('xAxis', coordRange[0], coordInfo);
            setBatch('yAxis', coordRange[1], coordInfo);
          } else {
            var axisNames = {
              lineX: 'xAxis',
              lineY: 'yAxis'
            };
            setBatch(axisNames[brushType], coordRange, coordInfo);
          }
        }
        history.push(ecModel, snapshot);
        this._dispatchZoomAction(snapshot);
        function setBatch(axisName, minMax, coordInfo) {
          var dataZoomModel = findDataZoom(axisName, coordInfo[axisName], ecModel);
          if (dataZoomModel) {
            snapshot[dataZoomModel.id] = {
              dataZoomId: dataZoomModel.id,
              startValue: minMax[0],
              endValue: minMax[1]
            };
          }
        }
        function findDataZoom(axisName, axisModel, ecModel) {
          var dataZoomModel;
          ecModel.eachComponent({
            mainType: 'dataZoom',
            subType: 'select'
          }, function(dzModel, dataZoomIndex) {
            var axisIndex = dzModel.get(axisName + 'Index');
            if (axisIndex != null && ecModel.getComponent(axisName, axisIndex) === axisModel) {
              dataZoomModel = dzModel;
            }
          });
          return dataZoomModel;
        }
      };
      proto._dispatchZoomAction = function(snapshot) {
        var batch = [];
        each(snapshot, function(batchItem, dataZoomId) {
          batch.push(zrUtil.clone(batchItem));
        });
        batch.length && this.api.dispatchAction({
          type: 'dataZoom',
          from: this.uid,
          batch: batch
        });
      };
      function retrieveAxisSetting(option) {
        var setting = {};
        zrUtil.each(['xAxisIndex', 'yAxisIndex'], function(name) {
          setting[name] = option[name];
          setting[name] == null && (setting[name] = 'all');
          (setting[name] === false || setting[name] === 'none') && (setting[name] = []);
        });
        return setting;
      }
      function updateBackBtnStatus(featureModel, ecModel) {
        featureModel.setIconStatus('back', history.count(ecModel) > 1 ? 'emphasis' : 'normal');
      }
      function updateZoomBtnStatus(featureModel, ecModel, view, payload) {
        var zoomActive = view._isZoomActive;
        if (payload && payload.type === 'takeGlobalCursor') {
          zoomActive = payload.key === 'dataZoomSelect' ? payload.dataZoomSelectActive : false;
        }
        view._isZoomActive = zoomActive;
        featureModel.setIconStatus('zoom', zoomActive ? 'emphasis' : 'normal');
        var coordInfoList = brushHelper.makeCoordInfoList(retrieveAxisSetting(featureModel.option), ecModel);
        var brushType = (coordInfoList.xAxisHas && !coordInfoList.yAxisHas) ? 'lineX' : (!coordInfoList.xAxisHas && coordInfoList.yAxisHas) ? 'lineY' : 'rect';
        view._brushController.setPanels(brushHelper.makePanelOpts(coordInfoList)).enableBrush(zoomActive ? {
          brushType: brushType,
          brushStyle: {
            lineWidth: 0,
            fill: 'rgba(0,0,0,0.2)'
          }
        } : false);
      }
      __webpack_require__(327).register('dataZoom', DataZoom);
      __webpack_require__(1).registerPreprocessor(function(option) {
        if (!option) {
          return;
        }
        var dataZoomOpts = option.dataZoom || (option.dataZoom = []);
        if (!zrUtil.isArray(dataZoomOpts)) {
          option.dataZoom = dataZoomOpts = [dataZoomOpts];
        }
        var toolboxOpt = option.toolbox;
        if (toolboxOpt) {
          if (zrUtil.isArray(toolboxOpt)) {
            toolboxOpt = toolboxOpt[0];
          }
          if (toolboxOpt && toolboxOpt.feature) {
            var dataZoomOpt = toolboxOpt.feature.dataZoom;
            addForAxis('xAxis', dataZoomOpt);
            addForAxis('yAxis', dataZoomOpt);
          }
        }
        function addForAxis(axisName, dataZoomOpt) {
          if (!dataZoomOpt) {
            return;
          }
          var axisIndicesName = axisName + 'Index';
          var givenAxisIndices = dataZoomOpt[axisIndicesName];
          if (givenAxisIndices != null && givenAxisIndices != 'all' && !zrUtil.isArray(givenAxisIndices)) {
            givenAxisIndices = (givenAxisIndices === false || givenAxisIndices === 'none') ? [] : [givenAxisIndices];
          }
          forEachComponent(axisName, function(axisOpt, axisIndex) {
            if (givenAxisIndices != null && givenAxisIndices != 'all' && zrUtil.indexOf(givenAxisIndices, axisIndex) === -1) {
              return;
            }
            var newOpt = {
              type: 'select',
              $fromToolbox: true,
              id: DATA_ZOOM_ID_BASE + axisName + axisIndex
            };
            newOpt[axisIndicesName] = axisIndex;
            dataZoomOpts.push(newOpt);
          });
        }
        function forEachComponent(mainType, cb) {
          var opts = option[mainType];
          if (!zrUtil.isArray(opts)) {
            opts = opts ? [opts] : [];
          }
          each(opts, cb);
        }
      });
      module.exports = DataZoom;
    }, function(module, exports, __webpack_require__) {
      var zrUtil = __webpack_require__(4);
      var each = zrUtil.each;
      var ATTR = '\0_ec_hist_store';
      var history = {
        push: function(ecModel, newSnapshot) {
          var store = giveStore(ecModel);
          each(newSnapshot, function(batchItem, dataZoomId) {
            var i = store.length - 1;
            for (; i >= 0; i--) {
              var snapshot = store[i];
              if (snapshot[dataZoomId]) {
                break;
              }
            }
            if (i < 0) {
              var dataZoomModel = ecModel.queryComponents({
                mainType: 'dataZoom',
                subType: 'select',
                id: dataZoomId
              })[0];
              if (dataZoomModel) {
                var percentRange = dataZoomModel.getPercentRange();
                store[0][dataZoomId] = {
                  dataZoomId: dataZoomId,
                  start: percentRange[0],
                  end: percentRange[1]
                };
              }
            }
          });
          store.push(newSnapshot);
        },
        pop: function(ecModel) {
          var store = giveStore(ecModel);
          var head = store[store.length - 1];
          store.length > 1 && store.pop();
          var snapshot = {};
          each(head, function(batchItem, dataZoomId) {
            for (var i = store.length - 1; i >= 0; i--) {
              var batchItem = store[i][dataZoomId];
              if (batchItem) {
                snapshot[dataZoomId] = batchItem;
                break;
              }
            }
          });
          return snapshot;
        },
        clear: function(ecModel) {
          ecModel[ATTR] = null;
        },
        count: function(ecModel) {
          return giveStore(ecModel).length;
        }
      };
      function giveStore(ecModel) {
        var store = ecModel[ATTR];
        if (!store) {
          store = ecModel[ATTR] = [{}];
        }
        return store;
      }
      module.exports = history;
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(330);
      __webpack_require__(331);
      __webpack_require__(334);
      __webpack_require__(388);
      __webpack_require__(389);
      __webpack_require__(341);
      __webpack_require__(342);
    }, function(module, exports, __webpack_require__) {
      var DataZoomModel = __webpack_require__(331);
      module.exports = DataZoomModel.extend({type: 'dataZoom.select'});
    }, function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(334).extend({type: 'dataZoom.select'});
    }, function(module, exports, __webpack_require__) {
      'use strict';
      var history = __webpack_require__(386);
      function Restore(model) {
        this.model = model;
      }
      Restore.defaultOption = {
        show: true,
        icon: 'M3.8,33.4 M47,18.9h9.8V8.7 M56.3,20.1 C52.1,9,40.5,0.6,26.8,2.1C12.6,3.7,1.6,16.2,2.1,30.6 M13,41.1H3.1v10.2 M3.7,39.9c4.2,11.1,15.8,19.5,29.5,18 c14.2-1.6,25.2-14.1,24.7-28.5',
        title: '还原'
      };
      var proto = Restore.prototype;
      proto.onclick = function(ecModel, api, type) {
        history.clear(ecModel);
        api.dispatchAction({
          type: 'restore',
          from: this.uid
        });
      };
      __webpack_require__(327).register('restore', Restore);
      __webpack_require__(1).registerAction({
        type: 'restore',
        event: 'restore',
        update: 'prepareAndUpdate'
      }, function(payload, ecModel) {
        ecModel.resetOption('recreate');
      });
      module.exports = Restore;
    }, function(module, exports, __webpack_require__) {
      __webpack_require__(392);
      __webpack_require__(82).registerPainter('vml', __webpack_require__(394));
    }, function(module, exports, __webpack_require__) {
      if (!__webpack_require__(2).canvasSupported) {
        var vec2 = __webpack_require__(10);
        var BoundingRect = __webpack_require__(9);
        var CMD = __webpack_require__(49).CMD;
        var colorTool = __webpack_require__(39);
        var textContain = __webpack_require__(8);
        var RectText = __webpack_require__(48);
        var Displayable = __webpack_require__(46);
        var ZImage = __webpack_require__(61);
        var Text = __webpack_require__(63);
        var Path = __webpack_require__(45);
        var Gradient = __webpack_require__(79);
        var vmlCore = __webpack_require__(393);
        var round = Math.round;
        var sqrt = Math.sqrt;
        var abs = Math.abs;
        var cos = Math.cos;
        var sin = Math.sin;
        var mathMax = Math.max;
        var applyTransform = vec2.applyTransform;
        var comma = ',';
        var imageTransformPrefix = 'progid:DXImageTransform.Microsoft';
        var Z = 21600;
        var Z2 = Z / 2;
        var ZLEVEL_BASE = 100000;
        var Z_BASE = 1000;
        var initRootElStyle = function(el) {
          el.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;';
          el.coordsize = Z + ',' + Z;
          el.coordorigin = '0,0';
        };
        var encodeHtmlAttribute = function(s) {
          return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        };
        var rgb2Str = function(r, g, b) {
          return 'rgb(' + [r, g, b].join(',') + ')';
        };
        var append = function(parent, child) {
          if (child && parent && child.parentNode !== parent) {
            parent.appendChild(child);
          }
        };
        var remove = function(parent, child) {
          if (child && parent && child.parentNode === parent) {
            parent.removeChild(child);
          }
        };
        var getZIndex = function(zlevel, z, z2) {
          return (parseFloat(zlevel) || 0) * ZLEVEL_BASE + (parseFloat(z) || 0) * Z_BASE + z2;
        };
        var parsePercent = function(value, maxValue) {
          if (typeof value === 'string') {
            if (value.lastIndexOf('%') >= 0) {
              return parseFloat(value) / 100 * maxValue;
            }
            return parseFloat(value);
          }
          return value;
        };
        var setColorAndOpacity = function(el, color, opacity) {
          var colorArr = colorTool.parse(color);
          opacity = +opacity;
          if (isNaN(opacity)) {
            opacity = 1;
          }
          if (colorArr) {
            el.color = rgb2Str(colorArr[0], colorArr[1], colorArr[2]);
            el.opacity = opacity * colorArr[3];
          }
        };
        var getColorAndAlpha = function(color) {
          var colorArr = colorTool.parse(color);
          return [rgb2Str(colorArr[0], colorArr[1], colorArr[2]), colorArr[3]];
        };
        var updateFillNode = function(el, style, zrEl) {
          var fill = style.fill;
          if (fill != null) {
            if (fill instanceof Gradient) {
              var gradientType;
              var angle = 0;
              var focus = [0, 0];
              var shift = 0;
              var expansion = 1;
              var rect = zrEl.getBoundingRect();
              var rectWidth = rect.width;
              var rectHeight = rect.height;
              if (fill.type === 'linear') {
                gradientType = 'gradient';
                var transform = zrEl.transform;
                var p0 = [fill.x * rectWidth, fill.y * rectHeight];
                var p1 = [fill.x2 * rectWidth, fill.y2 * rectHeight];
                if (transform) {
                  applyTransform(p0, p0, transform);
                  applyTransform(p1, p1, transform);
                }
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                angle = Math.atan2(dx, dy) * 180 / Math.PI;
                if (angle < 0) {
                  angle += 360;
                }
                if (angle < 1e-6) {
                  angle = 0;
                }
              } else {
                gradientType = 'gradientradial';
                var p0 = [fill.x * rectWidth, fill.y * rectHeight];
                var transform = zrEl.transform;
                var scale = zrEl.scale;
                var width = rectWidth;
                var height = rectHeight;
                focus = [(p0[0] - rect.x) / width, (p0[1] - rect.y) / height];
                if (transform) {
                  applyTransform(p0, p0, transform);
                }
                width /= scale[0] * Z;
                height /= scale[1] * Z;
                var dimension = mathMax(width, height);
                shift = 2 * 0 / dimension;
                expansion = 2 * fill.r / dimension - shift;
              }
              var stops = fill.colorStops.slice();
              stops.sort(function(cs1, cs2) {
                return cs1.offset - cs2.offset;
              });
              var length = stops.length;
              var colorAndAlphaList = [];
              var colors = [];
              for (var i = 0; i < length; i++) {
                var stop = stops[i];
                var colorAndAlpha = getColorAndAlpha(stop.color);
                colors.push(stop.offset * expansion + shift + ' ' + colorAndAlpha[0]);
                if (i === 0 || i === length - 1) {
                  colorAndAlphaList.push(colorAndAlpha);
                }
              }
              if (length >= 2) {
                var color1 = colorAndAlphaList[0][0];
                var color2 = colorAndAlphaList[1][0];
                var opacity1 = colorAndAlphaList[0][1] * style.opacity;
                var opacity2 = colorAndAlphaList[1][1] * style.opacity;
                el.type = gradientType;
                el.method = 'none';
                el.focus = '100%';
                el.angle = angle;
                el.color = color1;
                el.color2 = color2;
                el.colors = colors.join(',');
                el.opacity = opacity2;
                el.opacity2 = opacity1;
              }
              if (gradientType === 'radial') {
                el.focusposition = focus.join(',');
              }
            } else {
              setColorAndOpacity(el, fill, style.opacity);
            }
          }
        };
        var updateStrokeNode = function(el, style) {
          if (style.lineDash != null) {
            el.dashstyle = style.lineDash.join(' ');
          }
          if (style.stroke != null && !(style.stroke instanceof Gradient)) {
            setColorAndOpacity(el, style.stroke, style.opacity);
          }
        };
        var updateFillAndStroke = function(vmlEl, type, style, zrEl) {
          var isFill = type == 'fill';
          var el = vmlEl.getElementsByTagName(type)[0];
          if (style[type] != null && style[type] !== 'none' && (isFill || (!isFill && style.lineWidth))) {
            vmlEl[isFill ? 'filled' : 'stroked'] = 'true';
            if (style[type] instanceof Gradient) {
              remove(vmlEl, el);
            }
            if (!el) {
              el = vmlCore.createNode(type);
            }
            isFill ? updateFillNode(el, style, zrEl) : updateStrokeNode(el, style);
            append(vmlEl, el);
          } else {
            vmlEl[isFill ? 'filled' : 'stroked'] = 'false';
            remove(vmlEl, el);
          }
        };
        var points = [[], [], []];
        var pathDataToString = function(data, m) {
          var M = CMD.M;
          var C = CMD.C;
          var L = CMD.L;
          var A = CMD.A;
          var Q = CMD.Q;
          var str = [];
          var nPoint;
          var cmdStr;
          var cmd;
          var i;
          var xi;
          var yi;
          for (i = 0; i < data.length; ) {
            cmd = data[i++];
            cmdStr = '';
            nPoint = 0;
            switch (cmd) {
              case M:
                cmdStr = ' m ';
                nPoint = 1;
                xi = data[i++];
                yi = data[i++];
                points[0][0] = xi;
                points[0][1] = yi;
                break;
              case L:
                cmdStr = ' l ';
                nPoint = 1;
                xi = data[i++];
                yi = data[i++];
                points[0][0] = xi;
                points[0][1] = yi;
                break;
              case Q:
              case C:
                cmdStr = ' c ';
                nPoint = 3;
                var x1 = data[i++];
                var y1 = data[i++];
                var x2 = data[i++];
                var y2 = data[i++];
                var x3;
                var y3;
                if (cmd === Q) {
                  x3 = x2;
                  y3 = y2;
                  x2 = (x2 + 2 * x1) / 3;
                  y2 = (y2 + 2 * y1) / 3;
                  x1 = (xi + 2 * x1) / 3;
                  y1 = (yi + 2 * y1) / 3;
                } else {
                  x3 = data[i++];
                  y3 = data[i++];
                }
                points[0][0] = x1;
                points[0][1] = y1;
                points[1][0] = x2;
                points[1][1] = y2;
                points[2][0] = x3;
                points[2][1] = y3;
                xi = x3;
                yi = y3;
                break;
              case A:
                var x = 0;
                var y = 0;
                var sx = 1;
                var sy = 1;
                var angle = 0;
                if (m) {
                  x = m[4];
                  y = m[5];
                  sx = sqrt(m[0] * m[0] + m[1] * m[1]);
                  sy = sqrt(m[2] * m[2] + m[3] * m[3]);
                  angle = Math.atan2(-m[1] / sy, m[0] / sx);
                }
                var cx = data[i++];
                var cy = data[i++];
                var rx = data[i++];
                var ry = data[i++];
                var startAngle = data[i++] + angle;
                var endAngle = data[i++] + startAngle + angle;
                i++;
                var clockwise = data[i++];
                var x0 = cx + cos(startAngle) * rx;
                var y0 = cy + sin(startAngle) * ry;
                var x1 = cx + cos(endAngle) * rx;
                var y1 = cy + sin(endAngle) * ry;
                var type = clockwise ? ' wa ' : ' at ';
                if (Math.abs(x0 - x1) < 1e-4) {
                  if (Math.abs(endAngle - startAngle) > 1e-2) {
                    if (clockwise) {
                      x0 += 270 / Z;
                    }
                  } else {
                    if (Math.abs(y0 - cy) < 1e-4) {
                      if ((clockwise && x0 < cx) || (!clockwise && x0 > cx)) {
                        y1 -= 270 / Z;
                      } else {
                        y1 += 270 / Z;
                      }
                    } else if ((clockwise && y0 < cy) || (!clockwise && y0 > cy)) {
                      x1 += 270 / Z;
                    } else {
                      x1 -= 270 / Z;
                    }
                  }
                }
                str.push(type, round(((cx - rx) * sx + x) * Z - Z2), comma, round(((cy - ry) * sy + y) * Z - Z2), comma, round(((cx + rx) * sx + x) * Z - Z2), comma, round(((cy + ry) * sy + y) * Z - Z2), comma, round((x0 * sx + x) * Z - Z2), comma, round((y0 * sy + y) * Z - Z2), comma, round((x1 * sx + x) * Z - Z2), comma, round((y1 * sy + y) * Z - Z2));
                xi = x1;
                yi = y1;
                break;
              case CMD.R:
                var p0 = points[0];
                var p1 = points[1];
                p0[0] = data[i++];
                p0[1] = data[i++];
                p1[0] = p0[0] + data[i++];
                p1[1] = p0[1] + data[i++];
                if (m) {
                  applyTransform(p0, p0, m);
                  applyTransform(p1, p1, m);
                }
                p0[0] = round(p0[0] * Z - Z2);
                p1[0] = round(p1[0] * Z - Z2);
                p0[1] = round(p0[1] * Z - Z2);
                p1[1] = round(p1[1] * Z - Z2);
                str.push(' m ', p0[0], comma, p0[1], ' l ', p1[0], comma, p0[1], ' l ', p1[0], comma, p1[1], ' l ', p0[0], comma, p1[1]);
                break;
              case CMD.Z:
                str.push(' x ');
            }
            if (nPoint > 0) {
              str.push(cmdStr);
              for (var k = 0; k < nPoint; k++) {
                var p = points[k];
                m && applyTransform(p, p, m);
                str.push(round(p[0] * Z - Z2), comma, round(p[1] * Z - Z2), k < nPoint - 1 ? comma : '');
              }
            }
          }
          return str.join('');
        };
        Path.prototype.brushVML = function(vmlRoot) {
          var style = this.style;
          var vmlEl = this._vmlEl;
          if (!vmlEl) {
            vmlEl = vmlCore.createNode('shape');
            initRootElStyle(vmlEl);
            this._vmlEl = vmlEl;
          }
          updateFillAndStroke(vmlEl, 'fill', style, this);
          updateFillAndStroke(vmlEl, 'stroke', style, this);
          var m = this.transform;
          var needTransform = m != null;
          var strokeEl = vmlEl.getElementsByTagName('stroke')[0];
          if (strokeEl) {
            var lineWidth = style.lineWidth;
            if (needTransform && !style.strokeNoScale) {
              var det = m[0] * m[3] - m[1] * m[2];
              lineWidth *= sqrt(abs(det));
            }
            strokeEl.weight = lineWidth + 'px';
          }
          var path = this.path;
          if (this.__dirtyPath) {
            path.beginPath();
            this.buildPath(path, this.shape);
            path.toStatic();
            this.__dirtyPath = false;
          }
          vmlEl.path = pathDataToString(path.data, this.transform);
          vmlEl.style.zIndex = getZIndex(this.zlevel, this.z, this.z2);
          append(vmlRoot, vmlEl);
          if (style.text != null) {
            this.drawRectText(vmlRoot, this.getBoundingRect());
          } else {
            this.removeRectText(vmlRoot);
          }
        };
        Path.prototype.onRemove = function(vmlRoot) {
          remove(vmlRoot, this._vmlEl);
          this.removeRectText(vmlRoot);
        };
        Path.prototype.onAdd = function(vmlRoot) {
          append(vmlRoot, this._vmlEl);
          this.appendRectText(vmlRoot);
        };
        var isImage = function(img) {
          return (typeof img === 'object') && img.tagName && img.tagName.toUpperCase() === 'IMG';
        };
        ZImage.prototype.brushVML = function(vmlRoot) {
          var style = this.style;
          var image = style.image;
          var ow;
          var oh;
          if (isImage(image)) {
            var src = image.src;
            if (src === this._imageSrc) {
              ow = this._imageWidth;
              oh = this._imageHeight;
            } else {
              var imageRuntimeStyle = image.runtimeStyle;
              var oldRuntimeWidth = imageRuntimeStyle.width;
              var oldRuntimeHeight = imageRuntimeStyle.height;
              imageRuntimeStyle.width = 'auto';
              imageRuntimeStyle.height = 'auto';
              ow = image.width;
              oh = image.height;
              imageRuntimeStyle.width = oldRuntimeWidth;
              imageRuntimeStyle.height = oldRuntimeHeight;
              this._imageSrc = src;
              this._imageWidth = ow;
              this._imageHeight = oh;
            }
            image = src;
          } else {
            if (image === this._imageSrc) {
              ow = this._imageWidth;
              oh = this._imageHeight;
            }
          }
          if (!image) {
            return;
          }
          var x = style.x || 0;
          var y = style.y || 0;
          var dw = style.width;
          var dh = style.height;
          var sw = style.sWidth;
          var sh = style.sHeight;
          var sx = style.sx || 0;
          var sy = style.sy || 0;
          var hasCrop = sw && sh;
          var vmlEl = this._vmlEl;
          if (!vmlEl) {
            vmlEl = vmlCore.doc.createElement('div');
            initRootElStyle(vmlEl);
            this._vmlEl = vmlEl;
          }
          var vmlElStyle = vmlEl.style;
          var hasRotation = false;
          var m;
          var scaleX = 1;
          var scaleY = 1;
          if (this.transform) {
            m = this.transform;
            scaleX = sqrt(m[0] * m[0] + m[1] * m[1]);
            scaleY = sqrt(m[2] * m[2] + m[3] * m[3]);
            hasRotation = m[1] || m[2];
          }
          if (hasRotation) {
            var p0 = [x, y];
            var p1 = [x + dw, y];
            var p2 = [x, y + dh];
            var p3 = [x + dw, y + dh];
            applyTransform(p0, p0, m);
            applyTransform(p1, p1, m);
            applyTransform(p2, p2, m);
            applyTransform(p3, p3, m);
            var maxX = mathMax(p0[0], p1[0], p2[0], p3[0]);
            var maxY = mathMax(p0[1], p1[1], p2[1], p3[1]);
            var transformFilter = [];
            transformFilter.push('M11=', m[0] / scaleX, comma, 'M12=', m[2] / scaleY, comma, 'M21=', m[1] / scaleX, comma, 'M22=', m[3] / scaleY, comma, 'Dx=', round(x * scaleX + m[4]), comma, 'Dy=', round(y * scaleY + m[5]));
            vmlElStyle.padding = '0 ' + round(maxX) + 'px ' + round(maxY) + 'px 0';
            vmlElStyle.filter = imageTransformPrefix + '.Matrix(' + transformFilter.join('') + ', SizingMethod=clip)';
          } else {
            if (m) {
              x = x * scaleX + m[4];
              y = y * scaleY + m[5];
            }
            vmlElStyle.filter = '';
            vmlElStyle.left = round(x) + 'px';
            vmlElStyle.top = round(y) + 'px';
          }
          var imageEl = this._imageEl;
          var cropEl = this._cropEl;
          if (!imageEl) {
            imageEl = vmlCore.doc.createElement('div');
            this._imageEl = imageEl;
          }
          var imageELStyle = imageEl.style;
          if (hasCrop) {
            if (!(ow && oh)) {
              var tmpImage = new Image();
              var self = this;
              tmpImage.onload = function() {
                tmpImage.onload = null;
                ow = tmpImage.width;
                oh = tmpImage.height;
                imageELStyle.width = round(scaleX * ow * dw / sw) + 'px';
                imageELStyle.height = round(scaleY * oh * dh / sh) + 'px';
                self._imageWidth = ow;
                self._imageHeight = oh;
                self._imageSrc = image;
              };
              tmpImage.src = image;
            } else {
              imageELStyle.width = round(scaleX * ow * dw / sw) + 'px';
              imageELStyle.height = round(scaleY * oh * dh / sh) + 'px';
            }
            if (!cropEl) {
              cropEl = vmlCore.doc.createElement('div');
              cropEl.style.overflow = 'hidden';
              this._cropEl = cropEl;
            }
            var cropElStyle = cropEl.style;
            cropElStyle.width = round((dw + sx * dw / sw) * scaleX);
            cropElStyle.height = round((dh + sy * dh / sh) * scaleY);
            cropElStyle.filter = imageTransformPrefix + '.Matrix(Dx=' + (-sx * dw / sw * scaleX) + ',Dy=' + (-sy * dh / sh * scaleY) + ')';
            if (!cropEl.parentNode) {
              vmlEl.appendChild(cropEl);
            }
            if (imageEl.parentNode != cropEl) {
              cropEl.appendChild(imageEl);
            }
          } else {
            imageELStyle.width = round(scaleX * dw) + 'px';
            imageELStyle.height = round(scaleY * dh) + 'px';
            vmlEl.appendChild(imageEl);
            if (cropEl && cropEl.parentNode) {
              vmlEl.removeChild(cropEl);
              this._cropEl = null;
            }
          }
          var filterStr = '';
          var alpha = style.opacity;
          if (alpha < 1) {
            filterStr += '.Alpha(opacity=' + round(alpha * 100) + ') ';
          }
          filterStr += imageTransformPrefix + '.AlphaImageLoader(src=' + image + ', SizingMethod=scale)';
          imageELStyle.filter = filterStr;
          vmlEl.style.zIndex = getZIndex(this.zlevel, this.z, this.z2);
          append(vmlRoot, vmlEl);
          if (style.text != null) {
            this.drawRectText(vmlRoot, this.getBoundingRect());
          }
        };
        ZImage.prototype.onRemove = function(vmlRoot) {
          remove(vmlRoot, this._vmlEl);
          this._vmlEl = null;
          this._cropEl = null;
          this._imageEl = null;
          this.removeRectText(vmlRoot);
        };
        ZImage.prototype.onAdd = function(vmlRoot) {
          append(vmlRoot, this._vmlEl);
          this.appendRectText(vmlRoot);
        };
        var DEFAULT_STYLE_NORMAL = 'normal';
        var fontStyleCache = {};
        var fontStyleCacheCount = 0;
        var MAX_FONT_CACHE_SIZE = 100;
        var fontEl = document.createElement('div');
        var getFontStyle = function(fontString) {
          var fontStyle = fontStyleCache[fontString];
          if (!fontStyle) {
            if (fontStyleCacheCount > MAX_FONT_CACHE_SIZE) {
              fontStyleCacheCount = 0;
              fontStyleCache = {};
            }
            var style = fontEl.style;
            var fontFamily;
            try {
              style.font = fontString;
              fontFamily = style.fontFamily.split(',')[0];
            } catch (e) {}
            fontStyle = {
              style: style.fontStyle || DEFAULT_STYLE_NORMAL,
              variant: style.fontVariant || DEFAULT_STYLE_NORMAL,
              weight: style.fontWeight || DEFAULT_STYLE_NORMAL,
              size: parseFloat(style.fontSize || 12) | 0,
              family: fontFamily || 'Microsoft YaHei'
            };
            fontStyleCache[fontString] = fontStyle;
            fontStyleCacheCount++;
          }
          return fontStyle;
        };
        var textMeasureEl;
        textContain.measureText = function(text, textFont) {
          var doc = vmlCore.doc;
          if (!textMeasureEl) {
            textMeasureEl = doc.createElement('div');
            textMeasureEl.style.cssText = 'position:absolute;top:-20000px;left:0;' + 'padding:0;margin:0;border:none;white-space:pre;';
            vmlCore.doc.body.appendChild(textMeasureEl);
          }
          try {
            textMeasureEl.style.font = textFont;
          } catch (ex) {}
          textMeasureEl.innerHTML = '';
          textMeasureEl.appendChild(doc.createTextNode(text));
          return {width: textMeasureEl.offsetWidth};
        };
        var tmpRect = new BoundingRect();
        var drawRectText = function(vmlRoot, rect, textRect, fromTextEl) {
          var style = this.style;
          var text = style.text;
          text != null && (text += '');
          if (!text) {
            return;
          }
          var x;
          var y;
          var align = style.textAlign;
          var fontStyle = getFontStyle(style.textFont);
          var font = fontStyle.style + ' ' + fontStyle.variant + ' ' + fontStyle.weight + ' ' + fontStyle.size + 'px "' + fontStyle.family + '"';
          var baseline = style.textBaseline;
          var verticalAlign = style.textVerticalAlign;
          textRect = textRect || textContain.getBoundingRect(text, font, align, baseline);
          var m = this.transform;
          if (m && !fromTextEl) {
            tmpRect.copy(rect);
            tmpRect.applyTransform(m);
            rect = tmpRect;
          }
          if (!fromTextEl) {
            var textPosition = style.textPosition;
            var distance = style.textDistance;
            if (textPosition instanceof Array) {
              x = rect.x + parsePercent(textPosition[0], rect.width);
              y = rect.y + parsePercent(textPosition[1], rect.height);
              align = align || 'left';
              baseline = baseline || 'top';
            } else {
              var res = textContain.adjustTextPositionOnRect(textPosition, rect, textRect, distance);
              x = res.x;
              y = res.y;
              align = align || res.textAlign;
              baseline = baseline || res.textBaseline;
            }
          } else {
            x = rect.x;
            y = rect.y;
          }
          if (verticalAlign) {
            switch (verticalAlign) {
              case 'middle':
                y -= textRect.height / 2;
                break;
              case 'bottom':
                y -= textRect.height;
                break;
            }
            baseline = 'top';
          }
          var fontSize = fontStyle.size;
          switch (baseline) {
            case 'hanging':
            case 'top':
              y += fontSize / 1.75;
              break;
            case 'middle':
              break;
            default:
              y -= fontSize / 2.25;
              break;
          }
          switch (align) {
            case 'left':
              break;
            case 'center':
              x -= textRect.width / 2;
              break;
            case 'right':
              x -= textRect.width;
              break;
          }
          var createNode = vmlCore.createNode;
          var textVmlEl = this._textVmlEl;
          var pathEl;
          var textPathEl;
          var skewEl;
          if (!textVmlEl) {
            textVmlEl = createNode('line');
            pathEl = createNode('path');
            textPathEl = createNode('textpath');
            skewEl = createNode('skew');
            textPathEl.style['v-text-align'] = 'left';
            initRootElStyle(textVmlEl);
            pathEl.textpathok = true;
            textPathEl.on = true;
            textVmlEl.from = '0 0';
            textVmlEl.to = '1000 0.05';
            append(textVmlEl, skewEl);
            append(textVmlEl, pathEl);
            append(textVmlEl, textPathEl);
            this._textVmlEl = textVmlEl;
          } else {
            skewEl = textVmlEl.firstChild;
            pathEl = skewEl.nextSibling;
            textPathEl = pathEl.nextSibling;
          }
          var coords = [x, y];
          var textVmlElStyle = textVmlEl.style;
          if (m && fromTextEl) {
            applyTransform(coords, coords, m);
            skewEl.on = true;
            skewEl.matrix = m[0].toFixed(3) + comma + m[2].toFixed(3) + comma + m[1].toFixed(3) + comma + m[3].toFixed(3) + ',0,0';
            skewEl.offset = (round(coords[0]) || 0) + ',' + (round(coords[1]) || 0);
            skewEl.origin = '0 0';
            textVmlElStyle.left = '0px';
            textVmlElStyle.top = '0px';
          } else {
            skewEl.on = false;
            textVmlElStyle.left = round(x) + 'px';
            textVmlElStyle.top = round(y) + 'px';
          }
          textPathEl.string = encodeHtmlAttribute(text);
          try {
            textPathEl.style.font = font;
          } catch (e) {}
          updateFillAndStroke(textVmlEl, 'fill', {
            fill: fromTextEl ? style.fill : style.textFill,
            opacity: style.opacity
          }, this);
          updateFillAndStroke(textVmlEl, 'stroke', {
            stroke: fromTextEl ? style.stroke : style.textStroke,
            opacity: style.opacity,
            lineDash: style.lineDash
          }, this);
          textVmlEl.style.zIndex = getZIndex(this.zlevel, this.z, this.z2);
          append(vmlRoot, textVmlEl);
        };
        var removeRectText = function(vmlRoot) {
          remove(vmlRoot, this._textVmlEl);
          this._textVmlEl = null;
        };
        var appendRectText = function(vmlRoot) {
          append(vmlRoot, this._textVmlEl);
        };
        var list = [RectText, Displayable, ZImage, Path, Text];
        for (var i = 0; i < list.length; i++) {
          var proto = list[i].prototype;
          proto.drawRectText = drawRectText;
          proto.removeRectText = removeRectText;
          proto.appendRectText = appendRectText;
        }
        Text.prototype.brushVML = function(vmlRoot) {
          var style = this.style;
          if (style.text != null) {
            this.drawRectText(vmlRoot, {
              x: style.x || 0,
              y: style.y || 0,
              width: 0,
              height: 0
            }, this.getBoundingRect(), true);
          } else {
            this.removeRectText(vmlRoot);
          }
        };
        Text.prototype.onRemove = function(vmlRoot) {
          this.removeRectText(vmlRoot);
        };
        Text.prototype.onAdd = function(vmlRoot) {
          this.appendRectText(vmlRoot);
        };
      }
    }, function(module, exports, __webpack_require__) {
      if (!__webpack_require__(2).canvasSupported) {
        var urn = 'urn:schemas-microsoft-com:vml';
        var createNode;
        var win = window;
        var doc = win.document;
        var vmlInited = false;
        try {
          !doc.namespaces.zrvml && doc.namespaces.add('zrvml', urn);
          createNode = function(tagName) {
            return doc.createElement('<zrvml:' + tagName + ' class="zrvml">');
          };
        } catch (e) {
          createNode = function(tagName) {
            return doc.createElement('<' + tagName + ' xmlns="' + urn + '" class="zrvml">');
          };
        }
        var initVML = function() {
          if (vmlInited) {
            return;
          }
          vmlInited = true;
          var styleSheets = doc.styleSheets;
          if (styleSheets.length < 31) {
            doc.createStyleSheet().addRule('.zrvml', 'behavior:url(#default#VML)');
          } else {
            styleSheets[0].addRule('.zrvml', 'behavior:url(#default#VML)');
          }
        };
        module.exports = {
          doc: doc,
          initVML: initVML,
          createNode: createNode
        };
      }
    }, function(module, exports, __webpack_require__) {
      var zrLog = __webpack_require__(40);
      var vmlCore = __webpack_require__(393);
      function parseInt10(val) {
        return parseInt(val, 10);
      }
      function VMLPainter(root, storage) {
        vmlCore.initVML();
        this.root = root;
        this.storage = storage;
        var vmlViewport = document.createElement('div');
        var vmlRoot = document.createElement('div');
        vmlViewport.style.cssText = 'display:inline-block;overflow:hidden;position:relative;width:300px;height:150px;';
        vmlRoot.style.cssText = 'position:absolute;left:0;top:0;';
        root.appendChild(vmlViewport);
        this._vmlRoot = vmlRoot;
        this._vmlViewport = vmlViewport;
        this.resize();
        var oldDelFromMap = storage.delFromMap;
        var oldAddToMap = storage.addToMap;
        storage.delFromMap = function(elId) {
          var el = storage.get(elId);
          oldDelFromMap.call(storage, elId);
          if (el) {
            el.onRemove && el.onRemove(vmlRoot);
          }
        };
        storage.addToMap = function(el) {
          el.onAdd && el.onAdd(vmlRoot);
          oldAddToMap.call(storage, el);
        };
        this._firstPaint = true;
      }
      VMLPainter.prototype = {
        constructor: VMLPainter,
        getViewportRoot: function() {
          return this._vmlViewport;
        },
        refresh: function() {
          var list = this.storage.getDisplayList(true, true);
          this._paintList(list);
        },
        _paintList: function(list) {
          var vmlRoot = this._vmlRoot;
          for (var i = 0; i < list.length; i++) {
            var el = list[i];
            if (el.invisible || el.ignore) {
              if (!el.__alreadyNotVisible) {
                el.onRemove(vmlRoot);
              }
              el.__alreadyNotVisible = true;
            } else {
              if (el.__alreadyNotVisible) {
                el.onAdd(vmlRoot);
              }
              el.__alreadyNotVisible = false;
              if (el.__dirty) {
                el.beforeBrush && el.beforeBrush();
                (el.brushVML || el.brush).call(el, vmlRoot);
                el.afterBrush && el.afterBrush();
              }
            }
            el.__dirty = false;
          }
          if (this._firstPaint) {
            this._vmlViewport.appendChild(vmlRoot);
            this._firstPaint = false;
          }
        },
        resize: function(width, height) {
          var width = width == null ? this._getWidth() : width;
          var height = height == null ? this._getHeight() : height;
          if (this._width != width || this._height != height) {
            this._width = width;
            this._height = height;
            var vmlViewportStyle = this._vmlViewport.style;
            vmlViewportStyle.width = width + 'px';
            vmlViewportStyle.height = height + 'px';
          }
        },
        dispose: function() {
          this.root.innerHTML = '';
          this._vmlRoot = this._vmlViewport = this.storage = null;
        },
        getWidth: function() {
          return this._width;
        },
        getHeight: function() {
          return this._height;
        },
        clear: function() {
          if (this._vmlViewport) {
            this.root.removeChild(this._vmlViewport);
          }
        },
        _getWidth: function() {
          var root = this.root;
          var stl = root.currentStyle;
          return ((root.clientWidth || parseInt10(stl.width)) - parseInt10(stl.paddingLeft) - parseInt10(stl.paddingRight)) | 0;
        },
        _getHeight: function() {
          var root = this.root;
          var stl = root.currentStyle;
          return ((root.clientHeight || parseInt10(stl.height)) - parseInt10(stl.paddingTop) - parseInt10(stl.paddingBottom)) | 0;
        }
      };
      function createMethodNotSupport(method) {
        return function() {
          zrLog('In IE8.0 VML mode painter not support method "' + method + '"');
        };
      }
      var notSupportedMethods = ['getLayer', 'insertLayer', 'eachLayer', 'eachBuildinLayer', 'eachOtherLayer', 'getLayers', 'modLayer', 'delLayer', 'clearLayer', 'toDataURL', 'pathToImage'];
      for (var i = 0; i < notSupportedMethods.length; i++) {
        var name = notSupportedMethods[i];
        VMLPainter.prototype[name] = createMethodNotSupport(name);
      }
      module.exports = VMLPainter;
    }]);
  });
  ;
})(require('process'));
