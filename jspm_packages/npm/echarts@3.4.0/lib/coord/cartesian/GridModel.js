/* */ 
'use strict';
require('./AxisModel');
var ComponentModel = require('../../model/Component');
module.exports = ComponentModel.extend({
  type: 'grid',
  dependencies: ['xAxis', 'yAxis'],
  layoutMode: 'box',
  coordinateSystem: null,
  defaultOption: {
    show: false,
    zlevel: 0,
    z: 0,
    left: '10%',
    top: 60,
    right: '10%',
    bottom: 60,
    containLabel: false,
    backgroundColor: 'rgba(0,0,0,0)',
    borderWidth: 1,
    borderColor: '#ccc'
  }
});
