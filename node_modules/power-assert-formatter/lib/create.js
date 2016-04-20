'use strict';

var stringifier = require('stringifier');
var stringWidth = require('./string-width');
var StringWriter = require('./string-writer');
var ContextTraversal = require('./traverse');
var udiff = require('./udiff');
var defaultOptions = require('./default-options');
var typeName = require('type-name');
var extend = require('xtend');
var map = require('array-map');

var AssertionRenderer = require('./built-in/assertion');
var FileRenderer = require('./built-in/file');
var DiagramRenderer = require('./built-in/diagram');
var BinaryExpressionRenderer = require('./built-in/binary-expression');

// "Browserify can only analyze static requires. It is not in the scope of browserify to handle dynamic requires."
// https://github.com/substack/node-browserify/issues/377
var defaultRendererClasses = {
    './built-in/file': FileRenderer,
    './built-in/assertion': AssertionRenderer,
    './built-in/diagram': DiagramRenderer,
    './built-in/binary-expression': BinaryExpressionRenderer
};

function toRendererClass (rendererName) {
    var RendererClass;
    if (typeName(rendererName) === 'function') {
        RendererClass = rendererName;
    } else if (typeName(rendererName) === 'string') {
        if (defaultRendererClasses[rendererName]) {
            RendererClass = defaultRendererClasses[rendererName];
        } else {
            RendererClass = require(rendererName);
        }
    }
    return RendererClass;
}

function configure (options) {
    var config = extend(defaultOptions(), options);
    if (typeof config.widthOf !== 'function') {
        config.widthOf = stringWidth(extend(config));
    }
    if (typeof config.stringify !== 'function') {
        config.stringify = stringifier(extend(config));
    }
    if (typeof config.diff !== 'function') {
        config.diff = udiff(extend(config));
    }
    if (!config.writerClass) {
        config.writerClass = StringWriter;
    }
    return config;
}

function create (options) {
    var config = configure(options);
    var rendererClasses = map(config.renderers, toRendererClass);
    return function (context) {
        var traversal = new ContextTraversal(context);
        var writer = new config.writerClass(extend(config));
        var renderers = map(rendererClasses, function (RendererClass) {
            var renderer;
            if (RendererClass.length === 2) {
                renderer = new RendererClass(traversal, extend(config));
            } else {
                renderer = new RendererClass(extend(config));
                renderer.init(traversal);
            }
            return renderer;
        });
        traversal.emit('start', context);
        traversal.traverse();
        traversal.emit('render', writer);
        writer.write('');
        renderers.length = 0;
        return writer.flush();
    };
}

create.renderers = {
    AssertionRenderer: AssertionRenderer,
    FileRenderer: FileRenderer,
    DiagramRenderer: DiagramRenderer,
    BinaryExpressionRenderer: BinaryExpressionRenderer
};
create.defaultOptions = defaultOptions;
create.stringWidth = stringWidth;
module.exports = create;
