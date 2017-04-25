/* */ 
"format cjs";
define(function(require) {
  var SeriesModel = require('../../model/Series');
  var Tree = require('../../data/Tree');
  var zrUtil = require('zrender/core/util');
  var Model = require('../../model/Model');
  var formatUtil = require('../../util/format');
  var helper = require('./helper');
  var encodeHTML = formatUtil.encodeHTML;
  var addCommas = formatUtil.addCommas;
  return SeriesModel.extend({
    type: 'series.treemap',
    layoutMode: 'box',
    dependencies: ['grid', 'polar'],
    _viewRoot: null,
    defaultOption: {
      progressive: 0,
      hoverLayerThreshold: Infinity,
      left: 'center',
      top: 'middle',
      right: null,
      bottom: null,
      width: '80%',
      height: '80%',
      sort: true,
      clipWindow: 'origin',
      squareRatio: 0.5 * (1 + Math.sqrt(5)),
      leafDepth: null,
      drillDownIcon: '▶',
      zoomToNodeRatio: 0.32 * 0.32,
      roam: true,
      nodeClick: 'zoomToNode',
      animation: true,
      animationDurationUpdate: 900,
      animationEasing: 'quinticInOut',
      breadcrumb: {
        show: true,
        height: 22,
        left: 'center',
        top: 'bottom',
        emptyItemWidth: 25,
        itemStyle: {
          normal: {
            color: 'rgba(0,0,0,0.7)',
            borderColor: 'rgba(255,255,255,0.7)',
            borderWidth: 1,
            shadowColor: 'rgba(150,150,150,1)',
            shadowBlur: 3,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            textStyle: {color: '#fff'}
          },
          emphasis: {textStyle: {}}
        }
      },
      label: {normal: {
          show: true,
          position: 'inside',
          textStyle: {
            color: '#fff',
            ellipsis: true
          }
        }},
      itemStyle: {
        normal: {
          color: null,
          colorAlpha: null,
          colorSaturation: null,
          borderWidth: 0,
          gapWidth: 0,
          borderColor: '#fff',
          borderColorSaturation: null
        },
        emphasis: {}
      },
      visualDimension: 0,
      visualMin: null,
      visualMax: null,
      color: [],
      colorAlpha: null,
      colorSaturation: null,
      colorMappingBy: 'index',
      visibleMin: 10,
      childrenVisibleMin: null,
      levels: []
    },
    getInitialData: function(option, ecModel) {
      var data = option.data || [];
      var rootName = option.name;
      rootName == null && (rootName = option.name);
      var root = {
        name: rootName,
        children: option.data
      };
      var value0 = (data[0] || {}).value;
      completeTreeValue(root, zrUtil.isArray(value0) ? value0.length : -1);
      var levels = option.levels || [];
      levels = option.levels = setDefault(levels, ecModel);
      return Tree.createTree(root, this, levels).data;
    },
    optionUpdated: function() {
      this.resetViewRoot();
    },
    formatTooltip: function(dataIndex) {
      var data = this.getData();
      var value = this.getRawValue(dataIndex);
      var formattedValue = zrUtil.isArray(value) ? addCommas(value[0]) : addCommas(value);
      var name = data.getName(dataIndex);
      return encodeHTML(name + ': ' + formattedValue);
    },
    getDataParams: function(dataIndex) {
      var params = SeriesModel.prototype.getDataParams.apply(this, arguments);
      var node = this.getData().tree.getNodeByDataIndex(dataIndex);
      params.treePathInfo = helper.wrapTreePathInfo(node, this);
      return params;
    },
    setLayoutInfo: function(layoutInfo) {
      this.layoutInfo = this.layoutInfo || {};
      zrUtil.extend(this.layoutInfo, layoutInfo);
    },
    mapIdToIndex: function(id) {
      var idIndexMap = this._idIndexMap;
      if (!idIndexMap) {
        idIndexMap = this._idIndexMap = {};
        this._idIndexMapCount = 0;
      }
      var index = idIndexMap[id];
      if (index == null) {
        idIndexMap[id] = index = this._idIndexMapCount++;
      }
      return index;
    },
    getViewRoot: function() {
      return this._viewRoot;
    },
    resetViewRoot: function(viewRoot) {
      viewRoot ? (this._viewRoot = viewRoot) : (viewRoot = this._viewRoot);
      var root = this.getData().tree.root;
      if (!viewRoot || (viewRoot !== root && !root.contains(viewRoot))) {
        this._viewRoot = root;
      }
    }
  });
  function completeTreeValue(dataNode, arrValueLength) {
    var sum = 0;
    zrUtil.each(dataNode.children, function(child) {
      completeTreeValue(child, arrValueLength);
      var childValue = child.value;
      zrUtil.isArray(childValue) && (childValue = childValue[0]);
      sum += childValue;
    });
    var thisValue = dataNode.value;
    if (arrValueLength >= 0) {
      if (!zrUtil.isArray(thisValue)) {
        dataNode.value = new Array(arrValueLength);
      } else {
        thisValue = thisValue[0];
      }
    }
    if (thisValue == null || isNaN(thisValue)) {
      thisValue = sum;
    }
    if (thisValue < 0) {
      thisValue = 0;
    }
    arrValueLength >= 0 ? (dataNode.value[0] = thisValue) : (dataNode.value = thisValue);
  }
  function setDefault(levels, ecModel) {
    var globalColorList = ecModel.get('color');
    if (!globalColorList) {
      return;
    }
    levels = levels || [];
    var hasColorDefine;
    zrUtil.each(levels, function(levelDefine) {
      var model = new Model(levelDefine);
      var modelColor = model.get('color');
      if (model.get('itemStyle.normal.color') || (modelColor && modelColor !== 'none')) {
        hasColorDefine = true;
      }
    });
    if (!hasColorDefine) {
      var level0 = levels[0] || (levels[0] = {});
      level0.color = globalColorList.slice();
    }
    return levels;
  }
});
