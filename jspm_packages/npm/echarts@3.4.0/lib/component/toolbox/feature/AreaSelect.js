/* */ 
'use strict';
var echarts = require('../../../echarts');
var featureManager = require('../featureManager');
var zrUtil = require('zrender/lib/core/util');
var SelectController = require('../../helper/SelectController');
var BoundingRect = require('zrender/lib/core/BoundingRect');
var Group = require('zrender/lib/container/Group');
var interactionMutex = require('../../helper/interactionMutex');
var visualSolution = require('../../../visual/visualSolution');
var STATE_LIST = ['original', 'inSelect', 'outOfSelect'];
var STORE_ATTR = '\0__areaSelect';
function AreaSelect(model) {
  this.model = model;
  this._controllerGroup;
  this._controller;
  this._isActive;
}
AreaSelect.defaultOption = {
  show: true,
  icon: 'M0,13.5h26.9 M13.5,26.9V0 M32.1,13.5H58V58H13.5 V32.1',
  title: '区域选择',
  inSelect: {},
  outOfSelect: {color: '#ccc'},
  connect: null
};
var proto = AreaSelect.prototype;
proto.onclick = function(ecModel, api, type) {
  var controllerGroup = this._controllerGroup;
  if (!this._controllerGroup) {
    controllerGroup = this._controllerGroup = new Group();
    api.getZr().add(controllerGroup);
  }
  this._switchActive(controllerGroup, this.model, ecModel, api);
};
proto.remove = function(ecModel, api) {
  this._disposeController();
  interactionMutex.release('globalPan', api.getZr());
};
proto.dispose = function(ecModel, api) {
  var zr = api.getZr();
  interactionMutex.release('globalPan', zr);
  this._disposeController();
  this._controllerGroup && zr.remove(this._controllerGroup);
};
proto._switchActive = function(controllerGroup, featureModel, ecModel, api) {
  var isActive = this._isActive = !this._isActive;
  var zr = api.getZr();
  interactionMutex[isActive ? 'take' : 'release']('globalPan', zr);
  featureModel.setIconStatus('areaSelect', isActive ? 'emphasis' : 'normal');
  if (isActive) {
    zr.setDefaultCursorStyle('crosshair');
    this._createController(controllerGroup, featureModel, ecModel, api);
  } else {
    zr.setDefaultCursorStyle('default');
    this._disposeController();
  }
};
proto._createController = function(controllerGroup, featureModel, ecModel, api) {
  var controller = this._controller = new SelectController('rect', api.getZr(), {
    lineWidth: 3,
    stroke: 'rgba(0,0,0,0.7)',
    fill: 'rgba(0,0,0,0.2)',
    resizeEnabled: true
  });
  controller.on('selected', zrUtil.bind(this._onSelected, this, featureModel, ecModel, api));
  controller.enable(controllerGroup, false);
};
proto._disposeController = function() {
  var controller = this._controller;
  if (controller) {
    controller.off();
    controller.dispose();
  }
};
proto._onSelected = function(featureModel, ecModel, api, selRanges, isEnd) {
  var selected = getStore(ecModel).selected || {};
  findSelectedItems(selected, this.model, selRanges, ecModel);
  api.dispatchAction({
    type: 'select',
    selected: selected
  });
};
function findSelectedItems(selected, model, selRanges, ecModel) {
  if (!selRanges.length) {
    return {};
  }
  var selRange = selRanges[0];
  var selRect = new BoundingRect(selRange[0][0], selRange[1][0], selRange[0][1] - selRange[0][0], selRange[1][1] - selRange[1][0]);
  var connect = model.option.connect;
  var broadcastSeries = [];
  if (connect === 'all') {
    ecModel.eachSeries(function(seriesModel) {
      broadcastSeries.push(seriesModel);
    });
  }
  ecModel.eachSeries(function(seriesModel, seriesIndex) {
    var data = seriesModel.getData();
    data.each(function(dataIndex) {
      var el = data.getItemGraphicEl(dataIndex);
      if (!el) {
        return;
      }
      var centerPosition = el.centerPosition;
      if (centerPosition && selRect.contain(centerPosition[0], centerPosition[1])) {
        save(seriesModel, dataIndex, 1);
        zrUtil.each(broadcastSeries, function(serModel) {
          serModel !== seriesModel && save(seriesModel, dataIndex, 1);
        });
      } else {
        save(seriesModel, dataIndex, 0);
      }
    });
  });
  function getIndices(seriesModel) {
    return selected[seriesModel.id] || (selected[seriesModel.id] = []);
  }
  function save(seriesModel, dataIndex, isSel) {
    getIndices(seriesModel)[dataIndex] = isSel;
  }
}
function getStore(ecModel) {
  return ecModel[STORE_ATTR] || (ecModel[STORE_ATTR] = {});
}
featureManager.register('areaSelect', AreaSelect);
echarts.registerAction({
  type: 'select',
  event: 'select',
  update: 'updateView'
}, function(payload, ecModel) {
  getStore(ecModel).selected = payload.selected;
});
echarts.registerVisual(echarts.PRIORITY.VISUAL.COMPONENT + 10, function(ecModel) {
  var toolboxModel = ecModel.getComponent('toolbox');
  if (!toolboxModel) {
    return;
  }
  var visualMappings = toolboxModel.__visualMappings;
  if (!visualMappings) {
    var option = (toolboxModel.option.feature || {}).areaSelect || {};
    visualMappings = visualSolution.createVisualMappings(option, STATE_LIST, function(mappingOption) {
      mappingOption.mappingMethod = 'fixed';
    });
    toolboxModel.__visualMappings = visualMappings;
  }
  var selected = getStore(ecModel).selected;
  var notEmpty;
  for (var id in selected) {
    notEmpty = true;
  }
  ecModel.eachSeries(function(seriesModel) {
    var data = seriesModel.getData();
    visualSolution.applyVisual(STATE_LIST, visualMappings, data, !notEmpty ? returnOriginal : getValueState);
    function getValueState(dataIndex) {
      var dataIndices = selected[seriesModel.id];
      return (dataIndices && dataIndices[dataIndex]) ? 'inSelect' : 'outOfSelect';
    }
    function returnOriginal() {
      return 'original';
    }
  });
});
module.exports = AreaSelect;
