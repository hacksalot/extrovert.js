/**
Top-level module for Extrovert.js. Define the library's public interface.
@module extrovert.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(function (require) {

  'use strict';
  return {
    version: require('extrovert/options/version').str,
    init: require('extrovert/core').init,
    utils: require('extrovert/utilities/utils')
  };

});
