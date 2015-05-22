/**
Simple selector replacement. TODO: remove.
@module offset.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(function() {
  return function( selector ) {
    return document.querySelectorAll( selector );
  };
});
