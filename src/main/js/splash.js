define([
    'skbJet/componentCRDC/splash/splashLoadController',
    'skbJet/componentCRDC/splash/splashUIController'
], function(splashLoadController, splashUIController) {
    var predefinedData = {
        "swirlName": "LoadingSwirl",
        "splashLogoName": "portrait_gameLogo",
        "backgroundSize": "cover",
        landscape: {
            canvas: {
                width: 1440,
                height: 810,
                landscapeMargin: 0
            },
            gameImgDiv: {
                width: 1440,
                height: 810,
                top: 0
            },
            gameLogoDiv: {
                width: 812,
                height: 414,
                y: 320
            },
            progressSwirl: {
                width: 100,
                height: 100,
                animationSpeed: 0.5,
                loop: true,
                y: 600,
                scale: {
                    x: 1.2,
                    y: 1.2
                }
            },
            progressTextDiv: {
                y: 600,
                style: {
                    fontSize: 25,
                    fill: "#ffffff",
                    fontWeight: 800,
                    fontFamily: '"Oswald"'
                }
            },
            copyRightDiv: {
                bottom: 20,
                fontSize: 20,
                color: "#d4c5fb",
                fontFamily: '"Oswald"'
            }
        },
        portrait: {
            canvas: {
                width: 810,
                height: 1228
            },
            gameImgDiv: {
                width: 810,
                height: 1228,
                top: 0
            },
            gameLogoDiv: {
                width: 810,
                height: 412,
                y: 400
            },
            progressSwirl: {
                width: 100,
                height: 100,
                animationSpeed: 0.5,
                loop: true,
                y: 800,
                scale: {
                    x: 1.2,
                    y: 1.2
                }
            },
            copyRightDiv: {
                bottom: 20,
                fontSize: 18,
                color: "#d4c5fb",
                fontFamily: '"Oswald"'
            },
            progressTextDiv: {
                y: 800,
                style: {
                    fontSize: 25,
                    fill: "#ffffff",
                    fontWeight: 800,
                    fontFamily: '"Oswald"'
                }
            }
        }
    };

    var softId = window.location.search.match(/&?softwareid=(\d+.\d+.\d+)?/);
    var showCopyRight = false;
    if (softId) {
        if (softId[1].split('-')[2].charAt(0) !== '0') {
            showCopyRight = true;
        }
    }

    function onLoadDone() {
        splashUIController.onSplashLoadDone();
        window.postMessage('splashLoaded', window.location.origin);
    }

    function init() {
        splashUIController.init({ layoutType: 'IW', predefinedData: predefinedData, showCopyRight: showCopyRight });
        splashLoadController.load(onLoadDone);
    }
    init();
    return {};
});