/**
JavaScript type-testing methods.
@module is.js
@license Copyright (c) 2015 | James M. Devlin
*/

define( function() {

  return {
    array: function( obj ) {
      return Object.prototype.toString.call( obj ) === '[object Array]';
    },
    string: function( obj ) {
      return typeof object === 'string';
    },
    plainObject: function( obj ) {
      if ((typeof obj !== "object") || obj.nodeType || (obj !== null && obj === obj.window)) {
        return false;
      }
      if (obj.constructor && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
      return true;
    }
  };

});
