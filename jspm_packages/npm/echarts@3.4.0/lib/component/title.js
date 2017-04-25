/* */ 
'use strict';
var echarts = require('../echarts');
var graphic = require('../util/graphic');
var layout = require('../util/layout');
echarts.extendComponentModel({
  type: 'title',
  layoutMode: {
    type: 'box',
    ignoreSize: true
  },
  defaultOption: {
    zlevel: 0,
    z: 6,
    show: true,
    text: '',
    target: 'blank',
    subtext: '',
    subtarget: 'blank',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0)',
    borderColor: '#ccc',
    borderWidth: 0,
    padding: 5,
    itemGap: 10,
    textStyle: {
      fontSize: 18,
      fontWeight: 'bolder',
      color: '#333'
    },
    subtextStyle: {color: '#aaa'}
  }
});
echarts.extendComponentView({
  type: 'title',
  render: function(titleModel, ecModel, api) {
    this.group.removeAll();
    if (!titleModel.get('show')) {
      return;
    }
    var group = this.group;
    var textStyleModel = titleModel.getModel('textStyle');
    var subtextStyleModel = titleModel.getModel('subtextStyle');
    var textAlign = titleModel.get('textAlign');
    var textBaseline = titleModel.get('textBaseline');
    var textEl = new graphic.Text({
      style: {
        text: titleModel.get('text'),
        textFont: textStyleModel.getFont(),
        fill: textStyleModel.getTextColor()
      },
      z2: 10
    });
    var textRect = textEl.getBoundingRect();
    var subText = titleModel.get('subtext');
    var subTextEl = new graphic.Text({
      style: {
        text: subText,
        textFont: subtextStyleModel.getFont(),
        fill: subtextStyleModel.getTextColor(),
        y: textRect.height + titleModel.get('itemGap'),
        textBaseline: 'top'
      },
      z2: 10
    });
    var link = titleModel.get('link');
    var sublink = titleModel.get('sublink');
    textEl.silent = !link;
    subTextEl.silent = !sublink;
    if (link) {
      textEl.on('click', function() {
        window.open(link, '_' + titleModel.get('target'));
      });
    }
    if (sublink) {
      subTextEl.on('click', function() {
        window.open(sublink, '_' + titleModel.get('subtarget'));
      });
    }
    group.add(textEl);
    subText && group.add(subTextEl);
    var groupRect = group.getBoundingRect();
    var layoutOption = titleModel.getBoxLayoutParams();
    layoutOption.width = groupRect.width;
    layoutOption.height = groupRect.height;
    var layoutRect = layout.getLayoutRect(layoutOption, {
      width: api.getWidth(),
      height: api.getHeight()
    }, titleModel.get('padding'));
    if (!textAlign) {
      textAlign = titleModel.get('left') || titleModel.get('right');
      if (textAlign === 'middle') {
        textAlign = 'center';
      }
      if (textAlign === 'right') {
        layoutRect.x += layoutRect.width;
      } else if (textAlign === 'center') {
        layoutRect.x += layoutRect.width / 2;
      }
    }
    if (!textBaseline) {
      textBaseline = titleModel.get('top') || titleModel.get('bottom');
      if (textBaseline === 'center') {
        textBaseline = 'middle';
      }
      if (textBaseline === 'bottom') {
        layoutRect.y += layoutRect.height;
      } else if (textBaseline === 'middle') {
        layoutRect.y += layoutRect.height / 2;
      }
      textBaseline = textBaseline || 'top';
    }
    group.attr('position', [layoutRect.x, layoutRect.y]);
    var alignStyle = {
      textAlign: textAlign,
      textVerticalAlign: textBaseline
    };
    textEl.setStyle(alignStyle);
    subTextEl.setStyle(alignStyle);
    groupRect = group.getBoundingRect();
    var padding = layoutRect.margin;
    var style = titleModel.getItemStyle(['color', 'opacity']);
    style.fill = titleModel.get('backgroundColor');
    var rect = new graphic.Rect({
      shape: {
        x: groupRect.x - padding[3],
        y: groupRect.y - padding[0],
        width: groupRect.width + padding[1] + padding[3],
        height: groupRect.height + padding[0] + padding[2]
      },
      style: style,
      silent: true
    });
    graphic.subPixelOptimizeRect(rect);
    group.add(rect);
  }
});
