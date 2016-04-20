/**
 * power-assert-renderers.js - Power Assert output renderers
 *
 * https://github.com/twada/power-assert-renderers
 *
 * Copyright (c) 2015 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/twada/power-assert-renderers/blob/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = {
    FileRenderer: require('./lib/file'),
    AssertionRenderer: require('./lib/assertion'),
    DiagramRenderer: require('./lib/diagram'),
    BinaryExpressionRenderer: require('./lib/binary-expression'),
    SuccinctRenderer: require('./lib/succinct-diagram')
};
