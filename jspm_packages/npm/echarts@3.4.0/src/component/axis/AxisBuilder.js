/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var zrUtil = require('zrender/core/util');
    var formatUtil = require('../../util/format');
    var graphic = require('../../util/graphic');
    var Model = require('../../model/Model');
    var numberUtil = require('../../util/number');
    var remRadian = numberUtil.remRadian;
    var isRadianAroundZero = numberUtil.isRadianAroundZero;
    var vec2 = require('zrender/core/vector');
    var v2ApplyTransform = vec2.applyTransform;
    var retrieve = zrUtil.retrieve;
    var PI = Math.PI;
    function makeAxisEventDataBase(axisModel) {
      var eventData = {componentType: axisModel.mainType};
      eventData[axisModel.mainType + 'Index'] = axisModel.componentIndex;
      return eventData;
    }
    var AxisBuilder = function(axisModel, opt) {
      this.opt = opt;
      this.axisModel = axisModel;
      zrUtil.defaults(opt, {
        labelOffset: 0,
        nameDirection: 1,
        tickDirection: 1,
        labelDirection: 1,
        silent: true
      });
      this.group = new graphic.Group();
      var dumbGroup = new graphic.Group({
        position: opt.position.slice(),
        rotation: opt.rotation
      });
      dumbGroup.updateTransform();
      this._transform = dumbGroup.transform;
      this._dumbGroup = dumbGroup;
    };
    AxisBuilder.prototype = {
      constructor: AxisBuilder,
      hasBuilder: function(name) {
        return !!builders[name];
      },
      add: function(name) {
        builders[name].call(this);
      },
      getGroup: function() {
        return this.group;
      }
    };
    var builders = {
      axisLine: function() {
        var opt = this.opt;
        var axisModel = this.axisModel;
        if (!axisModel.get('axisLine.show')) {
          return;
        }
        var extent = this.axisModel.axis.getExtent();
        var matrix = this._transform;
        var pt1 = [extent[0], 0];
        var pt2 = [extent[1], 0];
        if (matrix) {
          v2ApplyTransform(pt1, pt1, matrix);
          v2ApplyTransform(pt2, pt2, matrix);
        }
        this.group.add(new graphic.Line(graphic.subPixelOptimizeLine({
          anid: 'line',
          shape: {
            x1: pt1[0],
            y1: pt1[1],
            x2: pt2[0],
            y2: pt2[1]
          },
          style: zrUtil.extend({lineCap: 'round'}, axisModel.getModel('axisLine.lineStyle').getLineStyle()),
          strokeContainThreshold: opt.strokeContainThreshold || 5,
          silent: true,
          z2: 1
        })));
      },
      axisTick: function() {
        var axisModel = this.axisModel;
        var axis = axisModel.axis;
        if (!axisModel.get('axisTick.show') || axis.isBlank()) {
          return;
        }
        var tickModel = axisModel.getModel('axisTick');
        var opt = this.opt;
        var lineStyleModel = tickModel.getModel('lineStyle');
        var tickLen = tickModel.get('length');
        var tickInterval = getInterval(tickModel, opt.labelInterval);
        var ticksCoords = axis.getTicksCoords(tickModel.get('alignWithLabel'));
        var ticks = axis.scale.getTicks();
        var pt1 = [];
        var pt2 = [];
        var matrix = this._transform;
        for (var i = 0; i < ticksCoords.length; i++) {
          if (ifIgnoreOnTick(axis, i, tickInterval)) {
            continue;
          }
          var tickCoord = ticksCoords[i];
          pt1[0] = tickCoord;
          pt1[1] = 0;
          pt2[0] = tickCoord;
          pt2[1] = opt.tickDirection * tickLen;
          if (matrix) {
            v2ApplyTransform(pt1, pt1, matrix);
            v2ApplyTransform(pt2, pt2, matrix);
          }
          this.group.add(new graphic.Line(graphic.subPixelOptimizeLine({
            anid: 'tick_' + ticks[i],
            shape: {
              x1: pt1[0],
              y1: pt1[1],
              x2: pt2[0],
              y2: pt2[1]
            },
            style: zrUtil.defaults(lineStyleModel.getLineStyle(), {stroke: axisModel.get('axisLine.lineStyle.color')}),
            z2: 2,
            silent: true
          })));
        }
      },
      axisLabel: function() {
        var opt = this.opt;
        var axisModel = this.axisModel;
        var axis = axisModel.axis;
        var show = retrieve(opt.axisLabelShow, axisModel.get('axisLabel.show'));
        if (!show || axis.isBlank()) {
          return;
        }
        var labelModel = axisModel.getModel('axisLabel');
        var textStyleModel = labelModel.getModel('textStyle');
        var labelMargin = labelModel.get('margin');
        var ticks = axis.scale.getTicks();
        var labels = axisModel.getFormattedLabels();
        var labelRotation = retrieve(opt.labelRotation, labelModel.get('rotate')) || 0;
        labelRotation = labelRotation * PI / 180;
        var labelLayout = innerTextLayout(opt, labelRotation, opt.labelDirection);
        var categoryData = axisModel.get('data');
        var textEls = [];
        var silent = isSilent(axisModel);
        var triggerEvent = axisModel.get('triggerEvent');
        zrUtil.each(ticks, function(tickVal, index) {
          if (ifIgnoreOnTick(axis, index, opt.labelInterval)) {
            return;
          }
          var itemTextStyleModel = textStyleModel;
          if (categoryData && categoryData[tickVal] && categoryData[tickVal].textStyle) {
            itemTextStyleModel = new Model(categoryData[tickVal].textStyle, textStyleModel, axisModel.ecModel);
          }
          var textColor = itemTextStyleModel.getTextColor() || axisModel.get('axisLine.lineStyle.color');
          var tickCoord = axis.dataToCoord(tickVal);
          var pos = [tickCoord, opt.labelOffset + opt.labelDirection * labelMargin];
          var labelBeforeFormat = axis.scale.getLabel(tickVal);
          var textEl = new graphic.Text({
            anid: 'label_' + tickVal,
            style: {
              text: labels[index],
              textAlign: itemTextStyleModel.get('align', true) || labelLayout.textAlign,
              textVerticalAlign: itemTextStyleModel.get('baseline', true) || labelLayout.verticalAlign,
              textFont: itemTextStyleModel.getFont(),
              fill: typeof textColor === 'function' ? textColor(labelBeforeFormat) : textColor
            },
            position: pos,
            rotation: labelLayout.rotation,
            silent: silent,
            z2: 10
          });
          if (triggerEvent) {
            textEl.eventData = makeAxisEventDataBase(axisModel);
            textEl.eventData.targetType = 'axisLabel';
            textEl.eventData.value = labelBeforeFormat;
          }
          this._dumbGroup.add(textEl);
          textEl.updateTransform();
          textEls.push(textEl);
          this.group.add(textEl);
          textEl.decomposeTransform();
        }, this);
        function isTwoLabelOverlapped(current, next) {
          var firstRect = current && current.getBoundingRect().clone();
          var nextRect = next && next.getBoundingRect().clone();
          if (firstRect && nextRect) {
            firstRect.applyTransform(current.getLocalTransform());
            nextRect.applyTransform(next.getLocalTransform());
            return firstRect.intersect(nextRect);
          }
        }
        if (axisModel.getMin() != null) {
          var firstLabel = textEls[0];
          var nextLabel = textEls[1];
          if (isTwoLabelOverlapped(firstLabel, nextLabel)) {
            firstLabel.ignore = true;
          }
        }
        if (axisModel.getMax() != null) {
          var lastLabel = textEls[textEls.length - 1];
          var prevLabel = textEls[textEls.length - 2];
          if (isTwoLabelOverlapped(prevLabel, lastLabel)) {
            lastLabel.ignore = true;
          }
        }
      },
      axisName: function() {
        var opt = this.opt;
        var axisModel = this.axisModel;
        var name = retrieve(opt.axisName, axisModel.get('name'));
        if (!name) {
          return;
        }
        var nameLocation = axisModel.get('nameLocation');
        var nameDirection = opt.nameDirection;
        var textStyleModel = axisModel.getModel('nameTextStyle');
        var gap = axisModel.get('nameGap') || 0;
        var extent = this.axisModel.axis.getExtent();
        var gapSignal = extent[0] > extent[1] ? -1 : 1;
        var pos = [nameLocation === 'start' ? extent[0] - gapSignal * gap : nameLocation === 'end' ? extent[1] + gapSignal * gap : (extent[0] + extent[1]) / 2, nameLocation === 'middle' ? opt.labelOffset + nameDirection * gap : 0];
        var labelLayout;
        var nameRotation = axisModel.get('nameRotate');
        if (nameRotation != null) {
          nameRotation = nameRotation * PI / 180;
        }
        var axisNameAvailableWidth;
        if (nameLocation === 'middle') {
          labelLayout = innerTextLayout(opt, nameRotation != null ? nameRotation : opt.rotation, nameDirection);
        } else {
          labelLayout = endTextLayout(opt, nameLocation, nameRotation || 0, extent);
          axisNameAvailableWidth = opt.axisNameAvailableWidth;
          if (axisNameAvailableWidth != null) {
            axisNameAvailableWidth = Math.abs(axisNameAvailableWidth / Math.sin(labelLayout.rotation));
            !isFinite(axisNameAvailableWidth) && (axisNameAvailableWidth = null);
          }
        }
        var textFont = textStyleModel.getFont();
        var truncateOpt = axisModel.get('nameTruncate', true) || {};
        var ellipsis = truncateOpt.ellipsis;
        var maxWidth = retrieve(truncateOpt.maxWidth, axisNameAvailableWidth);
        var truncatedText = (ellipsis != null && maxWidth != null) ? formatUtil.truncateText(name, maxWidth, textFont, ellipsis, {
          minChar: 2,
          placeholder: truncateOpt.placeholder
        }) : name;
        var tooltipOpt = axisModel.get('tooltip', true);
        var mainType = axisModel.mainType;
        var formatterParams = {
          componentType: mainType,
          name: name,
          $vars: ['name']
        };
        formatterParams[mainType + 'Index'] = axisModel.componentIndex;
        var textEl = new graphic.Text({
          anid: 'name',
          __fullText: name,
          __truncatedText: truncatedText,
          style: {
            text: truncatedText,
            textFont: textFont,
            fill: textStyleModel.getTextColor() || axisModel.get('axisLine.lineStyle.color'),
            textAlign: labelLayout.textAlign,
            textVerticalAlign: labelLayout.verticalAlign
          },
          position: pos,
          rotation: labelLayout.rotation,
          silent: isSilent(axisModel),
          z2: 1,
          tooltip: (tooltipOpt && tooltipOpt.show) ? zrUtil.extend({
            content: name,
            formatter: function() {
              return name;
            },
            formatterParams: formatterParams
          }, tooltipOpt) : null
        });
        if (axisModel.get('triggerEvent')) {
          textEl.eventData = makeAxisEventDataBase(axisModel);
          textEl.eventData.targetType = 'axisName';
          textEl.eventData.name = name;
        }
        this._dumbGroup.add(textEl);
        textEl.updateTransform();
        this.group.add(textEl);
        textEl.decomposeTransform();
      }
    };
    function innerTextLayout(opt, textRotation, direction) {
      var rotationDiff = remRadian(textRotation - opt.rotation);
      var textAlign;
      var verticalAlign;
      if (isRadianAroundZero(rotationDiff)) {
        verticalAlign = direction > 0 ? 'top' : 'bottom';
        textAlign = 'center';
      } else if (isRadianAroundZero(rotationDiff - PI)) {
        verticalAlign = direction > 0 ? 'bottom' : 'top';
        textAlign = 'center';
      } else {
        verticalAlign = 'middle';
        if (rotationDiff > 0 && rotationDiff < PI) {
          textAlign = direction > 0 ? 'right' : 'left';
        } else {
          textAlign = direction > 0 ? 'left' : 'right';
        }
      }
      return {
        rotation: rotationDiff,
        textAlign: textAlign,
        verticalAlign: verticalAlign
      };
    }
    function endTextLayout(opt, textPosition, textRotate, extent) {
      var rotationDiff = remRadian(textRotate - opt.rotation);
      var textAlign;
      var verticalAlign;
      var inverse = extent[0] > extent[1];
      var onLeft = (textPosition === 'start' && !inverse) || (textPosition !== 'start' && inverse);
      if (isRadianAroundZero(rotationDiff - PI / 2)) {
        verticalAlign = onLeft ? 'bottom' : 'top';
        textAlign = 'center';
      } else if (isRadianAroundZero(rotationDiff - PI * 1.5)) {
        verticalAlign = onLeft ? 'top' : 'bottom';
        textAlign = 'center';
      } else {
        verticalAlign = 'middle';
        if (rotationDiff < PI * 1.5 && rotationDiff > PI / 2) {
          textAlign = onLeft ? 'left' : 'right';
        } else {
          textAlign = onLeft ? 'right' : 'left';
        }
      }
      return {
        rotation: rotationDiff,
        textAlign: textAlign,
        verticalAlign: verticalAlign
      };
    }
    function isSilent(axisModel) {
      var tooltipOpt = axisModel.get('tooltip');
      return axisModel.get('silent') || !(axisModel.get('triggerEvent') || (tooltipOpt && tooltipOpt.show));
    }
    var ifIgnoreOnTick = AxisBuilder.ifIgnoreOnTick = function(axis, i, interval) {
      var rawTick;
      var scale = axis.scale;
      return scale.type === 'ordinal' && (typeof interval === 'function' ? (rawTick = scale.getTicks()[i], !interval(rawTick, scale.getLabel(rawTick))) : i % (interval + 1));
    };
    var getInterval = AxisBuilder.getInterval = function(model, labelInterval) {
      var interval = model.get('interval');
      if (interval == null || interval == 'auto') {
        interval = labelInterval;
      }
      return interval;
    };
    return AxisBuilder;
  });
})(require('process'));
