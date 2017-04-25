/* */ 
(function(Buffer) {
  'use strict';
  module.exports = function(Chart) {
    var helpers = Chart.helpers;
    var plugins = Chart.plugins;
    var platform = Chart.platform;
    Chart.types = {};
    Chart.instances = {};
    Chart.controllers = {};
    function initConfig(config) {
      config = config || {};
      var data = config.data = config.data || {};
      data.datasets = data.datasets || [];
      data.labels = data.labels || [];
      config.options = helpers.configMerge(Chart.defaults.global, Chart.defaults[config.type], config.options || {});
      return config;
    }
    function updateConfig(chart) {
      var newOptions = chart.options;
      if (newOptions.scale) {
        chart.scale.options = newOptions.scale;
      } else if (newOptions.scales) {
        newOptions.scales.xAxes.concat(newOptions.scales.yAxes).forEach(function(scaleOptions) {
          chart.scales[scaleOptions.id].options = scaleOptions;
        });
      }
      chart.tooltip._options = newOptions.tooltips;
    }
    Chart.Controller = function(item, config, instance) {
      var me = this;
      config = initConfig(config);
      var context = platform.acquireContext(item, config);
      var canvas = context && context.canvas;
      var height = canvas && canvas.height;
      var width = canvas && canvas.width;
      instance.ctx = context;
      instance.canvas = canvas;
      instance.config = config;
      instance.width = width;
      instance.height = height;
      instance.aspectRatio = height ? width / height : null;
      me.id = helpers.uid();
      me.chart = instance;
      me.config = config;
      me.options = config.options;
      me._bufferedRender = false;
      Chart.instances[me.id] = me;
      Object.defineProperty(me, 'data', {get: function() {
          return me.config.data;
        }});
      if (!context || !canvas) {
        console.error("Failed to create chart: can't acquire context from the given item");
        return me;
      }
      me.initialize();
      me.update();
      return me;
    };
    helpers.extend(Chart.Controller.prototype, {
      initialize: function() {
        var me = this;
        plugins.notify(me, 'beforeInit');
        helpers.retinaScale(me.chart);
        me.bindEvents();
        if (me.options.responsive) {
          me.resize(true);
        }
        me.ensureScalesHaveIDs();
        me.buildScales();
        me.initToolTip();
        plugins.notify(me, 'afterInit');
        return me;
      },
      clear: function() {
        helpers.clear(this.chart);
        return this;
      },
      stop: function() {
        Chart.animationService.cancelAnimation(this);
        return this;
      },
      resize: function(silent) {
        var me = this;
        var chart = me.chart;
        var options = me.options;
        var canvas = chart.canvas;
        var aspectRatio = (options.maintainAspectRatio && chart.aspectRatio) || null;
        var newWidth = Math.floor(helpers.getMaximumWidth(canvas));
        var newHeight = Math.floor(aspectRatio ? newWidth / aspectRatio : helpers.getMaximumHeight(canvas));
        if (chart.width === newWidth && chart.height === newHeight) {
          return;
        }
        canvas.width = chart.width = newWidth;
        canvas.height = chart.height = newHeight;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        helpers.retinaScale(chart);
        if (!silent) {
          var newSize = {
            width: newWidth,
            height: newHeight
          };
          plugins.notify(me, 'resize', [newSize]);
          if (me.options.onResize) {
            me.options.onResize(me, newSize);
          }
          me.stop();
          me.update(me.options.responsiveAnimationDuration);
        }
      },
      ensureScalesHaveIDs: function() {
        var options = this.options;
        var scalesOptions = options.scales || {};
        var scaleOptions = options.scale;
        helpers.each(scalesOptions.xAxes, function(xAxisOptions, index) {
          xAxisOptions.id = xAxisOptions.id || ('x-axis-' + index);
        });
        helpers.each(scalesOptions.yAxes, function(yAxisOptions, index) {
          yAxisOptions.id = yAxisOptions.id || ('y-axis-' + index);
        });
        if (scaleOptions) {
          scaleOptions.id = scaleOptions.id || 'scale';
        }
      },
      buildScales: function() {
        var me = this;
        var options = me.options;
        var scales = me.scales = {};
        var items = [];
        if (options.scales) {
          items = items.concat((options.scales.xAxes || []).map(function(xAxisOptions) {
            return {
              options: xAxisOptions,
              dtype: 'category'
            };
          }), (options.scales.yAxes || []).map(function(yAxisOptions) {
            return {
              options: yAxisOptions,
              dtype: 'linear'
            };
          }));
        }
        if (options.scale) {
          items.push({
            options: options.scale,
            dtype: 'radialLinear',
            isDefault: true
          });
        }
        helpers.each(items, function(item) {
          var scaleOptions = item.options;
          var scaleType = helpers.getValueOrDefault(scaleOptions.type, item.dtype);
          var scaleClass = Chart.scaleService.getScaleConstructor(scaleType);
          if (!scaleClass) {
            return;
          }
          var scale = new scaleClass({
            id: scaleOptions.id,
            options: scaleOptions,
            ctx: me.chart.ctx,
            chart: me
          });
          scales[scale.id] = scale;
          if (item.isDefault) {
            me.scale = scale;
          }
        });
        Chart.scaleService.addScalesToLayout(this);
      },
      buildOrUpdateControllers: function() {
        var me = this;
        var types = [];
        var newControllers = [];
        helpers.each(me.data.datasets, function(dataset, datasetIndex) {
          var meta = me.getDatasetMeta(datasetIndex);
          if (!meta.type) {
            meta.type = dataset.type || me.config.type;
          }
          types.push(meta.type);
          if (meta.controller) {
            meta.controller.updateIndex(datasetIndex);
          } else {
            meta.controller = new Chart.controllers[meta.type](me, datasetIndex);
            newControllers.push(meta.controller);
          }
        }, me);
        if (types.length > 1) {
          for (var i = 1; i < types.length; i++) {
            if (types[i] !== types[i - 1]) {
              me.isCombo = true;
              break;
            }
          }
        }
        return newControllers;
      },
      resetElements: function() {
        var me = this;
        helpers.each(me.data.datasets, function(dataset, datasetIndex) {
          me.getDatasetMeta(datasetIndex).controller.reset();
        }, me);
      },
      reset: function() {
        this.resetElements();
        this.tooltip.initialize();
      },
      update: function(animationDuration, lazy) {
        var me = this;
        updateConfig(me);
        if (plugins.notify(me, 'beforeUpdate') === false) {
          return;
        }
        me.tooltip._data = me.data;
        var newControllers = me.buildOrUpdateControllers();
        helpers.each(me.data.datasets, function(dataset, datasetIndex) {
          me.getDatasetMeta(datasetIndex).controller.buildOrUpdateElements();
        }, me);
        me.updateLayout();
        helpers.each(newControllers, function(controller) {
          controller.reset();
        });
        me.updateDatasets();
        plugins.notify(me, 'afterUpdate');
        if (me._bufferedRender) {
          me._bufferedRequest = {
            lazy: lazy,
            duration: animationDuration
          };
        } else {
          me.render(animationDuration, lazy);
        }
      },
      updateLayout: function() {
        var me = this;
        if (plugins.notify(me, 'beforeLayout') === false) {
          return;
        }
        Chart.layoutService.update(this, this.chart.width, this.chart.height);
        plugins.notify(me, 'afterScaleUpdate');
        plugins.notify(me, 'afterLayout');
      },
      updateDatasets: function() {
        var me = this;
        if (plugins.notify(me, 'beforeDatasetsUpdate') === false) {
          return;
        }
        for (var i = 0,
            ilen = me.data.datasets.length; i < ilen; ++i) {
          me.getDatasetMeta(i).controller.update();
        }
        plugins.notify(me, 'afterDatasetsUpdate');
      },
      render: function(duration, lazy) {
        var me = this;
        if (plugins.notify(me, 'beforeRender') === false) {
          return;
        }
        var animationOptions = me.options.animation;
        var onComplete = function() {
          plugins.notify(me, 'afterRender');
          var callback = animationOptions && animationOptions.onComplete;
          if (callback && callback.call) {
            callback.call(me);
          }
        };
        if (animationOptions && ((typeof duration !== 'undefined' && duration !== 0) || (typeof duration === 'undefined' && animationOptions.duration !== 0))) {
          var animation = new Chart.Animation();
          animation.numSteps = (duration || animationOptions.duration) / 16.66;
          animation.easing = animationOptions.easing;
          animation.render = function(chartInstance, animationObject) {
            var easingFunction = helpers.easingEffects[animationObject.easing];
            var stepDecimal = animationObject.currentStep / animationObject.numSteps;
            var easeDecimal = easingFunction(stepDecimal);
            chartInstance.draw(easeDecimal, stepDecimal, animationObject.currentStep);
          };
          animation.onAnimationProgress = animationOptions.onProgress;
          animation.onAnimationComplete = onComplete;
          Chart.animationService.addAnimation(me, animation, duration, lazy);
        } else {
          me.draw();
          onComplete();
        }
        return me;
      },
      draw: function(easingValue) {
        var me = this;
        me.clear();
        if (easingValue === undefined || easingValue === null) {
          easingValue = 1;
        }
        if (plugins.notify(me, 'beforeDraw', [easingValue]) === false) {
          return;
        }
        helpers.each(me.boxes, function(box) {
          box.draw(me.chartArea);
        }, me);
        if (me.scale) {
          me.scale.draw();
        }
        me.drawDatasets(easingValue);
        me.tooltip.transition(easingValue).draw();
        plugins.notify(me, 'afterDraw', [easingValue]);
      },
      drawDatasets: function(easingValue) {
        var me = this;
        if (plugins.notify(me, 'beforeDatasetsDraw', [easingValue]) === false) {
          return;
        }
        helpers.each(me.data.datasets, function(dataset, datasetIndex) {
          if (me.isDatasetVisible(datasetIndex)) {
            me.getDatasetMeta(datasetIndex).controller.draw(easingValue);
          }
        }, me, true);
        plugins.notify(me, 'afterDatasetsDraw', [easingValue]);
      },
      getElementAtEvent: function(e) {
        return Chart.Interaction.modes.single(this, e);
      },
      getElementsAtEvent: function(e) {
        return Chart.Interaction.modes.label(this, e, {intersect: true});
      },
      getElementsAtXAxis: function(e) {
        return Chart.Interaction.modes['x-axis'](this, e, {intersect: true});
      },
      getElementsAtEventForMode: function(e, mode, options) {
        var method = Chart.Interaction.modes[mode];
        if (typeof method === 'function') {
          return method(this, e, options);
        }
        return [];
      },
      getDatasetAtEvent: function(e) {
        return Chart.Interaction.modes.dataset(this, e, {intersect: true});
      },
      getDatasetMeta: function(datasetIndex) {
        var me = this;
        var dataset = me.data.datasets[datasetIndex];
        if (!dataset._meta) {
          dataset._meta = {};
        }
        var meta = dataset._meta[me.id];
        if (!meta) {
          meta = dataset._meta[me.id] = {
            type: null,
            data: [],
            dataset: null,
            controller: null,
            hidden: null,
            xAxisID: null,
            yAxisID: null
          };
        }
        return meta;
      },
      getVisibleDatasetCount: function() {
        var count = 0;
        for (var i = 0,
            ilen = this.data.datasets.length; i < ilen; ++i) {
          if (this.isDatasetVisible(i)) {
            count++;
          }
        }
        return count;
      },
      isDatasetVisible: function(datasetIndex) {
        var meta = this.getDatasetMeta(datasetIndex);
        return typeof meta.hidden === 'boolean' ? !meta.hidden : !this.data.datasets[datasetIndex].hidden;
      },
      generateLegend: function() {
        return this.options.legendCallback(this);
      },
      destroy: function() {
        var me = this;
        var canvas = me.chart.canvas;
        var meta,
            i,
            ilen;
        me.stop();
        for (i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
          meta = me.getDatasetMeta(i);
          if (meta.controller) {
            meta.controller.destroy();
            meta.controller = null;
          }
        }
        if (canvas) {
          me.unbindEvents();
          helpers.clear(me.chart);
          platform.releaseContext(me.chart.ctx);
          me.chart.canvas = null;
          me.chart.ctx = null;
        }
        plugins.notify(me, 'destroy');
        delete Chart.instances[me.id];
      },
      toBase64Image: function() {
        return this.chart.canvas.toDataURL.apply(this.chart.canvas, arguments);
      },
      initToolTip: function() {
        var me = this;
        me.tooltip = new Chart.Tooltip({
          _chart: me.chart,
          _chartInstance: me,
          _data: me.data,
          _options: me.options.tooltips
        }, me);
        me.tooltip.initialize();
      },
      bindEvents: function() {
        var me = this;
        var listeners = me._listeners = {};
        var listener = function() {
          me.eventHandler.apply(me, arguments);
        };
        helpers.each(me.options.events, function(type) {
          platform.addEventListener(me, type, listener);
          listeners[type] = listener;
        });
        if (me.options.responsive) {
          listener = function() {
            me.resize();
          };
          platform.addEventListener(me, 'resize', listener);
          listeners.resize = listener;
        }
      },
      unbindEvents: function() {
        var me = this;
        var listeners = me._listeners;
        if (!listeners) {
          return;
        }
        delete me._listeners;
        helpers.each(listeners, function(listener, type) {
          platform.removeEventListener(me, type, listener);
        });
      },
      updateHoverStyle: function(elements, mode, enabled) {
        var method = enabled ? 'setHoverStyle' : 'removeHoverStyle';
        var element,
            i,
            ilen;
        for (i = 0, ilen = elements.length; i < ilen; ++i) {
          element = elements[i];
          if (element) {
            this.getDatasetMeta(element._datasetIndex).controller[method](element);
          }
        }
      },
      eventHandler: function(e) {
        var me = this;
        var tooltip = me.tooltip;
        if (plugins.notify(me, 'beforeEvent', [e]) === false) {
          return;
        }
        me._bufferedRender = true;
        me._bufferedRequest = null;
        var changed = me.handleEvent(e);
        changed |= tooltip && tooltip.handleEvent(e);
        plugins.notify(me, 'afterEvent', [e]);
        var bufferedRequest = me._bufferedRequest;
        if (bufferedRequest) {
          me.render(bufferedRequest.duration, bufferedRequest.lazy);
        } else if (changed && !me.animating) {
          me.stop();
          me.render(me.options.hover.animationDuration, true);
        }
        me._bufferedRender = false;
        me._bufferedRequest = null;
        return me;
      },
      handleEvent: function(e) {
        var me = this;
        var options = me.options || {};
        var hoverOptions = options.hover;
        var changed = false;
        me.lastActive = me.lastActive || [];
        if (e.type === 'mouseout') {
          me.active = [];
        } else {
          me.active = me.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions);
        }
        if (hoverOptions.onHover) {
          hoverOptions.onHover.call(me, e.native, me.active);
        }
        if (e.type === 'mouseup' || e.type === 'click') {
          if (options.onClick) {
            options.onClick.call(me, e.native, me.active);
          }
        }
        if (me.lastActive.length) {
          me.updateHoverStyle(me.lastActive, hoverOptions.mode, false);
        }
        if (me.active.length && hoverOptions.mode) {
          me.updateHoverStyle(me.active, hoverOptions.mode, true);
        }
        changed = !helpers.arrayEquals(me.active, me.lastActive);
        me.lastActive = me.active;
        return changed;
      }
    });
  };
})(require('buffer').Buffer);
