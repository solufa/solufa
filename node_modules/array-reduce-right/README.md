array-reduce-right
================================

[![Build Status][travis-image]][travis-url]
[![NPM package][npm-image]][npm-url]
[![Bower package][bower-image]][bower-url]
[![Dependency Status][depstat-image]][depstat-url]
[![License][license-image]][license-url]


Array#reduceRight ponyfill for older browsers

> Ponyfill: A polyfill that doesn't overwrite the native method


DESCRIPTION
---------------------------------------

Provides `reduceRight` function for older browsers, use native implememtation if exists.

It's just like

- [array-foreach](https://www.npmjs.org/package/array-foreach)
- [array-map](https://www.npmjs.org/package/array-map)
- [array-filter](https://www.npmjs.org/package/array-filter)
- [array-some](https://www.npmjs.org/package/array-some)
- [array-reduce](https://www.npmjs.org/package/array-reduce)
- [indexof](https://www.npmjs.org/package/indexof)
- [object-assign](https://www.npmjs.com/package/object-assign)


EXAMPLE
---------------------------------------

```javascript
var total = reduceRight([3, 2, 24], function (a, b) {
    return a / b;
});
assert.equal(total, 4);

var flattened = reduceRight([[0, 1], [2, 3], [4, 5]], function (a, b) {
    return a.concat(b);
}, []);
assert.deepEqual(flattened, [4, 5, 2, 3, 0, 1]);
```


INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save array-reduce-right

Use

    var reduceRight = require('array-reduce-right');


#### use array-reduce-right npm module on browser

`reduceRight` function is exported

    <script type="text/javascript" src="./path/to/node_modules/array-reduce-right/build/array-reduce-right.js"></script>


### via bower

Install

    $ bower install --save array-reduce-right

Load (`reduceRight` function is exported)

    <script type="text/javascript" src="./path/to/bower_components/array-reduce-right/build/array-reduce-right.js"></script>

Use

    var total = reduceRight([3, 2, 24], function (a, b) {
        return a / b;
    });


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/) license.

[travis-url]: http://travis-ci.org/twada/array-reduce-right
[travis-image]: https://secure.travis-ci.org/twada/array-reduce-right.svg?branch=master

[npm-url]: https://npmjs.org/package/array-reduce-right
[npm-image]: https://badge.fury.io/js/array-reduce-right.svg

[bower-url]: http://badge.fury.io/bo/array-reduce-right
[bower-image]: https://badge.fury.io/bo/array-reduce-right.svg

[depstat-url]: https://gemnasium.com/twada/array-reduce-right
[depstat-image]: https://gemnasium.com/twada/array-reduce-right.svg

[license-url]: http://twada.mit-license.org/
[license-image]: http://img.shields.io/badge/license-MIT-brightgreen.svg
