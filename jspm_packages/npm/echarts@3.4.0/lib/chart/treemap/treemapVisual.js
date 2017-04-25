/* */ 
var VisualMapping = require('../../visual/VisualMapping');
var zrColor = require('zrender/lib/tool/color');
var zrUtil = require('zrender/lib/core/util');
var isArray = zrUtil.isArray;
var ITEM_STYLE_NORMAL = 'itemStyle.normal';
module.exports = function(ecModel, api, payload) {
  var condition = {
    mainType: 'series',
    subType: 'treemap',
    query: payload
  };
  ecModel.eachComponent(condition, function(seriesModel) {
    var tree = seriesModel.getData().tree;
    var root = tree.root;
    var seriesItemStyleModel = seriesModel.getModel(ITEM_STYLE_NORMAL);
    if (root.isRemoved()) {
      return;
    }
    var levelItemStyles = zrUtil.map(tree.levelModels, function(levelModel) {
      return levelModel ? levelModel.get(ITEM_STYLE_NORMAL) : null;
    });
    travelTree(root, {}, levelItemStyles, seriesItemStyleModel, seriesModel.getViewRoot().getAncestors(), seriesModel);
  });
};
function travelTree(node, designatedVisual, levelItemStyles, seriesItemStyleModel, viewRootAncestors, seriesModel) {
  var nodeModel = node.getModel();
  var nodeLayout = node.getLayout();
  if (!nodeLayout || nodeLayout.invisible || !nodeLayout.isInView) {
    return;
  }
  var nodeItemStyleModel = node.getModel(ITEM_STYLE_NORMAL);
  var levelItemStyle = levelItemStyles[node.depth];
  var visuals = buildVisuals(nodeItemStyleModel, designatedVisual, levelItemStyle, seriesItemStyleModel);
  var borderColor = nodeItemStyleModel.get('borderColor');
  var borderColorSaturation = nodeItemStyleModel.get('borderColorSaturation');
  var thisNodeColor;
  if (borderColorSaturation != null) {
    thisNodeColor = calculateColor(visuals, node);
    borderColor = calculateBorderColor(borderColorSaturation, thisNodeColor);
  }
  node.setVisual('borderColor', borderColor);
  var viewChildren = node.viewChildren;
  if (!viewChildren || !viewChildren.length) {
    thisNodeColor = calculateColor(visuals, node);
    node.setVisual('color', thisNodeColor);
  } else {
    var mapping = buildVisualMapping(node, nodeModel, nodeLayout, nodeItemStyleModel, visuals, viewChildren);
    zrUtil.each(viewChildren, function(child, index) {
      if (child.depth >= viewRootAncestors.length || child === viewRootAncestors[child.depth]) {
        var childVisual = mapVisual(nodeModel, visuals, child, index, mapping, seriesModel);
        travelTree(child, childVisual, levelItemStyles, seriesItemStyleModel, viewRootAncestors, seriesModel);
      }
    });
  }
}
function buildVisuals(nodeItemStyleModel, designatedVisual, levelItemStyle, seriesItemStyleModel) {
  var visuals = zrUtil.extend({}, designatedVisual);
  zrUtil.each(['color', 'colorAlpha', 'colorSaturation'], function(visualName) {
    var val = nodeItemStyleModel.get(visualName, true);
    val == null && levelItemStyle && (val = levelItemStyle[visualName]);
    val == null && (val = designatedVisual[visualName]);
    val == null && (val = seriesItemStyleModel.get(visualName));
    val != null && (visuals[visualName] = val);
  });
  return visuals;
}
function calculateColor(visuals) {
  var color = getValueVisualDefine(visuals, 'color');
  if (color) {
    var colorAlpha = getValueVisualDefine(visuals, 'colorAlpha');
    var colorSaturation = getValueVisualDefine(visuals, 'colorSaturation');
    if (colorSaturation) {
      color = zrColor.modifyHSL(color, null, null, colorSaturation);
    }
    if (colorAlpha) {
      color = zrColor.modifyAlpha(color, colorAlpha);
    }
    return color;
  }
}
function calculateBorderColor(borderColorSaturation, thisNodeColor) {
  return thisNodeColor != null ? zrColor.modifyHSL(thisNodeColor, null, null, borderColorSaturation) : null;
}
function getValueVisualDefine(visuals, name) {
  var value = visuals[name];
  if (value != null && value !== 'none') {
    return value;
  }
}
function buildVisualMapping(node, nodeModel, nodeLayout, nodeItemStyleModel, visuals, viewChildren) {
  if (!viewChildren || !viewChildren.length) {
    return;
  }
  var rangeVisual = getRangeVisual(nodeModel, 'color') || (visuals.color != null && visuals.color !== 'none' && (getRangeVisual(nodeModel, 'colorAlpha') || getRangeVisual(nodeModel, 'colorSaturation')));
  if (!rangeVisual) {
    return;
  }
  var visualMin = nodeModel.get('visualMin');
  var visualMax = nodeModel.get('visualMax');
  var dataExtent = nodeLayout.dataExtent.slice();
  visualMin != null && visualMin < dataExtent[0] && (dataExtent[0] = visualMin);
  visualMax != null && visualMax > dataExtent[1] && (dataExtent[1] = visualMax);
  var colorMappingBy = nodeModel.get('colorMappingBy');
  var opt = {
    type: rangeVisual.name,
    dataExtent: dataExtent,
    visual: rangeVisual.range
  };
  if (opt.type === 'color' && (colorMappingBy === 'index' || colorMappingBy === 'id')) {
    opt.mappingMethod = 'category';
    opt.loop = true;
  } else {
    opt.mappingMethod = 'linear';
  }
  var mapping = new VisualMapping(opt);
  mapping.__drColorMappingBy = colorMappingBy;
  return mapping;
}
function getRangeVisual(nodeModel, name) {
  var range = nodeModel.get(name);
  return (isArray(range) && range.length) ? {
    name: name,
    range: range
  } : null;
}
function mapVisual(nodeModel, visuals, child, index, mapping, seriesModel) {
  var childVisuals = zrUtil.extend({}, visuals);
  if (mapping) {
    var mappingType = mapping.type;
    var colorMappingBy = mappingType === 'color' && mapping.__drColorMappingBy;
    var value = colorMappingBy === 'index' ? index : colorMappingBy === 'id' ? seriesModel.mapIdToIndex(child.getId()) : child.getValue(nodeModel.get('visualDimension'));
    childVisuals[mappingType] = mapping.mapValueToVisual(value);
  }
  return childVisuals;
}
