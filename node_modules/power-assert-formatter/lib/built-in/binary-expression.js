'use strict';

var typeName = require('type-name');
var keys = Object.keys || require('object-keys');
var syntax = require('estraverse').Syntax;
var forEach = require('array-foreach');


function BinaryExpressionRenderer(config) {
    this.config = config;
    this.stringify = config.stringify;
    this.diff = config.diff;
    this.espathToPair = {};
}

BinaryExpressionRenderer.prototype.init = function (traversal) {
    var _this = this;
    traversal.on('esnode', function (esNode) {
        var pair;
        if (!esNode.isCaptured()) {
            if (isTargetBinaryExpression(esNode.getParent()) && esNode.currentNode.type === syntax.Literal) {
                _this.espathToPair[esNode.parentEspath][esNode.currentProp] = {code: esNode.code(), value: esNode.value()};
            }
            return;
        }
        if (isTargetBinaryExpression(esNode.getParent())) {
            _this.espathToPair[esNode.parentEspath][esNode.currentProp] = {code: esNode.code(), value: esNode.value()};
        }
        if (isTargetBinaryExpression(esNode)) {
            pair = {
                operator: esNode.currentNode.operator,
                value: esNode.value()
            };
            _this.espathToPair[esNode.espath] = pair;
        }
    });
    traversal.on('render', function (writer) {
        var pairs = [];
        forEach(keys(_this.espathToPair), function (espath) {
            var pair = _this.espathToPair[espath];
            if (pair.left && pair.right) {
                pairs.push(pair);
            }
        });
        forEach(pairs, function (pair) {
            _this.compare(pair, writer);
        });
    });
};

BinaryExpressionRenderer.prototype.compare = function (pair, writer) {
    if (isStringDiffTarget(pair)) {
        this.showStringDiff(pair, writer);
    } else {
        this.showExpectedAndActual(pair, writer);
    }
};

BinaryExpressionRenderer.prototype.showExpectedAndActual = function (pair, writer) {
    writer.write('');
    writer.write('[' + typeName(pair.right.value) + '] ' + pair.right.code);
    writer.write('=> ' + this.stringify(pair.right.value));
    writer.write('[' + typeName(pair.left.value)  + '] ' + pair.left.code);
    writer.write('=> ' + this.stringify(pair.left.value));
};

BinaryExpressionRenderer.prototype.showStringDiff = function (pair, writer) {
    writer.write('');
    writer.write('--- [string] ' + pair.right.code);
    writer.write('+++ [string] ' + pair.left.code);
    writer.write(this.diff(pair.right.value, pair.left.value, this.config));
};

function isTargetBinaryExpression (esNode) {
    return esNode &&
        esNode.currentNode.type === syntax.BinaryExpression &&
        (esNode.currentNode.operator === '===' || esNode.currentNode.operator === '==') &&
        esNode.isCaptured() &&
        !(esNode.value());
}

function isStringDiffTarget(pair) {
    return typeof pair.left.value === 'string' && typeof pair.right.value === 'string';
}

module.exports = BinaryExpressionRenderer;
