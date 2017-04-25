/* */ 
var zrUtil = require('zrender/lib/core/util');
var clazzUtil = require('../util/clazz');
var env = require('zrender/lib/core/env');
function Model(option, parentModel, ecModel) {
  this.parentModel = parentModel;
  this.ecModel = ecModel;
  this.option = option;
}
Model.prototype = {
  constructor: Model,
  init: null,
  mergeOption: function(option) {
    zrUtil.merge(this.option, option, true);
  },
  get: function(path, ignoreParent) {
    if (path == null) {
      return this.option;
    }
    return doGet(this.option, this.parsePath(path), !ignoreParent && getParent(this, path));
  },
  getShallow: function(key, ignoreParent) {
    var option = this.option;
    var val = option == null ? option : option[key];
    var parentModel = !ignoreParent && getParent(this, key);
    if (val == null && parentModel) {
      val = parentModel.getShallow(key);
    }
    return val;
  },
  getModel: function(path, parentModel) {
    var obj = path == null ? this.option : doGet(this.option, path = this.parsePath(path));
    var thisParentModel;
    parentModel = parentModel || ((thisParentModel = getParent(this, path)) && thisParentModel.getModel(path));
    return new Model(obj, parentModel, this.ecModel);
  },
  isEmpty: function() {
    return this.option == null;
  },
  restoreData: function() {},
  clone: function() {
    var Ctor = this.constructor;
    return new Ctor(zrUtil.clone(this.option));
  },
  setReadOnly: function(properties) {
    clazzUtil.setReadOnly(this, properties);
  },
  parsePath: function(path) {
    if (typeof path === 'string') {
      path = path.split('.');
    }
    return path;
  },
  customizeGetParent: function(getParentMethod) {
    clazzUtil.set(this, 'getParent', getParentMethod);
  },
  isAnimationEnabled: function() {
    if (!env.node) {
      if (this.option.animation != null) {
        return !!this.option.animation;
      } else if (this.parentModel) {
        return this.parentModel.isAnimationEnabled();
      }
    }
  }
};
function doGet(obj, pathArr, parentModel) {
  for (var i = 0; i < pathArr.length; i++) {
    if (!pathArr[i]) {
      continue;
    }
    obj = (obj && typeof obj === 'object') ? obj[pathArr[i]] : null;
    if (obj == null) {
      break;
    }
  }
  if (obj == null && parentModel) {
    obj = parentModel.get(pathArr);
  }
  return obj;
}
function getParent(model, path) {
  var getParentMethod = clazzUtil.get(model, 'getParent');
  return getParentMethod ? getParentMethod.call(model, path) : model.parentModel;
}
clazzUtil.enableClassExtend(Model);
var mixin = zrUtil.mixin;
mixin(Model, require('./mixin/lineStyle'));
mixin(Model, require('./mixin/areaStyle'));
mixin(Model, require('./mixin/textStyle'));
mixin(Model, require('./mixin/itemStyle'));
module.exports = Model;
