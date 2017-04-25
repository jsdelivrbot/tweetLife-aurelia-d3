/* */ 
'use strict';
var util = require('../core/util');
var Dispatcher = require('../core/event').Dispatcher;
var requestAnimationFrame = require('./requestAnimationFrame');
var Animator = require('./Animator');
var Animation = function(options) {
  options = options || {};
  this.stage = options.stage || {};
  this.onframe = options.onframe || function() {};
  this._clips = [];
  this._running = false;
  this._time;
  this._pausedTime;
  this._pauseStart;
  this._paused = false;
  Dispatcher.call(this);
};
Animation.prototype = {
  constructor: Animation,
  addClip: function(clip) {
    this._clips.push(clip);
  },
  addAnimator: function(animator) {
    animator.animation = this;
    var clips = animator.getClips();
    for (var i = 0; i < clips.length; i++) {
      this.addClip(clips[i]);
    }
  },
  removeClip: function(clip) {
    var idx = util.indexOf(this._clips, clip);
    if (idx >= 0) {
      this._clips.splice(idx, 1);
    }
  },
  removeAnimator: function(animator) {
    var clips = animator.getClips();
    for (var i = 0; i < clips.length; i++) {
      this.removeClip(clips[i]);
    }
    animator.animation = null;
  },
  _update: function() {
    var time = new Date().getTime() - this._pausedTime;
    var delta = time - this._time;
    var clips = this._clips;
    var len = clips.length;
    var deferredEvents = [];
    var deferredClips = [];
    for (var i = 0; i < len; i++) {
      var clip = clips[i];
      var e = clip.step(time);
      if (e) {
        deferredEvents.push(e);
        deferredClips.push(clip);
      }
    }
    for (var i = 0; i < len; ) {
      if (clips[i]._needsRemove) {
        clips[i] = clips[len - 1];
        clips.pop();
        len--;
      } else {
        i++;
      }
    }
    len = deferredEvents.length;
    for (var i = 0; i < len; i++) {
      deferredClips[i].fire(deferredEvents[i]);
    }
    this._time = time;
    this.onframe(delta);
    this.trigger('frame', delta);
    if (this.stage.update) {
      this.stage.update();
    }
  },
  _startLoop: function() {
    var self = this;
    this._running = true;
    function step() {
      if (self._running) {
        requestAnimationFrame(step);
        !self._paused && self._update();
      }
    }
    requestAnimationFrame(step);
  },
  start: function() {
    this._time = new Date().getTime();
    this._pausedTime = 0;
    this._startLoop();
  },
  stop: function() {
    this._running = false;
  },
  pause: function() {
    if (!this._paused) {
      this._pauseStart = new Date().getTime();
      this._paused = true;
    }
  },
  resume: function() {
    if (this._paused) {
      this._pausedTime += (new Date().getTime()) - this._pauseStart;
      this._paused = false;
    }
  },
  clear: function() {
    this._clips = [];
  },
  animate: function(target, options) {
    options = options || {};
    var animator = new Animator(target, options.loop, options.getter, options.setter);
    this.addAnimator(animator);
    return animator;
  }
};
util.mixin(Animation, Dispatcher);
module.exports = Animation;
