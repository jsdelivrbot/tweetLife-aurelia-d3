/* */ 
(function(process) {
  "use strict";
  var forEach = require('./collection-utils').forEach;
  var elementUtilsMaker = require('./element-utils');
  var listenerHandlerMaker = require('./listener-handler');
  var idGeneratorMaker = require('./id-generator');
  var idHandlerMaker = require('./id-handler');
  var reporterMaker = require('./reporter');
  var browserDetector = require('./browser-detector');
  var batchProcessorMaker = require('batch-processor');
  var stateHandler = require('./state-handler');
  var objectStrategyMaker = require('./detection-strategy/object');
  var scrollStrategyMaker = require('./detection-strategy/scroll');
  function isCollection(obj) {
    return Array.isArray(obj) || obj.length !== undefined;
  }
  function toArray(collection) {
    if (!Array.isArray(collection)) {
      var array = [];
      forEach(collection, function(obj) {
        array.push(obj);
      });
      return array;
    } else {
      return collection;
    }
  }
  function isElement(obj) {
    return obj && obj.nodeType === 1;
  }
  module.exports = function(options) {
    options = options || {};
    var idHandler;
    if (options.idHandler) {
      idHandler = {
        get: function(element) {
          return options.idHandler.get(element, true);
        },
        set: options.idHandler.set
      };
    } else {
      var idGenerator = idGeneratorMaker();
      var defaultIdHandler = idHandlerMaker({
        idGenerator: idGenerator,
        stateHandler: stateHandler
      });
      idHandler = defaultIdHandler;
    }
    var reporter = options.reporter;
    if (!reporter) {
      var quiet = reporter === false;
      reporter = reporterMaker(quiet);
    }
    var batchProcessor = getOption(options, "batchProcessor", batchProcessorMaker({reporter: reporter}));
    var globalOptions = {};
    globalOptions.callOnAdd = !!getOption(options, "callOnAdd", true);
    globalOptions.debug = !!getOption(options, "debug", false);
    var eventListenerHandler = listenerHandlerMaker(idHandler);
    var elementUtils = elementUtilsMaker({stateHandler: stateHandler});
    var detectionStrategy;
    var desiredStrategy = getOption(options, "strategy", "object");
    var strategyOptions = {
      reporter: reporter,
      batchProcessor: batchProcessor,
      stateHandler: stateHandler,
      idHandler: idHandler
    };
    if (desiredStrategy === "scroll") {
      if (browserDetector.isLegacyOpera()) {
        reporter.warn("Scroll strategy is not supported on legacy Opera. Changing to object strategy.");
        desiredStrategy = "object";
      } else if (browserDetector.isIE(9)) {
        reporter.warn("Scroll strategy is not supported on IE9. Changing to object strategy.");
        desiredStrategy = "object";
      }
    }
    if (desiredStrategy === "scroll") {
      detectionStrategy = scrollStrategyMaker(strategyOptions);
    } else if (desiredStrategy === "object") {
      detectionStrategy = objectStrategyMaker(strategyOptions);
    } else {
      throw new Error("Invalid strategy name: " + desiredStrategy);
    }
    var onReadyCallbacks = {};
    function listenTo(options, elements, listener) {
      function onResizeCallback(element) {
        var listeners = eventListenerHandler.get(element);
        forEach(listeners, function callListenerProxy(listener) {
          listener(element);
        });
      }
      function addListener(callOnAdd, element, listener) {
        eventListenerHandler.add(element, listener);
        if (callOnAdd) {
          listener(element);
        }
      }
      if (!listener) {
        listener = elements;
        elements = options;
        options = {};
      }
      if (!elements) {
        throw new Error("At least one element required.");
      }
      if (!listener) {
        throw new Error("Listener required.");
      }
      if (isElement(elements)) {
        elements = [elements];
      } else if (isCollection(elements)) {
        elements = toArray(elements);
      } else {
        return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
      }
      var elementsReady = 0;
      var callOnAdd = getOption(options, "callOnAdd", globalOptions.callOnAdd);
      var onReadyCallback = getOption(options, "onReady", function noop() {});
      var debug = getOption(options, "debug", globalOptions.debug);
      forEach(elements, function attachListenerToElement(element) {
        if (!stateHandler.getState(element)) {
          stateHandler.initState(element);
          idHandler.set(element);
        }
        var id = idHandler.get(element);
        debug && reporter.log("Attaching listener to element", id, element);
        if (!elementUtils.isDetectable(element)) {
          debug && reporter.log(id, "Not detectable.");
          if (elementUtils.isBusy(element)) {
            debug && reporter.log(id, "System busy making it detectable");
            addListener(callOnAdd, element, listener);
            onReadyCallbacks[id] = onReadyCallbacks[id] || [];
            onReadyCallbacks[id].push(function onReady() {
              elementsReady++;
              if (elementsReady === elements.length) {
                onReadyCallback();
              }
            });
            return;
          }
          debug && reporter.log(id, "Making detectable...");
          elementUtils.markBusy(element, true);
          return detectionStrategy.makeDetectable({debug: debug}, element, function onElementDetectable(element) {
            debug && reporter.log(id, "onElementDetectable");
            if (stateHandler.getState(element)) {
              elementUtils.markAsDetectable(element);
              elementUtils.markBusy(element, false);
              detectionStrategy.addListener(element, onResizeCallback);
              addListener(callOnAdd, element, listener);
              var state = stateHandler.getState(element);
              if (state && state.startSize) {
                var width = element.offsetWidth;
                var height = element.offsetHeight;
                if (state.startSize.width !== width || state.startSize.height !== height) {
                  onResizeCallback(element);
                }
              }
              if (onReadyCallbacks[id]) {
                forEach(onReadyCallbacks[id], function(callback) {
                  callback();
                });
              }
            } else {
              debug && reporter.log(id, "Element uninstalled before being detectable.");
            }
            delete onReadyCallbacks[id];
            elementsReady++;
            if (elementsReady === elements.length) {
              onReadyCallback();
            }
          });
        }
        debug && reporter.log(id, "Already detecable, adding listener.");
        addListener(callOnAdd, element, listener);
        elementsReady++;
      });
      if (elementsReady === elements.length) {
        onReadyCallback();
      }
    }
    function uninstall(elements) {
      if (!elements) {
        return reporter.error("At least one element is required.");
      }
      if (isElement(elements)) {
        elements = [elements];
      } else if (isCollection(elements)) {
        elements = toArray(elements);
      } else {
        return reporter.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
      }
      forEach(elements, function(element) {
        eventListenerHandler.removeAllListeners(element);
        detectionStrategy.uninstall(element);
        stateHandler.cleanState(element);
      });
    }
    return {
      listenTo: listenTo,
      removeListener: eventListenerHandler.removeListener,
      removeAllListeners: eventListenerHandler.removeAllListeners,
      uninstall: uninstall
    };
  };
  function getOption(options, name, defaultValue) {
    var value = options[name];
    if ((value === undefined || value === null) && defaultValue !== undefined) {
      return defaultValue;
    }
    return value;
  }
})(require('process'));
