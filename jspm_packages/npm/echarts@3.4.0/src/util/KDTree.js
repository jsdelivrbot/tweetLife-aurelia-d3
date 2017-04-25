/* */ 
"format cjs";
define(function(require) {
  var quickSelect = require('./quickSelect');
  function Node(axis, data) {
    this.left = null;
    this.right = null;
    this.axis = axis;
    this.data = data;
  }
  var KDTree = function(points, dimension) {
    if (!points.length) {
      return;
    }
    if (!dimension) {
      dimension = points[0].array.length;
    }
    this.dimension = dimension;
    this.root = this._buildTree(points, 0, points.length - 1, 0);
    this._stack = [];
    this._nearstNList = [];
  };
  KDTree.prototype._buildTree = function(points, left, right, axis) {
    if (right < left) {
      return null;
    }
    var medianIndex = Math.floor((left + right) / 2);
    medianIndex = quickSelect(points, left, right, medianIndex, function(a, b) {
      return a.array[axis] - b.array[axis];
    });
    var median = points[medianIndex];
    var node = new Node(axis, median);
    axis = (axis + 1) % this.dimension;
    if (right > left) {
      node.left = this._buildTree(points, left, medianIndex - 1, axis);
      node.right = this._buildTree(points, medianIndex + 1, right, axis);
    }
    return node;
  };
  KDTree.prototype.nearest = function(target, squaredDistance) {
    var curr = this.root;
    var stack = this._stack;
    var idx = 0;
    var minDist = Infinity;
    var nearestNode = null;
    if (curr.data !== target) {
      minDist = squaredDistance(curr.data, target);
      nearestNode = curr;
    }
    if (target.array[curr.axis] < curr.data.array[curr.axis]) {
      curr.right && (stack[idx++] = curr.right);
      curr.left && (stack[idx++] = curr.left);
    } else {
      curr.left && (stack[idx++] = curr.left);
      curr.right && (stack[idx++] = curr.right);
    }
    while (idx--) {
      curr = stack[idx];
      var currDist = target.array[curr.axis] - curr.data.array[curr.axis];
      var isLeft = currDist < 0;
      var needsCheckOtherSide = false;
      currDist = currDist * currDist;
      if (currDist < minDist) {
        currDist = squaredDistance(curr.data, target);
        if (currDist < minDist && curr.data !== target) {
          minDist = currDist;
          nearestNode = curr;
        }
        needsCheckOtherSide = true;
      }
      if (isLeft) {
        if (needsCheckOtherSide) {
          curr.right && (stack[idx++] = curr.right);
        }
        curr.left && (stack[idx++] = curr.left);
      } else {
        if (needsCheckOtherSide) {
          curr.left && (stack[idx++] = curr.left);
        }
        curr.right && (stack[idx++] = curr.right);
      }
    }
    return nearestNode.data;
  };
  KDTree.prototype._addNearest = function(found, dist, node) {
    var nearestNList = this._nearstNList;
    for (var i = found - 1; i > 0; i--) {
      if (dist >= nearestNList[i - 1].dist) {
        break;
      } else {
        nearestNList[i].dist = nearestNList[i - 1].dist;
        nearestNList[i].node = nearestNList[i - 1].node;
      }
    }
    nearestNList[i].dist = dist;
    nearestNList[i].node = node;
  };
  KDTree.prototype.nearestN = function(target, N, squaredDistance, output) {
    if (N <= 0) {
      output.length = 0;
      return output;
    }
    var curr = this.root;
    var stack = this._stack;
    var idx = 0;
    var nearestNList = this._nearstNList;
    for (var i = 0; i < N; i++) {
      if (!nearestNList[i]) {
        nearestNList[i] = {};
      }
      nearestNList[i].dist = 0;
      nearestNList[i].node = null;
    }
    var currDist = squaredDistance(curr.data, target);
    var found = 0;
    if (curr.data !== target) {
      found++;
      this._addNearest(found, currDist, curr);
    }
    if (target.array[curr.axis] < curr.data.array[curr.axis]) {
      curr.right && (stack[idx++] = curr.right);
      curr.left && (stack[idx++] = curr.left);
    } else {
      curr.left && (stack[idx++] = curr.left);
      curr.right && (stack[idx++] = curr.right);
    }
    while (idx--) {
      curr = stack[idx];
      var currDist = target.array[curr.axis] - curr.data.array[curr.axis];
      var isLeft = currDist < 0;
      var needsCheckOtherSide = false;
      currDist = currDist * currDist;
      if (found < N || currDist < nearestNList[found - 1].dist) {
        currDist = squaredDistance(curr.data, target);
        if ((found < N || currDist < nearestNList[found - 1].dist) && curr.data !== target) {
          if (found < N) {
            found++;
          }
          this._addNearest(found, currDist, curr);
        }
        needsCheckOtherSide = true;
      }
      if (isLeft) {
        if (needsCheckOtherSide) {
          curr.right && (stack[idx++] = curr.right);
        }
        curr.left && (stack[idx++] = curr.left);
      } else {
        if (needsCheckOtherSide) {
          curr.left && (stack[idx++] = curr.left);
        }
        curr.right && (stack[idx++] = curr.right);
      }
    }
    for (var i = 0; i < found; i++) {
      output[i] = nearestNList[i].node.data;
    }
    output.length = found;
    return output;
  };
  return KDTree;
});
