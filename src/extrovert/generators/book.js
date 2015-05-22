/**
The built-in "book" generator for Extrovert.js.
@module book.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['require', '../core', '../utilities/log', 'extrovert/providers/three/provider-three'], function( require, extro, log, provider ) {

  'use strict';
  
  var _opts = null;
  var _eng = null;
  var _side = null;
  var _noun = null;

  function mapTextures( cubeGeo ) {
    for (var i = 0; i < cubeGeo.faces.length ; i++) {
      var fvu = cubeGeo.faceVertexUvs[0][i];
      if( Math.abs( cubeGeo.faces[ i ].normal.z ) > 0.9) {
        for( var fv = 0; fv < 3; fv++ ) {
          if( Math.abs( fvu[fv].y ) < 0.01 ) {
            fvu[ fv ].y = 0.37;
          }
        }
      }
    }
    cubeGeo.uvsNeedUpdate = true;
  }

  var BookGenerator = function( ) {
    
    var extrovert = require('../core');   
    var utils = require('../utilities/utils');

    return {

      options: {
        name: 'book',
        material: { color: 0xFFFFFF, friction: 0.2, restitution: 1.0 },
        block: { depth: 'height' },
        clickForce: 5000,
        dims: [512, 814, 2], // Std paperback = 4.25 x 6.75 = 512x814
        pagify: true,
        title: null,
        cover: null,
        doubleSided: true,
        camera: {
          position: [0,0,400]
        }
      },

      init: function( genOpts, eng ) {
        _opts = genOpts;
        _eng = eng;
        extrovert.createPlacementPlane( [0,0,200] );
        _side = provider.createMaterial( { color: genOpts.pageColor || genOpts.material.color, friction: genOpts.material.friction, restitution: genOpts.material.restitution });
      },

      generate: function( noun, elems ) {
        extrovert.LOGGING && log.msg('book.generate( %o, %o )', noun, elems);
        _noun = noun;

        if( noun.cover ) {
          var coverMat = provider.createMaterial({ tex: provider.loadTexture( noun.cover ), friction: 0.2, resitution: 1.0 });
          var coverMesh = extrovert.createObject({ type: 'box', pos: [0,0,0], dims: _opts.dims, mat: coverMat, mass: 1000 });
        }

        function _createMat( t ) { return provider.createMaterial({ tex: t, friction: 0.2, restitution: 1.0 }); }
        function _isEven( val, index ) { return (index % 2) === 0; }
        function _isOdd( val, index ) { return !_isEven(val, index); }

        for( var i = 0; i < elems.length; i++ ) {
          var obj = (noun.adapt && noun.adapt( elems[ i ] )) || elems[ i ];
          var rast = null;
          if( noun.rasterizer ) {
            rast = ( typeof noun.rasterizer === 'string' ) ?
              _eng.rasterizers[ noun.rasterizer ] : noun.rasterizer;
          } else {
            rast = _eng.rasterizers.paint_plain_text_stream;
            //rast = extrovert.getRasterizer( obj );
          }

          if( _opts.pagify ) {
            var done = false,
              info = { },
              rastOpts = {
                width: _opts.texWidth || 512, // Force power-of-2 textures
                height: _opts.texHeight || 1024,
                bkColor: _opts.pageColor || (_opts.material && _opts.material.color) || 0xFFFFFF,
                textColor: _opts.textColor || 0x232323
              },
              textures = rast.paint(obj, rastOpts, info );
              //matArray = [ _side, _side, _side, _side, null, null ];

            var mats = textures.map( _createMat );
            var front = mats.filter( _isEven );
            var back = mats.filter( _isOdd );

            for( var tt = 0; tt < front.length; tt++ ) {
              var tilePos = [0, 0, -(tt * _opts.dims[2]) - _opts.dims[2] ];
              var matArray = [ _side, _side, _side, _side, front[ tt ], tt < back.length ? back[ tt ] : _side ];
              var meshMat = provider.createCubeMaterial( matArray );
              var mesh = extrovert.createObject({ type: 'box', pos: tilePos, dims: _opts.dims, mat: meshMat, mass: 1000 });
              mapTextures( mesh.geometry );
              extrovert.LOGGING && log.msg('Generating page %o at position %f, %f, %f', mesh, tilePos[0], tilePos[1], tilePos[2]);
            }
          }
        }
      }

    };
  };
  
  return BookGenerator;
});
