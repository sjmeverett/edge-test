module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    ts: {
      options: require('./tsconfig.json').compilerOptions,
      default: {
        src: ['src/**/*.ts', 'src/**/*.tsx', '!node_modules/**'],
        outDir: './dist'
      }
    },

    watch: {
      'ts': {
        files: ['src/**/*.ts', 'src/**/*.tsx'],
        tasks: ['ts']
      },
      'sass': {
        files: ['src/styles/*.scss'],
        tasks: ['sass']
      }
    },

    sass: {
      options: {
        sourceMap: true,
        importer: require('grunt-sass-tilde-importer')
      },
      default: {
        files: [{
          expand: true,
          cwd: 'src/styles',
          src: ['**/*.scss'],
          dest: 'dist/public/css',
          ext: '.css'
        }]
      }
    },

    webpack: {
      default: require('./webpack.config'),
      watch: Object.assign(
        {
          watch: true,
          watchOptions: {
            aggregateTimeout: 300
          }
        },
        require('./webpack.config')
      )
    },

    clean: ['dist']
  });

  grunt.registerTask('default', ['ts', 'sass']);
};