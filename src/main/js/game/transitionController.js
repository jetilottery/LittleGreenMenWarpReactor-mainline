/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-07-15 11:25:59
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-10-15 16:09:47
*/
define(function module(require){
	const PIXI = require('com/pixijs/pixi');
	const Particles = require('com/pixijs/pixi-particles');
	const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const LittleGreenMenGameEvent	= require('game/events/littleGreenMenGameEvent');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const TweenFunctions = require('game/utils/tweenFunctions');
	const config = require('game/configController');
	const CallbackFunc = require('game/component/callbackFunc');
	function TransitionController(){
		this.mainSprite = null;
		this.ufo = null;
		this.ufoShinerAnim = null;
		this.ufoOffAnim = null;
		this.emitter_radiation = null;
		this.emitterCont = null;
		this.ticker = null;
		this.isRunning = false;
		this.deleted = false;
		this.updateCallback = null;
		this.transitionKeyFrame = null;
		this.addListeners();
	}
	TransitionController.prototype.addListeners = function (){
		msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ENTRE_TRANSITION_START, new CallbackFunc(this, this.entre));
	};
	TransitionController.prototype.isPortrait = function (){
		return gr.getSize().height > gr.getSize().width;
	};
	TransitionController.prototype.init = function (){
		this.mainSprite = gr.lib._transitionContainer;
		this.ufoShinerAnim = gr.animMap._bonusSpaceshipGlory;
		this.ufo = gr.lib._sBonusSpaceship;
		this.ufoOffAnim = gr.animMap._transition_off;
		this.ufoOffAnim._onComplete = new CallbackFunc(this, this.ufoOffOnComplete);
		this.ticker = gr.getTicker();
		this.emitterCont = gr.lib._tranParticleContainer.pixiContainer;

		const spriteMeteorite = [this.getSpriteSheetByName('meteorSmall'), this.getSpriteSheetByName('meteorTiny'), this.getSpriteSheetByName('meteorMid_0002')];
		this.emitter_radiation = new Particles.Emitter(this.emitterCont, spriteMeteorite, TransitionController.CONFIG_PIXIEDUST2);
		if(this.isPortrait()){
			this.emitter_radiation.updateOwnerPos(405, 560);
		}
		else{
			this.emitter_radiation.updateOwnerPos(720, 405);
		}
		this.updateCallback = new CallbackFunc(this,this.update);
		this.mainSprite.show(false);
		this.mainSprite.updateCurrentStyle({"_opacity":0.5,"_transform":{"_scale":{"_x":1, "_y":1}}});
	};
	TransitionController.prototype.ufoOffOnComplete = function() {
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ENTRE_TRANSITION_COMPLETE);
		const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.exit();
		}, config.timers.transition_startFadeOutAfterUFOFlyOffDelay);
	};
	TransitionController.prototype.exit = function() {
		this.transitionKeyFrame._onUpdate = this.transitionKeyFrame.exitUpdate;
		this.transitionKeyFrame._onComplete = this.transitionKeyFrame.exitComplete;
		this.transitionKeyFrame.play();
	};
	TransitionController.prototype.getSpriteSheetByName = function(spriteName){
		return PIXI.utils.TextureCache[spriteName];
	};
	TransitionController.prototype.update = function(deltaTime) {
		if(this.isRunning === true && this.deleted === false){
			this.emitter_radiation.update(deltaTime*0.05);
		} 
	};
	TransitionController.prototype.start = function (){
		this.isRunning = true;
		this.deleted = false;
		this.ticker.add(this.updateCallback);
	};
	TransitionController.prototype.entre = function (){
		this.mainSprite.updateCurrentStyle({"_opacity": 0});
		this.mainSprite.show(true);
		this.ufoShinerAnim.setLoop(true);
		this.ufoShinerAnim.play();
		this.ufo.updateCurrentStyle(this.ufo.data._style);
		this.ufo.updateCurrentStyle({"_opacity":1,"_transform":{"_scale":{"_x":1, "_y":1}}});
		this.start();
		if(!this.transitionKeyFrame){
			this.initTransitionKeyFrameAnimation();
		}
		this.transitionKeyFrame._onUpdate = this.transitionKeyFrame.entreUpdate;
		this.transitionKeyFrame._onComplete = this.transitionKeyFrame.entreComplete;
		this.transitionKeyFrame.play();
	};
	TransitionController.prototype.initTransitionKeyFrameAnimation = function (){
		this.transitionKeyFrame =  new KeyFrameAnimation({
			"_name": 'tranKeyFrameAnim',
			"tweenFunc":  TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.transition_screenFadeInOrOutDuration,
					"_SPRITES": []
				}
			]
		});
		this.transitionKeyFrame.entreUpdate = new CallbackFunc(this, this.entreOnUpdate);
		this.transitionKeyFrame.entreComplete = new CallbackFunc(this, this.entreOnComplete);
		this.transitionKeyFrame.exitUpdate = new CallbackFunc(this, this.exitOnUpdate);
		this.transitionKeyFrame.exitComplete = new CallbackFunc(this, this.exitOnComplete);
	};
	TransitionController.prototype.entreOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = TweenFunctions.linear;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		const opacity = tweenFunc(timeDelta, 0, 1, duration);
		this.mainSprite.updateCurrentStyle({"_opacity": opacity});
	};
	TransitionController.prototype.exitOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = TweenFunctions.linear;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		const opacity = tweenFunc(timeDelta, 1, 0, duration);
		this.mainSprite.updateCurrentStyle({"_opacity": opacity});
	};
	TransitionController.prototype.entreOnComplete = function (){
		const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.ufoOffAnim.play();
		}, config.timers.transition_startUFOAnimationAfterFadeInDelay);
	};
	TransitionController.prototype.exitOnComplete = function (){
		this.mainSprite.show(false);
		this.isRunning = false;
		this.emitter_radiation.cleanup();
		this.ticker.remove(this.updateCallback);
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_EXIT_TRANSITION_COMPLETE);
	};

	TransitionController.CONFIG_PIXIEDUST2 = {
		"alpha": {
			"start": 0,
			"end": 1
		},
		"scale": {
			"start": 0.1,
			"end": 1,
			"minimumScaleMultiplier": 1
		},
		"color": {
			"start": "#e4f9ff",
			"end": "#3fcbff"
		},
		"speed": {
			"start": 200,
			"end": 150,
			"minimumSpeedMultiplier": 1
		},
		"acceleration": {
			"x": 0,
			"y": 0
		},
		"maxSpeed": 0,
			"startRotation": {
			"min": 0,
			"max": 360
		},
		"noRotation": false,
		"rotationSpeed": {
			"min": 0,
			"max": 0
		},
		"lifetime": {
			"min": 3,
			"max": 5
		},
		"blendMode": "hard_light",
		"frequency": 0.01,
		"emitterLifetime": -1,
		"maxParticles": 100,
		"pos": {
			"x": 0,
			"y": 0
		},
		"addAtBack": false,
		"spawnType": "circle",
		"spawnCircle": {
			"x": 0,
			"y": 0,
			"r": 0
		}
	};
	
	return TransitionController;
});