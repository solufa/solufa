'use strict';

var estraverse = require('estraverse');
var parser = require('acorn');
require('acorn-es7-plugin')(parser);
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var EsNode = require('./esnode');
var forEach = require('array-foreach');
var reduce = require('array-reduce');

function ContextTraversal (context) {
    this.context = context;
    EventEmitter.call(this);
}
inherits(ContextTraversal, EventEmitter);

ContextTraversal.prototype.traverse = function () {
    var _this = this;
    forEach(this.context.args, function (arg) {
        onEachEsNode(arg, _this.context.source, function (esNode) {
            _this.emit('esnode', esNode);
        });
    });
};

function onEachEsNode(arg, source, callback) {
    var parseResult = parse(source);
    var tokens = parseResult.tokens;
    var espathToValue = reduce(arg.events, function (accum, ev) {
        accum[ev.espath] = ev.value;
        return accum;
    }, {});
    var nodeStack = [];
    estraverse.traverse(parseResult.expression, {
        enter: function (currentNode, parentNode) {
            var esNode = new EsNode(this.path(), currentNode, parentNode, espathToValue, source.content, tokens);
            if (1 < nodeStack.length) {
                esNode.setParent(nodeStack[nodeStack.length - 1]);
            }
            nodeStack.push(esNode);
            callback(esNode);
        },
        leave: function (currentNode, parentNode) {
            nodeStack.pop();
        }
    });
}

function parserOptions(tokens) {
    return {
        sourceType: 'module',
        ecmaVersion: 7,
        locations: true,
        ranges: true,
        onToken: tokens,
        plugins: {asyncawait: true}
    };
}

function wrappedInGenerator(jsCode) {
    return 'function *wrapper() {\n' + jsCode + '\n}';
}

function wrappedInAsync(jsCode) {
    return 'async function wrapper() {\n' + jsCode + '\n}';
}

function parse(source) {
    var ast;
    var tokens = [];

    function doParse(wrapper) {
        var content = wrapper ? wrapper(source.content) : source.content;
        ast = parser.parse(content, parserOptions(tokens));
        if (wrapper) {
            ast = ast.body[0].body;
        }
    }

    if (source.async) {
        doParse(wrappedInAsync);
    } else if (source.generator) {
        doParse(wrappedInGenerator);
    } else {
        doParse();
    }

    return {
        tokens: tokens,
        expression: ast.body[0].expression
    };
}

module.exports = ContextTraversal;
