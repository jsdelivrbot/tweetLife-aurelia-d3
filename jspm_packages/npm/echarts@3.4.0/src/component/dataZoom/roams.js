/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var RoamController = require('../helper/RoamController');
  var throttle = require('../../util/throttle');
  var curry = zrUtil.curry;
  var ATTR = '\0_ec_dataZoom_roams';
  var roams = {
    register: function(api, dataZoomInfo) {
      var store = giveStore(api);
      var theDataZoomId = dataZoomInfo.dataZoomId;
      var theCoordId = dataZoomInfo.coordId;
      zrUtil.each(store, function(record, coordId) {
        var dataZoomInfos = record.dataZoomInfos;
        if (dataZoomInfos[theDataZoomId] && zrUtil.indexOf(dataZoomInfo.allCoordIds, theCoordId) < 0) {
          delete dataZoomInfos[theDataZoomId];
          record.count--;
        }
      });
      cleanStore(store);
      var record = store[theCoordId];
      if (!record) {
        record = store[theCoordId] = {
          coordId: theCoordId,
          dataZoomInfos: {},
          count: 0
        };
        record.controller = createController(api, dataZoomInfo, record);
        record.dispatchAction = zrUtil.curry(dispatchAction, api);
      }
      record.controller.setContainsPoint(dataZoomInfo.containsPoint);
      throttle.createOrUpdate(record, 'dispatchAction', dataZoomInfo.throttleRate, 'fixRate');
      !(record.dataZoomInfos[theDataZoomId]) && record.count++;
      record.dataZoomInfos[theDataZoomId] = dataZoomInfo;
    },
    unregister: function(api, dataZoomId) {
      var store = giveStore(api);
      zrUtil.each(store, function(record) {
        record.controller.dispose();
        var dataZoomInfos = record.dataZoomInfos;
        if (dataZoomInfos[dataZoomId]) {
          delete dataZoomInfos[dataZoomId];
          record.count--;
        }
      });
      cleanStore(store);
    },
    shouldRecordRange: function(payload, dataZoomId) {
      if (payload && payload.type === 'dataZoom' && payload.batch) {
        for (var i = 0,
            len = payload.batch.length; i < len; i++) {
          if (payload.batch[i].dataZoomId === dataZoomId) {
            return false;
          }
        }
      }
      return true;
    },
    generateCoordId: function(coordModel) {
      return coordModel.type + '\0_' + coordModel.id;
    }
  };
  function giveStore(api) {
    var zr = api.getZr();
    return zr[ATTR] || (zr[ATTR] = {});
  }
  function createController(api, dataZoomInfo, newRecord) {
    var controller = new RoamController(api.getZr());
    controller.enable();
    controller.on('pan', curry(onPan, newRecord));
    controller.on('zoom', curry(onZoom, newRecord));
    return controller;
  }
  function cleanStore(store) {
    zrUtil.each(store, function(record, coordId) {
      if (!record.count) {
        record.controller.dispose();
        delete store[coordId];
      }
    });
  }
  function onPan(record, dx, dy, oldX, oldY, newX, newY) {
    wrapAndDispatch(record, function(info) {
      return info.panGetRange(record.controller, dx, dy, oldX, oldY, newX, newY);
    });
  }
  function onZoom(record, scale, mouseX, mouseY) {
    wrapAndDispatch(record, function(info) {
      return info.zoomGetRange(record.controller, scale, mouseX, mouseY);
    });
  }
  function wrapAndDispatch(record, getRange) {
    var batch = [];
    zrUtil.each(record.dataZoomInfos, function(info) {
      var range = getRange(info);
      range && batch.push({
        dataZoomId: info.dataZoomId,
        start: range[0],
        end: range[1]
      });
    });
    record.dispatchAction(batch);
  }
  function dispatchAction(api, batch) {
    api.dispatchAction({
      type: 'dataZoom',
      batch: batch
    });
  }
  return roams;
});
