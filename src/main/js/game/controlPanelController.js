/*
 * @Description:
 * @Author:	Geordi Guo 
 * @Email:	Geordi.Guo@igt.com
 * @Date:	2019-06-17 14:51:57
 * @Last Modified by:	Geordi Guo
 * @Last Modified time:	2020-05-13 15:41:18
 */
define(function module(require) {
    'use strict';
    //var PIXI 		= require('com/pixijs/pixi');
    const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
    const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const GladButton = require('game/component/gladButton');
    const loader = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const config = require('game/configController');
    const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
    const gameUtils = require('game/utils/gameUtils');
    const SKBeInstant = require('skbJet/component/SKBeInstant/SKBeInstant');
    const CallbackFunc = require('game/component/callbackFunc');
    const LittleGreenMenGameEvent = require('game/events/littleGreenMenGameEvent');

    function ControlPanel() {
        //home, info and payTable		
        this.homeBtn = null;
        this.infoBtn = null;
        //Buy section
        this.exitBtn = null;
        this.clearBtn = null;
        this.quickPickBtn = null;
        this.playBtn = null;
        this.playAgainBtn = null;
        this.buyBtn = null;
        this.buyButtonText = null;
        this.playButtonText = null;
        this.showPlayAgainTimer = null;
        this.playAgainText = null;
        this.exitButtonText = null;
        //try section
        this.MTMBtn = null;
        this.MTMButtonText = null;
        this.MTMPlayAgainBtn = null;
        this.MTMPlayAgainText = null;
        this.tryBtn = null;
        this.tryButtonText = null;
        //net work
        this.netWork = null;
        //the current price of the ticket.
        this.currentStake = 0;
        //boolean variable flag of Move to Money reinitialed.
        this.isMTMReinitial = false;
        //boolean variable flag of is the current game in Replay mode.
        this.isReplay = false;
        this.bln_gameStarted = false;
        this.bln_playResponseReceived = false;
        this.bln_playAgainIsOn = false;
        this.bln_tutorialIsOn = false;
        this.numGameRoundCounter = 0;
        this.bln_terminateGameNow = false;
        this.addListeners();
        //window.gr = gr;
    }

    ControlPanel.prototype.init = function() {
        this.setupButtons();
        this.initButtons();
        this.initButtonLabel();
    };
    ControlPanel.prototype.isGameStarted = function() {
        return this.bln_gameStarted;
    };
    ControlPanel.prototype.isPlayResponseReceived = function() {
        return this.bln_playResponseReceived;
    };
    ControlPanel.prototype.initButtonLabel = function() {
        this.buyButtonText = gr.lib._buyText;
        this.playButtonText = gr.lib._playText;
        this.playAgainText = gr.lib._playAgainText;
        this.tryButtonText = gr.lib._tryText;
        this.MTMButtonText = gr.lib._MTMText;
        this.MTMPlayAgainText = gr.lib._playAgainMTMText;
        this.exitButtonText = gr.lib._exitText;


        if (config.style.button_label) {
            gameUtils.setTextStyle(this.buyButtonText, config.style.button_label);
            gameUtils.setTextStyle(this.tryButtonText, config.style.button_label);
            gameUtils.setTextStyle(this.MTMButtonText, config.style.button_label);
            gameUtils.setTextStyle(this.playButtonText, config.style.button_label);
            gameUtils.setTextStyle(this.playAgainText, config.style.button_label);
            gameUtils.setTextStyle(this.MTMPlayAgainText, config.style.button_label);
            gameUtils.setTextStyle(this.exitButtonText, config.style.button_label);
        }
        if (config.textAutoFit.exitText) {
            this.exitButtonText.autoFontFitText = config.textAutoFit.exitText.isAutoFit;
        }
        if (config.textAutoFit.buyText) {
            this.buyButtonText.autoFontFitText = config.textAutoFit.buyText.isAutoFit;
        }
        if (config.textAutoFit.playText) {
            this.playButtonText.autoFontFitText = config.textAutoFit.playText.isAutoFit;
        }
        if (config.textAutoFit.tryText) {
            this.tryButtonText.autoFontFitText = config.textAutoFit.tryText.isAutoFit;
        }
        if (config.textAutoFit.playAgainMTMText) {
            this.MTMPlayAgainText.autoFontFitText = config.textAutoFit.playAgainMTMText;
        }
        if (config.textAutoFit.playAgainText) {
            this.playAgainText.autoFontFitText = config.textAutoFit.playAgainText;
        }
        if (config.textAutoFit.MTMText) {
            this.MTMButtonText.autoFontFitText = config.textAutoFit.MTMText.isAutoFit;
        }
        /*		window.gu = gameUtils;
        		window.gr = gr;
        		window.cp = this;*/
        this.playButtonText.setText(loader.i18n.Game.button_play);
        this.buyButtonText.setText(loader.i18n.Game.button_buy);
        this.playAgainText.setText(loader.i18n.Game.button_playAgain);
        this.MTMPlayAgainText.setText(loader.i18n.Game.button_MTMPlayAgain);
        this.MTMButtonText.setText(loader.i18n.Game.button_move2moneyGame);
        this.tryButtonText.setText(loader.i18n.Game.button_try);
        this.exitButtonText.setText(loader.i18n.Game.button_exit);

        gameUtils.keepSameSizeWithMTMText(this.exitButtonText, gr);
        gameUtils.keepSameSizeWithMTMText(this.tryButtonText, gr);
        gameUtils.keepSameSizeWithMTMText(this.playButtonText, gr);
        gameUtils.keepSameSizeWithMTMText(this.buyButtonText, gr);
        gameUtils.keepSameSizeWithMTMText(this.playAgainText, gr);
        gameUtils.keepSameSizeWithMTMText(this.MTMPlayAgainText, gr);
        gameUtils.keepSameSizeWithMTMText(this.MTMButtonText, gr);
    };
    ControlPanel.prototype.isPortrait = function() {
        return gr.getSize().height > gr.getSize().width;
    };
    ControlPanel.prototype.initButtons = function() {
        this.hideNetworkActivity();
        this.hideAllButton();
    };
    ControlPanel.prototype.setupButtons = function() {
        const scaleType = { 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true };
        this.homeBtn = new GladButton(gr.lib._buttonHome, "homeButton", scaleType);
        this.infoBtn = new GladButton(gr.lib._buttonInfo, "tutorialButton", scaleType);
        //Buy section	
        this.exitBtn = new GladButton(gr.lib._buttonExit, "mainButton", scaleType);
        this.playAgainBtn = new GladButton(gr.lib._buttonPlayAgain, "mainButton", scaleType);
        //this.autoPlayBtn 		= new GladButton(gr.lib._buttonAutoPlay, 	"mainButton", 	scaleType );
        //this.autoPlayBtn.show(false);
        this.buyBtn = new GladButton(gr.lib._buttonBuy, "mainButton", scaleType);
        this.playBtn = new GladButton(gr.lib._buttonPlay, "mainButton", scaleType);
        //try section
        this.MTMBtn = new GladButton(gr.lib._buttonMTM, "mainButton", scaleType);
        this.MTMPlayAgainBtn = new GladButton(gr.lib._buttonPlayAgainMTM, "mainButton", scaleType);
        this.tryBtn = new GladButton(gr.lib._buttonTry, "mainButton", scaleType);
        this.homeBtn.onClick = new CallbackFunc(this, this.homeBtnOnClick);
        this.infoBtn.onClick = new CallbackFunc(this, this.infoBtnOnClick);
        this.exitBtn.onClick = new CallbackFunc(this, this.exitBtnOnClick);
        this.playBtn.onClick = new CallbackFunc(this, this.playBtnOnClick);
        this.playAgainBtn.onClick = new CallbackFunc(this, this.playAgainBtnOnClick);
        //this.autoPlayBtn.onClick = new CallbackFunc(this, this.autoPlayBtnOnClick);
        this.buyBtn.onClick = new CallbackFunc(this, this.buyBtnOnClick);
        this.MTMBtn.onClick = new CallbackFunc(this, this.MTMBtnOnClick);
        this.MTMPlayAgainBtn.onClick = new CallbackFunc(this, this.MTMPlayAgainBtnOnClick);
        this.tryBtn.onClick = new CallbackFunc(this, this.tryBtnOnClick);

        this.network = gr.lib._network;
    };
    ControlPanel.prototype.addListeners = function() {
        msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
        msgBus.subscribe('tutorialIsShown', new CallbackFunc(this, this.onTutorialIsShown));
        msgBus.subscribe('tutorialIsHide', new CallbackFunc(this, this.onTutorialIsHide));
        msgBus.subscribe('ticketCostChanged', new CallbackFunc(this, this.onTicketCostChanged));
        msgBus.subscribe('jLottery.initialize', new CallbackFunc(this, this.onInitialize));
        msgBus.subscribe('jLottery.reInitialize', new CallbackFunc(this, this.onReInitialize));
        msgBus.subscribe('jLottery.startUserInteraction', new CallbackFunc(this, this.onStartUserInteraction));
        msgBus.subscribe('jLottery.reStartUserInteraction', new CallbackFunc(this, this.onReStartUserInteraction));
        msgBus.subscribe('jLotteryGame.ticketResultHasBeenSeen', new CallbackFunc(this, this.showNetworkActivity));
        msgBus.subscribe('jLottery.enterResultScreenState', new CallbackFunc(this, this.hideNetworkActivity));
        msgBus.subscribe('jLottery.beginNewGame', new CallbackFunc(this, this.onGameEnd));
        msgBus.subscribe('jLotterySKB.reset', new CallbackFunc(this, this.onGameResumeFromError));
        msgBus.subscribe('winboxError', new CallbackFunc(this, this.onWinBoxError));
        msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.AUDIODIALOG_CLOSED, new CallbackFunc(this, this.onAudioDialogClosedHandler));
    };
    ControlPanel.prototype.onInitialize = function() {
        if (this.isGameOneTimeOnly()) {
            return;
        }
        this.showAllButton();
    };
    ControlPanel.prototype.onReInitialize = function() {
        this.hideNetworkActivity();
        if (this.showPlayAgainTimer) {
            gr.getTimer().clearTimeout(this.showPlayAgainTimer);
            this.showPlayAgainTimer = null;
        }
        this.isReplay = false;
        this.onInitialize();
    };
    ControlPanel.prototype.onWinBoxError = function(err_evt) {
        if (err_evt.errorCode === '29000') {
            this.bln_terminateGameNow = true;
            this.hideAllButton();
            this.hideNetworkActivity();
        }
    };
    ControlPanel.prototype.isEveryThingOkay = function() {
        return this.bln_terminateGameNow === false;
    };
    ControlPanel.prototype.onGameResumeFromError = function() {
        this.hideNetworkActivity();
        this.showAllButton();
    };
    ControlPanel.prototype.isShowTutorialAtBeginning = function() {
        /*
        if(SKBeInstant.config.customBehavior){
        	if(typeof SKBeInstant.config.customBehavior.showTutorialAtBeginning === "undefined"){
        		if(loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false){
        			return false;
        		}
        		else{
        			return true;
        		}
        	}
        	else{
        		if(SKBeInstant.config.customBehavior.showTutorialAtBeginning === false){
        			return false;
        		}
        		else{
        			return true;
        		}
        	}
        }
        else{
        	if(loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false){
        		return false;
        	}
        	else{
        		return true;
        	}
        }*/
        let defaultValue = true;
        if (SKBeInstant.config.customBehavior) {
            if (SKBeInstant.config.customBehavior.showTutorialAtBeginning === false) {
                defaultValue = false;
            }
        } else {
            if (loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false) {
                defaultValue = false;
            }
        }
        return defaultValue;
    };
    ControlPanel.prototype.isAudioDialogEnabled = function() {

        /*if(SKBeInstant.config.customBehavior){
        	if(typeof SKBeInstant.config.customBehavior.showTutorialAtBeginning === "undefined"){
        		if(loader.i18n.gameConfig && loader.i18n.gameConfig.enableAudioDialog === false){
        			return false;
        		}
        		else{
        			return true;
        		}
        	}
        	else{
        		if(SKBeInstant.config.customBehavior.enableAudioDialog === false){
        			return false;
        		}
        		else{
        			return true;
        		}
        	}
        }
        else{
        	if(loader.i18n.gameConfig && loader.i18n.gameConfig.enableAudioDialog === false){
        		return false;
        	}
        	else{
        		return true;
        	}
        }*/
        let defaultValue = true;
        if (SKBeInstant.config.customBehavior) {
            if (SKBeInstant.config.customBehavior.enableAudioDialog === false) {
                defaultValue = false;
            }
        } else {
            if (loader.i18n.gameConfig && loader.i18n.gameConfig.enableAudioDialog === false) {
                defaultValue = false;
            }
        }
        return defaultValue;
    };
    ControlPanel.prototype.startGame = function() {
        if (this.isSKBInGIP()) {
            //GIP mode, game wont start if tutorial is on, or the audioDialog is displayed.
            if (this.isShowTutorialAtBeginning() === true) {
                if (this.bln_tutorialIsOn === false) {
                    //this.playBtnOnClick();
                    this.showPlayButton();
                }
            } else {
                if (this.isAudioDialogEnabled() === false) {
                    //this.playBtnOnClick();
                    this.showPlayButton();
                }
            }
        } else {
            //fresh game, start the game automatically after buy button is pressed.
            this.playBtnOnClick();
        }
    };
    ControlPanel.prototype.onAudioDialogClosedHandler = function() {
        //if(SKBeInstant.config.screenEnvironment === 'device' && this.isShowTutorialAtBeginning() === false && this.isSKBInGIP()){
        if (this.isShowTutorialAtBeginning() === false && this.isSKBInGIP()) {
            if (this.bln_tutorialIsOn === false) {
                //this.playBtnOnClick();
                this.showPlayButton();
            }
        }
    };
    ControlPanel.prototype.onStartUserInteraction = function(evt) {
        this.hideNetworkActivity();
        this.currentStake = parseInt(evt.price);
        this.isReplay = true;
        this.bln_playResponseReceived = true;
        const _this = this;
        gr.getTimer().setTimeout(function() {
            _this.startGame();
        }, config.timers.basegame_gamePlayDelayAfterBuy);
    };

    ControlPanel.prototype.onReStartUserInteraction = function(evt) {
        this.onStartUserInteraction(evt);
    };
    ControlPanel.prototype.onTicketCostChanged = function(evt) {
        this.currentStake = parseInt(evt);
    };

    ControlPanel.prototype.homeBtnOnClick = function() {
        this.playSoundByConfig("ButtonPress");
        this.exit();
    };
    ControlPanel.prototype.exitBtnOnClick = function() {
        this.playSoundByConfig("ButtonPress");
        this.exit();
    };

    ControlPanel.prototype.exit = function() {
        const isWLA = SKBeInstant.isWLA() ? true : false;
        console.log(isWLA);
        msgBus.publish('jLotteryGame.playerWantsToExit');
    };
    ControlPanel.prototype.infoBtnOnClick = function() {
        this.hideAllButton();
        this.playSoundByConfig("ButtonPress");
        msgBus.publish(LittleGreenMenGameEvent.eventIDs.TUTORIAL_SHOW);
    };
    ControlPanel.prototype.onTutorialIsShown = function() {
        this.bln_tutorialIsOn = true;
        this.hideAllButton();
    };
    ControlPanel.prototype.onTutorialIsHide = function() {
        this.bln_tutorialIsOn = false;
        if (this.isPlayResponseReceived()) {
            //the behavior of GIP in this game is that, previous game resume until tutorial is closed
            if (this.isSKBInGIP()) {
                //this.playBtnOnClick();
                this.showPlayButton();
            } else {
                this.onGameEnd();
            }
        } else {
            if (this.bln_playAgainIsOn) {
                //play again button is not clicked.
                this.showPlayAgainButton();
            } else {
                //buy button is not clicked;
                this.showAllButton();
            }
        }
    };
    ControlPanel.prototype.showPlayButton = function() {
        if (this.isEveryThingOkay()) {
            this.playBtn.show(true);
            this.infoBtn.show(true);
            this.homeBtn.show(this.isHomeButtonAllowed());
        }
    };
    /*
    aim to determine the MTMBtn is allowed or not, also handle the situation when demosB4Move2MoneyButton is set to a positive number.
    */
    ControlPanel.prototype.isNoMTMBtnMode = function() {
        if ((SKBeInstant.config.wagerType === 'BUY') || (this.isGameOneTimeOnly()) || (Number(SKBeInstant.config.demosB4Move2MoneyButton) === -1 /*-1: never. Move-To-Money-Button will never appear.*/ )) {
            return true;
        } else {
            if (this.numGameRoundCounter >= Number(SKBeInstant.config.demosB4Move2MoneyButton)) {
                return false;
            } else {
                return true;
            }
        }
    };
    ControlPanel.prototype.isBuyMode = function() {
        return SKBeInstant.config.wagerType === 'BUY';
    };

    ControlPanel.prototype.buyBtnOnClick = function() {
        msgBus.publish('disableUI');
        this.playSoundByConfig('ButtonPress');
        this.hideAllButton();
        this.showNetworkActivity();

        this.beforeSendPlayRequest();
    };
    ControlPanel.prototype.onGameEnd = function() {
        if (this.isEveryThingOkay()) {
            if (this.isGameOneTimeOnly() === false) {
                this.showPlayAgainButton();
            } else {
                this.infoBtn.show(true);
                this.exitBtn.show(true);
            }
        }
    };
    ControlPanel.prototype.showPlayAgainButton = function() {
        this.bln_gameStarted = false;
        this.bln_playResponseReceived = false;
        this.bln_playAgainIsOn = true;
        if (this.isEveryThingOkay()) {
            if (this.isBuyMode()) {
                //buy mode
                this.playAgainBtn.show(true);
            } else {
                //try mode
                if (this.isNoMTMBtnMode() === false) {
                    this.MTMBtn.show(true);
                    this.MTMPlayAgainBtn.sprite.updateCurrentStyle({ _left: this.MTMPlayAgainBtn.sprite.data._style._left });
                } else {
                    //center the MTMPlayAgainBtn by apply this.playAgainBtn's position _left;
                    this.MTMPlayAgainBtn.sprite.updateCurrentStyle({ _left: this.playAgainBtn.sprite.data._style._left });
                }
                this.MTMPlayAgainBtn.show(true);
            }
            this.homeBtn.show(this.isHomeButtonAllowed());
            this.buyBtn.show(false);
            this.tryBtn.show(false);
            this.infoBtn.show(true);
        }
    };
    ControlPanel.prototype.beforeSendPlayRequest = function() {
        if (this.isReplay) {
            msgBus.publish('jLotteryGame.playerWantsToRePlay', { price: this.currentStake });
        } else {
            msgBus.publish('jLotteryGame.playerWantsToPlay', { price: this.currentStake });
        }
    };
    ControlPanel.prototype.playBtnOnClick = function() {
        this.numGameRoundCounter++;
        this.bln_gameStarted = true;
        this.hideAllButton();
        this.playSoundByConfig("ButtonBuy");
        this.playSoundByConfig('baseGameLoop', true);
        msgBus.publish('paytableHelpController.disableConsole');
        msgBus.publish('startReveallAll');
    };
    ControlPanel.prototype.playSoundByConfig = function(soundName, isloop = false) {
        if (config.audio && config.audio[soundName]) {
            const channel = config.audio[soundName].channel;
            config.audio[soundName].currentIndex = 0;
            if (Array.isArray(channel)) {
                audio.play(config.audio[soundName].name, channel[config.audio[soundName].currentIndex++ % channel.length]);
            } else {
                audio.play(config.audio[soundName].name, channel, isloop);
            }
        }
    };
    ControlPanel.prototype.playAgainBtnOnClick = function(needToShowButton = true) {
        this.bln_playAgainIsOn = false;
        this.hideAllButton();
        this.playSoundByConfig("ButtonPress");
        msgBus.publish('playerWantsPlayAgain');
        /*
        Reason to add needToShowButton = true in the argument is to solve 
        LGMWR-121:LGMWR_WLA/COM:play again button is displayed after move to money
        */
        if (needToShowButton) {
            this.showAllButton();
        }
    };
    ControlPanel.prototype.autoPlayBtnOnClick = function() {};
    ControlPanel.prototype.MTMBtnOnClick = function() {


        //disable UI and console
        msgBus.publish('disableUI');
        msgBus.publish('paytableHelpController.disableConsole');
        //----------------------------------------------------------

        SKBeInstant.config.wagerType = 'BUY';
        this.hideAllButton();
        if (this.isShowTutorialAtBeginning() === false) {
            /*
            Reason to add this contion is to solve the ticket LGMWR-119:LGMWR_COM:"How to play" page don't pop up immediately after clicked "Move to money" button..
            please check in build 320, after MTM button click , it will make a request to the server, until the response came back it won't trigger to show How to play panel.
            for some reason, WLA response quicker than COM, therefore the issue not reproduced under WLA. 
            fixed by hide all the UI buttons(mainly just the buy button) and ticket cost if show how to play panel at the beginning setting is true, 
            otherwise show the buy button and ticket cost straight away.
            */
            this.playAgainBtnOnClick();
        } else {
            /*
            calling with needToShowButton set to false, is in order to solve 
            LGMWR-121:LGMWR_WLA/COM:play again button is displayed after move to money
            */
            this.playAgainBtnOnClick(false);
        }
        msgBus.publish('jLotteryGame.playerWantsToMoveToMoneyGame');
    };
    ControlPanel.prototype.MTMPlayAgainBtnOnClick = function() {
        this.playAgainBtnOnClick();
    };
    ControlPanel.prototype.tryBtnOnClick = function() {
        this.buyBtnOnClick();
    };
    ControlPanel.prototype.showNetworkActivity = function() {
        if (this.isEveryThingOkay()) {
            this.network.show(true);
            this.network.gotoAndPlay('network', 0.3, true);
        }
    };
    ControlPanel.prototype.hideNetworkActivity = function() {
        this.network.stopPlay();
        this.network.show(false);
    };
    ControlPanel.prototype.showAllButton = function() {
        if (this.isSKBInGIP() === false && this.isGameStarted() === false && this.bln_tutorialIsOn == false && this.isEveryThingOkay()) {
            if (this.isBuyMode()) {
                this.buyBtn.show(true);
                this.tryBtn.show(false);
                this.MTMBtn.show(false);
            } else {
                this.tryBtn.show(true);
                this.buyBtn.show(false);
                if (this.isNoMTMBtnMode() === false) {
                    this.MTMBtn.show(true);
                    this.tryBtn.sprite.updateCurrentStyle({ "_left": this.tryBtn.sprite.data._style._left });
                } else {
                    // center the try button by apply buy button's position _left;
                    this.tryBtn.sprite.updateCurrentStyle({ "_left": this.buyBtn.sprite.data._style._left });
                }
            }
            this.infoBtn.show(true);
            this.homeBtn.show(this.isHomeButtonAllowed());
        }
    };
    ControlPanel.prototype.hideAllButton = function() {
        this.homeBtn.show(false);
        this.infoBtn.show(false);

        this.buyBtn.show(false);
        //this.autoPlayBtn.show(false);
        this.playAgainBtn.show(false);
        this.exitBtn.show(false);
        this.playBtn.show(false);

        //try section
        this.tryBtn.show(false);
        this.MTMBtn.show(false);
        this.MTMPlayAgainBtn.show(false);
    };
    ControlPanel.prototype.isGameOneTimeOnly = function() {
        return Number(SKBeInstant.config.jLotteryPhase) === 1;
    };
    ControlPanel.prototype.isHomeButtonAllowed = function() {
        let isHomeAllowed = false;
        if (SKBeInstant.isSKB()) {
            isHomeAllowed = false;
        } else {
            if (SKBeInstant.isWLA()) {
                if (this.isGameOneTimeOnly() === false && this.isSKBInGIP() === false) {
                    isHomeAllowed = true;
                }
            }
        }
        return isHomeAllowed;
    };
    /*
    	SKBeInstant.config.gameType won't change to normal when previous game is ended, 
    	it is still set as 'ticketReady' even the new game started.
    	Therefore, added this.numGameRoundCounter === 0 which only check SKBeInstant.config.gameType on the very first game.
    */
    ControlPanel.prototype.isSKBInGIP = function() {
        return SKBeInstant.config.gameType === 'ticketReady' && this.numGameRoundCounter === 0;
    };
    return ControlPanel;
});