/* */ 
var zrUtil = require('../core/util');
var Element = require('../Element');
var BoundingRect = require('../core/BoundingRect');
var Group = function(opts) {
  opts = opts || {};
  Element.call(this, opts);
  for (var key in opts) {
    if (opts.hasOwnProperty(key)) {
      this[key] = opts[key];
    }
  }
  this._children = [];
  this.__storage = null;
  this.__dirty = true;
};
Group.prototype = {
  constructor: Group,
  isGroup: true,
  type: 'group',
  silent: false,
  children: function() {
    return this._children.slice();
  },
  childAt: function(idx) {
    return this._children[idx];
  },
  childOfName: function(name) {
    var children = this._children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].name === name) {
        return children[i];
      }
    }
  },
  childCount: function() {
    return this._children.length;
  },
  add: function(child) {
    if (child && child !== this && child.parent !== this) {
      this._children.push(child);
      this._doAdd(child);
    }
    return this;
  },
  addBefore: function(child, nextSibling) {
    if (child && child !== this && child.parent !== this && nextSibling && nextSibling.parent === this) {
      var children = this._children;
      var idx = children.indexOf(nextSibling);
      if (idx >= 0) {
        children.splice(idx, 0, child);
        this._doAdd(child);
      }
    }
    return this;
  },
  _doAdd: function(child) {
    if (child.parent) {
      child.parent.remove(child);
    }
    child.parent = this;
    var storage = this.__storage;
    var zr = this.__zr;
    if (storage && storage !== child.__storage) {
      storage.addToMap(child);
      if (child instanceof Group) {
        child.addChildrenToStorage(storage);
      }
    }
    zr && zr.refresh();
  },
  remove: function(child) {
    var zr = this.__zr;
    var storage = this.__storage;
    var children = this._children;
    var idx = zrUtil.indexOf(children, child);
    if (idx < 0) {
      return this;
    }
    children.splice(idx, 1);
    child.parent = null;
    if (storage) {
      storage.delFromMap(child.id);
      if (child instanceof Group) {
        child.delChildrenFromStorage(storage);
      }
    }
    zr && zr.refresh();
    return this;
  },
  removeAll: function() {
    var children = this._children;
    var storage = this.__storage;
    var child;
    var i;
    for (i = 0; i < children.length; i++) {
      child = children[i];
      if (storage) {
        storage.delFromMap(child.id);
        if (child instanceof Group) {
          child.delChildrenFromStorage(storage);
        }
      }
      child.parent = null;
    }
    children.length = 0;
    return this;
  },
  eachChild: function(cb, context) {
    var children = this._children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      cb.call(context, child, i);
    }
    return this;
  },
  traverse: function(cb, context) {
    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];
      cb.call(context, child);
      if (child.type === 'group') {
        child.traverse(cb, context);
      }
    }
    return this;
  },
  addChildrenToStorage: function(storage) {
    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];
      storage.addToMap(child);
      if (child instanceof Group) {
        child.addChildrenToStorage(storage);
      }
    }
  },
  delChildrenFromStorage: function(storage) {
    for (var i = 0; i < this._children.length; i++) {
      var child = this._children[i];
      storage.delFromMap(child.id);
      if (child instanceof Group) {
        child.delChildrenFromStorage(storage);
      }
    }
  },
  dirty: function() {
    this.__dirty = true;
    this.__zr && this.__zr.refresh();
    return this;
  },
  getBoundingRect: function(includeChildren) {
    var rect = null;
    var tmpRect = new BoundingRect(0, 0, 0, 0);
    var children = includeChildren || this._children;
    var tmpMat = [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.ignore || child.invisible) {
        continue;
      }
      var childRect = child.getBoundingRect();
      var transform = child.getLocalTransform(tmpMat);
      if (transform) {
        tmpRect.copy(childRect);
        tmpRect.applyTransform(transform);
        rect = rect || tmpRect.clone();
        rect.union(tmpRect);
      } else {
        rect = rect || childRect.clone();
        rect.union(childRect);
      }
    }
    return rect || tmpRect;
  }
};
zrUtil.inherits(Group, Element);
module.exports = Group;
