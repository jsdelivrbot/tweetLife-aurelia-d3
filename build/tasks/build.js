var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var paths = require('../paths');
var assign = Object.assign || require('object.assign');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');

var to5 = require('gulp-babel');
var compilerOptions = require('../babel-options');
var htmlmin = require('gulp-htmlmin');

// transpiles changed es6 files to SystemJS format
// the plumber() call prevents 'pipe breaking' caused
// by errors from other gulp plugins
// https://www.npmjs.com/package/gulp-plumber
gulp.task('build-js', function () {
    return gulp.src(paths.source)
      .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
      .pipe(changed(paths.output, {extension: '.js'}))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(to5(assign({}, compilerOptions.commonjs())))
      .pipe(sourcemaps.write('.', {includeContent: true, sourceRoot: '/src'}))
      .pipe(gulp.dest(paths.output));
});

// copies changed html files to the output directory
gulp.task('build-html', function() {
  return gulp.src(paths.html)
    .pipe(changed(paths.output, {extension: '.html'}))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.output));
});


// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    [
      'build-js', 
      'build-json', 
      'build-html',
      'sass'
    ],
    callback
  );
});
