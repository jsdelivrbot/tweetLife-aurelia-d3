/* */ 
"format cjs";
define(function(require) {
  var VisualMapModel = require('./VisualMapModel');
  var zrUtil = require('zrender/core/util');
  var VisualMapping = require('../../visual/VisualMapping');
  var visualDefault = require('../../visual/visualDefault');
  var reformIntervals = require('../../util/number').reformIntervals;
  var PiecewiseModel = VisualMapModel.extend({
    type: 'visualMap.piecewise',
    defaultOption: {
      selected: null,
      minOpen: false,
      maxOpen: false,
      align: 'auto',
      itemWidth: 20,
      itemHeight: 14,
      itemSymbol: 'roundRect',
      pieceList: null,
      categories: null,
      splitNumber: 5,
      selectedMode: 'multiple',
      itemGap: 10,
      hoverLink: true,
      showLabel: null
    },
    optionUpdated: function(newOption, isInit) {
      PiecewiseModel.superApply(this, 'optionUpdated', arguments);
      this._pieceList = [];
      this.resetTargetSeries();
      this.resetExtent();
      var mode = this._mode = this._determineMode();
      resetMethods[this._mode].call(this);
      this._resetSelected(newOption, isInit);
      var categories = this.option.categories;
      this.resetVisual(function(mappingOption, state) {
        if (mode === 'categories') {
          mappingOption.mappingMethod = 'category';
          mappingOption.categories = zrUtil.clone(categories);
        } else {
          mappingOption.dataExtent = this.getExtent();
          mappingOption.mappingMethod = 'piecewise';
          mappingOption.pieceList = zrUtil.map(this._pieceList, function(piece) {
            var piece = zrUtil.clone(piece);
            if (state !== 'inRange') {
              piece.visual = null;
            }
            return piece;
          });
        }
      });
    },
    completeVisualOption: function() {
      var option = this.option;
      var visualTypesInPieces = {};
      var visualTypes = VisualMapping.listVisualTypes();
      var isCategory = this.isCategory();
      zrUtil.each(option.pieces, function(piece) {
        zrUtil.each(visualTypes, function(visualType) {
          if (piece.hasOwnProperty(visualType)) {
            visualTypesInPieces[visualType] = 1;
          }
        });
      });
      zrUtil.each(visualTypesInPieces, function(v, visualType) {
        var exists = 0;
        zrUtil.each(this.stateList, function(state) {
          exists |= has(option, state, visualType) || has(option.target, state, visualType);
        }, this);
        !exists && zrUtil.each(this.stateList, function(state) {
          (option[state] || (option[state] = {}))[visualType] = visualDefault.get(visualType, state === 'inRange' ? 'active' : 'inactive', isCategory);
        });
      }, this);
      function has(obj, state, visualType) {
        return obj && obj[state] && (zrUtil.isObject(obj[state]) ? obj[state].hasOwnProperty(visualType) : obj[state] === visualType);
      }
      VisualMapModel.prototype.completeVisualOption.apply(this, arguments);
    },
    _resetSelected: function(newOption, isInit) {
      var thisOption = this.option;
      var pieceList = this._pieceList;
      var selected = (isInit ? thisOption : newOption).selected || {};
      thisOption.selected = selected;
      zrUtil.each(pieceList, function(piece, index) {
        var key = this.getSelectedMapKey(piece);
        if (!selected.hasOwnProperty(key)) {
          selected[key] = true;
        }
      }, this);
      if (thisOption.selectedMode === 'single') {
        var hasSel = false;
        zrUtil.each(pieceList, function(piece, index) {
          var key = this.getSelectedMapKey(piece);
          if (selected[key]) {
            hasSel ? (selected[key] = false) : (hasSel = true);
          }
        }, this);
      }
    },
    getSelectedMapKey: function(piece) {
      return this._mode === 'categories' ? piece.value + '' : piece.index + '';
    },
    getPieceList: function() {
      return this._pieceList;
    },
    _determineMode: function() {
      var option = this.option;
      return option.pieces && option.pieces.length > 0 ? 'pieces' : this.option.categories ? 'categories' : 'splitNumber';
    },
    setSelected: function(selected) {
      this.option.selected = zrUtil.clone(selected);
    },
    getValueState: function(value) {
      var index = VisualMapping.findPieceIndex(value, this._pieceList);
      return index != null ? (this.option.selected[this.getSelectedMapKey(this._pieceList[index])] ? 'inRange' : 'outOfRange') : 'outOfRange';
    },
    findTargetDataIndices: function(pieceIndex) {
      var result = [];
      this.eachTargetSeries(function(seriesModel) {
        var dataIndices = [];
        var data = seriesModel.getData();
        data.each(this.getDataDimension(data), function(value, dataIndex) {
          var pIdx = VisualMapping.findPieceIndex(value, this._pieceList);
          pIdx === pieceIndex && dataIndices.push(dataIndex);
        }, true, this);
        result.push({
          seriesId: seriesModel.id,
          dataIndex: dataIndices
        });
      }, this);
      return result;
    },
    getRepresentValue: function(piece) {
      var representValue;
      if (this.isCategory()) {
        representValue = piece.value;
      } else {
        if (piece.value != null) {
          representValue = piece.value;
        } else {
          var pieceInterval = piece.interval || [];
          representValue = (pieceInterval[0] === -Infinity && pieceInterval[1] === Infinity) ? 0 : (pieceInterval[0] + pieceInterval[1]) / 2;
        }
      }
      return representValue;
    },
    getVisualMeta: function(getColorVisual) {
      if (this.isCategory()) {
        return;
      }
      var stops = [];
      var outerColors = [];
      var visualMapModel = this;
      function setStop(interval, valueState) {
        var representValue = visualMapModel.getRepresentValue({interval: interval});
        if (!valueState) {
          valueState = visualMapModel.getValueState(representValue);
        }
        var color = getColorVisual(representValue, valueState);
        if (interval[0] === -Infinity) {
          outerColors[0] = color;
        } else if (interval[1] === Infinity) {
          outerColors[1] = color;
        } else {
          stops.push({
            value: interval[0],
            color: color
          }, {
            value: interval[1],
            color: color
          });
        }
      }
      var pieceList = this._pieceList.slice();
      if (!pieceList.length) {
        pieceList.push({interval: [-Infinity, Infinity]});
      } else {
        var edge = pieceList[0].interval[0];
        edge !== -Infinity && pieceList.unshift({interval: [-Infinity, edge]});
        edge = pieceList[pieceList.length - 1].interval[1];
        edge !== Infinity && pieceList.push({interval: [edge, Infinity]});
      }
      var curr = -Infinity;
      zrUtil.each(pieceList, function(piece) {
        var interval = piece.interval;
        if (interval) {
          interval[0] > curr && setStop([curr, interval[0]], 'outOfRange');
          setStop(interval.slice());
          curr = interval[1];
        }
      }, this);
      return {
        stops: stops,
        outerColors: outerColors
      };
    }
  });
  var resetMethods = {
    splitNumber: function() {
      var thisOption = this.option;
      var pieceList = this._pieceList;
      var precision = thisOption.precision;
      var dataExtent = this.getExtent();
      var splitNumber = thisOption.splitNumber;
      splitNumber = Math.max(parseInt(splitNumber, 10), 1);
      thisOption.splitNumber = splitNumber;
      var splitStep = (dataExtent[1] - dataExtent[0]) / splitNumber;
      while (+splitStep.toFixed(precision) !== splitStep && precision < 5) {
        precision++;
      }
      thisOption.precision = precision;
      splitStep = +splitStep.toFixed(precision);
      var index = 0;
      if (thisOption.minOpen) {
        pieceList.push({
          index: index++,
          interval: [-Infinity, dataExtent[0]],
          close: [0, 0]
        });
      }
      for (var curr = dataExtent[0],
          len = index + splitNumber; index < len; curr += splitStep) {
        var max = index === splitNumber - 1 ? dataExtent[1] : (curr + splitStep);
        pieceList.push({
          index: index++,
          interval: [curr, max],
          close: [1, 1]
        });
      }
      if (thisOption.maxOpen) {
        pieceList.push({
          index: index++,
          interval: [dataExtent[1], Infinity],
          close: [0, 0]
        });
      }
      reformIntervals(pieceList);
      zrUtil.each(pieceList, function(piece) {
        piece.text = this.formatValueText(piece.interval);
      }, this);
    },
    categories: function() {
      var thisOption = this.option;
      zrUtil.each(thisOption.categories, function(cate) {
        this._pieceList.push({
          text: this.formatValueText(cate, true),
          value: cate
        });
      }, this);
      normalizeReverse(thisOption, this._pieceList);
    },
    pieces: function() {
      var thisOption = this.option;
      var pieceList = this._pieceList;
      zrUtil.each(thisOption.pieces, function(pieceListItem, index) {
        if (!zrUtil.isObject(pieceListItem)) {
          pieceListItem = {value: pieceListItem};
        }
        var item = {
          text: '',
          index: index
        };
        if (pieceListItem.label != null) {
          item.text = pieceListItem.label;
        }
        if (pieceListItem.hasOwnProperty('value')) {
          var value = item.value = pieceListItem.value;
          item.interval = [value, value];
          item.close = [1, 1];
        } else {
          var interval = item.interval = [];
          var close = item.close = [0, 0];
          var closeList = [1, 0, 1];
          var infinityList = [-Infinity, Infinity];
          var useMinMax = [];
          for (var lg = 0; lg < 2; lg++) {
            var names = [['gte', 'gt', 'min'], ['lte', 'lt', 'max']][lg];
            for (var i = 0; i < 3 && interval[lg] == null; i++) {
              interval[lg] = pieceListItem[names[i]];
              close[lg] = closeList[i];
              useMinMax[lg] = i === 2;
            }
            interval[lg] == null && (interval[lg] = infinityList[lg]);
          }
          useMinMax[0] && interval[1] === Infinity && (close[0] = 0);
          useMinMax[1] && interval[0] === -Infinity && (close[1] = 0);
          if (__DEV__) {
            if (interval[0] > interval[1]) {
              console.warn('Piece ' + index + 'is illegal: ' + interval + ' lower bound should not greater then uppper bound.');
            }
          }
          if (interval[0] === interval[1] && close[0] && close[1]) {
            item.value = interval[0];
          }
        }
        item.visual = VisualMapping.retrieveVisuals(pieceListItem);
        pieceList.push(item);
      }, this);
      normalizeReverse(thisOption, pieceList);
      reformIntervals(pieceList);
      zrUtil.each(pieceList, function(piece) {
        var close = piece.close;
        var edgeSymbols = [['<', '≤'][close[1]], ['>', '≥'][close[0]]];
        piece.text = piece.text || this.formatValueText(piece.value != null ? piece.value : piece.interval, false, edgeSymbols);
      }, this);
    }
  };
  function normalizeReverse(thisOption, pieceList) {
    var inverse = thisOption.inverse;
    if (thisOption.orient === 'vertical' ? !inverse : inverse) {
      pieceList.reverse();
    }
  }
  return PiecewiseModel;
});
