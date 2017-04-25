/* */ 
"format cjs";
define(function(require) {
  var polyHelper = require('../helper/poly');
  return require('../Path').extend({
    type: 'polygon',
    shape: {
      points: null,
      smooth: false,
      smoothConstraint: null
    },
    buildPath: function(ctx, shape) {
      polyHelper.buildPath(ctx, shape, true);
    }
  });
});
