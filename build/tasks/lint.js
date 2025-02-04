var gulp = require('gulp');
var paths = require('../paths');
var eslint = require('gulp-eslint');

gulp.task('lint', function() {
  return gulp.src(paths.source)
    .pipe(eslint({
      emitError: false
    }))
    .pipe(tslint.report());
});
