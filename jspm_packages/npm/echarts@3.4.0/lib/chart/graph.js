/* */ 
var echarts = require('../echarts');
var zrUtil = require('zrender/lib/core/util');
require('./graph/GraphSeries');
require('./graph/GraphView');
require('./graph/graphAction');
echarts.registerProcessor(require('./graph/categoryFilter'));
echarts.registerVisual(zrUtil.curry(require('../visual/symbol'), 'graph', 'circle', null));
echarts.registerVisual(require('./graph/categoryVisual'));
echarts.registerVisual(require('./graph/edgeVisual'));
echarts.registerLayout(require('./graph/simpleLayout'));
echarts.registerLayout(require('./graph/circularLayout'));
echarts.registerLayout(require('./graph/forceLayout'));
echarts.registerCoordinateSystem('graphView', {create: require('./graph/createView')});
