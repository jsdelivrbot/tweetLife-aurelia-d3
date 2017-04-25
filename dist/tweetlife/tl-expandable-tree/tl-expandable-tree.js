'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TlExpandableTree = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3;

var _aureliaFramework = require('aurelia-framework');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _d = require('d3');

var d3 = _interopRequireWildcard(_d);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _cbkit = require('pg/cbkit');

var _aureliaEventAggregator = require('aurelia-event-aggregator');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var treeContainerWidth = 800;
var treeContainerHeight = 600;

var TlExpandableTree = exports.TlExpandableTree = (_dec = (0, _aureliaFramework.customElement)('tl-expandable-tree'), _dec2 = (0, _aureliaFramework.inject)(_cbkit.CbkitDialogService, _aureliaEventAggregator.EventAggregator), _dec(_class = _dec2(_class = (_class2 = function () {
  function TlExpandableTree(CbkitDialogService, EventAggregator) {
    var _this = this;

    _classCallCheck(this, TlExpandableTree);

    _initDefineProp(this, 'data', _descriptor, this);

    _initDefineProp(this, 'loading', _descriptor2, this);

    _initDefineProp(this, 'defaultView', _descriptor3, this);

    this.transX = 0;
    this.transY = 0;
    this.treeSize = {};

    this.hoverCard = function () {
      clearTimeout(_this.hideCardTimeout);
    };

    this.outCard = function () {
      _this.hideCardTimeout = setTimeout(function () {
        (0, _jquery2.default)(".cardHoverView").addClass('hide');
      }, 200);
    };

    this.clickTreeNode = function (model) {
      _this.CbkitDialogService.openRecordDetail(model);
    };

    this.CbkitDialogService = CbkitDialogService;
    this.timeline = '';
    this.showPause = false;
    this.timelineData = [];
    this.playPoint = 0;
    this.allowedPlay = false;
    this.eventAggregator = EventAggregator;

    this.startColor = d3.rgb(182, 208, 255);
    this.endColor = d3.rgb(0, 44, 123);
    this.computeColor = d3.interpolate(this.startColor, this.endColor);
  }

  TlExpandableTree.prototype.attached = function attached() {
    var _this2 = this;

    this._attached = true;
    this.mouseDown = false;
    this.startPoint = { x: 0, y: 0 };
    this.endPoint = { x: 0, y: 0 };

    this.drag = d3.behavior.drag().on("dragstart", function () {
      _this2.startPoint.x = _d.event.sourceEvent.layerX;
      _this2.startPoint.y = _d.event.sourceEvent.layerY;
    }).on("drag", function () {
      _this2.dragmove();
    });

    d3.select(this.svgContainer).call(this.drag);

    this.treeSvg = d3.select(".svgTree");
    this.svgTreeGroup = this.treeSvg.append("svg:g").attr("class", "innerGroup");
    this.svgLinkGroup = this.treeSvg.append("svg:g").attr("class", "links").attr("transform", 'translate(100, 0)');
    this.svgCircleGroup = this.treeSvg.append("svg:g").attr("class", "node").attr("transform", 'translate(100, 0)');

    this.diagonal = d3.svg.diagonal().projection(function (d) {
      return [d.y, d.x];
    });
    this.durationTime = _d.event && _d.event.altKey ? 5000 : 500;

    this.init();
  };

  TlExpandableTree.prototype.detached = function detached() {
    this._attached = false;
  };

  TlExpandableTree.prototype.dataChanged = function dataChanged() {
    this.init();
  };

  TlExpandableTree.prototype.init = function init() {
    if (!this._attached || !this.data) {
      return;
    }
    this.timelineData = this.data.timelineData.map(function (tld) {
      return { value: tld.value, key: (0, _moment2.default)(tld.key).format('ddd, hA'), time: tld.key };
    });

    this.timelinePlaytime = this.timelineData.length * 300;
    this.renderTimeline();

    this.tweetTreeData = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree));

    this.cardModel = this.tweetTreeData.entity;

    var mockChild1 = this.tweetTreeData.children[2];
    mockChild1.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(2, 5);
    mockChild1.children.forEach(function (d) {
      d.time = mockChild1.time + Math.random() * 1000 * 60 * 60 * 40;
    });
    var mockChild2 = this.tweetTreeData.children[6];
    mockChild2.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(6, 9);
    mockChild2.children.forEach(function (d) {
      d.time = mockChild2.time + Math.random() * 1000 * 60 * 60 * 40;
    });

    var mockChild22 = mockChild2.children[0];
    mockChild22.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(0, 1);
    mockChild22.children.forEach(function (d) {
      d.time = mockChild22.time + Math.random() * 1000 * 60 * 60 * 40;
    });

    var mockChild3 = this.tweetTreeData.children[0];
    mockChild3.children = JSON.parse(JSON.stringify(this.data.tweetLifeEntityTree)).children.slice(10, 11);
    mockChild3.children.forEach(function (d) {
      d.time = mockChild3.time + Math.random() * 1000 * 60 * 60 * 40;
    });
    this.tweetTreeData.maxDepth = 3;

    this.treeSize.height = Math.max(this.tweetTreeData.children.length * 5, treeContainerHeight);
    this.treeSize.width = Math.min(this.tweetTreeData.maxDepth * 200, treeContainerWidth);
    this.configTree(this.treeSize.height, this.treeSize.width);

    var minTime = this.svgNodesData[0].time;
    var maxTime = 0;
    var treeDepth = 0;
    this.svgNodesData.forEach(function (data) {
      if (data.time > maxTime) {
        maxTime = data.time;
      }
    });

    this.scale = d3.scale.linear().domain([minTime, maxTime]).range([0, 1]);

    this.defaultView = false;
    this.loading = false;
    this.allowedPlay = true;
    this.renderBaseTree();
  };

  TlExpandableTree.prototype.configTree = function configTree(height, width) {
    this.tree = d3.layout.tree().size([height, width]);
    this.svgNodesData = this.tree.nodes(this.tweetTreeData);

    this.treeSvg.attr({ width: width + 220, height: height + 20 });
    this.transX = 0;
    this.transY = -height / 2 + 300;
    (0, _jquery2.default)('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)");
  };

  TlExpandableTree.prototype.dragmove = function dragmove() {
    this.transX += _d.event.x - this.startPoint.x;
    this.transY += _d.event.y - this.startPoint.y;
    this.startPoint.x = _d.event.x;
    this.startPoint.y = _d.event.y;
    (0, _jquery2.default)('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)");
  };

  TlExpandableTree.prototype.renderTimeline = function renderTimeline() {
    this.eventAggregator.publish('renderTimeline', this.timelineData);
  };

  TlExpandableTree.prototype.isCollapse = function isCollapse(node) {
    var collapse = void 0;
    if (!node) {
      collapse = false;
    } else if (!(node.children && node.children.length)) {
      collapse = false;
    } else if (node.collapse) {
      collapse = true;
    } else {
      if (node.parent) {
        collapse = this.isCollapse(node.parent);
      }
    }
    return collapse;
  };

  TlExpandableTree.prototype.isRendering = function isRendering(node) {
    var rendering = void 0;
    if (node) {
      rendering = false;
    } else if (node.rendering) {
      rendering = true;
    } else {
      if (node.parent) {
        rendering = this.isRendering(node.parent);
      }
    }
    return rendering;
  };

  TlExpandableTree.prototype.renderNode = function renderNode(nodeData, animate) {
    var _this3 = this;

    var svgCircleGroup = this.svgCircleGroup;
    var linkNode = void 0,
        circleNode = void 0;
    if (nodeData.unRender) {
      return;
    }
    if (nodeData.parent) {
      nodeData.rendering = true;

      if (this.isRendering(nodeData.parent)) {
        nodeData.parent.preRenderChild = nodeData.parent.preRenderChild || [];
        nodeData.parent.preRenderChild.push(nodeData);
      } else {
        linkNode = this.svgLinkGroup.append('svg:path').datum(nodeData).attr('class', 'link').attr("d", function (d) {
          return _this3.diagonal({ source: d.parent, target: d });
        }).style('stroke', function (d) {
          return d.unselected ? '#dce2ea' : '#54BDC8';
        }).style('display', function (d) {
          return _this3.isCollapse(d.parent) ? 'none' : '';
        }).transition().duration(animate ? this.durationTime : 0).attrTween("stroke-dasharray", function () {
          var len = this.getTotalLength();
          return function (t) {
            return d3.interpolateString("0," + len, len + ",0")(t);
          };
        }).each('end', function (d) {
          svgCircleGroup.append('svg:circle').datum(nodeData).on('click', function (d) {
            _this3.toggleCollapse(d);
          }).on("mouseover", function (d) {
            _this3.showCard(d);
          }).on("mouseout", function (d) {
            _this3.hideCard(d);
          }).style('display', function (d) {
            return _this3.isCollapse(d.parent) ? 'none' : '';
          }).style("fill", function (d) {
            var time = _this3.scale(d.time);
            var color = _this3.computeColor(time);
            return color;
          }).style("stroke-width", function (d) {
            var strokeWidth = '1px';
            if (d.collapse && d.children && d.children.length) {
              strokeWidth = '2px';
            }
            return strokeWidth;
          }).attr("r", 4.5).attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
          });
          nodeData.rendering = false;

          if (nodeData.preRenderChild) {
            nodeData.preRenderChild.forEach(function (child) {
              _this3.renderNode(child, animate);
            });
            nodeData.preRenderChild = [];
          }
        });
      }
    } else {
      svgCircleGroup.append('svg:circle').datum(nodeData).on('click', function (d) {
        _this3.toggleCollapse(d);
      }).on("mouseover", function (d) {
        _this3.showCard(d);
      }).on("mouseout", function (d) {
        _this3.hideCard(d);
      }).style("stroke-width", function (d) {
        var strokeWidth = '1px';
        if (d.collapse && d.children && d.children.length) {
          strokeWidth = '2px';
        }
        return strokeWidth;
      }).attr("r", 4.5).attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });
    }
  };

  TlExpandableTree.prototype.updateSelectNode = function updateSelectNode() {
    this.svgLinkGroup.selectAll('path').style('stroke', function (d) {
      return d.unselected ? '#dce2ea' : '#54BDC8';
    });
  };

  TlExpandableTree.prototype.toggleCollapse = function toggleCollapse(nodeData) {
    if (nodeData.children && nodeData.children.length) {
      nodeData.collapse = !nodeData.collapse;
      nodeData.children.forEach(function (d) {
        return d.collapse = true;
      });
      this.updateCollapseNode();
    }
  };

  TlExpandableTree.prototype.updateCollapseNode = function updateCollapseNode() {
    var _this4 = this;

    this.svgLinkGroup.selectAll('path').style('display', function (d) {
      return _this4.isCollapse(d.parent) ? 'none' : '';
    });
    this.svgCircleGroup.selectAll('circle').style('display', function (d) {
      return _this4.isCollapse(d.parent) ? 'none' : '';
    }).style("stroke-width", function (d) {
      var strokeWidth = '1px';
      if (d.collapse && d.children && d.children.length) {
        strokeWidth = '2px';
      }
      return strokeWidth;
    });
  };

  TlExpandableTree.prototype.renderBaseTree = function renderBaseTree() {
    this.svgNodesData.forEach(function (d) {
      d.unRender = false;
      d.unselected = false;
      d.collapse = false;
    });
    this.tweetTreeData.children.forEach(function (d) {
      d.collapse = true;
    });
    this.renderAll();
  };

  TlExpandableTree.prototype.renderAll = function renderAll() {
    var _this5 = this;

    this.svgNodesData.forEach(function (d) {
      _this5.renderNode(d, false);
    });
  };

  TlExpandableTree.prototype.playTree = function playTree(lastTime, endTime) {
    var _this6 = this;

    var currentData = this.svgNodesData.filter(function (d) {
      return d.time >= lastTime && d.time <= endTime;
    });
    currentData.forEach(function (d) {
      d.unRender = false;
      d.collapse = false;
      d.unselected = false;
      _this6.renderNode(d, true);
    });
  };

  TlExpandableTree.prototype.dataBrush = function dataBrush(params) {
    if (params.endIndex > 0) {
      var lastItem = this.timelineData[params.endIndex - 1];
      this.playTree(lastItem.time, params.endItem.time);
    }
  };

  TlExpandableTree.prototype.dataRangeChange = function dataRangeChange(params) {
    var startTime = this.timelineData[params.startIndex].time;
    var endTime = this.timelineData[params.endIndex].time;
    this.svgNodesData.forEach(function (d) {
      if (d.time >= startTime && d.time <= endTime) {
        d.unselected = false;
      } else {
        d.unselected = true;
      }
    });
    this.updateSelectNode();
  };

  TlExpandableTree.prototype.showCard = function showCard(d) {
    var _this7 = this;

    (0, _jquery2.default)(".cardHoverView").addClass('hide');
    var event = _d.event;
    this.showCardTimeout = setTimeout(function () {
      (0, _jquery2.default)(".cardHoverView").css({ top: event.layerY + 10, left: event.layerX + 10 }).removeClass('hide');
      _this7.cardModel = d.entity;
    }, 500);
  };

  TlExpandableTree.prototype.hideCard = function hideCard(d) {
    clearTimeout(this.showCardTimeout);
    this.hideCardTimeout = setTimeout(function () {
      (0, _jquery2.default)(".cardHoverView").addClass('hide');
    }, 200);
  };

  TlExpandableTree.prototype.playDone = function playDone(params) {
    this.showPause = false;
    this.allowedPlay = false;
  };

  TlExpandableTree.prototype.playBtnClicked = function playBtnClicked() {
    if (this.allowedPlay) {
      (0, _jquery2.default)('.svgTree > g').empty();
      this.svgNodesData.forEach(function (d) {
        d.unRender = true;
        d.collapse = false;
        d.unselected = false;
      });
      this.timeline.playTimeline();
      this.showPause = true;
    }
  };

  TlExpandableTree.prototype.pauseBtnClicked = function pauseBtnClicked() {
    this.timeline.pauseTimeline();
    this.showPause = false;
  };

  TlExpandableTree.prototype.expendBtnClicked = function expendBtnClicked() {
    var _this8 = this;

    if (this.svgNodesData && this.svgNodesData.length) {
      var currentExpandNodeDepth = -1;
      this.svgNodesData.forEach(function (d) {
        if (d.children && d.children.length) {
          if (!_this8.isCollapse(d) && d.depth > currentExpandNodeDepth) {
            currentExpandNodeDepth = d.depth;
          }
        }
      });
      currentExpandNodeDepth++;
      this.svgNodesData.forEach(function (d) {
        if (currentExpandNodeDepth >= d.depth) {
          d.collapse = false;
        } else {
          d.collapse = true;
        }
      });
      this.updateCollapseNode();
    }
  };

  TlExpandableTree.prototype.resetBtnClicked = function resetBtnClicked() {
    this.timeline.resetTimeline();
    this.allowedPlay = true;
    this.showPause = false;
    (0, _jquery2.default)('.svgTree > g').empty();
    this.renderBaseTree();
  };

  TlExpandableTree.prototype.zoomIn = function zoomIn() {
    this.treeSize.height *= 1.5;
    this.treeSize.width *= 1.5;
    var tempX = this.transX * 1.5;
    var tempY = this.transY * 1.5;

    this.configTree(this.treeSize.height, this.treeSize.width);
    (0, _jquery2.default)('.svgTree > g').empty();
    this.renderAll();
    this.transX = tempX;
    this.transY = tempY;
    (0, _jquery2.default)('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)");
  };

  TlExpandableTree.prototype.zoomOut = function zoomOut() {
    this.treeSize.height /= 1.5;
    this.treeSize.width /= 1.5;
    var tempX = this.transX / 1.5;
    var tempY = this.transY / 1.5;

    this.configTree(this.treeSize.height, this.treeSize.width);
    (0, _jquery2.default)('.svgTree > g').empty();
    this.renderAll();
    this.transX = tempX;
    this.transY = tempY;
    (0, _jquery2.default)('.svgTree').parent().css("transform", "translate(" + this.transX + "px, " + this.transY + "px)");
  };

  return TlExpandableTree;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'data', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'loading', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'defaultView', [_aureliaFramework.bindable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class);
//# sourceMappingURL=tl-expandable-tree.js.map
