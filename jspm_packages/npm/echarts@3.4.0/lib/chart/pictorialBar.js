/* */ 
var zrUtil = require('zrender/lib/core/util');
require('../coord/cartesian/Grid');
require('./bar/PictorialBarSeries');
require('./bar/PictorialBarView');
var barLayoutGrid = require('../layout/barGrid');
var echarts = require('../echarts');
echarts.registerLayout(zrUtil.curry(barLayoutGrid, 'pictorialBar'));
echarts.registerVisual(zrUtil.curry(require('../visual/symbol'), 'pictorialBar', 'roundRect', null));
require('../component/grid');
