/* */ 
if (!require('../core/env').canvasSupported) {
  var urn = 'urn:schemas-microsoft-com:vml';
  var createNode;
  var win = window;
  var doc = win.document;
  var vmlInited = false;
  try {
    !doc.namespaces.zrvml && doc.namespaces.add('zrvml', urn);
    createNode = function(tagName) {
      return doc.createElement('<zrvml:' + tagName + ' class="zrvml">');
    };
  } catch (e) {
    createNode = function(tagName) {
      return doc.createElement('<' + tagName + ' xmlns="' + urn + '" class="zrvml">');
    };
  }
  var initVML = function() {
    if (vmlInited) {
      return;
    }
    vmlInited = true;
    var styleSheets = doc.styleSheets;
    if (styleSheets.length < 31) {
      doc.createStyleSheet().addRule('.zrvml', 'behavior:url(#default#VML)');
    } else {
      styleSheets[0].addRule('.zrvml', 'behavior:url(#default#VML)');
    }
  };
  module.exports = {
    doc: doc,
    initVML: initVML,
    createNode: createNode
  };
}
