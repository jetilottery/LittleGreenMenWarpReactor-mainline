/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-07-18 18:24:58
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2020-05-09 13:54:45
*/
define(function module(require){
	const Reel = require('game/component/reel');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const TweenFunctions = require('game/utils/tweenFunctions');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const LittleGreenMenGameEvent = require('game/events/littleGreenMenGameEvent');
	const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const SKBeInstant	= require('skbJet/component/SKBeInstant/SKBeInstant');
	const config = require('game/configController');
	const CallbackFunc = require('game/component/callbackFunc');
	function inherit (subType, superType){
		function F(){}
		F.prototype = superType.prototype;
		var prototype = new F();
		prototype.constructor = subType;
		subType.prototype = prototype;
	}
	function ReelH (data){
		this.stopPosition = -1;
		this.isStopping = false;
		this.isLastAnimation = false;
		this.currentStripPostion = 0; // the first symbol of this reel is taking the symbol code from this.reelSymbolStrip[this.currentStripPosition]
		this.instantWinValue = 0;
		this.reelSymbolStrip = [];
		this.reelStripLenth = 20;
		this.spinDurationData = {acc:config.timers.standard_spinBounceUpDuration, cons: config.timers.standard_spinPerSymbolMovementDuration, dec: config.timers.standard_spinStopDuration, stopCountDown:-1};
		this.symbolsPool = {"A0":true, "B0":true, "C0":true, "D0":true, "E0":true, "F0":true, "IW0":true, "X0":true, reception:["A0", "B0", "C0", "D0", "E0", "F0", "IW0", "X0"]};
		this.haloSpriteUp = null;
		this.haloSpriteDown = null;
		this.symDistance = 92;
		this.reelSpinKeyFrameAnim = null;
		this.reelSpinStatus = "";
		this.onCompleteCallback_acc = null;
		this.onCompleteCallback_cons = null;
		this.onCompleteCallback_dec = null;
		this.onUpdateCallback_acc = null;
		this.onUpdateCallback_cons = null;
		this.explosionSprite = null;
		this.starSprite = null;
		this.stripMap = null;
		this.planetFireEvent = null;
		this.earthQuakeKeyFrameAnim = null;
		this.currentStake = null;
		Reel.call(this, data);
		this.name = 'ReelH';
	}
	inherit(ReelH, Reel);
	//ReelH.name = 'ReelH';
	/*
		Overwritting Reel.prototype.init
	*/
	ReelH.prototype.init = function (data){
		Reel.prototype.init.call(this, data);
		this.planetFireEvent = LittleGreenMenGameEvent.eventIDs.PLANET_FIRE;
		this.haloSpriteUp = gr.lib['_halo'+this.orderInReelset];
		this.haloSpriteDown = gr.lib['_halo0'+this.orderInReelset];
		this.currentStake = SKBeInstant.config.gameConfigurationDetails.pricePointGameDefault;
		this.offPosition.x = data.offPositionX[0];
		this.earthQuakeKeyFrameAnim = gr.animMap._earthQuake;
		if(this.isRollingToLeft() === false){
			//visually second, fourth reel; index 1 , 3; running from right to left, by set scaleX -1;
			const x = (this.isPortrait())?796:2193;
			this.reelObj.updateCurrentStyle({_transform:{_scale:{_x:-1}}, _left:x});
			this.haloSpriteUp.updateCurrentStyle({_transform:{_scale:{_x:-1}}, _left:0}); 
			this.haloSpriteDown.updateCurrentStyle({_transform:{_scale:{_x:-1}}, _left:0}); 
		}
		this.haloSpriteUp.updateCurrentStyle({_opacity:0});
		this.haloSpriteDown.updateCurrentStyle({_opacity:0});
		this.symbolsMap['X'] = 'x07';
		this.initialReelSymbols();
	};
	ReelH.prototype.updateCurrentStake = function (prizePoint){
		this.currentStake = prizePoint;
	};
	ReelH.prototype.isPortrait = function (){
		return gr.getSize().height > gr.getSize().width;
	};
	ReelH.prototype.genRandomReelStrip = function (){
		/*
		 Originally , we are generate random strip each round, and here below are the random implementation.
		 after discussion with Amanda Liu, we agreed to hardcode the reel strip.

		let symCode; //numOfIW = 0, numOfX = 0,
		for(let i = 0 ; i < this.reelStripLenth ; i++){
			symCode = this.symbolsPool.reception[Math.floor(Math.random()*(this.symbolsPool.reception.length))];
			this.reelSymbolStrip.push(symCode);
		}
		*/
		if(!this.stripMap){
			this.stripMap = [
				["X0", 	"E0", "B0", "A0", "X0", "C0", 	"D0", "IW0", 	"IW0", "F0", "E0",  "C0",  "A0", "F0", "B0", "E0", "B0", "C0", "E0", "A0"],
				["A0", 	"B0", "C0", "E0", "X0", "D0", 	"F0", "IW0", 	"E0", "E0",  "C0",  "C0",  "B0", "D0", "A0", "B0", "C0", "F0", "IW0", "F0"],
				["C0", 	"X0", "F0", "D0", "X0", "A0", 	"E0", "B0", 	"A0", "E0",  "IW0", "A0",  "B0", "D0", "F0", "C0", "F0", "A0", "IW0", "X0"],
				["IW0", "A0", "B0", "F0", "X0", "IW0", 	"E0", "D0", 	"C0", "A0",  "B0",  "IW0", "A0", "C0", "D0", "E0", "A0", "B0", "B0", "A0"],
				["X0", 	"C0", "F0", "E0", "X0", "D0", 	"A0", "X0", 	"B0", "F0",  "A0",  "X0",  "C0", "B0", "X0", "C0", "E0", "D0", "C0", "B0"]
			];
		}
		this.reelSymbolStrip = Object.assign([], this.stripMap[this.getReelOrderNum()]);
	};
	ReelH.prototype.initialReelSymbols = function (){
		this.genRandomReelStrip();
		this.updateSymbols();
		this.setupExplosionSprite();
	};
	ReelH.prototype.reset = function (){
		//show the centered symbol, set the scale back to 1 in case it was hidden from a previous play
		this.zoomInCenterSymbol(1);

		this.iWinTextSprite.show(false);
		this.isStopping = false;
		this.isLastAnimation = false;
		this.stopPosition = -1;
		this.currentStripPostion = 0;
		this.spinDurationData.stopCountDown = -1;
		this.initialReelSymbols(); // reset all symbols back to original.
	};
	ReelH.prototype.setupExplosionSprite = function (){
		this.starSprite = gr.lib['_bonusCStar'+this.getReelOrderNum()];
		this.starSprite.stopPlay();
		this.starSprite.show(false);

		this.explosionSprite = gr.lib['_bonusC'+this.getReelOrderNum()];
		this.explosionSprite.stopPlay();
		this.explosionSprite.show(false);

		this.iWinTextSprite = gr.lib['_bonusIW_text'+this.getReelOrderNum()];
		this.iWinTextSprite.show(false);
	};
	ReelH.prototype.updateSymbols = function (){
		let symbol;
		let stripPosition = 0;
		this.currentStripPostion %= this.reelSymbolStrip.length;
		if(this.stopPosition !== -1 && this.isStopping === true){ 
			// stop reel has been called
			for(let i = 0 ; i < this.symbols.reception.length ; i++){
				symbol = this.getSymbolAtIndex(i);
				if( i >= this.spinDurationData.stopCountDown ){
					stripPosition = (this.stopPosition + i - this.spinDurationData.stopCountDown);
					stripPosition %= this.reelSymbolStrip.length;
				}
				else{
					stripPosition = (this.currentStripPostion+i);
					stripPosition %= this.reelSymbolStrip.length;
				}
				const item = this.reelSymbolStrip[stripPosition];
				const [symcode, bonuscode] = item.match(new RegExp('[^0-9]+|[0-9]+','g'));
				symbol.applySymbolCode(symcode);
				symbol.applyBonusCode(bonuscode);
				symbol.setOffPos({x:this.offPositionX});
				symbol.moveTo(symbol.getOriginalPos());
			}
		}
		else{
			// stop reel has not been called;
			for(let i = 0 ; i < this.symbols.reception.length ; i++){
				symbol = this.getSymbolAtIndex(i);
				stripPosition = (this.currentStripPostion+i) % this.reelSymbolStrip.length;
				const [symcode, bonuscode] = this.reelSymbolStrip[stripPosition].match(new RegExp('[^0-9]+|[0-9]+','g'));
				symbol.applySymbolCode(symcode);
				symbol.applyBonusCode(bonuscode);
				symbol.setOffPos({x:this.offPositionX});
				symbol.moveTo(symbol.getOriginalPos());
			}
		}
	};
	/*
		Overwritting Reel.prototype.moveSymbolsOffInstantly
	*/
	ReelH.prototype.moveSymbolsOffInstantly = function (){
		let symbol = null;
		for(const symKey of this.symbols.reception){
			symbol = this.symbols[symKey];
			symbol.goOffInstantlyOnX();
		}
	};
	/*
		there are three stage of the spin
		accelerating : use TweenFunctions.easeInElastic to get the backwards and accelerate effection, this stage will run 1 round only, then it will connect with an Uniform speed animation
		constant speed: use TweenFunctions.linear to get a constant speed animation, it can be looped until a reelStop function call in.
		decelerate: use TweenFunctions.easeOutElastic to get a bounce and decelerate effect. and stop eventually
	*/
	ReelH.prototype.spin = function(sc) {
		if(!this.reelSpinKeyFrameAnim){
			this.initReelSpinAnimation();
		}
		//this.reelSymbolStrip = this.reelSymbolStrip.splice(0, this.reelStripLenth); // clear the added symbol from previous round make sure the length of the strip is this.reelStripLenth + 1.
		this.genRandomReelStrip(); // restore the reelSymbolStrip. it will reset the reelstrip to the default value.
		this.stopPosition = Math.floor(Math.random()*(this.reelSymbolStrip.length-7))+7; // random a number between 7 to this.reelSymbolStrip.length.
		if(this.symbolsPool[sc+"0"] === true){
			// sc is not the iw symbol, it can be pushed in directly.
			this.reelSymbolStrip.splice(this.stopPosition, 0, sc+"0"); // insert the result at stopPosition.
		}
		else{
			// sc is valued either 1, 2 or 3, refers to IW1, IW2 and IW3, here will correct it, and push it in;
			this.reelSymbolStrip.splice(this.stopPosition, 0, "IW0"); // insert the result at stopPosition.
			let iwPrice = 0;
			if(SKBeInstant){
				const gameConfig = SKBeInstant.config.gameConfigurationDetails;
				const prizeTable = gameConfig.revealConfigurations;
				const currentPrize = prizeTable.find(prize => prize.price === this.currentStake);
				const iwItem = currentPrize.prizeTable.find(item => item.description == 'IW'+sc);
				iwPrice = iwItem.prize;
			}
			//set the value for the IW symbol, the text will show after the explosion animation complete.
			this.instantWinValue = iwPrice;
			this.iWinTextSprite.setText(SKBeInstant.formatCurrency(iwPrice).formattedAmount);
		}
		this.adjustReelSpinAnimation("accelerate");
		this.reelSpinKeyFrameAnim.play();
	};
	ReelH.prototype.initReelSpinAnimation = function (){
		this.reelSpinKeyFrameAnim = new KeyFrameAnimation({
			"_name": this.id+'reelSpinAnimation',
			"tweenFunc": TweenFunctions.easeInElastic,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": 1, // this figure will be changed before the animation is played. so it doesn't matter.
					"_SPRITES": []
				}
			]
		});
		this.onUpdateCallback_acc 		= new CallbackFunc(this, this.reelSpinBounceOnUpdate);
		this.onCompleteCallback_acc 	= new CallbackFunc(this, this.reelSpinAccelerateOnComplete);
		
		this.onUpdateCallback_cons 		= new CallbackFunc(this, this.reelSpinConstantOnUpdate);
		this.onCompleteCallback_cons 	= new CallbackFunc(this, this.reelSpinConstantOnComplete);

		this.onCompleteCallback_dec 	= new CallbackFunc(this, this.reelSpinDecelerateComplete);
	};
	ReelH.prototype.adjustReelSpinAnimation = function (state){
		switch (state){
			case "accelerate": //accelerate
				this.reelSpinStatus = "accelerate";
				this.reelSpinKeyFrameAnim.animData.tweenFunc = TweenFunctions.easeOutSine;
				this.reelSpinKeyFrameAnim.maxTime = this.spinDurationData.acc;
				this.reelSpinKeyFrameAnim._onUpdate = this.onUpdateCallback_acc;
				this.reelSpinKeyFrameAnim._onComplete = this.onCompleteCallback_acc;
				break;
			case "decelerate": //decelerate
				this.reelSpinStatus = "decelerate";
				this.reelSpinKeyFrameAnim.animData.tweenFunc = TweenFunctions.easeOutBack;
				this.reelSpinKeyFrameAnim.maxTime = this.spinDurationData.dec;
				this.reelSpinKeyFrameAnim._onUpdate = this.onUpdateCallback_cons;
				this.reelSpinKeyFrameAnim._onComplete = this.onCompleteCallback_dec;
				break;
			default: // constant
				this.reelSpinStatus = "constant";
				this.reelSpinKeyFrameAnim.animData.tweenFunc = TweenFunctions.linear;
				this.reelSpinKeyFrameAnim.maxTime = this.spinDurationData.cons;
				this.reelSpinKeyFrameAnim._onUpdate = this.onUpdateCallback_cons;
				this.reelSpinKeyFrameAnim._onComplete = this.onCompleteCallback_cons;
		}
	};
	ReelH.prototype.reelSpinBounceOnUpdate = function(obj) {
		const tweenFunc = obj.caller.animData.tweenFunc;
		const timeDelta = Math.ceil(obj.time);
		const duration = obj.caller.maxTime;
		const startValue = 0;
		let targetValue = 40;
		let offsetX = tweenFunc(timeDelta, startValue, targetValue, duration);
		let symbol;
		for(let i = 0 ; i < this.symbols.reception.length ; i++){
			symbol = this.getSymbolAtIndex(i);
			symbol.moveTo({x: symbol.getOriginalPos().x + offsetX});
		}
		//this.haloSpriteOnBounceUpdate(timeDelta, duration);
	};

	ReelH.prototype.reelSpinConstantOnUpdate = function(obj) {
		const tweenFunc = obj.caller.animData.tweenFunc;
		const timeDelta = Math.ceil(obj.time);
		const duration = obj.caller.maxTime;
		const startValue = 0;
		let targetValue = this.symDistance;
		let offsetX = tweenFunc(timeDelta, startValue, targetValue, duration);
		offsetX *= (-1);
		let symbol;
		// let firstSymbolX = 0;
		for(let i = 0 ; i < this.symbols.reception.length ; i++){
			symbol = this.getSymbolAtIndex(i);
			symbol.moveTo({x: symbol.getOriginalPos().x + offsetX});
			// if(i==0){
			// 	firstSymbolX = symbol.getCurrentPos().x;
			// }
		}
		// this.haloSpriteOnConstantUpdate(timeDelta, duration, firstSymbolX);
	};
	ReelH.prototype.reelSpinAccelerateOnComplete = function (){
		this.adjustReelSpinAnimation("constant");
		const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.reelSpinKeyFrameAnim.play();
		},0);
	};
	ReelH.prototype.reelSpinConstantOnComplete = function (){
		if(this.isStopping === false){
			this.adjustReelSpinAnimation("constant");
		}
		else{
			this.spinDurationData.stopCountDown--; // this auto minus will avoid this.symbols.reception.length value never get by passed, therefore prevent index out of boundary 
			if(this.spinDurationData.stopCountDown !== 1){
				this.adjustReelSpinAnimation("constant");
				//reduce the reel spinning speed gradually, to slow down the rolling animaiton and stop eventually.
				this.reelSpinKeyFrameAnim.maxTime += (this.symbols.reception.length - this.spinDurationData.stopCountDown) * config.timers.standard_spinStopSlowingMultiplier;
			}
			else{
				this.adjustReelSpinAnimation("decelerate");
			}
		}
		this.currentStripPostion++;
		this.updateSymbols();
		this.reelSpinKeyFrameAnim.play();		
	};
	ReelH.prototype.reelSpinDecelerateComplete = function(){
		this.isStopping = false;
		this.currentStripPostion = this.stopPosition;
		this.updateSymbols();
		this.zoomInCenterSymbol(1.1);
		if(this.id === 'h4'){
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ALL_REELS_STOPPED);
		}
	};
	ReelH.prototype.zoomInCenterSymbol = function (val = 1){
		const symbol = this.getSymbolAtIndex(4);
		symbol.scale(val);
		symbol.show(); 
	};
	ReelH.prototype.haloSpriteOnBounceUpdate = function (timeDelta, duration){
		const tweenFunc = TweenFunctions.linear;
		const xStartValue = 796;
		const xTargetValue = 0;
		const opacityStartValue = 0;
		const opacityTargetValue = 0.8;
		let currentX;
		if(this.isRollingToLeft() === true){ //0,2,4 reel
			currentX = tweenFunc(timeDelta, xStartValue, xTargetValue, duration);
		}
		else{ //1,3 reel
			currentX = tweenFunc(timeDelta, -xStartValue, xTargetValue, duration);
		}
		/*if(this.getReelOrderNum()*1 == 1){
			console.log(currentX);
		}*/
		const currentOpacity = tweenFunc(timeDelta, opacityStartValue, opacityTargetValue, duration);
		this.haloSpriteUp.updateCurrentStyle({"_left":currentX, "_opacity": currentOpacity});
		this.haloSpriteDown.updateCurrentStyle({"_left":currentX, "_opacity": currentOpacity});
	};
	ReelH.prototype.haloSpriteOnConstantUpdate = function (timeDelta, duration, firstSymbolX){
		const tweenFunc = TweenFunctions.linear;
		let currentX;
		if(this.isRollingToLeft() === true){//0,2,4 reel
			currentX = firstSymbolX;
		}
		else{//1,3 reel
			currentX = firstSymbolX * (-1);
		}
		this.haloSpriteUp.updateCurrentStyle({"_left":currentX});
		this.haloSpriteDown.updateCurrentStyle({"_left":currentX});
		if(this.spinDurationData.stopCountDown === 1){
			const opacityStartValue = 0.8;
			const opacityTargetValue = 0;
			const currentOpacity = tweenFunc(timeDelta, opacityStartValue, opacityTargetValue, duration);
			this.haloSpriteUp.updateCurrentStyle({"_opacity": currentOpacity});
			this.haloSpriteDown.updateCurrentStyle({"_opacity": currentOpacity});
		}
	};
	/*
		Overwritting Reel.prototype.presentWinSymbolAnimation
	*/
	ReelH.prototype.presentWinSymbolAnimation = function (){
		const cSymbol = this.getSymbolAtIndex(4);
		if(cSymbol.getSymbolCode() !== "X"){
			this.starSprite.show(true);
			this.starSprite.gotoAndPlay("warpBonusStar", 0.3);
			const _this = this;
			this.starSprite.onComplete = function (){
				_this.starSprite.show(false);
				_this.playExplosionAnimation();
			};
		}
	};
	ReelH.prototype.isNotEmptySymbol = function() {
		const cSymbol = this.getSymbolAtIndex(4);
		return (cSymbol.getSymbolCode() !== "X");
	};
	ReelH.prototype.playExplosionAnimation = function (){
		this.earthQuakeKeyFrameAnim.play();
		const cSymbol = this.getSymbolAtIndex(4);
		cSymbol.hide(false);
		const symbolCode = cSymbol.getSymbolCode();
		if(symbolCode != 'IW'){
			// need to add the planets up in priceTable
			let evt = {reception:[]};
			evt[symbolCode] = 1;
			evt.reception.push(symbolCode);
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.PRICETABLE_FIGURE_UPDATE, evt);
			if(symbolCode !== 'X'){
				msgBus.publish(this.planetFireEvent, {"pos": cSymbol.getOriginalPos(), "symbolCode": cSymbol.getSymbolCode()});
			}
		}
		this.explosionSprite.show(true);
		this.explosionSprite.gotoAndPlay('warpBonusExplosion', 0.2);
		const _this = this;
		this.explosionSprite.onComplete = function (){
			_this.explosionOnComplete();
		};
		if(cSymbol.getSymbolCode() === 'IW'){
			// play the price pop up animation
			if(!this.iWinTextSprite.KeyFrameAnim){
				this.initPricePopUpAnimation();
			}
			this.iWinTextSprite.KeyFrameAnim.play();
			this.iWinTextSprite.show(true);
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.METER_ADD_INSTANTWIN_WINNING, this.instantWinValue);
		}

	};

	ReelH.prototype.explosionOnComplete = function (){
		this.explosionSprite.show(false);
		if(this.isTheLastAnimationReel()){
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ALL_WIN_SEQUENCE_COMPLETED);
		}
	};
	ReelH.prototype.setTheLastAnimationReel = function (){
		this.isLastAnimation = true;
	};
	ReelH.prototype.isTheLastAnimationReel = function (){
		return this.isLastAnimation;
	};
	ReelH.prototype.initPricePopUpAnimation = function (){
		this.iWinTextSprite.KeyFrameAnim = new KeyFrameAnimation({
			"_name": this.iWinTextSprite.getName()+'popUpAnimation',
			"tweenFunc": TweenFunctions.easeInElastic,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": [
						{
							"_name": this.iWinTextSprite.getName(),
							"_style": {
								"_transform":{
									"_scale":{
										"_x":0.01,
										"_y":0.01
									},
									"_rotate": 1,
								}
							}
						}
					]
				},
				{
					"_time": config.timers.standard_instantWinPricePopupDuration,
					"_SPRITES": [
						{
							"_name": this.iWinTextSprite.getName(),
							"_style": {
								"_transform":{
									"_scale":{
										"_x":1,
										"_y":1
									},
									"_rotate":720,
								}
							}
						}
					]
				}
			]
		});
	};
	/*
		@stopPos [number] between 0 ~ (this.reelSymbolStrip.length - 1);
		for a random reel symbol generation, default 20.
		but for a real constant reel with predefined reel symbol strip, and it use the stop postion to control which symbol will landing, therefore you pass in the stopPos,
		and the stopPos passed in should be associate with the center one on the reel.
	*/
	ReelH.prototype.stopReel = function (){ //(stopPos = 20){
		this.isStopping = true;
		//making the stopPosition to the centre of the reel by shifting half of the total number of the symbols in the reel.
		this.stopPosition = this.stopPosition - parseInt(this.symbols.reception.length * 0.5) + this.reelSymbolStrip.length;
		this.stopPosition %= this.reelSymbolStrip.length;
		this.spinDurationData.stopCountDown = this.symbols.reception.length;
	};
	ReelH.prototype.isRollingToLeft = function (){
		return (this.getReelOrderNum() % 2 == 0);
	};

	return ReelH;
});


