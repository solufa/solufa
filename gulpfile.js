const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const watchify = require('watchify');
const webserver = require('gulp-webserver');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

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

const bundles = [];

[ 'Obj' ].forEach( function( name ) {
  const br = watchify(
    browserify({
      entries: './components/j3-' + name + '.ts'
    })
    .plugin('tsify', {target: 'es6'})
    .transform("babelify")
  );

  function bundle() {
    return br.bundle()
    .pipe(source('j3-' + name + '.js'))
    .pipe(gulp.dest('./static/js'));
  }

  br.on( "update", bundle );
  bundles.push( bundle );
});

gulp.task( "default", function() {
  gulp.src('./static')
    .pipe(webserver({
      host: '0.0.0.0',//スマホからIPアドレスでアクセスできる
      livereload: true,
      open: true
    }));
  bundle();
  bundles.forEach( function( bundle ) {
    bundle();
  });
});

gulp.task('compress', function() {
  return gulp.src('static/js/jThree.js')
    .pipe(uglify({
      preserveComments: 'some' // ! から始まるコメントを残すオプションを追加
    }))
    .pipe(rename('jThree.min.js'))
    .pipe(gulp.dest('static/js'));
});
