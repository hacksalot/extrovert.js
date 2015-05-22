/**
Plain JavaScript implementation of jQuery .offset().
@module offset.js
@license Copyright (c) 2015 | James M. Devlin
*/

define( function() {
  return function( elem ) {
    var docElem, win;//, elem = this[0];
    var box = {
        top: 0,
        left: 0
    };

    var doc = elem && elem.ownerDocument;
    if (!doc) return;

    docElem = doc.documentElement;

    // Make sure it's not a disconnected DOM node
    // if (!jQuery.contains(docElem, elem)) {
        // return box;
    // }

    // If we don't have gBCR, just use 0,0 rather than error
    // BlackBerry 5, iOS 3 (original iPhone)
    if (elem.getBoundingClientRect !== undefined) {
      box = elem.getBoundingClientRect();
    }
    win = (doc !== null && doc === doc.window) ? doc : doc.nodeType === 9 && doc.defaultView;
    return {
      top: box.top + win.pageYOffset - docElem.clientTop,
      left: box.left + win.pageXOffset - docElem.clientLeft
    };
  };
});
