'use strict';

var isArray = require('isarray');
var objectKeys = Object.keys || require('object-keys');
var indexOf = require('indexof');
var reduce = require('array-reduce');

module.exports = function cloneWithWhitelist (astWhiteList) {
    var whitelist = reduce(objectKeys(astWhiteList), function (props, key) {
        var propNames = astWhiteList[key];
        var prepend = (indexOf(propNames, 'type') === -1) ? ['type'] : [];
        props[key] = prepend.concat(propNames);
        return props;
    }, {});

    function cloneNodeOrObject (obj) {
        var props = obj.type ? whitelist[obj.type] : null;
        if (props) {
            return cloneNode(obj, props);
        } else {
            return cloneObject(obj);
        }
    }

    function cloneArray (ary) {
        var i = ary.length, clone = [];
        while (i--) {
            clone[i] = cloneOf(ary[i]);
        }
        return clone;
    }

    function cloneNode (node, props) {
        var i, len, key, clone = {};
        for (i = 0, len = props.length; i < len; i += 1) {
            key = props[i];
            if (node.hasOwnProperty(key)) {
                clone[key] = cloneOf(node[key]);
            }
        }
        return clone;
    }

    function cloneObject (obj) {
        var props = objectKeys(obj);
        var i, len, key, clone = {};
        for (i = 0, len = props.length; i < len; i += 1) {
            key = props[i];
            clone[key] = cloneOf(obj[key]);
        }
        return clone;
    }

    function cloneOf (val) {
        if (typeof val === 'object' && val !== null) {
            if (val instanceof RegExp) {
                return new RegExp(val);
            } else if (isArray(val)) {
                return cloneArray(val);
            } else {
                return cloneNodeOrObject(val);
            }
        } else {
            return val;
        }
    }

    return cloneNodeOrObject;
};
