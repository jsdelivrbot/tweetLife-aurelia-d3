/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var numberUtil = require('./number');
  var textContain = require('zrender/contain/text');
  var formatUtil = {};
  formatUtil.addCommas = function(x) {
    if (isNaN(x)) {
      return '-';
    }
    x = (x + '').split('.');
    return x[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,') + (x.length > 1 ? ('.' + x[1]) : '');
  };
  formatUtil.toCamelCase = function(str, upperCaseFirst) {
    str = (str || '').toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
    if (upperCaseFirst && str) {
      str = str.charAt(0).toUpperCase() + str.slice(1);
    }
    return str;
  };
  formatUtil.normalizeCssArray = function(val) {
    var len = val.length;
    if (typeof(val) === 'number') {
      return [val, val, val, val];
    } else if (len === 2) {
      return [val[0], val[1], val[0], val[1]];
    } else if (len === 3) {
      return [val[0], val[1], val[2], val[1]];
    }
    return val;
  };
  var encodeHTML = formatUtil.encodeHTML = function(source) {
    return String(source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var TPL_VAR_ALIAS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  var wrapVar = function(varName, seriesIdx) {
    return '{' + varName + (seriesIdx == null ? '' : seriesIdx) + '}';
  };
  formatUtil.formatTpl = function(tpl, paramsList, encode) {
    if (!zrUtil.isArray(paramsList)) {
      paramsList = [paramsList];
    }
    var seriesLen = paramsList.length;
    if (!seriesLen) {
      return '';
    }
    var $vars = paramsList[0].$vars || [];
    for (var i = 0; i < $vars.length; i++) {
      var alias = TPL_VAR_ALIAS[i];
      var val = wrapVar(alias, 0);
      tpl = tpl.replace(wrapVar(alias), encode ? encodeHTML(val) : val);
    }
    for (var seriesIdx = 0; seriesIdx < seriesLen; seriesIdx++) {
      for (var k = 0; k < $vars.length; k++) {
        var val = paramsList[seriesIdx][$vars[k]];
        tpl = tpl.replace(wrapVar(TPL_VAR_ALIAS[k], seriesIdx), encode ? encodeHTML(val) : val);
      }
    }
    return tpl;
  };
  var s2d = function(str) {
    return str < 10 ? ('0' + str) : str;
  };
  formatUtil.formatTime = function(tpl, value) {
    if (tpl === 'week' || tpl === 'month' || tpl === 'quarter' || tpl === 'half-year' || tpl === 'year') {
      tpl = 'MM-dd\nyyyy';
    }
    var date = numberUtil.parseDate(value);
    var y = date.getFullYear();
    var M = date.getMonth() + 1;
    var d = date.getDate();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    tpl = tpl.replace('MM', s2d(M)).toLowerCase().replace('yyyy', y).replace('yy', y % 100).replace('dd', s2d(d)).replace('d', d).replace('hh', s2d(h)).replace('h', h).replace('mm', s2d(m)).replace('m', m).replace('ss', s2d(s)).replace('s', s);
    return tpl;
  };
  formatUtil.capitalFirst = function(str) {
    return str ? str.charAt(0).toUpperCase() + str.substr(1) : str;
  };
  formatUtil.truncateText = textContain.truncateText;
  return formatUtil;
});
