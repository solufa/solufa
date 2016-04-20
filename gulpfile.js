const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const watchify = require('watchify');
const webserver = require('gulp-webserver');

const br = watchify(
  browserify({
    entries: './src/jThree.ts'
  })
  .plugin('tsify', {target: 'es6'})
  .transform("babelify")
);

br.on( "update", bundle );

function bundle() {
  return br.bundle()
  .pipe(source('jThree.js'))
  .pipe(gulp.dest('./static/js'));
}

gulp.task( "serve", function() {
  gulp.src('./static')
    .pipe(webserver({
      livereload: true,
      open: true
    }));
  bundle();
});
