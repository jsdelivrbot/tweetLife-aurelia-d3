/* */ 
"format cjs";
define(function(require) {
  var zrUtil = require('zrender/core/util');
  var Model = require('../model/Model');
  var List = require('./List');
  var linkList = require('./helper/linkList');
  var completeDimensions = require('./helper/completeDimensions');
  var TreeNode = function(name, hostTree) {
    this.name = name || '';
    this.depth = 0;
    this.height = 0;
    this.parentNode = null;
    this.dataIndex = -1;
    this.children = [];
    this.viewChildren = [];
    this.hostTree = hostTree;
  };
  TreeNode.prototype = {
    constructor: TreeNode,
    isRemoved: function() {
      return this.dataIndex < 0;
    },
    eachNode: function(options, cb, context) {
      if (typeof options === 'function') {
        context = cb;
        cb = options;
        options = null;
      }
      options = options || {};
      if (zrUtil.isString(options)) {
        options = {order: options};
      }
      var order = options.order || 'preorder';
      var children = this[options.attr || 'children'];
      var suppressVisitSub;
      order === 'preorder' && (suppressVisitSub = cb.call(context, this));
      for (var i = 0; !suppressVisitSub && i < children.length; i++) {
        children[i].eachNode(options, cb, context);
      }
      order === 'postorder' && cb.call(context, this);
    },
    updateDepthAndHeight: function(depth) {
      var height = 0;
      this.depth = depth;
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];
        child.updateDepthAndHeight(depth + 1);
        if (child.height > height) {
          height = child.height;
        }
      }
      this.height = height + 1;
    },
    getNodeById: function(id) {
      if (this.getId() === id) {
        return this;
      }
      for (var i = 0,
          children = this.children,
          len = children.length; i < len; i++) {
        var res = children[i].getNodeById(id);
        if (res) {
          return res;
        }
      }
    },
    contains: function(node) {
      if (node === this) {
        return true;
      }
      for (var i = 0,
          children = this.children,
          len = children.length; i < len; i++) {
        var res = children[i].contains(node);
        if (res) {
          return res;
        }
      }
    },
    getAncestors: function(includeSelf) {
      var ancestors = [];
      var node = includeSelf ? this : this.parentNode;
      while (node) {
        ancestors.push(node);
        node = node.parentNode;
      }
      ancestors.reverse();
      return ancestors;
    },
    getValue: function(dimension) {
      var data = this.hostTree.data;
      return data.get(data.getDimension(dimension || 'value'), this.dataIndex);
    },
    setLayout: function(layout, merge) {
      this.dataIndex >= 0 && this.hostTree.data.setItemLayout(this.dataIndex, layout, merge);
    },
    getLayout: function() {
      return this.hostTree.data.getItemLayout(this.dataIndex);
    },
    getModel: function(path) {
      if (this.dataIndex < 0) {
        return;
      }
      var hostTree = this.hostTree;
      var itemModel = hostTree.data.getItemModel(this.dataIndex);
      var levelModel = this.getLevelModel();
      return itemModel.getModel(path, (levelModel || hostTree.hostModel).getModel(path));
    },
    getLevelModel: function() {
      return (this.hostTree.levelModels || [])[this.depth];
    },
    setVisual: function(key, value) {
      this.dataIndex >= 0 && this.hostTree.data.setItemVisual(this.dataIndex, key, value);
    },
    getVisual: function(key, ignoreParent) {
      return this.hostTree.data.getItemVisual(this.dataIndex, key, ignoreParent);
    },
    getRawIndex: function() {
      return this.hostTree.data.getRawIndex(this.dataIndex);
    },
    getId: function() {
      return this.hostTree.data.getId(this.dataIndex);
    }
  };
  function Tree(hostModel, levelOptions) {
    this.root;
    this.data;
    this._nodes = [];
    this.hostModel = hostModel;
    this.levelModels = zrUtil.map(levelOptions || [], function(levelDefine) {
      return new Model(levelDefine, hostModel, hostModel.ecModel);
    });
  }
  Tree.prototype = {
    constructor: Tree,
    type: 'tree',
    eachNode: function(options, cb, context) {
      this.root.eachNode(options, cb, context);
    },
    getNodeByDataIndex: function(dataIndex) {
      var rawIndex = this.data.getRawIndex(dataIndex);
      return this._nodes[rawIndex];
    },
    getNodeByName: function(name) {
      return this.root.getNodeByName(name);
    },
    update: function() {
      var data = this.data;
      var nodes = this._nodes;
      for (var i = 0,
          len = nodes.length; i < len; i++) {
        nodes[i].dataIndex = -1;
      }
      for (var i = 0,
          len = data.count(); i < len; i++) {
        nodes[data.getRawIndex(i)].dataIndex = i;
      }
    },
    clearLayouts: function() {
      this.data.clearItemLayouts();
    }
  };
  Tree.createTree = function(dataRoot, hostModel, levelOptions) {
    var tree = new Tree(hostModel, levelOptions);
    var listData = [];
    buildHierarchy(dataRoot);
    function buildHierarchy(dataNode, parentNode) {
      listData.push(dataNode);
      var node = new TreeNode(dataNode.name, tree);
      parentNode ? addChild(node, parentNode) : (tree.root = node);
      tree._nodes.push(node);
      var children = dataNode.children;
      if (children) {
        for (var i = 0; i < children.length; i++) {
          buildHierarchy(children[i], node);
        }
      }
    }
    tree.root.updateDepthAndHeight(0);
    var dimensions = completeDimensions([{name: 'value'}], listData);
    var list = new List(dimensions, hostModel);
    list.initData(listData);
    linkList({
      mainData: list,
      struct: tree,
      structAttr: 'tree'
    });
    tree.update();
    return tree;
  };
  function addChild(child, node) {
    var children = node.children;
    if (child.parentNode === node) {
      return;
    }
    children.push(child);
    child.parentNode = node;
  }
  return Tree;
});
