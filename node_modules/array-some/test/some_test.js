'use strict';

var some = require('..');
var assert = require('assert');

describe('some', function () {

    describe('tests whether some element in the array passes the test implemented by the provided function', function () {

        it('if such an element is found, immediately returns true', function () {
            var indices = [];
            assert.strictEqual(some([2, 5, 18, 1, 4], function (element, index, array) {
                indices.push(index);
                return (element >= 10);
            }), true);
            assert.deepEqual(indices, [0, 1, 2]);
        });
        it('otherwise, returns false', function () {
            var indices = [];
            assert.strictEqual(some([2, 5, 8, 1, 4], function (element, index, array) {
                indices.push(index);
                return (element >= 10);
            }), false);
            assert.deepEqual(indices, [0, 1, 2, 3, 4]);
        });
    });

    describe('exceptional cases', function () {
        it('throws TypeError when ary is null', function () {
            assert.throws(function () {
                some(null, function () {});
            }, TypeError);
        });
        it('throws TypeError when ary is undefined', function () {
            assert.throws(function () {
                some(undefined, function () {});
            }, TypeError);
        });
        it('throws TypeError when callback is not a function', function () {
            assert.throws(function () {
                some([2, 5, 18, 1, 4], 4);
            }, TypeError);
        });
    });

});
