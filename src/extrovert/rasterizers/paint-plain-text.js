/**
A simple Extrovert HTML rasterizer.
@module paint-plain-text.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['../utilities/utils', '../providers/three/provider-three', '../utilities/blend', 'in.scribe'], function( utils, gfx, shadeBlend, inscribe ) {
  'use strict';
  return {
    paint: function( val, opts, info ) {
      opts = opts || { };
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = opts.width;
      canvas.height = opts.height;
      var bkColor = opts.bkColor || 'rgb(255,255,255)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = utils.getComputedStyle( document.body, 'font' );
      context.fillStyle = opts.bkColor || 'rgb(0,0,0)';
      var title_line_height = 14;
      var painter = new inscribe();
      var numLines = painter.wrapText( context, val.title, 10, 10 + title_line_height, canvas.width - 20, title_line_height, true );
      context.fillStyle = shadeBlend( -0.25, bkColor );
      context.fillRect(0,0, canvas.width, 20 + numLines * title_line_height);
      context.fillStyle = opts.textColor || 'rgb(255,255,255)';
      numLines = painter.wrapText( context, val.title, 10, 10 + title_line_height, canvas.width - 20, title_line_height, false );
      var line_height = 16;
      var massaged_content = val.text.replace('\n',' ');
      numLines = painter.wrapText( context, massaged_content, 10, 20 + (numLines * title_line_height) + line_height, canvas.width - 20, line_height, false );
      info.numLines = numLines;
      return gfx.createTextureFromCanvas( canvas, true );
    }
  };
});
