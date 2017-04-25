/* */ 
var zrUtil = require('zrender/lib/core/util');
var modelUtil = require('../util/model');
var ComponentModel = require('./Component');
var each = zrUtil.each;
var clone = zrUtil.clone;
var map = zrUtil.map;
var merge = zrUtil.merge;
var QUERY_REG = /^(min|max)?(.+)$/;
function OptionManager(api) {
  this._api = api;
  this._timelineOptions = [];
  this._mediaList = [];
  this._mediaDefault;
  this._currentMediaIndices = [];
  this._optionBackup;
  this._newBaseOption;
}
OptionManager.prototype = {
  constructor: OptionManager,
  setOption: function(rawOption, optionPreprocessorFuncs) {
    rawOption = clone(rawOption, true);
    var oldOptionBackup = this._optionBackup;
    var newParsedOption = parseRawOption.call(this, rawOption, optionPreprocessorFuncs, !oldOptionBackup);
    this._newBaseOption = newParsedOption.baseOption;
    if (oldOptionBackup) {
      mergeOption(oldOptionBackup.baseOption, newParsedOption.baseOption);
      if (newParsedOption.timelineOptions.length) {
        oldOptionBackup.timelineOptions = newParsedOption.timelineOptions;
      }
      if (newParsedOption.mediaList.length) {
        oldOptionBackup.mediaList = newParsedOption.mediaList;
      }
      if (newParsedOption.mediaDefault) {
        oldOptionBackup.mediaDefault = newParsedOption.mediaDefault;
      }
    } else {
      this._optionBackup = newParsedOption;
    }
  },
  mountOption: function(isRecreate) {
    var optionBackup = this._optionBackup;
    this._timelineOptions = map(optionBackup.timelineOptions, clone);
    this._mediaList = map(optionBackup.mediaList, clone);
    this._mediaDefault = clone(optionBackup.mediaDefault);
    this._currentMediaIndices = [];
    return clone(isRecreate ? optionBackup.baseOption : this._newBaseOption);
  },
  getTimelineOption: function(ecModel) {
    var option;
    var timelineOptions = this._timelineOptions;
    if (timelineOptions.length) {
      var timelineModel = ecModel.getComponent('timeline');
      if (timelineModel) {
        option = clone(timelineOptions[timelineModel.getCurrentIndex()], true);
      }
    }
    return option;
  },
  getMediaOption: function(ecModel) {
    var ecWidth = this._api.getWidth();
    var ecHeight = this._api.getHeight();
    var mediaList = this._mediaList;
    var mediaDefault = this._mediaDefault;
    var indices = [];
    var result = [];
    if (!mediaList.length && !mediaDefault) {
      return result;
    }
    for (var i = 0,
        len = mediaList.length; i < len; i++) {
      if (applyMediaQuery(mediaList[i].query, ecWidth, ecHeight)) {
        indices.push(i);
      }
    }
    if (!indices.length && mediaDefault) {
      indices = [-1];
    }
    if (indices.length && !indicesEquals(indices, this._currentMediaIndices)) {
      result = map(indices, function(index) {
        return clone(index === -1 ? mediaDefault.option : mediaList[index].option);
      });
    }
    this._currentMediaIndices = indices;
    return result;
  }
};
function parseRawOption(rawOption, optionPreprocessorFuncs, isNew) {
  var timelineOptions = [];
  var mediaList = [];
  var mediaDefault;
  var baseOption;
  var timelineOpt = rawOption.timeline;
  if (rawOption.baseOption) {
    baseOption = rawOption.baseOption;
  }
  if (timelineOpt || rawOption.options) {
    baseOption = baseOption || {};
    timelineOptions = (rawOption.options || []).slice();
  }
  if (rawOption.media) {
    baseOption = baseOption || {};
    var media = rawOption.media;
    each(media, function(singleMedia) {
      if (singleMedia && singleMedia.option) {
        if (singleMedia.query) {
          mediaList.push(singleMedia);
        } else if (!mediaDefault) {
          mediaDefault = singleMedia;
        }
      }
    });
  }
  if (!baseOption) {
    baseOption = rawOption;
  }
  if (!baseOption.timeline) {
    baseOption.timeline = timelineOpt;
  }
  each([baseOption].concat(timelineOptions).concat(zrUtil.map(mediaList, function(media) {
    return media.option;
  })), function(option) {
    each(optionPreprocessorFuncs, function(preProcess) {
      preProcess(option, isNew);
    });
  });
  return {
    baseOption: baseOption,
    timelineOptions: timelineOptions,
    mediaDefault: mediaDefault,
    mediaList: mediaList
  };
}
function applyMediaQuery(query, ecWidth, ecHeight) {
  var realMap = {
    width: ecWidth,
    height: ecHeight,
    aspectratio: ecWidth / ecHeight
  };
  var applicatable = true;
  zrUtil.each(query, function(value, attr) {
    var matched = attr.match(QUERY_REG);
    if (!matched || !matched[1] || !matched[2]) {
      return;
    }
    var operator = matched[1];
    var realAttr = matched[2].toLowerCase();
    if (!compare(realMap[realAttr], value, operator)) {
      applicatable = false;
    }
  });
  return applicatable;
}
function compare(real, expect, operator) {
  if (operator === 'min') {
    return real >= expect;
  } else if (operator === 'max') {
    return real <= expect;
  } else {
    return real === expect;
  }
}
function indicesEquals(indices1, indices2) {
  return indices1.join(',') === indices2.join(',');
}
function mergeOption(oldOption, newOption) {
  newOption = newOption || {};
  each(newOption, function(newCptOpt, mainType) {
    if (newCptOpt == null) {
      return;
    }
    var oldCptOpt = oldOption[mainType];
    if (!ComponentModel.hasClass(mainType)) {
      oldOption[mainType] = merge(oldCptOpt, newCptOpt, true);
    } else {
      newCptOpt = modelUtil.normalizeToArray(newCptOpt);
      oldCptOpt = modelUtil.normalizeToArray(oldCptOpt);
      var mapResult = modelUtil.mappingToExists(oldCptOpt, newCptOpt);
      oldOption[mainType] = map(mapResult, function(item) {
        return (item.option && item.exist) ? merge(item.exist, item.option, true) : (item.exist || item.option);
      });
    }
  });
}
module.exports = OptionManager;
