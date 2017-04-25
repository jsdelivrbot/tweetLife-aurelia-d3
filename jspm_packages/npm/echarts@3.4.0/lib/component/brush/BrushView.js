/* */ 
var zrUtil = require('zrender/lib/core/util');
var BrushController = require('../helper/BrushController');
var echarts = require('../../echarts');
var brushHelper = require('../helper/brushHelper');
module.exports = echarts.extendComponentView({
  type: 'brush',
  init: function(ecModel, api) {
    this.ecModel = ecModel;
    this.api = api;
    this.model;
    (this._brushController = new BrushController(api.getZr())).on('brush', zrUtil.bind(this._onBrush, this)).mount();
  },
  render: function(brushModel) {
    this.model = brushModel;
    return updateController.apply(this, arguments);
  },
  updateView: updateController,
  updateLayout: updateController,
  updateVisual: updateController,
  dispose: function() {
    this._brushController.dispose();
  },
  _onBrush: function(areas, opt) {
    var modelId = this.model.id;
    brushHelper.parseOutputRanges(areas, this.model.coordInfoList, this.ecModel);
    (!opt.isEnd || opt.removeOnClick) && this.api.dispatchAction({
      type: 'brush',
      brushId: modelId,
      areas: zrUtil.clone(areas),
      $from: modelId
    });
  }
});
function updateController(brushModel, ecModel, api, payload) {
  (!payload || payload.$from !== brushModel.id) && this._brushController.setPanels(brushHelper.makePanelOpts(brushModel.coordInfoList)).enableBrush(brushModel.brushOption).updateCovers(brushModel.areas.slice());
}
