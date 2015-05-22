/**
The Extrovert options model.
@module options.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(['./defaults', '../utilities/extend'], function( defaults, extend ) {

  var ret = {
    init: _init,
    defaults: defaults,
    user: null,
    merged: null
  };

  function _init( userOpts ) {
    ret.user = userOpts;
    ret.merged = extend(true, { }, defaults, userOpts );
    return ret.merged;
  }

  return ret;

});
