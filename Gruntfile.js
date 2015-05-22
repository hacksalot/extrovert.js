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
      annotated: {
        options: {
          out: 'dist/extrovert.js',
          baseUrl: 'src',
          paths: {
            'extrovert': './extrovert',
            'three': '../bower_components/threejs/build/three<%= ext %>',
            'physijs': '../bower_components/physijs/physi',
            'in.scribe': '../bower_components/in.scribe/in.scribe'
          },
          shim: {
            'three': { exports: 'THREE' },
            'physijs': { exports: 'Physijs' }
          },
          include: ['../bower_components/almond/almond', 'extrovert'],
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
      thirdparty: {
        files: [{
          expand: true, flatten: true,
          src: ['bower_components/threejs/build/three.js',
                'bower_components/physijs/physi.js',
                'bower_components/ammo.js/builds/ammo.js'],
          dest: '.tmp'
        }]
      },
      physijs: {
        files: [{
          expand: true,
          flatten: true,
          src: ['bower_components/physijs/physijs_worker.js', 'bower_components/ammo.js/builds/ammo.js'],
          dest: 'dist'
        }]
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/extrovert.min.js': ['dist/extrovert.js'],
          'dist/physijs_worker.min.js': ['dist/physijs_worker.js']
        }
      }
    },

    qunit: {
      test1: {
        options: {
          urls: ['http://localhost:8000/test/auto-tests.html']
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

  var cmn = ['clean', 'jshint', 'copy:thirdparty', 'requirejs', 'concat', 'copy:physijs'];
  var cfgs = {
    debug: [],
    release: ['uglify:dist'],
    test: ['default', 'connect:auto', 'qunit'],
    testmanual: ['default', 'connect:manual']
  };

  grunt.initConfig( opts );
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask( 'build', 'Build the Extrovert library.', function( config, quick ) {
    config = config || 'release';
    grunt.task.run( cmn );
    grunt.task.run( cfgs[config] );
  });

  grunt.registerTask( 'default', 'Build Extrovert for release.', function( config, quick ) {
    grunt.task.run( 'build:release' );
  });

  grunt.registerTask( 'test', cfgs.test );
  grunt.registerTask( 'testmanual', cfgs.textmanual );

};
