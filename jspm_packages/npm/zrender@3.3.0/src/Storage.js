/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var util = require('./core/util');
  var env = require('./core/env');
  var Group = require('./container/Group');
  var timsort = require('./core/timsort');
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
  return Storage;
});
