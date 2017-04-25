/* */ 
"format cjs";
define(function(require) {
  return require('./MarkerModel').extend({
    type: 'markArea',
    defaultOption: {
      zlevel: 0,
      z: 1,
      tooltip: {trigger: 'item'},
      animation: false,
      label: {
        normal: {
          show: true,
          position: 'top'
        },
        emphasis: {
          show: true,
          position: 'top'
        }
      },
      itemStyle: {normal: {borderWidth: 0}}
    }
  });
});
