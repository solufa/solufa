"use strict";
function arrayify(arg) {
    if (Array.isArray(arg)) {
        return arg;
    }
    else if (arg != null) {
        return [arg];
    }
    else {
        return [];
    }
}
exports.arrayify = arrayify;
function objectify(arg) {
    if (typeof arg === "object" && arg != null) {
        return arg;
    }
    else {
        return {};
    }
}
exports.objectify = objectify;
