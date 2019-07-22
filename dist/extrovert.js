/**!
*
* Extrovert.js 0.1.0
* ----------------------------------------------------------------------------
* @license Copyright (c) 2015 James M. Devlin | All Rights Reserved.
* See: http://extrovert3d.com/license for details.
*
*
* Extrovert.js incorporates the following libraries:
*
*
* almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation. All Rights Reserved.
* Available via the MIT or new BSD license. See: https://github.com/jrburke/almond
*
* in.scribe 0.1.0 Copyright (c) 2015, James M. Devlin | All Rights Reserved.
* Available via the MIT license. See: https://github.com/devlinjd/in.scribe
*
*
* Extrovert.js depends on the following external libraries:
*
*
* THREE.js R70+ Copyright (c) 2015 by mrdoob | All Rights Reserved.
* Available via the MIT license. See: https://github.com/mrdoob/three.js
*
* Physi.js 0.3 Copyright (c) 2015 by ? | All Rights Reserved.
* Available via the MIT license. See: https://github.com/chandlerprall/physijs
*
*/


(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD.
      define(['three', 'physijs'], factory);
  } else {
      // Browser globals
      root.extrovert = factory( root.THREE, root.Physijs );
  }
}(this, function ( THREE, Physijs ) {
/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

/**
Default Extrovert options.
@module defaults.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/options/version',{
  major: 0,
  minor: 1,
  patch: 3,
  str: "0.1.3"
});

/**
Default Extrovert options.
@module defaults.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/options/defaults',{
    renderer: 'Any',
    gravity: [0,0,0],
    camera: {
      fov: 35,
      near: 1,
      far: 10000,
      position: [0,0,200]
    },
    controls: {
      type: 'universal',
      enabled: true,
      allow_drag: false
    },
    physics: {
      provider: 'physijs',
      enabled: true,
      options: {
        worker: '/js/pjsworker.js',
        ammo: 'ammo.js'
      }
    },
    block: { depth: 1 },
    move_with_physics: true,
    clickForce: 900000,
    onload: null,
    onerror: null,
    created: null,
    clicked: null,
    lights: [
      { type: 'ambient', color: 0xffffff }
    ]
});

/**
JavaScript type-testing methods.
@module is.js
@license Copyright (c) 2015 | James M. Devlin
*/

define( 'extrovert/utilities/is',[],function() {

  return {
    array: function( obj ) {
      return Object.prototype.toString.call( obj ) === '[object Array]';
    },
    string: function( obj ) {
      return typeof object === 'string';
    },
    plainObject: function( obj ) {
      if ((typeof obj !== "object") || obj.nodeType || (obj !== null && obj === obj.window)) {
        return false;
      }
      if (obj.constructor && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
      return true;
    }
  };

});

/**
Plain JavaScript replacement of jQuery .extend.
@module extend.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/utilities/extend',['./is'], function( is ) {

  var my = function _extend() {

    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
      deep = target;
      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    //if (typeof target !== "object" && !jQuery.isFunction(target))
    if (typeof target !== "object" && typeof target !== "function")
      target = {};

    for (; i < length; i++) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) !== null) {
        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          if (target === copy) continue;

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (is.plainObject(copy) || (copyIsArray = (copy.constructor === Array)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && (src.constructor === Array) ? src : [];
            } else {
              clone = src && is.plainObject(src) ? src : {};
            }
            // Never move original objects, clone them
            target[name] = _extend(deep, clone, copy);
            // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };

  return my;
});

/**
The Extrovert options model.
@module options.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/options/options',['./defaults', '../utilities/extend'], function( defaults, extend ) {

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

/**
Simple cookie support.
@module cookie.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/utilities/cookie',[],function() {

  return {
    getCookie: function( sName )
    {
      sName = sName.toLowerCase();
      var oCrumbles = document.cookie.split(';');
      for(var i=0; i<oCrumbles.length;i++)
      {
          var oPair= oCrumbles[i].split('=');
          var sKey = decodeURIComponent(oPair[0].trim().toLowerCase());
          var sValue = oPair.length>1?oPair[1]:'';
          if(sKey == sName)
              return decodeURIComponent(sValue);
      }
      return '';
    },

    setCookie: function( sName, sValue )
    {
      var oDate = new Date();
      oDate.setYear(oDate.getFullYear()+1);
      var sCookie = encodeURIComponent(sName) + '=' + encodeURIComponent(sValue) + ';expires=' + oDate.toGMTString() + ';path=/';
      document.cookie = sCookie;
    },

    clearCookie: function( sName )
    {
      my.setCookie(sName,'');
    }
  };

});
/**
Compute element style.
@module getComputedStyle.js
@license Copyright (c) 2015 | James M. Devlin
*/

define( 'extrovert/utilities/getComputedStyle',[],function() {
  // via SO
  return function( el, styleProp ) {
    var value, defaultView = el.ownerDocument.defaultView;
    // W3C standard way:
    if (defaultView && defaultView.getComputedStyle) {
      // sanitize property name to css notation (hypen separated words eg. font-Size)
      styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
      return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
    } else if (el.currentStyle) { // IE
      // sanitize property name to camelCase
      styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) {
        return letter.toUpperCase();
      });
      value = el.currentStyle[styleProp];
      // convert other units to pixels on IE
      if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
        return (function(value) {
          var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
          el.runtimeStyle.left = el.currentStyle.left;
          el.style.left = value || 0;
          value = el.style.pixelLeft + "px";
          el.style.left = oldLeft;
          el.runtimeStyle.left = oldRsLeft;
          return value;
        })(value);
      }
      return value;
    }
  };
});
/**
WebGL and Canvas detection routines.
@module core.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/utilities/detect',[],function() {

  return {

    /**
    Figure out if the browser supports WebGL.
    @method detectWebGL
    */
    supportsWebGL: function( return_context ) {
      if( !!window.WebGLRenderingContext ) {
        var canvas = document.createElement("canvas");
        var names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
        var context = false;
        for(var i=0;i<4;i++) {
          try {
            context = canvas.getContext(names[i]);
            if (context && typeof context.getParameter == "function") {
              // WebGL is enabled
              if (return_context) {
                // return WebGL object if the function's argument is present
                return {name:names[i], gl:context};
              }
              // else, return just true
              return true;
            }
          } catch(e) {
          }
        }

        // WebGL is supported, but disabled
        return false;
      }

      // WebGL not supported
      return false;
    },

    /**
    Figure out if the browser supports Canvas.
    http://stackoverflow.com/q/2745432
    @method detectVCanvas
    */
    supportsCanvas: function() {
      var elem = document.createElement('canvas');
      return !!(elem.getContext && elem.getContext('2d'));
    }

  };

});
/**
Rasterize formatted text, markup, and HTML content.
@version 0.1.0
@file in.scribe.js
@author James Devlin (james@indevious.com)
@license MIT
*/

( function( window, factory ) {

  // UMD trickery - https://github.com/umdjs/umd
  'use strict';
  if ( typeof define === 'function' && define.amd ) {
    define( 'in.scribe',[], factory ); // AMD
  } else if ( typeof exports === 'object' ) {
    module.exports = factory( ); // CommonJS
  } else {
    window.inscribe = factory( ); // browser global
  }

}( window, function factory( ) {

  'use strict';

  var my = function( ) {

    return {

      // A streaming text renderer.
      inscribe: function( text, ctype, ctx, opts ) {
        my[ '_render' + (ctype || 'text') ].call( this, ctx, text, opts );
      },

      fit: function( text, ctype, ctx, opts ) {
        var maxWidth = opts.leftTop[0] - opts.rightBottom[0];
        var maxHeight = opts.leftTop[1] - opts.rightBottom[1];
        var fontSize = 0;
        do {
          fontSize++;
          ctx.font = fontSize + 'px sans-serif';
          var metrics = ctx.measureText( text );
        } while ( metrics.width <= maxWidth && metrics.height <= maxHeight );
        if( fontSize === 1 ) return false; // No rendering solution
        ctx.font = (fontSize-1) + 'px sans-serif';
        context.fillText( txtLine, pos[0], pos[1] );
      },
      // Improved wrap text drawing helper for canvas.
      // - http://stackoverflow.com/a/11361958
      // - http://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
      wrapText: function( context, text, x, y, maxWidth, lineHeight, measureOnly ) {

        var numLines = 1;
        var start_of_line = true;
        var line_partial = '';
        var try_line = '';
        var extents = [0,0];

        var lines = text.split('\n');

        for (var line_no = 0; line_no < lines.length; line_no++) {

          var words = lines[ line_no ].split(' ');
          start_of_line = true;
          line_partial = '';

          for( var w = 0; w < words.length; w++ ) {

            try_line = line_partial + (start_of_line ? "" : " ") + words[ w ];
            var metrics = context.measureText( try_line );
            if( metrics.width <= maxWidth ) {
              start_of_line = false;
              line_partial = try_line;
            }
            else {
              metrics = context.measureText( line_partial );
              if( metrics.width > extents[0] )
                extents[0] = metrics.width;
              measureOnly || context.fillText( line_partial, x, y);
              start_of_line = true;
              y += lineHeight;
              extents[1] = y;
              numLines++;
              line_partial = words[w]; // Drop the space
              metrics = context.measureText( line_partial );
              if( metrics.width <= maxWidth ) {
                start_of_line = false;
              }
              else {
                // A single word that is wider than max allowed width; TODO: letter-break
              }
            }
          }

          // Handle any remaining text
          measureOnly || context.fillText( line_partial, x, y );
          y += lineHeight;
          extents[1] = y;
        }

        return {
          numLines: numLines,
          extents: extents
        };
      }
    };
  };

  my._rendertext = function( context, text, opts ) {

    // Lift vars and apply defaults
    var padding = opts.padding || 10
    , maxWidth = opts.maxWidth ? opts.maxWidth - (2 * padding) : 492
    , lineHeight = opts.lineHeight || 16
    , pos = [padding, padding + lineHeight]
    , measureOnly = false // future
    , lines = text.split('\n')
    , lineIdx = 0;

    // Process hard lines
    lines.reduce(function( unused, line, hardIdx ) {

      var words = line.split(' '), safeLine = '';
      words[0] = (opts.firstLineIndent || '   ') + words[0];

      for( var w = 0; w < words.length; w++ ) {
        var tryLine = safeLine + (safeLine.length > 0 ? ' ' : '') + words[ w ];
        var metrics = context.measureText( tryLine );
        var widthExceeded = metrics.width > maxWidth;
        if( !widthExceeded ) {
          safeLine = tryLine;
          if( w < words.length - 1 ) continue;
        }
        _paintLine( safeLine, false );
        safeLine = widthExceeded ? words[w] : '';
      }

      if( hardIdx === lines.length - 1 )
        _paintLine( safeLine, true );

    }, { });

    function _paintLine( txtLine, force ) {
      context.fillText( txtLine, pos[0], pos[1] );
      opts.lineEmitted && opts.lineEmitted( txtLine, lineIdx );
      if( ((lineIdx % opts.chunkSize) === (opts.chunkSize - 1)) || force ) {
        opts.pageEmitted && (context = opts.pageEmitted( context ));
        pos[0] = pos[1] = padding;
      }
      pos[1] += lineHeight;
      ++lineIdx;
    }

    return {
      numLines: lineIdx
    };
  };

  my._renderhtml = function ( context, text, measureOnly, opts ) {

  };

  my._renderdom = function ( context, text, measureOnly, opts ) {

  };

  return my;

}));

/**
Utilities for Extrovert.js.
@module utils.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/utilities/utils',['require', 'three', './cookie', './getComputedStyle', './detect',  'in.scribe'],
function( require, THREE, cookie, getComputedStyle, detect, inscribe )  {

  var events;
  'use strict';
  return {
    VZERO: new THREE.Vector3(0, 0, 0),
    shadeBlend: require('./blend'),
    getCookie: cookie.getCookie,
    setCookie: cookie.setCookie,
    clearCookie: cookie.clearCookie,
    getComputedStyle: getComputedStyle,
    wrapText: (new inscribe()).wrapText,
    detectWebGL: detect.supportsWebGL,
    detectCanvas: detect.supportsCanvas,
    // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
    registerEvent: function( eventName ) {
      var classic = true; // older IE-compat method
      events = events || { };
      events[ eventName ] = classic ? document.createEvent( 'Event' ) : new Event( eventName );
      classic && events[ eventName ].initEvent( eventName, true, true );
      return events[ eventName ];
    },
    fireEvent: function( eventName ) {
      document.dispatchEvent( events[ eventName ] );
    }
  };

});

/**
Simple selector replacement. TODO: remove.
@module offset.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/utilities/sel',[],function() {
  return function( selector ) {
    return document.querySelectorAll( selector );
  };
});

define('extrovert/utilities/log',[],function() {
  /**
  Message logger from http://stackoverflow.com/a/25867340.
  @class log
  */
  return {
    msg: function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = 'EXTRO: ' + args[0];
      console.log.apply(console, args);
    },
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = 'EXTRO: ' + args[0];
      console.warn.apply(console, args);
    },
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = 'EXTRO: ' + args[0];
      console.error.apply(console, args);
    }
  };

});
/**
Plain JavaScript implementation of jQuery .offset().
@module offset.js
@license Copyright (c) 2015 | James M. Devlin
*/

define( 'extrovert/utilities/offset',[],function() {
  return function( elem ) {
    var docElem, win;//, elem = this[0];
    var box = {
        top: 0,
        left: 0
    };

    var doc = elem && elem.ownerDocument;
    if (!doc) return;

    docElem = doc.documentElement;

    // Make sure it's not a disconnected DOM node
    // if (!jQuery.contains(docElem, elem)) {
        // return box;
    // }

    // If we don't have gBCR, just use 0,0 rather than error
    // BlackBerry 5, iOS 3 (original iPhone)
    if (elem.getBoundingClientRect !== undefined) {
      box = elem.getBoundingClientRect();
    }
    win = (doc !== null && doc === doc.window) ? doc : doc.nodeType === 9 && doc.defaultView;
    return {
      top: box.top + win.pageYOffset - docElem.clientTop,
      left: box.left + win.pageXOffset - docElem.clientLeft
    };
  };
});

/**
THREE.js subsystem provider for Extrovert.js.
@module provider-three.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/providers/three/provider-three',['extrovert/options/options', 'three', 'physijs'], function( options, THREE, Physijs ) {

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
  my.fiatLux = function( light_opts, eng ) {

    if( !light_opts || light_opts.length === 0 )
      return;

    var lights = [];
    var new_light = null;

    for( var idx = 0; idx < light_opts.length; idx++ ) {
      var val = light_opts[ idx ];
      if( val.type === 'ambient' )
        new_light = new THREE.AmbientLight( val.color, val.intensity );
      else if (val.type === 'point')
        new_light = new THREE.PointLight( val.color, val.intensity, val.distance );
      else if (val.type === 'spotlight')
        new_light = createSpotlight( val );
      else if (val.type === 'hemisphere')
        new_light = new THREE.HemisphereLight( val.color, val.groundColor, val.intensity );
      else if (val.type === 'directional') {
        new_light = new THREE.DirectionalLight( val.color, val.intensity );
      }
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

/**
A simple Extrovert image rasterizer.
@module paint-img.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/rasterizers/paint-img',['extrovert/providers/three/provider-three'], function( gfx ) {
  'use strict';
  return {
    paint: function( obj ) {
      return gfx.loadTexture( typeof obj === 'string' ? obj : obj.src );
    }
  };
});

/**
A simple Extrovert HTML rasterizer.
@module paint-element.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/rasterizers/paint-element',['extrovert/providers/three/provider-three', 'extrovert/utilities/utils'], function( provider, utils ) {
  'use strict';
  return {
    paint: function( val, opts ) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = val.offsetWidth;
      canvas.height = val.offsetHeight;
      var bkColor = utils.getComputedStyle(val, 'background-color');
      if(bkColor === 'rgba(0, 0, 0, 0)')
        bkColor = 'rgb(0,0,0)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      return provider.createTextureFromCanvas( canvas, true );
    }
  };
});

/**
Color blending utility.
@module blend.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/utilities/blend',[],function() {

  /**
  Perform a color blend (darken, lighten, or gradient) on a color (string) and
  return another string representing the color. See: http://stackoverflow.com/a/13542669
  @method shadeBlend
  */
  /* jshint ignore:start */
  return function( p, c0, c1 ) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7) {
      var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
      return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")";
    }
    else {
      var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
      return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1);
    }
  };
  /* jshint ignore:end */

});

/**
A simple Extrovert HTML rasterizer.
@module paint-plain-text.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/rasterizers/paint-plain-text',['../utilities/utils', '../providers/three/provider-three', '../utilities/blend', 'in.scribe'], function( utils, gfx, shadeBlend, inscribe ) {
  'use strict';
  return {
    paint: function( val, opts, info ) {
      opts = opts || { };
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = opts.width;
      canvas.height = opts.height;
      var bkColor = opts.bkColor || 'rgb(255,255,255)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = utils.getComputedStyle( document.body, 'font' );
      context.fillStyle = opts.bkColor || 'rgb(0,0,0)';
      var title_line_height = 14;
      var painter = new inscribe();
      var numLines = painter.wrapText( context, val.title, 10, 10 + title_line_height, canvas.width - 20, title_line_height, true );
      context.fillStyle = shadeBlend( -0.25, bkColor );
      context.fillRect(0,0, canvas.width, 20 + numLines * title_line_height);
      context.fillStyle = opts.textColor || 'rgb(255,255,255)';
      numLines = painter.wrapText( context, val.title, 10, 10 + title_line_height, canvas.width - 20, title_line_height, false );
      var line_height = 16;
      var massaged_content = val.text.replace('\n',' ');
      numLines = painter.wrapText( context, massaged_content, 10, 20 + (numLines * title_line_height) + line_height, canvas.width - 20, line_height, false );
      info.numLines = numLines;
      return gfx.createTextureFromCanvas( canvas, true );
    }
  };
});

/**
A streaming plain text rasterizer for Extrovert.js.
@module paint-plain-text-stream.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/rasterizers/paint-plain-text-stream',['extrovert/utilities/utils', 'extrovert/providers/three/provider-three', 'in.scribe'], function( utils, gfx, inscribe ) {
  'use strict';
  return {
    paint: function( val, opts, info ) {
      opts = opts || { };
      var painter = new inscribe();
      var textures = [];
      var wrapInfo = { };
      var lineHeight = opts.lineHeight || 16;
      var massaged_content = val.text;
      var padding = opts.padding || 10;
      info.numLines = 0;
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = opts.width;
      canvas.height = opts.height;
      var bkColor = opts.bkColor || 'rgb(255,255,255)';
      context.fillStyle = bkColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = utils.getComputedStyle( document.body, 'font' );
      context.fillStyle = opts.bkColor || 'rgb(0,0,0)';
      painter.inscribe( massaged_content, 'text', context,
        { padding: padding,
          maxWidth: canvas.width,
          lineHeight: lineHeight,
          chunkSize: 35,
          pageEmitted: function ( context ) {
            textures.push( gfx.createTextureFromCanvas( context.canvas, true ) );
            var newCanvas = document.createElement('canvas');
            newCanvas.width = opts.width;
            newCanvas.height = opts.height;
            var newContext = newCanvas.getContext('2d');
            var bkColor = opts.bkColor || 'rgb(255,255,255)';
            newContext.fillStyle = bkColor;
            newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
            newContext.font = utils.getComputedStyle( document.body, 'font' );
            newContext.fillStyle = opts.textColor || 'rgb(0,0,0)';
            return newContext;
          }
      });
      return textures;
    }
  };
});

/**
The built-in "book" generator for Extrovert.js.
@module book.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/generators/book',['require', '../core', '../utilities/log', 'extrovert/providers/three/provider-three'], function( require, extro, log, provider ) {

  'use strict';

  var _opts = null;
  var _eng = null;
  var _side = null;
  var _noun = null;

  function mapTextures( cubeGeo, width, height ) {
    for (var i = 0; i < cubeGeo.faces.length ; i++) {
      var fvu = cubeGeo.faceVertexUvs[0][i];
      if( Math.abs( cubeGeo.faces[ i ].normal.z ) > 0.9) {
        for( var fv = 0; fv < 3; fv++ ) {
          if( Math.abs( fvu[fv].y ) < 0.01 ) {
            fvu[ fv ].y = 1 - ( width / height );
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
          }

          if( _opts.pagify ) {
            var done = false,
              info = { },
              rastOpts = {
                width: _opts.texWidth || 512, // Default to power-of-2 textures
                height: _opts.texHeight || 1024,
                bkColor: _opts.pageColor || (_opts.material && _opts.material.color) || 0xFFFFFF,
                textColor: _opts.textColor || 0x232323
              },
              textures = rast.paint(obj, rastOpts, info );

            var mats = textures.map( _createMat );
            var front = mats.filter( _isEven );
            var back = mats.filter( _isOdd );

            for( var tt = 0; tt < front.length; tt++ ) {
              var tilePos = [0, 0, -(tt * _opts.dims[2]) - _opts.dims[2] ];
              var matArray = [ _side, _side, _side, _side, front[ tt ], tt < back.length ? back[ tt ] : _side ];
              var meshMat = provider.createCubeMaterial( matArray );
              var mesh = extrovert.createObject({ type: 'box', pos: tilePos, dims: _opts.dims, mat: meshMat, mass: 1000 });
              mapTextures( mesh.geometry, rastOpts.width, rastOpts.height );
              extrovert.LOGGING && log.msg('Generating page %o at position %f, %f, %f', mesh, tilePos[0], tilePos[1], tilePos[2]);
            }
          }
        }
      }

    };
  };

  return BookGenerator;
});

/**
The built-in 'box' generator for Extrovert.js.
@module box.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/generators/box',['extrovert/core'], function( extrovert ) {

  'use strict';

  var _opts, _eng, _side_mat, _noun;

  function patchTextures( cubeGeo ) {
    for (i = 0; i < cubeGeo.faces.length ; i++) {
       var face = cubeGeo.faces[ i ];
       var fvu = cubeGeo.faceVertexUvs[0][i];
       // Quick kludge for textures on non-front faces. Replace with correct
       // mapping, wrapping, or dedicated textures. TODO
       if(face.normal.y > 0.9) {
          fvu[0].x = fvu[0].y = fvu[1].x = fvu[1].y = fvu[2].x = fvu[2].y = 0.99;
       }
       else if(face.normal.y < -0.9) {
          fvu[0].x = fvu[0].y = fvu[1].x = fvu[1].y = fvu[2].x = fvu[2].y = 0.01;
       }
       else if(face.normal.x > 0.9 || face.normal.x < -0.9) {
          fvu[0].x = fvu[0].x > 0.5 ? 0.02 : 0.00;
          fvu[1].x = fvu[1].x > 0.5 ? 0.02 : 0.00;
          fvu[2].x = fvu[2].x > 0.5 ? 0.02 : 0.00;
       }
    }
    cubeGeo.uvsNeedUpdate = true;
  }

  return {

    options: {
      name: 'box',
      material: { color: 0xFF8844, friction: 0.2, restitution: 1.0 },
      block: { width: 250, height: 250, depth: 250 }
    },

    init: function( genOpts, eng ) {
      _opts = genOpts;
      _eng = eng;
      _side_mat = extrovert.provider.createMaterial( genOpts.material );
      extrovert.createPlacementPlane( [ 0,0,0 ] );
    },

    generate: function( noun, elems ) {
      _noun = noun;
      var sides, obj, material, pos_info;
      if( elems.length === 1 ) {
        material = this.rasterize( elems[0] );
        sides = [ material, material, material, material, material, material ];
      }
      else if( elems.length === 2 ) {
        material = this.rasterize( elems[0] );
        material2 = this.rasterize( elems[1] );
        sides = [ _side_mat, _side_mat, _side_mat, _side_mat, material, material2 ];
      }
      else if (elems.length > 2) {
        sides = [];
        var length = elems.length > 6 ? 6 : elems.length;
        for( var i = 0; i < length; i++ ) {
          obj = elems[ i ];
          material = this.rasterize( obj );
          sides.push( material );
        }
        while( sides.length !== 6 )
          sides.push( _side_mat );
      }

      var mat_info = extrovert.createCubeMaterial( sides );
      extrovert.createObject({ type: 'box', pos: [0,0,0], dims: [_opts.block.width,_opts.block.height,_opts.block.depth], mat: mat_info, mass: 1000 });
    },

    rasterize: function( obj ) {
      var rast = null;
      if( _noun.rasterizer ) {
        rast = ( typeof _noun.rasterizer === 'string' ) ?
          new extrovert['paint_' + _noun.rasterizer]() : _noun.rasterizer;
      }
      rast = rast || extrovert.getRasterizer( obj );

      var tileTexture = rast.paint(( _noun.adapt && _noun.adapt(obj) ) || obj, { width: _opts.block.width, height: _opts.block.height } );
      var material = extrovert.provider.createMaterial({ tex: tileTexture, friction: 0.2, restitution: 1.0 });
      return material;
    }
  };

});

/**
The built-in 'direct' generator for Extrovert.js.
@module direct.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/generators/direct',[
'extrovert/core',
'extrovert/providers/three/provider-three'
],
function( extro, provider )
{
  'use strict';

  var DirectGenerator = function( ) {

    var extrovert = require('extrovert/core');
    var _opts, _eng, _side_mat, _noun;

    return {

      options: {
        name: 'direct',
        material: { color: 0xFF8844, friction: 0.2, restitution: 1.0 },
        block: { depth: 10 },
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
        return extrovert.getPositionDirect( obj, cont, _opts.block.depth, 0 );
      },

      rasterize: function( obj ) {
        var rast = null;
        if( _noun.rasterizer ) {
          rast = ( typeof _noun.rasterizer === 'string' ) ?
            extrovert[ _noun.rasterizer ] : _noun.rasterizer;
        }
        rast = rast || extrovert.getRasterizer( obj );
        var tileTexture = rast.paint(( _noun.adapt && _noun.adapt(obj) ) || obj );

        var material = provider.createMaterial({ tex: tileTexture, friction: 0.2, restitution: 0.0 });

        if( !_opts.map || _opts.map === 'all' ) {
          return material;
        }

        var matArray;
        if( _opts.map == 'fit' ) {
          if( !_opts.block.depth || _opts.block.depth === 'height' )
            matArray = [ _side_mat, _side_mat, material, material, material, material ];
          else if (_opts.block.depth === 'width' )
            matArray = [ material, material, _side_mat, _side_mat, material, material ];
          else
            matArray = [ _side_mat, _side_mat, _side_mat, _side_mat, material, material ];
        }

        return provider.createCubeMaterial( matArray );
      }

    };
  };

  return DirectGenerator;
});

/**
The built-in 'extrude' generator for Extrovert.js.
@module extrude.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(
'extrovert/generators/extrude',[
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

/**
The built-in 'tile' generator for Extrovert.js.
@module tile.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert/generators/tile',['require', 'extrovert/core', 'extrovert/providers/three/provider-three'], function( require, extro, provider ) {

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

/**
A hybrid control module for Extrovert.js.
@module universal-controls.js
@license Copyright (c) 2015 | James M. Devlin
*/

//define(['core'], function(  extrovert ) {
define('extrovert/controls/universal-controls',['require', '../core'], function( require, extro ) {

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

/**
Core module for the Extrovert engine.
@module core.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(

'extrovert/core',[
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

    provider.fiatLux( opts.lights, eng ).forEach(function(val) {
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
    var ndc = my.toNDC( posX, posY, 0.5, new THREE.Vector2(), extents );
    eng.raycaster.setFromCamera( ndc, eng.camera );
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

  my.getPosition = function( val, container, zDepth, floor ) {

    // Safely get the position of the HTML element [1] relative to its parent
    var src_cont = (typeof container === 'string') ?
      sel( container ) : container;
    if(src_cont.length !== undefined) src_cont = src_cont[0];
    var parent_pos = offset( src_cont );
    var child_pos = offset( val );
    var pos = { left: child_pos.left - parent_pos.left, top: child_pos.top - parent_pos.top };

    // Get the position of the element's left-top and right-bottom corners in
    // WORLD coords.

    var topLeft, botRight;
    if( !floor ) {
      topLeft = { x: pos.left, y: pos.top + val.offsetHeight, z: 0.5 };
      botRight = { x: topLeft.x + val.offsetWidth, y: pos.top, z: 0.5 };
    }
    else
    {
      topLeft = { x: pos.left, y: floor - pos.top, z: 0.5 };
      botRight = {
        x: topLeft.x + val.offsetWidth,
        y: floor - (pos.top - val.offsetHeight), z: 0.5
      };
    }

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
;
/**
Top-level module for Extrovert.js. Define the library's public interface.
@module extrovert.js
@license Copyright (c) 2015 | James M. Devlin
*/

define('extrovert',['require','extrovert/options/version','extrovert/core','extrovert/utilities/utils'],function (require) {

  'use strict';
  return {
    version: require('extrovert/options/version').str,
    init: require('extrovert/core').init,
    utils: require('extrovert/utilities/utils')
  };

});

    //Register in the values from the outer closure for common dependencies
    //as local almond modules
    define('three', function () {
        return THREE;
    });
    
    define('physijs', function() {
      return Physijs;
    });

    //Use almond's special top-level, synchronous require to trigger factory
    //functions, get the final module value, and export it as the public
    //value.
    return require('extrovert');
}));
