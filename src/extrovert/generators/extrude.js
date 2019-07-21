/**
The built-in 'extrude' generator for Extrovert.js.
@module extrude.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(
[
  'require',
  'extrovert/core',
  'extrovert/providers/three/provider-three'
],
function( require, extro, provider )
{
  'use strict';

  var _opts, _eng, _side_mat, _noun;

  var ExtrudeGenerator = function( ) {

    var extrovert = require('extrovert/core');

    return {

      options: {
        name: 'extrude',
        material: { color: 0xFF8844, friction: 0.2, restitution: 1.0 },
        depth: 1,
        map: 'fit'
      },

      init: function( genOpts, eng ) {
        _opts = genOpts;
        _eng = eng;
        _side_mat = provider.createMaterial( genOpts.material );
        extrovert.createPlacementPlane( [ 0,0,0 ] );
      },

      /**
      Generate 3D objects from a collection of HTML elements.
      @param elems An array of HTML elements such as <img> elements.
      */
      generate: function( noun, elems ) {
        _noun = noun;

        // If "align: content-bottom" is specified, then the bottom edge of
        // the bottommost HTML element (going down the screen) is interpreted
        // as Y = 0.
        var floor = null;
        if( _noun.align == 'content-bottom' ) {
          floor = 0.0;
          for( var i = 0; i < elems.length; i++ ) {
            var ob = $(elems[i]);
            var el_floor = ob.offset().top + ob.height();
            if( el_floor > floor )
              floor = el_floor;
          }
        }

        for( var j = 0; j < elems.length; j++ ) {
          var obj = elems[ j ];
          var pos_info = this.transform( obj, floor );
          var mat_info = this.rasterize( obj );
          extrovert.createObject({ type: 'box', pos: pos_info.pos, dims: [pos_info.width, pos_info.height, pos_info.depth], mat: mat_info, mass: 1000 });
        }
      },

      /**
      Transform an entity's 2D HTML location (within its containing element)
      to 3D world coordinates.
      */
      transform: function( obj, floor ) {
        var cont = _noun.container || (_eng.opts.src && _eng.opts.src.container) || document.body;
        return extrovert.getPosition( obj, cont, _opts.depth, floor );
      },

      rasterize: function( obj ) {
        var rast = null;
        if( _noun.rasterizer ) {
          rast = ( typeof _noun.rasterizer === 'string' ) ?
            _eng.rasterizers[ _noun.rasterizer ] : _noun.rasterizer;
        }
        rast = rast || extrovert.getRasterizer( obj );
        var tileTexture = rast.paint(( _noun.adapt && _noun.adapt(obj) ) || obj );

        var material = provider.createMaterial({ tex: tileTexture, friction: 0.2, restitution: 0.0 });

        if( !_opts.map || _opts.map === 'all' ) {
          return material;
        }

        var matArray;
        if( _opts.map == 'fit' ) {
          if( !_opts.depth || _opts.depth === 'height' )
            matArray = [ _side_mat, _side_mat, material, material, material, material ];
          else if( _opts.depth === 'width' )
            matArray = [ material, material, _side_mat, _side_mat, material, material ];
          else
            matArray = [ _side_mat, _side_mat, _side_mat, _side_mat, material, material ];
        }

        return provider.createCubeMaterial( matArray );
      }
    };
  };

  return ExtrudeGenerator;

});
