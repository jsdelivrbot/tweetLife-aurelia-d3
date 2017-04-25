/* */ 
"format cjs";
define(function(require) {
  'use strict';
  var zrUtil = require('zrender/core/util');
  var Model = require('../../model/Model');
  var LegendModel = require('../../echarts').extendComponentModel({
    type: 'legend',
    dependencies: ['series'],
    layoutMode: {
      type: 'box',
      ignoreSize: true
    },
    init: function(option, parentModel, ecModel) {
      this.mergeDefaultAndTheme(option, ecModel);
      option.selected = option.selected || {};
    },
    mergeOption: function(option) {
      LegendModel.superCall(this, 'mergeOption', option);
    },
    optionUpdated: function() {
      this._updateData(this.ecModel);
      var legendData = this._data;
      if (legendData[0] && this.get('selectedMode') === 'single') {
        var hasSelected = false;
        for (var i = 0; i < legendData.length; i++) {
          var name = legendData[i].get('name');
          if (this.isSelected(name)) {
            this.select(name);
            hasSelected = true;
            break;
          }
        }
        !hasSelected && this.select(legendData[0].get('name'));
      }
    },
    _updateData: function(ecModel) {
      var legendData = zrUtil.map(this.get('data') || [], function(dataItem) {
        if (typeof dataItem === 'string' || typeof dataItem === 'number') {
          dataItem = {name: dataItem};
        }
        return new Model(dataItem, this, this.ecModel);
      }, this);
      this._data = legendData;
      var availableNames = zrUtil.map(ecModel.getSeries(), function(series) {
        return series.name;
      });
      ecModel.eachSeries(function(seriesModel) {
        if (seriesModel.legendDataProvider) {
          var data = seriesModel.legendDataProvider();
          availableNames = availableNames.concat(data.mapArray(data.getName));
        }
      });
      this._availableNames = availableNames;
    },
    getData: function() {
      return this._data;
    },
    select: function(name) {
      var selected = this.option.selected;
      var selectedMode = this.get('selectedMode');
      if (selectedMode === 'single') {
        var data = this._data;
        zrUtil.each(data, function(dataItem) {
          selected[dataItem.get('name')] = false;
        });
      }
      selected[name] = true;
    },
    unSelect: function(name) {
      if (this.get('selectedMode') !== 'single') {
        this.option.selected[name] = false;
      }
    },
    toggleSelected: function(name) {
      var selected = this.option.selected;
      if (!selected.hasOwnProperty(name)) {
        selected[name] = true;
      }
      this[selected[name] ? 'unSelect' : 'select'](name);
    },
    isSelected: function(name) {
      var selected = this.option.selected;
      return !(selected.hasOwnProperty(name) && !selected[name]) && zrUtil.indexOf(this._availableNames, name) >= 0;
    },
    defaultOption: {
      zlevel: 0,
      z: 4,
      show: true,
      orient: 'horizontal',
      left: 'center',
      top: 'top',
      align: 'auto',
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: '#ccc',
      borderWidth: 0,
      padding: 5,
      itemGap: 10,
      itemWidth: 25,
      itemHeight: 14,
      inactiveColor: '#ccc',
      textStyle: {color: '#333'},
      selectedMode: true,
      tooltip: {show: false}
    }
  });
  return LegendModel;
});
