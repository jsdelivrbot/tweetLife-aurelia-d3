/* */ 
module.exports = require('../../echarts').extendComponentView({
  type: 'marker',
  init: function() {
    this.markerGroupMap = {};
  },
  render: function(markerModel, ecModel, api) {
    var markerGroupMap = this.markerGroupMap;
    for (var name in markerGroupMap) {
      if (markerGroupMap.hasOwnProperty(name)) {
        markerGroupMap[name].__keep = false;
      }
    }
    var markerModelKey = this.type + 'Model';
    ecModel.eachSeries(function(seriesModel) {
      var markerModel = seriesModel[markerModelKey];
      markerModel && this.renderSeries(seriesModel, markerModel, ecModel, api);
    }, this);
    for (var name in markerGroupMap) {
      if (markerGroupMap.hasOwnProperty(name) && !markerGroupMap[name].__keep) {
        this.group.remove(markerGroupMap[name].group);
      }
    }
  },
  renderSeries: function() {}
});
