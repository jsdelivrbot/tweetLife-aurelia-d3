/* */ 
'use strict';
var modelUtil = require('../../util/model');
var ComponentModel = require('../../model/Component');
var Model = require('../../model/Model');
var zrUtil = require('zrender/lib/core/util');
var selectableMixin = require('../../component/helper/selectableMixin');
var geoCreator = require('./geoCreator');
var GeoModel = ComponentModel.extend({
  type: 'geo',
  coordinateSystem: null,
  layoutMode: 'box',
  init: function(option) {
    ComponentModel.prototype.init.apply(this, arguments);
    modelUtil.defaultEmphasis(option.label, ['position', 'show', 'textStyle', 'distance', 'formatter']);
  },
  optionUpdated: function() {
    var option = this.option;
    var self = this;
    option.regions = geoCreator.getFilledRegions(option.regions, option.map);
    this._optionModelMap = zrUtil.reduce(option.regions || [], function(obj, regionOpt) {
      if (regionOpt.name) {
        obj[regionOpt.name] = new Model(regionOpt, self);
      }
      return obj;
    }, {});
    this.updateSelectedMap(option.regions);
  },
  defaultOption: {
    zlevel: 0,
    z: 0,
    show: true,
    left: 'center',
    top: 'center',
    aspectScale: 0.75,
    silent: false,
    map: '',
    center: null,
    zoom: 1,
    scaleLimit: null,
    label: {
      normal: {
        show: false,
        textStyle: {color: '#000'}
      },
      emphasis: {
        show: true,
        textStyle: {color: 'rgb(100,0,0)'}
      }
    },
    itemStyle: {
      normal: {
        borderWidth: 0.5,
        borderColor: '#444',
        color: '#eee'
      },
      emphasis: {color: 'rgba(255,215,0,0.8)'}
    },
    regions: []
  },
  getRegionModel: function(name) {
    return this._optionModelMap[name];
  },
  getFormattedLabel: function(name, status) {
    var formatter = this.get('label.' + status + '.formatter');
    var params = {name: name};
    if (typeof formatter === 'function') {
      params.status = status;
      return formatter(params);
    } else if (typeof formatter === 'string') {
      var serName = params.seriesName;
      return formatter.replace('{a}', serName != null ? serName : '');
    }
  },
  setZoom: function(zoom) {
    this.option.zoom = zoom;
  },
  setCenter: function(center) {
    this.option.center = center;
  }
});
zrUtil.mixin(GeoModel, selectableMixin);
module.exports = GeoModel;
