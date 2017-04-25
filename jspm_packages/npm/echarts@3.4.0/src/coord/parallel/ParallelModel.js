/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var Component = require('../../model/Component');
  require('./AxisModel');
  Component.extend({
    type: 'parallel',
    dependencies: ['parallelAxis'],
    coordinateSystem: null,
    dimensions: null,
    parallelAxisIndex: null,
    layoutMode: 'box',
    defaultOption: {
      zlevel: 0,
      z: 0,
      left: 80,
      top: 60,
      right: 80,
      bottom: 60,
      layout: 'horizontal',
      axisExpandable: false,
      axisExpandCenter: null,
      axisExpandCount: 0,
      axisExpandWidth: 50,
      parallelAxisDefault: null
    },
    init: function() {
      Component.prototype.init.apply(this, arguments);
      this.mergeOption({});
    },
    mergeOption: function(newOption) {
      var thisOption = this.option;
      newOption && zrUtil.merge(thisOption, newOption, true);
      this._initDimensions();
    },
    contains: function(model, ecModel) {
      var parallelIndex = model.get('parallelIndex');
      return parallelIndex != null && ecModel.getComponent('parallel', parallelIndex) === this;
    },
    setAxisExpand: function(opt) {
      zrUtil.each(['axisExpandable', 'axisExpandCenter', 'axisExpandCount', 'axisExpandWidth'], function(name) {
        if (opt.hasOwnProperty(name)) {
          this.option[name] = opt[name];
        }
      }, this);
    },
    _initDimensions: function() {
      var dimensions = this.dimensions = [];
      var parallelAxisIndex = this.parallelAxisIndex = [];
      var axisModels = zrUtil.filter(this.dependentModels.parallelAxis, function(axisModel) {
        return axisModel.get('parallelIndex') === this.componentIndex;
      });
      zrUtil.each(axisModels, function(axisModel) {
        dimensions.push('dim' + axisModel.get('dim'));
        parallelAxisIndex.push(axisModel.componentIndex);
      });
    }
  });
});
