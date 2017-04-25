'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var cssBase64 = require('gulp-css-base64');
var runSequence = require('run-sequence');

gulp.task('sass:bundle', () => {
    gulp.src('sass/bundle/bundle.scss')
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 4 versions'],
            cascade: false
        }))
        .pipe(cssBase64({
            extensionsAllowed: ['.gif', '.jpg', '.png']
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('sass:demo', () => {
  gulp.src('sass/demo/demo.scss')
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 4 versions'],
        cascade: false
    }))
    .pipe(cssBase64({
        extensionsAllowed: ['.gif', '.jpg', '.png']
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('sass', function(callback) {
  // return runSequence(
  //   'sass:bundle',
  //   'sass:demo',
  //   callback
  // );
  return gulp.src('src/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 4 versions'],
        cascade: false
    }))
    .pipe(cssBase64({
        extensionsAllowed: ['.gif', '.jpg', '.png']
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
});

