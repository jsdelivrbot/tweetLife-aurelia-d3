/* */ 
"format cjs";
(function(process) {
  (function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = f();
    } else if (typeof define === "function" && define.amd) {
      define([], f);
    } else {
      var g;
      if (typeof window !== "undefined") {
        g = window;
      } else if (typeof global !== "undefined") {
        g = global;
      } else if (typeof self !== "undefined") {
        g = self;
      } else {
        g = this;
      }
      g.elementResizeDetectorMaker = f();
    }
  })(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            var f = new Error("Cannot find module '" + o + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }
          var l = n[o] = {exports: {}};
          t[o][0].call(l.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, l, l.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(require, module, exports) {
        "use strict";
        var utils = require('./utils');
        module.exports = function batchProcessorMaker(options) {
          options = options || {};
          var reporter = options.reporter;
          var asyncProcess = utils.getOption(options, "async", true);
          var autoProcess = utils.getOption(options, "auto", true);
          if (autoProcess && !asyncProcess) {
            reporter && reporter.warn("Invalid options combination. auto=true and async=false is invalid. Setting async=true.");
            asyncProcess = true;
          }
          var batch = Batch();
          var asyncFrameHandler;
          var isProcessing = false;
          function addFunction(level, fn) {
            if (!isProcessing && autoProcess && asyncProcess && batch.size() === 0) {
              processBatchAsync();
            }
            batch.add(level, fn);
          }
          function processBatch() {
            isProcessing = true;
            while (batch.size()) {
              var processingBatch = batch;
              batch = Batch();
              processingBatch.process();
            }
            isProcessing = false;
          }
          function forceProcessBatch(localAsyncProcess) {
            if (isProcessing) {
              return;
            }
            if (localAsyncProcess === undefined) {
              localAsyncProcess = asyncProcess;
            }
            if (asyncFrameHandler) {
              cancelFrame(asyncFrameHandler);
              asyncFrameHandler = null;
            }
            if (localAsyncProcess) {
              processBatchAsync();
            } else {
              processBatch();
            }
          }
          function processBatchAsync() {
            asyncFrameHandler = requestFrame(processBatch);
          }
          function clearBatch() {
            batch = {};
            batchSize = 0;
            topLevel = 0;
            bottomLevel = 0;
          }
          function cancelFrame(listener) {
            var cancel = clearTimeout;
            return cancel(listener);
          }
          function requestFrame(callback) {
            var raf = function(fn) {
              return setTimeout(fn, 0);
            };
            return raf(callback);
          }
          return {
            add: addFunction,
            force: forceProcessBatch
          };
        };
        function Batch() {
          var batch = {};
          var size = 0;
          var topLevel = 0;
          var bottomLevel = 0;
          function add(level, fn) {
            if (!fn) {
              fn = level;
              level = 0;
            }
            if (level > topLevel) {
              topLevel = level;
            } else if (level < bottomLevel) {
              bottomLevel = level;
            }
            if (!batch[level]) {
              batch[level] = [];
            }
            batch[level].push(fn);
            size++;
          }
          function process() {
            for (var level = bottomLevel; level <= topLevel; level++) {
              var fns = batch[level];
              for (var i = 0; i < fns.length; i++) {
                var fn = fns[i];
                fn();
              }
            }
          }
          function getSize() {
            return size;
          }
          return {
            add: add,
            process: process,
            size: getSize
          };
        }
      }, {"./utils": 2}],
      2: [function(require, module, exports) {
        "use strict";
        var utils = module.exports = {};
        utils.getOption = getOption;
        function getOption(options, name, defaultValue) {
          var value = options[name];
          if ((value === undefined || value === null) && defaultValue !== undefined) {
            return defaultValue;
          }
          return value;
        }
      }, {}],
      3: [function(require, module, exports) {
        "use strict";
        var detector = module.exports = {};
        detector.isIE = function(version) {
          function isAnyIeVersion() {
            var agent = navigator.userAgent.toLowerCase();
            return agent.indexOf("msie") !== -1 || agent.indexOf("trident") !== -1 || agent.indexOf(" edge/") !== -1;
          }
          if (!isAnyIeVersion()) {
            return false;
          }
          if (!version) {
            return true;
          }
          var ieVersion = (function() {
            var undef,
                v = 3,
                div = document.createElement("div"),
                all = div.getElementsByTagName("i");
            do {
              div.innerHTML = "<!--[if gt IE " + (++v) + "]><i></i><![endif]-->";
            } while (all[0]);
            return v > 4 ? v : undef;
          }());
          return version === ieVersion;
        };
        detector.isLegacyOpera = function() {
          return !!window.opera;
        };
      }, {}],
      4: [function(require, module, exports) {
        "use strict";
        var utils = module.exports = {};
        utils.forEach = function(collection, callback) {
          for (var i = 0; i < collection.length; i++) {
            var result = callback(collection[i]);
            if (result) {
              return result;
            }
          }
        };
      }, {}],
      5: [function(require, module, exports) {
        "use strict";
        var browserDetector = require('../browser-detector');
        module.exports = function(options) {
          options = options || {};
          var reporter = options.reporter;
          var batchProcessor = options.batchProcessor;
          var getState = options.stateHandler.getState;
          if (!reporter) {
            throw new Error("Missing required dependency: reporter.");
          }
          function addListener(element, listener) {
            if (!getObject(element)) {
              throw new Error("Element is not detectable by this strategy.");
            }
            function listenerProxy() {
              listener(element);
            }
            if (browserDetector.isIE(8)) {
              getState(element).object = {proxy: listenerProxy};
              element.attachEvent("onresize", listenerProxy);
            } else {
              var object = getObject(element);
              object.contentDocument.defaultView.addEventListener("resize", listenerProxy);
            }
          }
          function makeDetectable(options, element, callback) {
            if (!callback) {
              callback = element;
              element = options;
              options = null;
            }
            options = options || {};
            var debug = options.debug;
            function injectObject(element, callback) {
              var OBJECT_STYLE = "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; padding: 0; margin: 0; opacity: 0; z-index: -1000; pointer-events: none;";
              var positionCheckPerformed = false;
              var style = window.getComputedStyle(element);
              var width = element.offsetWidth;
              var height = element.offsetHeight;
              getState(element).startSize = {
                width: width,
                height: height
              };
              function mutateDom() {
                function alterPositionStyles() {
                  if (style.position === "static") {
                    element.style.position = "relative";
                    var removeRelativeStyles = function(reporter, element, style, property) {
                      function getNumericalValue(value) {
                        return value.replace(/[^-\d\.]/g, "");
                      }
                      var value = style[property];
                      if (value !== "auto" && getNumericalValue(value) !== "0") {
                        reporter.warn("An element that is positioned static has style." + property + "=" + value + " which is ignored due to the static positioning. The element will need to be positioned relative, so the style." + property + " will be set to 0. Element: ", element);
                        element.style[property] = 0;
                      }
                    };
                    removeRelativeStyles(reporter, element, style, "top");
                    removeRelativeStyles(reporter, element, style, "right");
                    removeRelativeStyles(reporter, element, style, "bottom");
                    removeRelativeStyles(reporter, element, style, "left");
                  }
                }
                function onObjectLoad() {
                  if (!positionCheckPerformed) {
                    alterPositionStyles();
                  }
                  function getDocument(element, callback) {
                    if (!element.contentDocument) {
                      setTimeout(function checkForObjectDocument() {
                        getDocument(element, callback);
                      }, 100);
                      return;
                    }
                    callback(element.contentDocument);
                  }
                  var objectElement = this;
                  getDocument(objectElement, function onObjectDocumentReady(objectDocument) {
                    callback(element);
                  });
                }
                if (style.position !== "") {
                  alterPositionStyles(style);
                  positionCheckPerformed = true;
                }
                var object = document.createElement("object");
                object.style.cssText = OBJECT_STYLE;
                object.tabIndex = -1;
                object.type = "text/html";
                object.onload = onObjectLoad;
                if (!browserDetector.isIE()) {
                  object.data = "about:blank";
                }
                element.appendChild(object);
                getState(element).object = object;
                if (browserDetector.isIE()) {
                  object.data = "about:blank";
                }
              }
              if (batchProcessor) {
                batchProcessor.add(mutateDom);
              } else {
                mutateDom();
              }
            }
            if (browserDetector.isIE(8)) {
              callback(element);
            } else {
              injectObject(element, callback);
            }
          }
          function getObject(element) {
            return getState(element).object;
          }
          function uninstall(element) {
            if (browserDetector.isIE(8)) {
              element.detachEvent("onresize", getState(element).object.proxy);
            } else {
              element.removeChild(getObject(element));
            }
            delete getState(element).object;
          }
          return {
            makeDetectable: makeDetectable,
            addListener: addListener,
            uninstall: uninstall
          };
        };
      }, {"../browser-detector": 3}],
      6: [function(require, module, exports) {
        "use strict";
        var forEach = require('../collection-utils').forEach;
        module.exports = function(options) {
          options = options || {};
          var reporter = options.reporter;
          var batchProcessor = options.batchProcessor;
          var getState = options.stateHandler.getState;
          var hasState = options.stateHandler.hasState;
          var idHandler = options.idHandler;
          if (!batchProcessor) {
            throw new Error("Missing required dependency: batchProcessor");
          }
          if (!reporter) {
            throw new Error("Missing required dependency: reporter.");
          }
          var scrollbarSizes = getScrollbarSizes();
          var styleId = "erd_scroll_detection_scrollbar_style";
          var detectionContainerClass = "erd_scroll_detection_container";
          injectScrollStyle(styleId, detectionContainerClass);
          function getScrollbarSizes() {
            var width = 500;
            var height = 500;
            var child = document.createElement("div");
            child.style.cssText = "position: absolute; width: " + width * 2 + "px; height: " + height * 2 + "px; visibility: hidden; margin: 0; padding: 0;";
            var container = document.createElement("div");
            container.style.cssText = "position: absolute; width: " + width + "px; height: " + height + "px; overflow: scroll; visibility: none; top: " + -width * 3 + "px; left: " + -height * 3 + "px; visibility: hidden; margin: 0; padding: 0;";
            container.appendChild(child);
            document.body.insertBefore(container, document.body.firstChild);
            var widthSize = width - container.clientWidth;
            var heightSize = height - container.clientHeight;
            document.body.removeChild(container);
            return {
              width: widthSize,
              height: heightSize
            };
          }
          function injectScrollStyle(styleId, containerClass) {
            function injectStyle(style, method) {
              method = method || function(element) {
                document.head.appendChild(element);
              };
              var styleElement = document.createElement("style");
              styleElement.innerHTML = style;
              styleElement.id = styleId;
              method(styleElement);
              return styleElement;
            }
            if (!document.getElementById(styleId)) {
              var containerAnimationClass = containerClass + "_animation";
              var containerAnimationActiveClass = containerClass + "_animation_active";
              var style = "/* Created by the element-resize-detector library. */\n";
              style += "." + containerClass + " > div::-webkit-scrollbar { display: none; }\n\n";
              style += "." + containerAnimationActiveClass + " { -webkit-animation-duration: 0.1s; animation-duration: 0.1s; -webkit-animation-name: " + containerAnimationClass + "; animation-name: " + containerAnimationClass + "; }\n";
              style += "@-webkit-keyframes " + containerAnimationClass + " { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }\n";
              style += "@keyframes " + containerAnimationClass + " { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }";
              injectStyle(style);
            }
          }
          function addAnimationClass(element) {
            element.className += " " + detectionContainerClass + "_animation_active";
          }
          function addEvent(el, name, cb) {
            if (el.addEventListener) {
              el.addEventListener(name, cb);
            } else if (el.attachEvent) {
              el.attachEvent("on" + name, cb);
            } else {
              return reporter.error("[scroll] Don't know how to add event listeners.");
            }
          }
          function removeEvent(el, name, cb) {
            if (el.removeEventListener) {
              el.removeEventListener(name, cb);
            } else if (el.detachEvent) {
              el.detachEvent("on" + name, cb);
            } else {
              return reporter.error("[scroll] Don't know how to remove event listeners.");
            }
          }
          function getExpandElement(element) {
            return getState(element).container.childNodes[0].childNodes[0].childNodes[0];
          }
          function getShrinkElement(element) {
            return getState(element).container.childNodes[0].childNodes[0].childNodes[1];
          }
          function addListener(element, listener) {
            var listeners = getState(element).listeners;
            if (!listeners.push) {
              throw new Error("Cannot add listener to an element that is not detectable.");
            }
            getState(element).listeners.push(listener);
          }
          function makeDetectable(options, element, callback) {
            if (!callback) {
              callback = element;
              element = options;
              options = null;
            }
            options = options || {};
            function debug() {
              if (options.debug) {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(idHandler.get(element), "Scroll: ");
                if (reporter.log.apply) {
                  reporter.log.apply(null, args);
                } else {
                  for (var i = 0; i < args.length; i++) {
                    reporter.log(args[i]);
                  }
                }
              }
            }
            function isDetached(element) {
              function isInDocument(element) {
                return element === element.ownerDocument.body || element.ownerDocument.body.contains(element);
              }
              return !isInDocument(element);
            }
            function isUnrendered(element) {
              var container = getState(element).container.childNodes[0];
              return getComputedStyle(container).width.indexOf("px") === -1;
            }
            function getStyle() {
              var elementStyle = getComputedStyle(element);
              var style = {};
              style.position = elementStyle.position;
              style.width = element.offsetWidth;
              style.height = element.offsetHeight;
              style.top = elementStyle.top;
              style.right = elementStyle.right;
              style.bottom = elementStyle.bottom;
              style.left = elementStyle.left;
              style.widthCSS = elementStyle.width;
              style.heightCSS = elementStyle.height;
              return style;
            }
            function storeStartSize() {
              var style = getStyle();
              getState(element).startSize = {
                width: style.width,
                height: style.height
              };
              debug("Element start size", getState(element).startSize);
            }
            function initListeners() {
              getState(element).listeners = [];
            }
            function storeStyle() {
              debug("storeStyle invoked.");
              if (!getState(element)) {
                debug("Aborting because element has been uninstalled");
                return;
              }
              var style = getStyle();
              getState(element).style = style;
            }
            function storeCurrentSize(element, width, height) {
              getState(element).lastWidth = width;
              getState(element).lastHeight = height;
            }
            function getExpandChildElement(element) {
              return getExpandElement(element).childNodes[0];
            }
            function getWidthOffset() {
              return 2 * scrollbarSizes.width + 1;
            }
            function getHeightOffset() {
              return 2 * scrollbarSizes.height + 1;
            }
            function getExpandWidth(width) {
              return width + 10 + getWidthOffset();
            }
            function getExpandHeight(height) {
              return height + 10 + getHeightOffset();
            }
            function getShrinkWidth(width) {
              return width * 2 + getWidthOffset();
            }
            function getShrinkHeight(height) {
              return height * 2 + getHeightOffset();
            }
            function positionScrollbars(element, width, height) {
              var expand = getExpandElement(element);
              var shrink = getShrinkElement(element);
              var expandWidth = getExpandWidth(width);
              var expandHeight = getExpandHeight(height);
              var shrinkWidth = getShrinkWidth(width);
              var shrinkHeight = getShrinkHeight(height);
              expand.scrollLeft = expandWidth;
              expand.scrollTop = expandHeight;
              shrink.scrollLeft = shrinkWidth;
              shrink.scrollTop = shrinkHeight;
            }
            function injectContainerElement() {
              var container = getState(element).container;
              if (!container) {
                container = document.createElement("div");
                container.className = detectionContainerClass;
                container.style.cssText = "visibility: hidden; display: inline; width: 0px; height: 0px; z-index: -1; overflow: hidden; margin: 0; padding: 0;";
                getState(element).container = container;
                addAnimationClass(container);
                element.appendChild(container);
                var onAnimationStart = function() {
                  getState(element).onRendered && getState(element).onRendered();
                };
                addEvent(container, "animationstart", onAnimationStart);
                getState(element).onAnimationStart = onAnimationStart;
              }
              return container;
            }
            function injectScrollElements() {
              function alterPositionStyles() {
                var style = getState(element).style;
                if (style.position === "static") {
                  element.style.position = "relative";
                  var removeRelativeStyles = function(reporter, element, style, property) {
                    function getNumericalValue(value) {
                      return value.replace(/[^-\d\.]/g, "");
                    }
                    var value = style[property];
                    if (value !== "auto" && getNumericalValue(value) !== "0") {
                      reporter.warn("An element that is positioned static has style." + property + "=" + value + " which is ignored due to the static positioning. The element will need to be positioned relative, so the style." + property + " will be set to 0. Element: ", element);
                      element.style[property] = 0;
                    }
                  };
                  removeRelativeStyles(reporter, element, style, "top");
                  removeRelativeStyles(reporter, element, style, "right");
                  removeRelativeStyles(reporter, element, style, "bottom");
                  removeRelativeStyles(reporter, element, style, "left");
                }
              }
              function getLeftTopBottomRightCssText(left, top, bottom, right) {
                left = (!left ? "0" : (left + "px"));
                top = (!top ? "0" : (top + "px"));
                bottom = (!bottom ? "0" : (bottom + "px"));
                right = (!right ? "0" : (right + "px"));
                return "left: " + left + "; top: " + top + "; right: " + right + "; bottom: " + bottom + ";";
              }
              debug("Injecting elements");
              if (!getState(element)) {
                debug("Aborting because element has been uninstalled");
                return;
              }
              alterPositionStyles();
              var rootContainer = getState(element).container;
              if (!rootContainer) {
                rootContainer = injectContainerElement();
              }
              var scrollbarWidth = scrollbarSizes.width;
              var scrollbarHeight = scrollbarSizes.height;
              var containerContainerStyle = "position: absolute; flex: none; overflow: hidden; z-index: -1; visibility: hidden; width: 100%; height: 100%; left: 0px; top: 0px;";
              var containerStyle = "position: absolute; flex: none; overflow: hidden; z-index: -1; visibility: hidden; " + getLeftTopBottomRightCssText(-(1 + scrollbarWidth), -(1 + scrollbarHeight), -scrollbarHeight, -scrollbarWidth);
              var expandStyle = "position: absolute; flex: none; overflow: scroll; z-index: -1; visibility: hidden; width: 100%; height: 100%;";
              var shrinkStyle = "position: absolute; flex: none; overflow: scroll; z-index: -1; visibility: hidden; width: 100%; height: 100%;";
              var expandChildStyle = "position: absolute; left: 0; top: 0;";
              var shrinkChildStyle = "position: absolute; width: 200%; height: 200%;";
              var containerContainer = document.createElement("div");
              var container = document.createElement("div");
              var expand = document.createElement("div");
              var expandChild = document.createElement("div");
              var shrink = document.createElement("div");
              var shrinkChild = document.createElement("div");
              containerContainer.dir = "ltr";
              containerContainer.style.cssText = containerContainerStyle;
              containerContainer.className = detectionContainerClass;
              container.className = detectionContainerClass;
              container.style.cssText = containerStyle;
              expand.style.cssText = expandStyle;
              expandChild.style.cssText = expandChildStyle;
              shrink.style.cssText = shrinkStyle;
              shrinkChild.style.cssText = shrinkChildStyle;
              expand.appendChild(expandChild);
              shrink.appendChild(shrinkChild);
              container.appendChild(expand);
              container.appendChild(shrink);
              containerContainer.appendChild(container);
              rootContainer.appendChild(containerContainer);
              function onExpandScroll() {
                getState(element).onExpand && getState(element).onExpand();
              }
              function onShrinkScroll() {
                getState(element).onShrink && getState(element).onShrink();
              }
              addEvent(expand, "scroll", onExpandScroll);
              addEvent(shrink, "scroll", onShrinkScroll);
              getState(element).onExpandScroll = onExpandScroll;
              getState(element).onShrinkScroll = onShrinkScroll;
            }
            function registerListenersAndPositionElements() {
              function updateChildSizes(element, width, height) {
                var expandChild = getExpandChildElement(element);
                var expandWidth = getExpandWidth(width);
                var expandHeight = getExpandHeight(height);
                expandChild.style.width = expandWidth + "px";
                expandChild.style.height = expandHeight + "px";
              }
              function updateDetectorElements(done) {
                var width = element.offsetWidth;
                var height = element.offsetHeight;
                debug("Storing current size", width, height);
                storeCurrentSize(element, width, height);
                batchProcessor.add(0, function performUpdateChildSizes() {
                  if (!getState(element)) {
                    debug("Aborting because element has been uninstalled");
                    return;
                  }
                  if (!areElementsInjected()) {
                    debug("Aborting because element container has not been initialized");
                    return;
                  }
                  if (options.debug) {
                    var w = element.offsetWidth;
                    var h = element.offsetHeight;
                    if (w !== width || h !== height) {
                      reporter.warn(idHandler.get(element), "Scroll: Size changed before updating detector elements.");
                    }
                  }
                  updateChildSizes(element, width, height);
                });
                batchProcessor.add(1, function updateScrollbars() {
                  if (!getState(element)) {
                    debug("Aborting because element has been uninstalled");
                    return;
                  }
                  if (!areElementsInjected()) {
                    debug("Aborting because element container has not been initialized");
                    return;
                  }
                  positionScrollbars(element, width, height);
                });
                if (done) {
                  batchProcessor.add(2, function() {
                    if (!getState(element)) {
                      debug("Aborting because element has been uninstalled");
                      return;
                    }
                    if (!areElementsInjected()) {
                      debug("Aborting because element container has not been initialized");
                      return;
                    }
                    done();
                  });
                }
              }
              function areElementsInjected() {
                return !!getState(element).container;
              }
              function notifyListenersIfNeeded() {
                function isFirstNotify() {
                  return getState(element).lastNotifiedWidth === undefined;
                }
                debug("notifyListenersIfNeeded invoked");
                var state = getState(element);
                if (isFirstNotify() && state.lastWidth === state.startSize.width && state.lastHeight === state.startSize.height) {
                  return debug("Not notifying: Size is the same as the start size, and there has been no notification yet.");
                }
                if (state.lastWidth === state.lastNotifiedWidth && state.lastHeight === state.lastNotifiedHeight) {
                  return debug("Not notifying: Size already notified");
                }
                debug("Current size not notified, notifying...");
                state.lastNotifiedWidth = state.lastWidth;
                state.lastNotifiedHeight = state.lastHeight;
                forEach(getState(element).listeners, function(listener) {
                  listener(element);
                });
              }
              function handleRender() {
                debug("startanimation triggered.");
                if (isUnrendered(element)) {
                  debug("Ignoring since element is still unrendered...");
                  return;
                }
                debug("Element rendered.");
                var expand = getExpandElement(element);
                var shrink = getShrinkElement(element);
                if (expand.scrollLeft === 0 || expand.scrollTop === 0 || shrink.scrollLeft === 0 || shrink.scrollTop === 0) {
                  debug("Scrollbars out of sync. Updating detector elements...");
                  updateDetectorElements(notifyListenersIfNeeded);
                }
              }
              function handleScroll() {
                debug("Scroll detected.");
                if (isUnrendered(element)) {
                  debug("Scroll event fired while unrendered. Ignoring...");
                  return;
                }
                var width = element.offsetWidth;
                var height = element.offsetHeight;
                if (width !== element.lastWidth || height !== element.lastHeight) {
                  debug("Element size changed.");
                  updateDetectorElements(notifyListenersIfNeeded);
                } else {
                  debug("Element size has not changed (" + width + "x" + height + ").");
                }
              }
              debug("registerListenersAndPositionElements invoked.");
              if (!getState(element)) {
                debug("Aborting because element has been uninstalled");
                return;
              }
              getState(element).onRendered = handleRender;
              getState(element).onExpand = handleScroll;
              getState(element).onShrink = handleScroll;
              var style = getState(element).style;
              updateChildSizes(element, style.width, style.height);
            }
            function finalizeDomMutation() {
              debug("finalizeDomMutation invoked.");
              if (!getState(element)) {
                debug("Aborting because element has been uninstalled");
                return;
              }
              var style = getState(element).style;
              storeCurrentSize(element, style.width, style.height);
              positionScrollbars(element, style.width, style.height);
            }
            function ready() {
              callback(element);
            }
            function install() {
              debug("Installing...");
              initListeners();
              storeStartSize();
              batchProcessor.add(0, storeStyle);
              batchProcessor.add(1, injectScrollElements);
              batchProcessor.add(2, registerListenersAndPositionElements);
              batchProcessor.add(3, finalizeDomMutation);
              batchProcessor.add(4, ready);
            }
            debug("Making detectable...");
            if (isDetached(element)) {
              debug("Element is detached");
              injectContainerElement();
              debug("Waiting until element is attached...");
              getState(element).onRendered = function() {
                debug("Element is now attached");
                install();
              };
            } else {
              install();
            }
          }
          function uninstall(element) {
            var state = getState(element);
            if (!state) {
              return;
            }
            state.onExpandScroll && removeEvent(getExpandElement(element), "scroll", state.onExpandScroll);
            state.onShrinkScroll && removeEvent(getShrinkElement(element), "scroll", state.onShrinkScroll);
            state.onAnimationStart && removeEvent(state.container, "animationstart", state.onAnimationStart);
            state.container && element.removeChild(state.container);
          }
          return {
            makeDetectable: makeDetectable,
            addListener: addListener,
            uninstall: uninstall
          };
        };
      }, {"../collection-utils": 4}],
      7: [function(require, module, exports) {
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
      }, {
        "./browser-detector": 3,
        "./collection-utils": 4,
        "./detection-strategy/object.js": 5,
        "./detection-strategy/scroll.js": 6,
        "./element-utils": 8,
        "./id-generator": 9,
        "./id-handler": 10,
        "./listener-handler": 11,
        "./reporter": 12,
        "./state-handler": 13,
        "batch-processor": 1
      }],
      8: [function(require, module, exports) {
        "use strict";
        module.exports = function(options) {
          var getState = options.stateHandler.getState;
          function isDetectable(element) {
            var state = getState(element);
            return state && !!state.isDetectable;
          }
          function markAsDetectable(element) {
            getState(element).isDetectable = true;
          }
          function isBusy(element) {
            return !!getState(element).busy;
          }
          function markBusy(element, busy) {
            getState(element).busy = !!busy;
          }
          return {
            isDetectable: isDetectable,
            markAsDetectable: markAsDetectable,
            isBusy: isBusy,
            markBusy: markBusy
          };
        };
      }, {}],
      9: [function(require, module, exports) {
        "use strict";
        module.exports = function() {
          var idCount = 1;
          function generate() {
            return idCount++;
          }
          return {generate: generate};
        };
      }, {}],
      10: [function(require, module, exports) {
        "use strict";
        module.exports = function(options) {
          var idGenerator = options.idGenerator;
          var getState = options.stateHandler.getState;
          function getId(element) {
            var state = getState(element);
            if (state && state.id !== undefined) {
              return state.id;
            }
            return null;
          }
          function setId(element) {
            var state = getState(element);
            if (!state) {
              throw new Error("setId required the element to have a resize detection state.");
            }
            var id = idGenerator.generate();
            state.id = id;
            return id;
          }
          return {
            get: getId,
            set: setId
          };
        };
      }, {}],
      11: [function(require, module, exports) {
        "use strict";
        module.exports = function(idHandler) {
          var eventListeners = {};
          function getListeners(element) {
            var id = idHandler.get(element);
            if (id === undefined) {
              return [];
            }
            return eventListeners[id] || [];
          }
          function addListener(element, listener) {
            var id = idHandler.get(element);
            if (!eventListeners[id]) {
              eventListeners[id] = [];
            }
            eventListeners[id].push(listener);
          }
          function removeListener(element, listener) {
            var listeners = getListeners(element);
            for (var i = 0,
                len = listeners.length; i < len; ++i) {
              if (listeners[i] === listener) {
                listeners.splice(i, 1);
                break;
              }
            }
          }
          function removeAllListeners(element) {
            var listeners = getListeners(element);
            if (!listeners) {
              return;
            }
            listeners.length = 0;
          }
          return {
            get: getListeners,
            add: addListener,
            removeListener: removeListener,
            removeAllListeners: removeAllListeners
          };
        };
      }, {}],
      12: [function(require, module, exports) {
        "use strict";
        module.exports = function(quiet) {
          function noop() {}
          var reporter = {
            log: noop,
            warn: noop,
            error: noop
          };
          if (!quiet && window.console) {
            var attachFunction = function(reporter, name) {
              reporter[name] = function reporterProxy() {
                var f = console[name];
                if (f.apply) {
                  f.apply(console, arguments);
                } else {
                  for (var i = 0; i < arguments.length; i++) {
                    f(arguments[i]);
                  }
                }
              };
            };
            attachFunction(reporter, "log");
            attachFunction(reporter, "warn");
            attachFunction(reporter, "error");
          }
          return reporter;
        };
      }, {}],
      13: [function(require, module, exports) {
        "use strict";
        var prop = "_erd";
        function initState(element) {
          element[prop] = {};
          return getState(element);
        }
        function getState(element) {
          return element[prop];
        }
        function cleanState(element) {
          delete element[prop];
        }
        module.exports = {
          initState: initState,
          getState: getState,
          cleanState: cleanState
        };
      }, {}]
    }, {}, [7])(7);
  });
})(require('process'));
