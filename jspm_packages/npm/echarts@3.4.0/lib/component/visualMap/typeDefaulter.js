/* */ 
require('../../model/Component').registerSubTypeDefaulter('visualMap', function(option) {
  return (!option.categories && (!(option.pieces ? option.pieces.length > 0 : option.splitNumber > 0) || option.calculable)) ? 'continuous' : 'piecewise';
});
