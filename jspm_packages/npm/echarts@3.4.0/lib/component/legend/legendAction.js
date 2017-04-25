/* */ 
var echarts = require('../../echarts');
var zrUtil = require('zrender/lib/core/util');
function legendSelectActionHandler(methodName, payload, ecModel) {
  var selectedMap = {};
  var isToggleSelect = methodName === 'toggleSelected';
  var isSelected;
  ecModel.eachComponent('legend', function(legendModel) {
    if (isToggleSelect && isSelected != null) {
      legendModel[isSelected ? 'select' : 'unSelect'](payload.name);
    } else {
      legendModel[methodName](payload.name);
      isSelected = legendModel.isSelected(payload.name);
    }
    var legendData = legendModel.getData();
    zrUtil.each(legendData, function(model) {
      var name = model.get('name');
      if (name === '\n' || name === '') {
        return;
      }
      var isItemSelected = legendModel.isSelected(name);
      if (name in selectedMap) {
        selectedMap[name] = selectedMap[name] && isItemSelected;
      } else {
        selectedMap[name] = isItemSelected;
      }
    });
  });
  return {
    name: payload.name,
    selected: selectedMap
  };
}
echarts.registerAction('legendToggleSelect', 'legendselectchanged', zrUtil.curry(legendSelectActionHandler, 'toggleSelected'));
echarts.registerAction('legendSelect', 'legendselected', zrUtil.curry(legendSelectActionHandler, 'select'));
echarts.registerAction('legendUnSelect', 'legendunselected', zrUtil.curry(legendSelectActionHandler, 'unSelect'));
