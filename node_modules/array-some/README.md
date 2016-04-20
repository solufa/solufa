array-some
================================

[![Build Status][travis-image]][travis-url]
[![NPM package][npm-image]][npm-url]
[![Bower package][bower-image]][bower-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License][license-image]][license-url]


Array#some ponyfill for older browsers

> Ponyfill: A polyfill that doesn't overwrite the native method


DESCRIPTION
---------------------------------------

Provides `some` function for older browsers, use native implememtation if exists.

It's just like

- [array-foreach](https://www.npmjs.org/package/array-foreach)
- [array-map](https://www.npmjs.org/package/array-map)
- [array-filter](https://www.npmjs.org/package/array-filter)
- [array-reduce](https://www.npmjs.org/package/array-reduce)
- [indexof](https://www.npmjs.org/package/indexof)
- [object-assign](https://www.npmjs.com/package/object-assign)


EXAMPLE
---------------------------------------

```javascript
var some = require('array-some');
function isBiggerThan10 (element, index, array) {
    return element > 10;
}
some([2, 5, 8, 1, 4], isBiggerThan10);  // false
some([12, 5, 8, 1, 4], isBiggerThan10); // true
```


INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save array-some

Use

```javascript
var some = require('array-some');
```

### via bower

Install

    $ bower install --save array-some

Load (`some` function is exported)

    <script type="text/javascript" src="./path/to/bower_components/array-some/build/array-some.js"></script>

Use

```javascript
var result = some([2, 5, 8, 1, 4], function (element, index, array) {
    return element > 10;
});
```


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/) license.


[travis-url]: http://travis-ci.org/twada/array-some
[travis-image]: https://secure.travis-ci.org/twada/array-some.svg?branch=master

[npm-url]: https://npmjs.org/package/array-some
[npm-image]: https://badge.fury.io/js/array-some.svg

[bower-url]: http://badge.fury.io/bo/array-some
[bower-image]: https://badge.fury.io/bo/array-some.svg

[depstat-url]: https://gemnasium.com/twada/array-some
[depstat-image]: https://gemnasium.com/twada/array-some.svg

[license-url]: http://twada.mit-license.org/
[license-image]: http://img.shields.io/badge/license-MIT-brightgreen.svg
