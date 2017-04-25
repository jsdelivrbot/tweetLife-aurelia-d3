/* */ 
(function(process) {
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
})(require('process'));
