'use strict';

var DiagramRenderer = require('./diagram');
var inherits = require('util').inherits;
var forEach = require('array-foreach');
var some = require('array-some');

function SuccinctRenderer (config) {
    DiagramRenderer.call(this, config);
}
inherits(SuccinctRenderer, DiagramRenderer);

SuccinctRenderer.prototype.init = function (traversal) {
    var _this = this;
    traversal.on('start', function (context) {
        _this.context = context;
        _this.assertionLine = context.source.content;
        _this.initializeRows();
    });
    traversal.on('esnode', function (esNode) {
        if (!esNode.isCaptured()) {
            return;
        }
        if (withinMemberExpression(esNode)) {
            return;
        }
        _this.dumpIfSupported(esNode);
    });
    traversal.on('render', function (writer) {
        _this.events.sort(rightToLeft);
        _this.constructRows(_this.events);
        forEach(_this.rows, function (columns) {
            writer.write(columns.join(''));
        });
    });
};

SuccinctRenderer.prototype.dumpIfSupported = function (esNode) {
    switch(esNode.currentNode.type) {
    case 'Identifier':
    case 'MemberExpression':
    case 'CallExpression':
        this.events.push({value: esNode.value(), loc: esNode.location()});
        break;
    }
};

function withinMemberExpression (esNode) {
    var ancestors = collectAncestors([], esNode.getParent());
    return some(ancestors, function (eachNode) {
        return eachNode.currentNode.type === 'MemberExpression';
    });
}

function collectAncestors (ary, esNode) {
    if (!esNode) {
        return ary;
    }
    ary.push(esNode);
    return collectAncestors(ary, esNode.getParent());
}

function rightToLeft (a, b) {
    return b.loc.start.column - a.loc.start.column;
}

module.exports = SuccinctRenderer;
