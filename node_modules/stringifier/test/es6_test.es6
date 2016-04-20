const assert = require('assert');
const stringifier = require('..');
const stringify = stringifier.stringify;

const FOO = Symbol("FOO");

describe('ES6 features', () => {
    it('Symbol', () => {
        assert.equal(stringify(FOO), 'Symbol(FOO)');
    });
});
