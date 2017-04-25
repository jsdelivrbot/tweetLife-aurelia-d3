/* */ 
var ComponentView = require('../../view/Component');
module.exports = ComponentView.extend({
  type: 'dataZoom',
  render: function(dataZoomModel, ecModel, api, payload) {
    this.dataZoomModel = dataZoomModel;
    this.ecModel = ecModel;
    this.api = api;
  },
  getTargetCoordInfo: function() {
    var dataZoomModel = this.dataZoomModel;
    var ecModel = this.ecModel;
    var coordSysLists = {};
    dataZoomModel.eachTargetAxis(function(dimNames, axisIndex) {
      var axisModel = ecModel.getComponent(dimNames.axis, axisIndex);
      if (axisModel) {
        var coordModel = axisModel.getCoordSysModel();
        coordModel && save(coordModel, axisModel, coordSysLists[coordModel.mainType] || (coordSysLists[coordModel.mainType] = []), coordModel.componentIndex);
      }
    }, this);
    function save(coordModel, axisModel, store, coordIndex) {
      var item;
      for (var i = 0; i < store.length; i++) {
        if (store[i].model === coordModel) {
          item = store[i];
          break;
        }
      }
      if (!item) {
        store.push(item = {
          model: coordModel,
          axisModels: [],
          coordIndex: coordIndex
        });
      }
      item.axisModels.push(axisModel);
    }
    return coordSysLists;
  }
});
