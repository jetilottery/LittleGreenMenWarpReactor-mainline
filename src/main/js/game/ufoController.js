/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-07-05 10:02:13
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-10-24 09:03:46
*/
define(function medule(require){
	const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const TweenFunctions = require('game/utils/tweenFunctions');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const Sprite = require('skbJet/component/gladPixiRenderer/Sprite');
	const config = require('game/configController');
	const CallbackFunc = require('game/component/callbackFunc');
	const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
	function UFOController(data){
		this.motherSprite = null;
		this.motherHaloSprite = null;
		this.motherSparkSprite = null;
		this.motherSpriteIdleAnim = null;
		this.container = null;
		this.motherSpriteAnimName = data.mainAnimName;
		this.motherBgSpriteAnimName = data.motherBgSpriteAnimName;
		this.mainAnimSpeed = data.mainAnimSpeed;
		this.navyDepartureEvent = data.departureEvent;
		this.bulletloadedEvent = data.bulletLoadedEvent;
		// light is the object to be lit up. 4 of them in total
		this.ufoLights = {reception:[], free:[], litTimes:0 , currentAwardNumber:0, numOfLightsOn:0};
		this.numOfLights = data.numOfLights;
		// carrier has unlimited number of ufo can flying around and create more if needed.
		this.carrier = {reception:[],used:[],free:[], ufoGraphicStyle:""};
		this.carrierHomePos = {};
		this.carrierAnimation = {};
		this.awardTextSprite = null;
		this.numOfAwardWon = 0;
		this.isRunning = false;
		this.idPrefix = null;
		this.bln_showAchievedNumber = false;
		this.collectionSound = null;
		this.init(data);
		this.addListeners();
	}
	UFOController.prototype.addListeners = function (){
		if(this.navyDepartureEvent){
			msgBus.subscribe(this.navyDepartureEvent, new CallbackFunc(this, this.navyDeparture));
		}
		msgBus.subscribe("playerWantsPlayAgain", new CallbackFunc(this, this.onPlayerWantsPlayAgain));
	};

	UFOController.prototype.init = function(data) {
		const idPrefix = data.idPrefix;
		this.idPrefix = data.idPrefix;
		this.motherSprite = gr.lib[idPrefix+'Main'];
		this.motherHaloSprite = gr.lib[idPrefix+'Flash']; // the star effect
		this.motherHaloSprite.show(false);
		this.motherSparkSprite = gr.lib[idPrefix+'Spark']; // the big glory 
		this.motherSparkSprite.show(false);
		this.carrier.ufoGraphicStyle = this.motherSprite.data._style;
		//this.container = this.motherSprite.getParent().getParent().pixiContainer; // is gr.lib._selectionBG
		this.container = gr.lib._ufoPlanetNavyContainer.pixiContainer;
		this.motherSpriteIdleAnim = gr.animMap[idPrefix+'Bounce'];
		this.awardTextSprite = gr.lib[idPrefix+'AwardNum'];
		this.bln_showAchievedNumber = data.showAchievedNumber;
		this.collectionSound = data.collectionSound;
		this.setBonusAwardNumber('0');
		this.setupLights(idPrefix);
		this.setupCarrierAnimation(data);
		this.setMainUFOActive(false);
	};
	UFOController.prototype.startSparkAnimation = function (isLoop = false){
		this.motherSparkSprite.onComplete = null;
		this.motherSparkSprite.gotoAndPlay('actionB', 0.6, isLoop);
		this.motherSparkSprite.show(true);
	};
	UFOController.prototype.stopSparkAnimation  = function (){
		this.motherSparkSprite.stopPlay();
		this.motherSparkSprite.show(false);
	};
	UFOController.prototype.startHaloAnimation = function (isLoop = false){
		this.motherHaloSprite.gotoAndPlay('CollectFlash', 0.25, isLoop);
		this.motherHaloSprite.show(true);
	};
	UFOController.prototype.stopHaloAnimation = function (){
		this.motherHaloSprite.stopPlay();
		this.motherHaloSprite.show(false);
	};
	UFOController.prototype.reduceAwardNumberByOne = function (){
		if(this.ufoLights.currentAwardNumber > 0){
			this.ufoLights.currentAwardNumber--;
		}
		if(this.numOfAwardWon > 0){
			this.numOfAwardWon--;
		}
		this.setBonusAwardNumber(this.ufoLights.currentAwardNumber);
	};
	UFOController.prototype.startBulletLoading = function (){
		this.startSparkAnimation();
		const _this = this;
		this.motherSparkSprite.onComplete = function (){
			_this.bulletloaded();
		};
	};
	UFOController.prototype.bulletloaded = function (){
		this.stopSparkAnimation();
		this.reduceAwardNumberByOne();
		msgBus.publish(this.bulletloadedEvent);

	};
	UFOController.prototype.setupCarrierAnimation = function (data){
		this.setupCarrierHomePos(data);
		const idPrefix = data.idPrefix;
		this.carrierAnimation.part1 = new KeyFrameAnimation({
			"_name": idPrefix+'CarrierAnim_part1',
			"tweenFunc": TweenFunctions.pingPong,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.ufoMeteorite_symbolBonusIconPingPongDuration,
					"_SPRITES": []
				}
			]
		});
		this.carrierAnimation.part1._onUpdate = new CallbackFunc(this, this.carrierAnimation_part1_OnUpdate);
		this.carrierAnimation.part1._onComplete = new CallbackFunc(this, this.carrierAnimation_part1_OnComplete);
		this.carrierAnimation.part2 = new KeyFrameAnimation({
			"_name": idPrefix+'CarrierAnim_part2',
			//"tweenFunc": TweenFunctions.easeInOutBack,
			"tweenFunc": TweenFunctions.linear,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.ufoMeteorite_symbolBonusIconCollectDuration,
					"_SPRITES": []
				}
			]
		});
		this.carrierAnimation.part2._onUpdate = new CallbackFunc(this, this.carrierAnimation_part2_OnUpdate);
		this.carrierAnimation.part2._onComplete = new CallbackFunc(this, this.carrierAnimation_part2_OnComplete);
	};
	UFOController.prototype.carrierAnimation_part1_OnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let ufo, startPos, newStyle; 
		for(const id of this.carrier.used){
			ufo = this.carrier[id];
			startPos = ufo.startPos;
			newStyle = {
				_top:tweenFunc(timeDelta, startPos.y, startPos.y, duration, 5, 1), // pingPong effect amplitude is 5 pixcel, 1 round of pingpong during the time
				_opacity:1
			};
			ufo.updateCurrentStyle(newStyle);
		}
	};
	UFOController.prototype.carrierAnimation_part1_OnComplete = function (){
		this.carrierAnimation.part2.play();
	};
	UFOController.prototype.setupCarrierHomePos = function(data) {
		this.carrierHomePos = {
			x: this.motherSprite.getParent().getCurrentStyle()._left + data.carrierHomePosOffset.x,
			y: this.motherSprite.getParent().getCurrentStyle()._top + data.carrierHomePosOffset.y,
		};
	};
	UFOController.prototype.carrierAnimation_part2_OnUpdate = function({caller:keyFrameAnim, time:timeDelta}) {
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let ufo, startPos, newStyle; 
		for(const id of this.carrier.used){
			ufo = this.carrier[id];
			startPos = ufo.startPos;
			newStyle = {
				_top:tweenFunc(timeDelta, startPos.y, this.carrierHomePos.y, duration),
				_left: tweenFunc(timeDelta, startPos.x, this.carrierHomePos.x, duration),
				_opacity:tweenFunc(timeDelta, 1, 0.2, duration),
			};
			ufo.updateCurrentStyle(newStyle);
		}
	};

	UFOController.prototype.carrierAnimation_part2_OnComplete = function (){
		let ufo;
		for(let id of this.carrier.used){
			ufo = this.carrier[id];
			ufo.show(false);
			this.carrier.free.push(id); // saving in pool to be used again.
		}
		this.ufoLights.numOfLightsOn += this.carrier.used.length;
		this.carrier.used = [];
		const award = parseInt(this.ufoLights.numOfLightsOn / this.numOfLights);
		this.numOfAwardWon += award;
		//console.log(this.motherSpriteAnimName + "calling turnOnLights from Carrier!");
		this.turnOnLights();
	};
	UFOController.prototype.turnOnLights = function (){
		//const ufo = this.getLightAtIndex(lightIndex);
		if(this.ufoLights.litTimes !==  this.ufoLights.numOfLightsOn){
			// hasn't lit up all the lights yet
			if(this.ufoLights.free.length){
				const animPrefix = this.motherSpriteAnimName;
				const light = this.ufoLights[this.ufoLights.free.shift()];
				this.ufoLights.litTimes++;
				if(this.ufoLights.free.length){
					//go next
					this.queuingForAnimation(); // this call will also add a delay between the lit up animation.
				}
				else{
					//achived a bonus opportunity, need to reset the pool after it has been lit up, turn all the lights off and free all the lights candidate
					const _this = this;
					light.ufoSprite.onComplete = function (){
						_this.bonusAchieveAddUpAnimation(light);
					}; //LitUp  ToWhite Disappear Activation
				}
				if(this.bln_showAchievedNumber){
					//assuming it is the meteorite.
					this.playSoundByConfig("MeteoriteAchieved");
				}
				light.show(true);
				light.bgSprite.show(true);
				light.ufoSprite.gotoAndPlay(animPrefix+"LitUp", 0.3);
				light.bgSprite.gotoAndPlay('CollectFlash', 0.6);
				light.bgSprite.onComplete = function (){
					light.bgSprite.show(false);
				};
			}
			else{
				// waiting for available light. just keep checking.
				this.queuingForAnimation();
			}
		}
		else{
			//console.log(this.motherSpriteAnimName + 'round animation completed');
			this.isRunning = false;
		}
	};
	/*
		This is the 1st step of achieved a bonus feature animation, called from turnOnLights.
		all lights play "ToWhite" Animation
	*/
	UFOController.prototype.bonusAchieveAddUpAnimation = function(lightObj) {

		lightObj.ufoSprite.onComplete = null;
		let light;
		const animPrefix = this.motherSpriteAnimName;
		for(let i = 0 ; i < this.numOfLights ; i++){
			light = this.getLightAtIndex(i);
			if(i == (this.numOfLights -1)){
				const _this = this;
				// add turn to white complted callback on the last animating one
				light.ufoSprite.onComplete = function (){
					_this.lightToWhiteCompleted(light);
				};
				light.ufoSprite.gotoAndPlay(animPrefix+'ToWhite', 0.2);
			}
		}
	};
	/*
		This is the 2nd step of achieved a bonus feature animation
		All lights play "Disappear" animation and mother play "Activation" animation 
	*/
	UFOController.prototype.lightToWhiteCompleted = function(lightObj) {
		lightObj.ufoSprite.onComplete = null;
		let light;
		const animPrefix = this.motherSpriteAnimName;
		for(let i = 0 ; i < this.numOfLights ; i++){
			light = this.getLightAtIndex(i);
			light.ufoSprite.gotoAndPlay(animPrefix+'Disappear', 0.2);
		}
		const _this = this;
		this.motherSprite.onComplete = function (){
			_this.bonusAchieveAnimationComplete();
		};
		this.motherSprite.gotoAndPlay(animPrefix+"Activation", 0.3);
		//this.startHaloAnimation();
	};
	/*
		This is the 3 step of achieved a bonus feature animation.
		hide all lights update award number and refill this.ufoLights.free
	*/
	UFOController.prototype.bonusAchieveAnimationComplete = function() {
		if(this.ufoLights.currentAwardNumber !== this.numOfAwardWon){
			this.ufoLights.currentAwardNumber ++; 
			this.setBonusAwardNumber(this.ufoLights.currentAwardNumber);
		}
		this.setMainUFOActive();		
		//this.stopHaloAnimation();
		this.turnAllLightsOffInstantly();
		this.ufoLights.free = Object.assign([], this.ufoLights.reception);
		this.turnOnLights();
	};
	UFOController.prototype.setupLights = function (idPrefix){
		for(let i = 0 ; i < this.numOfLights ; i++){
			//sprite is the ufo(spaceship or meteorite )
			const sprite = gr.lib[idPrefix+i]; 
			//bgSprite is the sprite to play background animation.
			sprite.bgSprite = gr.lib[idPrefix+"EndAni"+i];
			//feSprite is the ufo graphic with prite sheets animation
			sprite.ufoSprite = gr.lib[idPrefix+'StartAni'+i];
			sprite.bgSprite.show(false);
			sprite.show(false);
			this.ufoLights[sprite.getName()] = sprite;
			this.ufoLights.reception.push(sprite.getName());
			sprite.orgStyle = {x:sprite.getCurrentStyle()._left, y: sprite.getCurrentStyle()._top, scaleX:sprite.getCurrentStyle()._transform._scale._x, scaleY:sprite.getCurrentStyle()._transform._scale._y};
		}
		this.ufoLights.free = Object.assign([], this.ufoLights.reception);
	};

	UFOController.prototype.queuingForAnimation = function() {
		const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.turnOnLights();
		}, config.timers.ufoMeteorite_multiBonusSymbolsLiteUpGap);
	};
	UFOController.prototype.createUnitUFO = function(id) {
		return new Sprite({
			"_id": id,
			"_name": id,
			"_style": {
				"_width": this.carrier.ufoGraphicStyle._width,
				"_height": this.carrier.ufoGraphicStyle._height,
				"_background": {
					"_imagePlate": this.carrier.ufoGraphicStyle._background._imagePlate
				}
			},
			"_SPRITES": [],
		});
	};
	UFOController.prototype.navyDeparture = function (evt = {x:172,y:738}){
		this.isRunning = true;
		let ufo, name;
		if(this.carrier.free.length){
			// has available one
			name = this.carrier.free.pop();
			ufo = this.carrier[name];
			this.carrier.used.push(name);
		}
		else{
			// running out, need to create
			name = 'ufoUnit'+this.carrier.reception.length;
			ufo = this.createUnitUFO(name);
			this.carrier[name] = ufo;
			this.carrier.reception.push(name);
			this.carrier.used.push(name);
			this.container.addChild(ufo.pixiContainer);
		}
		evt.x+=10;
		evt.y+=10;
		this.moveObjTo(ufo, evt);
		ufo.show(true);
		ufo.startPos = evt;
		if(this.carrierAnimation.part2.isPlaying() === false && this.carrierAnimation.part1.isPlaying() === false){
			this.playSoundByConfig(this.collectionSound);
			this.carrierAnimation.part1.play();
		}
	};
	UFOController.prototype.isPlaying = function() {
		return this.isRunning;
	};
	UFOController.prototype.setMotherSpriteAlpha = function(alp){
		//this.motherSprite.updateCurrentStyle({"_opacity":alp*1});
		this.motherSprite.getParent().updateCurrentStyle({"_opacity":alp*1});
	};
	UFOController.prototype.setMainUFOActive = function (setActive = true){
		if(setActive){
			this.motherSprite.setImage(this.idPrefix.substr(1)+'_0016');
		}
		else{
			this.motherSprite.setImage(this.idPrefix.substr(1)+'_0017');
		}
	};
	UFOController.prototype.onPlayerWantsPlayAgain = function (){
		this.turnAllLightsOffInstantly();
		this.setMainUFOActive(false);
		this.numOfAwardWon = 0;
		this.ufoLights.currentAwardNumber = 0;
		this.ufoLights.numOfLightsOn = 0;
		this.ufoLights.litTimes = 0;
		this.setBonusAwardNumber('0');
		this.ufoLights.free = Object.assign([], this.ufoLights.reception);
		this.carrier.used = [];
		this.carrier.free = Object.assign([], this.carrier.reception);
	};
	UFOController.prototype.setBonusAwardNumber = function(num) {
			this.awardTextSprite.setText('x'+num);
			if(num*1 != 0){
				if(num * 1 > 1){
					if(this.bln_showAchievedNumber){
						this.awardTextSprite.show(true);
					}
				}
				else{
					this.awardTextSprite.show(false);
				}
				this.startHaloAnimation(true);
			}
			else{
				this.setMainUFOActive(false);
				this.stopHaloAnimation();
				this.awardTextSprite.show(false);
			}
	};
	UFOController.prototype.moveObjTo = function(sourceObj, posObj) {
		let style = {};
		if( typeof posObj.x !== 'undefined'){
			style._left = posObj.x;
		}
		if( typeof posObj.y !== "undefined"){
			style._top = posObj.y;
		}
		if(Object.keys(style).length){
			sourceObj.updateCurrentStyle(style);
		}
	};
	UFOController.prototype.turnAllLightsOffInstantly = function (){
		for(let i = 0 ; i < this.numOfLights ; i++){
			this.getLightAtIndex(i).show(false);
		}
	};
	UFOController.prototype.getLightAtIndex = function (index){
		const rt = this.ufoLights[this.ufoLights.reception[index]];
		if(rt){
			return rt;
		}
		else{
			throw new Error(index + " index out of ufo Navy's boundary");
		}
	};
	UFOController.prototype.startMainAnimation = function (){
		this.motherSpriteIdleAnim.setLoop(true);
		this.motherSpriteIdleAnim.play();
	};
	UFOController.prototype.stopMainAnimation = function (){
		this.motherSpriteIdleAnim.setLoop(false);
		this.motherSprite.stopPlay();
		this.motherSpriteIdleAnim.stop();
	};
	UFOController.prototype.playSoundByConfig = function(soundName, isloop = false){
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
	UFOController.prototype.genKeyAnimateData = function(obj, options = {}, tweenFunc = TweenFunctions.linear) {
		if(typeof obj !== 'undefined' && Object.keys(options).length){
			let startObj = {}, targetObj = {};
			if((options.x instanceof Array) && options.x.length === 2){
				startObj._left = options.x[0];
				targetObj._left = options.x[1];
			}			
			if((options.y instanceof Array) && options.y.length === 2){
				startObj._top = options.y[0];
				targetObj._top = options.y[1];
			}
			if((options.scaleX instanceof Array) && options.scaleX.length === 2){
				startObj._transform = {_scale:{_x: options.scaleX[0]}};
				targetObj._transform = {_scale:{_x: options.scaleX[1]}};
			}
			if((options.scaleY instanceof Array) && options.scaleY.length === 2){
				startObj._transform = startObj._transform || {};
				startObj._transform._scale = startObj._transform._scale || {};
				startObj._transform._scale._y = options.scaleY[0];

				targetObj._transform = targetObj._transform || {};
				targetObj._transform._scale = targetObj._transform._scale || {};
				targetObj._transform._scale._y = options.scaleY[1];
			}
			if((options.opacity instanceof Array) && options.opacity.length === 2){
				startObj._opacity = options.opacity[0];
				targetObj._opacity = options.opacity[1];
			}
			if((options.rotation instanceof Array) && options.rotation.length === 2){
				startObj._transform = startObj._transform || {};
				startObj._transform._rotate = options.rotation[0];

				targetObj._transform = targetObj._transform || {};
				targetObj._transform._rotate = options.rotation[1];
			}

			let tempData = {
				"_name": options.name,
				"tweenFunc": tweenFunc,
				"_keyFrames": [
					{
						"_time": 0,
						"_SPRITES": [{
								"_name": obj.getName(),
								"_style": startObj
						}]
					},
					{
						"_time": 500,
						"_SPRITES": [{
								"_name": obj.getName(),
								"_style": targetObj
						}]
					},
					{
						"_time": 1500,
						"_SPRITES": [{
								"_name": obj.getName(),
								"_style": targetObj
						}]
					}
				]
			};
			if(typeof options.updateFunc !== "undefined"){
				tempData._updateCallback = options.updateFunc;
			}
			if(typeof options.completeFunc !== "undefined"){
				tempData._completeCallback = options.completeFunc;
			}
			return tempData;		
		}
		else{
			throw new Error("Sorry, the arguments are invalide!");
		}
	};
	return UFOController;
});