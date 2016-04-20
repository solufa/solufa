'use strict';

var reduceRight = require('..');
var assert = require('assert');

describe('reduceRight', function () {

    describe('applies a function against an accumulator and each value of the array (from right-to-left) has to reduce it to a single value.', function () {

        it('Example: Sum up all values within an array', function () {
            var total = [0, 1, 2, 3].reduceRight(function(a, b) {
                return a + b;
            });
            assert.equal(total, 6);
        });

        it('Example: Flatten an array of arrays', function () {
            var flattened = reduceRight([[0, 1], [2, 3], [4, 5]], function (a, b) {
                return a.concat(b);
            }, []);
            assert.deepEqual(flattened, [4, 5, 2, 3, 0, 1]);
        });

        it('from right-to-left', function () {
            var total = reduceRight([3, 2, 24], function (a, b) {
                return a / b;
            });
            assert.equal(total, 4);
        });

        it('from right-to-left, with initialValue', function () {
            var total = reduceRight([3, 4, 2], function (a, b) {
                return a / b;
            }, 120);
            assert.equal(total, 5);
        });
    });


    describe('exceptional cases', function () {
        it('throws TypeError when ary is null', function () {
            assert.throws(function () {
                reduceRight(null, function (a, b) {
                    return a + b;
                });
            }, TypeError);
        });
        it('throws TypeError when ary is undefined', function () {
            assert.throws(function () {
                reduceRight(undefined, function (a, b) {
                    return a + b;
                });
            }, TypeError);
        });
        it('throws TypeError when callback is not a function', function () {
            assert.throws(function () {
                reduceRight([2, 5, 18, 1, 4], 4);
            }, TypeError);
        });
    });
});
