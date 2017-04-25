/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var VisualMapping = require('./VisualMapping');
  var each = zrUtil.each;
  function hasKeys(obj) {
    if (obj) {
      for (var name in obj) {
        if (obj.hasOwnProperty(name)) {
          return true;
        }
      }
    }
  }
  var visualSolution = {
    createVisualMappings: function(option, stateList, supplementVisualOption) {
      var visualMappings = {};
      each(stateList, function(state) {
        var mappings = visualMappings[state] = createMappings();
        each(option[state], function(visualData, visualType) {
          if (!VisualMapping.isValidType(visualType)) {
            return;
          }
          var mappingOption = {
            type: visualType,
            visual: visualData
          };
          supplementVisualOption && supplementVisualOption(mappingOption, state);
          mappings[visualType] = new VisualMapping(mappingOption);
          if (visualType === 'opacity') {
            mappingOption = zrUtil.clone(mappingOption);
            mappingOption.type = 'colorAlpha';
            mappings.__hidden.__alphaForOpacity = new VisualMapping(mappingOption);
          }
        });
      });
      return visualMappings;
      function createMappings() {
        var Creater = function() {};
        Creater.prototype.__hidden = Creater.prototype;
        var obj = new Creater();
        return obj;
      }
    },
    replaceVisualOption: function(thisOption, newOption, keys) {
      var has;
      zrUtil.each(keys, function(key) {
        if (newOption.hasOwnProperty(key) && hasKeys(newOption[key])) {
          has = true;
        }
      });
      has && zrUtil.each(keys, function(key) {
        if (newOption.hasOwnProperty(key) && hasKeys(newOption[key])) {
          thisOption[key] = zrUtil.clone(newOption[key]);
        } else {
          delete thisOption[key];
        }
      });
    },
    applyVisual: function(stateList, visualMappings, data, getValueState, scope, dimension) {
      var visualTypesMap = {};
      zrUtil.each(stateList, function(state) {
        var visualTypes = VisualMapping.prepareVisualTypes(visualMappings[state]);
        visualTypesMap[state] = visualTypes;
      });
      var dataIndex;
      function getVisual(key) {
        return data.getItemVisual(dataIndex, key);
      }
      function setVisual(key, value) {
        data.setItemVisual(dataIndex, key, value);
      }
      if (dimension == null) {
        data.each(eachItem, true);
      } else {
        data.each([dimension], eachItem, true);
      }
      function eachItem(valueOrIndex, index) {
        dataIndex = dimension == null ? valueOrIndex : index;
        var rawDataItem = data.getRawDataItem(dataIndex);
        if (rawDataItem && rawDataItem.visualMap === false) {
          return;
        }
        var valueState = getValueState.call(scope, valueOrIndex);
        var mappings = visualMappings[valueState];
        var visualTypes = visualTypesMap[valueState];
        for (var i = 0,
            len = visualTypes.length; i < len; i++) {
          var type = visualTypes[i];
          mappings[type] && mappings[type].applyVisual(valueOrIndex, getVisual, setVisual);
        }
      }
    }
  };
  return visualSolution;
});
