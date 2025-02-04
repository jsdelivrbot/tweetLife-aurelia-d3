/* */ 
'use strict';
var MapDraw = require('../helper/MapDraw');
module.exports = require('../../echarts').extendComponentView({
  type: 'geo',
  init: function(ecModel, api) {
    var mapDraw = new MapDraw(api, true);
    this._mapDraw = mapDraw;
    this.group.add(mapDraw.group);
  },
  render: function(geoModel, ecModel, api, payload) {
    if (payload && payload.type === 'geoToggleSelect' && payload.from === this.uid) {
      return;
    }
    var mapDraw = this._mapDraw;
    if (geoModel.get('show')) {
      mapDraw.draw(geoModel, ecModel, api, this, payload);
    } else {
      this._mapDraw.group.removeAll();
    }
    this.group.silent = geoModel.get('silent');
  },
  dispose: function() {
    this._mapDraw && this._mapDraw.remove();
  }
});
