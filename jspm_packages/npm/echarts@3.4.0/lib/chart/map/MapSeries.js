/* */ 
var List = require('../../data/List');
var SeriesModel = require('../../model/Series');
var zrUtil = require('zrender/lib/core/util');
var completeDimensions = require('../../data/helper/completeDimensions');
var formatUtil = require('../../util/format');
var encodeHTML = formatUtil.encodeHTML;
var addCommas = formatUtil.addCommas;
var dataSelectableMixin = require('../../component/helper/selectableMixin');
var geoCreator = require('../../coord/geo/geoCreator');
var MapSeries = SeriesModel.extend({
  type: 'series.map',
  dependencies: ['geo'],
  layoutMode: 'box',
  needsDrawMap: false,
  seriesGroup: [],
  init: function(option) {
    option = this._fillOption(option, this.getMapType());
    this.option = option;
    MapSeries.superApply(this, 'init', arguments);
    this.updateSelectedMap(option.data);
  },
  getInitialData: function(option) {
    var dimensions = completeDimensions(['value'], option.data || []);
    var list = new List(dimensions, this);
    list.initData(option.data);
    return list;
  },
  mergeOption: function(newOption) {
    if (newOption.data) {
      newOption = this._fillOption(newOption, this.getMapType());
    }
    MapSeries.superCall(this, 'mergeOption', newOption);
    this.updateSelectedMap(this.option.data);
  },
  getHostGeoModel: function() {
    var geoIndex = this.option.geoIndex;
    return geoIndex != null ? this.dependentModels.geo[geoIndex] : null;
  },
  getMapType: function() {
    return (this.getHostGeoModel() || this).option.map;
  },
  _fillOption: function(option, mapName) {
    option = zrUtil.extend({}, option);
    option.data = geoCreator.getFilledRegions(option.data, mapName);
    return option;
  },
  getRawValue: function(dataIndex) {
    return this.getData().get('value', dataIndex);
  },
  getRegionModel: function(regionName) {
    var data = this.getData();
    return data.getItemModel(data.indexOfName(regionName));
  },
  formatTooltip: function(dataIndex) {
    var data = this.getData();
    var formattedValue = addCommas(this.getRawValue(dataIndex));
    var name = data.getName(dataIndex);
    var seriesGroup = this.seriesGroup;
    var seriesNames = [];
    for (var i = 0; i < seriesGroup.length; i++) {
      var otherIndex = seriesGroup[i].originalData.indexOfName(name);
      if (!isNaN(seriesGroup[i].originalData.get('value', otherIndex))) {
        seriesNames.push(encodeHTML(seriesGroup[i].name));
      }
    }
    return seriesNames.join(', ') + '<br />' + encodeHTML(name + ' : ' + formattedValue);
  },
  getTooltipPosition: function(dataIndex) {
    if (dataIndex != null) {
      var name = this.getData().getName(dataIndex);
      var geo = this.coordinateSystem;
      var region = geo.getRegion(name);
      return region && geo.dataToPoint(region.center);
    }
  },
  setZoom: function(zoom) {
    this.option.zoom = zoom;
  },
  setCenter: function(center) {
    this.option.center = center;
  },
  defaultOption: {
    zlevel: 0,
    z: 2,
    coordinateSystem: 'geo',
    map: '',
    left: 'center',
    top: 'center',
    aspectScale: 0.75,
    showLegendSymbol: true,
    dataRangeHoverLink: true,
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
        areaColor: '#eee'
      },
      emphasis: {areaColor: 'rgba(255,215,0,0.8)'}
    }
  }
});
zrUtil.mixin(MapSeries, dataSelectableMixin);
module.exports = MapSeries;
