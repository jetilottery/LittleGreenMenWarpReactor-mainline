define(function module(require) {
    const PIXI = require('com/pixijs/pixi');
    const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
    const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
    const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const loader = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const SKBeInstant = require('skbJet/component/SKBeInstant/SKBeInstant');
    const GladButton = require('game/component/gladButton');
    const gameUtils = require('game/utils/gameUtils');
    const config = require('game/configController');
    const resLib = require('skbJet/component/resourceLoader/resourceLib');
    const Particles = require('com/pixijs/pixi-particles');
    const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
    const TweenFunctions = require('game/utils/tweenFunctions');
    const CallbackFunc = require('game/component/callbackFunc');
    require('com/pixijs/pixi-spine');

    function ResultPanelController() {
        this.resultData = null;
        this.resultPlaque = null;
        this.winOkButton = null;
        this.lossOkButton = null;
        this.winningText = null;
        this.totalWinBuyText = null;
        this.totalWinTryText = null;
        this.winPanelSprite = null;
        this.lossPanelSprite = null;
        this.rainContainer = null;
        this.nowinRainContainer = null;
        this.winPanelBGSprite = null;
        this.etContainer = null;
        this.animContainer = null;
        this.et_with_panel = null;
        this.et_without_panel = null;
        this.emitter_coinRain = null;
        this.emitter_coinShower = null;
        this.emitter_star = null;
        this.sprite_coin = null;
        this.sprite_star = null;
        this.ticker = null;
        this.isRunning = false;
        this.deleted = false;
        this.sunShineSprite = null;
        this.sunShineAnim = null;
        this.countUpTween = null;
        this.autoHideTimer = null;
        this.simpleTotalWin = null;
        this.simpleBuyText = null;
        this.simpleTryText = null;
        this.bln_terminateGameNow = false;
        this.clickToHideSprite = null;
        this.addListeners();
        //window.rc = this;
    }
    ResultPanelController.prototype.addListeners = function() {
        msgBus.subscribe('jLottery.reInitialize', new CallbackFunc(this, this.onReInitialize));
        msgBus.subscribe('jLottery.reStartUserInteraction', new CallbackFunc(this, this.onReStartUserInteraction));
        msgBus.subscribe('jLottery.startUserInteraction', new CallbackFunc(this, this.onStartUserInteraction));
        msgBus.subscribe('jLottery.enterResultScreenState', new CallbackFunc(this, this.onEnterResultScreenState));
        msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.onGameParametersUpdated));
        msgBus.subscribe('playerWantsPlayAgain', new CallbackFunc(this, this.onPlayerWantsPlayAgain));
        msgBus.subscribe('tutorialIsShown', new CallbackFunc(this, this.onTutorialIsShown));
        msgBus.subscribe('tutorialIsHide', new CallbackFunc(this, this.onTutorialIsHide));
        msgBus.subscribe('winboxError', new CallbackFunc(this, this.onWinBoxError));
    };
    ResultPanelController.prototype.init = function() {
        var scaleType = { 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true };
        this.winOkButton = new GladButton(gr.lib._buttonWinClose, config.gladButtonImgName.AllPanelOKButton, scaleType);
        this.lossOkButton = new GladButton(gr.lib._buttonNonWinClose, config.gladButtonImgName.AllPanelOKButton, scaleType);
        this.winPanelSprite = gr.lib._winPlaque;
        this.lossPanelSprite = gr.lib._nonWinPlaque;
        this.bgDim = gr.lib._BG_dim;
        this.rainContainer = gr.lib._rainContainer.pixiContainer;
        this.nowinRainContainer = gr.lib._noWinRainContainer.pixiContainer;
        this.etContainer = gr.lib._winEtContainer.pixiContainer;
        this.winningText = gr.lib._bg_win_Value;
        this.totalWinBuyText = gr.lib._bg_win_Text;
        this.totalWinTryText = gr.lib._bg_win_Try_Text;
        this.simpleTotalWin = gr.lib._win_Value;
        this.simpleBuyText = gr.lib._win_Text;
        this.simpleTryText = gr.lib._win_Try_Text;
        this.winPanelBGSprite = gr.lib._panel;
        this.sunShineSprite = gr.lib._totalWinShine;
        if (this.isShowPanelBG() === false) {
            const _this = this;
            //this.clickToHideSprite = gr.lib._winTextWithoutBG;
            this.clickToHideSprite = gr.lib._totalWinShine;
            this.clickToHideSprite.on('mouseup', function() { _this.onPlayerWantsPlayAgain(); });
        }
        this.initSpine();
        this.initParticle();
    };
    ResultPanelController.prototype.initSpine = function() {
        this.updateCallback = new CallbackFunc(this, this.emitterOnUpdate);

        this.et_with_panel = new PIXI.spine.Spine(resLib.spine.LittleGreenMenWin.spineData);
        if (this.isPortrait()) {
            this.et_with_panel.state.addAnimationByName(0, 'WinAnimation', true, 0);
        } else {
            this.et_with_panel.state.addAnimationByName(0, 'Landscape_WinAnimation', true, 0);
        }
        this.et_with_panel.data = { "_name": "winET" };
        let style = (this.isPortrait()) ? config.positions.winScreenETwithBG.portrait : config.positions.winScreenETwithBG.landscape;
        this.et_with_panel.scale.x = style.scaleX;
        this.et_with_panel.scale.y = style.scaleY;
        this.et_with_panel.rotation = style.rotation;
        this.et_with_panel.x = style.x;
        this.et_with_panel.y = style.y;
        this.etContainer.addChild(this.et_with_panel);

        this.et_without_panel = new PIXI.spine.Spine(resLib.spine.spineLittleGreenMenB.spineData);
        this.et_without_panel.state.addAnimationByName(0, 'animationLittleGreenMan', true, 0);
        this.et_without_panel.data = { "_name": "winET2" };
        style = (this.isPortrait()) ? config.positions.winScreenETwithoutBG.portrait : config.positions.winScreenETwithoutBG.landscape;
        this.et_without_panel.scale.x = style.scaleX;
        this.et_without_panel.scale.y = style.scaleY;
        this.et_without_panel.rotation = style.rotation;
        this.et_without_panel.x = style.x;
        this.et_without_panel.y = style.y;
        this.etContainer.addChild(this.et_without_panel);
    };
    ResultPanelController.prototype.onWinBoxError = function(err_evt) {
        if (err_evt.errorCode === '29000') {
            this.bln_terminateGameNow = true;
            this.hideDialog();
        }
    };
    ResultPanelController.prototype.isEveryThingOkay = function() {
        return this.bln_terminateGameNow === false;
    };
    ResultPanelController.prototype.hideET = function() {
        this.et_without_panel.visible = false;
        this.et_with_panel.visible = false;
    };
    ResultPanelController.prototype.showPanelET = function() {
        this.et_with_panel.visible = true;
        this.et_without_panel.visible = false;
    };
    ResultPanelController.prototype.showNonPanelET = function() {
        this.et_with_panel.visible = false;
        this.et_without_panel.visible = true;
    };
    ResultPanelController.prototype.getSpriteSheetByName = function(spriteName) {
        return PIXI.utils.TextureCache[spriteName];
    };
    ResultPanelController.prototype.initParticle = function() {
        this.ticker = gr.getTicker();
        this.sprite_star = [this.getSpriteSheetByName('Doji')]; //,this.getSpriteSheetByName('Point')];
        //this.sprite_coin = [this.getSpriteSheetByName("coinOne_0001")];
        this.sprite_coin = [PIXI.Sprite.fromImage(PIXI.utils.TextureCache.coinOne_0001.textureCacheIds[1])];
        const mode = (this.isPortrait()) ? "portrait" : "landscape";
        this.emitter_coinRain = new Particles.Emitter(this.rainContainer, [{ //coin
                framerate: 12,
                loop: true,
                textures: ["coinOne_0002", "coinOne_0003", "coinOne_0004", "coinOne_0005", "coinOne_0006", "coinOne_0007", "coinOne_0008", "coinOne_0009"] //,"coinOne_0010","coinOne_0011"]
            }
            /*,
            			{ //ET
            				framerate:12,
            				loop:true,
            				textures:["alienToy_0001","alienToy_0002","alienToy_0003","alienToy_0004","alienToy_0005","alienToy_0006","alienToy_0007","alienToy_0008","alienToy_0009","alienToy_0010","alienToy_0011","alienToy_0012","alienToy_0013","alienToy_0014","alienToy_0015","alienToy_0016","alienToy_0017","alienToy_0018","alienToy_0019","alienToy_0020","alienToy_0021","alienToy_0022","alienToy_0023"]
            			}	*/
        ], ResultPanelController["config_coin_" + mode]);
        this.emitter_coinRain.particleConstructor = Particles.AnimatedParticle;
        this.emitter_coinRain.isRunning = false;

        this.emitter_coinShower = new Particles.Emitter(this.rainContainer, [{
                framerate: 12,
                loop: true,
                textures: ["coinOne_0002", "coinOne_0003", "coinOne_0004", "coinOne_0005", "coinOne_0006", "coinOne_0007", "coinOne_0008", "coinOne_0009"]
            }
            /*,
            			{ //ET
            				framerate:12,
            				loop:true,
            				textures:["alienToy_0001","alienToy_0002","alienToy_0003","alienToy_0004","alienToy_0005","alienToy_0006","alienToy_0007","alienToy_0008","alienToy_0009","alienToy_0010","alienToy_0011","alienToy_0012","alienToy_0013","alienToy_0014","alienToy_0015","alienToy_0016","alienToy_0017","alienToy_0018","alienToy_0019","alienToy_0020","alienToy_0021","alienToy_0022","alienToy_0023"]
            			}*/
        ], ResultPanelController["config_coinShower_" + mode]);
        this.emitter_coinShower.particleConstructor = Particles.AnimatedParticle;
        this.emitter_coinShower.isRunning = false;


        this.emitter_star = new Particles.Emitter(this.nowinRainContainer, this.sprite_star, ResultPanelController["config_star_" + mode]);
        this.emitter_star.isRunning = false;
    };
    ResultPanelController.prototype.animateSunShine = function() {
        if (!this.sunShineAnim) {
            this.sunShineAnim = new KeyFrameAnimation({
                "_name": 'sunshineKeyAnim',
                "tweenFunc": TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
                "_keyFrames": [{
                        "_time": 0,
                        "_SPRITES": []
                    },
                    {
                        "_time": config.timers.result_sunShineAnimationDuration,
                        "_SPRITES": []
                    }
                ]
            });
            this.sunShineAnim._onUpdate = new CallbackFunc(this, this.sunShineAnimOnUpdate);
            this.sunShineAnim._onLoop = new CallbackFunc(this, this.sunShineAnimOnComplete);
        }
        this.sunShineAnim.isZoomOut = true;
        this.sunShineSprite.show(true);
        this.sunShineAnim.play();
        this.sunShineAnim.setLoop(true);
    };
    ResultPanelController.prototype.stopSunShineAnimation = function() {
        if (this.sunshineKeyAnim) {
            this.sunShineAnim.stop();
        }
        this.sunShineSprite.show(false);
        this.sunShineSprite.updateCurrentStyle({ _transform: { "_scale": { "_x": 1, "_y": 1 } } });
    };
    ResultPanelController.prototype.sunShineAnimOnUpdate = function({ caller: keyFrameAnim, time: timeDelta }) {
        const tweenFunc = keyFrameAnim.animData.tweenFunc;
        const duration = keyFrameAnim.maxTime;
        timeDelta = Math.ceil(timeDelta);
        //const rotation = tweenFunc(timeDelta, 0, 360, duration);
        const scale = (this.sunShineAnim.isZoomOut) ? tweenFunc(timeDelta, 1, 0.6, duration) : tweenFunc(timeDelta, 0.6, 1, duration);
        //this.sunShineSprite.updateCurrentStyle({_transform:{"_rotate":rotation, "_scale":{"_x":scale, "_y":scale}}});
        this.sunShineSprite.updateCurrentStyle({ _transform: { "_scale": { "_x": scale, "_y": scale } } });
    };
    ResultPanelController.prototype.sunShineAnimOnComplete = function() {
        this.sunShineAnim.isZoomOut = !this.sunShineAnim.isZoomOut;
        //this.sunShineAnim.play();
    };
    ResultPanelController.prototype.startCoinRain = function() {
        /*const payoutMultiplier = parseInt(this.resultData.prizeValue / this.resultData.price);
        if(payoutMultiplier < 1){
        	// pay for a loss
        	this.emitter_coinRain.frequency = 2;	
        }
        else if(payoutMultiplier < 5 && payoutMultiplier >= 1){
        	// pay for a small win
        	this.emitter_coinRain.frequency = 0.8;
        }
        else if(payoutMultiplier < 10 && payoutMultiplier >= 5){
        	// pay for a big win
        	this.emitter_coinRain.frequency = 0.3;
        }
        else if(payoutMultiplier >= 10){
        	// pay for a super win
        	this.emitter_coinRain.frequency = 0.1;
        }*/
        this.emitter_coinRain.frequency = 0.3;
        this.emitter_coinRain.isRunning = true;
        this.ticker.add(this.updateCallback);
    };
    ResultPanelController.prototype.stopCoinRain = function() {
        if (this.emitter_coinRain.isRunning) {
            this.emitter_coinRain.isRunning = false;
            this.emitter_coinRain.cleanup(); //Kills all active particles immediately. wait for next callin
            this.ticker.remove(this.updateCallback);
        }
    };
    ResultPanelController.prototype.startCoinShower = function() {
        this.emitter_coinShower.frequency = 0.8;
        this.emitter_coinShower.isRunning = true;
        this.ticker.add(this.updateCallback);
    };
    ResultPanelController.prototype.stopCoinShower = function() {
        if (this.emitter_coinShower.isRunning) {
            this.emitter_coinShower.isRunning = false;
            this.emitter_coinShower.cleanup();
            this.ticker.remove(this.updateCallback);
        }
    };
    ResultPanelController.prototype.startStarRain = function() {
        this.emitter_star.isRunning = true;
        this.ticker.add(this.updateCallback);
    };
    ResultPanelController.prototype.stopStarRain = function() {
        if (this.emitter_star.isRunning) {
            this.emitter_star.isRunning = false;
            this.emitter_star.cleanup(); //Kills all active particles immediately. wait for next callin
            this.ticker.remove(this.updateCallback);
        }
    };
    ResultPanelController.prototype.emitterOnUpdate = function(deltaTime) {
        if (this.emitter_star.isRunning === true) {
            this.emitter_star.update(deltaTime * 0.05);
        }
        if (this.emitter_coinRain.isRunning === true) {
            this.emitter_coinRain.update(deltaTime * 0.05);
        }
        if (this.emitter_coinShower.isRunning === true) {
            this.emitter_coinShower.update(deltaTime * 0.05);
        }
    };
    ResultPanelController.prototype.closeResultPlaque = function() {
        this.playSoundByConfig("ButtonPress");
        this.bgDim.show(false);
        this.hideDialog();
    };
    ResultPanelController.prototype.initCountUpTween = function() {
        this.countUpTween = new KeyFrameAnimation({
            "_name": 'countUpTweenKey',
            "tweenFunc": TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
            "_keyFrames": [{
                    "_time": 0,
                    "_SPRITES": []
                },
                {
                    "_time": 5000,
                    "_SPRITES": []
                }
            ]
        });
        this.countUpTween._onUpdate = new CallbackFunc(this, this.countUpOnUpdate);
        this.countUpTween._onComplete = new CallbackFunc(this, this.countUpOnComplete);
    };
    ResultPanelController.prototype.countUpOnUpdate = function({ caller: keyFrameAnim, time: timeDelta }) {
        const tweenFunc = keyFrameAnim.animData.tweenFunc;
        const duration = keyFrameAnim.maxTime;
        timeDelta = Math.ceil(timeDelta);
        let value = parseInt(tweenFunc(timeDelta, 0, this.resultData.prizeValue, duration));
        this.winningText.setText(SKBeInstant.formatCurrency(value).formattedAmount);
    };
    ResultPanelController.prototype.countUpOnComplete = function() {};
    ResultPanelController.prototype.onGameParametersUpdated = function() {
        this.init();

        this.winOkButton.onClick = new CallbackFunc(this, this.closeResultPlaque);
        this.lossOkButton.onClick = new CallbackFunc(this, this.closeResultPlaque);

        if (config.textAutoFit.win_Text) {
            this.totalWinBuyText.autoFontFitText = config.textAutoFit.win_Text.isAutoFit;
            this.simpleBuyText.autoFontFitText = config.textAutoFit.win_Text.isAutoFit;
        }

        if (config.textAutoFit.win_Try_Text) {
            this.totalWinTryText.autoFontFitText = config.textAutoFit.win_Try_Text.isAutoFit;
            this.simpleTryText.autoFontFitText = config.textAutoFit.win_Try_Text.isAutoFit;
        }

        if (config.textAutoFit.win_Value) {
            this.winningText.autoFontFitText = config.textAutoFit.win_Value.isAutoFit;
            this.simpleTotalWin.autoFontFitText = config.textAutoFit.win_Value.isAutoFit;
        }

        if (config.textAutoFit.closeWinText) {
            gr.lib._closeWinText.autoFontFitText = config.textAutoFit.closeWinText.isAutoFit;
        }

        if (config.textAutoFit.nonWin_Text) {
            gr.lib._nonWin_Text.autoFontFitText = config.textAutoFit.nonWin_Text.isAutoFit;
        }

        if (config.textAutoFit.closeNonWinText) {
            gr.lib._closeNonWinText.autoFontFitText = config.textAutoFit.closeNonWinText.isAutoFit;
        }

        if (SKBeInstant.config.wagerType === 'TRY') {
            if (Number(SKBeInstant.config.demosB4Move2MoneyButton) === -1) {
                this.totalWinTryText.setText(loader.i18n.Game.message_anonymousTryWin);

            } else {
                this.totalWinTryText.setText(loader.i18n.Game.message_tryWin_bg);
            }
            if (config.style.win_Try_Text) {
                gameUtils.setTextStyle(this.totalWinTryText, config.style.win_Try_Text);
            }
        }
        this.totalWinBuyText.setText(loader.i18n.Game.message_buyWin_bg);
        this.simpleTryText.setText(loader.i18n.Game.message_tryWin);
        this.simpleBuyText.setText(loader.i18n.Game.message_buyWin);

        gr.lib._closeWinText.setText(loader.i18n.Game.message_close);
        gr.lib._nonWin_Text.setText(loader.i18n.Game.message_nonWin);
        gr.lib._closeNonWinText.setText(loader.i18n.Game.message_close);

        if (config.style.button_label) {
            gameUtils.setTextStyle(gr.lib._closeWinText, config.style.button_label);
            gameUtils.setTextStyle(gr.lib._closeNonWinText, config.style.button_label);
        }
        if (config.style.win_Text) {
            gameUtils.setTextStyle(this.totalWinBuyText, config.style.win_Text);
            gameUtils.setTextStyle(this.simpleTryText, config.style.win_Text);
            gameUtils.setTextStyle(this.simpleBuyText, config.style.win_Text);
        }
        if (config.style.win_Value) {
            gameUtils.setTextStyle(this.winningText, config.style.win_Value);
        }
        if (config.style.nonWin_Text) {
            gameUtils.setTextStyle(gr.lib._nonWin_Text, config.style.nonWin_Text);
        }
        this.hideDialog();
    };
    ResultPanelController.prototype.autoDisappear = function() {
        /*this.winPanelSprite.show(false);
        this.lossPanelSprite.show(false);*/
        this.hideET();
        //this.stopSunShineAnimation();
        this.stopStarRain();
        this.stopCoinRain();
        this.stopCoinShower();
        //this.bgDim.show(false);
    };
    ResultPanelController.prototype.hideDialog = function() {
        this.winPanelSprite.show(false);
        this.lossPanelSprite.show(false);
        this.hideET();
        this.stopSunShineAnimation();
        this.stopStarRain();
        this.stopCoinRain();
        this.stopCoinShower();
    };
    ResultPanelController.prototype.showDialog = function() {
        if (this.resultData.playResult === 'WIN') {
            // show winning panel
            this.playSoundByConfig('Win');
            if (SKBeInstant.config.wagerType === 'BUY') {
                this.totalWinTryText.show(false);
                this.totalWinBuyText.show(true);
                this.simpleTryText.show(false);
                this.simpleBuyText.show(true);

            } else {
                this.totalWinTryText.show(true);
                this.totalWinBuyText.show(false);
                this.simpleTryText.show(true);
                this.simpleBuyText.show(false);
            }
            //this.countUpTween.play();
            this.winningText.setText(SKBeInstant.formatCurrency(this.resultData.prizeValue).formattedAmount);
            this.simpleTotalWin.setText(SKBeInstant.formatCurrency(this.resultData.prizeValue).formattedAmount);
            if (config.style.win_Value_color) {
                gameUtils.setTextStyle(this.winningText, config.style.win_Value_color);
                gameUtils.setTextStyle(this.simpleTotalWin, config.style.win_Value_color);
            }

            if (this.isShowPanelBG()) {
                //with background;
                gr.lib._winTextWithBG.show(true);
                gr.lib._winTextWithoutBG.show(false);

                this.winPanelBGSprite.show(true);
                this.showPanelET();
                this.winOkButton.show(true);
                this.startCoinRain();
                this.animateSunShine();
                this.bgDim.show(true);
            } else {
                //without background
                gr.lib._winTextWithBG.show(false);
                gr.lib._winTextWithoutBG.show(true);
                this.winPanelBGSprite.show(false);
                this.showNonPanelET();
                this.winOkButton.show(false);
                this.startCoinShower();
                this.animateSunShine();
                const _this = this;
                this.autoHideTimer = gr.getTimer().setTimeout(function() {
                    _this.autoDisappear();
                }, config.timers.result_autoHideCountDown);
            }
            this.winPanelSprite.show(true);
            this.lossPanelSprite.show(false);

        } else {
            //show loss panel
            //LGMCAS-236
            //Loss plaque appears on losing game

            if (loader.i18n.gameConfig) {

                if (loader.i18n.gameConfig.suppressNonWinResultPlaque) {

                    this.lossPanelSprite.show(false);

                } else {

                    this.playSoundByConfig('Loss');

                    if (this.isShowPanelBG()) {
                        this.bgDim.show(true);
                        this.hideET();
                        this.startStarRain();
                        this.winPanelSprite.show(false);
                        this.lossPanelSprite.show(true);
                    }
                }
            }
        }
    };
    ResultPanelController.prototype.isShowPanelBG = function() {
        let rs = true;
        if (SKBeInstant.config.customBehavior) {
            if (SKBeInstant.config.customBehavior.showResultScreen === false) {
                rs = false;
            }
        } else {
            if (loader.i18n.gameConfig) {
                if (loader.i18n.gameConfig.showResultScreen === false) {
                    rs = false;
                }
            }
        }
        return rs;
    };

    ResultPanelController.prototype.onStartUserInteraction = function(data) {
        this.resultData = data;
        //  this.bgDim.show(false);
        this.hideDialog();
    };

    ResultPanelController.prototype.onEnterResultScreenState = function() {
        if (this.isEveryThingOkay()) {
            this.showDialog();
        }
    };

    ResultPanelController.prototype.onReStartUserInteraction = function(data) {
        this.onStartUserInteraction(data);
    };

    ResultPanelController.prototype.onReInitialize = function() {
        this.hideDialog();
    };


    ResultPanelController.prototype.onPlayerWantsPlayAgain = function() {
        this.bgDim.show(false);
        this.hideDialog();
    };

    ResultPanelController.prototype.onTutorialIsShown = function() {
        if (this.winPanelSprite.pixiContainer.visible || this.lossPanelSprite.pixiContainer.visible) {
            this.resultPlaque = this.winPanelSprite.pixiContainer.visible ? this.winPanelSprite : this.lossPanelSprite;
            this.resultPlaque.show(false);
            //this.hideDialog();
            this.bgDim.show(true);
        }
    };

    ResultPanelController.prototype.onTutorialIsHide = function() {
        if (this.resultPlaque) {
            this.resultPlaque.show(true);
            /*if (this.resultDate && this.resultData.playResult === 'WIN'){
            	// gr.lib._fire.gotoAndPlay('fire', 0.5, true);
            }*/
            this.resultPlaque = null;
        }
    };
    ResultPanelController.prototype.playSoundByConfig = function(soundName, isloop = false) {
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
    ResultPanelController.prototype.isPortrait = function() {
        return gr.getSize().height > gr.getSize().width;
    };
    ResultPanelController.config_coin_portrait = {
        "alpha": {
            "start": 1,
            "end": 1
        },
        "scale": {
            "start": 0.6,
            "end": 0.8,
            "minimumScaleMultiplier": 1
        },
        "color": {
            "start": "#ffffff",
            "end": "#ffffff"
        },
        "speed": {
            "start": 150,
            "end": 200,
            "minimumSpeedMultiplier": 1
        },
        "acceleration": {
            "x": 0,
            "y": 15
        },
        "maxSpeed": 0,
        "startRotation": {
            "min": 70,
            "max": 110
        },
        "noRotation": false,
        "rotationSpeed": {
            "min": 20,
            "max": 50
        },
        "lifetime": {
            "min": 4,
            "max": 4
        },
        "blendMode": "normal",
        "frequency": 0.1,
        "emitterLifetime": -1,
        "maxParticles": 50,
        "pos": {
            "x": 0,
            "y": 0
        },
        "addAtBack": false,
        "spawnType": "rect",
        "spawnRect": {
            "x": 0,
            "y": 0,
            "w": 600,
            "h": 1
        }
    };
    ResultPanelController.config_coin_landscape = {
        "alpha": {
            "start": 1,
            "end": 1
        },
        "scale": {
            "start": 0.6,
            "end": 0.8,
            "minimumScaleMultiplier": 1
        },
        "color": {
            "start": "#ffffff",
            "end": "#ffffff"
        },
        "speed": {
            "start": 150,
            "end": 200,
            "minimumSpeedMultiplier": 1
        },
        "acceleration": {
            "x": 0,
            "y": 15
        },
        "maxSpeed": 0,
        "startRotation": {
            "min": 70,
            "max": 110
        },
        "noRotation": false,
        "rotationSpeed": {
            "min": 20,
            "max": 50
        },
        "lifetime": {
            "min": 2.5,
            "max": 2.5
        },
        "blendMode": "normal",
        "frequency": 0.1,
        "emitterLifetime": -1,
        "maxParticles": 50,
        "pos": {
            "x": 0,
            "y": 0
        },
        "addAtBack": false,
        "spawnType": "rect",
        "spawnRect": {
            "x": 0,
            "y": -150,
            "w": 900,
            "h": 1
        }
    };
    ResultPanelController.config_coinShower_portrait = {
        "alpha": {
            "start": 1,
            "end": 1
        },
        "scale": {
            "start": 0.6,
            "end": 0.8,
            "minimumScaleMultiplier": 1
        },
        "color": {
            "start": "#ffffff",
            "end": "#ffffff"
        },
        "speed": {
            "start": 150,
            "end": 200,
            "minimumSpeedMultiplier": 1
        },
        "acceleration": {
            "x": 0,
            "y": 15
        },
        "maxSpeed": 0,
        "startRotation": {
            "min": 70,
            "max": 110
        },
        "noRotation": false,
        "rotationSpeed": {
            "min": 20,
            "max": 50
        },
        "lifetime": {
            "min": 4,
            "max": 4
        },
        "blendMode": "normal",
        "frequency": 0.1,
        "emitterLifetime": -1,
        "maxParticles": 50,
        "pos": {
            "x": 0,
            "y": 0
        },
        "addAtBack": false,
        "spawnType": "rect",
        "spawnRect": {
            "x": 0,
            "y": 100,
            "w": 600,
            "h": 1
        }
    };
    ResultPanelController.config_coinShower_landscape = {
        "scale": {
            "start": 0.6,
            "end": 0.8,
            "minimumScaleMultiplier": 1
        },
        "color": {
            "start": "#ffffff",
            "end": "#ffffff"
        },
        "speed": {
            "start": 150,
            "end": 200,
            "minimumSpeedMultiplier": 1
        },
        "acceleration": {
            "x": 0,
            "y": 15
        },
        "maxSpeed": 0,
        "startRotation": {
            "min": 70,
            "max": 110
        },
        "noRotation": false,
        "rotationSpeed": {
            "min": 20,
            "max": 50
        },
        "lifetime": {
            "min": 3,
            "max": 3.5
        },
        "blendMode": "normal",
        "frequency": 0.1,
        "emitterLifetime": -1,
        "maxParticles": 50,
        "pos": {
            "x": 0,
            "y": 0
        },
        "addAtBack": false,
        "spawnType": "rect",
        "spawnRect": {
            "x": 0,
            "y": -200,
            "w": 1000,
            "h": 1
        }
    };
    ResultPanelController.config_star_portrait = {
        "alpha": {
            "start": 1,
            "end": 0.2
        },
        "scale": {
            "start": 1,
            "end": 1.5,
            "minimumScaleMultiplier": 1
        },
        "color": {
            "start": "#ffffff",
            "end": "#ffffff"
        },
        "speed": {
            "start": 5,
            "end": 50,
            "minimumSpeedMultiplier": 1
        },
        "acceleration": {
            "x": 0,
            "y": 0
        },
        "maxSpeed": 0,
        "startRotation": {
            "min": 70,
            "max": 90
        },
        "noRotation": false,
        "rotationSpeed": {
            "min": 10,
            "max": 50
        },
        "lifetime": {
            "min": 8,
            "max": 20
        },
        "blendMode": "normal",
        "frequency": 2,
        "emitterLifetime": -1,
        "maxParticles": 5,
        "pos": {
            "x": 0,
            "y": 0
        },
        "addAtBack": false,
        "spawnType": "rect",
        "spawnRect": {
            "x": 150,
            "y": 0,
            "w": 300,
            "h": 200
        }
    };
    ResultPanelController.config_star_landscape = {
        "alpha": {
            "start": 1,
            "end": 0.2
        },
        "scale": {
            "start": 1,
            "end": 1.5,
            "minimumScaleMultiplier": 1
        },
        "color": {
            "start": "#ffffff",
            "end": "#ffffff"
        },
        "speed": {
            "start": 5,
            "end": 50,
            "minimumSpeedMultiplier": 1
        },
        "acceleration": {
            "x": 0,
            "y": 0
        },
        "maxSpeed": 0,
        "startRotation": {
            "min": 70,
            "max": 90
        },
        "noRotation": false,
        "rotationSpeed": {
            "min": 10,
            "max": 50
        },
        "lifetime": {
            "min": 8,
            "max": 10
        },
        "blendMode": "normal",
        "frequency": 2,
        "emitterLifetime": -1,
        "maxParticles": 5,
        "pos": {
            "x": 0,
            "y": 0
        },
        "addAtBack": false,
        "spawnType": "rect",
        "spawnRect": {
            "x": 150,
            "y": -80,
            "w": 300,
            "h": 200
        }
    };
    return ResultPanelController;
});