/* */ 
var zrUtil = require('zrender/lib/core/util');
var echarts = require('../echarts');
require('./scatter/ScatterSeries');
require('./scatter/ScatterView');
echarts.registerVisual(zrUtil.curry(require('../visual/symbol'), 'scatter', 'circle', null));
echarts.registerLayout(zrUtil.curry(require('../layout/points'), 'scatter'));
require('../component/grid');
