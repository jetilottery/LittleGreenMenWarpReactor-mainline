module.exports = {
    "parserOptions": {
        "ecmaVersion": 2017,
    },
    env: {
        browser: true,
        amd: true,
        es6: true,

    },
    extends: "eslint:recommended",
    rules: {
        "no-console": [0],
/*      "no-debugger": [0],
          
        debugger // eslint-disable-line
        or:
        eslint-disable no-debugger //ON THE TOP OF THE FILE;
*/        
        "semi": ["error", "always"],
        "no-use-before-define": ["error", { "functions": false, "classes": false }],
        "no-control-regex": 0, // to disable getting Javascript Unexpected control character(s) in regular expression error when build.
    },
    /*"parserOptions":{
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true, // For eslint to support rest spread (the ... operator) usage, I tried adding this setting, but didn't get the error sorted.
        }
    }*/

};
