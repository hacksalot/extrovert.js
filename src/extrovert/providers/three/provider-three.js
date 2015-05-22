/**
THREE.js subsystem provider for Extrovert.js.
@module provider-three.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['extrovert/options/options', 'three', 'physijs'], function( options, THREE, Physijs ) {

  'use strict';

  /**
  Module object.
  */
  var my = {};

  /**
  Create a camera from a generic options object.
  @method createCamera
  */
  my.createCamera = function( copts ) {
    var cam = copts.type != 'orthographic' ?
      new THREE.PerspectiveCamera( copts.fov, copts.aspect, copts.near, copts.far ) :
      new THREE.OrthographicCamera( copts.left, copts.right, copts.top, copts.bottom, copts.near, copts.far );
    copts.position && cam.position.set( copts.position[0], copts.position[1], copts.position[2] );
    if( copts.up ) cam.up.set( copts.up[0], copts.up[1], copts.up[2] );
    if( copts.lookat ) cam.lookAt( new THREE.Vector3( copts.lookat[0], copts.lookat[1], copts.lookat[2] ) );
    cam.updateMatrix(); // TODO: Are any of these calls still necessary?
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    return cam;
  };

  /**
  Create a material from a generic description.
  @method createMaterial
  */
  my.createMaterial = function( desc ) {

    var mat = new THREE.MeshLambertMaterial({ color: desc.color || 0xFFFFFF, map: desc.tex || null });
    return (options.merged.physics.enabled && !desc.noPhysics) ?
      Physijs.createMaterial( mat, desc.friction || 0.2, desc.restitution || 1.0 )
      : mat;

  };

  /**
  Create a texture from a canvas. Defer to THREE for now.
  @method createMaterialFromCanvas
  */
  my.createMaterialFromCanvas = function( canvas, needsUpdate ) {
    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = needsUpdate || false;
    return { tex: texture, mat: new THREE.MeshLambertMaterial( { map: tex } ) };
  };


  /**
  Load an image as a texture. Defers to THREE for now.
  @method loadTexture
  */
  my.loadTexture = function( src ) {
    return THREE.ImageUtils.loadTexture( src );
  };

  /**
  Create a texture from a canvas. Defer to THREE for now.
  @method createTextureFromCanvas
  */
  my.createTextureFromCanvas = function( canvas, needsUpdate ) {
    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = needsUpdate || false;
    return texture;
  };


  /**
  Helper function to create a specific mesh type.
  @method createMesh
  @param geo A THREE.XxxxGeometry object.
  @param mesh_type Either 'Box' or 'Plane'.
  @param mat A THREE.XxxxMaterial object.
  @param force_simple A flag to force using a THREE.Mesh instead of a Physijs.Mesh.
  @param mass The mass of the object, if physics is enabled.
  */
  function createMesh( geo, mesh_type, mat, force_simple, mass ) {
    return options.merged.physics.enabled && !force_simple ?
      new Physijs[ mesh_type + 'Mesh' ]( geo, mat, mass ) : new THREE.Mesh(geo, mat);
  }


  /**
  Create a six-sided material from an array of materials.
  @method createCubeMaterial
  */
  my.createCubeMaterial = function( faceMaterials ) {
    return new THREE.MeshFaceMaterial( faceMaterials );
  };

  /**
  Create a mesh object from a generic description. Currently only supports box
  and plane meshes; add others as necessary.
  @method createObject
  */
  my.createObject = function( desc ) {
    // Set up vars with reasonable defaults for color, opacity, transparency.
    var mesh = null, geo = null, mat = null;
    var rgb = desc.color || 0xFFFFFF;
    var opac = desc.opacity || 1.0;
    var trans = desc.transparent || false;
    // Create Box-type meshes
    if( desc.type === 'box' ) {
      geo = new THREE.BoxGeometry( desc.dims[0], desc.dims[1], desc.dims[2] );
      mat = desc.mat || new THREE.MeshLambertMaterial( { color: rgb, opacity: opac, transparent: trans } );
      mesh = createMesh(geo, 'Box', mat, false, desc.mass);
    }
    // Create Plane-type meshes
    else if( desc.type === 'plane' ) {
      geo = new THREE.PlaneBufferGeometry( desc.dims[0], desc.dims[1] );
      mat = desc.mat || new THREE.MeshBasicMaterial( { color: rgb, opacity: opac, transparent: trans } );
      mesh = createMesh( geo, null, mat, true, desc.mass );
    }
    // Set object position and rotation (only if explicitly specified)
    if( desc.pos )
      mesh.position.set( desc.pos[0], desc.pos[1], desc.pos[2] );
    if( desc.rot )
      mesh.rotation.set( desc.rot[0], desc.rot[1], desc.rot[2], 'YXZ' );
    // Set visibility flag
    if( desc.visible === false )
      mesh.visible = false;
    // Turn off shadows for now.
    mesh.castShadow = mesh.receiveShadow = false;
    return mesh;
  };

 /**
  Create one or more lights from a generic description. Supports ambient, point,
  spotlight, and hemisphere lighting. Add additional types as necessary.
  @method fiatLux
  @param light_opts A valid object representing a light.
  */
  my.fiatLux = function( light_opts ) {

    if( !light_opts || light_opts.length === 0 )
      return;

    var lights = [];
    var new_light = null;

    for( var idx = 0; idx < light_opts.length; idx++ ) {
      var val = light_opts[ idx ];
      if( val.type === 'ambient' )
        new_light = new THREE.AmbientLight( val.color );
      else if (val.type === 'point')
        new_light = new THREE.PointLight( val.color, val.intensity, val.distance );
      else if (val.type === 'spotlight')
        new_light = createSpotlight( val );
      else if (val.type === 'hemisphere')
        new_light = new THREE.HemisphereLight( val.color, val.groundColor, val.intensity );
      else
        return;

      if( val.type !== 'ambient' && val.type !== 'hemisphere' ) {
        if( val.pos )
          new_light.position.set( val.pos[0], val.pos[1], val.pos[2] );
        else
          new_light.position.copy( eng.camera.position );
      }
      lights.push( new_light );
    }

    return lights;
  };
  
  /**
  Create a spotlight with the specified color. TODO: adjust shadowmap settings.
  @method createSpotlight
  */
  function createSpotlight( light ) {
    // var spotLight = new THREE.SpotLight(
    // light.color, light.intensity || 0.5, light.distance || 1000,
    // light.angle || 35 );
    var spotLight = new THREE.SpotLight( light.color );
    spotLight.shadowCameraVisible = false;
    return spotLight;
  }  

  /**
  Module return.
  */
  return my;

});
