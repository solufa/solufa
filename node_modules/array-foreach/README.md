array-foreach
================================

[![Build Status][travis-image]][travis-url]
[![NPM package][npm-image]][npm-url]
[![Bower package][bower-image]][bower-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License][license-image]][license-url]


Array#forEach ponyfill for older browsers

> Ponyfill: A polyfill that doesn't overwrite the native method


DESCRIPTION
---------------------------------------

Provides `forEach` function for older browsers, use native implememtation if exists.

It's just like

- [array-map](https://www.npmjs.org/package/array-map)
- [array-filter](https://www.npmjs.org/package/array-filter)
- [array-some](https://www.npmjs.org/package/array-some)
- [array-reduce](https://www.npmjs.org/package/array-reduce)
- [indexof](https://www.npmjs.org/package/indexof)
- [object-assign](https://www.npmjs.com/package/object-assign)


EXAMPLE
---------------------------------------

```javascript
var forEach = require('array-foreach');
var result = '';
forEach(['foo', 'bar', 'baz'], function (element, index, array) {
    result += element;
});
console.log(result); // 'foobarbaz'
```


INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save array-foreach

Use

```javascript
var forEach = require('array-foreach');
```

### via bower

Install

    $ bower install --save array-foreach

Load (`forEach` function is exported)

    <script type="text/javascript" src="./path/to/bower_components/array-foreach/build/array-foreach.js"></script>

Use

```javascript
var result = '';
forEach(['foo', 'bar', 'baz'], function (element, index, array) {
    result += element;
});
```


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/twada/array-foreach/blob/master/MIT-LICENSE) license.


[travis-url]: http://travis-ci.org/twada/array-foreach
[travis-image]: https://secure.travis-ci.org/twada/array-foreach.svg?branch=master

[npm-url]: https://npmjs.org/package/array-foreach
[npm-image]: https://badge.fury.io/js/array-foreach.svg

[bower-url]: http://badge.fury.io/bo/array-foreach
[bower-image]: https://badge.fury.io/bo/array-foreach.svg

[depstat-url]: https://gemnasium.com/twada/array-foreach
[depstat-image]: https://gemnasium.com/twada/array-foreach.svg

[license-url]: https://github.com/twada/array-foreach/blob/master/MIT-LICENSE
[license-image]: http://img.shields.io/badge/license-MIT-brightgreen.svg
