/* */ 
(function(process) {
  var zrUtil = require('zrender/lib/core/util');
  var each = zrUtil.each;
  var DATAS = '\0__link_datas';
  var MAIN_DATA = '\0__link_mainData';
  function linkList(opt) {
    var mainData = opt.mainData;
    var datas = opt.datas;
    if (!datas) {
      datas = {main: mainData};
      opt.datasAttr = {main: 'data'};
    }
    opt.datas = opt.mainData = null;
    linkAll(mainData, datas, opt);
    each(datas, function(data) {
      each(mainData.TRANSFERABLE_METHODS, function(methodName) {
        data.wrapMethod(methodName, zrUtil.curry(transferInjection, opt));
      });
    });
    mainData.wrapMethod('cloneShallow', zrUtil.curry(cloneShallowInjection, opt));
    each(mainData.CHANGABLE_METHODS, function(methodName) {
      mainData.wrapMethod(methodName, zrUtil.curry(changeInjection, opt));
    });
    zrUtil.assert(datas[mainData.dataType] === mainData);
  }
  function transferInjection(opt, res) {
    if (isMainData(this)) {
      var datas = zrUtil.extend({}, this[DATAS]);
      datas[this.dataType] = res;
      linkAll(res, datas, opt);
    } else {
      linkSingle(res, this.dataType, this[MAIN_DATA], opt);
    }
    return res;
  }
  function changeInjection(opt, res) {
    opt.struct && opt.struct.update(this);
    return res;
  }
  function cloneShallowInjection(opt, res) {
    each(res[DATAS], function(data, dataType) {
      data !== res && linkSingle(data.cloneShallow(), dataType, res, opt);
    });
    return res;
  }
  function getLinkedData(dataType) {
    var mainData = this[MAIN_DATA];
    return (dataType == null || mainData == null) ? mainData : mainData[DATAS][dataType];
  }
  function isMainData(data) {
    return data[MAIN_DATA] === data;
  }
  function linkAll(mainData, datas, opt) {
    mainData[DATAS] = {};
    each(datas, function(data, dataType) {
      linkSingle(data, dataType, mainData, opt);
    });
  }
  function linkSingle(data, dataType, mainData, opt) {
    mainData[DATAS][dataType] = data;
    data[MAIN_DATA] = mainData;
    data.dataType = dataType;
    if (opt.struct) {
      data[opt.structAttr] = opt.struct;
      opt.struct[opt.datasAttr[dataType]] = data;
    }
    data.getLinkedData = getLinkedData;
  }
  module.exports = linkList;
})(require('process'));
