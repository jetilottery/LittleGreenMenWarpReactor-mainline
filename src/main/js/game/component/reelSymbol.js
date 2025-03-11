/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-06-24 20:39:08
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-10-16 09:04:39
*/
define(function module(require){
	//let	PIXI = require('com/pixijs/pixi');
	const Sprite = require('skbJet/component/gladPixiRenderer/Sprite');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const config = require('game/configController');
	const LittleGreenMenGameEvent	= require('game/events/littleGreenMenGameEvent');
	const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	//const CallbackFunc = require('game/component/callbackFunc');
	function ReelSymbol(data){
		this.mainSprite = data.sourceObj;
		this.honeycombDisplay = null;
		this.planetDisplay = null;
		this.bonusDisplay = null;
		this.explosionDisplay = null;
		this.id = this.mainSprite.getName();
		this.orgPosition = {x:0, y:0};
		this.offPosition = {x:-1, y:-1};
		this.orderIndex = null;
		this.parentReelId = null;
		this.symbolsMap = null;
		this.ufoFireEvent = null;
		this.planetFireEvent = null;
		this.currentSymbolCode = "";
		this.currentBonusCode = "";
		this.currentAnimName = "";
		this.animGap = false;
		this.init(data);
	}
	ReelSymbol.prototype.init = function (data){
		this.orgPosition.x = this.mainSprite.getCurrentStyle()._left;
		this.orgPosition.y = this.mainSprite.getCurrentStyle()._top;
		this.parentReelId = data.ReelId;
		this.orderIndex = data.symOrderIndex;
		this.symbolsMap = data.symbolsMap;
		if(data.symOffPositionX){
			this.offPosition.y = data.symOffPositionY;
		}
		if(data.symOffPositionY){
			this.offPosition.y = data.symOffPositionY;
		}
		this.planetFireEvent = LittleGreenMenGameEvent.eventIDs.PLANET_FIRE;
		this.createHoneyCombDisplay();
		this.hideHoneyComb();
		this.createPlanetDisplay();
		this.createBonusDisplay();
		this.hideBonusDisplay();
		this.createExplosionDisplay();
		this.hideExplosionDisplay();
	};
	/*
		create a new planetDisplay for the actuall planet displayed on the screen, this sprite is a child of mainSprite.
		and removed the _imagePlate for the reel element such as gr.lib.r0s0, therefore the r0s0 sprite became a container of the symbol. 
	*/
	ReelSymbol.prototype.createPlanetDisplay = function (){
		this.planetDisplay = new Sprite({
			"_name": this.id+'_planet',
			"_SPRITES": [],
			"_style":{
				"_width":"120",
				"_height":"120",
				"_top": 0,
				"_left":0,
				"_background":{
					"_imagePlate":"x06"
				}
			},
		});
		this.mainSprite.pixiContainer.addChild(this.planetDisplay.pixiContainer);
		this.mainSprite.setImage('x07');
	};
	ReelSymbol.prototype.showHoneyComb = function (){
		this.honeycombDisplay.setImage('BottomGlow_'+this.symbolsMap[this.getSymbolCode()]);
		this.honeycombDisplay.show(true);
	};
	/*
		for action bonus to use turn on a static colour honeycomb in one spinning group.
	*/
	ReelSymbol.prototype.applyStaticHoneyComb = function (colourCode){
		this.honeycombDisplay.setImage('BottomGlow_'+colourCode);
		this.honeycombDisplay.show(true);
	};
	ReelSymbol.prototype.hideHoneyComb = function (){
		this.honeycombDisplay.show(false);
	};
	/*
		create a new honeycombDisplay for the honeyComb displayed on the screen, this sprite is a child of mainSprite.
	*/
	ReelSymbol.prototype.createHoneyCombDisplay = function (){
		this.honeycombDisplay = new Sprite({
			"_name": this.id+'_honeycomb',
			"_SPRITES": [],
			"_style":{
				"_width":"110",
				"_height":"110",
				/* use below when create the sprite as part of the planet, it will move with the planet.				
				"_top": 6,
				"_left":4,*/
				"_top": this.getOriginalPos().y+6,
				"_left":this.getOriginalPos().x+4,
				"_background":{
					"_imagePlate":"BottomGlow"
				}
			},
		});
		/*		
		use below when create the sprite as part of the planet container.
		this.mainSprite.pixiContainer.addChild(this.honeycombDisplay.pixiContainer);
		*/	
		//the honeycomb sprite is being added as a child of gr.lib._Planet rather than reel sprite, due to there are overlaping issue in Rotate Bonus spin action.
		this.mainSprite.getParent().getParent().pixiContainer.addChildAt(this.honeycombDisplay.pixiContainer,0);
	
	};
	/*
		create a new explosionDisplay for the symbol explosion animation spritesheets, this sprite is NOT a child of mainSprite.
	*/
	ReelSymbol.prototype.createExplosionDisplay = function (){
		this.explosionDisplay = new Sprite({
			//"_id":'_'+this.id+"icon",
			"_name": this.id+"_explosionDisplay",
			"_SPRITES": [],
			"_style": {
				"_width": "200",
				"_height": "200",
				"_top": this.orgPosition.y-43,
				"_left": this.orgPosition.x-43,
				"_background": {
					"_imagePlate": "remove_0001"
				}
			}
		});
		this.mainSprite.getParent().pixiContainer.addChild(this.explosionDisplay.pixiContainer);
	};
	ReelSymbol.prototype.showExplosionDisplay = function (){
		this.explosionDisplay.show(true);
	};
	ReelSymbol.prototype.hideExplosionDisplay = function (){
		this.explosionDisplay.stopPlay();
		this.explosionDisplay.show(false);
	};
	/*
		create a new bonusDisplay for the symbol bonus animation spritesheets, this sprite is a child of mainSprite.
	*/
	ReelSymbol.prototype.createBonusDisplay = function (){
		this.bonusDisplay = new Sprite({
			//"_id":'_'+this.id+"icon",
			"_name": this.id+"_bonusDisplay",
			"_SPRITES": [],
			"_style": {
				"_width": "150",
				"_height": "150",
				"_top": "-13",
				"_left": "-17",
				"_background": {
					"_imagePlate": "MeteoriteWind_0001"
				}
			}
		});
		//add this display object on its parent, so they can be hide/fade individually.
		this.mainSprite.pixiContainer.addChild(this.bonusDisplay.pixiContainer);
	};
	ReelSymbol.prototype.applySymbolCode = function (code){
		let img = this.symbolsMap[code];
		if(img){
			this.currentSymbolCode = code;
			this.planetDisplay.setImage(img);
		}
		else{
			throw new Error("Can not find image for "+ code);
		}
	};
	ReelSymbol.prototype.applyBonusCode = function(code, startFrameNumber = 0) {
		this.currentAnimName = "";
		this.currentBonusCode = code;
		switch (code){
			case '1':
				this.currentAnimName = 'spaceshipWind';
				this.ufoFireEvent = LittleGreenMenGameEvent.eventIDs.UFONAVY_SPACESHIP_FIRE;
				this.showBonusDisplay();
				this.bonusDisplay.gotoAndPlay(this.currentAnimName, 0.2, true, startFrameNumber);
				break;
			case '2':
				this.currentAnimName = 'MeteoriteWind';
				this.ufoFireEvent = LittleGreenMenGameEvent.eventIDs.UFONAVY_METEORITE_FIRE;
				this.showBonusDisplay();
				this.bonusDisplay.gotoAndPlay(this.currentAnimName, 0.25, true, startFrameNumber);
				break;
			default: // 0
				this.currentAnimName = "";
				this.ufoFireEvent = null;
				this.hideBonusDisplay();
				break;
		}
	};
	ReelSymbol.prototype.stopBonusAnimation = function() {
		this.bonusDisplay.stopPlay();
		this.applyBonusCode("0");
		return this.bonusDisplay.pixiContainer.$sprite.currentFrame;
	};
	ReelSymbol.prototype.getOriginalPos = function (){
		if(!this.orgPosition_copy){
			this.orgPosition_copy = Object.assign({}, this.orgPosition);
		}
		return Object.assign({}, this.orgPosition);
	};
	ReelSymbol.prototype.getCurrentPos = function (){
		return {x:this.mainSprite._currentStyle._left, y: this.mainSprite._currentStyle._top};
	};
	ReelSymbol.prototype.getOffPos = function() {
		return this.offPosition;
	};
	ReelSymbol.prototype.setOffPos = function(posObj) {
		if(typeof posObj.y !== "undefined"){
			this.offPosition.y = posObj.y;
		}
		if(typeof posObj.x !== "undefined"){
			this.offPosition.x = posObj.x;
		}
	};
	ReelSymbol.prototype.moveTo = function (posObj){
		let newPos = {};
		if(posObj.x){
			newPos._left = Math.ceil(posObj.x);
		}
		if(posObj.y){
			newPos._top = Math.ceil(posObj.y);
		}
		if(Object.keys(newPos).length){
			this.mainSprite.updateCurrentStyle(newPos);
		}
	};
	ReelSymbol.prototype.scale = function (val){
		this.planetDisplay.updateCurrentStyle({_transform:{_scale:{_x:val,_y:val}}});
	};
	ReelSymbol.prototype.rotatePlanet = function (val){
		this.planetDisplay.updateCurrentStyle({"_transform":{"_rotate":val}});
	};
	ReelSymbol.prototype.goOffInstantlyOnY = function (){
		this.moveTo({y:this.offPosition.y});
	};
	ReelSymbol.prototype.goOffInstantlyOnX = function (){
		this.moveTo({x:this.offPosition.x});
	};
	ReelSymbol.prototype.getId = function() {
		return this.id;
	};
	ReelSymbol.prototype.getName = function (){
		return this.id;
	};
	ReelSymbol.prototype.getSymbolOrderNum = function (){
		return this.orderIndex;
	};
	ReelSymbol.prototype.getParentReelId = function (){
		return this.parentReelId;
	};
	ReelSymbol.prototype.highLight = function (){
		this.showHoneyComb();
		this.scale(1.1);
		const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.scale(1);
			_this.hideHoneyComb();
			_this.playWinningAnimation();
		}, config.timers.baseGame_symbolHoneyCombLastTimer);
	};
	ReelSymbol.prototype.playWinningAnimation = function (){
		this.hide();
		const _this = this;
		/*
			because it is not possible to overwrite 'skbJet/component/gladPixiRenderer/Sprite'. gotoAndPlay function
			to apply onComplete callback with reference yet, so I put it this way.

			espected: this.explosionDisplay.onComplete = new CallbackFunc(this, this.onWinningAnimationComplete);

		*/
		this.explosionDisplay.onComplete = function(){
			_this.onWinningAnimationPartOneComplete();
		};
		this.showExplosionDisplay();
		this.explosionDisplay.gotoAndPlay('removePart1', 0.3);
		if(this.getSymbolCode() !== 'IW' && this.getSymbolCode()!== 'X'){
			msgBus.publish(this.planetFireEvent, {"pos": this.getOriginalPos(), "symbolCode": this.getSymbolCode()});
		}
		if(this.ufoFireEvent){
			msgBus.publish(this.ufoFireEvent, this.getOriginalPos());
		}	
	};
	ReelSymbol.prototype.onWinningAnimationPartOneComplete = function (){
		
		const _this = this;
		this.explosionDisplay.onComplete = function(){
			_this.onWinningAnimationComplete();
		};
		this.explosionDisplay.gotoAndPlay('removePart2', 0.3);
	};
	ReelSymbol.prototype.onWinningAnimationComplete = function (){
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.SINGLE_SYMBOL_WIN_EXPLOSION_COMPLETE);
	};
	ReelSymbol.prototype.show = function (){
		this.mainSprite.show(true);
	};
	ReelSymbol.prototype.hide = function (){
		this.mainSprite.show(false);
		this.hideBonusDisplay();
	};
	ReelSymbol.prototype.showBonusDisplay = function(){
		this.bonusDisplay.show(true);
	};
	ReelSymbol.prototype.hideBonusDisplay = function(){
		this.bonusDisplay.stopPlay();
		this.bonusDisplay.show(false);
	};
	ReelSymbol.prototype.getSymbolCode = function (){
		return this.currentSymbolCode;
	};
	ReelSymbol.prototype.getBonusCode = function (){
		return this.currentBonusCode;
	};
	ReelSymbol.prototype.isVisible = function (){
		return this.mainSprite.pixiContainer.visible;
	};
	ReelSymbol.prototype.isOffTheView = function (){
		return (this.mainSprite.getCurrentStyle()._top == this.offPosition.y && this.mainSprite.getCurrentStyle()._left == this.offPosition.x);
	};
	ReelSymbol.prototype.getAnimName = function() {
		return this.currentAnimName;
	};
	ReelSymbol.prototype.setGap = function (gap){
		this.animGap = Math.ceil(gap);
	};
	ReelSymbol.prototype.resetGap = function (){
		this.animGap = false;
	};
	ReelSymbol.prototype.getGap = function(){
		return this.animGap;
	};

	return ReelSymbol;
});