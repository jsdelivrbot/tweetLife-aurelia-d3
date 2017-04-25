/* */ 
"format cjs";
define(function(require) {
  var guid = require('./core/guid');
  var env = require('./core/env');
  var zrUtil = require('./core/util');
  var Handler = require('./Handler');
  var Storage = require('./Storage');
  var Animation = require('./animation/Animation');
  var HandlerProxy = require('./dom/HandlerProxy');
  var useVML = !env.canvasSupported;
  var painterCtors = {canvas: require('./Painter')};
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
  return zrender;
});
