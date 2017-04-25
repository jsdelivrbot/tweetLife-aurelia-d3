/* */ 
var zrUtil = require('zrender/lib/core/util');
var numberUtil = require('../../util/number');
var layout = require('../../util/layout');
var helper = require('./helper');
var BoundingRect = require('zrender/lib/core/BoundingRect');
var helper = require('./helper');
var mathMax = Math.max;
var mathMin = Math.min;
var parsePercent = numberUtil.parsePercent;
var retrieveValue = zrUtil.retrieve;
var each = zrUtil.each;
function update(ecModel, api, payload) {
  var condition = {
    mainType: 'series',
    subType: 'treemap',
    query: payload
  };
  ecModel.eachComponent(condition, function(seriesModel) {
    var ecWidth = api.getWidth();
    var ecHeight = api.getHeight();
    var seriesOption = seriesModel.option;
    var layoutInfo = layout.getLayoutRect(seriesModel.getBoxLayoutParams(), {
      width: api.getWidth(),
      height: api.getHeight()
    });
    var size = seriesOption.size || [];
    var containerWidth = parsePercent(retrieveValue(layoutInfo.width, size[0]), ecWidth);
    var containerHeight = parsePercent(retrieveValue(layoutInfo.height, size[1]), ecHeight);
    var payloadType = payload && payload.type;
    var targetInfo = helper.retrieveTargetInfo(payload, seriesModel);
    var rootRect = (payloadType === 'treemapRender' || payloadType === 'treemapMove') ? payload.rootRect : null;
    var viewRoot = seriesModel.getViewRoot();
    var viewAbovePath = helper.getPathToRoot(viewRoot);
    if (payloadType !== 'treemapMove') {
      var rootSize = payloadType === 'treemapZoomToNode' ? estimateRootSize(seriesModel, targetInfo, viewRoot, containerWidth, containerHeight) : rootRect ? [rootRect.width, rootRect.height] : [containerWidth, containerHeight];
      var sort = seriesOption.sort;
      if (sort && sort !== 'asc' && sort !== 'desc') {
        sort = 'desc';
      }
      var options = {
        squareRatio: seriesOption.squareRatio,
        sort: sort,
        leafDepth: seriesOption.leafDepth
      };
      viewRoot.hostTree.clearLayouts();
      var viewRootLayout = {
        x: 0,
        y: 0,
        width: rootSize[0],
        height: rootSize[1],
        area: rootSize[0] * rootSize[1]
      };
      viewRoot.setLayout(viewRootLayout);
      squarify(viewRoot, options, false, 0);
      var viewRootLayout = viewRoot.getLayout();
      each(viewAbovePath, function(node, index) {
        var childValue = (viewAbovePath[index + 1] || viewRoot).getValue();
        node.setLayout(zrUtil.extend({
          dataExtent: [childValue, childValue],
          borderWidth: 0
        }, viewRootLayout));
      });
    }
    var treeRoot = seriesModel.getData().tree.root;
    treeRoot.setLayout(calculateRootPosition(layoutInfo, rootRect, targetInfo), true);
    seriesModel.setLayoutInfo(layoutInfo);
    prunning(treeRoot, new BoundingRect(-layoutInfo.x, -layoutInfo.y, ecWidth, ecHeight), viewAbovePath, viewRoot, 0);
  });
}
function squarify(node, options, hideChildren, depth) {
  var width;
  var height;
  if (node.isRemoved()) {
    return;
  }
  var thisLayout = node.getLayout();
  width = thisLayout.width;
  height = thisLayout.height;
  var itemStyleModel = node.getModel('itemStyle.normal');
  var borderWidth = itemStyleModel.get('borderWidth');
  var halfGapWidth = itemStyleModel.get('gapWidth') / 2;
  var layoutOffset = borderWidth - halfGapWidth;
  var nodeModel = node.getModel();
  node.setLayout({borderWidth: borderWidth}, true);
  width = mathMax(width - 2 * layoutOffset, 0);
  height = mathMax(height - 2 * layoutOffset, 0);
  var totalArea = width * height;
  var viewChildren = initChildren(node, nodeModel, totalArea, options, hideChildren, depth);
  if (!viewChildren.length) {
    return;
  }
  var rect = {
    x: layoutOffset,
    y: layoutOffset,
    width: width,
    height: height
  };
  var rowFixedLength = mathMin(width, height);
  var best = Infinity;
  var row = [];
  row.area = 0;
  for (var i = 0,
      len = viewChildren.length; i < len; ) {
    var child = viewChildren[i];
    row.push(child);
    row.area += child.getLayout().area;
    var score = worst(row, rowFixedLength, options.squareRatio);
    if (score <= best) {
      i++;
      best = score;
    } else {
      row.area -= row.pop().getLayout().area;
      position(row, rowFixedLength, rect, halfGapWidth, false);
      rowFixedLength = mathMin(rect.width, rect.height);
      row.length = row.area = 0;
      best = Infinity;
    }
  }
  if (row.length) {
    position(row, rowFixedLength, rect, halfGapWidth, true);
  }
  if (!hideChildren) {
    var childrenVisibleMin = nodeModel.get('childrenVisibleMin');
    if (childrenVisibleMin != null && totalArea < childrenVisibleMin) {
      hideChildren = true;
    }
  }
  for (var i = 0,
      len = viewChildren.length; i < len; i++) {
    squarify(viewChildren[i], options, hideChildren, depth + 1);
  }
}
function initChildren(node, nodeModel, totalArea, options, hideChildren, depth) {
  var viewChildren = node.children || [];
  var orderBy = options.sort;
  orderBy !== 'asc' && orderBy !== 'desc' && (orderBy = null);
  var overLeafDepth = options.leafDepth != null && options.leafDepth <= depth;
  if (hideChildren && !overLeafDepth) {
    return (node.viewChildren = []);
  }
  viewChildren = zrUtil.filter(viewChildren, function(child) {
    return !child.isRemoved();
  });
  sort(viewChildren, orderBy);
  var info = statistic(nodeModel, viewChildren, orderBy);
  if (info.sum === 0) {
    return (node.viewChildren = []);
  }
  info.sum = filterByThreshold(nodeModel, totalArea, info.sum, orderBy, viewChildren);
  if (info.sum === 0) {
    return (node.viewChildren = []);
  }
  for (var i = 0,
      len = viewChildren.length; i < len; i++) {
    var area = viewChildren[i].getValue() / info.sum * totalArea;
    viewChildren[i].setLayout({area: area});
  }
  if (overLeafDepth) {
    viewChildren.length && node.setLayout({isLeafRoot: true}, true);
    viewChildren.length = 0;
  }
  node.viewChildren = viewChildren;
  node.setLayout({dataExtent: info.dataExtent}, true);
  return viewChildren;
}
function filterByThreshold(nodeModel, totalArea, sum, orderBy, orderedChildren) {
  if (!orderBy) {
    return sum;
  }
  var visibleMin = nodeModel.get('visibleMin');
  var len = orderedChildren.length;
  var deletePoint = len;
  for (var i = len - 1; i >= 0; i--) {
    var value = orderedChildren[orderBy === 'asc' ? len - i - 1 : i].getValue();
    if (value / sum * totalArea < visibleMin) {
      deletePoint = i;
      sum -= value;
    }
  }
  orderBy === 'asc' ? orderedChildren.splice(0, len - deletePoint) : orderedChildren.splice(deletePoint, len - deletePoint);
  return sum;
}
function sort(viewChildren, orderBy) {
  if (orderBy) {
    viewChildren.sort(function(a, b) {
      return orderBy === 'asc' ? a.getValue() - b.getValue() : b.getValue() - a.getValue();
    });
  }
  return viewChildren;
}
function statistic(nodeModel, children, orderBy) {
  var sum = 0;
  for (var i = 0,
      len = children.length; i < len; i++) {
    sum += children[i].getValue();
  }
  var dimension = nodeModel.get('visualDimension');
  var dataExtent;
  if (!children || !children.length) {
    dataExtent = [NaN, NaN];
  } else if (dimension === 'value' && orderBy) {
    dataExtent = [children[children.length - 1].getValue(), children[0].getValue()];
    orderBy === 'asc' && dataExtent.reverse();
  } else {
    var dataExtent = [Infinity, -Infinity];
    each(children, function(child) {
      var value = child.getValue(dimension);
      value < dataExtent[0] && (dataExtent[0] = value);
      value > dataExtent[1] && (dataExtent[1] = value);
    });
  }
  return {
    sum: sum,
    dataExtent: dataExtent
  };
}
function worst(row, rowFixedLength, ratio) {
  var areaMax = 0;
  var areaMin = Infinity;
  for (var i = 0,
      area,
      len = row.length; i < len; i++) {
    area = row[i].getLayout().area;
    if (area) {
      area < areaMin && (areaMin = area);
      area > areaMax && (areaMax = area);
    }
  }
  var squareArea = row.area * row.area;
  var f = rowFixedLength * rowFixedLength * ratio;
  return squareArea ? mathMax((f * areaMax) / squareArea, squareArea / (f * areaMin)) : Infinity;
}
function position(row, rowFixedLength, rect, halfGapWidth, flush) {
  var idx0WhenH = rowFixedLength === rect.width ? 0 : 1;
  var idx1WhenH = 1 - idx0WhenH;
  var xy = ['x', 'y'];
  var wh = ['width', 'height'];
  var last = rect[xy[idx0WhenH]];
  var rowOtherLength = rowFixedLength ? row.area / rowFixedLength : 0;
  if (flush || rowOtherLength > rect[wh[idx1WhenH]]) {
    rowOtherLength = rect[wh[idx1WhenH]];
  }
  for (var i = 0,
      rowLen = row.length; i < rowLen; i++) {
    var node = row[i];
    var nodeLayout = {};
    var step = rowOtherLength ? node.getLayout().area / rowOtherLength : 0;
    var wh1 = nodeLayout[wh[idx1WhenH]] = mathMax(rowOtherLength - 2 * halfGapWidth, 0);
    var remain = rect[xy[idx0WhenH]] + rect[wh[idx0WhenH]] - last;
    var modWH = (i === rowLen - 1 || remain < step) ? remain : step;
    var wh0 = nodeLayout[wh[idx0WhenH]] = mathMax(modWH - 2 * halfGapWidth, 0);
    nodeLayout[xy[idx1WhenH]] = rect[xy[idx1WhenH]] + mathMin(halfGapWidth, wh1 / 2);
    nodeLayout[xy[idx0WhenH]] = last + mathMin(halfGapWidth, wh0 / 2);
    last += modWH;
    node.setLayout(nodeLayout, true);
  }
  rect[xy[idx1WhenH]] += rowOtherLength;
  rect[wh[idx1WhenH]] -= rowOtherLength;
}
function estimateRootSize(seriesModel, targetInfo, viewRoot, containerWidth, containerHeight) {
  var currNode = (targetInfo || {}).node;
  var defaultSize = [containerWidth, containerHeight];
  if (!currNode || currNode === viewRoot) {
    return defaultSize;
  }
  var parent;
  var viewArea = containerWidth * containerHeight;
  var area = viewArea * seriesModel.option.zoomToNodeRatio;
  while (parent = currNode.parentNode) {
    var sum = 0;
    var siblings = parent.children;
    for (var i = 0,
        len = siblings.length; i < len; i++) {
      sum += siblings[i].getValue();
    }
    var currNodeValue = currNode.getValue();
    if (currNodeValue === 0) {
      return defaultSize;
    }
    area *= sum / currNodeValue;
    var borderWidth = parent.getModel('itemStyle.normal').get('borderWidth');
    if (isFinite(borderWidth)) {
      area += 4 * borderWidth * borderWidth + 4 * borderWidth * Math.pow(area, 0.5);
    }
    area > numberUtil.MAX_SAFE_INTEGER && (area = numberUtil.MAX_SAFE_INTEGER);
    currNode = parent;
  }
  area < viewArea && (area = viewArea);
  var scale = Math.pow(area / viewArea, 0.5);
  return [containerWidth * scale, containerHeight * scale];
}
function calculateRootPosition(layoutInfo, rootRect, targetInfo) {
  if (rootRect) {
    return {
      x: rootRect.x,
      y: rootRect.y
    };
  }
  var defaultPosition = {
    x: 0,
    y: 0
  };
  if (!targetInfo) {
    return defaultPosition;
  }
  var targetNode = targetInfo.node;
  var layout = targetNode.getLayout();
  if (!layout) {
    return defaultPosition;
  }
  var targetCenter = [layout.width / 2, layout.height / 2];
  var node = targetNode;
  while (node) {
    var nodeLayout = node.getLayout();
    targetCenter[0] += nodeLayout.x;
    targetCenter[1] += nodeLayout.y;
    node = node.parentNode;
  }
  return {
    x: layoutInfo.width / 2 - targetCenter[0],
    y: layoutInfo.height / 2 - targetCenter[1]
  };
}
function prunning(node, clipRect, viewAbovePath, viewRoot, depth) {
  var nodeLayout = node.getLayout();
  var nodeInViewAbovePath = viewAbovePath[depth];
  var isAboveViewRoot = nodeInViewAbovePath && nodeInViewAbovePath === node;
  if ((nodeInViewAbovePath && !isAboveViewRoot) || (depth === viewAbovePath.length && node !== viewRoot)) {
    return;
  }
  node.setLayout({
    isInView: true,
    invisible: !isAboveViewRoot && !clipRect.intersect(nodeLayout),
    isAboveViewRoot: isAboveViewRoot
  }, true);
  var childClipRect = new BoundingRect(clipRect.x - nodeLayout.x, clipRect.y - nodeLayout.y, clipRect.width, clipRect.height);
  each(node.viewChildren || [], function(child) {
    prunning(child, childClipRect, viewAbovePath, viewRoot, depth + 1);
  });
}
module.exports = update;
