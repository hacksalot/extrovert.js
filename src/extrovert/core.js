/**
Core module for the Extrovert engine.
@module core.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(

[
  './options/version',
  './options/options',
  './options/defaults',
  './utilities/utils',
  './utilities/extend',
  './utilities/sel',
  './utilities/is',
  './utilities/log',
  './utilities/offset',
  './utilities/detect',
  './providers/three/provider-three',
  './rasterizers/paint-img',
  './rasterizers/paint-element',
  './rasterizers/paint-plain-text',
  './rasterizers/paint-plain-text-stream',
  './generators/book',
  './generators/box',
  './generators/direct',
  './generators/extrude',
  './generators/tile',
  './controls/universal-controls',
  'physijs'
],

function
(
  version,
  options,
  defaults,
  utils,
  extend,
  sel,
  is,
  log,
  offset,
  detect,
  provider,
  paint_img,
  paint_element,
  paint_plain_text,
  paint_plain_text_stream,
  gen_book,
  gen_box,
  gen_direct,
  gen_extrude,
  gen_tile,
  UniversalControls,
  Physijs

){

  var my = { };

  var eng = {
    camera: null,
    scene: null,
    renderer: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    width: 100,
    height: 100,
    gravity: new THREE.Vector3( defaults.gravity[0], defaults.gravity[1], defaults.gravity[2] ),
    selected: null,
    start_time: 0,
    last_time: 0,
    objects: [],
    drag_plane: null,
    placement_plane: null,
    offset: new THREE.Vector3(),
    generator: null,
    clock: new THREE.Clock(),
    supportsWebGL: false,
    supportsCanvas: false,
    target: 'body'
  };

  var _opts = null;

  my.LOGGING = true;

  my.init = function( target, opts ) {

    opts = opts || { };
    my.provider = provider;
    my.LOGGING && log.msg('Extrovert %s', version.str);
    my.LOGGING && log.msg('User options: %o', opts );

    eng.supportsWebGL = detect.supportsWebGL();
    eng.supportsCanvas = detect.supportsCanvas();
    if( ( !eng.supportsWebGL && !eng.supportsCanvas ) ||
        ( opts.renderer === 'WebGL' && !eng.supportsWebGL ) ||
        ( opts.renderer === 'Canvas' && !eng.supportsCanvas ))
      return false;

    // Remove some troublesome stuff from the shader on IE. Needs work.
    // https://github.com/mrdoob/three.js/issues/4843#issuecomment-43957698
    var ua = window.navigator.userAgent;
    if( ~ua.indexOf('MSIE ') || ~ua.indexOf('Trident/') ) {
      Object.keys(THREE.ShaderLib).forEach(function (key) { // [3]
        THREE.ShaderLib[key].fragmentShader =
        THREE.ShaderLib[key].fragmentShader.replace('#extension GL_EXT_frag_depth : enable', '');
      });
    }

    initOptions( target, opts );
    initRenderer( _opts );
    initWorld( _opts, eng );
    initCanvas( _opts );
    initPhysics( _opts );
    initControls( _opts, eng );
    initEvents();
    initAvatar( _opts.avatar );
    start();
    return true;
  };

  var $ = window.jQuery;
  if( $ ) {
    $.fn.extrovert = function( opts ) {
      return this.each(function() {
        my.init( this, opts );
      });
    };
  }

  function initOptions( target, user_opts ) {

    eng.target = target;
    eng.userOpts = user_opts;
    _opts = eng.opts = my.options = options.init( user_opts );

    if( _opts.physics.enabled && _opts.physics.provider === 'physijs' ) {
      Physijs.scripts.worker = _opts.physics.options.worker;
      Physijs.scripts.ammo = _opts.physics.options.ammo;
    }

    // TODO: legacy holdover; remove/fix
    eng.rasterizers = {
      img: paint_img,
      element: paint_element,
      plain_text: paint_plain_text,
      plain_text_stream: paint_plain_text_stream
    };

    eng.generators = {
      extrude: gen_extrude,
      tile: gen_tile,
      book: gen_book,
      direct: gen_direct,
      box: gen_box
    };

    return _opts;
  }

  my.getRasterizer = function( obj ) {
    var r = null;
    if( obj instanceof HTMLImageElement )
      r = eng.rasterizers.img;
    else if (obj.nodeType !== undefined )
      r = eng.rasterizers.elem;
    else if (my.Utils.isPlainObject( obj ) )
      r = eng.rasterizers.plain_text;
    return r;
  };

  function initGenerator( transformOptions ) {

    var gen = null;
    if( !transformOptions.type )
      gen = new gen_extrude();
    else if (typeof transformOptions === 'string')
      gen = new eng.generators[ transformOptions ]();
    else
      gen = new eng.generators[ transformOptions.type ]();

    var mergedOptions = extend(true, { }, defaults, gen.options );
    mergedOptions = extend(true, { }, mergedOptions, eng.userOpts );
    mergedOptions = extend(true, { }, mergedOptions, transformOptions );
    gen.init && gen.init( mergedOptions, eng );

    return gen;
  }

  function initWorld( opts, eng ) {

    // TODO: CORS
    //THREE.ImageUtils.crossOrigin = '*';
    //THREE.Loader.prototype.crossOrigin = '*';

    my.createScene( opts );

    var ico = opts.init_cam_opts ? extend(true, {}, opts.camera, opts.init_cam_opts ) : opts.camera;
    if( ico.type === 'orthographic' ) {
      ico.left = ico.left || eng.width / - 2;
      ico.right = ico.right || eng.width / 2;
      ico.top = ico.top || eng.height / 2;
      ico.bottom = ico.bottom || eng.height / - 2;
    }
    else {
      ico.aspect = eng.width / eng.height;
    }
    var cam = my.provider.createCamera( ico );
    my.LOGGING && log.msg('Created camera at [%f,%f,%f]: %o', cam.position.x, cam.position.y, cam.position.z, cam);
    eng.camera = cam;

    // TODO: Remove/refactor
    if( opts.controls.allow_drag ) {
      eng.drag_plane = my.createObject( {
        type: 'plane',
        dims: [2000,2000,8],
        visible: false,
        color: 0x000000,
        opacity: 0.25,
        transparent: true } );
    }

    createScenePrimitives( eng.scene, opts );

    // TODO: still necessary?
    eng.scene.updateMatrix();

    var tforms = (opts.transform || opts.transforms) || // Either spelling
      [{ type: 'extrude', src: 'img'/*, container: 'body'*/}]; // Default if missing
    tforms = ( !is.array( tforms ) ) ? [ tforms ] : tforms; // Force array

    tforms.reduce( function( obj, trans, idx ) {
      var src = trans.src || '*';
      var cont = trans.container || (opts.src && opts.src.container) || opts.container || document.body;
      if( typeof cont === 'string' ) {
        cont = sel( cont );
        if(cont.length !== undefined) cont = cont[0];
      }
      var elems = ( typeof src === 'string' ) ?
        cont.querySelectorAll( src ) : src;

      var gen = initGenerator( trans );
      gen.generate( trans, elems );

    }, { });

    var oc = opts.camera;
    oc.rotation && eng.camera.rotation.set( oc.rotation[0], oc.rotation[1], oc.rotation[2], 'YXZ' );

    if ( oc.positionNDC ) {
      oc.position = my.ndcToWorld( oc.positionNDC );
    }

    if( oc.position ) {
      eng.camera.position.set( oc.position[0], oc.position[1], oc.position[2] );
      my.LOGGING && log.msg('Camera moved to [%f,%f,%f]: %o', oc.position[0], oc.position[1], oc.position[2], cam);
    }

    provider.fiatLux( opts.lights ).forEach(function(val) {
      eng.scene.add(val);
    });
  }

  function initControls( opts, eng ) {
    eng.controls = my.createControls( opts.controls, eng.camera, eng.renderer.domElement );
    return eng.controls;
  }

  function initRenderer( opts ) {

    if( eng.target ) {
      var cont = (typeof eng.target === 'string') ?
        sel( eng.target ): eng.target;
      if( cont.length !== undefined )
        cont = cont[0];
      var rect = cont.getBoundingClientRect();
      eng.width = rect.right - rect.left;
      eng.height = rect.bottom - rect.top;
    }
    else {
      eng.width = window.innerWidth;
      eng.height = window.innerHeight;
    }

    // Choose a [WebGL|Canvas]Renderer based on options
    var rendName = opts.renderer;
    if( !rendName || rendName === 'Any' ) {
      rendName = eng.supportsWebGL ? 'WebGL' : (eng.supportsCanvas ? 'Canvas' : null);
    }
    var rendOpts = rendName === 'Canvas' ? undefined : { antialias: true };

    my.LOGGING && log.msg("Creating '%s' renderer with size %d x %d.", rendName, eng.width, eng.height);

    eng.renderer = new THREE[rendName + 'Renderer']( rendOpts );
    eng.renderer.setPixelRatio( window.devicePixelRatio );
    eng.renderer.setSize( eng.width, eng.height );
    opts.bkcolor && eng.renderer.setClearColor( opts.bkcolor );
    eng.renderer.domElement.setAttribute('tabindex', '0'); // [2]
    eng.renderer.domElement.style += ' position: relative;';
  }

  function initCanvas( opts ) {
    if( eng.target ) {
      var action = opts.action || 'append';
      var target_container = (typeof eng.target === 'string') ?
        sel( eng.target ) : eng.target;
      if( target_container.length !== undefined ) target_container = target_container[0];

      if( action === 'replace' ) {
        while (target_container.firstChild) { //http://stackoverflow.com/a/3955238
          target_container.removeChild(target_container.firstChild);
        }
      }

      if ( action !== 'replaceWith' ) {
        target_container.appendChild( eng.renderer.domElement );
      } else {
        target_container.parentNode.insertBefore( eng.renderer.domElement, target_container );
        target_container.parentNode.removeChild( target_container );
      }
    }
  }

  my.createObject = function( desc ) {
    my.LOGGING && log.msg('Creating object %o at [%f,%f,%f].', desc, desc.pos[0], desc.pos[1], desc.pos[2] );
    var mesh = my.provider.createObject( desc );
    eng.scene.add( mesh );
    eng.objects.push( mesh );
    mesh.updateMatrix();
    mesh.updateMatrixWorld();
    return mesh;
  };

  my.createControls = function( control_opts, camera, domElement ) {
    if( control_opts.type === 'universal' ) {
      return new UniversalControls( camera, undefined, control_opts );
    }
    return null;
  };

  my.createScene = function( scene_opts ) {
    eng.scene = scene_opts.physics.enabled ? new Physijs.Scene() : new THREE.Scene();
    return eng.scene;
  };

  function createScenePrimitives( scene, scene_opts ) {
    if( scene_opts.scene && scene_opts.scene.items ) {
      for(var i = 0; i < scene_opts.scene.items.length; i++) {
        var mesh = my.createObject( scene_opts.scene.items[ i ] );
        scene.add( mesh );
      }
    }
  }

  function initPhysics( opts ) {
    if( opts.physics.enabled ) {
      eng.gravity.set( opts.gravity[0], opts.gravity[1], opts.gravity[2] );
      eng.scene.setGravity( eng.gravity );
      eng.scene.addEventListener('update', update);
    }
  }

  function initEvents() {
    // TODO: Register Extrovert-specific events
    utils.registerEvent('extro.objectClick');

    eng.renderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
    eng.renderer.domElement.addEventListener( 'mouseup', onMouseUp, false );
    eng.renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
    /*eng.renderer.domElement.*/document.addEventListener( 'keydown', onKeyDown, false );
    /*eng.renderer.domElement.*/document.addEventListener( 'keyup', onKeyUp, false );
    eng.renderer.domElement.addEventListener( 'wheel', onMouseWheel, false );
    window.addEventListener( 'resize', window_resize, false );
  }

  function initTimer() {
    eng.start_time = eng.last_time = Date.now() / 1000.0;
  }

  function initAvatar( avOpts ) {
    if( avOpts && avOpts.enabled ) {
      var avatar = my.createObject( avOpts );
      eng.camera.position.set(0,0,0);
      avatar.add( eng.camera );
      eng.scene.add( avatar );
      eng.objects.push( avatar );
    }
  }

  // TODO: improve simulation timing/structure
  function start() {
    window.requestAnimFrame =            //[5]
      window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function(/* function */ callback, /* DOMElement */ element){
        window.setTimeout(callback, 1000 / 60);
      };

    _opts.onload && _opts.onload(); // Fire the 'onload' event
    animate();
  }

  function animate() {
    requestAnimFrame( animate );
    render();
  }

  function update() {
    eng.scene.simulate();
  }

  function render() {

    _opts.physics.enabled && update();
    eng.controls && eng.controls.enabled && eng.controls.update( eng.clock.getDelta() );

    // Housekeeping for Phyijs's __dirtyPosition flag. TODO: Refactor this.
    if( !_opts.move_with_physics ) {
       // Maintain the __dirtyPosition flag while dragging and after touching
      if( eng.selected !== null ) {
        eng.selected.__dirtyPosition = true;
      }
      for ( var i = 0, l = eng.objects.length; i < l; i ++ ) {
        if( eng.objects[ i ].has_been_touched ) {
          eng.objects[ i ].__dirtyPosition = true;
        }
      }
    }

    // Render everything
    eng.renderer.clear();
    eng.css_renderer && eng.css_renderer.render( eng.css_scene, eng.camera );
    eng.renderer.render( eng.scene, eng.camera );
  }

  my.screenToWorld = function( posX, posY, placement_plane, extents ) {
    eng.raycaster.setFromCamera( my.toNDC( posX, posY, 0.5, new THREE.Vector2(), extents ), eng.camera );
    var p = placement_plane || eng.placement_plane;
    var intersects = eng.raycaster.intersectObject( p );
    return (intersects.length > 0) ? intersects[0].point : null;
  };

  my.ndcToWorld = function( pos, placement_plane ) {
    var temp = new THREE.Vector3(pos[0], pos[1], pos[2]);
    eng.raycaster.setFromCamera( temp, eng.camera );
    var p = placement_plane || eng.placement_plane;
    var intersects = eng.raycaster.intersectObject( p );
    return (intersects.length > 0) ?
      [ intersects[0].point.x, intersects[0].point.y, intersects[0].point.z ]
      : null;
  };

  function applyForce( thing ) {
    if( _opts.physics.enabled ) {
      var rotation_matrix = new THREE.Matrix4().extractRotation( thing.object.matrix );
      var effect = thing.face.normal.clone().negate().multiplyScalar( _opts.clickForce ).applyMatrix4( rotation_matrix );
      var force_offset = thing.point.clone().sub( thing.object.position );
      thing.object.applyImpulse( effect, force_offset );
    }
  }

  function onMouseDown( e ) {

    e.preventDefault();

    var xpos = e.offsetX === undefined ? e.layerX : e.offsetX; //[1]
    var ypos = e.offsetY === undefined ? e.layerY : e.offsetY;

    eng.mouse = my.toNDC( xpos, ypos, 0.5, eng.mouse );

    if ( !_opts.avatar ) {
      eng.raycaster.setFromCamera( eng.mouse, eng.camera );
    }
    else {
      //http://stackoverflow.com/a/28873205
      var cameraPosition = new THREE.Vector3();
      cameraPosition.setFromMatrixPosition( eng.camera.matrixWorld ); // world position
      eng.raycaster.ray.origin.copy( cameraPosition );
      eng.raycaster.ray.direction.set( eng.mouse.x, eng.mouse.y, 0.5 ).unproject( eng.camera ).sub( cameraPosition ).normalize();
    }

    var intersects = eng.raycaster.intersectObjects( eng.objects );
    if( intersects.length !== 0 ) {

      if( _opts.objectClicked && false === _opts.objectClicked( e, intersects ))
        return;

      if( e.ctrlKey ) {
        eng.selected = intersects[ 0 ].object;
        eng.selected.has_been_touched = true;
        eng.drag_plane.position.copy( eng.selected.position );
        eng.offset.copy( intersects[ 0 ].point ).sub( eng.selected.position );
        if( _opts.physics.enabled ) {
          eng.selected.setAngularFactor( utils.VZERO );
          eng.selected.setLinearFactor( utils.VZERO );
          eng.selected.setAngularVelocity( utils.VZERO );
          eng.selected.setLinearVelocity( utils.VZERO );
        }
        else {
          eng.selected.temp_velocity = eng.selected.velocity.clone();
          eng.selected.velocity.set(0,0,0);
        }
      }
      else {
        applyForce( intersects[0] ); // [4]
      }
    }

    _opts.clicked && _opts.clicked( e, eng.selected );

    if( eng.controls && eng.controls.enabled ) {
      eng.controls.mousedown( e );
    }
  }

  function onMouseMove( e ) {
    if( eng.controls && eng.controls.enabled ) {
      eng.controls.mousemove( e );
      return;
    }

    e.preventDefault();
    var xpos = e.offsetX === undefined ? e.layerX : e.offsetX; //[1]
    var ypos = e.offsetY === undefined ? e.layerY : e.offsetY;
    eng.mouse = my.toNDC( xpos, ypos, 0.5, eng.mouse );
    if ( eng.selected ) {
      eng.raycaster.setFromCamera( eng.mouse, eng.camera );
      var intersects = eng.raycaster.intersectObject( eng.drag_plane );
      if( _opts.move_with_physics ) {
        var lin_vel = intersects[ 0 ].point.sub( eng.selected.position );
        lin_vel.z = 0;
        eng.selected.setLinearVelocity( lin_vel );
      }
      else {
        eng.selected.position.copy( intersects[ 0 ].point.sub( eng.offset ) );
        eng.selected.__dirtyPosition = true;
      }
    }
  }

  function onMouseUp( e ) {
    if( eng.controls && eng.controls.enabled ) {
      eng.controls.mouseup( e );
      return;
    }
    e.preventDefault();
    if( eng.selected && _opts.physics.enabled ) {
      if( _opts.physics.enabled ) {
        var oneVec = new THREE.Vector3( 1, 1, 1 );
        eng.selected.setAngularFactor( oneVec );
        eng.selected.setLinearFactor( oneVec );
        eng.selected.__dirtyPosition = true;
      }
      else {
        eng.raycaster.setFromCamera( eng.mouse, eng.camera );
        var intersects = eng.raycaster.intersectObject( eng.drag_plane );
        eng.selected.position.copy( intersects[ 0 ].point.sub( eng.offset ) );
      }
      eng.selected.updateMatrixWorld();
      eng.selected.updateMatrix();
    }
    eng.selected = null;
  }

  function onKeyDown( e ) {
    eng.controls && eng.controls.enabled && eng.controls.keydown( e );
  }

  function onKeyUp( e ) {
    eng.controls && eng.controls.enabled && eng.controls.keyup( e );
  }

  function onMouseWheel( e ) {
    eng.controls && eng.controls.enabled && eng.controls.mousewheel( e );
  }

  my.getPosition = function( val, container, zDepth ) {

    // Safely get the position of the HTML element [1] relative to its parent
    var src_cont = (typeof container === 'string') ?
      sel( container ) : container;
    if(src_cont.length !== undefined) src_cont = src_cont[0];
    var parent_pos = offset( src_cont );
    var child_pos = offset( val );
    var pos = { left: child_pos.left - parent_pos.left, top: child_pos.top - parent_pos.top };

    // Get the position of the element's left-top and right-bottom corners in
    // WORLD coords, based on where the camera is.
    var topLeft = my.screenToWorld( pos.left, pos.top, eng.placement_plane );
    var botRight = my.screenToWorld( pos.left + val.offsetWidth, pos.top + val.offsetHeight, eng.placement_plane );
    // Calculate dimensions of the element (in world units)
    var block_width = Math.abs( botRight.x - topLeft.x );
    var block_height = Math.abs( topLeft.y - botRight.y );

    if(zDepth === 'width')
      zDepth = block_width;
    else if (zDepth === 'height')
      zDepth = block_height;

    var block_depth = zDepth || Math.abs( topLeft.z - botRight.z ) || 1.0;

    // Offset by the half-height/width so the corners line up
    return {
      pos:
        [topLeft.x + (block_width / 2),
        topLeft.y - (block_height / 2),
        topLeft.z - (block_depth / 2)],
      width: block_width,
      height: block_height,
      depth: block_depth
    };
  };

  my.getPositionDirect = function( val, container, zDepth, forceZ ) {

    // Safely get the position of the HTML element [1] relative to its parent
    var src_cont = (typeof container === 'string') ?
      sel( container ) : container;
    if(src_cont.length !== undefined) src_cont = src_cont[0];
    var parent_pos = offset( src_cont );
    var child_pos = offset( val );
    var pos = { left: child_pos.left - parent_pos.left, top: child_pos.top - parent_pos.top };

    var topLeft = { x: pos.left, y: pos.top, z: forceZ || 0.0 };
    var botRight = { x: pos.left + val.offsetWidth, y: pos.top + val.offsetHeight, z: forceZ || 0.0 };
    var block_width = Math.abs( botRight.x - topLeft.x );
    var block_height = Math.abs( topLeft.y - botRight.y );

    if(zDepth === 'width')
      zDepth = block_width;
    else if (zDepth === 'height')
      zDepth = block_height;
    var block_depth = zDepth || Math.abs( topLeft.z - botRight.z ) || 1.0;

    return {
      pos:
        [topLeft.x + (block_width / 2),
        topLeft.y - (block_height / 2),
        topLeft.z - (block_depth / 2)],
      width: block_width,
      height: block_height,
      depth: block_depth
    };
  };


  // TODO: No need to create geometry to place objects; replace with unproject at specified Z
  my.createPlacementPlane = function( pos, dims ) {
    dims = dims || [200000,200000,1];
    var geo = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
    eng.placement_plane = _opts.physics.enabled ?
      new Physijs.BoxMesh( geo, new THREE.MeshBasicMaterial( { color: 0xAB2323, opacity: 1.0, transparent: false } ), 0 ) :
      new THREE.Mesh( geo, new THREE.MeshBasicMaterial( { color: 0xAB2323, opacity: 1.0, transparent: false } ));
    eng.placement_plane.visible = false;
    pos && eng.placement_plane.position.set( pos[0], pos[1], pos[2] );
    // TODO: Figure out which update calls are necessary
    eng.scene.updateMatrix();
    eng.placement_plane.updateMatrix();
    eng.placement_plane.updateMatrixWorld();
    my.LOGGING && log.msg('Created placement plane at [%o]: %o', eng.placement_plane.position, eng.placement_plane);
    return eng.placement_plane;
  };

  function window_resize() {
    var rect = eng.renderer.domElement.parentNode.getBoundingClientRect();
    eng.width = rect.right - rect.left;
    eng.height = rect.bottom - rect.top;
    eng.camera.aspect = eng.width / eng.height;
    eng.camera.updateProjectionMatrix();
    eng.renderer.setSize( eng.width, eng.height );
  }

  my.toNDC = function( posX, posY, posZ, coords, extents ) {
    var width = (extents || eng).width;
    var height = (extents || eng).height;
    coords.x = ( posX / width ) * 2 - 1;
    coords.y = - ( posY / height ) * 2 + 1;
    // TODO: Sometimes coords will be a Vector2 and not have a .z component
    coords.z = posZ;
    return coords;
  };

  return my;

});

//
// [1]: FireFox doesn't support .offsetX:
//      https://bugzilla.mozilla.org/show_bug.cgi?id=69787
//      http://stackoverflow.com/q/11334452
//
// [2]: Give the canvas a tabindex so it receives keyboard input and set the
//      position to relative so coordinates are canvas-local.
//      http://stackoverflow.com/a/3274697
//
// [4]: Process physical interaction events on mousedown instead of mouseup.
//
// [5]: Shim window.requestAnimation to window.requestAnim. Kitchen-sink version
//      here: https://github.com/chrisdickinson/raf
//
