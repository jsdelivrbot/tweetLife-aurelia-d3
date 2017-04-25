/* */ 
var getBarItemStyle = require('../../model/mixin/makeStyleMapper')([['fill', 'color'], ['stroke', 'borderColor'], ['lineWidth', 'borderWidth'], ['stroke', 'barBorderColor'], ['lineWidth', 'barBorderWidth'], ['opacity'], ['shadowBlur'], ['shadowOffsetX'], ['shadowOffsetY'], ['shadowColor']]);
module.exports = {getBarItemStyle: function(excludes) {
    var style = getBarItemStyle.call(this, excludes);
    if (this.getBorderLineDash) {
      var lineDash = this.getBorderLineDash();
      lineDash && (style.lineDash = lineDash);
    }
    return style;
  }};
