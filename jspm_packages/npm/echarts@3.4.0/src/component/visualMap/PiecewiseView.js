/* */ 
"format cjs";
define(function(require) {
  var VisualMapView = require('./VisualMapView');
  var zrUtil = require('zrender/core/util');
  var graphic = require('../../util/graphic');
  var symbolCreators = require('../../util/symbol');
  var layout = require('../../util/layout');
  var helper = require('./helper');
  var PiecewiseVisualMapView = VisualMapView.extend({
    type: 'visualMap.piecewise',
    doRender: function() {
      var thisGroup = this.group;
      thisGroup.removeAll();
      var visualMapModel = this.visualMapModel;
      var textGap = visualMapModel.get('textGap');
      var textStyleModel = visualMapModel.textStyleModel;
      var textFont = textStyleModel.getFont();
      var textFill = textStyleModel.getTextColor();
      var itemAlign = this._getItemAlign();
      var itemSize = visualMapModel.itemSize;
      var viewData = this._getViewData();
      var endsText = viewData.endsText;
      var showLabel = zrUtil.retrieve(visualMapModel.get('showLabel', true), !endsText);
      endsText && this._renderEndsText(thisGroup, endsText[0], itemSize, showLabel, itemAlign);
      zrUtil.each(viewData.viewPieceList, renderItem, this);
      endsText && this._renderEndsText(thisGroup, endsText[1], itemSize, showLabel, itemAlign);
      layout.box(visualMapModel.get('orient'), thisGroup, visualMapModel.get('itemGap'));
      this.renderBackground(thisGroup);
      this.positionGroup(thisGroup);
      function renderItem(item) {
        var piece = item.piece;
        var itemGroup = new graphic.Group();
        itemGroup.onclick = zrUtil.bind(this._onItemClick, this, piece);
        this._enableHoverLink(itemGroup, item.indexInModelPieceList);
        var representValue = visualMapModel.getRepresentValue(piece);
        this._createItemSymbol(itemGroup, representValue, [0, 0, itemSize[0], itemSize[1]]);
        if (showLabel) {
          var visualState = this.visualMapModel.getValueState(representValue);
          itemGroup.add(new graphic.Text({style: {
              x: itemAlign === 'right' ? -textGap : itemSize[0] + textGap,
              y: itemSize[1] / 2,
              text: piece.text,
              textVerticalAlign: 'middle',
              textAlign: itemAlign,
              textFont: textFont,
              fill: textFill,
              opacity: visualState === 'outOfRange' ? 0.5 : 1
            }}));
        }
        thisGroup.add(itemGroup);
      }
    },
    _enableHoverLink: function(itemGroup, pieceIndex) {
      itemGroup.on('mouseover', zrUtil.bind(onHoverLink, this, 'highlight')).on('mouseout', zrUtil.bind(onHoverLink, this, 'downplay'));
      function onHoverLink(method) {
        var visualMapModel = this.visualMapModel;
        visualMapModel.option.hoverLink && this.api.dispatchAction({
          type: method,
          batch: helper.convertDataIndex(visualMapModel.findTargetDataIndices(pieceIndex))
        });
      }
    },
    _getItemAlign: function() {
      var visualMapModel = this.visualMapModel;
      var modelOption = visualMapModel.option;
      if (modelOption.orient === 'vertical') {
        return helper.getItemAlign(visualMapModel, this.api, visualMapModel.itemSize);
      } else {
        var align = modelOption.align;
        if (!align || align === 'auto') {
          align = 'left';
        }
        return align;
      }
    },
    _renderEndsText: function(group, text, itemSize, showLabel, itemAlign) {
      if (!text) {
        return;
      }
      var itemGroup = new graphic.Group();
      var textStyleModel = this.visualMapModel.textStyleModel;
      itemGroup.add(new graphic.Text({style: {
          x: showLabel ? (itemAlign === 'right' ? itemSize[0] : 0) : itemSize[0] / 2,
          y: itemSize[1] / 2,
          textVerticalAlign: 'middle',
          textAlign: showLabel ? itemAlign : 'center',
          text: text,
          textFont: textStyleModel.getFont(),
          fill: textStyleModel.getTextColor()
        }}));
      group.add(itemGroup);
    },
    _getViewData: function() {
      var visualMapModel = this.visualMapModel;
      var viewPieceList = zrUtil.map(visualMapModel.getPieceList(), function(piece, index) {
        return {
          piece: piece,
          indexInModelPieceList: index
        };
      });
      var endsText = visualMapModel.get('text');
      var orient = visualMapModel.get('orient');
      var inverse = visualMapModel.get('inverse');
      if (orient === 'horizontal' ? inverse : !inverse) {
        viewPieceList.reverse();
      } else if (endsText) {
        endsText = endsText.slice().reverse();
      }
      return {
        viewPieceList: viewPieceList,
        endsText: endsText
      };
    },
    _createItemSymbol: function(group, representValue, shapeParam) {
      group.add(symbolCreators.createSymbol(this.getControllerVisual(representValue, 'symbol'), shapeParam[0], shapeParam[1], shapeParam[2], shapeParam[3], this.getControllerVisual(representValue, 'color')));
    },
    _onItemClick: function(piece) {
      var visualMapModel = this.visualMapModel;
      var option = visualMapModel.option;
      var selected = zrUtil.clone(option.selected);
      var newKey = visualMapModel.getSelectedMapKey(piece);
      if (option.selectedMode === 'single') {
        selected[newKey] = true;
        zrUtil.each(selected, function(o, key) {
          selected[key] = key === newKey;
        });
      } else {
        selected[newKey] = !selected[newKey];
      }
      this.api.dispatchAction({
        type: 'selectDataRange',
        from: this.uid,
        visualMapId: this.visualMapModel.id,
        selected: selected
      });
    }
  });
  return PiecewiseVisualMapView;
});
