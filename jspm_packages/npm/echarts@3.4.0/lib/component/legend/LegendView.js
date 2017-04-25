/* */ 
var zrUtil = require('zrender/lib/core/util');
var symbolCreator = require('../../util/symbol');
var graphic = require('../../util/graphic');
var listComponentHelper = require('../helper/listComponent');
var curry = zrUtil.curry;
function dispatchSelectAction(name, api) {
  api.dispatchAction({
    type: 'legendToggleSelect',
    name: name
  });
}
function dispatchHighlightAction(seriesModel, dataName, api) {
  var el = api.getZr().storage.getDisplayList()[0];
  if (!(el && el.useHoverLayer)) {
    seriesModel.get('legendHoverLink') && api.dispatchAction({
      type: 'highlight',
      seriesName: seriesModel.name,
      name: dataName
    });
  }
}
function dispatchDownplayAction(seriesModel, dataName, api) {
  var el = api.getZr().storage.getDisplayList()[0];
  if (!(el && el.useHoverLayer)) {
    seriesModel.get('legendHoverLink') && api.dispatchAction({
      type: 'downplay',
      seriesName: seriesModel.name,
      name: dataName
    });
  }
}
module.exports = require('../../echarts').extendComponentView({
  type: 'legend',
  init: function() {
    this._symbolTypeStore = {};
  },
  render: function(legendModel, ecModel, api) {
    var group = this.group;
    group.removeAll();
    if (!legendModel.get('show')) {
      return;
    }
    var selectMode = legendModel.get('selectedMode');
    var itemAlign = legendModel.get('align');
    if (itemAlign === 'auto') {
      itemAlign = (legendModel.get('left') === 'right' && legendModel.get('orient') === 'vertical') ? 'right' : 'left';
    }
    var legendDrawedMap = {};
    zrUtil.each(legendModel.getData(), function(itemModel) {
      var name = itemModel.get('name');
      if (name === '' || name === '\n') {
        group.add(new graphic.Group({newline: true}));
        return;
      }
      var seriesModel = ecModel.getSeriesByName(name)[0];
      if (legendDrawedMap[name]) {
        return;
      }
      if (seriesModel) {
        var data = seriesModel.getData();
        var color = data.getVisual('color');
        if (typeof color === 'function') {
          color = color(seriesModel.getDataParams(0));
        }
        var legendSymbolType = data.getVisual('legendSymbol') || 'roundRect';
        var symbolType = data.getVisual('symbol');
        var itemGroup = this._createItem(name, itemModel, legendModel, legendSymbolType, symbolType, itemAlign, color, selectMode);
        itemGroup.on('click', curry(dispatchSelectAction, name, api)).on('mouseover', curry(dispatchHighlightAction, seriesModel, null, api)).on('mouseout', curry(dispatchDownplayAction, seriesModel, null, api));
        legendDrawedMap[name] = true;
      } else {
        ecModel.eachRawSeries(function(seriesModel) {
          if (legendDrawedMap[name]) {
            return;
          }
          if (seriesModel.legendDataProvider) {
            var data = seriesModel.legendDataProvider();
            var idx = data.indexOfName(name);
            if (idx < 0) {
              return;
            }
            var color = data.getItemVisual(idx, 'color');
            var legendSymbolType = 'roundRect';
            var itemGroup = this._createItem(name, itemModel, legendModel, legendSymbolType, null, itemAlign, color, selectMode);
            itemGroup.on('click', curry(dispatchSelectAction, name, api)).on('mouseover', curry(dispatchHighlightAction, seriesModel, name, api)).on('mouseout', curry(dispatchDownplayAction, seriesModel, name, api));
            legendDrawedMap[name] = true;
          }
        }, this);
      }
      if (__DEV__) {
        if (!legendDrawedMap[name]) {
          console.warn(name + ' series not exists. Legend data should be same with series name or data name.');
        }
      }
    }, this);
    listComponentHelper.layout(group, legendModel, api);
    listComponentHelper.addBackground(group, legendModel);
  },
  _createItem: function(name, itemModel, legendModel, legendSymbolType, symbolType, itemAlign, color, selectMode) {
    var itemWidth = legendModel.get('itemWidth');
    var itemHeight = legendModel.get('itemHeight');
    var inactiveColor = legendModel.get('inactiveColor');
    var isSelected = legendModel.isSelected(name);
    var itemGroup = new graphic.Group();
    var textStyleModel = itemModel.getModel('textStyle');
    var itemIcon = itemModel.get('icon');
    var tooltipModel = itemModel.getModel('tooltip');
    var legendGlobalTooltipModel = tooltipModel.parentModel;
    legendSymbolType = itemIcon || legendSymbolType;
    itemGroup.add(symbolCreator.createSymbol(legendSymbolType, 0, 0, itemWidth, itemHeight, isSelected ? color : inactiveColor));
    if (!itemIcon && symbolType && ((symbolType !== legendSymbolType) || symbolType == 'none')) {
      var size = itemHeight * 0.8;
      if (symbolType === 'none') {
        symbolType = 'circle';
      }
      itemGroup.add(symbolCreator.createSymbol(symbolType, (itemWidth - size) / 2, (itemHeight - size) / 2, size, size, isSelected ? color : inactiveColor));
    }
    var textX = itemAlign === 'left' ? itemWidth + 5 : -5;
    var textAlign = itemAlign;
    var formatter = legendModel.get('formatter');
    var content = name;
    if (typeof formatter === 'string' && formatter) {
      content = formatter.replace('{name}', name != null ? name : '');
    } else if (typeof formatter === 'function') {
      content = formatter(name);
    }
    var text = new graphic.Text({style: {
        text: content,
        x: textX,
        y: itemHeight / 2,
        fill: isSelected ? textStyleModel.getTextColor() : inactiveColor,
        textFont: textStyleModel.getFont(),
        textAlign: textAlign,
        textVerticalAlign: 'middle'
      }});
    itemGroup.add(text);
    var hitRect = new graphic.Rect({
      shape: itemGroup.getBoundingRect(),
      invisible: true,
      tooltip: tooltipModel.get('show') ? zrUtil.extend({
        content: name,
        formatter: legendGlobalTooltipModel.get('formatter', true) || function() {
          return name;
        },
        formatterParams: {
          componentType: 'legend',
          legendIndex: legendModel.componentIndex,
          name: name,
          $vars: ['name']
        }
      }, tooltipModel.option) : null
    });
    itemGroup.add(hitRect);
    itemGroup.eachChild(function(child) {
      child.silent = true;
    });
    hitRect.silent = !selectMode;
    this.group.add(itemGroup);
    graphic.setHoverStyle(itemGroup);
    return itemGroup;
  }
});
