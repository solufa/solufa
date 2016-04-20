var require = {
    paths: {
        assert: "../local_build/assert",
        empower: "../node_modules/empower/build/empower",
        esprima: '../node_modules/esprima/esprima',
        escodegen: '../local_build/escodegen',
        espower: "../node_modules/espower/build/espower",
        "power-assert-formatter": "../local_build/power-assert-formatter",
        mocha: "../bower_components/mocha/mocha",
        requirejs: "../bower_components/requirejs/require"
    },
    shim: {
        assert: {
            exports: "assert"
        }
    }
};
