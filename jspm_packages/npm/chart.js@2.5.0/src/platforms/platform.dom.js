/* */ 
(function(process) {
  'use strict';
  module.exports = function(Chart) {
    var helpers = Chart.helpers;
    var eventTypeMap = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
      pointerenter: 'mouseenter',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerleave: 'mouseout',
      pointerout: 'mouseout'
    };
    function readUsedSize(element, property) {
      var value = helpers.getStyle(element, property);
      var matches = value && value.match(/(\d+)px/);
      return matches ? Number(matches[1]) : undefined;
    }
    function initCanvas(canvas, config) {
      var style = canvas.style;
      var renderHeight = canvas.getAttribute('height');
      var renderWidth = canvas.getAttribute('width');
      canvas._chartjs = {initial: {
          height: renderHeight,
          width: renderWidth,
          style: {
            display: style.display,
            height: style.height,
            width: style.width
          }
        }};
      style.display = style.display || 'block';
      if (renderWidth === null || renderWidth === '') {
        var displayWidth = readUsedSize(canvas, 'width');
        if (displayWidth !== undefined) {
          canvas.width = displayWidth;
        }
      }
      if (renderHeight === null || renderHeight === '') {
        if (canvas.style.height === '') {
          canvas.height = canvas.width / (config.options.aspectRatio || 2);
        } else {
          var displayHeight = readUsedSize(canvas, 'height');
          if (displayWidth !== undefined) {
            canvas.height = displayHeight;
          }
        }
      }
      return canvas;
    }
    function createEvent(type, chart, x, y, native) {
      return {
        type: type,
        chart: chart,
        native: native || null,
        x: x !== undefined ? x : null,
        y: y !== undefined ? y : null
      };
    }
    function fromNativeEvent(event, chart) {
      var type = eventTypeMap[event.type] || event.type;
      var pos = helpers.getRelativePosition(event, chart);
      return createEvent(type, chart, pos.x, pos.y, event);
    }
    function createResizer(handler) {
      var iframe = document.createElement('iframe');
      iframe.className = 'chartjs-hidden-iframe';
      iframe.style.cssText = 'display:block;' + 'overflow:hidden;' + 'border:0;' + 'margin:0;' + 'top:0;' + 'left:0;' + 'bottom:0;' + 'right:0;' + 'height:100%;' + 'width:100%;' + 'position:absolute;' + 'pointer-events:none;' + 'z-index:-1;';
      iframe.tabIndex = -1;
      helpers.addEvent(iframe, 'load', function() {
        helpers.addEvent(iframe.contentWindow || iframe, 'resize', handler);
        handler();
      });
      return iframe;
    }
    function addResizeListener(node, listener, chart) {
      var stub = node._chartjs = {ticking: false};
      var notify = function() {
        if (!stub.ticking) {
          stub.ticking = true;
          helpers.requestAnimFrame.call(window, function() {
            if (stub.resizer) {
              stub.ticking = false;
              return listener(createEvent('resize', chart));
            }
          });
        }
      };
      stub.resizer = createResizer(notify);
      node.insertBefore(stub.resizer, node.firstChild);
    }
    function removeResizeListener(node) {
      if (!node || !node._chartjs) {
        return;
      }
      var resizer = node._chartjs.resizer;
      if (resizer) {
        resizer.parentNode.removeChild(resizer);
        node._chartjs.resizer = null;
      }
      delete node._chartjs;
    }
    return {
      acquireContext: function(item, config) {
        if (typeof item === 'string') {
          item = document.getElementById(item);
        } else if (item.length) {
          item = item[0];
        }
        if (item && item.canvas) {
          item = item.canvas;
        }
        if (item instanceof HTMLCanvasElement) {
          var context = item.getContext && item.getContext('2d');
          if (context instanceof CanvasRenderingContext2D) {
            initCanvas(item, config);
            return context;
          }
        }
        return null;
      },
      releaseContext: function(context) {
        var canvas = context.canvas;
        if (!canvas._chartjs) {
          return;
        }
        var initial = canvas._chartjs.initial;
        ['height', 'width'].forEach(function(prop) {
          var value = initial[prop];
          if (value === undefined || value === null) {
            canvas.removeAttribute(prop);
          } else {
            canvas.setAttribute(prop, value);
          }
        });
        helpers.each(initial.style || {}, function(value, key) {
          canvas.style[key] = value;
        });
        canvas.width = canvas.width;
        delete canvas._chartjs;
      },
      addEventListener: function(chart, type, listener) {
        var canvas = chart.chart.canvas;
        if (type === 'resize') {
          addResizeListener(canvas.parentNode, listener, chart.chart);
          return;
        }
        var stub = listener._chartjs || (listener._chartjs = {});
        var proxies = stub.proxies || (stub.proxies = {});
        var proxy = proxies[chart.id + '_' + type] = function(event) {
          listener(fromNativeEvent(event, chart.chart));
        };
        helpers.addEvent(canvas, type, proxy);
      },
      removeEventListener: function(chart, type, listener) {
        var canvas = chart.chart.canvas;
        if (type === 'resize') {
          removeResizeListener(canvas.parentNode, listener);
          return;
        }
        var stub = listener._chartjs || {};
        var proxies = stub.proxies || {};
        var proxy = proxies[chart.id + '_' + type];
        if (!proxy) {
          return;
        }
        helpers.removeEvent(canvas, type, proxy);
      }
    };
  };
})(require('process'));
