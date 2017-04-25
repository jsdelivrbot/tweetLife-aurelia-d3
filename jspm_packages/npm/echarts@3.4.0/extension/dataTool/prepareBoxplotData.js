/* */ 
"format cjs";
define(function(require) {
  var quantile = require('./quantile');
  var numberUtil = require('../../index').number;
  return function(rawData, opt) {
    opt = opt || [];
    var boxData = [];
    var outliers = [];
    var axisData = [];
    var boundIQR = opt.boundIQR;
    for (var i = 0; i < rawData.length; i++) {
      axisData.push(i + '');
      var ascList = numberUtil.asc(rawData[i].slice());
      var Q1 = quantile(ascList, 0.25);
      var Q2 = quantile(ascList, 0.5);
      var Q3 = quantile(ascList, 0.75);
      var IQR = Q3 - Q1;
      var low = boundIQR === 'none' ? ascList[0] : Q1 - (boundIQR == null ? 1.5 : boundIQR) * IQR;
      var high = boundIQR === 'none' ? ascList[ascList.length - 1] : Q3 + (boundIQR == null ? 1.5 : boundIQR) * IQR;
      boxData.push([low, Q1, Q2, Q3, high]);
      for (var j = 0; j < ascList.length; j++) {
        var dataItem = ascList[j];
        if (dataItem < low || dataItem > high) {
          var outlier = [i, dataItem];
          opt.layout === 'vertical' && outlier.reverse();
          outliers.push(outlier);
        }
      }
    }
    return {
      boxData: boxData,
      outliers: outliers,
      axisData: axisData
    };
  };
});
