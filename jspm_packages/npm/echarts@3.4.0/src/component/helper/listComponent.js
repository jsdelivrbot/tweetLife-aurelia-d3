/* */ 
"format cjs";
define(function(require) {
  var layout = require('../../util/layout');
  var formatUtil = require('../../util/format');
  var graphic = require('../../util/graphic');
  function positionGroup(group, model, api) {
    layout.positionElement(group, model.getBoxLayoutParams(), {
      width: api.getWidth(),
      height: api.getHeight()
    }, model.get('padding'));
  }
  return {
    layout: function(group, componentModel, api) {
      var rect = layout.getLayoutRect(componentModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      }, componentModel.get('padding'));
      layout.box(componentModel.get('orient'), group, componentModel.get('itemGap'), rect.width, rect.height);
      positionGroup(group, componentModel, api);
    },
    addBackground: function(group, componentModel) {
      var padding = formatUtil.normalizeCssArray(componentModel.get('padding'));
      var boundingRect = group.getBoundingRect();
      var style = componentModel.getItemStyle(['color', 'opacity']);
      style.fill = componentModel.get('backgroundColor');
      var rect = new graphic.Rect({
        shape: {
          x: boundingRect.x - padding[3],
          y: boundingRect.y - padding[0],
          width: boundingRect.width + padding[1] + padding[3],
          height: boundingRect.height + padding[0] + padding[2]
        },
        style: style,
        silent: true,
        z2: -1
      });
      graphic.subPixelOptimizeRect(rect);
      group.add(rect);
    }
  };
});
