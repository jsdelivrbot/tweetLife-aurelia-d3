/* */ 
"format cjs";
define(function(require) {
  return require('../../index').extendComponentView({
    type: 'bmap',
    render: function(bMapModel, ecModel, api) {
      var rendering = true;
      var bmap = bMapModel.getBMap();
      var viewportRoot = api.getZr().painter.getViewportRoot();
      var coordSys = bMapModel.coordinateSystem;
      var moveHandler = function(type, target) {
        if (rendering) {
          return;
        }
        var offsetEl = viewportRoot.parentNode.parentNode.parentNode;
        var mapOffset = [-parseInt(offsetEl.style.left, 10) || 0, -parseInt(offsetEl.style.top, 10) || 0];
        viewportRoot.style.left = mapOffset[0] + 'px';
        viewportRoot.style.top = mapOffset[1] + 'px';
        coordSys.setMapOffset(mapOffset);
        bMapModel.__mapOffset = mapOffset;
        api.dispatchAction({type: 'bmapRoam'});
      };
      function zoomEndHandler() {
        if (rendering) {
          return;
        }
        api.dispatchAction({type: 'bmapRoam'});
      }
      bmap.removeEventListener('moving', this._oldMoveHandler);
      bmap.removeEventListener('zoomend', this._oldZoomEndHandler);
      bmap.addEventListener('moving', moveHandler);
      bmap.addEventListener('zoomend', zoomEndHandler);
      this._oldMoveHandler = moveHandler;
      this._oldZoomEndHandler = zoomEndHandler;
      var roam = bMapModel.get('roam');
      if (roam && roam !== 'scale') {
        bmap.enableDragging();
      } else {
        bmap.disableDragging();
      }
      if (roam && roam !== 'move') {
        bmap.enableScrollWheelZoom();
        bmap.enableDoubleClickZoom();
        bmap.enablePinchToZoom();
      } else {
        bmap.disableScrollWheelZoom();
        bmap.disableDoubleClickZoom();
        bmap.disablePinchToZoom();
      }
      var originalStyle = bMapModel.__mapStyle;
      var newMapStyle = bMapModel.get('mapStyle') || {};
      var mapStyleStr = JSON.stringify(newMapStyle);
      if (JSON.stringify(originalStyle) !== mapStyleStr) {
        if (Object.keys(newMapStyle).length) {
          bmap.setMapStyle(newMapStyle);
        }
        bMapModel.__mapStyle = JSON.parse(mapStyleStr);
      }
      rendering = false;
    }
  });
});
