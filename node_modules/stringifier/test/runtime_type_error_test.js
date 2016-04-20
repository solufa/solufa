(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['stringifier', 'assert'], factory);
    } else if (typeof exports === 'object') {
        factory(require('..'), require('assert'));
    } else {
        factory(root.stringifier, root.assert);
    }
}(this, function (
    stringifier,
    assert
) {

var stringify = stringifier.stringify;

if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
    describe('in case of runtime TypeError', function () {
        it('stringifying HTMLInputElement', function () {
            var input = document.getElementById("confirmation");
            var str = stringify(input, {maxDepth: 1});
            assert(/^HTMLInputElement/.test(str));
            assert(/defaultChecked\:false/.test(str));
            assert(/multiple\:false/.test(str));
        });
    });
}

}));
