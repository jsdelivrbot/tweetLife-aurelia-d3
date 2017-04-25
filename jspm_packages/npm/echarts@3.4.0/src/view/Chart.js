/* */ 
"format cjs";
define(function(require) {
  var Group = require('zrender/container/Group');
  var componentUtil = require('../util/component');
  var clazzUtil = require('../util/clazz');
  var modelUtil = require('../util/model');
  var zrUtil = require('zrender/core/util');
  function Chart() {
    this.group = new Group();
    this.uid = componentUtil.getUID('viewChart');
  }
  Chart.prototype = {
    type: 'chart',
    init: function(ecModel, api) {},
    render: function(seriesModel, ecModel, api, payload) {},
    highlight: function(seriesModel, ecModel, api, payload) {
      toggleHighlight(seriesModel.getData(), payload, 'emphasis');
    },
    downplay: function(seriesModel, ecModel, api, payload) {
      toggleHighlight(seriesModel.getData(), payload, 'normal');
    },
    remove: function(ecModel, api) {
      this.group.removeAll();
    },
    dispose: function() {}
  };
  var chartProto = Chart.prototype;
  chartProto.updateView = chartProto.updateLayout = chartProto.updateVisual = function(seriesModel, ecModel, api, payload) {
    this.render(seriesModel, ecModel, api, payload);
  };
  function elSetState(el, state) {
    if (el) {
      el.trigger(state);
      if (el.type === 'group') {
        for (var i = 0; i < el.childCount(); i++) {
          elSetState(el.childAt(i), state);
        }
      }
    }
  }
  function toggleHighlight(data, payload, state) {
    var dataIndex = modelUtil.queryDataIndex(data, payload);
    if (dataIndex != null) {
      zrUtil.each(modelUtil.normalizeToArray(dataIndex), function(dataIdx) {
        elSetState(data.getItemGraphicEl(dataIdx), state);
      });
    } else {
      data.eachItemGraphicEl(function(el) {
        elSetState(el, state);
      });
    }
  }
  clazzUtil.enableClassExtend(Chart, ['dispose']);
  clazzUtil.enableClassManagement(Chart, {registerWhenExtend: true});
  return Chart;
});
