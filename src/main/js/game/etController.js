/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-06-17 15:16:33
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-10-14 16:57:10
*/
define(function module(require){
		require('com/pixijs/pixi-spine');
		const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
		const LittleGreenMenGameEvent = require('game/events/littleGreenMenGameEvent');
		const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
		const resLib = require('skbJet/component/resourceLoader/resourceLib');
		const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
		const TweenFunctions = require('game/utils/tweenFunctions');
		const config = require('game/configController');
		const PIXI = require('com/pixijs/pixi');
		const CallbackFunc = require('game/component/callbackFunc');
		function ET(){
			this.ET = null;
			this.logoET = null;
			this.warpBonusET = null;
			this.container = null;
			this.container_logoET = null;
			this.container_wrapBonus = null;
			this.fadeKeyFrame = null;
			this.logoFadeInAnim = null;
			this.addListener();	
			//window.et = this;
		}
		ET.prototype.addListener = function (){
			msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
			msgBus.subscribe('startReveallAll', new CallbackFunc(this, this.fadeOut));
			msgBus.subscribe("playerWantsPlayAgain", new CallbackFunc(this, this.show));
		};
		ET.prototype.isPortrait = function (){
			return gr.getSize().height > gr.getSize().width;
		};
		ET.prototype.init = function (){
			this.setUpSpine();
			/*const _this = this;
			setTimeout(function(){
				gr.lib._guideBasegame.show(false);
				_this.hide();
				gr.lib._ticketCost.show(false);

			}, 3000);*/
		};
		ET.prototype.setUpSpine = function() {
			this.container = gr.lib._spineContainer;
			this.ET = new PIXI.spine.Spine(resLib.spine.spineLittleGreenMenB.spineData);
			this.ET.state.addAnimationByName(0, 'Standby animation', true, 0);
			this.ET.data= {"_name" : "spineET"};
			const displayMode = this.isPortrait()?'portrait':'landscape';
			let style = Object.assign({}, config.positions.mainSpineET[displayMode]);
			this.ET.styleData = style;
			this.ET.scale.x = style.scaleX;
			this.ET.scale.y = style.scaleY;
			this.ET.rotation = style.rotation;
			this.ET.x = style.x;
			this.ET.y = style.y;
			this.container.pixiContainer.addChild(this.ET);

			this.container_logoET = gr.lib._particleContainer;
			this.logoET = new PIXI.spine.Spine(resLib.spine.spineLittleGreenMenB.spineData);
			this.logoET.state.addAnimationByName(0, 'Standby animation', true, 0);
			this.logoET.data= {"_name" : "spineET"};
			style = Object.assign({}, config.positions.logoSpineET[displayMode]);
			this.logoET.styleData = style;
			this.logoET.scale.x = style.scaleX;
			this.logoET.scale.y = style.scaleY;
			this.logoET.rotation = style.rotation;
			this.logoET.x = style.x;
			this.logoET.y = style.y;
			this.logoET.alpha = style.alpha;
			//this.container.pixiContainer.addChild(this.logoET);
			this.container_logoET.pixiContainer.addChild(this.logoET);

			this.container_wrapBonus = gr.lib._warpETContainer;
			this.warpBonusET = new PIXI.spine.Spine(resLib.spine.spineLittleGreenMenB.spineData);
			this.warpBonusET.state.addAnimationByName(0, 'Standby animation', true, 0);
			this.warpBonusET.data= {"_name" : "spineET"};
			style = Object.assign({}, config.positions.warpBonusET[displayMode]);
			this.warpBonusET.styleData = style;
			this.warpBonusET.scale.x = style.scaleX;
			this.warpBonusET.scale.y = style.scaleY;
			this.warpBonusET.rotation = style.rotation;
			this.warpBonusET.x = style.x;
			this.warpBonusET.y = style.y;
			this.warpBonusET.alpha = style.alpha;
			//this.container.pixiContainer.addChild(this.logoET);
			if(this.container_wrapBonus){
				this.container_wrapBonus.pixiContainer.addChild(this.warpBonusET);
			}
		};
		ET.prototype.logoFadeIn  = function (){
			if(!this.logoFadeInAnim){
				this.logoFadeInAnim = new KeyFrameAnimation({
					"_name": 'logoFadeInAnimation',
					"tweenFunc": TweenFunctions.linear,
					"_keyFrames": [
						{
							"_time": 0,
							"_SPRITES": []
						},
						{
							"_time": config.timers.baseGame_logoFadeInDuration,
							"_SPRITES": []
						}
					]
				});
				this.logoFadeInAnim._onUpdate = new CallbackFunc(this, this.logoFadeInOnUpdate);
				//this.logoFadeInAnim._onComplete = new CallbackFunc(this, this.logoFadeInOnComplete);
			}
			this.logoFadeInAnim.play();
		};	
		ET.prototype.logoFadeInOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
			const tweenFunc = keyFrameAnim.animData.tweenFunc;
			const duration = keyFrameAnim.maxTime;
			timeDelta = Math.ceil(timeDelta);
			const logoAlpha = tweenFunc(timeDelta, 0,1, duration);
			this.logoET.alpha = logoAlpha;
		};	
		ET.prototype.fadeOut = function (){
			if(!this.fadeKeyFrame){
				this.fadeKeyFrame = new KeyFrameAnimation({
					"_name": 'mainETFadeOutKeyFrame',
					"tweenFunc": TweenFunctions.linear,
					"_keyFrames": [
						{
							"_time": 0,
							"_SPRITES": []
						},
						{
							"_time": config.timers.baseGame_ETFadeOutDuration,
							"_SPRITES": []
						}
					]
				});
				this.fadeKeyFrame._onUpdate = new CallbackFunc(this, this.etOnUpdate);
				this.fadeKeyFrame._onComplete = new CallbackFunc(this, this.etOnComplete);
			}
			this.container.show(true);
			this.fadeKeyFrame.play();
		};

		ET.prototype.etOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
			const tweenFunc = keyFrameAnim.animData.tweenFunc;
			const duration = keyFrameAnim.maxTime;
			timeDelta = Math.ceil(timeDelta);
			const opacity = tweenFunc(timeDelta, 1, 0, duration);
			const scale = tweenFunc(timeDelta, 0.85, 2, duration);
			//const logoAlpha = tweenFunc(timeDelta, 0,1, duration);
			/*this.container.updateCurrentStyle({"_opacity":opacity, "_transform":{"_scale":{"_x":scale,"_y":scale}}});*/
			this.ET.scale.x = -scale;
			this.ET.scale.y = scale;
			this.ET.alpha = opacity;
			if(this.isPortrait()){
				this.ET.y = tweenFunc(timeDelta, this.ET.styleData.y, this.ET.styleData.y+200, duration);
				this.ET.x = tweenFunc(timeDelta, this.ET.styleData.x, this.ET.styleData.x+180, duration);
			}
			else{
				this.ET.y = tweenFunc(timeDelta, this.ET.styleData.y, this.ET.styleData.y+200, duration);
				this.ET.x = tweenFunc(timeDelta, this.ET.styleData.x, this.ET.styleData.x+210, duration);
			}

			//this.logoET.alpha = logoAlpha;
		};
		ET.prototype.etOnComplete = function (){
			this.container.show(false);
			this.ET.scale.x = -0.85;
			this.ET.scale.y = 0.85;
			this.ET.alpha = 1;
			this.ET.y = this.ET.styleData.y; 
			this.ET.x = this.ET.styleData.x; 
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.BASEGAME_ET_FADEOUTCOMPLETED);
			this.logoFadeIn();
		};
		ET.prototype.show = function() {
			this.logoET.alpha = 0;
			this.ET.visible = true;
			this.container.show(true);
		};
		ET.prototype.hide = function() {
			this.ET.visible = false;
			this.container.show(false);
		};
		return ET;
});