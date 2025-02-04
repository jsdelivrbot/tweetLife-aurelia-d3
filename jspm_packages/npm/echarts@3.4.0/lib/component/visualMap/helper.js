/* */ 
var zrUtil = require('zrender/lib/core/util');
var layout = require('../../util/layout');
var helper = {
  getItemAlign: function(visualMapModel, api, itemSize) {
    var modelOption = visualMapModel.option;
    var itemAlign = modelOption.align;
    if (itemAlign != null && itemAlign !== 'auto') {
      return itemAlign;
    }
    var ecSize = {
      width: api.getWidth(),
      height: api.getHeight()
    };
    var realIndex = modelOption.orient === 'horizontal' ? 1 : 0;
    var paramsSet = [['left', 'right', 'width'], ['top', 'bottom', 'height']];
    var reals = paramsSet[realIndex];
    var fakeValue = [0, null, 10];
    var layoutInput = {};
    for (var i = 0; i < 3; i++) {
      layoutInput[paramsSet[1 - realIndex][i]] = fakeValue[i];
      layoutInput[reals[i]] = i === 2 ? itemSize[0] : modelOption[reals[i]];
    }
    var rParam = [['x', 'width', 3], ['y', 'height', 0]][realIndex];
    var rect = layout.getLayoutRect(layoutInput, ecSize, modelOption.padding);
    return reals[(rect.margin[rParam[2]] || 0) + rect[rParam[0]] + rect[rParam[1]] * 0.5 < ecSize[rParam[1]] * 0.5 ? 0 : 1];
  },
  convertDataIndex: function(batch) {
    zrUtil.each(batch || [], function(batchItem) {
      if (batch.dataIndex != null) {
        batch.dataIndexInside = batch.dataIndex;
        batch.dataIndex = null;
      }
    });
    return batch;
  }
};
module.exports = helper;
