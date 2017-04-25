/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var List = require('../../data/List');
  var zrUtil = require('zrender/core/util');
  var modelUtil = require('../../util/model');
  var Model = require('../../model/Model');
  var formatUtil = require('../../util/format');
  var createGraphFromNodeEdge = require('../helper/createGraphFromNodeEdge');
  var GraphSeries = require('../../echarts').extendSeriesModel({
    type: 'series.graph',
    init: function(option) {
      GraphSeries.superApply(this, 'init', arguments);
      this.legendDataProvider = function() {
        return this._categoriesData;
      };
      this.fillDataTextStyle(option.edges || option.links);
      this._updateCategoriesData();
    },
    mergeOption: function(option) {
      GraphSeries.superApply(this, 'mergeOption', arguments);
      this.fillDataTextStyle(option.edges || option.links);
      this._updateCategoriesData();
    },
    mergeDefaultAndTheme: function(option) {
      GraphSeries.superApply(this, 'mergeDefaultAndTheme', arguments);
      modelUtil.defaultEmphasis(option.edgeLabel, modelUtil.LABEL_OPTIONS);
    },
    getInitialData: function(option, ecModel) {
      var edges = option.edges || option.links || [];
      var nodes = option.data || option.nodes || [];
      var self = this;
      if (nodes && edges) {
        return createGraphFromNodeEdge(nodes, edges, this, true, beforeLink).data;
      }
      function beforeLink(nodeData, edgeData) {
        nodeData.wrapMethod('getItemModel', function(model) {
          var categoriesModels = self._categoriesModels;
          var categoryIdx = model.getShallow('category');
          var categoryModel = categoriesModels[categoryIdx];
          if (categoryModel) {
            categoryModel.parentModel = model.parentModel;
            model.parentModel = categoryModel;
          }
          return model;
        });
        var edgeLabelModel = self.getModel('edgeLabel');
        var fakeSeriesModel = new Model({label: edgeLabelModel.option}, edgeLabelModel.parentModel, ecModel);
        edgeData.wrapMethod('getItemModel', function(model) {
          model.customizeGetParent(edgeGetParent);
          return model;
        });
        function edgeGetParent(path) {
          path = this.parsePath(path);
          return (path && path[0] === 'label') ? fakeSeriesModel : this.parentModel;
        }
      }
    },
    getGraph: function() {
      return this.getData().graph;
    },
    getEdgeData: function() {
      return this.getGraph().edgeData;
    },
    getCategoriesData: function() {
      return this._categoriesData;
    },
    formatTooltip: function(dataIndex, multipleSeries, dataType) {
      if (dataType === 'edge') {
        var nodeData = this.getData();
        var params = this.getDataParams(dataIndex, dataType);
        var edge = nodeData.graph.getEdgeByIndex(dataIndex);
        var sourceName = nodeData.getName(edge.node1.dataIndex);
        var targetName = nodeData.getName(edge.node2.dataIndex);
        var html = [];
        sourceName != null && html.push(sourceName);
        targetName != null && html.push(targetName);
        html = formatUtil.encodeHTML(html.join(' > '));
        if (params.value) {
          html += ' : ' + formatUtil.encodeHTML(params.value);
        }
        return html;
      } else {
        return GraphSeries.superApply(this, 'formatTooltip', arguments);
      }
    },
    _updateCategoriesData: function() {
      var categories = zrUtil.map(this.option.categories || [], function(category) {
        return category.value != null ? category : zrUtil.extend({value: 0}, category);
      });
      var categoriesData = new List(['value'], this);
      categoriesData.initData(categories);
      this._categoriesData = categoriesData;
      this._categoriesModels = categoriesData.mapArray(function(idx) {
        return categoriesData.getItemModel(idx, true);
      });
    },
    setZoom: function(zoom) {
      this.option.zoom = zoom;
    },
    setCenter: function(center) {
      this.option.center = center;
    },
    isAnimationEnabled: function() {
      return GraphSeries.superCall(this, 'isAnimationEnabled') && !(this.get('layout') === 'force' && this.get('force.layoutAnimation'));
    },
    defaultOption: {
      zlevel: 0,
      z: 2,
      coordinateSystem: 'view',
      legendHoverLink: true,
      hoverAnimation: true,
      layout: null,
      focusNodeAdjacency: false,
      circular: {rotateLabel: false},
      force: {
        initLayout: null,
        repulsion: [0, 50],
        gravity: 0.1,
        edgeLength: 30,
        layoutAnimation: true
      },
      left: 'center',
      top: 'center',
      symbol: 'circle',
      symbolSize: 10,
      edgeSymbol: ['none', 'none'],
      edgeSymbolSize: 10,
      edgeLabel: {
        normal: {position: 'middle'},
        emphasis: {}
      },
      draggable: false,
      roam: false,
      center: null,
      zoom: 1,
      nodeScaleRatio: 0.6,
      label: {
        normal: {
          show: false,
          formatter: '{b}'
        },
        emphasis: {show: true}
      },
      itemStyle: {
        normal: {},
        emphasis: {}
      },
      lineStyle: {
        normal: {
          color: '#aaa',
          width: 1,
          curveness: 0,
          opacity: 0.5
        },
        emphasis: {}
      }
    }
  });
  return GraphSeries;
});
