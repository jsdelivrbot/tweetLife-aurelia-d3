/* */ 
"format cjs";
define(function(require) {
  require('../../echarts').extendComponentModel({
    type: 'tooltip',
    defaultOption: {
      zlevel: 0,
      z: 8,
      show: true,
      showContent: true,
      trigger: 'item',
      triggerOn: 'mousemove',
      alwaysShowContent: false,
      confine: false,
      showDelay: 0,
      hideDelay: 100,
      transitionDuration: 0.4,
      enterable: false,
      backgroundColor: 'rgba(50,50,50,0.7)',
      borderColor: '#333',
      borderRadius: 4,
      borderWidth: 0,
      padding: 5,
      extraCssText: '',
      axisPointer: {
        type: 'line',
        axis: 'auto',
        animation: true,
        animationDurationUpdate: 200,
        animationEasingUpdate: 'exponentialOut',
        lineStyle: {
          color: '#555',
          width: 1,
          type: 'solid'
        },
        crossStyle: {
          color: '#555',
          width: 1,
          type: 'dashed',
          textStyle: {}
        },
        shadowStyle: {color: 'rgba(150,150,150,0.3)'}
      },
      textStyle: {
        color: '#fff',
        fontSize: 14
      }
    }
  });
});
