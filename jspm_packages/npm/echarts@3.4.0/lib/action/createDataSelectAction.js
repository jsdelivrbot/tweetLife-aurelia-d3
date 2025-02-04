/* */ 
var echarts = require('../echarts');
var zrUtil = require('zrender/lib/core/util');
module.exports = function(seriesType, actionInfos) {
  zrUtil.each(actionInfos, function(actionInfo) {
    actionInfo.update = 'updateView';
    echarts.registerAction(actionInfo, function(payload, ecModel) {
      var selected = {};
      ecModel.eachComponent({
        mainType: 'series',
        subType: seriesType,
        query: payload
      }, function(seriesModel) {
        if (seriesModel[actionInfo.method]) {
          seriesModel[actionInfo.method](payload.name);
        }
        var data = seriesModel.getData();
        data.each(function(idx) {
          var name = data.getName(idx);
          selected[name] = seriesModel.isSelected(name) || false;
        });
      });
      return {
        name: payload.name,
        selected: selected
      };
    });
  });
};
