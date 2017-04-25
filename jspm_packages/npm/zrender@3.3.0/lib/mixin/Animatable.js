/* */ 
'use strict';
var Animator = require('../animation/Animator');
var util = require('../core/util');
var isString = util.isString;
var isFunction = util.isFunction;
var isObject = util.isObject;
var log = require('../core/log');
var Animatable = function() {
  this.animators = [];
};
Animatable.prototype = {
  constructor: Animatable,
  animate: function(path, loop) {
    var target;
    var animatingShape = false;
    var el = this;
    var zr = this.__zr;
    if (path) {
      var pathSplitted = path.split('.');
      var prop = el;
      animatingShape = pathSplitted[0] === 'shape';
      for (var i = 0,
          l = pathSplitted.length; i < l; i++) {
        if (!prop) {
          continue;
        }
        prop = prop[pathSplitted[i]];
      }
      if (prop) {
        target = prop;
      }
    } else {
      target = el;
    }
    if (!target) {
      log('Property "' + path + '" is not existed in element ' + el.id);
      return;
    }
    var animators = el.animators;
    var animator = new Animator(target, loop);
    animator.during(function(target) {
      el.dirty(animatingShape);
    }).done(function() {
      animators.splice(util.indexOf(animators, animator), 1);
    });
    animators.push(animator);
    if (zr) {
      zr.animation.addAnimator(animator);
    }
    return animator;
  },
  stopAnimation: function(forwardToLast) {
    var animators = this.animators;
    var len = animators.length;
    for (var i = 0; i < len; i++) {
      animators[i].stop(forwardToLast);
    }
    animators.length = 0;
    return this;
  },
  animateTo: function(target, time, delay, easing, callback) {
    if (isString(delay)) {
      callback = easing;
      easing = delay;
      delay = 0;
    } else if (isFunction(easing)) {
      callback = easing;
      easing = 'linear';
      delay = 0;
    } else if (isFunction(delay)) {
      callback = delay;
      delay = 0;
    } else if (isFunction(time)) {
      callback = time;
      time = 500;
    } else if (!time) {
      time = 500;
    }
    this.stopAnimation();
    this._animateToShallow('', this, target, time, delay, easing, callback);
    var animators = this.animators.slice();
    var count = animators.length;
    function done() {
      count--;
      if (!count) {
        callback && callback();
      }
    }
    if (!count) {
      callback && callback();
    }
    for (var i = 0; i < animators.length; i++) {
      animators[i].done(done).start(easing);
    }
  },
  _animateToShallow: function(path, source, target, time, delay) {
    var objShallow = {};
    var propertyCount = 0;
    for (var name in target) {
      if (!target.hasOwnProperty(name)) {
        continue;
      }
      if (source[name] != null) {
        if (isObject(target[name]) && !util.isArrayLike(target[name])) {
          this._animateToShallow(path ? path + '.' + name : name, source[name], target[name], time, delay);
        } else {
          objShallow[name] = target[name];
          propertyCount++;
        }
      } else if (target[name] != null) {
        if (!path) {
          this.attr(name, target[name]);
        } else {
          var props = {};
          props[path] = {};
          props[path][name] = target[name];
          this.attr(props);
        }
      }
    }
    if (propertyCount > 0) {
      this.animate(path, false).when(time == null ? 500 : time, objShallow).delay(delay || 0);
    }
    return this;
  }
};
module.exports = Animatable;
