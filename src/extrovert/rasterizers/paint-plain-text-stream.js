/**
A streaming plain text rasterizer for Extrovert.js.
@module paint-plain-text-stream.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['extrovert/utilities/utils', 'extrovert/providers/three/provider-three', 'in.scribe'], function( utils, gfx, inscribe ) {
  'use strict';
  return {
    paint: function( val, opts, info ) {
      opts = opts || { };
      var painter = new inscribe();
      var textures = [];
      var wrapInfo = { };
      var lineHeight = opts.lineHeight || 16;
      var massaged_content = val.text.replace('\n',' ');
      var padding = opts.padding || 10;
      info.numLines = 0;
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = opts.width;
      canvas.height = opts.height;
      var bkColor = opts.bkColor || 'rgb(255,255,255)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = utils.getComputedStyle( document.body, 'font' );
      context.fillStyle = opts.bkColor || 'rgb(0,0,0)';
      painter.inscribe( massaged_content, 'text', context,
        { padding: padding,
          maxWidth: canvas.width,
          lineHeight: lineHeight,
          chunkSize: 35,
          pageEmitted: function ( context ) {
            textures.push( gfx.createTextureFromCanvas( context.canvas, true ) );
            var newCanvas = document.createElement('canvas');
            newCanvas.width = opts.width;
            newCanvas.height = opts.height;
            var newContext = newCanvas.getContext('2d');
            var bkColor = opts.bkColor || 'rgb(255,255,255)';
            newContext.fillStyle = bkColor;
            newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
            newContext.font = utils.getComputedStyle( document.body, 'font' );
            newContext.fillStyle = opts.textColor || 'rgb(0,0,0)';
            return newContext;
          }
      });
      return textures;
    }
  };
});
