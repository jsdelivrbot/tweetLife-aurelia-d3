/* */ 
var SeriesModel = require('../../model/Series');
var createGraphFromNodeEdge = require('../helper/createGraphFromNodeEdge');
var encodeHTML = require('../../util/format').encodeHTML;
var SankeySeries = SeriesModel.extend({
  type: 'series.sankey',
  layoutInfo: null,
  getInitialData: function(option) {
    var links = option.edges || option.links;
    var nodes = option.data || option.nodes;
    if (nodes && links) {
      var graph = createGraphFromNodeEdge(nodes, links, this, true);
      return graph.data;
    }
  },
  getGraph: function() {
    return this.getData().graph;
  },
  getEdgeData: function() {
    return this.getGraph().edgeData;
  },
  formatTooltip: function(dataIndex, multipleSeries, dataType) {
    if (dataType === 'edge') {
      var params = this.getDataParams(dataIndex, dataType);
      var rawDataOpt = params.data;
      var html = rawDataOpt.source + ' -- ' + rawDataOpt.target;
      if (params.value) {
        html += ' : ' + params.value;
      }
      return encodeHTML(html);
    }
    return SankeySeries.superCall(this, 'formatTooltip', dataIndex, multipleSeries);
  },
  defaultOption: {
    zlevel: 0,
    z: 2,
    coordinateSystem: 'view',
    layout: null,
    left: '5%',
    top: '5%',
    right: '20%',
    bottom: '5%',
    nodeWidth: 20,
    nodeGap: 8,
    layoutIterations: 32,
    label: {
      normal: {
        show: true,
        position: 'right',
        textStyle: {
          color: '#000',
          fontSize: 12
        }
      },
      emphasis: {show: true}
    },
    itemStyle: {normal: {
        borderWidth: 1,
        borderColor: '#333'
      }},
    lineStyle: {
      normal: {
        color: '#314656',
        opacity: 0.2,
        curveness: 0.5
      },
      emphasis: {opacity: 0.6}
    },
    animationEasing: 'linear',
    animationDuration: 1000
  }
});
module.exports = SankeySeries;
