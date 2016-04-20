# ava-init [![Build Status](https://travis-ci.org/sindresorhus/ava-init.svg?branch=master)](https://travis-ci.org/sindresorhus/ava-init)

> Add [AVA](http://ava.li) to your project


## Install

```
$ npm install --save ava-init
```


## Usage

```js
var avaInit = require('ava-init');

avaInit().then(function () {
	console.log('done');
});
```


## API

### avaInit([options])

Returns a promise.

#### options

#### cwd

Type: `string`  
Default: `'.'`

Current working directory.

#### args

Type: `array`  
Default: CLI arguments *(`process.argv.slice(2)`)*

For instance, with the arguments `['--foo', '--bar']` the following will be put in package.json:

```json
{
	"name": "awesome-package",
	"scripts": {
		"test": "ava --foo --bar"
	}
}
```


## CLI

Install AVA globally `$ npm install --global ava` and run `$ ava --init [<options>]`.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
