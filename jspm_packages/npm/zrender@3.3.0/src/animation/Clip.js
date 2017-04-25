/* */ 
"format cjs";
define(function(require) {
  var easingFuncs = require('./easing');
  function Clip(options) {
    this._target = options.target;
    this._life = options.life || 1000;
    this._delay = options.delay || 0;
    this._initialized = false;
    this.loop = options.loop == null ? false : options.loop;
    this.gap = options.gap || 0;
    this.easing = options.easing || 'Linear';
    this.onframe = options.onframe;
    this.ondestroy = options.ondestroy;
    this.onrestart = options.onrestart;
  }
  Clip.prototype = {
    constructor: Clip,
    step: function(globalTime) {
      if (!this._initialized) {
        this._startTime = globalTime + this._delay;
        this._initialized = true;
      }
      var percent = (globalTime - this._startTime) / this._life;
      if (percent < 0) {
        return;
      }
      percent = Math.min(percent, 1);
      var easing = this.easing;
      var easingFunc = typeof easing == 'string' ? easingFuncs[easing] : easing;
      var schedule = typeof easingFunc === 'function' ? easingFunc(percent) : percent;
      this.fire('frame', schedule);
      if (percent == 1) {
        if (this.loop) {
          this.restart(globalTime);
          return 'restart';
        }
        this._needsRemove = true;
        return 'destroy';
      }
      return null;
    },
    restart: function(globalTime) {
      var remainder = (globalTime - this._startTime) % this._life;
      this._startTime = globalTime - remainder + this.gap;
      this._needsRemove = false;
    },
    fire: function(eventType, arg) {
      eventType = 'on' + eventType;
      if (this[eventType]) {
        this[eventType](this._target, arg);
      }
    }
  };
  return Clip;
});
