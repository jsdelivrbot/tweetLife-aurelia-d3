var gulp = require('gulp');
var browserSync = require('browser-sync');
var proxy = require('./pegaproxy');
var config = require('../config')

var middleware = proxy(config.server.url, config.server.token);

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve', ['build'], function (done) {
  browserSync({
    online: false,
    open: false,
    port: 9000,
    server: {
      baseDir: ['.'],
      middleware: [
        function (req, res, next) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        },
        middleware
      ]
    }
  }, done);
});

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve-bundle', ['bundle'], function (done) {
  browserSync({
    online: false,
    open: false,
    port: 9000,
    server: {
      baseDir: ['.'],
      middleware: [function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      },
        middleware
      ]
    }
  }, done);
});

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve-export', ['export'], function (done) {
  browserSync({
    online: false,
    open: false,
    port: 9000,
    server: {
      baseDir: ['./export'],
      middleware: [
        function (req, res, next) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        },
        middleware
      ]
    }
  }, done);
});
