/* */ 
"format cjs";
define(function(require) {
  return require('./MarkerModel').extend({
    type: 'markPoint',
    defaultOption: {
      zlevel: 0,
      z: 5,
      symbol: 'pin',
      symbolSize: 50,
      tooltip: {trigger: 'item'},
      label: {
        normal: {
          show: true,
          position: 'inside'
        },
        emphasis: {show: true}
      },
      itemStyle: {normal: {borderWidth: 2}}
    }
  });
});
