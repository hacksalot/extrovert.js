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

      generate: function( noun, elems ) {
        _noun = noun;
        for( var i = 0; i < elems.length; i++ ) {
          var obj = elems[ i ];
          var pos_info = this.transform( obj );
          var mat_info = this.rasterize( obj );
          extrovert.createObject({ type: 'box', pos: pos_info.pos, dims: [pos_info.width, pos_info.height, pos_info.depth], mat: mat_info, mass: 1000 });
        }
      },

      transform: function( obj ) {
        var cont = _noun.container || (_eng.opts.src && _eng.opts.src.container) || document.body;
        return extrovert.getPosition( obj, cont, _opts.depth );
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
