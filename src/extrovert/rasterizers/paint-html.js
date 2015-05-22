/**
A simple Extrovert HTML rasterizer.
@module paint-html.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['extrovert/core'], function( extrovert ) {
  'use strict';
  return {
    paint: function ( val, opts ) {
      // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
      //var canvas = document.createElement('canvas');//document.getElementById('canvas');
      //var ctx = canvas.getContext('2d');
      var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
                 '<foreignObject width="100%" height="100%">' +
                 '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
                   '<em>I</em> like' +
                   '<span style="color:white; text-shadow:0 0 2px blue;">' +
                   'cheese</span>' +
                 '</div>' +
                 '</foreignObject>' +
                 '</svg>';

      var DOMURL = window.webkitURL || window.URL || window;
      //var DOMURL = window.webkitURL;
      var img = new Image();
      var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
      var url = DOMURL.createObjectURL(svg);
      //url = url.replace('%3A',':');
      // img.onload = function () {
        // ctx.drawImage(img, 0, 0);
        // DOMURL.revokeObjectURL(url);
      // }
      //img.src = url;
      var t = THREE.ImageUtils.loadTexture( url );
      //DOMURL.revokeObjectURL(url);
      return {
        tex: t,
        mat: new THREE.MeshLambertMaterial( { map: t } )
      };
    }
  };
});
