/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var graphic = require('../../util/graphic');
  var formatUtil = require('../../util/format');
  var layout = require('../../util/layout');
  var echarts = require('../../echarts');
  var VisualMapping = require('../../visual/VisualMapping');
  return echarts.extendComponentView({
    type: 'visualMap',
    autoPositionValues: {
      left: 1,
      right: 1,
      top: 1,
      bottom: 1
    },
    init: function(ecModel, api) {
      this.ecModel = ecModel;
      this.api = api;
      this.visualMapModel;
    },
    render: function(visualMapModel, ecModel, api, payload) {
      this.visualMapModel = visualMapModel;
      if (visualMapModel.get('show') === false) {
        this.group.removeAll();
        return;
      }
      this.doRender.apply(this, arguments);
    },
    renderBackground: function(group) {
      var visualMapModel = this.visualMapModel;
      var padding = formatUtil.normalizeCssArray(visualMapModel.get('padding') || 0);
      var rect = group.getBoundingRect();
      group.add(new graphic.Rect({
        z2: -1,
        silent: true,
        shape: {
          x: rect.x - padding[3],
          y: rect.y - padding[0],
          width: rect.width + padding[3] + padding[1],
          height: rect.height + padding[0] + padding[2]
        },
        style: {
          fill: visualMapModel.get('backgroundColor'),
          stroke: visualMapModel.get('borderColor'),
          lineWidth: visualMapModel.get('borderWidth')
        }
      }));
    },
    getControllerVisual: function(targetValue, visualCluster, opts) {
      opts = opts || {};
      var forceState = opts.forceState;
      var visualMapModel = this.visualMapModel;
      var visualObj = {};
      if (visualCluster === 'symbol') {
        visualObj.symbol = visualMapModel.get('itemSymbol');
      }
      if (visualCluster === 'color') {
        var defaultColor = visualMapModel.get('contentColor');
        visualObj.color = defaultColor;
      }
      function getter(key) {
        return visualObj[key];
      }
      function setter(key, value) {
        visualObj[key] = value;
      }
      var mappings = visualMapModel.controllerVisuals[forceState || visualMapModel.getValueState(targetValue)];
      var visualTypes = VisualMapping.prepareVisualTypes(mappings);
      zrUtil.each(visualTypes, function(type) {
        var visualMapping = mappings[type];
        if (opts.convertOpacityToAlpha && type === 'opacity') {
          type = 'colorAlpha';
          visualMapping = mappings.__alphaForOpacity;
        }
        if (VisualMapping.dependsOn(type, visualCluster)) {
          visualMapping && visualMapping.applyVisual(targetValue, getter, setter);
        }
      });
      return visualObj[visualCluster];
    },
    positionGroup: function(group) {
      var model = this.visualMapModel;
      var api = this.api;
      layout.positionElement(group, model.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
    },
    doRender: zrUtil.noop
  });
});
