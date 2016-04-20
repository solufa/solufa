'use strict';

function AssertionRenderer (config) {
}

AssertionRenderer.prototype.init = function (traversal) {
    var assertionLine;
    traversal.on('start', function (context) {
        assertionLine = context.source.content;
    });
    traversal.on('render', function (writer) {
        writer.write('');
        writer.write(assertionLine);
    });
};

module.exports = AssertionRenderer;
