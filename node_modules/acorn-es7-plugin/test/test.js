'use strict';

var acorn = require('acorn');
require('../')(acorn);
var estraverse = require('estraverse');
var xtend = require('xtend');
var assert = require('assert');

function find (type, ast, skip) {
  skip = skip || 0;
  var skipped = 0;

  var found;

  estraverse.traverse(ast, {
    enter: (node) => {
      if (found) {
        return estraverse.VisitorOption.Skip;
      }
      if (node.type == type) {
        if (skipped === skip) {
          found = node;
          return estraverse.VisitorOption.Skip;
        }
        skipped++;
      }
    }
  });

  if (!found) {
    throw new Error('did not find AwaitExpression (skipped ' + skipped + '/' + skip + ')');
  }

  return found;
}

function extendOptions(pluginOptions, acornOptions) {
  return xtend({
    sourceType: 'module',
    ecmaVersion: 7,
    locations: true,
    ranges: true,
    plugins: {asyncawait: pluginOptions || pluginOptions !== false}
  }, acornOptions);
}

function parse(code, pluginOptions, acornOptions) {
  if (Array.isArray(code)) {
    code = code.join('\n');
  }
  var options = extendOptions(pluginOptions, acornOptions);
  return acorn.parse(code, options);
}

describe('async', () => {
  describe ('function declaration', () => {
    var node;

    beforeEach(() => {
      node = find(
        'FunctionDeclaration',
        parse([
          'async function foo() {',
          '  x = await bar()',
          '}'
        ])
      );
    });

    it('marks the node as async', () =>
      assert(node.async)
    );

    it('finds correct start position', () =>
      assert.strictEqual(node.start, 0)
    );

    it('finds correct end position', () =>
      assert.strictEqual(node.end, 42)
    );

    it('finds correct start line/column', () =>
      assert.deepEqual(node.loc.start, {
        line: 1,
        column: 0
      })
    );

    it('finds correct end line/column', () =>
      assert.deepEqual(node.loc.end, {
        line: 3,
        column: 1
      })
    );
  });

  describe ('function expression', () => {
    var node, code;

    beforeEach(() => {
      code = [
        'foo = async function () {',
        '  x = await bar()',
        '}'
      ];
      node = find(
        'FunctionExpression',
        parse(code)
      );
    });

    it('marks the node as async', () =>
      assert(node.async)
    );

    it('finds correct start position', () =>
      assert.strictEqual(node.start, 6)
    );

    it('finds correct end position', () =>
      assert.strictEqual(node.end, code.join('\n').length)
    );

    it('finds correct start line/column', () =>
      assert.deepEqual(node.loc.start, {
        line: 1,
        column: 6
      })
    );

    it('finds correct end line/column', () =>
      assert.deepEqual(node.loc.end, {
        line: 3,
        column: 1
      })
    );
  });

  describe ('enhanced object literal', () => {
    var node, code;

    beforeEach(() => {
      code = [
        'var x = {',
        '  async foo() {}',
        '};'
      ];
      node = find(
        // TODO: Is it really supposed to mark the Property async? Why not the FunctionExpression?
        'Property',
        parse(code)
      );
    });

    it('marks the node value as async', () =>
        assert(node.value.async)
    );

    it('does not mark the node as async', () =>
        assert(!node.async)
    );

    it('finds correct start position', () =>
        assert.strictEqual(node.start, 12)
    );

    it('finds correct end position', () =>
        assert.strictEqual(node.end, code[0].length + code[1].length + 1) // + 1 is due to newline char
    );

    it('finds correct start line/column', () =>
        assert.deepEqual(node.loc.start, {
          line: 2,
          column: 2
        })
    );

    it('finds correct end line/column', () =>
        assert.deepEqual(node.loc.end, {
          line: 2,
          column: 16
        })
    );
  });

  describe ('ArrowFunctionExpression', () => {
    var node, code;

    beforeEach(() => {
      code = 'var x = async () => {}';
      node = find(
        'ArrowFunctionExpression',
        parse(code)
      );
    });

    it('marks the node as async', () =>
        assert(node.async)
    );

    it('finds correct start position', () =>
        assert.strictEqual(node.start, 8)
    );

    it('finds correct end position', () =>
        assert.strictEqual(node.end, code.length)
    );

    it('finds correct start line/column', () =>
        assert.deepEqual(node.loc.start, {
          line: 1,
          column: 8
        })
    );

    it('finds correct end line/column', () =>
        assert.deepEqual(node.loc.end, {
          line: 1,
          column: code.length
        })
    );
  });
});

describe('await', () => {
  describe('-', () => {
    var node;

    beforeEach(() => {
      node = find(
        'AwaitExpression',
        parse([
          'async function foo() {',
          '  x = await bar()',
          '}'
        ])
      );
    });

    it('finds correct start position', () =>
      assert.strictEqual(node.start, 29)
    );

    it('finds correct end position', () =>
      assert.strictEqual(node.end, 40)
    );

    it('finds correct start line/column', () =>
      assert.deepEqual(node.loc.start, {
        line: 2,
        column: 6
      })
    );

    it('finds correct end line/column', () =>
      assert.deepEqual(node.loc.end, {
        line: 2,
        column: 17
      })
    );
  });

  describe('outside a function (awaitAnywhere)', () => {
    var node;

    beforeEach(() => {
      node = find(
        'AwaitExpression',
        parse(
          'x = await bar()',
          {awaitAnywhere:true}
        )
      );
    });

    it('finds correct start position', () =>
      assert.strictEqual(node.start, 4)
    );

    it('finds correct start line/column', () =>
      assert.deepEqual(node.loc.start, {
        line: 1,
        column: 4
      })
    );

    it('finds correct end position', () =>
      assert.strictEqual(node.end, 15)
    );

    it('finds correct end line/column', () =>
      assert.deepEqual(node.loc.end, {
        line: 1,
        column: 15
      })
    );
  });
});
