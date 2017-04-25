/* */ 
"format cjs";
define(function(require) {
  var RoamController = require('./RoamController');
  var graphic = require('../../util/graphic');
  var zrUtil = require('zrender/core/util');
  function getFixedItemStyle(model, scale) {
    var itemStyle = model.getItemStyle();
    var areaColor = model.get('areaColor');
    if (areaColor != null) {
      itemStyle.fill = areaColor;
    }
    return itemStyle;
  }
  function updateMapSelectHandler(mapDraw, mapOrGeoModel, group, api, fromView) {
    group.off('click');
    group.off('mousedown');
    if (mapOrGeoModel.get('selectedMode')) {
      group.on('mousedown', function() {
        mapDraw._mouseDownFlag = true;
      });
      group.on('click', function(e) {
        if (!mapDraw._mouseDownFlag) {
          return;
        }
        mapDraw._mouseDownFlag = false;
        var el = e.target;
        while (!el.__region) {
          el = el.parent;
        }
        if (!el) {
          return;
        }
        var region = el.__region;
        var action = {
          type: (mapOrGeoModel.mainType === 'geo' ? 'geo' : 'map') + 'ToggleSelect',
          name: region.name,
          from: fromView.uid
        };
        action[mapOrGeoModel.mainType + 'Id'] = mapOrGeoModel.id;
        api.dispatchAction(action);
        updateMapSelected(mapOrGeoModel, group);
      });
    }
  }
  function updateMapSelected(mapOrGeoModel, group) {
    group.eachChild(function(otherRegionEl) {
      if (otherRegionEl.__region) {
        otherRegionEl.trigger(mapOrGeoModel.isSelected(otherRegionEl.__region.name) ? 'emphasis' : 'normal');
      }
    });
  }
  function MapDraw(api, updateGroup) {
    var group = new graphic.Group();
    this._controller = new RoamController(api.getZr(), updateGroup ? group : null, null);
    this.group = group;
    this._updateGroup = updateGroup;
    this._mouseDownFlag;
  }
  MapDraw.prototype = {
    constructor: MapDraw,
    draw: function(mapOrGeoModel, ecModel, api, fromView, payload) {
      var isGeo = mapOrGeoModel.mainType === 'geo';
      var data = mapOrGeoModel.getData && mapOrGeoModel.getData();
      isGeo && ecModel.eachComponent({
        mainType: 'series',
        subType: 'map'
      }, function(mapSeries) {
        if (!data && mapSeries.getHostGeoModel() === mapOrGeoModel) {
          data = mapSeries.getData();
        }
      });
      var geo = mapOrGeoModel.coordinateSystem;
      var group = this.group;
      var scale = geo.scale;
      var groupNewProp = {
        position: geo.position,
        scale: scale
      };
      if (!group.childAt(0) || payload) {
        group.attr(groupNewProp);
      } else {
        graphic.updateProps(group, groupNewProp, mapOrGeoModel);
      }
      group.removeAll();
      var itemStyleAccessPath = ['itemStyle', 'normal'];
      var hoverItemStyleAccessPath = ['itemStyle', 'emphasis'];
      var labelAccessPath = ['label', 'normal'];
      var hoverLabelAccessPath = ['label', 'emphasis'];
      zrUtil.each(geo.regions, function(region) {
        var regionGroup = new graphic.Group();
        var compoundPath = new graphic.CompoundPath({shape: {paths: []}});
        regionGroup.add(compoundPath);
        var regionModel = mapOrGeoModel.getRegionModel(region.name) || mapOrGeoModel;
        var itemStyleModel = regionModel.getModel(itemStyleAccessPath);
        var hoverItemStyleModel = regionModel.getModel(hoverItemStyleAccessPath);
        var itemStyle = getFixedItemStyle(itemStyleModel, scale);
        var hoverItemStyle = getFixedItemStyle(hoverItemStyleModel, scale);
        var labelModel = regionModel.getModel(labelAccessPath);
        var hoverLabelModel = regionModel.getModel(hoverLabelAccessPath);
        var dataIdx;
        if (data) {
          dataIdx = data.indexOfName(region.name);
          var visualColor = data.getItemVisual(dataIdx, 'color', true);
          if (visualColor) {
            itemStyle.fill = visualColor;
          }
        }
        var textStyleModel = labelModel.getModel('textStyle');
        var hoverTextStyleModel = hoverLabelModel.getModel('textStyle');
        zrUtil.each(region.contours, function(contour) {
          var polygon = new graphic.Polygon({shape: {points: contour}});
          compoundPath.shape.paths.push(polygon);
        });
        compoundPath.setStyle(itemStyle);
        compoundPath.style.strokeNoScale = true;
        compoundPath.culling = true;
        var showLabel = labelModel.get('show');
        var hoverShowLabel = hoverLabelModel.get('show');
        var isDataNaN = data && isNaN(data.get('value', dataIdx));
        var itemLayout = data && data.getItemLayout(dataIdx);
        if ((isGeo || isDataNaN && (showLabel || hoverShowLabel)) || (itemLayout && itemLayout.showLabel)) {
          var query = data ? dataIdx : region.name;
          var formattedStr = mapOrGeoModel.getFormattedLabel(query, 'normal');
          var hoverFormattedStr = mapOrGeoModel.getFormattedLabel(query, 'emphasis');
          var text = new graphic.Text({
            style: {
              text: showLabel ? (formattedStr || region.name) : '',
              fill: textStyleModel.getTextColor(),
              textFont: textStyleModel.getFont(),
              textAlign: 'center',
              textVerticalAlign: 'middle'
            },
            hoverStyle: {
              text: hoverShowLabel ? (hoverFormattedStr || region.name) : '',
              fill: hoverTextStyleModel.getTextColor(),
              textFont: hoverTextStyleModel.getFont()
            },
            position: region.center.slice(),
            scale: [1 / scale[0], 1 / scale[1]],
            z2: 10,
            silent: true
          });
          regionGroup.add(text);
        }
        if (data) {
          data.setItemGraphicEl(dataIdx, regionGroup);
        } else {
          var regionModel = mapOrGeoModel.getRegionModel(region.name);
          compoundPath.eventData = {
            componentType: 'geo',
            geoIndex: mapOrGeoModel.componentIndex,
            name: region.name,
            region: (regionModel && regionModel.option) || {}
          };
        }
        regionGroup.__region = region;
        graphic.setHoverStyle(regionGroup, hoverItemStyle, {hoverSilentOnTouch: !!mapOrGeoModel.get('selectedMode')});
        group.add(regionGroup);
      });
      this._updateController(mapOrGeoModel, ecModel, api);
      updateMapSelectHandler(this, mapOrGeoModel, group, api, fromView);
      updateMapSelected(mapOrGeoModel, group);
    },
    remove: function() {
      this.group.removeAll();
      this._controller.dispose();
    },
    _updateController: function(mapOrGeoModel, ecModel, api) {
      var geo = mapOrGeoModel.coordinateSystem;
      var controller = this._controller;
      controller.zoomLimit = mapOrGeoModel.get('scaleLimit');
      controller.zoom = geo.getZoom();
      controller.enable(mapOrGeoModel.get('roam') || false);
      var mainType = mapOrGeoModel.mainType;
      function makeActionBase() {
        var action = {
          type: 'geoRoam',
          componentType: mainType
        };
        action[mainType + 'Id'] = mapOrGeoModel.id;
        return action;
      }
      controller.off('pan').on('pan', function(dx, dy) {
        this._mouseDownFlag = false;
        api.dispatchAction(zrUtil.extend(makeActionBase(), {
          dx: dx,
          dy: dy
        }));
      }, this);
      controller.off('zoom').on('zoom', function(zoom, mouseX, mouseY) {
        this._mouseDownFlag = false;
        api.dispatchAction(zrUtil.extend(makeActionBase(), {
          zoom: zoom,
          originX: mouseX,
          originY: mouseY
        }));
        if (this._updateGroup) {
          var group = this.group;
          var scale = group.scale;
          group.traverse(function(el) {
            if (el.type === 'text') {
              el.attr('scale', [1 / scale[0], 1 / scale[1]]);
            }
          });
        }
      }, this);
      controller.setContainsPoint(function(x, y) {
        return geo.getViewRectAfterRoam().contain(x, y);
      });
    }
  };
  return MapDraw;
});
