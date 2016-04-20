var createFormatter = require('..');
var empower = require('empower');
var baseAssert = require('assert');
var assert = empower(baseAssert, createFormatter());
var babel = require('babel-core');
require('babel-core/polyfill');
var createEspowerPlugin = require('babel-plugin-espower/create');

function weave (line) {
    return babel.transform(line, {
        filename: '/absolute/path/to/project/test/some_test.js',
        plugins: [
            createEspowerPlugin(babel, {
                sourceRoot: '/absolute/path/to/project'
            })
        ]
    }).code;
}

function assertPowerAssertContextFormatting (body, expectedLines, done) {
    if (done) {
        baseAssert.equal(body.length, 1, 'body should accept a "done" callback');
        body(function (e) {
            try {
                if (!e) {
                    baseAssert.fail('AssertionError should be thrown');
                }
                baseAssert.equal(e.message, expectedLines.join('\n'));
            } catch (err) {
                return done(err);
            }
            done();
        });
    } else {
        baseAssert.equal(body.length, 0, 'assertPowerAssertContextFormatting must be passed a "done" callback if "body" needs to run async');
        try {
            body();
            baseAssert.fail('AssertionError should be thrown');
        } catch (e) {
            baseAssert.equal(e.message, expectedLines.join('\n'));
        }
    }
}

suite('ES6 features', function () {

    test('TemplateLiteral', function () {
        var alice = { name: 'alice' };
        var bob = { name: 'bob' };
        assertPowerAssertContextFormatting(function () {
            eval(weave('assert(`${alice.name} and ${bob.name}` === `bob and alice`);'));
        }, [
            '  # test/some_test.js:1',
            '  ',
            '  assert(`${ alice.name } and ${ bob.name }` === `bob and alice`)',
            '         |   |     |             |   |       |   |               ',
            '         |   |     |             |   |       |   "bob and alice" ',
            '         |   |     |             |   "bob"   false               ',
            '         |   |     "alice"       Object{name:"bob"}              ',
            '         |   Object{name:"alice"}                                ',
            '         "alice and bob"                                         ',
            '  ',
            '  --- [string] `bob and alice`',
            '  +++ [string] `${ alice.name } and ${ bob.name }`',
            '  @@ -1,13 +1,13 @@',
            '  -bob and alice',
            '  +alice and bob',
            '  ',
            '  '
        ]);
    });

    test('ArrowFunctionExpression and SpreadElement', function () {
        var seven = 7, ary = [4, 5];
        assertPowerAssertContextFormatting(function () {
            eval(weave('assert(seven === ((v, i) => v + i)(...[...ary]));'));
        }, [
            '  # test/some_test.js:1',
            '  ',
            '  assert(seven === ((v, i) => v + i)(...[...ary]))',
            '         |     |   |                    |   |     ',
            '         |     |   |                    |   [4,5] ',
            '         |     |   9                    [4,5]     ',
            '         7     false                              ',
            '  ',
            '  [number] ((v, i) => v + i)(...[...ary])',
            '  => 9',
            '  [number] seven',
            '  => 7',
            '  '
        ]);
    });

    test('Enhanced Object Literals', function () {
        var name = 'bobby';
        assertPowerAssertContextFormatting(function () {
            eval(weave('assert.deepEqual({ name, [ `${name} greet` ]: `Hello, I am ${name}` }, null);'));
        }, [
            '  # test/some_test.js:1',
            '  ',
            '  assert.deepEqual({name,[`${ name } greet`]: `Hello, I am ${ name }`}, null)',
            '                   |      |   |               |               |              ',
            '                   |      |   |               |               "bobby"        ',
            '                   |      |   "bobby"         "Hello, I am bobby"            ',
            '                   |      "bobby greet"                                      ',
            '                   Object{name:"bobby","bobby greet":"Hello, I am bobby"}    ',
            '  '
        ]);
    });

    test('Yield Statements', function (done) {
        assertPowerAssertContextFormatting(function (done) {
            var big = 'big';
            eval(weave([
                'function bigOrSmall(size) {',
                '  return Promise.resolve(size > 100 ? "big" : "small");',
                '}',
                '',
                'function *myGenerator (input) {',
                '  assert((yield bigOrSmall(input)) === big);',
                '}',
                '',
                'var gen = myGenerator(3);',
                'gen.next().value.then((val) => gen.next(val)).catch(done);'
            ].join('\n')));
        }, [
            '  # test/some_test.js:6',
            '  ',
            '  assert((yield bigOrSmall(input)) === big)',
            '          |                |       |   |   ',
            '          |                |       |   "big"',
            '          "small"          3       false   ',
            '  ',
            '  --- [string] big',
            '  +++ [string] yield bigOrSmall(input)',
            '  @@ -1,3 +1,5 @@',
            '  -big',
            '  +small',
            '  ',
            '  '
        ], done);
    });

    test('Async/Await Statements', function (done) {
        assertPowerAssertContextFormatting(function (done) {
            var big = 'big';

            eval(weave([
                'function bigOrSmall(size) {',
                '  return Promise.resolve(size > 100 ? "big" : "small");',
                '}',
                '',
                'async function isBig (input) {',
                '  assert((await (bigOrSmall(input))) === big);',
                '}',
                '',
                'isBig(4).catch(done);'
            ].join('\n')));
        }, [
            '  # test/some_test.js:6',
            '  ',
            '  assert((await bigOrSmall(input)) === big)',
            '          |                |       |   |   ',
            '          |                |       |   "big"',
            '          "small"          4       false   ',
            '  ',
            '  --- [string] big',
            '  +++ [string] await bigOrSmall(input)',
            '  @@ -1,3 +1,5 @@',
            '  -big',
            '  +small',
            '  ',
            '  '
        ], done);
    });

    test('await() - function call disambiguation', function () {
        assertPowerAssertContextFormatting(function () {
            var big = 'big';

            function await(val) {
                return '...' + val;
            }

            eval(weave([
                'function bigOrSmall(size) {',
                '  return size > 100 ? "big" : "small";',
                '}',
                '',
                'function isBig (input) {',
                '  assert((await (bigOrSmall(input))) === big);',
                '}',
                '',
                'isBig(4);'
            ].join('\n')));
        }, [
            '  # test/some_test.js:6',
            '  ',
            '  assert(await(bigOrSmall(input)) === big)',
            '         |     |          |       |   |   ',
            '         |     |          |       |   "big"',
            '         |     "small"    4       false   ',
            '         "...small"                       ',
            '  ',
            '  --- [string] big',
            '  +++ [string] await(bigOrSmall(input))',
            '  @@ -1,3 +1,8 @@',
            '  -big',
            '  +...small',
            '  ',
            '  '
        ]);
    });
});
