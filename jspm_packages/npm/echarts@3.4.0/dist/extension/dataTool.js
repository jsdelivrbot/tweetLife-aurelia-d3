/* */ 
"format cjs";
(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory(require('../../index'));
  else if (typeof define === 'function' && define.amd)
    define(["echarts"], factory);
  else if (typeof exports === 'object')
    exports["dataTool"] = factory(require('../../index'));
  else
    root["echarts"] = root["echarts"] || {}, root["echarts"]["dataTool"] = factory(root["echarts"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
  return (function(modules) {
    var installedModules = {};
    function __webpack_require__(moduleId) {
      if (installedModules[moduleId])
        return installedModules[moduleId].exports;
      var module = installedModules[moduleId] = {
        exports: {},
        id: moduleId,
        loaded: false
      };
      modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
      module.loaded = true;
      return module.exports;
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.p = "";
    return __webpack_require__(0);
  })([function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_RESULT__;
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
      var echarts = __webpack_require__(1);
      echarts.dataTool = {
        version: '1.0.0',
        gexf: __webpack_require__(5),
        prepareBoxplotData: __webpack_require__(6)
      };
      return echarts.dataTool;
    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }, function(module, exports) {
    module.exports = __WEBPACK_EXTERNAL_MODULE_1__;
  }, , , , function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_RESULT__;
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
      'use strict';
      var zrUtil = __webpack_require__(1).util;
      function parse(xml) {
        var doc;
        if (typeof xml === 'string') {
          var parser = new DOMParser();
          doc = parser.parseFromString(xml, 'text/xml');
        } else {
          doc = xml;
        }
        if (!doc || doc.getElementsByTagName('parsererror').length) {
          return null;
        }
        var gexfRoot = getChildByTagName(doc, 'gexf');
        if (!gexfRoot) {
          return null;
        }
        var graphRoot = getChildByTagName(gexfRoot, 'graph');
        var attributes = parseAttributes(getChildByTagName(graphRoot, 'attributes'));
        var attributesMap = {};
        for (var i = 0; i < attributes.length; i++) {
          attributesMap[attributes[i].id] = attributes[i];
        }
        return {
          nodes: parseNodes(getChildByTagName(graphRoot, 'nodes'), attributesMap),
          links: parseEdges(getChildByTagName(graphRoot, 'edges'))
        };
      }
      function parseAttributes(parent) {
        return parent ? zrUtil.map(getChildrenByTagName(parent, 'attribute'), function(attribDom) {
          return {
            id: getAttr(attribDom, 'id'),
            title: getAttr(attribDom, 'title'),
            type: getAttr(attribDom, 'type')
          };
        }) : [];
      }
      function parseNodes(parent, attributesMap) {
        return parent ? zrUtil.map(getChildrenByTagName(parent, 'node'), function(nodeDom) {
          var id = getAttr(nodeDom, 'id');
          var label = getAttr(nodeDom, 'label');
          var node = {
            id: id,
            name: label,
            itemStyle: {normal: {}}
          };
          var vizSizeDom = getChildByTagName(nodeDom, 'viz:size');
          var vizPosDom = getChildByTagName(nodeDom, 'viz:position');
          var vizColorDom = getChildByTagName(nodeDom, 'viz:color');
          var attvaluesDom = getChildByTagName(nodeDom, 'attvalues');
          if (vizSizeDom) {
            node.symbolSize = parseFloat(getAttr(vizSizeDom, 'value'));
          }
          if (vizPosDom) {
            node.x = parseFloat(getAttr(vizPosDom, 'x'));
            node.y = parseFloat(getAttr(vizPosDom, 'y'));
          }
          if (vizColorDom) {
            node.itemStyle.normal.color = 'rgb(' + [getAttr(vizColorDom, 'r') | 0, getAttr(vizColorDom, 'g') | 0, getAttr(vizColorDom, 'b') | 0].join(',') + ')';
          }
          if (attvaluesDom) {
            var attvalueDomList = getChildrenByTagName(attvaluesDom, 'attvalue');
            node.attributes = {};
            for (var j = 0; j < attvalueDomList.length; j++) {
              var attvalueDom = attvalueDomList[j];
              var attId = getAttr(attvalueDom, 'for');
              var attValue = getAttr(attvalueDom, 'value');
              var attribute = attributesMap[attId];
              if (attribute) {
                switch (attribute.type) {
                  case 'integer':
                  case 'long':
                    attValue = parseInt(attValue, 10);
                    break;
                  case 'float':
                  case 'double':
                    attValue = parseFloat(attValue);
                    break;
                  case 'boolean':
                    attValue = attValue.toLowerCase() == 'true';
                    break;
                  default:
                }
                node.attributes[attId] = attValue;
              }
            }
          }
          return node;
        }) : [];
      }
      function parseEdges(parent) {
        return parent ? zrUtil.map(getChildrenByTagName(parent, 'edge'), function(edgeDom) {
          var id = getAttr(edgeDom, 'id');
          var label = getAttr(edgeDom, 'label');
          var sourceId = getAttr(edgeDom, 'source');
          var targetId = getAttr(edgeDom, 'target');
          var edge = {
            id: id,
            name: label,
            source: sourceId,
            target: targetId,
            lineStyle: {normal: {}}
          };
          var lineStyle = edge.lineStyle.normal;
          var vizThicknessDom = getChildByTagName(edgeDom, 'viz:thickness');
          var vizColorDom = getChildByTagName(edgeDom, 'viz:color');
          if (vizThicknessDom) {
            lineStyle.width = parseFloat(vizThicknessDom.getAttribute('value'));
          }
          if (vizColorDom) {
            lineStyle.color = 'rgb(' + [getAttr(vizColorDom, 'r') | 0, getAttr(vizColorDom, 'g') | 0, getAttr(vizColorDom, 'b') | 0].join(',') + ')';
          }
          return edge;
        }) : [];
      }
      function getAttr(el, attrName) {
        return el.getAttribute(attrName);
      }
      function getChildByTagName(parent, tagName) {
        var node = parent.firstChild;
        while (node) {
          if (node.nodeType != 1 || node.nodeName.toLowerCase() != tagName.toLowerCase()) {
            node = node.nextSibling;
          } else {
            return node;
          }
        }
        return null;
      }
      function getChildrenByTagName(parent, tagName) {
        var node = parent.firstChild;
        var children = [];
        while (node) {
          if (node.nodeName.toLowerCase() == tagName.toLowerCase()) {
            children.push(node);
          }
          node = node.nextSibling;
        }
        return children;
      }
      return {parse: parse};
    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }, function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_RESULT__;
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
      var quantile = __webpack_require__(7);
      var numberUtil = __webpack_require__(1).number;
      return function(rawData, opt) {
        opt = opt || [];
        var boxData = [];
        var outliers = [];
        var axisData = [];
        var boundIQR = opt.boundIQR;
        for (var i = 0; i < rawData.length; i++) {
          axisData.push(i + '');
          var ascList = numberUtil.asc(rawData[i].slice());
          var Q1 = quantile(ascList, 0.25);
          var Q2 = quantile(ascList, 0.5);
          var Q3 = quantile(ascList, 0.75);
          var IQR = Q3 - Q1;
          var low = boundIQR === 'none' ? ascList[0] : Q1 - (boundIQR == null ? 1.5 : boundIQR) * IQR;
          var high = boundIQR === 'none' ? ascList[ascList.length - 1] : Q3 + (boundIQR == null ? 1.5 : boundIQR) * IQR;
          boxData.push([low, Q1, Q2, Q3, high]);
          for (var j = 0; j < ascList.length; j++) {
            var dataItem = ascList[j];
            if (dataItem < low || dataItem > high) {
              var outlier = [i, dataItem];
              opt.layout === 'vertical' && outlier.reverse();
              outliers.push(outlier);
            }
          }
        }
        return {
          boxData: boxData,
          outliers: outliers,
          axisData: axisData
        };
      };
    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }, function(module, exports, __webpack_require__) {
    var __WEBPACK_AMD_DEFINE_RESULT__;
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function(require) {
      return function(ascArr, p) {
        var H = (ascArr.length - 1) * p + 1,
            h = Math.floor(H),
            v = +ascArr[h - 1],
            e = H - h;
        return e ? v + e * (ascArr[h] - v) : v;
      };
    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }]);
});
;
