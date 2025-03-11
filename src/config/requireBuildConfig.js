require.config({
    shim: {
        'com/pixijs/pixi-particles': {
            deps: ['com/pixijs/pixi']
        },
        'com/pixijs/pixi-spine': {
            deps: ['com/pixijs/pixi']
        }
    },
    "paths": {
        "postal": "messagebus/postal",
        "postal.federation": "messagebus/postal.federation",
        "xframe": "messagebus/postal.xframe",
        "request-response": "messagebus/postal.request-response",
        "riveter": "messagebus/riveter",
        "underscore": "messagebus/underscore",
        "lodash": "messagebus/lodash",
        "promise": "messagebus/q"
    },
    urlArgs:"",
    waitSeconds: 15
});