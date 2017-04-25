/* */ 
require('./tooltip/TooltipModel');
require('./tooltip/TooltipView');
require('../echarts').registerAction({
  type: 'showTip',
  event: 'showTip',
  update: 'tooltip:manuallyShowTip'
}, function() {});
require('../echarts').registerAction({
  type: 'hideTip',
  event: 'hideTip',
  update: 'tooltip:manuallyHideTip'
}, function() {});
