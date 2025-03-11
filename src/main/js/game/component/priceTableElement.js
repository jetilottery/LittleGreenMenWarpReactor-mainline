/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-07-01 16:44:57
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-10-24 11:06:02
*/
define(function module(require){
	const msgBus   	= require('skbJet/component/gameMsgBus/GameMsgBus');
	const LittleGreenMenGameEvent	= require('game/events/littleGreenMenGameEvent');
	const gr 			= require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const loader		= require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
	const SKBeInstant	= require('skbJet/component/SKBeInstant/SKBeInstant');
	const config 		= require('game/configController');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const TweenFunctions = require('game/utils/tweenFunctions');
	const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
	const gameUtils = require('game/utils/gameUtils');
	const CallbackFunc = require('game/component/callbackFunc');
	function PriceTableElement(data){
		this.order = -1;
		this.code = "";
		this.planet = null;
		this.planetGlory = null;
		this.mouseActionSprite = null;
		this.achievedNum = 0;
		this.achievedNum_old = 0;
		this.achievedTextSprite = null;
		this.targetText = null;
		this.prizeTextLevel_1 = null;
		this.prizeTextLevel_2 = null;
		this.prizeTextLevel_3 = null;
		this.levelText_current = null;
		this.levelText_next = null;
		this.levelText_hidden = null;
		this.levels = [10, 13, 16];
		this.prices = [0, 0, 0, 0];
		this.currentLevelNum = 0;
		this.levelUpAnimation = null;
		this.planetPopKeyFrameAnim = null;
		this.rollingUpTween = null;
		this.colorBGSprite = null;
		this.init(data);
	}
	PriceTableElement.prototype.init = function(data) {
		this.code = data.code;
		this.order = data.order;
		this.planet = gr.lib['_priceIcon'+this.code];
		this.planetGlory = gr.lib['_planetGlory'+this.code];
		this.mouseActionSprite = gr.lib['_'+this.code];
		this.colorBGSprite = gr.lib._ptOutline;
		const _this = this;
		this.mouseActionSprite.on('mouseover', function (e){_this.onMouseOverHandler(e);});
		this.mouseActionSprite.on('mouseout', function (e){_this.onMouseOutHandler(e);});
		this.mouseActionSprite.on('mousedown',  function (e){_this.onMouseDownHandler(e);});
		/*this.mouseActionSprite.on('click',  function (e){_this.onClickHandler(e);});*/
		this.planetGlory.show(false);
		this.achievedTextSprite = gr.lib['_achieved'+this.code];
		this.targetText = gr.lib['_target'+this.code];
		this.levelText_current = gr.lib['_lv3Price'+this.code];
		this.levelText_next = gr.lib['_lv2Price'+this.code];
		this.levelText_hidden = gr.lib['_lv1Price'+this.code];
		this.prizeTextLevel_1 = gr.lib._level_1_prize;
		this.prizeTextLevel_2 = gr.lib._level_2_prize;
		this.prizeTextLevel_3 = gr.lib._level_3_prize;
		this.prizeTextLevel_1.autoFontFitText = true;
		this.prizeTextLevel_2.autoFontFitText = true;
		this.prizeTextLevel_3.autoFontFitText = true;

		this.initText();
	};
	PriceTableElement.prototype.resetAllPrizeTextStyle = function (){
		if(config.style.prizeText){
			this.updateTextStyle(this.prizeTextLevel_1, config.style.prizeText);
			this.updateTextStyle(this.prizeTextLevel_2, config.style.prizeText);
			this.updateTextStyle(this.prizeTextLevel_3, config.style.prizeText);
		}		
	};
	PriceTableElement.prototype.updatePrizeTextAccordingly = function (levelNum = this.currentLevelNum){
		if(config.style.prizeText_win){
			switch(levelNum){
				case 1:
					this.updateTextStyle(this.prizeTextLevel_1, config.style.prizeText_win);
					break;
				case 2:
					this.updateTextStyle(this.prizeTextLevel_2, config.style.prizeText_win);
					break;
				case 3:
					this.updateTextStyle(this.prizeTextLevel_3, config.style.prizeText_win);
					break;
				default:
					break;
			}
		}
	};
	PriceTableElement.prototype.displayPrizeTableAccordingly = function (){
		const imagePrefix = (this.isPortrait())?"portrait":"landscape";
		this.colorBGSprite.setImage(imagePrefix+"_ptOutline"+this.code);
		this.colorBGSprite.relativeCode = this.code;
		this.colorBGSprite.updateCurrentStyle({"_opacity":1});
		this.setTextWithFormat(this.prizeTextLevel_1, this.prices[1]);
		this.setTextWithFormat(this.prizeTextLevel_2, this.prices[2]);
		this.setTextWithFormat(this.prizeTextLevel_3, this.prices[3]);
		this.resetAllPrizeTextStyle();
		this.updatePrizeTextAccordingly();
	};
	PriceTableElement.prototype.onMouseOverHandler = function () {
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.MOUSE_OVER_PRIZEDETAILS);
		this.displayPrizeTableAccordingly();
	};

	PriceTableElement.prototype.onMouseOutHandler = function (){
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.MOUSE_OUT_PRIZEDETAILS);
	};

	PriceTableElement.prototype.onMouseDownHandler = function () {
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.PRESSED_PRIZEDETAILS);
		this.displayPrizeTableAccordingly();
	};
	/*PriceTableElement.prototype.onClickHandler = function () {
		this.onMouseOverHandler();
	};*/
	PriceTableElement.prototype.isPortrait = function (){
		return gr.getSize().height > gr.getSize().width;
	};
	PriceTableElement.prototype.initLevelUpAnimation = function (){
		this.levelUpAnimation = new KeyFrameAnimation({
			"_name": this.code+'_levelUpAnimation',
			"tweenFunc": TweenFunctions.easeOutBounce,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.prizeTable_levelUpAnimationDuration,
					"_SPRITES": []
				}
			]
		});
		this.levelUpAnimation._onComplete = new CallbackFunc(this, this.levelUpAnimationOnComplete);
		this.levelUpAnimation._onUpdate = new CallbackFunc(this, this.levelUpAnimationOnUpdate);
		this.levelUpAnimation.queuingCallback = new CallbackFunc(this, this.startLevelUpAnimation);
		this.levelUpAnimation.level = 0;
		this.levelUpAnimation.isDelaying = false; 
	};
	PriceTableElement.prototype.startLevelUpAnimation = function() {
		if(this.levelUpAnimation.isPlaying() === false && this.levelUpAnimation.isDelaying === false){
			this.levelUpAnimation.play();
			
			//keep play win animtion on planet
			this.planet.gotoAndPlay(config.symbolsMap[this.code]+"x_win", 0.2);
			this.planet.isOnWinning = true;
			this.planetGlory.show(true);
			this.planetGlory.gotoAndPlay('CollectFlash', 0.2, true);
			this.playSoundByConfig("PlanetWin");
			this.onMouseDownHandler();
		}
	};

	PriceTableElement.prototype.levelUpAnimationOnUpdate = function(obj){
		const tweenFunc = this.levelUpAnimation.animData.tweenFunc;
		const duration = this.levelUpAnimation.maxTime;
		const timeDelta = Math.ceil(obj.time);
		let Ypos = tweenFunc(timeDelta, this.levelText_current.orgPosY, this.levelText_current.orgPosY - 50, duration);
		this.levelText_current.updateCurrentStyle({"_top": Ypos});

		Ypos = tweenFunc(timeDelta, this.levelText_next.orgPosY, this.levelText_current.orgPosY, duration);
		this.levelText_next.updateCurrentStyle({"_top": Ypos});
		
		Ypos = tweenFunc(timeDelta, this.levelText_hidden.orgPosY, this.levelText_next.orgPosY, duration);
		this.levelText_hidden.updateCurrentStyle({"_top": Ypos});
	};
	PriceTableElement.prototype.levelUpAnimationOnComplete = function() {
		this.levelUpAnimation.level++;
		const [current, next, hidden] = this.getPricesAccordingly();
		if(config.style.priceTablePriceLevel0_win){
			this.updateTextStyle(this.levelText_current,config.style.priceTablePriceLevel0_win);
		}		
		this.setTextWithFormat(this.levelText_current, current);
		this.setTextWithFormat(this.levelText_next, next);
		this.setTextWithFormat(this.levelText_hidden, hidden);
		this.textsReturnInstantly();
		if(this.colorBGSprite.relativeCode === this.code){
			this.resetAllPrizeTextStyle();
			this.updatePrizeTextAccordingly(this.levelUpAnimation.level);
		}
		if(this.levelUpAnimation.level !== this.currentLevelNum){
			this.levelUpAnimation.isDelaying = true; // it is currently waiting for the gr.getTimer().setTimeout, will get called after the delay
			const _this = this;
			gr.getTimer().setTimeout(function (){
				_this.levelUpAnimation.isDelaying = false;
				_this.levelUpAnimation.play();
			},config.timers.prizeTable_levelUpTextDisplayMinimum);
		}
	};
	PriceTableElement.prototype.updateTextStyle = function(sourceObj, style){
		let newStyle = {_text:{}};
		if(typeof style.fontSize !== 'undefined'){
			newStyle._font = {"_size": style.fontSize};
		}
		if(typeof style.fill !== "undefined"){
			newStyle._text._color =  style.fill.replace('#', "");
		}
		if(typeof style.strokeColor !== "undefined"){
			newStyle._text._strokeColor = style.strokeColor.replace('#', "");
		}
		if(typeof style.dropShadow !== 'undefined'){
			gameUtils.setTextStyle(sourceObj, style);
		}
		sourceObj.updateCurrentStyle(newStyle);
	};
	PriceTableElement.prototype.textsReturnInstantly = function() {
		this.levelText_current.updateCurrentStyle({"_top":this.levelText_current.orgPosY});
		this.levelText_next.updateCurrentStyle({"_top":this.levelText_next.orgPosY});
		this.levelText_hidden.updateCurrentStyle({"_top":this.levelText_hidden.orgPosY});
	};
	PriceTableElement.prototype.getPricesAccordingly = function (){
		switch(this.levelUpAnimation.level){
			case 0: 
				return [this.prices[0], this.prices[1], this.prices[2]];
			case 1:
				return [this.prices[1], this.prices[2], this.prices[3]];
			case 2:
				return [this.prices[2], this.prices[3], null];
			case 3:
				return [this.prices[3], null, null];
		}
	};
	PriceTableElement.prototype.resetAll = function (){
		if(config.style.priceTablePriceLevel0){
			this.updateTextStyle(this.levelText_current, config.style.priceTablePriceLevel0);
		}
		if(config.style.priceTablePriceLevel1){
			this.updateTextStyle(this.levelText_next, config.style.priceTablePriceLevel1);
		}
		if(config.style.priceTablePriceLevel2){
			this.updateTextStyle(this.levelText_hidden, config.style.priceTablePriceLevel2);
		}
		this.currentLevelNum = 0;
		this.achievedNum = 0;
		this.achievedNum_old = 0;
		this.levelUpAnimation.level = 0;
		this.levelText_current.setText(0);
		this.setTextWithFormat(this.levelText_next, this.prices[1]);
		this.setTextWithFormat(this.levelText_hidden, this.prices[2]);
		this.levelText_current.show(true);
		this.levelText_next.show(true);
		this.levelText_hidden.show(true);
		this.setAchievedValue(0, true);
		this.planetGlory.stopPlay();
		this.planetGlory.show(false);
		this.planet.stopPlay();
		this.colorBGSprite.relativeCode = "";
		if(this.code){
			this.planet.setImage(config.symbolsMap[this.code]+"x_0019");
			if(config.style.priceTableRollingUpText){
				this.updateTextStyle(this.achievedTextSprite,config.style.priceTableRollingUpText);
			}
		}
		this.planet.isOnWinning = false;
	};
	PriceTableElement.prototype.queue = function (callbackObj, paramObj){
		gr.getTimer().setTimeout(function (){
			callbackObj.handler.call(callbackObj.subscriberRef, paramObj);
		}, 500);
	};
	PriceTableElement.prototype.setAchievedValue = function (val, isInstant = false){
		val = val*1;
		this.achievedNum_old = this.achievedNum;
		this.achievedNum += val;
		let newLevelNum = -1;
		if(this.achievedNum < this.levels[0]){
			//under 10
			newLevelNum = 0;
			this.setTargetValue(loader.i18n.Game["price_level0"]);
		}
		else{
			if(this.achievedNum < this.levels[1]){
				// between 10 and 13
				newLevelNum = 1;
				this.setTargetValue(loader.i18n.Game["price_level1"]);
			}
			else{
				//set target to 16
				if(this.achievedNum < this.levels[2]){
					newLevelNum = 2;
				}
				else{
					newLevelNum = 3;
				}
				this.setTargetValue(loader.i18n.Game["price_level2"]);
			}
		}
		this.rollingUpAchievedText();
		//this.achievedTextSprite.setText(this.achievedNum);
		if(isInstant == false){
			this.zoomInPlanetAndFlash();
		}
		if(newLevelNum !== this.currentLevelNum){
			this.currentLevelNum = newLevelNum;
			this.startLevelUpAnimation();
		}
	};
	PriceTableElement.prototype.rollingUpAchievedText = function() {
		if(this.achievedNum && (this.achievedNum - this.achievedNum_old > 1)){
			//it is not 0, rolling up
			if(this.rollingUpTween){
				this.rollingUpTween.play();
			}
			else{
				this.initRollingUpTween();
			}
		}
		else{
			// it is 0, just update
			if(this.achievedNum !== 0){
				this.playSoundByConfig("PlanetRollingUp");
			}
			this.achievedTextSprite.setText(this.achievedNum);
			if((this.achievedNum > 9) && config.style.priceTableRollingUpTextWin){
				this.updateTextStyle(this.achievedTextSprite,config.style.priceTableRollingUpTextWin);
			}
			this.achievedNum_old = this.achievedNum;
		}
		
	};
	PriceTableElement.prototype.initRollingUpTween = function (){
		this.rollingUpTween = new KeyFrameAnimation({
			"_name": 'rollingUpTweenKey'+this.code,
			"tweenFunc":  TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.prizeTable_AchievedNumberrollingUpDuration,
					"_SPRITES": []
				}
			]
		});
		this.rollingUpTween._onUpdate = new CallbackFunc(this, this.rollingUpOnUpdate);
		this.rollingUpTween._onComplete = new CallbackFunc(this, this.rollingUpOnComplete);
		this.rollingUpTween.play();
	};
	PriceTableElement.prototype.rollingUpOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let value = parseInt(tweenFunc(timeDelta, this.achievedNum_old, this.achievedNum, duration));
		if(value !== this.achievedTextSprite.getText()*1){
			this.playSoundByConfig("PlanetRollingUp");
			this.achievedTextSprite.setText(value);
			this.achievedTextSprite.updateCurrentStyle({"_transform":{"_scale":{"_x":1.4, "_y":1.4}}});
			//change text colour to gold
			if((value > 9) && config.style.priceTableRollingUpTextWin){
				this.updateTextStyle(this.achievedTextSprite,config.style.priceTableRollingUpTextWin);
			}
		}
	};
	PriceTableElement.prototype.rollingUpOnComplete = function (){
		this.achievedTextSprite.updateCurrentStyle({"_transform":{"_scale":{"_x":1, "_y":1}}});
		this.achievedNum_old = this.achievedNum;
	};
	PriceTableElement.prototype.getWinningAmount = function (){
		return this.prices[this.currentLevelNum];
	};
	PriceTableElement.prototype.zoomInPlanetAndFlash = function (){
		//this.planet.updateCurrentStyle({"_transform":{"_scale":{"_x":1.2, "_y":1.2}}});
		if(this.planet.isOnWinning){
			//the price has won.
			this.planet.gotoAndPlay(config.symbolsMap[this.code]+"x_highLightAndWon", 0.3);
		}
		else{
			//the price hasn't win yet.
			this.planet.gotoAndPlay(config.symbolsMap[this.code]+"x_highLight", 0.3);

		}
	};
	PriceTableElement.prototype.zoomOutPlanet = function (){
		//this.planet.updateCurrentStyle({"_transform":{"_scale":{"_x":1, "_y":1}}});
		this.planetGlory.show(false);
	};
	PriceTableElement.prototype.setTargetValue = function (val){
		this.targetText.setText(val*1);
	};
	PriceTableElement.prototype.initText = function (){
		this.levelText_current.orgPosY 	= this.levelText_current.getCurrentStyle()._top;
		this.levelText_next.orgPosY 	= this.levelText_next.getCurrentStyle()._top;
		this.levelText_hidden.orgPosY 	= this.levelText_hidden.getCurrentStyle()._top;
		this.initLevelUpAnimation();
		this.resetAll();
	};
	PriceTableElement.prototype.updateText = function (data){
		const levelNum = data.description.substr(-1) * 1;
		this.prices[(this.prices.length-levelNum)] = data.prize; // set the index reversely 
		switch (this.levelUpAnimation.level){
			case 0:
				this.setTextWithFormat(this.levelText_next, this.prices[1]);
				this.setTextWithFormat(this.levelText_hidden, this.prices[2]);
				if(this.colorBGSprite.relativeCode === this.code){
					this.setTextWithFormat(this.prizeTextLevel_1, this.prices[1]);
					this.setTextWithFormat(this.prizeTextLevel_2, this.prices[2]);
					this.setTextWithFormat(this.prizeTextLevel_3, this.prices[3]);
				}
				break;
			case 1:
				this.setTextWithFormat(this.levelText_next, this.prices[2]);
				this.setTextWithFormat(this.levelText_hidden, this.prices[3]);
				break;
			case 2:
				this.setTextWithFormat(this.levelText_next, this.prices[3]);
				this.setTextWithFormat(this.levelText_hidden, this.prices[3]);
				break;
		}

		if(this['levelText'+levelNum]){
			const prize = data.prize;
			this['levelText'+levelNum].setText(SKBeInstant.formatCurrency(prize).formattedAmount);
		}
	};
	PriceTableElement.prototype.setTextWithFormat = function(sourceObj, val) {
		if(val !== null){
			sourceObj.setText(SKBeInstant.formatCurrency(val).formattedAmount);
		}
		else{
			sourceObj.show(false);
		}
	};
	PriceTableElement.prototype.playSoundByConfig = function(soundName, isloop = false){
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
	return PriceTableElement;
});