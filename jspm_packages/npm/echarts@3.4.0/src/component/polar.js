/* */ 
"format cjs";
define(function(require) {
  'use strict';
  require('../coord/polar/polarCreator');
  require('./angleAxis');
  require('./radiusAxis');
  require('../echarts').extendComponentView({type: 'polar'});
});
