/* */ 
var SeriesModel = require('../../model/Series');
var createGraphFromNodeEdge = require('../helper/createGraphFromNodeEdge');
var createGraphFromNodeMatrix = require('../helper/createGraphFromNodeMatrix');
var ChordSeries = SeriesModel.extend({
  type: 'series.chord',
  getInitialData: function(option) {
    var edges = option.edges || option.links;
    var nodes = option.data || option.nodes;
    var matrix = option.matrix;
    if (nodes && edges) {
      var graph = createGraphFromNodeEdge(nodes, edges, this, true);
      return graph.data;
    } else if (nodes && matrix) {
      var graph = createGraphFromNodeMatrix(nodes, matrix, this, true);
      return graph.data;
    }
  },
  getGraph: function() {
    return this.getData().graph;
  },
  getEdgeData: function() {
    return this.getGraph().edgeData;
  },
  defaultOption: {
    center: ['50%', '50%'],
    radius: ['65%', '75%'],
    sort: 'none',
    sortSub: 'none',
    padding: 0.02,
    startAngle: 90,
    clockwise: true,
    itemStyle: {
      normal: {},
      emphasis: {}
    },
    chordStyle: {
      normal: {},
      emphasis: {}
    }
  }
});
module.exports = ChordSeries;
