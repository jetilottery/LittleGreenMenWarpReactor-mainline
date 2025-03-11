/**
 * @module game/tutorialController
 * @description result dialog control
 */
define(function module(require){
    'use strict';
    const msgBus        = require('skbJet/component/gameMsgBus/GameMsgBus');
    const audio         = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
    const gr            = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const loader        = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const GladButton    = require('game/component/gladButton');
    const SKBeInstant   = require('skbJet/component/SKBeInstant/SKBeInstant');
    const gameUtils     = require('game/utils/gameUtils');
    const config        = require('game/configController');
    const PIXI          = require('com/pixijs/pixi');
    const LittleGreenMenGameEvent   = require('game/events/littleGreenMenGameEvent');
    const CallbackFunc = require('game/component/callbackFunc');

    var index = 0, minIndex = 0, maxIndex;
    var shouldShowTutorialWhenReinitial = false;
    var iconOnImage, iconOffImage, buttonCloseImage;
    var resultIsShown = false;
    var showButtonInfoTimer = null;    

    function TutorialController (){
        this.buttonClose = null;
        this.audioOffBtn = null;
        this.leftArrowBtn = null;
        this.rightArrowBtn = null;
        this.addListeners();
    }
    TutorialController.prototype.addListeners = function() {
        msgBus.subscribe('jLottery.initialize', new CallbackFunc(this, this.onInitialize));
        msgBus.subscribe('jLottery.reInitialize', new CallbackFunc(this, this.onReInitialize));
        msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.onGameParametersUpdated));
        msgBus.subscribe('jLottery.reStartUserInteraction', new CallbackFunc(this, this.onReStartUserInteraction));
        msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',new CallbackFunc(this, this.onPlayerWantsToMoveToMoneyGame));
        msgBus.subscribe('jLottery.startUserInteraction', new CallbackFunc(this, this.onStartUserInteraction));
        msgBus.subscribe('jLottery.enterResultScreenState', new CallbackFunc(this, this.onEnterResultScreenState));
        msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.TUTORIAL_SHOW, new CallbackFunc(this, this.showTutorial));
    };
    TutorialController.prototype.showTutorial = function (){
        this.previousDimVisible = gr.lib._BG_dim.pixiContainer.visible;
        gr.lib._BG_dim.off('click');
        gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);
        if (gr.lib._winPlaque.pixiContainer.visible || gr.lib._nonWinPlaque.pixiContainer.visible) {
            resultIsShown = true;
        }
        //gr.animMap._tutorialAnim.animData.tweenFunc = TweenFunctions.easeOutBounce;
        /*if(!gr.animMap._tutorialAnim._onComplete){
            gr.animMap._tutorialAnim._onComplete = new CallbackFunc(this, this.showTutorialOnComplete);
        }*/
        gr.animMap._tutorialAnim.play();
        msgBus.publish('tutorialIsShown');
    };
    TutorialController.prototype.showTutorialOnComplete = function (){
    };

    TutorialController.prototype.hideTutorial = function () {
        index = minIndex;
        if(!gr.animMap._tutorialUP._onComplete){
            gr.animMap._tutorialUP._onComplete = new CallbackFunc(this, this.goUpAnimationOnComplete);
        }

        gr.animMap._tutorialUP.play();     
        if(this.previousDimVisible === false){
            gr.lib._BG_dim.show(false);
        }
    };
    TutorialController.prototype.goUpAnimationOnComplete = function (){
        gr.lib._tutorial.show(false);
        for (var i = minIndex; i <= maxIndex; i++) {
            if (i === minIndex) {
                gr.lib['_tutorialPage_0' + i].show(true);
                gr.lib['_tutorialPage_0'+i+'_Text_00'].show(true);
                if (gr.lib['_tutorialPageIcon_0' + i]) {
                    gr.lib['_tutorialPageIcon_0' + i].setImage(iconOnImage);
                }
            } else {
                gr.lib['_tutorialPage_0' + i].show(false);
                gr.lib['_tutorialPage_0'+i+'_Text_00'].show(false);
                gr.lib['_tutorialPageIcon_0' + i].setImage(iconOffImage);
            }
        }
        if (!resultIsShown){
            gr.lib._BG_dim.show(false);
        }else{
            resultIsShown = false;
        }
        msgBus.publish('tutorialIsHide');
    };
    TutorialController.prototype.leftArrowButtonOnClick = function(){
        index--;
        if (index < minIndex){
            index = maxIndex;
        }
        this.showTutorialPageByIndex(index);
        this.playSoundByConfig("ButtonBetDown");
    };
    TutorialController.prototype.rightArrowBtnOnClick = function (){
        index++;
        if (index > maxIndex){
            index = minIndex;
        }

        this.showTutorialPageByIndex(index);
        this.playSoundByConfig("ButtonBetUp");
    };
    TutorialController.prototype.setupButtons = function (){
        buttonCloseImage = config.gladButtonImgName.AllPanelOKButton || "tutorialOKButton";
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch':true};
        this.buttonClose = new GladButton(gr.lib._buttonCloseTutorial, buttonCloseImage, scaleType);
        this.buttonClose.onClick = new CallbackFunc(this, this.closeBtnOnClick);
        this.leftArrowBtn = new GladButton(gr.lib._buttonTutorialArrowLeft, gr.lib._buttonTutorialArrowLeft.getCurrentStyle()._background._imagePlate, scaleType);
        this.leftArrowBtn.onClick = new CallbackFunc(this, this.leftArrowButtonOnClick);
        this.rightArrowBtn = new GladButton(gr.lib._buttonTutorialArrowRight, gr.lib._buttonTutorialArrowRight.getCurrentStyle()._background._imagePlate, {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true});
        this.rightArrowBtn.onClick = new CallbackFunc(this, this.rightArrowBtnOnClick);
        this.audioOffBtn = new GladButton(gr.lib._buttonAudioOff, gr.lib._buttonAudioOff.getCurrentStyle()._background._imagePlate, scaleType);
        this.audioOffBtn.onClick = new CallbackFunc(this, this.playButtonSound);
    };
    /*The sound button functionality has been implemented in audioController, the only reason this playButtonSound exist is because,
        it is required to play a button sound when the sound switch is turned on.
    */
    TutorialController.prototype.playButtonSound = function (){
        this.playSoundByConfig("ButtonPress");
    };
    TutorialController.prototype.isShowTutorialAtBeginning = function (){
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
        if(SKBeInstant.config.customBehavior){
            if(SKBeInstant.config.customBehavior.showTutorialAtBeginning === false){
                defaultValue =  false;
            }
        }
        else{
            if(loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false){
                defaultValue =  false;
            }
        }
        return defaultValue;
    };
    TutorialController.prototype.closeBtnOnClick = function (){
        this.playSoundByConfig("ButtonPress");
        this.hideTutorial();
    };
    TutorialController.prototype.initialVersionText = function (){
        if (config.textAutoFit.versionText) {
            gr.lib._versionText.autoFontFitText = config.textAutoFit.versionText.isAutoFit;
        }
        gr.lib._versionText.setText(window._cacheFlag.gameVersion + ".CL" + window._cacheFlag.changeList + "_" + window._cacheFlag.buildNumber);
        //gr.lib._versionText.setText(window._cacheFlag.gameVersion);
        if (SKBeInstant.isWLA()) {
            gr.lib._versionText.show(true);
        } else {
            gr.lib._versionText.show(false);
        }
    };
    TutorialController.prototype.setupText = function (){
        this.initialVersionText();        
        // Prevent click the symbols when tutorial is shown
        iconOnImage = config.gladButtonImgName.iconOn;
        iconOffImage = config.gladButtonImgName.iconOff;
        maxIndex = Number(config.gameParam.pageNum)-1;
        for (var i = minIndex; i <= maxIndex; i++) {
            if(i !== 0){
                gr.lib['_tutorialPage_0' + i].show(false);
                gr.lib['_tutorialPage_0'+i+'_Text_00'].show(false);
            }else{
                if (gr.lib['_tutorialPageIcon_0' + i]) {
                    gr.lib['_tutorialPageIcon_0' + i].setImage(iconOnImage);
                }
            }
            var obj = gr.lib['_tutorialPage_0'+i+'_Text_00'];
            if (config.tutorialDropShadow) {
                gameUtils.setTextStyle(obj, {
                    padding: config.dropShadow.padding,
                    dropShadow: config.dropShadow.dropShadow,
                    dropShadowDistance: config.dropShadow.dropShadowDistance
                });
            }
            gameUtils.setTextStyle(obj,config.style.textStyle);
            let line;
            if (loader.i18n.Game['tutorial_0' + i + '_landscape'] || loader.i18n.Game['tutorial_0' + i + '_portrait']){

                if(SKBeInstant.getGameOrientation() === "landscape"){
                    line = loader.i18n.Game['tutorial_0' + i + '_landscape'];
                }else{
                    line = loader.i18n.Game['tutorial_0' + i + '_portrait'];
                }
            }else{
                line = loader.i18n.Game['tutorial_0' + i];
            }
            //let line = loader.i18n.Game['tutorial_0' + i];
            const regE = new RegExp("[\n]", 'g');
            this.handleTutorialContent(obj, line.split(regE));
        }

        gameUtils.setTextStyle(gr.lib._tutorialTitleText,config.style.tutorialTitleText);
        if (config.textAutoFit.tutorialTitleText){
            gr.lib._tutorialTitleText.autoFontFitText = config.textAutoFit.tutorialTitleText.isAutoFit;
        }
        gr.lib._tutorialTitleText.setText(loader.i18n.Game.tutorial_title);
        gameUtils.setTextStyle(gr.lib._closeTutorialText, config.style.button_label);
        if (config.textAutoFit.closeTutorialText){
            gr.lib._closeTutorialText.autoFontFitText = config.textAutoFit.closeTutorialText.isAutoFit;
        }
        gr.lib._closeTutorialText.setText(loader.i18n.Game.message_close);
        gameUtils.setTextStyle(gr.lib._tutorialTitleText, { padding: 10 });        
        if (config.dropShadow) {
            gameUtils.setTextStyle(gr.lib._closeTutorialText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
            
        }
    };
    TutorialController.prototype.onGameParametersUpdated = function() {
        this.setupButtons();
        this.setupText();
        gr.lib._tutorial.show(false);
        gr.lib._BG_dim.show(false);
        gr.lib._BG_dim.on('click', function(event){
            event.stopPropagation();
        });
    };

    TutorialController.prototype.showTutorialPageByIndex = function(index){
        this.hideAllTutorialPages();
        gr.lib['_tutorialPage_0' + index].show(true);
        gr.lib['_tutorialPage_0'+ index +'_Text_00'].show(true);
        gr.lib['_tutorialPageIcon_0'+index].setImage(iconOnImage);
    };

    TutorialController.prototype.hideAllTutorialPages = function(){
        for (var i = 0; i <= maxIndex; i++){
            gr.lib['_tutorialPage_0' + i].show(false);
            gr.lib['_tutorialPage_0'+ i +'_Text_00'].show(false);
            if (gr.lib['_tutorialPageIcon_0' + i]) {
                gr.lib['_tutorialPageIcon_0' + i].setImage(iconOffImage);
            }
        }
    };

    TutorialController.prototype.onReInitialize = function() {
        if(shouldShowTutorialWhenReinitial){
            shouldShowTutorialWhenReinitial = false;
            if (this.isShowTutorialAtBeginning()) {
                this.showTutorial();
            }else{
                this.hideTutorialAtBeginning();
            }           
        }else{
            gr.lib._tutorial.show(false);
            gr.lib._BG_dim.show(false);
        }
    };
    TutorialController.prototype.showTutorialOnInitial = function(){
        for (var i = minIndex; i <= maxIndex; i++) {
            if (i === minIndex) {
                gr.lib['_tutorialPage_0' + i].show(true);
                gr.lib['_tutorialPage_0' + i + '_Text_00'].show(true);
                if (gr.lib['_tutorialPageIcon_0' + i]) {
                    gr.lib['_tutorialPageIcon_0' + i].setImage(iconOnImage);
                }
            } else {
                gr.lib['_tutorialPage_0' + i].show(false);
                gr.lib['_tutorialPage_0' + i + '_Text_00'].show(false);
                gr.lib['_tutorialPageIcon_0' + i].setImage(iconOffImage);
            }
        }
        gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);
        msgBus.publish('tutorialIsShown');
    };
    TutorialController.prototype.hideTutorialAtBeginning = function (){
        gr.lib._tutorial.show(false);
        gr.lib._BG_dim.show(false);
        msgBus.publish('tutorialIsHide');
    };
    TutorialController.prototype.onInitialize = function(){
        if(this.isShowTutorialAtBeginning()){
            this.showTutorialOnInitial();
        }else{
            this.hideTutorialAtBeginning();
        }
    };
    TutorialController.prototype.onReStartUserInteraction = function(){
		if(showButtonInfoTimer){ 
			gr.getTimer().clearTimeout(showButtonInfoTimer);
			showButtonInfoTimer = null;
		}
    };
    TutorialController.prototype.onStartUserInteraction = function(){
        if(SKBeInstant.config.gameType === 'ticketReady'){
            if (this.isShowTutorialAtBeginning()) {
                this.showTutorialOnInitial();
            } else {
                this.hideTutorialAtBeginning();
            }
        }else{
            gr.lib._tutorial.show(false);
            gr.lib._BG_dim.show(false);
        }
    };
    
    TutorialController.prototype.onEnterResultScreenState = function () {       
        showButtonInfoTimer = gr.getTimer().setTimeout(function () {
			gr.getTimer().clearTimeout(showButtonInfoTimer);
			showButtonInfoTimer = null;
			// if(gr.lib._warningAndError && !gr.lib._warningAndError.pixiContainer.visible){
			// }	
        }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);     
    };
    
    TutorialController.prototype.onPlayerWantsToMoveToMoneyGame = function (){
		if(showButtonInfoTimer){ 
			gr.getTimer().clearTimeout(showButtonInfoTimer);
			showButtonInfoTimer = null;
		}
        shouldShowTutorialWhenReinitial = true;
    };

    TutorialController.prototype.playSoundByConfig = function(soundName, isloop = false){
        if (config.audio && config.audio[soundName]) {
            const channel = config.audio[soundName].channel;
            config.audio[soundName].currentIndex = 0;
            if(Array.isArray(channel)){
                audio.play(config.audio[soundName].name, channel[config.audio[soundName].currentIndex++ % channel.length]);
            }else{
                audio.play(config.audio[soundName].name, channel, isloop);
            }
        }
    };
    
    TutorialController.prototype.handleTutorialContent = function (parentSpr, linesArr) {
        var curStyle = parentSpr._currentStyle;
        var fSize = curStyle._font._size, parentWidth = curStyle._width, parentHeight = curStyle._height, contentWidth = 0, contentHeight;
        var regImg = new RegExp('\{[^\{]+\}', 'g');

        var perLineHeight = Math.floor((curStyle._height - (linesArr.length - 1) * 10) / linesArr.length);
        var txtStyle = {fontWeight: curStyle._font._weight, fontFamily: curStyle._font._family, fontSize: fSize, fill: '#ffffff', align: curStyle._text._align, lineHeight: perLineHeight, height: perLineHeight};
        createLineSpr();
        while (contentWidth > parentWidth || contentHeight > (parentHeight - (linesArr.length - 1) * 10)) {
            fSize--;
            txtStyle.fontSize = fSize;
            createLineSpr();
        }
        setPosition();

        function createLineSpr() {
            parentSpr.pixiContainer.removeChildren();
            var prevContentWidth = 0;
            contentHeight = 0;
            for (var i = 0; i < linesArr.length; i++) {
                var txts = linesArr[i].split(regImg);
                var imgs = linesArr[i].match(regImg);
                contentWidth = 0;
                if (txts.length === 1 && imgs === null) {
                    var txtSpr = new PIXI.Text(txts[0], txtStyle);
                    parentSpr.pixiContainer.addChild(txtSpr);
                    contentWidth = txtSpr.width;
                    contentHeight += txtSpr.height;
                } else {
                    var lineSpr = new PIXI.Container();
                    createSubSpr(lineSpr, txts, imgs);
                    contentHeight += lineSpr.cttHeight;
                }
                contentWidth = prevContentWidth >= contentWidth ? prevContentWidth : contentWidth;
                prevContentWidth = contentWidth;
            }
            function createSubSpr(container, txtArr, imgArr) {
                var imgName, ratio, imgSpr, imgW, imgH, prevSubHeight = 0;
                for (var j = 0; j < txtArr.length; j++) {
                    var txtSprite = new PIXI.Text(txtArr[j], txtStyle);
                    container.addChild(txtSprite);
                    contentWidth += txtSprite.width;
                    container.cttHeight = prevSubHeight >= txtSprite.height ? prevSubHeight : txtSprite.height;
                    prevSubHeight = container.cttHeight;
                    if (imgArr[j]) {
                        imgName = imgArr[j].match(new RegExp('[^\{\@\}]+'))[0];
                        imgSpr = PIXI.Sprite.fromImage(imgName);
                        imgW = imgSpr._texture.orig.width*1;
                        imgH = imgSpr._texture.orig.height*1;
                        ratio = imgW / imgH;
                        var initHeight = perLineHeight >= imgSpr.height + 10 ? imgSpr.height : perLineHeight - 10;
                        container.addChild(imgSpr);
                        imgSpr.scale.y = initHeight / imgSpr.height;
                        imgSpr.scale.x = Math.ceil(imgSpr.height * ratio) / imgSpr.width;
                        contentWidth += imgSpr.width;
                        container.cttHeight = prevSubHeight >= imgSpr.height ? prevSubHeight : imgSpr.height;
                        container.cttHeight = Number(container.cttHeight) + 10;
                        container.cttHeight = container.cttHeight > perLineHeight ? perLineHeight : container.cttHeight;
                        prevSubHeight = container.cttHeight;
                    }
                    container.cttWidth = contentWidth;
                }
                parentSpr.pixiContainer.addChild(container);
            }
        }
        function setPosition() {
            var line, prevLine, prevSpr;
            for (var i = 0; i < parentSpr.pixiContainer.children.length; i++) {
                line = parentSpr.pixiContainer.children[i];
                if (line.children.length === 0) {
                    line.x = (parentWidth - line.width) / 2;
                } else {
                    for (var j = 0; j < line.children.length; j++) {
                        var subSpr = line.children[j];
                        if (j === 0) {
                            subSpr.x = 0;
                        } else {
                            prevSpr = line.children[j - 1];
                            subSpr.x = prevSpr.x + prevSpr.width;
                        }
                        if(subSpr.hasOwnProperty('_text')){
                            //is a text
                            subSpr.y = (line.cttHeight - subSpr.height) / 2;
                        }
                        else{
                            //is an image
                            if(prevSpr && prevSpr.hasOwnProperty('_text')){
                                subSpr.y = (prevSpr.style.fontSize - subSpr.height) / 2;
                            }
                            else{
                                subSpr.y = (line.cttHeight - subSpr.height) / 2;
                            }
                        }
                    }
                    line.x = (parentWidth - line.cttWidth) / 2;
                }
                if (i === 0) {
                    line.y = (parentHeight - contentHeight - (linesArr.length - 1) * 10) / 2;
                } else {
                    prevLine = parentSpr.pixiContainer.children[i - 1];
                    line.y = prevLine.y + prevLine.height + 10;
                }
            }
        }
        
    };
    return TutorialController;
});
