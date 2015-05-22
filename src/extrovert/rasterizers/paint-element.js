/**
A simple Extrovert HTML rasterizer.
@module paint-element.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['extrovert/providers/three/provider-three', 'extrovert/utilities/utils'], function( provider, utils ) {
  'use strict';
  return {
    paint: function( val, opts ) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = val.offsetWidth;
      canvas.height = val.offsetHeight;
      var bkColor = utils.getComputedStyle(val, 'background-color');
      if(bkColor === 'rgba(0, 0, 0, 0)')
        bkColor = 'rgb(0,0,0)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      return provider.createTextureFromCanvas( canvas, true );
    }
  };
});
