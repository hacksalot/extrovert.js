/**
A hybrid control module for Extrovert.js.
@module universal-controls.js
@license Copyright (c) 2015 | James M. Devlin
*/

//define(['core'], function(  extrovert ) {
define(['require', '../core'], function( require, extro ) {

  return function ( object, domElement, options ) {

    var extrovert = require('../core');

    this.object = object;
    this.domElement = domElement || document;
    this.enabled = true;
    this.movementSpeed = 1500.0;
    this.turboMultiplier = 1.0;
    var _moveState = {};
    var _isTracking = false;
    var _mousePos = new THREE.Vector2();
    var _mousePosNDC = new THREE.Vector3();
    var _mousePosNewNDC = new THREE.Vector3();
    var _mouseDeltaNDC = new THREE.Vector3();
    var _posChanged = false;

    this.update = function( delta ) {
      if( _moveState.lookAt ) {
        (this.object.parent || this.object).lookAt( new THREE.Vector3(0,500,0) );
      }
      else if( _isTracking && _posChanged ) {
        var temp = _mouseDeltaNDC.x;
        _mouseDeltaNDC.x = -_mouseDeltaNDC.y;
        _mouseDeltaNDC.y = temp;
        var vRot = this.object.rotation.toVector3().add( _mouseDeltaNDC.multiplyScalar(0.65) );
        this.object.rotation.setFromVector3( vRot, 'YXZ' );
        _posChanged = false;
      }
      if( _moveState.zdir )
        this.object.translateZ( (this.movementSpeed * delta) * _moveState.zdir * this.turboMultiplier );
      if( _moveState.xdir )
        this.object.translateX( (this.movementSpeed * delta) * _moveState.xdir * this.turboMultiplier );
      if( _moveState.ydir )
        this.object.translateY( (this.movementSpeed * delta) * _moveState.ydir * this.turboMultiplier );

      if( options.yFloor ) {
        if( this.object.position.y < options.yFloor )
          this.object.position.y = options.yFloor;
      }
    };


    this.mousedown = function( e ) {
      var posX = e.offsetX === undefined ? e.layerX : e.offsetX;
      var posY = e.offsetY === undefined ? e.layerY : e.offsetY;
      _mousePos.set(posX, posY);
      _mousePosNDC = extrovert.toNDC( posX, posY, 0.5, _mousePosNDC );
      _isTracking = true;
      _posChanged = false;
    };

    this.mouseup = function( e ) {
      _isTracking = false;
      _posChanged = false;
    };

    this.mousemove = function( e ) {
      if( _isTracking ) {
        e.preventDefault();
        var posX = e.offsetX === undefined ? e.layerX : e.offsetX;
        var posY = e.offsetY === undefined ? e.layerY : e.offsetY;
        if( posX === _mousePos.x && posY === _mousePos.y )
          return;
        _mousePosNewNDC = extrovert.toNDC( posX, posY, 0.5, _mousePosNewNDC );
        _mouseDeltaNDC.subVectors( _mousePosNDC, _mousePosNewNDC );
        _posChanged = true;
        _mousePos.set( posX, posY );
        _mousePosNDC = extrovert.toNDC( posX, posY, 0.5, _mousePosNDC );
      }
    };

    this.mousewheel = function( event ) {
      var wDelta = 0;
      if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9
        wDelta = event.wheelDelta / 40;
      } else if ( event.detail ) { // Firefox
        wDelta = -event.detail / 3;
      }
      this.object.translateZ( -wDelta * 30 );
      event.preventDefault();
      event.stopPropagation();
    };

    this.keydown = function( e ) {
      //e.preventDefault();
      switch ( e.keyCode ) {
        case 87: _moveState.zdir = -1; break; // W (forward)
        case 83: _moveState.zdir =  1; break; // S (back)
        case 65: _moveState.xdir = -1; break; // A (strafe L)
        case 68: _moveState.xdir =  1; break; // D (strafe R)
        case 82: _moveState.ydir =  1; break; // R (up)
        case 70: _moveState.ydir = -1; break; // F (down)
        case 32: _moveState.lookAt = 1; break; // Space
        case 16: this.turboMultiplier = 5; break; // Shift
      }
    };

    this.keyup = function( e ) {
      switch ( e.keyCode ) {
        case 87: _moveState.zdir = 0; break; // W
        case 83: _moveState.zdir = 0; break; // S
        case 65: _moveState.xdir = 0; break; // A
        case 68: _moveState.xdir = 0; break; // D
        case 82: _moveState.ydir = 0; break; // R
        case 70: _moveState.ydir = 0; break; // F
        case 32: _moveState.lookAt = 0; break; // Space
        case 16: this.turboMultiplier = 1; break; // Shift
      }
    };
  };

});
