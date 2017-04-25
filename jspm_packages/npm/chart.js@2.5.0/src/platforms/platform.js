/* */ 
'use strict';
var implementation = require('./platform.dom');
module.exports = function(Chart) {
  Chart.platform = {
    acquireContext: function() {},
    releaseContext: function() {},
    addEventListener: function() {},
    removeEventListener: function() {}
  };
  Chart.helpers.extend(Chart.platform, implementation(Chart));
};
