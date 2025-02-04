/* */ 
(function(process) {
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
})(require('process'));
