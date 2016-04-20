'use strict';

function FileRenderer (config) {
}

FileRenderer.prototype.init = function (traversal) {
    var filepath, lineNumber;
    traversal.on('start', function (context) {
        filepath = context.source.filepath;
        lineNumber = context.source.line;
    });
    traversal.on('render', function (writer) {
        if (filepath) {
            writer.write('# ' + [filepath, lineNumber].join(':'));
        } else {
            writer.write('# at line: ' + lineNumber);
        }
    });
};

module.exports = FileRenderer;
