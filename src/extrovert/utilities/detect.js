/**
WebGL and Canvas detection routines.
@module core.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(function() {

  return {

    /**
    Figure out if the browser supports WebGL.
    @method detectWebGL
    */
    supportsWebGL: function( return_context ) {
      if( !!window.WebGLRenderingContext ) {
        var canvas = document.createElement("canvas");
        var names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
        var context = false;
        for(var i=0;i<4;i++) {
          try {
            context = canvas.getContext(names[i]);
            if (context && typeof context.getParameter == "function") {
              // WebGL is enabled
              if (return_context) {
                // return WebGL object if the function's argument is present
                return {name:names[i], gl:context};
              }
              // else, return just true
              return true;
            }
          } catch(e) {
          }
        }

        // WebGL is supported, but disabled
        return false;
      }

      // WebGL not supported
      return false;
    },

    /**
    Figure out if the browser supports Canvas.
    http://stackoverflow.com/q/2745432
    @method detectVCanvas
    */
    supportsCanvas: function() {
      var elem = document.createElement('canvas');
      return !!(elem.getContext && elem.getContext('2d'));
    }

  };

});