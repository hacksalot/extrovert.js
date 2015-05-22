/**
A simple Extrovert HTML rasterizer.
@module paint-plain-text-elem.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['../utilities/sel', '../utilities/utils', '../utilities/blend', 'in.scribe'], function( sel, _utils, shadeBlend, inscribe ) {
  'use strict';
  return {
    paint: function( val, opts ) {
      var title_elem = val.querySelector( opts.src.title );
      var title = title_elem.innerHTML;//.text();//.trim();
      var content_elem = val.querySelector( opts.src.content );
      var content = content_elem.innerHTML;//text();//.trim();
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = val.offsetWidth;
      canvas.height = val.offsetHeight;
      var bkColor = _utils.getComputedStyle(val, 'background-color');
      if(bkColor === 'rgba(0, 0, 0, 0)')
        bkColor = 'rgb(0,0,0)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = _utils.getComputedStyle( title_elem, 'font');
      context.fillStyle = _utils.getComputedStyle( title_elem, 'color');
      //context.textBaseline = 'top';
      var title_line_height = 24;
      var painter = new inscribe();
      var num_lines = painter.wrapText( context, title, 10, 10 + title_line_height, canvas.width - 20, title_line_height, true );
      context.fillStyle = shadeBlend( -0.25, bkColor );
      context.fillRect(0,0, canvas.width, 20 + num_lines * title_line_height);
      context.fillStyle = _utils.getComputedStyle( title_elem, 'color');
      painter.wrapText( context, title, 10, 10 + title_line_height, canvas.width - 20, title_line_height, false );
      context.font = _utils.getComputedStyle( content_elem, 'font');
      var shim = '<div id="_fetchSize" style="display: none;">Sample text</div>';
      sel( opts.src.container ).insertAdjacentHTML('beforeend', shim);
      shim = sel('#_fetchSize');
      shim.innerHTML = 'x';
      var line_height = shim.offsetHeight;
      var massaged_content = content.replace('\n',' ');
      painter.wrapText( context, massaged_content, 10, 20 + (num_lines * title_line_height) + line_height, canvas.width - 20, line_height, false );
      return extro.provider.createMaterialFromCanvas( canvas, true );
    }
  };
});
