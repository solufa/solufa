# [gulp](http://gulpjs.com/)-msx [![Build Status](https://secure.travis-ci.org/insin/gulp-msx.png?branch=master)](http://travis-ci.org/insin/gulp-msx)

(Based on [gulp-react](https://github.com/sindresorhus/gulp-react))

Precompiles [Mithril](http://lhorie.github.io/mithril/) views which use
[JSX](http://facebook.github.io/jsx/) into JavaScript, using
[msx](https://github.com/insin/msx).

## Install

```
npm install --save-dev gulp-msx
```

## Example

```javascript
var gulp = require('gulp')
var msx = require('gulp-msx')

gulp.task('transform-jsx', function() {
  return gulp.src('./src/**/*.jsx')
    .pipe(msx({harmony: true}))
    .pipe(gulp.dest('./dist'))
})
```

`.jsx` files are automatically renamed to `.js` for you, ready for output.

## API

### `msx([options: Object])`

`options` - options to be passed to the call to
[`msx.transform()`](https://github.com/insin/msx/#module-api).

---

MIT Licensed