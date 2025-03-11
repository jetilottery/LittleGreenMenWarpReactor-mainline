define([
        'com/pixijs/pixi',
        'skbJet/component/gameMsgBus/GameMsgBus',
        'skbJet/component/SKBeInstant/SKBeInstant',
        'skbJet/component/gladPixiRenderer/gladPixiRenderer',
        'skbJet/component/pixiResourceLoader/pixiResourceLoader',
        'skbJet/component/howlerAudioPlayer/HowlerAudioSubLoader',
        'skbJet/component/resourceLoader/ResourceLoader',
        'skbJet/component/resourceLoader/resourceLib',
        'skbJet/componentCRDC/splash/splashLoadController',
        'skbJet/componentManchester/webfontLoader/FontSubLoader',
        'game/configController',
        'skbJet/componentManchester/spineLoader/SpineSubLoader'
        //'game/spineSubLoader'
    ], function(PIXI, msgBus, SKBeInstant, gr, pixiResourceLoader, HowlerAudioSubLoader, ResourceLoader, resLib, splashLoadController, FontSubLoader, config, spineSubLoader){
    var gameFolder;
    var loadProgressTimer;

    function startLoadGameRes(){
        if(!SKBeInstant.isSKB()){ msgBus.publish('loadController.jLotteryEnvSplashLoadDone'); }
        pixiResourceLoader.load(gameFolder+'assetPacks/'+SKBeInstant.config.assetPack, SKBeInstant.config.locale, SKBeInstant.config.siteId);
        ResourceLoader.getDefault().addSubLoader('sounds', new HowlerAudioSubLoader({type:'sounds'}));
        ResourceLoader.getDefault().addSubLoader('fonts', new FontSubLoader());
        ResourceLoader.getDefault().addSubLoader('spine', new spineSubLoader());
        if(SKBeInstant.isSKB()){//add heart beat to avoid load asset timeout.
            ResourceLoader.getDefault().addHeartBeat(onResourceLoadProgress);
        }
    }
    
    function onStartAssetLoading(){
        gameFolder = SKBeInstant.config.urlGameFolder;
        if(!SKBeInstant.isSKB()){
            var splashLoader = new ResourceLoader(gameFolder+'assetPacks/'+SKBeInstant.config.assetPack, SKBeInstant.config.locale, SKBeInstant.config.siteId);
            splashLoadController.loadByLoader(startLoadGameRes, splashLoader);
        }else{
            startLoadGameRes();
       }
    }
        
    function onAssetsLoadedAndGameReady(){
        var gce = SKBeInstant.getGameContainerElem();
        var orientation = SKBeInstant.getGameOrientation();
        setTimeout(function(){
            gce.style.backgroundImage = 'none';
            gce.style.backgroundColor = 'black';
        }, 100);
        
        gce.innerHTML='';
        
        var gladData;
        if(orientation === "landscape"){
            gladData = window._gladLandscape;
        }else{
            gladData = window._gladPortrait;
        }
        if(window.navigator.userAgent.indexOf('SM-G960') > -1){
            gr.init(gladData, SKBeInstant.getGameContainerElem(),'2d');
        }else{
            gr.init(gladData, SKBeInstant.getGameContainerElem());
        }
        gr.showScene('_GameScene');
        msgBus.publish('jLotteryGame.assetsLoadedAndGameReady');
    }
    
    function onResourceLoadProgress(data){
        msgBus.publish('jLotteryGame.updateLoadingProgress', {items:(data.total), current:data.current});
        
        if(data.complete){
            if (loadProgressTimer) {
                clearTimeout(loadProgressTimer);
                loadProgressTimer = null;
            }
            msgBus.publish('resourceLoaded');  //send the event to enable pop dialog
            if(!SKBeInstant.isSKB()){
                setTimeout(onAssetsLoadedAndGameReady,500);
            }else{
                onAssetsLoadedAndGameReady();           
            }
        }
    }

    msgBus.subscribe('jLottery.startAssetLoading', onStartAssetLoading);
    msgBus.subscribe('resourceLoader.loadProgress', function(data){
            if (loadProgressTimer) {
                clearTimeout(loadProgressTimer);
                loadProgressTimer = null;
            }
            loadProgressTimer = setTimeout(function () {                
                if (SKBeInstant.isSKB()) {
                    ResourceLoader.getDefault().removeHeartBeat();
                }
            }, 35000); //If skb didn't receive message in 30s, it will throw error.
        onResourceLoadProgress(data);
    });
    return {};
});
