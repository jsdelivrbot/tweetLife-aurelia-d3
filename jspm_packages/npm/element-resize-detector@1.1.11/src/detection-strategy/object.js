/* */ 
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
