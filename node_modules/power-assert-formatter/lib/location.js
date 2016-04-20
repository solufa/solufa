'use strict';

var syntax = require('estraverse').Syntax;

function locationOf(currentNode, tokens) {
    switch(currentNode.type) {
    case syntax.MemberExpression:
        return propertyLocationOf(currentNode, tokens);
    case syntax.CallExpression:
        if (currentNode.callee.type === syntax.MemberExpression) {
            return propertyLocationOf(currentNode.callee, tokens);
        }
        break;
    case syntax.BinaryExpression:
    case syntax.LogicalExpression:
    case syntax.AssignmentExpression:
        return infixOperatorLocationOf(currentNode, tokens);
    default:
        break;
    }
    return currentNode.loc;
}

function propertyLocationOf(memberExpression, tokens) {
    var prop = memberExpression.property;
    var token;
    if (!memberExpression.computed) {
        return prop.loc;
    }
    token = findLeftBracketTokenOf(memberExpression, tokens);
    return token ? token.loc : prop.loc;
}

// calculate location of infix operator for BinaryExpression, AssignmentExpression and LogicalExpression.
function infixOperatorLocationOf (expression, tokens) {
    var token = findOperatorTokenOf(expression, tokens);
    return token ? token.loc : expression.left.loc;
}

function findLeftBracketTokenOf(expression, tokens) {
    var fromLine = expression.loc.start.line;
    var toLine = expression.property.loc.start.line;
    var fromColumn = expression.property.loc.start.column;
    return searchToken(tokens, fromLine, toLine, function (token, index) {
        var prevToken;
        if (token.loc.start.column === fromColumn) {
            prevToken = tokens[index - 1];
            // if (prevToken.type === 'Punctuator' && prevToken.value === '[') {  // esprima
            if (prevToken.type.label === '[') {  // acorn
                return prevToken;
            }
        }
        return undefined;
    });
}

function findOperatorTokenOf(expression, tokens) {
    var fromLine = expression.left.loc.end.line;
    var toLine = expression.right.loc.start.line;
    var fromColumn = expression.left.loc.end.column;
    var toColumn = expression.right.loc.start.column;
    return searchToken(tokens, fromLine, toLine, function (token, index) {
        if (fromColumn < token.loc.start.column &&
            token.loc.end.column < toColumn &&
            token.value === expression.operator) {
            return token;
        }
        return undefined;
    });
}

function searchToken(tokens, fromLine, toLine, predicate) {
    var i, token, found;
    for(i = 0; i < tokens.length; i += 1) {
        token = tokens[i];
        if (token.loc.start.line < fromLine) {
            continue;
        }
        if (toLine < token.loc.end.line) {
            break;
        }
        found = predicate(token, i);
        if (found) {
            return found;
        }
    }
    return undefined;
}

module.exports = locationOf;
