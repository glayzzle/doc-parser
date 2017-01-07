/**
 * The automated build configuration
 */
module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      options: {
        banner: '/*! <%= pkg.name %> - BSD3 License - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        alias: {
          'docblock-parser': './src/index.js'
        }
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.js': 'index.js' // ['src/*.js', 'src/**/*.js']
        }
      }
    },
    documentation: {
      parser: {
        options: {
          destination: 'docs/',
          format: 'md',
          version: '<%= pkg.version %>',
          name: '<%= pkg.name %>',
          filename: 'parser.md',
          shallow: false
        },
        files: [{
          src: ['src/parser.js']
        }]
      },
      lexer: {
        options: {
          destination: 'docs/',
          format: 'md',
          version: '<%= pkg.version %>',
          name: '<%= pkg.name %>',
          filename: 'lexer.md',
          shallow: false
        },
        files: [{
          src: ['src/token.js', 'src/lexer.js']
        }]
      },
      main: {
        options: {
          destination: 'docs/',
          format: 'md',
          version: '<%= pkg.version %>',
          name: '<%= pkg.name %>',
          filename: 'README.md',
          shallow: true
        },
        files: [{
          src: ['src/index.js']
        }]
      }
    },
    uglify: {
      options: {
        compress: {
          // eslint-disable-next-line camelcase
          keep_fnames: true
        },
        sourceMap: true,
        mangle: false,
        maxLineLen: 1024
      },
      dist: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    }
  });

  // Load the plugin
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-documentation');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify']);
  grunt.registerTask('doc', ['documentation']);
};
