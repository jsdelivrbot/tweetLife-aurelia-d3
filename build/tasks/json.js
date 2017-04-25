var gulp = require('gulp');
var jsonminify = require('gulp-jsonminify');
var paths = require('../paths');

gulp.task('build-json', function () {
    return gulp.src(paths.json)
        .pipe(jsonminify())
        .pipe(gulp.dest(paths.output));
});
