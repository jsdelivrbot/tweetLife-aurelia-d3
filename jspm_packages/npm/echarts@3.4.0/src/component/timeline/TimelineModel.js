/* */ 
"format cjs";
define(function(require) {
  var ComponentModel = require('../../model/Component');
  var List = require('../../data/List');
  var zrUtil = require('zrender/core/util');
  var modelUtil = require('../../util/model');
  var TimelineModel = ComponentModel.extend({
    type: 'timeline',
    layoutMode: 'box',
    defaultOption: {
      zlevel: 0,
      z: 4,
      show: true,
      axisType: 'time',
      realtime: true,
      left: '20%',
      top: null,
      right: '20%',
      bottom: 0,
      width: null,
      height: 40,
      padding: 5,
      controlPosition: 'left',
      autoPlay: false,
      rewind: false,
      loop: true,
      playInterval: 2000,
      currentIndex: 0,
      itemStyle: {
        normal: {},
        emphasis: {}
      },
      label: {
        normal: {textStyle: {color: '#000'}},
        emphasis: {}
      },
      data: []
    },
    init: function(option, parentModel, ecModel) {
      this._data;
      this._names;
      this.mergeDefaultAndTheme(option, ecModel);
      this._initData();
    },
    mergeOption: function(option) {
      TimelineModel.superApply(this, 'mergeOption', arguments);
      this._initData();
    },
    setCurrentIndex: function(currentIndex) {
      if (currentIndex == null) {
        currentIndex = this.option.currentIndex;
      }
      var count = this._data.count();
      if (this.option.loop) {
        currentIndex = (currentIndex % count + count) % count;
      } else {
        currentIndex >= count && (currentIndex = count - 1);
        currentIndex < 0 && (currentIndex = 0);
      }
      this.option.currentIndex = currentIndex;
    },
    getCurrentIndex: function() {
      return this.option.currentIndex;
    },
    isIndexMax: function() {
      return this.getCurrentIndex() >= this._data.count() - 1;
    },
    setPlayState: function(state) {
      this.option.autoPlay = !!state;
    },
    getPlayState: function() {
      return !!this.option.autoPlay;
    },
    _initData: function() {
      var thisOption = this.option;
      var dataArr = thisOption.data || [];
      var axisType = thisOption.axisType;
      var names = this._names = [];
      if (axisType === 'category') {
        var idxArr = [];
        zrUtil.each(dataArr, function(item, index) {
          var value = modelUtil.getDataItemValue(item);
          var newItem;
          if (zrUtil.isObject(item)) {
            newItem = zrUtil.clone(item);
            newItem.value = index;
          } else {
            newItem = index;
          }
          idxArr.push(newItem);
          if (!zrUtil.isString(value) && (value == null || isNaN(value))) {
            value = '';
          }
          names.push(value + '');
        });
        dataArr = idxArr;
      }
      var dimType = ({
        category: 'ordinal',
        time: 'time'
      })[axisType] || 'number';
      var data = this._data = new List([{
        name: 'value',
        type: dimType
      }], this);
      data.initData(dataArr, names);
    },
    getData: function() {
      return this._data;
    },
    getCategories: function() {
      if (this.get('axisType') === 'category') {
        return this._names.slice();
      }
    }
  });
  return TimelineModel;
});
