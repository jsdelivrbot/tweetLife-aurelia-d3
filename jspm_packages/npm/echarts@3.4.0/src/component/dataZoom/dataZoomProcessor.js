/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var echarts = require('../../echarts');
    echarts.registerProcessor(function(ecModel, api) {
      ecModel.eachComponent('dataZoom', function(dataZoomModel) {
        dataZoomModel.eachTargetAxis(resetSingleAxis);
        dataZoomModel.eachTargetAxis(filterSingleAxis);
      });
      ecModel.eachComponent('dataZoom', function(dataZoomModel) {
        var axisProxy = dataZoomModel.findRepresentativeAxisProxy();
        var percentRange = axisProxy.getDataPercentWindow();
        var valueRange = axisProxy.getDataValueWindow();
        dataZoomModel.setRawRange({
          start: percentRange[0],
          end: percentRange[1],
          startValue: valueRange[0],
          endValue: valueRange[1]
        });
      });
    });
    function resetSingleAxis(dimNames, axisIndex, dataZoomModel) {
      dataZoomModel.getAxisProxy(dimNames.name, axisIndex).reset(dataZoomModel);
    }
    function filterSingleAxis(dimNames, axisIndex, dataZoomModel) {
      dataZoomModel.getAxisProxy(dimNames.name, axisIndex).filterData(dataZoomModel);
    }
  });
})(require('process'));
