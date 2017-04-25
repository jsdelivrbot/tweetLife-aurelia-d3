/* */ 
var Model = require('./Model');
var zrUtil = require('zrender/lib/core/util');
var arrayPush = Array.prototype.push;
var componentUtil = require('../util/component');
var clazzUtil = require('../util/clazz');
var layout = require('../util/layout');
var ComponentModel = Model.extend({
  type: 'component',
  id: '',
  name: '',
  mainType: '',
  subType: '',
  componentIndex: 0,
  defaultOption: null,
  ecModel: null,
  dependentModels: [],
  uid: null,
  layoutMode: null,
  $constructor: function(option, parentModel, ecModel, extraOpt) {
    Model.call(this, option, parentModel, ecModel, extraOpt);
    this.uid = componentUtil.getUID('componentModel');
  },
  init: function(option, parentModel, ecModel, extraOpt) {
    this.mergeDefaultAndTheme(option, ecModel);
  },
  mergeDefaultAndTheme: function(option, ecModel) {
    var layoutMode = this.layoutMode;
    var inputPositionParams = layoutMode ? layout.getLayoutParams(option) : {};
    var themeModel = ecModel.getTheme();
    zrUtil.merge(option, themeModel.get(this.mainType));
    zrUtil.merge(option, this.getDefaultOption());
    if (layoutMode) {
      layout.mergeLayoutParam(option, inputPositionParams, layoutMode);
    }
  },
  mergeOption: function(option, extraOpt) {
    zrUtil.merge(this.option, option, true);
    var layoutMode = this.layoutMode;
    if (layoutMode) {
      layout.mergeLayoutParam(this.option, option, layoutMode);
    }
  },
  optionUpdated: function(newCptOption, isInit) {},
  getDefaultOption: function() {
    if (!clazzUtil.hasOwn(this, '__defaultOption')) {
      var optList = [];
      var Class = this.constructor;
      while (Class) {
        var opt = Class.prototype.defaultOption;
        opt && optList.push(opt);
        Class = Class.superClass;
      }
      var defaultOption = {};
      for (var i = optList.length - 1; i >= 0; i--) {
        defaultOption = zrUtil.merge(defaultOption, optList[i], true);
      }
      clazzUtil.set(this, '__defaultOption', defaultOption);
    }
    return clazzUtil.get(this, '__defaultOption');
  },
  getReferringComponents: function(mainType) {
    return this.ecModel.queryComponents({
      mainType: mainType,
      index: this.get(mainType + 'Index', true),
      id: this.get(mainType + 'Id', true)
    });
  }
});
clazzUtil.enableClassManagement(ComponentModel, {registerWhenExtend: true});
componentUtil.enableSubTypeDefaulter(ComponentModel);
componentUtil.enableTopologicalTravel(ComponentModel, getDependencies);
function getDependencies(componentType) {
  var deps = [];
  zrUtil.each(ComponentModel.getClassesByMainType(componentType), function(Clazz) {
    arrayPush.apply(deps, Clazz.prototype.dependencies || []);
  });
  return zrUtil.map(deps, function(type) {
    return clazzUtil.parseClassType(type).main;
  });
}
zrUtil.mixin(ComponentModel, require('./mixin/boxLayout'));
module.exports = ComponentModel;
