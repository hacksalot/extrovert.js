/**
The built-in 'tile' generator for Extrovert.js.
@module tile.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['require', 'extrovert/core', 'extrovert/providers/three/provider-three'], function( require, extro, provider ) {

  var TileGenerator = function() {

    var extrovert = require('extrovert/core');
    var _opts = null;
    var _eng = null;
    var _side_mat = null;
    var _noun = null;

    return {

      options: {
        name: 'tile',
        material: { color: 0xFF8844, friction: 0.2, restitution: 1.0 },
        block: { depth: 'height' },
        clickForce: 900000,
        rows: 10, cols: 10,
        dims: [250, 500, 2]
      },

      init: function( genOpts, eng ) {
        _opts = genOpts;
        _eng = eng;
        extrovert.createPlacementPlane( [0,0,200] );
        _side_mat = provider.createMaterial( genOpts.material );
      },

      generate: function( noun, elems ) {
        _noun = noun;
        for( var i = 0; i < elems.length; i++ ) {
          var obj = elems[ i ];
          var row = Math.floor( i / _opts.cols );
          var col = i % _opts.cols;
          var tilePos = [col * _opts.dims[0], row * _opts.dims[1], 0 ];
          var rast = null;
          if( noun.rasterizer ) {
            if( typeof noun.rasterizer === 'string' )
              rast = _eng.rasterizers[ noun.rasterizer ];
            else
              rast = noun.rasterizer;
          }
          else {
            rast = extrovert.getRasterizer( obj );
          }
          var safeObj = ( noun.adapt && noun.adapt(obj) ) || obj;
          var texOpts = { width: _opts.dims[0], height: _opts.dims[1], bkColor: _opts.bkColor, textColor: _opts.textColor };
          var tileTexture = rast.paint( safeObj, texOpts, { } );
          var tileMat = provider.createMaterial({ tex: tileTexture, friction: 0.2, restitution: 1.0 });
          extrovert.createObject({ type: 'box', pos: tilePos, dims: _opts.dims, mat: tileMat, mass: 1000 });
        }
      }

    };
  };

  return TileGenerator;

});
