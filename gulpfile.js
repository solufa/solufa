const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const watchify = require('watchify');
const webserver = require('gulp-webserver');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const msx = require('gulp-msx');

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

gulp.task( "msx", function() {
  gulp.src('./static/msxComponents/*.js')
  .pipe(msx({harmony: true}))
  .pipe(gulp.dest('./static/components'));
});

gulp.task( "default", function() {
  gulp.src('./static')
    .pipe(webserver({
      host: '0.0.0.0',//スマホからIPアドレスでアクセスできる
      livereload: true,
      open: true
    }));
  bundle();

  gulp.watch('./static/msxComponents/*.js', ['msx']);
});

gulp.task('compress', function() {
  return gulp.src('static/js/jThree.js')
    .pipe(uglify({
      preserveComments: 'some' // ! から始まるコメントを残すオプションを追加
    }))
    .pipe(rename('jThree.min.js'))
    .pipe(gulp.dest('static/js'));
});
