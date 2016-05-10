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
    entries: './src/Solufa.ts'
  })
  .plugin('tsify', {target: 'es6'})
  .transform("babelify")
);

br.on( "update", bundle );

function bundle() {
  return br.bundle()
  .pipe(source('Solufa.js'))
  .pipe(gulp.dest('./static/js'));
}

gulp.task( "msx", function() {
  gulp.src('./components/*.js')
  .pipe(msx({harmony: true}))
  .pipe(gulp.dest('./static/components'));
});

gulp.task( "default", function() {
  gulp.src('./static')
    .pipe(webserver({
      host: '0.0.0.0',//スマホからIPアドレスでアクセスできる
      livereload: true,
      open: "http://0.0.0.0:8000/samples/1000box.html"
    }));
  bundle();

  gulp.watch('./components/*.js', ['msx']);
});

gulp.task('compress', function() {
  return gulp.src('static/js/Solufa.js')
    .pipe(uglify({
      preserveComments: 'some' // ! から始まるコメントを残すオプションを追加
    }))
    .pipe(rename('Solufa.min.js'))
    .pipe(gulp.dest('static/js'));
});
