/**
Utilities for Extrovert.js.
@module utils.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['require', 'three', './cookie', './getComputedStyle'],
function( require, THREE, cookie, getComputedStyle )  {

  'use strict';
  return {
    VZERO: new THREE.Vector3(0, 0, 0),
    shadeBlend: require('./blend'),
    getCookie: cookie.getCookie,
    setCookie: cookie.setCookie,
    clearCookie: cookie.clearCookie,
    getComputedStyle: getComputedStyle,
    // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
    registerEvent: function( eventName ) {
      var classic = true, // older IE-compat method
      my.events = my.events || { },
      my.events[ eventName ] = classic ? document.createEvent( 'Event' ) : new Event( eventName ),
      classic && my.events[ eventName ].initEvent( eventName, true, true ),
      return my.events[ eventName ];
    },
    fireEvent: function( eventName ) {
      document.dispatchEvent( my.events[ eventName ] );
    }
  };

});
