/**
A simple Extrovert HTML rasterizer.
@module paint-color.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['extrovert/core'], function( extrovert ) {
  'use strict';
  return {
    paint: function( val, opts ) {
      return extrovert.provider.createTextureFromCanvas( canvas );
    }
  };
});
