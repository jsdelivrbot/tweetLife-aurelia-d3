/* */ 
"format cjs";
(function(process) {
  define(function(require) {
    var zrUtil = require('zrender/core/util');
    var graphic = require('../../util/graphic');
    var DataDiffer = require('../../data/DataDiffer');
    var helper = require('./helper');
    var Breadcrumb = require('./Breadcrumb');
    var RoamController = require('../../component/helper/RoamController');
    var BoundingRect = require('zrender/core/BoundingRect');
    var matrix = require('zrender/core/matrix');
    var animationUtil = require('../../util/animation');
    var bind = zrUtil.bind;
    var Group = graphic.Group;
    var Rect = graphic.Rect;
    var each = zrUtil.each;
    var DRAG_THRESHOLD = 3;
    var PATH_LABEL_NORMAL = ['label', 'normal'];
    var PATH_LABEL_EMPHASIS = ['label', 'emphasis'];
    var Z_BASE = 10;
    var Z_BG = 1;
    var Z_CONTENT = 2;
    return require('../../echarts').extendChartView({
      type: 'treemap',
      init: function(o, api) {
        this._containerGroup;
        this._storage = createStorage();
        this._oldTree;
        this._breadcrumb;
        this._controller;
        this._state = 'ready';
        this._mayClick;
      },
      render: function(seriesModel, ecModel, api, payload) {
        var models = ecModel.findComponents({
          mainType: 'series',
          subType: 'treemap',
          query: payload
        });
        if (zrUtil.indexOf(models, seriesModel) < 0) {
          return;
        }
        this.seriesModel = seriesModel;
        this.api = api;
        this.ecModel = ecModel;
        var targetInfo = helper.retrieveTargetInfo(payload, seriesModel);
        var payloadType = payload && payload.type;
        var layoutInfo = seriesModel.layoutInfo;
        var isInit = !this._oldTree;
        var thisStorage = this._storage;
        var reRoot = (payloadType === 'treemapRootToNode' && targetInfo && thisStorage) ? {
          rootNodeGroup: thisStorage.nodeGroup[targetInfo.node.getRawIndex()],
          direction: payload.direction
        } : null;
        var containerGroup = this._giveContainerGroup(layoutInfo);
        var renderResult = this._doRender(containerGroup, seriesModel, reRoot);
        (!isInit && (!payloadType || payloadType === 'treemapZoomToNode' || payloadType === 'treemapRootToNode')) ? this._doAnimation(containerGroup, renderResult, seriesModel, reRoot) : renderResult.renderFinally();
        this._resetController(api);
        this._renderBreadcrumb(seriesModel, api, targetInfo);
      },
      _giveContainerGroup: function(layoutInfo) {
        var containerGroup = this._containerGroup;
        if (!containerGroup) {
          containerGroup = this._containerGroup = new Group();
          this._initEvents(containerGroup);
          this.group.add(containerGroup);
        }
        containerGroup.attr('position', [layoutInfo.x, layoutInfo.y]);
        return containerGroup;
      },
      _doRender: function(containerGroup, seriesModel, reRoot) {
        var thisTree = seriesModel.getData().tree;
        var oldTree = this._oldTree;
        var lastsForAnimation = createStorage();
        var thisStorage = createStorage();
        var oldStorage = this._storage;
        var willInvisibleEls = [];
        var doRenderNode = zrUtil.curry(renderNode, seriesModel, thisStorage, oldStorage, reRoot, lastsForAnimation, willInvisibleEls);
        dualTravel(thisTree.root ? [thisTree.root] : [], (oldTree && oldTree.root) ? [oldTree.root] : [], containerGroup, thisTree === oldTree || !oldTree, 0);
        var willDeleteEls = clearStorage(oldStorage);
        this._oldTree = thisTree;
        this._storage = thisStorage;
        return {
          lastsForAnimation: lastsForAnimation,
          willDeleteEls: willDeleteEls,
          renderFinally: renderFinally
        };
        function dualTravel(thisViewChildren, oldViewChildren, parentGroup, sameTree, depth) {
          if (sameTree) {
            oldViewChildren = thisViewChildren;
            each(thisViewChildren, function(child, index) {
              !child.isRemoved() && processNode(index, index);
            });
          } else {
            (new DataDiffer(oldViewChildren, thisViewChildren, getKey, getKey)).add(processNode).update(processNode).remove(zrUtil.curry(processNode, null)).execute();
          }
          function getKey(node) {
            return node.getId();
          }
          function processNode(newIndex, oldIndex) {
            var thisNode = newIndex != null ? thisViewChildren[newIndex] : null;
            var oldNode = oldIndex != null ? oldViewChildren[oldIndex] : null;
            var group = doRenderNode(thisNode, oldNode, parentGroup, depth);
            group && dualTravel(thisNode && thisNode.viewChildren || [], oldNode && oldNode.viewChildren || [], group, sameTree, depth + 1);
          }
        }
        function clearStorage(storage) {
          var willDeleteEls = createStorage();
          storage && each(storage, function(store, storageName) {
            var delEls = willDeleteEls[storageName];
            each(store, function(el) {
              el && (delEls.push(el), el.__tmWillDelete = 1);
            });
          });
          return willDeleteEls;
        }
        function renderFinally() {
          each(willDeleteEls, function(els) {
            each(els, function(el) {
              el.parent && el.parent.remove(el);
            });
          });
          each(willInvisibleEls, function(el) {
            el.invisible = true;
            el.dirty();
          });
        }
      },
      _doAnimation: function(containerGroup, renderResult, seriesModel, reRoot) {
        if (!seriesModel.get('animation')) {
          return;
        }
        var duration = seriesModel.get('animationDurationUpdate');
        var easing = seriesModel.get('animationEasing');
        var animationWrap = animationUtil.createWrap();
        each(renderResult.willDeleteEls, function(store, storageName) {
          each(store, function(el, rawIndex) {
            if (el.invisible) {
              return;
            }
            var parent = el.parent;
            var target;
            if (reRoot && reRoot.direction === 'drillDown') {
              target = parent === reRoot.rootNodeGroup ? {
                shape: {
                  x: 0,
                  y: 0,
                  width: parent.__tmNodeWidth,
                  height: parent.__tmNodeHeight
                },
                style: {opacity: 0}
              } : {style: {opacity: 0}};
            } else {
              var targetX = 0;
              var targetY = 0;
              if (!parent.__tmWillDelete) {
                targetX = parent.__tmNodeWidth / 2;
                targetY = parent.__tmNodeHeight / 2;
              }
              target = storageName === 'nodeGroup' ? {
                position: [targetX, targetY],
                style: {opacity: 0}
              } : {
                shape: {
                  x: targetX,
                  y: targetY,
                  width: 0,
                  height: 0
                },
                style: {opacity: 0}
              };
            }
            target && animationWrap.add(el, target, duration, easing);
          });
        });
        each(this._storage, function(store, storageName) {
          each(store, function(el, rawIndex) {
            var last = renderResult.lastsForAnimation[storageName][rawIndex];
            var target = {};
            if (!last) {
              return;
            }
            if (storageName === 'nodeGroup') {
              if (last.old) {
                target.position = el.position.slice();
                el.attr('position', last.old);
              }
            } else {
              if (last.old) {
                target.shape = zrUtil.extend({}, el.shape);
                el.setShape(last.old);
              }
              if (last.fadein) {
                el.setStyle('opacity', 0);
                target.style = {opacity: 1};
              } else if (el.style.opacity !== 1) {
                target.style = {opacity: 1};
              }
            }
            animationWrap.add(el, target, duration, easing);
          });
        }, this);
        this._state = 'animating';
        animationWrap.done(bind(function() {
          this._state = 'ready';
          renderResult.renderFinally();
        }, this)).start();
      },
      _resetController: function(api) {
        var controller = this._controller;
        if (!controller) {
          controller = this._controller = new RoamController(api.getZr());
          controller.enable(this.seriesModel.get('roam'));
          controller.on('pan', bind(this._onPan, this));
          controller.on('zoom', bind(this._onZoom, this));
        }
        var rect = new BoundingRect(0, 0, api.getWidth(), api.getHeight());
        controller.setContainsPoint(function(x, y) {
          return rect.contain(x, y);
        });
      },
      _clearController: function() {
        var controller = this._controller;
        if (controller) {
          controller.dispose();
          controller = null;
        }
      },
      _onPan: function(dx, dy) {
        this._mayClick = false;
        if (this._state !== 'animating' && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
          var root = this.seriesModel.getData().tree.root;
          if (!root) {
            return;
          }
          var rootLayout = root.getLayout();
          if (!rootLayout) {
            return;
          }
          this.api.dispatchAction({
            type: 'treemapMove',
            from: this.uid,
            seriesId: this.seriesModel.id,
            rootRect: {
              x: rootLayout.x + dx,
              y: rootLayout.y + dy,
              width: rootLayout.width,
              height: rootLayout.height
            }
          });
        }
      },
      _onZoom: function(scale, mouseX, mouseY) {
        this._mayClick = false;
        if (this._state !== 'animating') {
          var root = this.seriesModel.getData().tree.root;
          if (!root) {
            return;
          }
          var rootLayout = root.getLayout();
          if (!rootLayout) {
            return;
          }
          var rect = new BoundingRect(rootLayout.x, rootLayout.y, rootLayout.width, rootLayout.height);
          var layoutInfo = this.seriesModel.layoutInfo;
          mouseX -= layoutInfo.x;
          mouseY -= layoutInfo.y;
          var m = matrix.create();
          matrix.translate(m, m, [-mouseX, -mouseY]);
          matrix.scale(m, m, [scale, scale]);
          matrix.translate(m, m, [mouseX, mouseY]);
          rect.applyTransform(m);
          this.api.dispatchAction({
            type: 'treemapRender',
            from: this.uid,
            seriesId: this.seriesModel.id,
            rootRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }
          });
        }
      },
      _initEvents: function(containerGroup) {
        containerGroup.on('mousedown', function(e) {
          this._state === 'ready' && (this._mayClick = true);
        }, this);
        containerGroup.on('mouseup', function(e) {
          if (this._mayClick) {
            this._mayClick = false;
            this._state === 'ready' && onClick.call(this, e);
          }
        }, this);
        function onClick(e) {
          var nodeClick = this.seriesModel.get('nodeClick', true);
          if (!nodeClick) {
            return;
          }
          var targetInfo = this.findTarget(e.offsetX, e.offsetY);
          if (!targetInfo) {
            return;
          }
          var node = targetInfo.node;
          if (node.getLayout().isLeafRoot) {
            this._rootToNode(targetInfo);
          } else {
            if (nodeClick === 'zoomToNode') {
              this._zoomToNode(targetInfo);
            } else if (nodeClick === 'link') {
              var itemModel = node.hostTree.data.getItemModel(node.dataIndex);
              var link = itemModel.get('link', true);
              var linkTarget = itemModel.get('target', true) || 'blank';
              link && window.open(link, linkTarget);
            }
          }
        }
      },
      _renderBreadcrumb: function(seriesModel, api, targetInfo) {
        if (!targetInfo) {
          targetInfo = seriesModel.get('leafDepth', true) != null ? {node: seriesModel.getViewRoot()} : this.findTarget(api.getWidth() / 2, api.getHeight() / 2);
          if (!targetInfo) {
            targetInfo = {node: seriesModel.getData().tree.root};
          }
        }
        (this._breadcrumb || (this._breadcrumb = new Breadcrumb(this.group))).render(seriesModel, api, targetInfo.node, bind(onSelect, this));
        function onSelect(node) {
          if (this._state !== 'animating') {
            helper.aboveViewRoot(seriesModel.getViewRoot(), node) ? this._rootToNode({node: node}) : this._zoomToNode({node: node});
          }
        }
      },
      remove: function() {
        this._clearController();
        this._containerGroup && this._containerGroup.removeAll();
        this._storage = createStorage();
        this._state = 'ready';
        this._breadcrumb && this._breadcrumb.remove();
      },
      dispose: function() {
        this._clearController();
      },
      _zoomToNode: function(targetInfo) {
        this.api.dispatchAction({
          type: 'treemapZoomToNode',
          from: this.uid,
          seriesId: this.seriesModel.id,
          targetNode: targetInfo.node
        });
      },
      _rootToNode: function(targetInfo) {
        this.api.dispatchAction({
          type: 'treemapRootToNode',
          from: this.uid,
          seriesId: this.seriesModel.id,
          targetNode: targetInfo.node
        });
      },
      findTarget: function(x, y) {
        var targetInfo;
        var viewRoot = this.seriesModel.getViewRoot();
        viewRoot.eachNode({
          attr: 'viewChildren',
          order: 'preorder'
        }, function(node) {
          var bgEl = this._storage.background[node.getRawIndex()];
          if (bgEl) {
            var point = bgEl.transformCoordToLocal(x, y);
            var shape = bgEl.shape;
            if (shape.x <= point[0] && point[0] <= shape.x + shape.width && shape.y <= point[1] && point[1] <= shape.y + shape.height) {
              targetInfo = {
                node: node,
                offsetX: point[0],
                offsetY: point[1]
              };
            } else {
              return false;
            }
          }
        }, this);
        return targetInfo;
      }
    });
    function createStorage() {
      return {
        nodeGroup: [],
        background: [],
        content: []
      };
    }
    function renderNode(seriesModel, thisStorage, oldStorage, reRoot, lastsForAnimation, willInvisibleEls, thisNode, oldNode, parentGroup, depth) {
      if (!thisNode) {
        return;
      }
      var thisLayout = thisNode.getLayout();
      if (!thisLayout || !thisLayout.isInView) {
        return;
      }
      var thisWidth = thisLayout.width;
      var thisHeight = thisLayout.height;
      var thisInvisible = thisLayout.invisible;
      var thisRawIndex = thisNode.getRawIndex();
      var oldRawIndex = oldNode && oldNode.getRawIndex();
      var group = giveGraphic('nodeGroup', Group);
      if (!group) {
        return;
      }
      parentGroup.add(group);
      group.attr('position', [thisLayout.x || 0, thisLayout.y || 0]);
      group.__tmNodeWidth = thisWidth;
      group.__tmNodeHeight = thisHeight;
      if (thisLayout.isAboveViewRoot) {
        return group;
      }
      var bg = giveGraphic('background', Rect, depth, Z_BG);
      if (bg) {
        bg.setShape({
          x: 0,
          y: 0,
          width: thisWidth,
          height: thisHeight
        });
        updateStyle(bg, function() {
          bg.setStyle('fill', thisNode.getVisual('borderColor', true));
        });
        group.add(bg);
      }
      var thisViewChildren = thisNode.viewChildren;
      if (!thisViewChildren || !thisViewChildren.length) {
        var content = giveGraphic('content', Rect, depth, Z_CONTENT);
        content && renderContent(group);
      }
      return group;
      function renderContent(group) {
        content.dataIndex = thisNode.dataIndex;
        content.seriesIndex = seriesModel.seriesIndex;
        var borderWidth = thisLayout.borderWidth;
        var contentWidth = Math.max(thisWidth - 2 * borderWidth, 0);
        var contentHeight = Math.max(thisHeight - 2 * borderWidth, 0);
        content.culling = true;
        content.setShape({
          x: borderWidth,
          y: borderWidth,
          width: contentWidth,
          height: contentHeight
        });
        var visualColor = thisNode.getVisual('color', true);
        updateStyle(content, function() {
          var normalStyle = {fill: visualColor};
          var emphasisStyle = thisNode.getModel('itemStyle.emphasis').getItemStyle();
          prepareText(normalStyle, emphasisStyle, visualColor, contentWidth, contentHeight);
          content.setStyle(normalStyle);
          graphic.setHoverStyle(content, emphasisStyle);
        });
        group.add(content);
      }
      function updateStyle(element, cb) {
        if (!thisInvisible) {
          cb();
          if (!element.__tmWillVisible) {
            element.invisible = false;
          }
        } else {
          !element.invisible && willInvisibleEls.push(element);
        }
      }
      function prepareText(normalStyle, emphasisStyle, visualColor, contentWidth, contentHeight) {
        var nodeModel = thisNode.getModel();
        var text = nodeModel.get('name');
        if (thisLayout.isLeafRoot) {
          var iconChar = seriesModel.get('drillDownIcon', true);
          text = iconChar ? iconChar + ' ' + text : text;
        }
        setText(text, normalStyle, nodeModel, PATH_LABEL_NORMAL, visualColor, contentWidth, contentHeight);
        setText(text, emphasisStyle, nodeModel, PATH_LABEL_EMPHASIS, visualColor, contentWidth, contentHeight);
      }
      function setText(text, style, nodeModel, labelPath, visualColor, contentWidth, contentHeight) {
        var labelModel = nodeModel.getModel(labelPath);
        var labelTextStyleModel = labelModel.getModel('textStyle');
        graphic.setText(style, labelModel, visualColor);
        style.textAlign = labelTextStyleModel.get('align');
        style.textVerticalAlign = labelTextStyleModel.get('baseline');
        var textRect = labelTextStyleModel.getTextRect(text);
        if (!labelModel.getShallow('show') || textRect.height > contentHeight) {
          style.text = '';
        } else if (textRect.width > contentWidth) {
          style.text = labelTextStyleModel.get('ellipsis') ? labelTextStyleModel.truncateText(text, contentWidth, null, {minChar: 2}) : '';
        } else {
          style.text = text;
        }
      }
      function giveGraphic(storageName, Ctor, depth, z) {
        var element = oldRawIndex != null && oldStorage[storageName][oldRawIndex];
        var lasts = lastsForAnimation[storageName];
        if (element) {
          oldStorage[storageName][oldRawIndex] = null;
          prepareAnimationWhenHasOld(lasts, element, storageName);
        } else if (!thisInvisible) {
          element = new Ctor({z: calculateZ(depth, z)});
          element.__tmDepth = depth;
          element.__tmStorageName = storageName;
          prepareAnimationWhenNoOld(lasts, element, storageName);
        }
        return (thisStorage[storageName][thisRawIndex] = element);
      }
      function prepareAnimationWhenHasOld(lasts, element, storageName) {
        var lastCfg = lasts[thisRawIndex] = {};
        lastCfg.old = storageName === 'nodeGroup' ? element.position.slice() : zrUtil.extend({}, element.shape);
      }
      function prepareAnimationWhenNoOld(lasts, element, storageName) {
        var lastCfg = lasts[thisRawIndex] = {};
        var parentNode = thisNode.parentNode;
        if (parentNode && (!reRoot || reRoot.direction === 'drillDown')) {
          var parentOldX = 0;
          var parentOldY = 0;
          var parentOldBg = lastsForAnimation.background[parentNode.getRawIndex()];
          if (!reRoot && parentOldBg && parentOldBg.old) {
            parentOldX = parentOldBg.old.width;
            parentOldY = parentOldBg.old.height;
          }
          lastCfg.old = storageName === 'nodeGroup' ? [0, parentOldY] : {
            x: parentOldX,
            y: parentOldY,
            width: 0,
            height: 0
          };
        }
        lastCfg.fadein = storageName !== 'nodeGroup';
      }
    }
    function calculateZ(depth, zInLevel) {
      var zb = depth * Z_BASE + zInLevel;
      return (zb - 1) / zb;
    }
  });
})(require('process'));
