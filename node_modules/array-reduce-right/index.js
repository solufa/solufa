/**
 * array-reduce-right
 *   Array#reduceRight ponyfill for older browsers
 *   (Ponyfill: A polyfill that doesn't overwrite the native method)
 * 
 * https://github.com/twada/array-reduce-right
 *
 * Copyright (c) 2015 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var slice = Array.prototype.slice;

module.exports = function reduceRight (ary, callback /*, initialValue*/) {
    if (ary.reduceRight) {
        return ary.reduceRight.apply(ary, slice.apply(arguments).slice(1));
    }
    if ('function' !== typeof callback) {
        throw new TypeError(callback + ' is not a function');
    }
    var t = Object(ary), len = t.length >>> 0, k = len - 1, value;
    if (arguments.length >= 3) {
        value = arguments[2];
    } else {
        while (k >= 0 && !(k in t)) {
            k--;
        }
        if (k < 0) {
            throw new TypeError('Reduce of empty array with no initial value');
        }
        value = t[k--];
    }
    for (; k >= 0; k--) {
        if (k in t) {
            value = callback(value, t[k], k, t);
        }
    }
    return value;
};
