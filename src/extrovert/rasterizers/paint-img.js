/**
A simple Extrovert image rasterizer.
@module paint-img.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['extrovert/providers/three/provider-three'], function( gfx ) {
  'use strict';
  return {
    paint: function( obj ) {
      return gfx.loadTexture( typeof obj === 'string' ? obj : obj.src );
    }
  };
});
