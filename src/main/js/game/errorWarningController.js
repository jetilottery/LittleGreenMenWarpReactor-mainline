/*global requirejs*/
/*eslint no-undef: "error"*/
define(function module(require){
    const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
    const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
    const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const loader = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const SKBeInstant = require('skbJet/component/SKBeInstant/SKBeInstant');
    const gameUtils = require('game/utils/gameUtils');
    const config = require('game/configController');
    const gladButton = require('game/component/gladButton');
    const CallbackFunc = require('game/component/callbackFunc');

    function ErrorWarningController(){
        this.scaleType = 'null';
        this.continueButton = null;
        this.warningExitButton = null;
        this.errorExitButton = null;
        this.winBoxErrorButton = null;
        this.tutorialVisible = false;
        this.resultPlaque = null;
        this.showWarn = null;
        this.warnMessage = null;
        this.inGame = null;
        this.gameError = false;
        this.hasWin = null;
        this.addListeners();
    }
    ErrorWarningController.prototype.addListeners = function (){
        msgBus.subscribe('jLottery.enterResultScreenState', new CallbackFunc(this, this.onEnterResultScreenState));
        msgBus.subscribe('jLottery.reStartUserInteraction', new CallbackFunc(this, this.onReStartUserInteraction));
        msgBus.subscribe('jLottery.startUserInteraction', new CallbackFunc(this, this.onStartUserInteraction));
        msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.onGameParametersUpdated));
        msgBus.subscribe('jLottery.error', new CallbackFunc(this, this.onError));
        msgBus.subscribe('winboxError', new CallbackFunc(this, this.onError));
        msgBus.subscribe('jLottery.reInitialize', new CallbackFunc(this, this.reInitializeHandler));
        msgBus.subscribe('buyOrTryHaveClicked', new CallbackFunc(this, this.buyOrTryHaveClickedHandler));
        msgBus.subscribe('jLottery.playingSessionTimeoutWarning', new CallbackFunc(this, this.playingSessionTimeoutWarningHandler));
    };
    ErrorWarningController.prototype.reInitializeHandler = function (){
        this.inGame = false;
    };
    ErrorWarningController.prototype.buyOrTryHaveClickedHandler = function (){
        this.inGame = true;
    };
    ErrorWarningController.prototype.playingSessionTimeoutWarningHandler = function (warning){
        if(SKBeInstant.config.jLotteryPhase === 1 || this.gameError){
            return;
        }
    
        if (this.inGame) {
            this.warnMessage = warning;
            this.showWarn = true;
        } else {
            this.onWarn(warning);
        }
    };
 
    ErrorWarningController.prototype.onGameParametersUpdated = function() {
        this.scaleType = { 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true };
        this.continueButton = new gladButton(gr.lib._warningContinueButton, config.gladButtonImgName.warningContinueButton, this.scaleType);
        this.warningExitButton = new gladButton(gr.lib._warningExitButton, config.gladButtonImgName.warningExitButton, this.scaleType);
        this.errorExitButton = new gladButton(gr.lib._errorExitButton, config.gladButtonImgName.errorExitButton, this.scaleType);		
		this.winBoxErrorButton = new gladButton(gr.lib._winBoxErrorExitButton, config.gladButtonImgName.warningExitButton, this.scaleType);

        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(false);
        }
        
        if(gr.lib._winBoxError){
            gr.lib._winBoxError.show(false);
        }
        
        if (config.style.warningExitText) {
            gameUtils.setTextStyle(gr.lib._warningExitText, config.style.warningExitText);
        }
        if (config.textAutoFit.warningExitText) {
            gr.lib._warningExitText.autoFontFitText = config.textAutoFit.warningExitText.isAutoFit;
        }

        gr.lib._warningExitText.setText(loader.i18n.Game.warning_button_exitGame);


        if (config.style.warningContinueText) {
            gameUtils.setTextStyle(gr.lib._warningContinueText, config.style.warningContinueText);
        }
        if (config.textAutoFit.warningContinueText) {
            gr.lib._warningContinueText.autoFontFitText = config.textAutoFit.warningContinueText.isAutoFit;
        }
        gr.lib._warningContinueText.setText(loader.i18n.Game.warning_button_continue);


        if (config.style.warningText) {
            gameUtils.setTextStyle(gr.lib._warningText, config.style.warningText);
        }
        if (config.textAutoFit.warningText) {
            gr.lib._warningText.autoFontFitText = config.textAutoFit.warningText.isAutoFit;
        }

        if (config.dropShadow) {
            gameUtils.setTextStyle(gr.lib._warningContinueText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
            gameUtils.setTextStyle(gr.lib._warningExitText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
        }
        if (config.style.errorExitText) {
            gameUtils.setTextStyle(gr.lib._errorExitText, config.style.errorExitText);
        }
        if (config.textAutoFit.errorExitText) {
            gr.lib._errorExitText.autoFontFitText = config.textAutoFit.errorExitText.isAutoFit;
        }
        gr.lib._errorExitText.setText(loader.i18n.Game.error_button_exit);
        gr.lib._errorTitle.show(true);

        if (config.style.errorTitle) {
            gameUtils.setTextStyle(gr.lib._errorTitle, config.style.errorTitles);
        }
        if (config.textAutoFit.errorTitle) {
            gr.lib._errorTitle.autoFontFitText = config.textAutoFit.errorTitle.isAutoFit;
        }
        gr.lib._errorTitle.setText(loader.i18n.Game.error_title);

        if (config.style.errorText) {
            gameUtils.setTextStyle(gr.lib._errorText, config.style.errorText);
        }
        if (config.textAutoFit.errorText) {
            gr.lib._errorText.autoFontFitText = config.textAutoFit.errorText.isAutoFit;
        }

        if (config.dropShadow) {
            gameUtils.setTextStyle(gr.lib._errorExitText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
        }
        this.errorExitButton.onClick = new CallbackFunc(this, this.errorExitBtnOnClick);
        this.continueButton.onClick = new CallbackFunc(this, this.closeErrorWarn);
        this.warningExitButton.onClick = new CallbackFunc(this, this.warningExitBtnOnClick);
		// Add win Box feature for fixing bug of GalleonFortune
		// 08 July 2019
		gr.lib._winBoxErrorText.setText(loader.i18n.Error.error29000);
		gr.lib._winBoxErrorExitText.setText(loader.i18n.Game.error_button_exit);    
		this.winBoxErrorButton.onClick = new CallbackFunc(this, this.winBoxErrorBtnOnClick);
    };
    ErrorWarningController.prototype.winBoxErrorBtnOnClick = function (){
        msgBus.publish('jLotteryGame.playerWantsToExit');
        if (config.audio && config.audio.ButtonGeneric) {
            audio.play(config.audio.ButtonGeneric.name, config.audio.ButtonGeneric.channel);
        }
    };
    ErrorWarningController.prototype.warningExitBtnOnClick = function (){
        msgBus.publish('jLotteryGame.playerWantsToExit');
        if (config.audio && config.audio.ButtonGeneric) {
            audio.play(config.audio.ButtonGeneric.name, config.audio.ButtonGeneric.channel);
        }
    };
    ErrorWarningController.prototype.errorExitBtnOnClick = function(){
        msgBus.publish('jLotteryGame.playerWantsToExit');
        if (config.audio && config.audio.ButtonGeneric) {
            audio.play(config.audio.ButtonGeneric.name, config.audio.ButtonGeneric.channel);
        }
    };
    ErrorWarningController.prototype.onWarn = function(warning) {
        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(true);
        }
        
        gr.lib._buttonInfo.show(false);
        gr.lib._BG_dim.show(true);      
        if (gr.lib._tutorial.pixiContainer.visible) {
            gr.lib._tutorial.show(false);
            this.tutorialVisible = true;
        }
        
        this.resultPlaque = this.hasWin ? gr.lib._winPlaque: gr.lib._nonWinPlaque;
        
		if(this.resultPlaque.pixiContainer.visible){
			this.resultPlaque.show(false);
		}else{
			this.resultPlaque = null;
		}
        
        msgBus.publish('tutorialIsShown');
        gr.lib._errorText.show(false);
        gr.lib._warningText.show(true);
        gr.lib._warningText.setText(warning.warningMessage);
        gr.lib._warningExitButton.show(true);
        gr.lib._warningContinueButton.show(true);
        gr.lib._errorExitButton.show(false);

        gr.lib._errorTitle.show(false);
    };
    ErrorWarningController.prototype.closeErrorWarn = function() {
        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(false);
        }
        
        if (this.tutorialVisible || this.resultPlaque) {
            if (this.tutorialVisible) {
                gr.lib._tutorial.show(true);
                this.tutorialVisible = false;
            }else{
                this.resultPlaque.show(true);
                this.resultPlaque = null;
                msgBus.publish('tutorialIsHide');
                if(!this.isShowWinPanelBG){
                    //if it is showing the small win, then turn the background dim off.
                    gr.lib._BG_dim.show(false);
                }
            }
        } else {
            gr.lib._BG_dim.show(false);
            msgBus.publish('tutorialIsHide');
        }
        if (config.audio && config.audio.ButtonGeneric) {
            audio.play(config.audio.ButtonGeneric.name, config.audio.ButtonGeneric.channel);
        }
        if(this.gameError){
            this.gameError = false;
        }
    };
    ErrorWarningController.prototype.isShowPanelBG = function (){
        let rs = true;
        /*if(SKBeInstant.config.customBehavior){
            if(typeof SKBeInstant.config.customBehavior.showResultScreen === "undefined"){
                if(loader.i18n.gameConfig){
                    if(loader.i18n.gameConfig.showResultScreen === false){
                        rs = false;
                    }
                }
            }
            else{
                if(SKBeInstant.config.customBehavior.showResultScreen === false){
                    rs = false;
                }
            }
        }
        else{
            if(loader.i18n.gameConfig){
                if(loader.i18n.gameConfig.showResultScreen === false){
                    rs = false;
                }
            }    
        }*/
        if(SKBeInstant.config.customBehavior){
            if(SKBeInstant.config.customBehavior.showResultScreen === false){
                rs = false;
            }
        }
        else{
            if(loader.i18n.gameConfig){
                if(loader.i18n.gameConfig.showResultScreen === false){
                    rs = false;
                }
            }    
        }
        return rs;
    };
    ErrorWarningController.prototype.onError = function(error) {
        this.gameError = true;
		gr.lib._network.stopPlay();
        gr.lib._network.show(false); 
        gr.lib._BG_dim.show(true);      
        if (gr.lib._tutorial.pixiContainer.visible) {
            gr.lib._tutorial.show(false);
            this.tutorialVisible = true;
        }
        //When error happend, Sound must be silenced.
        audio.stopAllChannel();
        
        if (error.errorCode === '29000') {
            if (gr.lib._winBoxError) {
                gr.lib._winBoxError.show(true);
            }
			if(SKBeInstant.isSKB()){
                gr.lib._winBoxErrorExitButton.show(false);
            }else{
                gr.lib._winBoxErrorExitButton.show(true);
            }
            gr.lib._BG_dim.updateCurrentStyle({"_opacity":1});
            gr.getTimer().setTimeout(function(){
                gr.getTicker().stop();
            }, 200);
        } else {
            if (gr.lib._warningAndError) {
                gr.lib._warningAndError.show(true);
            }
            gr.lib._errorTitle.show(true);
            gr.lib._buttonInfo.show(false);

            gr.lib._warningText.show(false);
            gr.lib._errorText.show(true);
            gr.lib._errorText.setText(error.errorCode + ": " + error.errorDescriptionSpecific + "\n" + error.errorDescriptionGeneric);
            gr.lib._warningExitButton.show(false);
            gr.lib._warningContinueButton.show(false);
            gr.lib._errorExitButton.show(true);
        }
        msgBus.publish('tutorialIsShown');
		
        //destroy if error code is 00000
        //this is a carry-over from jLottery1 where if the game is closed via the confirm prompt
        //rather than the exit button
        if (error.errorCode === '00000' || error.errorCode === '66605') {
            if (document.getElementById(SKBeInstant.config.targetDivId)) {
                document.getElementById(SKBeInstant.config.targetDivId).innerHTML = "";
                document.getElementById(SKBeInstant.config.targetDivId).style.background = '';
                document.getElementById(SKBeInstant.config.targetDivId).style.backgroundSize = '';
                document.getElementById(SKBeInstant.config.targetDivId).style.webkitUserSelect = '';
                document.getElementById(SKBeInstant.config.targetDivId).style.webkitTapHighlightColor = '';
            }
            //clear require cache
            if (window.loadedRequireArray) {
                for (var i = window.loadedRequireArray.length - 1; i >= 0; i--) {
                    requirejs.undef(window.loadedRequireArray[i]);
                }
            }            
        }		
    };
    ErrorWarningController.prototype.onEnterResultScreenState = function(){
        this.inGame = false;
        if(this.showWarn) {
            this.showWarn = false;
            const _this = this;
            gr.getTimer().setTimeout(function () {
                _this.onWarn(_this.warnMessage);
            }, (Number(SKBeInstant.config.compulsionDelayInSeconds) + 0.3) * 1000);
        }
    };
    ErrorWarningController.prototype.onStartUserInteraction = function(data){
		this.inGame = true;// gameType is ticketReady
        this.hasWin = (data.playResult === 'WIN');
    };

    ErrorWarningController.prototype.onReStartUserInteraction = function(data){
        this.onStartUserInteraction(data);
    };
    return ErrorWarningController;
});