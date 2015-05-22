(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD.
      define(['three', 'physijs'], factory);
  } else {
      // Browser globals
      root.extrovert = factory( root.THREE, root.Physijs );
  }
}(this, function ( THREE, Physijs ) {
