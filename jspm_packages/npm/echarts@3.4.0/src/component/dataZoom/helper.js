/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var formatUtil = require('../../util/format');
    var zrUtil = require('zrender/core/util');
    var helper = {};
    var AXIS_DIMS = ['x', 'y', 'z', 'radius', 'angle', 'single'];
    var COORDS = ['cartesian2d', 'polar', 'singleAxis'];
    helper.isCoordSupported = function(coordType) {
      return zrUtil.indexOf(COORDS, coordType) >= 0;
    };
    helper.createNameEach = function(names, attrs) {
      names = names.slice();
      var capitalNames = zrUtil.map(names, formatUtil.capitalFirst);
      attrs = (attrs || []).slice();
      var capitalAttrs = zrUtil.map(attrs, formatUtil.capitalFirst);
      return function(callback, context) {
        zrUtil.each(names, function(name, index) {
          var nameObj = {
            name: name,
            capital: capitalNames[index]
          };
          for (var j = 0; j < attrs.length; j++) {
            nameObj[attrs[j]] = name + capitalAttrs[j];
          }
          callback.call(context, nameObj);
        });
      };
    };
    helper.eachAxisDim = helper.createNameEach(AXIS_DIMS, ['axisIndex', 'axis', 'index', 'id']);
    helper.createLinkedNodesFinder = function(forEachNode, forEachEdgeType, edgeIdGetter) {
      return function(sourceNode) {
        var result = {
          nodes: [],
          records: {}
        };
        forEachEdgeType(function(edgeType) {
          result.records[edgeType.name] = {};
        });
        if (!sourceNode) {
          return result;
        }
        absorb(sourceNode, result);
        var existsLink;
        do {
          existsLink = false;
          forEachNode(processSingleNode);
        } while (existsLink);
        function processSingleNode(node) {
          if (!isNodeAbsorded(node, result) && isLinked(node, result)) {
            absorb(node, result);
            existsLink = true;
          }
        }
        return result;
      };
      function isNodeAbsorded(node, result) {
        return zrUtil.indexOf(result.nodes, node) >= 0;
      }
      function isLinked(node, result) {
        var hasLink = false;
        forEachEdgeType(function(edgeType) {
          zrUtil.each(edgeIdGetter(node, edgeType) || [], function(edgeId) {
            result.records[edgeType.name][edgeId] && (hasLink = true);
          });
        });
        return hasLink;
      }
      function absorb(node, result) {
        result.nodes.push(node);
        forEachEdgeType(function(edgeType) {
          zrUtil.each(edgeIdGetter(node, edgeType) || [], function(edgeId) {
            result.records[edgeType.name][edgeId] = true;
          });
        });
      }
    };
    return helper;
  });
})(require('process'));
