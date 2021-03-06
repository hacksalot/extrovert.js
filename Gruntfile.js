/**
Gruntfile for the Extrovert.js library.
@module Gruntfile.js
*/

module.exports = function(grunt) {

  var opts = {

    pkg: grunt.file.readJSON('package.json'),

    ext: '.min',

    clean: {
      dist: ['dist'],
      temp: ['.tmp']
    },

    requirejs: {
      // In this configuration, embed Three.js / Physijs into the output
      bundled: {
        options: {
          out: 'dist/extrovert-bundled.js',
          baseUrl: 'src',
          paths: {
            'extrovert': './extrovert',
            'three': '../node_modules/three/build/three',
            'physijs': '../node_modules/physijs/physi',
            'in.scribe': '../node_modules/in.scribe/in.scribe',
            'three-glue': './three-glue'
          },//,
          shim: {
          // Do not include Three.js in the shim anymore. See:
          // https://stackoverflow.com/a/30361895
          // 'three': { exports: 'THREE' }
            'physijs': { exports: 'Physijs' }
          },
          include: [ '../node_modules/almond/almond', 'extrovert' ],
          wrap: {
            startFile: 'src/extrovert/fragments/start.frag',
            endFile: 'src/extrovert/fragments/end.frag'
          },
          preserveLicenseComments: false,
          optimize: 'none'
        }
      },
      // In this configuration, exclude Three.js / Physijs from the output
      main: {
        options: {
          out: 'dist/extrovert.js',
          baseUrl: 'src',
          paths: {
            'extrovert': './extrovert',
            'three': '../node_modules/three/build/three',
            'physijs': '../node_modules/physijs/physi',
            'in.scribe': '../node_modules/in.scribe/in.scribe'
          },
          shim: {
            'three': { exports: 'THREE' },
            'physijs': { exports: 'Physijs' }
          },
          include: ['../node_modules/almond/almond', 'extrovert' ],
          exclude: ['three', 'physijs'],
          wrap: {
            startFile: 'src/extrovert/fragments/start.frag',
            endFile: 'src/extrovert/fragments/end.frag'
          },
          preserveLicenseComments: false,
          optimize: 'none'
        }
      }
    },

    concat: {
      main: {
        src: [ 'src/extrovert/fragments/license.frag', 'dist/extrovert.js' ],
        dest: 'dist/extrovert.js'
      },
      bundled: {
        src: [ 'src/extrovert/fragments/license.frag', 'dist/extrovert-bundled.js' ],
        dest: 'dist/extrovert-bundled.js'
      }
    },

    connect: {
      options: {
        hostname: 'localhost',
        port: 8000,
      },
      // Set up server for automated unit tests
      auto: {
        options: {
          base: '.'
        }
      },
      // Set up server for manual tests
      manual: {
        options: {
          base: '.',
          keepalive: true
        }
      }

    },

    copy: {
      // Copy 3rd-party JS to a temp folder prior to Require.js processing
      // thirdparty: {
      //   files: [{
      //     expand: true, flatten: true,
      //     src: ['node_modules/three/build/three.js',
      //           'node_modules/physijs/physi.js',
      //           'node_modules/ammo.js/ammo.js'],
      //     dest: '.tmp'
      //   }]
      // },
      all: {
        files: [{
          expand: true,
          flatten: true,
          src: ['node_modules/physijs/physijs_worker.js',
                'node_modules/ammo.js/ammo.js'],
          dest: 'dist'
        }]
      },
      main: {
        files: [{
          expand: true,
          flatten: true,
          src: ['node_modules/physijs/physi.js'],
          dest: 'dist'
        }]
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      main: {
        files: {
          'dist/extrovert.min.js': ['dist/extrovert.js'],
          'dist/physijs_worker.min.js': ['dist/physijs_worker.js'],
          'dist/physi.min.js': ['dist/physi.js']
        }
      },
      bundled: {
        files: {
          'dist/extrovert-bundled.min.js': ['dist/extrovert-bundled.js'],
          'dist/physijs_worker.min.js': ['dist/physijs_worker.js']
        }
      }
    },

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js', '!src/**/Projector.js', '!src/**/CanvasRenderer.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
        expr: true,
        newcap: false
      }
    }

  };

  var cmnCore = ['clean', 'jshint', 'requirejs:main', 'concat:main', 'copy:all', 'copy:main'];
  var cmnBundled = ['clean', 'jshint', 'requirejs:bundled', 'concat:bundled', 'copy:all'];

  var cfgs = {
    debug: [],
    release: [grunt.option('bundled') ? 'uglify:bundled' : 'uglify:main'],
    test: ['default', 'connect:auto'],
    testmanual: ['default', 'connect:manual']
  };

  grunt.initConfig( opts );
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask( 'build', 'Build the Extrovert library.', function( config, quick ) {
    config = config || 'release';
    grunt.task.run( grunt.option('bundled') ? cmnBundled : cmnCore );
    grunt.task.run( cfgs[config] );
  });

  grunt.registerTask( 'default', 'Build Extrovert for release.', function( config, quick ) {
    grunt.task.run( 'build:release' );
  });

  grunt.registerTask( 'test', cfgs.test );
  grunt.registerTask( 'testmanual', cfgs.textmanual );
};
