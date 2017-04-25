var gulp = require('gulp');
var paths = require('../paths');
var del = require('del');
var vinylPaths = require('vinyl-paths');

// deletes all files in the output path
gulp.task('clean', ['unbundle'], function() {
  return gulp.src([paths.output])
    .pipe(vinylPaths(del));
});

gulp.task('clean-jspm-packages', function() {
  return gulp.src(['./jspm_packages'])
      .pipe(vinylPaths(del));
});

gulp.task('clean-node-modules', function() {
  return gulp.src(['./node_modules'])
      .pipe(vinylPaths(del));
});
