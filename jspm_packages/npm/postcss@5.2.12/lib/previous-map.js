/* */ 
(function(process) {
  'use strict';
  exports.__esModule = true;
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
  } : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };
  var _jsBase = require('js-base64');
  var _sourceMap = require('source-map');
  var _sourceMap2 = _interopRequireDefault(_sourceMap);
  var _path = require('path');
  var _path2 = _interopRequireDefault(_path);
  var _fs = require('fs');
  var _fs2 = _interopRequireDefault(_fs);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  var PreviousMap = function() {
    function PreviousMap(css, opts) {
      _classCallCheck(this, PreviousMap);
      this.loadAnnotation(css);
      this.inline = this.startWith(this.annotation, 'data:');
      var prev = opts.map ? opts.map.prev : undefined;
      var text = this.loadMap(opts.from, prev);
      if (text)
        this.text = text;
    }
    PreviousMap.prototype.consumer = function consumer() {
      if (!this.consumerCache) {
        this.consumerCache = new _sourceMap2.default.SourceMapConsumer(this.text);
      }
      return this.consumerCache;
    };
    PreviousMap.prototype.withContent = function withContent() {
      return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    };
    PreviousMap.prototype.startWith = function startWith(string, start) {
      if (!string)
        return false;
      return string.substr(0, start.length) === start;
    };
    PreviousMap.prototype.loadAnnotation = function loadAnnotation(css) {
      var match = css.match(/\/\*\s*# sourceMappingURL=(.*)\s*\*\//);
      if (match)
        this.annotation = match[1].trim();
    };
    PreviousMap.prototype.decodeInline = function decodeInline(text) {
      var utfd64 = 'data:application/json;charset=utf-8;base64,';
      var utf64 = 'data:application/json;charset=utf8;base64,';
      var b64 = 'data:application/json;base64,';
      var uri = 'data:application/json,';
      if (this.startWith(text, uri)) {
        return decodeURIComponent(text.substr(uri.length));
      } else if (this.startWith(text, b64)) {
        return _jsBase.Base64.decode(text.substr(b64.length));
      } else if (this.startWith(text, utf64)) {
        return _jsBase.Base64.decode(text.substr(utf64.length));
      } else if (this.startWith(text, utfd64)) {
        return _jsBase.Base64.decode(text.substr(utfd64.length));
      } else {
        var encoding = text.match(/data:application\/json;([^,]+),/)[1];
        throw new Error('Unsupported source map encoding ' + encoding);
      }
    };
    PreviousMap.prototype.loadMap = function loadMap(file, prev) {
      if (prev === false)
        return false;
      if (prev) {
        if (typeof prev === 'string') {
          return prev;
        } else if (typeof prev === 'function') {
          var prevPath = prev(file);
          if (prevPath && _fs2.default.existsSync && _fs2.default.existsSync(prevPath)) {
            return _fs2.default.readFileSync(prevPath, 'utf-8').toString().trim();
          } else {
            throw new Error('Unable to load previous source map: ' + prevPath.toString());
          }
        } else if (prev instanceof _sourceMap2.default.SourceMapConsumer) {
          return _sourceMap2.default.SourceMapGenerator.fromSourceMap(prev).toString();
        } else if (prev instanceof _sourceMap2.default.SourceMapGenerator) {
          return prev.toString();
        } else if (this.isMap(prev)) {
          return JSON.stringify(prev);
        } else {
          throw new Error('Unsupported previous source map format: ' + prev.toString());
        }
      } else if (this.inline) {
        return this.decodeInline(this.annotation);
      } else if (this.annotation) {
        var map = this.annotation;
        if (file)
          map = _path2.default.join(_path2.default.dirname(file), map);
        this.root = _path2.default.dirname(map);
        if (_fs2.default.existsSync && _fs2.default.existsSync(map)) {
          return _fs2.default.readFileSync(map, 'utf-8').toString().trim();
        } else {
          return false;
        }
      }
    };
    PreviousMap.prototype.isMap = function isMap(map) {
      if ((typeof map === 'undefined' ? 'undefined' : _typeof(map)) !== 'object')
        return false;
      return typeof map.mappings === 'string' || typeof map._mappings === 'string';
    };
    return PreviousMap;
  }();
  exports.default = PreviousMap;
  module.exports = exports['default'];
})(require('process'));
