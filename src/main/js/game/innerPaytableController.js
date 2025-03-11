define(function module(require)
{
    'use strict';
    const PIXI 		= require('com/pixijs/pixi');
    const msgBus   		= require('skbJet/component/gameMsgBus/GameMsgBus');
    const GladButton 	= require('game/component/gladButton');
    const config 		= require('game/configController');
    const loader		= require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const LittleGreenMenGameEvent = require('game/events/littleGreenMenGameEvent');
    const CallbackFunc = require('game/component/callbackFunc');
    let   gr 			= require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    let   SKBeInstant	= require('skbJet/component/SKBeInstant/SKBeInstant');
	const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
	function InnerPaytableController(){
		this.closeBtn = null;
		this.displayObject = null;
		this.currentStake = null;
		this.isPanelDisplayed = false;
		this.isPassiveShut = false;
		this.passiveShutCallback = null;
		this.dim = null;
		this.addListeners();
	}
	InnerPaytableController.prototype.playSoundByConfig = function(soundName, isloop = false){
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
	InnerPaytableController.prototype.addListeners = function (){
		msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
		msgBus.subscribe('ticketCostChanged', new CallbackFunc(this, this.onTicketCostChanged));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.INNERPAYTABLEBTN_CLICKED, new CallbackFunc(this, this.showPayTable));
		
		this.passiveShutCallback = new CallbackFunc(this, this.passiveShutNoPublishing);
		msgBus.subscribe('disableUI', this.passiveShutCallback);
		msgBus.subscribe('startReveallAll', this.passiveShutCallback);
		msgBus.subscribe('tutorialIsHide', this.passiveShutCallback);
		msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame', this.passiveShutCallback);
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.TUTORIAL_SHOW, this.passiveShutCallback);
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_GO_BUTTON_CLICKED, this.passiveShutCallback);
	};
	InnerPaytableController.prototype.showPayTable = function() {
		this.isPanelDisplayed = true;
		this.previousDimVisible = this.dim.pixiContainer.visible;
        this.dim.show(true);
		this.slideIn();
	};
	InnerPaytableController.prototype.init = function (){
		this.dim = gr.lib._BG_dim;
		this.displayObject = gr.lib._payTable;
		this.closeBtn = new GladButton (gr.lib._payTableClose,'closeButton', {'scaleXWhenClick': -0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true});
		this.closeBtn.onClick = new CallbackFunc(this, this.closeBtnOnClick);
		this.textInitial();
		this.displayObject.show(false);
	};
	InnerPaytableController.prototype.closeBtnOnClick = function (){
		this.playSoundByConfig("ButtonPress");
		this.closeBtn.enable(false);
		this.isPassiveShut = false;
		if(this.previousDimVisible === false){
			this.dim.show(false);
		}
		this.slideOut();
	};
	InnerPaytableController.prototype.slideIn = function (){
		this.displayObject.show(true);
		if(!gr.animMap._innerPayTableIn._onComplete){
			gr.animMap._innerPayTableIn._onComplete = new CallbackFunc(this, this.slideInComplete);
		}
		//gr.animMap._innerPayTableIn.animData.tweenFunc = TweenFunctions.easeOutBounce;
		gr.animMap._innerPayTableIn.play();
	};

	InnerPaytableController.prototype.slideInComplete = function (){
		this.closeBtn.enable(true);
	};
	InnerPaytableController.prototype.slideOut = function (){
		if(!gr.animMap._innerPayTableOut._onComplete){
			gr.animMap._innerPayTableOut._onComplete = new CallbackFunc(this, this.slideOutComplete);
		}
		gr.animMap._innerPayTableOut.play();
	};
	InnerPaytableController.prototype.slideOutComplete = function() {
		this.isPanelDisplayed = false;
		this.displayObject.show(false);
		if(this.isPassiveShut === false){
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.INNERPAYTABLE_CLOSED);
		}
	};
	InnerPaytableController.prototype.passiveShutNoPublishing = function (){
		if(this.isPanelDisplayed){
			this.isPassiveShut = true;
			this.slideOut();
		}
		if(SKBeInstant && Number(SKBeInstant.config.jLotteryPhase) === 1){
			this.dim.show(false);
		}
	};
	InnerPaytableController.prototype.textInitial = function (){
		this.payTableText_symX10 = gr.lib._payTableWinTaxt01;
		this.payTableText_symX13 = gr.lib._payTableWinTaxt02;
		this.payTableText_symX16 = gr.lib._payTableWinTaxt03;
		this.payTableText_bottom = gr.lib._payTableStarText;		
		this.payTableText_symX10.setText(loader.i18n.Game["payTable_symX10"]);
		this.payTableText_symX13.setText(loader.i18n.Game["payTable_symX13"]);
		this.payTableText_symX16.setText(loader.i18n.Game["payTable_symX16"]);
		this.payTableText_bottom.setText(loader.i18n.Game["payTable_bottom_text"]);
		
		this.handleTextWithImage(this.payTableText_bottom, loader.i18n.Game["payTable_bottom_text"].split(new RegExp('[\n]','g')));
		this.updateSymbolPrize();
	};
	InnerPaytableController.prototype.onTicketCostChanged = function (evt){
		this.updateSymbolPrize(evt);
	};
	InnerPaytableController.prototype.updateSymbolPrize = function(currentStake) {
		if(SKBeInstant){
			const gameConfig = SKBeInstant.config.gameConfigurationDetails;
			const prizeTable = gameConfig.revealConfigurations;
			this.currentStake = (currentStake)? currentStake : gameConfig.pricePointGameDefault;
			const currentPrize = prizeTable.find(prize => prize.price === this.currentStake);
			for(const item of currentPrize.prizeTable){
				const symbolCode = item.description;
				const textObj = gr.lib['_prize'+symbolCode];
				if(typeof textObj !== "undefined"){
					const prize = item.prize;
					textObj.setText(SKBeInstant.formatCurrency(prize).formattedAmount);
				}
			}
		}
	};
	InnerPaytableController.prototype.handleTextWithImage = function (parentSpr, linesArr) {
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
	return InnerPaytableController;
});