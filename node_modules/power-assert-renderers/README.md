power-assert-renderers
================================

Power Assert output renderers.

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]


DESCRIPTION
---------------------------------------
`power-assert-renderers` is various output renderers for [power-assert](http://github.com/power-assert-js/power-assert).

Pull-requests, issue reports and patches are always welcomed. See [power-assert](http://github.com/power-assert-js/power-assert) project for more documentation.


CHANGELOG
---------------------------------------
See [CHANGELOG](https://github.com/twada/power-assert-renderers/blob/master/CHANGELOG.md)


RENDERERS
---------------------------------------

- `var FileRenderer = require('power-assert-renderers').FileRenderer;`
- `var AssertionRenderer = require('power-assert-renderers').AssertionRenderer;`
- `var DiagramRenderer = require('power-assert-renderers').DiagramRenderer;`
- `var BinaryExpressionRenderer = require('power-assert-renderers').BinaryExpressionRenderer;`
- `var SuccinctRenderer = require('power-assert-renderers').SuccinctRenderer;`


USAGE
---------------------------------------

By default, power-assert output consists of 4 parts, rendered by 4 renderers (`file` for FileRenderer, `assertion` for AssertionRenderer, `diagram` for DiagramRenderer, and `binary-expression` for BinaryExpressionRenderer). You can omit each part from output through [customization API](https://github.com/power-assert-js/power-assert#customization-api).


For example, power assert output below 
```
  # test.js:26
  t.ok(a.name === 'bar')
       | |    |         
       | |    false     
       | "foo"          
       Object{name:"foo"}
  --- [string] 'bar'
  +++ [string] a.name
  @@ -1,3 +1,3 @@
  -bar
```

`FileRenderer` renderer produces,
```
   # test.js:26
```

`AssertionRenderer` renderer produces,
```
  t.ok(a.name === 'bar')
```

`DiagramRenderer` renderer produces,
```
       | |    |         
       | |    false     
       | "foo"          
       Object{name:"foo"}
```

and `BinaryExpressionRenderer` renderer produces
```
  --- [string] 'bar'
  +++ [string] a.name
  @@ -1,3 +1,3 @@
  -bar
```


To disable graph, remove `diagram` renderer from `output.renderers` by using `customize` method.
For example, this configuration

```javascript
var assert = require('power-assert').customize({
    output: {
        renderers: [
            require('power-assert-renderers').FileRenderer,
            require('power-assert-renderers').AssertionRenderer,
            require('power-assert-renderers').BinaryExpressionRenderer
        ]
    }
});
```

produces output as below.

```
  # test.js:26
  t.ok(a.name === 'bar')
  
  --- [string] 'bar'
  +++ [string] a.name
  @@ -1,3 +1,3 @@
  -bar
```


INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save-dev power-assert-renderers


#### use power-assert-renderers npm module on browser

`powerAssertRenderers` function is exported

    <script type="text/javascript" src="./path/to/node_modules/power-assert-renderers/build/power-assert-renderers.js"></script>


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/twada/power-assert-renderers/blob/master/MIT-LICENSE.txt) license.


[travis-url]: http://travis-ci.org/twada/power-assert-renderers
[travis-image]: https://secure.travis-ci.org/twada/power-assert-renderers.svg?branch=master

[npm-url]: https://npmjs.org/package/power-assert-renderers
[npm-image]: https://badge.fury.io/js/power-assert-renderers.svg

[license-url]: https://github.com/twada/power-assert-renderers/blob/master/MIT-LICENSE.txt
[license-image]: http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat
