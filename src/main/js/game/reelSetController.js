/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-06-17 09:59:08
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-11-14 09:31:29
*/

define(function module(require){
	const PIXI = require('com/pixijs/pixi');
	const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const Reel = require('game/component/reel');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const TweenFunctions = require('game/utils/tweenFunctions');
	const config = require('game/configController');
	const loader = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
	const UFOController = require('game/ufoController');
	const LittleGreenMenGameEvent	= require('game/events/littleGreenMenGameEvent');
	const SKBeInstant   = require('skbJet/component/SKBeInstant/SKBeInstant');
	const Sprite = require('skbJet/component/gladPixiRenderer/Sprite');
	const ReelSymbol = require("game/component/reelSymbol");
	const CallbackFunc = require('game/component/callbackFunc');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
	const TweenPath = require('game/component/tweenPath');
	const gameUtils = require('game/utils/gameUtils');
	let Maths = {};
    (function(obj)
    {
        let factorial = [1];
        let accuracy = 25;
        for (let i = 1; i < accuracy; i++) {
          factorial[i] = factorial[i-1] * i;
        }

        function precision_sum(array) {
          let result = 0;
          while (array.length > 0) {
            result += array.pop();
          }
          return result;
        }

        obj.sin = function(x)
        {
            x = x % (Math.PI * 2);
            let sign = 1;
            let x2 = x*x;
            let terms = [];
            for (let i = 1; i < accuracy; i += 2)
            {
                terms.push(sign * x / factorial[i]);
                x *= x2;
                sign *= -1;
            }
            return precision_sum(terms);
        };

        obj.cos = function(x)
        {
            x = x % (Math.PI * 2);
            let sign = -1;
            let x2 = x*x;
            x = x2;
            let terms = [1];
            for (let i = 2; i < accuracy; i += 2)
            {
                terms.push(sign * x / factorial[i]);
                x *= x2;
                sign *= -1;
            }
            return precision_sum(terms);
        };
    })(Maths);
	function ReelSetController(){
		this.reels = {reception:[]};
		this.reelOffPosY = [-440,-550,-660,-770,-660,-550,-440];
		this.reelsetOffY = -740;
		this.reelsetShowY = 0;
		this.maskParent = null;
		this.reelset = null;
		this.mask = null;
		this.spaceshipCommander = null;
		this.meteoriteCommander = null;
		this.flyingUfoIcon = null;
		this.sBonusTransitionKeyAnim = null;
		this.etBonusSprite = null;
		this.etsBulletSprite = null;
		this.etsBulletMainPanetSprite = null;
		this.etsBulletTrailingSprite = null;
		this.etsBulletExplosionSprite = null;
		this.etsBulletActionRaySprite = null;
		this.outterLight = null;
		this.outterLightFadeKeyAnim = null;
		this.landingAnimation = null;
		this.positionDictionary = null;
		this.fireBulletKeyFrameAnim = null;
		this.hiddenHero = null; //this is a symbol that will not be seen but need to be there as a place holder, which will be use during duplicating symbols.
		//Store the response data 
		this.playResponseData = {};
		this.playResponseData_copy = null;
		this.winningStatus = {reception:[], totalWinSymbols:0, numOfAnimatedSymbols:0};
		this.remainWinSequenceArray = [];
		this.actionBonusKeyMap = null;
		this.activeAction = null;
		this.spinFeatureKeyFrameAnim = null;  //this animation control the whole planet rotating animation during action bonus.
		this.symbolHighLightKeyAnim = null;   //this animation control the base game show honeycomb and planet rotating before explosion
		this.startStandardBonusCallback = null;
		this.startActionBonusCallback = null;
		this.earthQuakeKeyFrameAnim = null;
		this.bonusTriggeredText = null;
		this.bonusTriggeredPanel = null;
		this.noMoreChainAnimation = null;
		this.actionBonusFlyingETSprite = null;   // the flying et fly from top right to bottom left
		this.actionBonusFlyingETAnimation = null; // flying et key frameAnimation
		this.bln_terminateGameNow = false;
		this.reactDropCallback = null;
		this.addListeners();
		//window.reelset = this;
	}
	ReelSetController.prototype.addListeners = function (){
		msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.gameParametersUpdated));
		msgBus.subscribe('jLottery.startUserInteraction', new CallbackFunc(this, this.onStartUserInteraction));
		msgBus.subscribe('jLottery.reStartUserInteraction', new CallbackFunc(this, this.onReStartUserInteraction));
		//msgBus.subscribe('startReveallAll', new CallbackFunc(this, this.onStartReveallAll));
		msgBus.subscribe("playerWantsPlayAgain", new CallbackFunc(this, this.onPlayerWantsPlayAgain));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.SINGLE_SYMBOL_WIN_EXPLOSION_COMPLETE, new CallbackFunc(this, this.singleSymbolWinAnimComplete));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.REELS_REACTORDROP_COMPLETE, new CallbackFunc(this, this.reactDropOnComplete));
		//msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.ACTION_BONUS_BULLET_LOADING_COMPLETE, new CallbackFunc(this, this.fireBullet));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_UFO_HIGHLIGHT_COMPLETE, new CallbackFunc(this, this.startSpaceFlyingAnimation));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_EXIT_TRANSITION_START, new CallbackFunc(this, this.standardBonusFinished));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.BASEGAME_ET_FADEOUTCOMPLETED, new CallbackFunc(this, this.etFadeOutOnComplete));
		msgBus.subscribe('winboxError', new CallbackFunc(this, this.onWinBoxError));
	};
	/*
	* Game entre entrence point, assuming all images have been loaded, and all sprites have been created and structured,
	* add game logic and show/hide display elements accordingly.
	*/
	ReelSetController.prototype.gameParametersUpdated = function(){
		this.reelset = gr.lib._Planet;
		this.flyingUfoIcon = gr.lib["_flyUfoIcon"];
		this.flyingUfoIcon.show(false);
		this.earthQuakeKeyFrameAnim = gr.animMap._earthQuake;
		this.spaceshipCommander = new UFOController({
			numOfLights:4,
			idPrefix:'_spaceship',
			collectionSound:'UFOCollection',
			mainAnimName: 'spaceship',
			mainEndAnimName: 'CollectFlash',
			mainAnimSpeed: 0.1,
			carrierHomePosOffset:{x:5,y:80},
			departureEvent: LittleGreenMenGameEvent.eventIDs.UFONAVY_SPACESHIP_FIRE,
			bulletLoadedEvent:LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_UFO_HIGHLIGHT_COMPLETE,
			showAchievedNumber:false,
		});
		this.meteoriteCommander = new UFOController({
			numOfLights:4,
			idPrefix:'_meteorite',
			collectionSound:'MeteoriteCollection',
			mainAnimName: 'meteorite',
			mainEndAnimName: 'CollectFlash',
			mainAnimSpeed: 0.1,
			carrierHomePosOffset:{x:0,y:40},
			departureEvent: LittleGreenMenGameEvent.eventIDs.UFONAVY_METEORITE_FIRE,
			bulletLoadedEvent:LittleGreenMenGameEvent.eventIDs.ACTION_BONUS_BULLET_LOADING_COMPLETE,
			showAchievedNumber:true,
		});
		this.maskParent = gr.lib._baseGame01.pixiContainer;
		this.positionDictionary = config.positionMap;
		this.outterLight = gr.lib._baseGameGlory;
		this.bonusTriggeredPanel = gr.lib._msgForBonus;
		this.bonusTriggeredPanel.updateCurrentStyle({"_transform":{"_scale":{"_x":0, "_y":0}}});
		this.bonusTriggeredPanel.show(false);
		this.bonusTriggeredText = gr.lib._bonusTriggeredText;
		this.actionBonusFlyingETSprite = gr.lib._actionBonusFlyET;
		if(config.textAutoFit.noMoreChainText){
			this.bonusTriggeredText.autoFontFitText = config.textAutoFit.noMoreChainText.isAutoFit;
		}
		this.bonusTriggeredText.setText("No clusters remain – Whirl Bonus triggered!");
		this.initActionBonusSprites();
		this.initActionBonusFlyingETAnimation();
		this.createMask();
		this.initReels();
		this.initHiddenHero();
		this.initOutLightFadeKeyAnimation();
		this.addSpriteAnimation();
	};
	ReelSetController.prototype.onWinBoxError = function (err_evt){
		if (err_evt.errorCode === '29000') {
			this.bln_terminateGameNow = true;
		}
	};
	ReelSetController.prototype.isEveryThingOkay = function (){
		return this.bln_terminateGameNow === false;
	};
	ReelSetController.prototype.playSpaceShipAnimation = function (){
		this.spaceshipCommander.startMainAnimation();
		this.meteoriteCommander.startMainAnimation();
	};
	ReelSetController.prototype.stopSpaceShipAnimation = function() {
		this.spaceshipCommander.stopMainAnimation();
		this.meteoriteCommander.stopMainAnimation();
	};
	ReelSetController.prototype.initReels = function (){
		const reels = this.reelset.getChildren();
		let reelName = null;
		let reelSpr = null;
		let reelData = {};
		reelData.symbolsMap = Object.assign({},config.symbolsMap);
		for(const item of Object.keys(reels)){
			reelName = reels[item].getName();
			reelSpr = reels[item];
			reelData.sourceObj = reelSpr;
			reelData.orderInReelset = this.reels.reception.length; //just to get a number in order, during reels initialisation
			reelData.offPositionY = this.mask.position.y - 150;
			this.reels[reelName] = new Reel(reelData);
			this.reels[reelName].moveSymbolsOffInstantly();
			this.reels.reception.push(reelName);
		}
	};
	ReelSetController.prototype.isPortrait = function (){
		return gr.getSize().height > gr.getSize().width;
	};
	ReelSetController.prototype.createMask = function (){
		const displayMode = (this.isPortrait())?'portrait':'landscape';
		const style = config.positions.baseGameReelsetDrawMask[displayMode];		
		/* use graphic 
		this.mask = PIXI.Sprite.fromImage(PIXI.utils.TextureCache.hexagonMask.textureCacheIds[1]);
		
		this.mask.position.y = style.y;
		this.mask.position.x = style.x;
		this.mask.scale.x = style.scaleX;
		this.mask.scale.y = style.scaleY;
		this.maskParent.addChild(this.mask);
		gr.lib._reelSetMask = this.mask; // just to give a reference to gr.lib, in case it needs. if not just remove this line.
		this.reelset.pixiContainer.mask = this.mask;*/

		//console.clear();
		this.mask = new PIXI.Graphics();
		this.mask.beginFill(0xAA00AA);
		this.mask.lineStyle(1, 0xFFAAFF, 1);
		let centerX = style.x, armLen = style.armLenth, centerY = style.y, angle, controlPointX, controlPointY,roundPointLeftX,roundPointLeftY,roundPointRightX,roundPointRightY;
		const degOffset = 2 * Math.PI /(360/style.roundDeg);
		this.mask.moveTo(centerX, centerY);
		for (let i = 0; i <= 6; i++) {
			angle = 2 * Math.PI / 6 * i,
			controlPointX = parseInt(centerX + armLen * Math.sin(angle));
			controlPointY = parseInt(centerY + armLen * Math.cos(angle));
			roundPointLeftX = parseInt(centerX + (armLen-5) * Math.sin(angle-degOffset));
			roundPointLeftY = parseInt(centerY + (armLen-5) * Math.cos(angle-degOffset)); 
			roundPointRightX = parseInt(centerX + (armLen-5) * Math.sin(angle+degOffset));
			roundPointRightY = parseInt(centerY + (armLen-5) * Math.cos(angle+degOffset));

			if(i==0){
				this.mask.moveTo(roundPointLeftX, roundPointLeftY);
			}
			else{
				this.mask.lineTo(roundPointLeftX, roundPointLeftY);
			}
			this.mask.quadraticCurveTo(controlPointX, controlPointY, roundPointRightX, roundPointRightY);
			//console.log(`i:${i}, degOffset:${degOffset}, cP_x:${controlPointX}, cP_y:${controlPointY}, leftX:${roundPointLeftX}, leftY:${roundPointLeftY}, rightX:${roundPointRightX}, rightY:${roundPointRightY}`);
		}
		this.mask.endFill();
		this.maskParent.addChild(this.mask);
		this.reelset.pixiContainer.mask = this.mask;
	};
	ReelSetController.prototype.onPlayerWantsPlayAgain = function (){
		//this.playResetAnimation();
		this.moveSymbolsOffInstantly();
	};

	ReelSetController.prototype.onStartReveallAll = function (){
		/*const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.playLandingAnimation();
		},config.timers.baseGame_ETFadeOutDuration);*/
		this.playLandingAnimation();
	};
	ReelSetController.prototype.etFadeOutOnComplete = function (){
		this.playSoundByConfig("ReelLanding");
		this.playLandingAnimation();
	};
	//var forceIndex = 0;
	ReelSetController.prototype.parseResponseData = function (data){
		const scenarioData = data.scenario;
		//data.prizeValue = 5000;		
		/*const forceScenarios = [
			//No.311 Standard loss
			//'E1C0C0D0B2C2,D0A0C0B0C0E0A0E2,D0A0A0B0B0C0A0F1C1E0,A1E1A0F0A0B1E2E0D1C2,F1C0F1F0F0C0A2C0B1,E0E0E1B0E0F0A0E0B2,E0F2B1B0E0D0C0|FFEFB||020307:06111217:08131420:19242526:303435:31323337,38,00',
			//No.116 spin action bonus quick
			//'B1C0A0B0,C2B1E2B2D2E1C0,E2C2F0E0F0F0C2B0A0D1,F1C1B2D2A0D0A0B0A0B0F1A0,D0B0A0F1C0F2F0D1E0C2,E2C2C2E1C0D0F0C1C2C2,C0C2D2A1E0E1B2D2A0|B2CCC|S2,S6|091421:31323637,39,111617:23242529:303435,39,0711121718:242934,38,00',
			//for Kevin Zhou
			//'E0E0D2C0A0A1D2A1,D0A1D2C0F0F2A0A1C0A0E0A0D0B0,B2A0B0C0D0A1C0C0A0E0D0B1D0F0E0A2F0E0C1,D0A0A0E2B0C1E0A0F0B0E0D0A0C0B2C0,C0D0F0E1F0E0A0F0B0A0F1A0,B0C0D0F0F0F2E0C2D0,B0A0B0F2A1|BDXBF|S2|010612:08142021:24293034,080913:141520:18242529,010607121925:131420:182430,38,39,020713:141521,06121824,020612,00',
			//5 action bonus feature
			//'D2D2E0C2D1A0D0B2B2A0C2,A0D2D2F2C2E0E0B0B1,D0C0D2D2A0C2C0D1B2A0A2E0,B0D2B0B0C0A0D0D1F2F2E0E0E0E0B0D0B2D1,E2F1D0E1F2B0F0E1F2B0C1C0E0D2,A0F2C0D0B0A2E0B0,D0A1B0F0E0E0A1B0C0E0||R7,S7,S2,S8|010510:030407081213,39,01020510:161724,39,16172425:202627:313536,39,1320273337:263236,39,15212228,00',
			// action bonus straight
			//'A0B2D2D2A2A1D2F0E2B0,A1A1D2E1B1D1C2A0E2F0C0F2,D0A0E0A2E0A0E1F0A2D0A0A0,E0F0D0F2B1D0E1B1D0F1,C0C0F0F0B2D0C0B1A0E2D0C0B1C1C2,D0F2F2D0F0A0E0C0A0D0A2E2,C0A2D0E1|AXAAA|S7,S5,S9|010207:04080914:1925263132,39,02030713:121824:273233,39,0105071112:08131925,38,39,23242930:262732,00',
			// quicky win 3 levels of the green planet
			"C0C0F0F0F0E0D0A0D0,C2C1C0F0C0E2C0E0B0C0A0E0A1,A2A2C2F0F0D2C0A0E0C0D2C0C0E0B1B2,A2A0F0D0F0B0C0A0B0C0C1F2E1A1,C1F0A1E0C0B0B0C0E0D2C2,B2A0E0F0C2B0E2,F0B1D1F0||R5|010206111218:030407080913:14152122,39,03070813:051011161723:18242529,00"
		];
		const scenarioData = forceScenarios[forceIndex++ % forceScenarios.length];*/
		
		const [baseGameData, bonusData1, bonusData2, sequenceData] = scenarioData.split("|");
		this.playResponseData.prizeDivision = data.prizeDivision;
		this.playResponseData.prizeValue = data.prizeValue;
		this.playResponseData.currentStake = data.price;
		this.parseBaseGameData(baseGameData);
		this.parseStandardBonusData(bonusData1);
		this.parseActionBonusData(bonusData2);
		this.parseWinSequenceData(sequenceData);
		this.playResponseData_copy = JSON.parse(JSON.stringify(this.playResponseData));// deep clone
	};
	ReelSetController.prototype.parseBaseGameData = function(data) {
		this.playResponseData.basegame = [];
		if(typeof data !== "undefined") {
			const reelsData = data.split(",");
			//if(reelsData.length)
			for(const symbols of reelsData){
				this.playResponseData.basegame.push(symbols.match(/.{2}/g));
			}
		}
	};
	ReelSetController.prototype.parseStandardBonusData = function(data) {
		this.playResponseData.standardBonus = [];
		if(typeof data !== "undefined"){
			const bonusData = data.split(',');
			for(const bonus of bonusData){
				this.playResponseData.standardBonus.push(bonus.match(new RegExp('.{1}','g')));
			}
		}
	};
	ReelSetController.prototype.parseActionBonusData = function(data) {
		this.playResponseData.actionBonus = [];
		if(typeof data !== "undefined"){
			const bonusData = data.split(",");
			this.playResponseData.actionBonus = bonusData;
		}
	};
	ReelSetController.prototype.parseWinSequenceData = function(data){
		this.playResponseData.winSequence = [];
		if(typeof data !== "undefined"){
			const sequenceArr = data.split(',');
			for(const sequencesPerRound of sequenceArr){
				const sequences = sequencesPerRound.split(":");
				const arr = [];
				for(const sequence of sequences){
					arr.push(sequence.match(new RegExp('.{2}','g')));
				}
				this.playResponseData.winSequence.push(arr);
			}
		}
	};
	ReelSetController.prototype.getBaseGameData = function (){
		return this.playResponseData.basegame;
	};
	ReelSetController.prototype.getStandardBonusData = function (){
		return this.playResponseData.standardBonus;
	};
	ReelSetController.prototype.getActionBonusData = function (){
		return this.playResponseData.actionBonus;
	};
	ReelSetController.prototype.getWinSequence = function (){
		return this.playResponseData.winSequence;
	};
	/*
		passing symbol structure and orders to the reel object and apply them.
	*/
	ReelSetController.prototype.prepareReelSymbols = function (){
		for(let i = 0 ; i < this.playResponseData.basegame.length ; i++){
			const reel = this.getReelAtIndex(i);
			const reelData = this.playResponseData.basegame[i];
			reel.initSymbols(reelData);
		}
	};
	ReelSetController.prototype.onStartUserInteraction = function (evt){
		/*if(!this.hasCleared){
			this.hasCleared = true;
			console.clear();
		}*/
		//console.log(`stake: ${evt.price}, division: ${evt.prizeDivision}, win: ${evt.prizeValue}, file:${evt.revealData}`);
		this.playSpaceShipAnimation();
		this.parseResponseData(evt);
		this.prepareReelSymbols();
	};
	ReelSetController.prototype.onReStartUserInteraction = function (evt){//evt){
		this.onStartUserInteraction(evt);
	};
/*Basegame reel landing section start*****************************************************************************************************************************************/
	ReelSetController.prototype.playLandingAnimation = function() {
		if(!this.landingAnimation){
			this.initLandingAnimation();
		}
		const midReel = this.getReelAtIndex(3);
		this.moveSymbolsOffInstantly();
		const gapInMilSecs = config.timers.baseGame_perSymbolLandingDelay;
		let anim = null;
		for(let i=0; i < midReel.getNumOfSymbols(); i++){
			anim = this.landingAnimation[midReel.getSymbolAtIndex(i).getId()];
			anim.islanding = true;
			setTimeout(function(animation){
				animation.play();
			},(gapInMilSecs*i),anim);
		}
	};
	ReelSetController.prototype.playResetAnimation = function (){
		if(!this.landingAnimation){
			this.initLandingAnimation();
		}
		const midReel = this.getReelAtIndex(3);
		const gapInMilSecs = config.timers.baseGame_perSymbolLandingDelay;
		let anim = null;
		for(let i=0; i < midReel.getNumOfSymbols(); i++){
			anim = this.landingAnimation[midReel.getSymbolAtIndex(i).getId()];
			anim.islanding = false;
			setTimeout(function(animation){
				animation.play();
			},(gapInMilSecs*i),anim);
		}
	};
	ReelSetController.prototype.moveSymbolsOffInstantly = function (){
		for(let i = 0 ; i< this.getNumOfReels(); i++){
			const reel = this.getReelAtIndex(i);
			reel.moveSymbolsOffInstantly();
		}
	};
	ReelSetController.prototype.initLandingAnimation = function (){
		this.landingAnimation = {};
		const midReel = this.getReelAtIndex(3);
		let symbol = null;
		let animOption = null;
		for(let i=0; i < midReel.getNumOfSymbols(); i++){
			symbol = midReel.getSymbolAtIndex(i);
			animOption = {
				name:symbol.getId()+"landingAnim",
				y:[symbol.offPosition.y, symbol.orgPosition.y]
			};
			this.landingAnimation[symbol.getId()] = new KeyFrameAnimation(this.genKeyAnimateData(symbol, config.timers.baseGame_perSymbolLandingDuration, animOption, this.customisedEaseOutBounce));
			this.landingAnimation[symbol.getId()]._onUpdate = new CallbackFunc(this, this.midReelSymbolLandingUpdate);
			if(i == midReel.getNumOfSymbols()-1){
				//that is the last symbol animation
				this.landingAnimation[symbol.getId()]._onComplete = new CallbackFunc(this, this.landingAnimationOnComplete);
			}
		}
	};
	ReelSetController.prototype.midReelSymbolLandingUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const currentSymbolId = keyFrameAnim._spritesNameList[0];
		const currentReelId = currentSymbolId.substring(0,2);
		const currentReelObj = this.getReelById(currentReelId);
		const currentObj = currentReelObj.getSymbolById(currentSymbolId);
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		this.updateSymbolsAccordingly(currentObj, timeDelta, duration, tweenFunc, keyFrameAnim.islanding);
	};
	ReelSetController.prototype.updateSymbolsAccordingly = function (obj, t, duration, tweenFunc , isLanding){
		const symbolOrder = obj.getSymbolOrderNum();
		let objTargetPosY = 0;
		if(isLanding){
			objTargetPosY = tweenFunc(t, obj.getOffPos().y, obj.getOriginalPos().y, duration); 
		}
		else{
			objTargetPosY = tweenFunc(t, obj.getOriginalPos().y, obj.getOriginalPos().y+800, duration); 
		}
		for (let i=0; i< this.reels.reception.length; i++){
			const reel = this.getReelAtIndex(i);
			const symbol = reel.getSymbolAtIndex(symbolOrder);
			if(symbol){
				const gapY = obj.getOriginalPos().y - symbol.getOriginalPos().y;
				symbol.moveTo({y:objTargetPosY-gapY});
			}
		}
	};

	ReelSetController.prototype.landingAnimationOnComplete = function (kfa = {islanding:true}){
		if(kfa.islanding){
			this.showWinSequence();
		}
		else{
			this.moveSymbolsOffInstantly();
		}
	};

	/*
	*	y = M * (x - a) * (x - a) + b;
	*	M = (y-b)/((x-a)*(x-a));
	*/
	ReelSetController.prototype.customisedEaseOutBounce = function (t, b, _c, d) {
		var c = _c - b;
		if ((t /= d) < 1 / 2.75) { //0.363636
			//return c * (7.5625 * t * t) + b;  //not exceed the edge on the first drop
			return c * (8.31875 * t * t) + b;
		} 
		else if (t < 2 / 2.75) { //0.727272
			return c * (1.5125 * (t -= 1.5 / 2.75) * t + 0.95) + b;
		}
		else{ //end up with 2 bounces
			return c * (1.0755 * (t -= 2.375 / 2.75 ) * t + 0.98 ) + b; // (1-0.98) / 0.375/2.75*0.375/2.75
		}
	};
/*Basegame reel landing section end*****************************************************************************************************************************************/

/*Basegame Show winning section start*****************************************************************************************************************************************/

	ReelSetController.prototype.showWinSequence = function (){
	// fill the this.remainWinSequenceArray with data preparing for nextwin.
		this.remainWinSequenceArray = this.getWinSequence().shift();

		if(this.remainWinSequenceArray[0].length == 1){
			// no winning sequence now, check if bonus triggered.
			this.noMoreCurrentRoundWins();
		}
		else{
			this.remainWinSequenceArray = this.sortingGroupData(this.remainWinSequenceArray);
			this.nextWin();
		}
	};
	/*
		group the removal symbols in the same order with the prize table. 
	*/
	ReelSetController.prototype.sortingGroupData = function (arr){
		let dict = {"A":[], "B":[],"C":[], "D":[], "E":[], "F":[], reception:["A","B","C","D","E","F"]};
		for(const item of arr){
			const [reelId, symbolId] = this.translatePostionCode(item[0]);
			const reel = this.getReelById(reelId);
			const reelOrderNum = reel.getReelOrderNum();
			const explosionSymbolIndex = symbolId.substr(-1);//the last charactor is the symbol index in reel.
			const symbolCode = this.playResponseData.basegame[reelOrderNum][explosionSymbolIndex];
			const code = symbolCode.substr(0,1);
			dict[code].push(...item);
		}
		const orderArr = dict.reception.reverse(); // from F to A, remove this line if need A to F.
		let rtArr = [];
		for(const code of orderArr){
			if(dict[code].length !== 0){
				rtArr.push(dict[code]);
			}
		}
		return rtArr;
	};
	ReelSetController.prototype.isSymbolsExplodesTogether = function (){
        return (SKBeInstant.config.customBehavior && SKBeInstant.config.customBehavior.isSymbolsExplodesTogether === true) || (loader.i18n.gameConfig && loader.i18n.gameConfig.isSymbolsExplodesTogether === true);
	};
	ReelSetController.prototype.highLightWinningSymbols = function (){
		if(!this.symbolHighLightKeyAnim){
			this.initSymbolHighLightAnimation();
		}
		if(this.isSymbolsExplodesTogether()){
			//all wins in the current round need to present at the same time,
			let groupData = [];
			for (const symGroup of this.remainWinSequenceArray){
				this.winningStatus.totalWinSymbols += symGroup.length;
				//this.presentSingleWinline(symGroup);
				for(const item of symGroup){
					const [reelId, symbolId] = this.translatePostionCode(item);
					const reel = this.getReelById(reelId);
					const symbol = reel.getSymbolById(symbolId);
					symbol.showHoneyComb();
				}				
				groupData = groupData.concat(...symGroup);
			}
			this.remainWinSequenceArray = [];
			this.symbolHighLightKeyAnim.groupData = groupData;
		}
		else{
			//symbol groups presenting one by one in order.
			const groupData = this.remainWinSequenceArray.shift();
			this.winningStatus.totalWinSymbols += groupData.length;
			this.symbolHighLightKeyAnim.groupData = groupData;
		}
		this.symbolHighLightKeyAnim.play();
		//this.symbolHighLightOnComplete();
	};
	ReelSetController.prototype.initSymbolHighLightAnimation = function (){
		this.symbolHighLightKeyAnim = new KeyFrameAnimation({
			"_name": 'symbolHighLightKeyAnim',
			"tweenFunc":  TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.baseGame_symbolHoneyCombLastTimer,
					"_SPRITES": []
				}
			]
		});
		this.symbolHighLightKeyAnim._onUpdate = new CallbackFunc(this, this.symbolHighLightOnUpdate);
		this.symbolHighLightKeyAnim._onComplete = new CallbackFunc(this, this.symbolHighLightOnComplete);
	};
	ReelSetController.prototype.symbolHighLightOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		const rotation = tweenFunc(timeDelta, 0 , 360, duration);
		const scale = tweenFunc(timeDelta, 1, 1.2, duration);
		const groupData = this.symbolHighLightKeyAnim.groupData;
		for(const item of groupData){
			const [reelId, symbolId] = this.translatePostionCode(item);
			const reel = this.getReelById(reelId);
			const symbol = reel.getSymbolById(symbolId);
			symbol.rotatePlanet(rotation);
			symbol.scale(scale);
		}
	};
	ReelSetController.prototype.symbolHighLightOnComplete = function (){
		const groupData = this.symbolHighLightKeyAnim.groupData;
		for(const item of groupData){
			const [reelId, symbolId] = this.translatePostionCode(item);
			const reel = this.getReelById(reelId);
			const symbol = reel.getSymbolById(symbolId);
			symbol.scale(1);
			symbol.rotatePlanet(0);
			symbol.hideHoneyComb();
		}
		this.presentSingleWinline(groupData);
		this.earthQuakeKeyFrameAnim.play();
	};
	ReelSetController.prototype.presentSingleWinline = function (groupData){
		let winSymbolCode = null;
		const basegameData = this.playResponseData.basegame;
		for(const item of groupData){
			const [reelId, symbolId] = this.translatePostionCode(item);
			const reel = this.getReelById(reelId);
			const reelOrderNum = reel.getReelOrderNum();
			const explosionSymbolIndex = symbolId.substr(-1);//the last charactor is the symbol index in reel.
			basegameData[reelOrderNum][explosionSymbolIndex] = "_empty_";
			winSymbolCode = reel.presentWinSymbolAnimation(symbolId);
			if(this.winningStatus[winSymbolCode]){
				this.winningStatus[winSymbolCode] ++;
			}
			else{
				this.winningStatus[winSymbolCode] = 1;
				this.winningStatus.reception.push(winSymbolCode);
			}		
		}
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.PRICETABLE_FIGURE_UPDATE, this.winningStatus);
		/*const _this = this;
		gr.getTimer().setTimeout(function (data){
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.PRICETABLE_FIGURE_UPDATE, data);
		}, config.timers.baseGame_symbolHoneyCombLastTimer, Object.assign({}, _this.winningStatus));*/
	};
	ReelSetController.prototype.nextWin = function (){
		if(this.isEveryThingOkay()){
			if(this.remainWinSequenceArray.length !== 0){
				this.winningStatus = {reception:[], totalWinSymbols:0, numOfAnimatedSymbols:0};
				this.highLightWinningSymbols();
			}
			else{
				this.noMoreCurrentRoundWins();
			}
		}
	};
	ReelSetController.prototype.singleSymbolWinAnimComplete = function() {
		this.winningStatus.numOfAnimatedSymbols++;
		if(this.winningStatus.numOfAnimatedSymbols == this.winningStatus.totalWinSymbols){
		/*
			At this point, every single symbol explosion animation is completed, 
			assuming show winning sequence of current round is completed.
			now need to update the text figures accordingly. and do the dropping if there is.
			
			{...this.winningStatus} created a clone of the this.winningStatus Object, 
			rather than passing a reference of the this.winningStatus itself;

			it seems the ... spread operator is not allowed in this version, which will fail on the compile.
			so I dumped it temporarily and use the Object assign function instead.
			
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.PRICETABLE_FIGURE_UPDATE, {...this.winningStatus});
		
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.PRICETABLE_FIGURE_UPDATE, Object.assign({}, this.winningStatus));
		*/	
			if(this.outterLightFadeKeyAnim && this.outterLightFadeKeyAnim.isStillOnActionBonus){
				this.outterLightFadeKeyAnim.isStillOnActionBonus = false;
				this.outterLightFadeKeyAnim.play();
			}
			const _this = this;
			if(this.remainWinSequenceArray.length !== 0){
				gr.getTimer().setTimeout(function (){
					_this.nextWin();
				}, config.timers.baseGame_delayBetweenNextGroupExplosion);
			}
			else{
				gr.getTimer().setTimeout(function (){
					_this.doReactDrop();
				}, config.timers.baseGame_delayForReactDrop);
			}
		}
	};
	ReelSetController.prototype.doReactDrop = function (){
		if(this.isEveryThingOkay()){
			if(this.spaceshipCommander.isPlaying() === false && this.meteoriteCommander.isPlaying() === false){
				//add condition to check, only if both spaceship and meteorite animations are complete, it will do the reactdrop otherwise just wait.
				this.playSoundByConfig("ReactDrop");
				this.trimBasegameData();
				for(let i = 0 ; i < this.playResponseData.basegame.length ; i++){
					const reel = this.getReelAtIndex(i);
					const reelData = this.playResponseData.basegame[i];
					reel.startReactDrop(reelData);
				}
			}
			else{
				if(!this.reactDropCallback){
					this.reactDropCallback = new CallbackFunc(this, this.doReactDrop);
				}
				this.queue(this.reactDropCallback);
			}
		}
	};
	ReelSetController.prototype.reactDropOnComplete = function (){
		if(this.isEveryThingOkay()){
			this.landingAnimationOnComplete();
		}
	};
	ReelSetController.prototype.trimBasegameData = function (){
		const arr = this.playResponseData.basegame;
		let newArr = [];
		for(const row of arr){
			let newRow = [];
			for(const column of row){
				if(column !== '_empty_'){
					newRow.push(column);
				}
			}
			newArr.push(newRow);
		}
		this.playResponseData.basegame = newArr;
	};
	ReelSetController.prototype.noMoreCurrentRoundWins = function (){
		this.checkBonus();
	};
	ReelSetController.prototype.checkBonus = function (){
		if(this.remainWinSequenceArray.length === 1){
			const [sequenceId] = this.remainWinSequenceArray.shift();
			switch (sequenceId){
				case '38': // Standard Bonus is triggered
					this.startStandardBonusTransition();
					this.showNoMoreChainMsg('WBTriggered');
					break;
				case '39': // Action Bonus is triggered; 
					this.startActionBonusTransition();
					this.showNoMoreChainMsg('ABTriggered');
					break;
				case '00': // end of the game
					this.showNoMoreChainMsg('NMChain');
					this.gameFinished();
					break;
				default:
					throw new Error('unknown type of sequenceId: ' + sequenceId);
			}
		}
	};
	ReelSetController.prototype.showNoMoreChainMsg = function(msgType){
		if(!this.noMoreChainAnimation){
			this.initnoMoreChainAnimation();
		}
		if(this.needToShowNMC()){
			this.bonusTriggeredText.setText(loader.i18n.Game[msgType]);
			gameUtils.setTextStyle(this.bonusTriggeredText, config.style.noMoreChainText);
			this.noMoreChainAnimation.status = 'fadeIn';
			this.bonusTriggeredPanel.show(true);
			this.noMoreChainAnimation.play();
		}
	};
	ReelSetController.prototype.needToShowNMC = function (){
		if(this.playResponseData.winSequence.length == 0 && this.playResponseData_copy.winSequence[this.playResponseData_copy.winSequence.length-2][0][0] == '38'){
			/*
				if it is the end of the game, and the second last code is '38' - a standard bonus feature. 
				which means it just come out of the warp bonus, then don't show the "no more chain" message at the end.
			*/
			return false;
		}
		else{
			return true;
		}
	};
	ReelSetController.prototype.initnoMoreChainAnimation = function (){
		this.noMoreChainAnimation = new KeyFrameAnimation({
			"_name": 'noMoreChainTextKeyFrame',
			"tweenFunc":  TweenFunctions.easeOutBack, 
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.baseGame_noMoreChainAnimationDuration,
					"_SPRITES": []
				}
			]
		});
		this.noMoreChainAnimation._onUpdate = new CallbackFunc(this, this.noMoreChainOnUpdate);
		this.noMoreChainAnimation._onComplete = new CallbackFunc(this, this.noMoreChainOnComplete);
	};
	ReelSetController.prototype.noMoreChainOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		if(this.noMoreChainAnimation.status === 'fadeIn'){
			const scale = tweenFunc(timeDelta, 0, 1, duration);
			this.bonusTriggeredPanel.updateCurrentStyle({"_transform":{"_scale":{"_x":scale, "_y":scale}}});
		}
		else if(this.noMoreChainAnimation.status === 'fadeOut'){
			const scale = TweenFunctions.linear(timeDelta, 1, 0, duration);
			this.bonusTriggeredPanel.updateCurrentStyle({"_transform":{"_scale":{"_x":scale, "_y":scale}}});
		}
	};
	ReelSetController.prototype.noMoreChainOnComplete = function (){
		if(this.noMoreChainAnimation.status === 'fadeIn'){
			this.noMoreChainAnimation.status = 'fadeOut';
			const _this = this;
			gr.getTimer().setTimeout(function (){
				_this.noMoreChainAnimation.play();
			}, config.timers.baseGame_noMoreChainPanelStayDuration);
		}
		else{
			this.bonusTriggeredPanel.show(false);
		}
	};
/*Basegame Show winning section end*****************************************************************************************************************************************/

/*Standard Bonus section start*****************************************************************************************************************************************/
	ReelSetController.prototype.standardBonusFinished = function (){
		const _this = this;
		gr.getTimer().setTimeout(function (){
			_this.showWinSequence();
		}, config.timers.standard_delayAfterComebackFromBonus);
	};
	ReelSetController.prototype.startStandardBonusTransition = function (){
		if(this.spaceshipCommander.isPlaying() === false && this.meteoriteCommander.isPlaying() === false){
			this.playSoundByConfig("sBonusTransition");
			this.spaceshipCommander.startHaloAnimation(true);
			this.spaceshipCommander.startBulletLoading();
		}
		else{
			//wait until UFOController animation complete.
			if(!this.startStandardBonusCallback){
				this.startStandardBonusCallback = new CallbackFunc(this, this.startStandardBonusTransition);
			}
			this.queue(this.startStandardBonusCallback);
		}
	};
	ReelSetController.prototype.startSpaceFlyingAnimation = function (){
		this.spaceshipCommander.stopHaloAnimation();
		this.spaceshipCommander.motherSprite.getParent().show(false);
		this.flyingUfoIcon.show(true);
		if(!this.sBonusTransitionKeyAnim){
			this.initStandardTransitionkeyAnim();
		}
		this.sBonusTransitionKeyAnim.maxTime = config.timers.standard_UFOFlyCurvePathDuration;
		this.sBonusTransitionKeyAnim._onUpdate = this.sBonusTransitionKeyAnim.flyUpdateCallback;
		this.sBonusTransitionKeyAnim._onComplete = this.sBonusTransitionKeyAnim.flyCompleteCallback;
		this.playSoundByConfig("sBonusBGM", true);
		this.sBonusTransitionKeyAnim.play();
	};

	ReelSetController.prototype.initStandardTransitionkeyAnim = function (){
		this.sBonusTransitionKeyAnim = new KeyFrameAnimation({
			"_name": 'sBonusFlyKeyAnim',
			"tweenFunc":  TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.standard_UFOFlyCurvePathDuration,
					"_SPRITES": []
				}
			]
		});
		const currentX = this.flyingUfoIcon.getCurrentStyle()._left;
		const currentY = this.flyingUfoIcon.getCurrentStyle()._top;
		this.flyingUfoIcon.orgStyle = {"x":currentX, "y":currentY, "rotation":this.flyingUfoIcon.getCurrentStyle()._transform._rotate, "scale":this.flyingUfoIcon.getCurrentStyle()._transform._scale._x};
		//this.sBonusTransitionKeyAnim.path = new PIXI.tween.TweenPath();
		this.sBonusTransitionKeyAnim.path = new TweenPath();
		this.sBonusTransitionKeyAnim.path.moveTo(currentX-1, currentY).lineTo(currentX, currentY);
		if(this.isPortrait()){
			this.sBonusTransitionKeyAnim.path.bezierCurveTo(-500, 500, -300, 900, 184,450);
		}
		else{
			this.sBonusTransitionKeyAnim.path.bezierCurveTo(-500, 500, -300, 900, 500,240);
		}
		this.sBonusTransitionKeyAnim.path.closed = false;
		this.sBonusTransitionKeyAnim.flyUpdateCallback = new CallbackFunc(this, this.sBonusFlyKeyAnimUpdate);
		this.sBonusTransitionKeyAnim.flyCompleteCallback = new CallbackFunc(this, this.sBonusFlyKeyAnimComplete);
	};
	ReelSetController.prototype.sBonusFlyKeyAnimUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		const totalPathDistance = parseInt(this.sBonusTransitionKeyAnim.path.totalDistance()); // Pixi.tween.TweenPath() object provided this function to get the distance of the curve path.
		const distance =  TweenFunctions.linear(timeDelta,0, totalPathDistance, duration);
		//console.log("distance:"+distance);
		const pos = this.sBonusTransitionKeyAnim.path.getPointAtDistance(distance);  //Pixi.tween.TweenPath() provided function to get the position {x,y} by certain distance accordingly. therefore I can use it .
		//console.log('pos'+pos);
		const scale = tweenFunc(timeDelta,this.flyingUfoIcon.orgStyle.scale, 1, duration);
		const rotation = tweenFunc(timeDelta, this.flyingUfoIcon.orgStyle.rotation, 0, duration);
		this.flyingUfoIcon.updateCurrentStyle({"_left": parseInt(pos.x), "_top":parseInt(pos.y), "_opacity": 1,  "_transform":{"_rotate":rotation, "_scale":{"_x":scale, "_y":scale}}});
	};
	ReelSetController.prototype.sBonusFlyKeyAnimComplete = function (){
		if(this.isEveryThingOkay()){
			this.startUfoPingPongAnimation();
		}
	};
	ReelSetController.prototype.startUfoPingPongAnimation = function(){
		if(!this.sBonusTransitionKeyAnim.fadeOutCompleteCallback){
			this.sBonusTransitionKeyAnim.fadeOutUpdateCallback = new CallbackFunc(this, this.sBonusFadeOutKeyAnimUpdate);
			this.sBonusTransitionKeyAnim.fadeOutCompleteCallback = new CallbackFunc(this, this.sBonusFadeOutKeyAnimComplete);	
		}
		this.sBonusTransitionKeyAnim._onUpdate = this.sBonusTransitionKeyAnim.fadeOutUpdateCallback;
		this.sBonusTransitionKeyAnim._onComplete = this.sBonusTransitionKeyAnim.fadeOutCompleteCallback;
		this.sBonusTransitionKeyAnim.maxTime = config.timers.standard_UFOPingPongMovementDuration;
		this.sBonusTransitionKeyAnim.isPingPong = true;
		this.sBonusTransitionKeyAnim.play();
	};
	ReelSetController.prototype.sBonusFadeOutKeyAnimUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		if(this.sBonusTransitionKeyAnim.isPingPong){
			const tweenFunc = TweenFunctions.pingPong;
			const duration = keyFrameAnim.maxTime;
			timeDelta = Math.ceil(timeDelta);
			const currentY = this.flyingUfoIcon.getCurrentStyle()._top;
			const y = tweenFunc(timeDelta, currentY, currentY, duration, 0.5, 1);
			this.flyingUfoIcon.updateCurrentStyle({_top:y});
		}
		else{
			const tweenFunc = TweenFunctions.linear;
			const duration = keyFrameAnim.maxTime;
			timeDelta = Math.ceil(timeDelta);
			const scale = tweenFunc(timeDelta,1, 3, duration);
			const opacity = tweenFunc(timeDelta, 1, 0, duration);
			this.flyingUfoIcon.updateCurrentStyle({"_opacity": opacity, "_transform":{"_scale":{"_x":scale, "_y":scale}}});
		}
	};
	ReelSetController.prototype.sBonusFadeOutKeyAnimComplete = function (){
		if(this.isEveryThingOkay()){
			if(this.sBonusTransitionKeyAnim.isPingPong){
				this.sBonusTransitionKeyAnim.maxTime = config.timers.standard_UFOZoomInAndFadeOutDuration;
				this.sBonusTransitionKeyAnim.isPingPong = false;
				this.sBonusTransitionKeyAnim.play();
				const standardBonusData = {"rs":this.playResponseData.standardBonus.shift(), "currentStake":this.playResponseData.currentStake};
				msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ENTRE_TRANSITION_START, standardBonusData);
			}
			else{
				this.spaceshipCommander.motherSprite.getParent().show(true);
				this.flyingUfoIcon.show(false);
			}
		}
	};

/*Standard Bonus section End*****************************************************************************************************************************************/

/*Action Bonus section start*****************************************************************************************************************************************/
	ReelSetController.prototype.initActionBonusFlyingETAnimation = function() {
		this.actionBonusFlyingETAnimation = new KeyFrameAnimation({
			"_name": 'actionBonusFlyingETAnimation',
			"tweenFunc": TweenFunctions.linear,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.standard_startReelSpinningDelay,
					"_SPRITES": []
				}
			]
		});
		this.actionBonusFlyingETAnimation._onUpdate = new CallbackFunc(this, this.actionBonusFlyingETAnimationOnUpdate);
		this.actionBonusFlyingETAnimation._onComplete = new CallbackFunc(this, this.actionBonusFlyingETAnimationOnComplete);
	};
	ReelSetController.prototype.actionBonusFlyingETAnimationOnUpdate = function({caller:keyFrameAnim, time:timeDelta}) {
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		if(this.isPortrait()){
			//portrait mode, animate from top right to bottom left horizontally
			const x = tweenFunc(timeDelta, gr.getSize().width, -3 * this.actionBonusFlyingETSprite.getCurrentStyle()._width, duration); // from top right to bottom left
			//const x = tweenFunc(timeDelta, -this.actionBonusFlyingETSprite.getCurrentStyle()._width, gr.getSize().width, duration);  // from top left to bottom right.
			const amplitude = 300;
			const y = parseInt(this.actionBonusFlyingETSprite.data._style._top - this.sinMovement(timeDelta, amplitude, duration));
			const scale = tweenFunc(timeDelta, 1, 3, duration);
			this.actionBonusFlyingETSprite.updateCurrentStyle({"_top": y, "_left":x, "_transform":{"_scale":{"_x":scale, "_y":scale}}});
		}
		else{
			//landscape mode, animate from top right to bottom left vertically.
			//const y = tweenFunc(timeDelta, gr.getSize().height, -3 * this.actionBonusFlyingETSprite.getCurrentStyle()._height, duration); // from top right to bottom left
			const y = tweenFunc(timeDelta, -this.actionBonusFlyingETSprite.getCurrentStyle()._height, gr.getSize().height, duration);  // from top right to bottom left.
			const amplitude = 220;
			const x = parseInt(this.actionBonusFlyingETSprite.data._style._left + this.sinMovement(timeDelta, amplitude, duration));
			const scale = tweenFunc(timeDelta, 1, 3, duration);
			this.actionBonusFlyingETSprite.updateCurrentStyle({"_top": y, "_left":x, "_transform":{"_scale":{"_x":-scale, "_y":scale}}});	
		}
	};
	ReelSetController.prototype.actionBonusFlyingETAnimationOnComplete = function() {
		if(this.spaceshipCommander.isPlaying() === false && this.meteoriteCommander.isPlaying() === false){
			this.etBonusSprite.show(true);
			this.chooseABullet();			
			this.meteoriteCommander.startBulletLoading();
			const _this = this;
			this.etBonusSprite.onComplete = function(){
				_this.fireBullet();
				_this.entreActionBonus();
			};
			this.playSoundByConfig("eTSlideIn");
			this.etBonusSprite.gotoAndPlay('actionLittle', 0.4);
			this.meteoriteCommander.startHaloAnimation(true);
			this.outterLightFadeKeyAnim.isFadeIn = true;
			this.outterLightFadeKeyAnim.play();
		}
		else{
			//wait until UFOController animation complete.
			if(!this.startActionBonusCallback){
				this.startActionBonusCallback = new CallbackFunc(this, this.actionBonusFlyingETAnimationOnComplete);
			}
			this.queue(this.startActionBonusCallback);
		}
	};

	ReelSetController.prototype.sinMovement = function(timeDelta, amplitude, duration) {
		return amplitude * Maths.sin(Math.PI * (0.5 +  timeDelta / duration));
	};
	ReelSetController.prototype.playETCrossOverAnimation = function (){
		this.actionBonusFlyingETAnimation.play();
	};
	ReelSetController.prototype.initHiddenHero = function (){
		const symbolData = {};
		symbolData.symbolsMap = Object.assign({},config.symbolsMap);
		symbolData.sourceObj = gr.lib.doNotRemoveThis;
		symbolData.symOffPositionY = 553;
		symbolData.symOrderIndex = -1;
		symbolData.ReelId = -1;
		this.hiddenHero = new ReelSymbol(symbolData);
	};
	ReelSetController.prototype.initActionBonusSprites = function (){
		this.etBonusSprite = gr.lib._ETInABonus;
		this.etBonusSprite.show(false);
		this.etsBulletSprite = gr.lib._bullet;
		this.etsBulletMainPanetSprite = gr.lib._actionMainPlanet;
		this.etsBulletTrailingSprite = gr.lib._trailing;
		this.etsBulletExplosionSprite = gr.lib._actionExplosion;
		this.etsBulletActionRaySprite = gr.lib._actionRay;
		this.etsBulletExplosionSprite.show(false);
		this.etsBulletActionRaySprite.show(false);
		this.etsBulletSprite.orgPos = {_top:this.etsBulletSprite.getCurrentStyle()._top, _left:this.etsBulletSprite.getCurrentStyle()._left};
		this.etsBulletSprite.show(false);
		this.actionBonusKeyMap = config.actionBonusEffect;
	};
	ReelSetController.prototype.startActionBonusTransition = function (){
		if(this.spaceshipCommander.isPlaying() === false && this.meteoriteCommander.isPlaying() === false){
			this.actionBonusFlyingETAnimation.play();
		}
		else{
			//wait until UFOController animation complete.
			if(!this.startActionBonusCallback){
				this.startActionBonusCallback = new CallbackFunc(this, this.startActionBonusTransition);
			}
			this.queue(this.startActionBonusCallback);
		}
	};
	ReelSetController.prototype.initOutLightFadeKeyAnimation = function (){
		this.outterLightFadeKeyAnim = new KeyFrameAnimation({
			"_name": 'bGameOutterLightFade',
			"tweenFunc":  TweenFunctions.linear, //TweenFunctions.easeOutElastic, 
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.action_honeyCombBolderFadeInAndOutDuration,
					"_SPRITES": []
				}
			]
		});
		this.outterLightFadeKeyAnim._onUpdate = new CallbackFunc(this, this.bGameOutterLightFadeOnUpdate);
		this.outterLightFadeKeyAnim._onComplete = new CallbackFunc(this, this.bGameOutterLightFadeOnComplete);
		this.outterLightFadeKeyAnim.isFadeIn = true;
	};

	ReelSetController.prototype.bGameOutterLightFadeOnUpdate = function({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		if(this.outterLightFadeKeyAnim.isFadeIn){
			const opacity = tweenFunc(timeDelta, 0, 1, duration);
			this.outterLight.updateCurrentStyle({"_opacity": opacity});
		}
		else{
			const opacity = tweenFunc(timeDelta, 1, 0, duration);
			this.outterLight.updateCurrentStyle({"_opacity": opacity});
		}
	};
	ReelSetController.prototype.bGameOutterLightFadeOnComplete = function() {
		if(this.outterLightFadeKeyAnim.isFadeIn === false){
			if(this.activeAction.type == "S"){
				//on Spin action
				this.showWinSequence();
			}
			//console.log("exit Play baseGameLoop sound");
			if(this.isCurrentPlayingSound("baseGameLoop") === false){
				this.playSoundByConfig("baseGameLoop", true);
			}
		}
	};
	ReelSetController.prototype.chooseABullet = function (){
		const featureCode = this.playResponseData.actionBonus.shift();
		this.activeAction = this.actionBonusKeyMap[featureCode];
		this.activeAction.type = featureCode.substr(0,1);
		if(this.activeAction.type == "S"){ // "S" is a spin action 
			this.etsBulletMainPanetSprite.setImage('actionE');
		}
		else{
			//"R" is removal action 
			this.etsBulletMainPanetSprite.setImage('actionD');
		}
	};
	ReelSetController.prototype.entreActionBonus = function (){
		if(this.isEveryThingOkay()){
			this.etBonusSprite.onComplete = null;
			this.etBonusSprite.gotoAndPlay("etFireBalls", 0.3, true);
			//this.meteoriteCommander.startBulletLoading();
			//this.chooseABullet();
		}
	};
	ReelSetController.prototype.exitActionBonus = function (){
		this.meteoriteCommander.stopHaloAnimation();
		this.etBonusSprite.stopPlay();
		this.etBonusSprite.show(false);
		this.outterLightFadeKeyAnim.isFadeIn = false;
		if(this.activeAction.type == "S"){
			//on Spin action
			this.outterLightFadeKeyAnim.play();			
			//this.showWinSequence(); move this action to be executed in bGameOutterLightFadeOnComplete
		}
		else{
			//on removal action
			this.outterLightFadeKeyAnim.isStillOnActionBonus = true;
			this.nextWin();
		}
	};

	ReelSetController.prototype.loopAllScenario = function(type){
		if(type == "S"){
			if(!this.ind || this.ind > 10){
				this.ind = 0;
			}
		}
		else{
			if(!this.ind || this.ind > 17){
				this.ind = 11;
			}
		}
		this.k = Object.keys(this.actionBonusKeyMap)[this.ind];
		this.ind++;
		this.activeAction = this.actionBonusKeyMap[this.k];
		this.activeAction.type = type;
	};
	ReelSetController.prototype.doRemovalAction = function() {
		this.remainWinSequenceArray = JSON.parse(JSON.stringify(this.activeAction.source)); // deep clone an Array;
		//this.remainWinSequenceArray.isFromActionBonus = true;
		this.exitActionBonus();
	};	
	ReelSetController.prototype.doSpinAction = function() {
		if(!this.spinFeatureKeyFrameAnim){
			this.initSpinKeyFrameAnimation();
		}
		if(this.activeAction.currentRound != this.activeAction.totalRoundNum){
			this.playSoundByConfig('aBonusPerSpin');
			let symbol, nextSymbol,chain, colourCode;
			for( let n = 0; n < this.activeAction.source.length; n++){
				chain = this.activeAction.source[n];
				colourCode = this.activeAction.colourCodes[n];
				for(let i = 0 ; i < chain.length ; i++){
					const [reelId, symbolId] = this.translatePostionCode(chain[i]);
					symbol = this.getReelById(reelId).getSymbolById(symbolId);
					symbol.applyStaticHoneyComb(colourCode);
					const [nextRId, nextSId] = this.translatePostionCode(chain[(i+1)%chain.length]);
					nextSymbol = this.getReelById(nextRId).getSymbolById(nextSId);
					symbol.target = {"pos":nextSymbol.getOriginalPos(), symbolCode:nextSymbol.getSymbolCode(), bonusCode:nextSymbol.getBonusCode()};
				}
			}
			this.spinFeatureKeyFrameAnim.play();
		}
		else{
			//Action Spin Round completed. Now need to turn off the background honeyComb
			let symbol;
			for( const chain of this.activeAction.source){
				for(let i = 0 ; i < chain.length ; i++){
					const [reelId, symbolId] = this.translatePostionCode(chain[i]);
					symbol = this.getReelById(reelId).getSymbolById(symbolId);
					symbol.hideHoneyComb();
				}
			}
			this.exitActionBonus();
			//this.takeAnAction(); for debug use only to check all the scenario, to use this you need to comment out this.exitActionBonus();
		}
	};	
	ReelSetController.prototype.spinKeyFrameOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let symbol,newX,newY;
		for( const chain of this.activeAction.source){
			for(let i = 0 ; i < chain.length ; i++){
				const [reelId, symbolId] = this.translatePostionCode(chain[i]);
				symbol = this.getReelById(reelId).getSymbolById(symbolId);
				newX = tweenFunc(timeDelta, symbol.getOriginalPos().x, symbol.target.pos.x , duration);
				newY = tweenFunc(timeDelta, symbol.getOriginalPos().y, symbol.target.pos.y , duration);
				symbol.moveTo({"x":newX,"y":newY});
			}
		}
		//console.log(timeDelta+","+duration);
	};
	ReelSetController.prototype.spinKeyFrameOnComplete = function (){
		this.activeAction.currentRound++;
		let symbol, nextSymbol;
		for( let chain of this.activeAction.source){
			chain = Object.assign([], chain); //make it self a copy, therefore any modification wont apply on the orginal reference.
			chain = chain.reverse(); // clone need to be done anti-clockwise, so I reverse the array element 
			for(let i = 0 ; i < chain.length ; i++){
				const [reelId, symbolId] = this.translatePostionCode(chain[i]);
				symbol = this.getReelById(reelId).getSymbolById(symbolId);
				const [nextRId, nextSId] = this.translatePostionCode(chain[(i+1)%chain.length]);
				nextSymbol = this.getReelById(nextRId).getSymbolById(nextSId);
				if(i == 0){
					/*
					* 	the first symbol need to duplicate itself on to the this.hiddenHero symbol
					*   in order to save its status for the last one in the chain to copy, 
					*  	before it doing the clone.	
					*/
					this.cloneSymbol(this.hiddenHero, symbol);
				}
				
				if (i == (chain.length-1)){
					/*
						the last symbol in the chain will need to clone from the this.hiddenHero rather than the next symbol,
						because the next symbol has been changed  before the clone action.
					*/
					this.cloneSymbol(symbol, this.hiddenHero);
				}
				else{
					// all the other symbol just do the simple clone from the next symbol in the chain.
					this.cloneSymbol(symbol, nextSymbol);
				}
				symbol.target = null; //release the property "target".
			}
		}
		this.doSpinAction(); 
	};
	/*
		the source symbol will copy everything except the position from the target symbol, after copy has been done, it will move to its orginalPos
	*/
	ReelSetController.prototype.cloneSymbol = function (sourceObj, targetObj){
		if(this.isEveryThingOkay()){
			//apply targetObj symbol code on the sourceObj
			sourceObj.applySymbolCode(targetObj.getSymbolCode());
			//move sourceObj to the targetObj's original position.
			sourceObj.moveTo(sourceObj.getOriginalPos());
			sourceObj.stopBonusAnimation();
			if(targetObj.getBonusCode() !== "0"){
				//stop bonusDisplay animation, record its currentFrame index, apply targetObj bonus code on the sourceObj, and synchronise the animation
				const targetBonusCode = targetObj.getBonusCode();
				const currentFrameIndex = targetObj.stopBonusAnimation();
				sourceObj.applyBonusCode(targetBonusCode, currentFrameIndex);
			}
		}
	};
	ReelSetController.prototype.initSpinKeyFrameAnimation = function (){
		this.spinFeatureKeyFrameAnim = new KeyFrameAnimation({
			"_name": 'spinFeatureAnimation',
			"tweenFunc": TweenFunctions.easeInQuint, //TweenFunctions.linear,//
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.action_spinActionPerMovementDuration,
					"_SPRITES": []
				}
			]
		});
		this.spinFeatureKeyFrameAnim._onUpdate = new CallbackFunc(this, this.spinKeyFrameOnUpdate);
		this.spinFeatureKeyFrameAnim._onComplete = new CallbackFunc(this, this.spinKeyFrameOnComplete);
	};
	ReelSetController.prototype.fireBulletCompleted = function() {
		//this.etsBulletSprite.show(false);
		this.etsBulletMainPanetSprite.show(true);
		this.etsBulletTrailingSprite.show(true);
		this.etsBulletTrailingSprite.gotoAndPlay('trailing_preload', 1, false);
		const _this = this;
		this.etsBulletTrailingSprite.onComplete = function(){
			_this.playAntionPlanetEffectAnimation();
		};
	};
	ReelSetController.prototype.playAntionPlanetEffectAnimation = function (){
		this.etsBulletMainPanetSprite.show(false);
		this.etsBulletTrailingSprite.show(false);
		this.etsBulletExplosionSprite.show(true);
		this.etsBulletActionRaySprite.show(true);
		this.earthQuakeKeyFrameAnim.play();
		this.playSoundByConfig("bulletExplosion");
		this.etsBulletExplosionSprite.gotoAndPlay('ActionExplosion', 0.5, false);
		this.etsBulletActionRaySprite.gotoAndPlay('ActionRay', 0.8, false);
		const _this = this;
		this.etsBulletActionRaySprite.onComplete = function (){
			_this.takeAnAction();
		};
	};
	ReelSetController.prototype.fireBullet = function (){
		if(!this.fireBulletKeyFrameAnim){
			this.initBulletKeyFrameAnimation();
		}
		this.etsBulletSprite.show(true);
		this.etsBulletMainPanetSprite.show(true);
		this.etsBulletTrailingSprite.show(true);
		this.etsBulletExplosionSprite.show(false);
		this.etsBulletActionRaySprite.show(false);
		this.etsBulletTrailingSprite.onComplete = null;
		this.etsBulletTrailingSprite.gotoAndPlay('trailing_flying', 0.5, false);
		this.playSoundByConfig('bulletShot');
		this.fireBulletKeyFrameAnim.play();
	};	
	ReelSetController.prototype.takeAnAction = function (){
		this.etsBulletSprite.show(false);
		this.etsBulletExplosionSprite.show(false);
		this.etsBulletActionRaySprite.show(false);
		//this.loopAllScenario("S"); if you want to test here you also need to enable the this.takeAnAction() in doSpinAction function.
		if(this.activeAction.type == "S"){
			if(!this.activeAction.totalRoundNum){
				this.activeAction.totalRoundNum = this.activeAction.source[0].length * 0.5;
			}
			this.activeAction.currentRound = 0;
			this.doSpinAction();
		}	
		else{
			this.doRemovalAction();
		}
	};
	ReelSetController.prototype.fireBulletOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let x, y;
		if(this.isPortrait()){
			y = tweenFunc(timeDelta, this.etsBulletSprite.orgPos._top, 645, duration);
			x = tweenFunc(timeDelta, this.etsBulletSprite.orgPos._left, 305, duration);
		}
		else{
			y = tweenFunc(timeDelta, this.etsBulletSprite.orgPos._top, 286, duration); //279
			x = tweenFunc(timeDelta, this.etsBulletSprite.orgPos._left, 914, duration); //897
		}
		const scale = tweenFunc(timeDelta, 0.1, 1, duration);
		const rotation = tweenFunc(timeDelta, 1, 1440, duration);
		this.etsBulletSprite.updateCurrentStyle({"_left": x, "_top":y, "_transform":{"_scale":{"_x":scale, "_y":scale}}});
		this.etsBulletMainPanetSprite.updateCurrentStyle({'_transform':{'_rotate':rotation}});
	};
	ReelSetController.prototype.initBulletKeyFrameAnimation = function (){

		this.fireBulletKeyFrameAnim = new KeyFrameAnimation({
			"_name": this.etsBulletSprite.getName()+'FireBullet',
			"tweenFunc": TweenFunctions.linear,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.action_bulletFlyingDuration,
					"_SPRITES": []
				}
			]
		});
		this.fireBulletKeyFrameAnim._onUpdate = new CallbackFunc(this, this.fireBulletOnUpdate);
		this.fireBulletKeyFrameAnim._onComplete = new CallbackFunc(this, this.fireBulletCompleted);
	};
/*Action Bonus section End*****************************************************************************************************************************************/

	ReelSetController.prototype.queue = function (callbackObj){
		if(this.isEveryThingOkay()){
			gr.getTimer().setTimeout(function (){
				callbackObj.handler.call(callbackObj.subscriberRef);
			}, 300);
		}
	};

	ReelSetController.prototype.gameFinished = function (){
		msgBus.publish('allRevealed', {
			tierPrizeShown: this.playResponseData.prizeDivision,
			formattedAmountWonShown: this.playResponseData.prizeValue
		});	
	};
	ReelSetController.prototype.translatePostionCode = function (codeNum){
		const newCode = this.positionDictionary[codeNum*1-1];
		return [newCode.substring(0,2), newCode];
	};
	
	ReelSetController.prototype.getReelById = function(id){
		return this.reels[id];
	};
	ReelSetController.prototype.getReelAtIndex = function (num0To6){
		num0To6 = parseInt(num0To6);
		if(this.reels.reception[num0To6]){
			return this.reels[this.reels.reception[num0To6]];
		}
		else{
			throw new Error('Can not found Reels at '+ num0To6);
		}
	};
	ReelSetController.prototype.getNumOfReels = function() {
		return this.reels.reception.length;
	};

	ReelSetController.prototype.moveTo = function (posObj){
		let newPos = {};
		if(posObj.x){
			newPos._left = posObj.x;
		}
		if(posObj.y){
			newPos._top = posObj.y;
		}
		if(Object.keys(newPos).length){
			this.reelset.updateCurrentStyle(newPos);
		}
	};

	/*
		sample of the options {}
		{
			name:name,
			x:[startVal, targetVal],
			y:[startVal, targetVal],
			scaleX:[startVal, targetVal],
			scaleY:[startVal, targetVal],
			opacity':[startVal, targetVal],
			rotation:[startVal, targetVal],
			updateFunc: updateFunction,
			completeFunc completeFunction
		}
	*/
	ReelSetController.prototype.genKeyAnimateData = function(obj, duration = 500, options = {}, tweenFunc = TweenFunctions.linear) {
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
						"_time": duration,
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
	/*
		Provide a function to create customised spritesheets playing order based on the existing sprite sheets.
	*/
	ReelSetController.prototype.addSpriteAnimation = function() {
		const fullMovie_remove = Sprite.getSpriteSheetAnimationFrameArray('remove');
		let part1 = [0,1,2,3,4,5,6,7];
		//let part2 = [7,8,9,10,11,12,13,14,15,16,17,18]; 
		let part2 = [7,8,9,10,11,12,13,14,15,16,17,18];

		part1 = this.genNewSpriteArray(fullMovie_remove, part1);
		part2 = this.genNewSpriteArray(fullMovie_remove, part2);

		Sprite.addSpriteSheetAnimation('removePart1',part1);
		Sprite.addSpriteSheetAnimation('removePart2',part2);

		const fullMovie_spaceship = Sprite.getSpriteSheetAnimationFrameArray('spaceship');

		part1 = this.genNewSpriteArray(fullMovie_spaceship, ["0~4"]); // LitUp  
		part2 = this.genNewSpriteArray(fullMovie_spaceship, ["5~10"]); // ToWhite
		let part3 = this.genNewSpriteArray(fullMovie_spaceship, [10,12,13,14]); // Disappear
		let part4 = this.genNewSpriteArray(fullMovie_spaceship, ["5~10",10,9,8,6,5]); //Activation
		Sprite.addSpriteSheetAnimation('spaceshipLitUp',part1);
		Sprite.addSpriteSheetAnimation('spaceshipToWhite',part2);
		Sprite.addSpriteSheetAnimation('spaceshipDisappear',part3);
		Sprite.addSpriteSheetAnimation('spaceshipActivation',part4);

		const fullMovie_meteorite = Sprite.getSpriteSheetAnimationFrameArray('meteorite');
		part1 = this.genNewSpriteArray(fullMovie_meteorite, [0,1,2,3,4]); // LitUp   
		part2 = this.genNewSpriteArray(fullMovie_meteorite, [5,6,7,8,9,10]); // ToWhite
		part3 = this.genNewSpriteArray(fullMovie_meteorite, [10,12,13,14]); // Disappear
		part4 = this.genNewSpriteArray(fullMovie_meteorite, [5,6,7,8,9,10,10,9,8,6,5]); //Activation
		Sprite.addSpriteSheetAnimation('meteoriteLitUp',part1);
		Sprite.addSpriteSheetAnimation('meteoriteToWhite',part2);
		Sprite.addSpriteSheetAnimation('meteoriteDisappear',part3);
		Sprite.addSpriteSheetAnimation('meteoriteActivation',part4);

		const fullMovie_et = Sprite.getSpriteSheetAnimationFrameArray('actionLittle');
		part1 = this.genNewSpriteArray(fullMovie_et, ["3~16","17~32"]); // firing
		Sprite.addSpriteSheetAnimation('etFireBalls', part1);

		const fullMovie_trailing = Sprite.getSpriteSheetAnimationFrameArray('ActionTrailingLight');
		part1 = this.genNewSpriteArray(fullMovie_trailing, ['0~8']);
		part2 = this.genNewSpriteArray(fullMovie_trailing, ['9~24','9~24','9~24']);
		Sprite.addSpriteSheetAnimation('trailing_flying', part1);
		Sprite.addSpriteSheetAnimation('trailing_preload', part2);
		
		for (let i = 1 ; i<7 ; i++){
			const fullMovie = Sprite.getSpriteSheetAnimationFrameArray('x0'+i+'x');
			part1 = this.genNewSpriteArray(fullMovie, ['0~18']);
			part2 = this.genNewSpriteArray(fullMovie, ['0~5',19]);
			part3 = this.genNewSpriteArray(fullMovie, ['0~19']);
			Sprite.addSpriteSheetAnimation('x0'+i+'x_highLight', part1);
			Sprite.addSpriteSheetAnimation('x0'+i+'x_win', part2);
			Sprite.addSpriteSheetAnimation('x0'+i+'x_highLightAndWon', part3);
		}

		const fullMovie_actionB = Sprite.getSpriteSheetAnimationFrameArray('actionB');
		part1 = this.genNewSpriteArray(fullMovie_actionB, ['0~17','0~17']);
		part2 = this.genNewSpriteArray(fullMovie_actionB, ['0~17','0~17','0~17']);
		Sprite.addSpriteSheetAnimation('actionBx2', part1);
		Sprite.addSpriteSheetAnimation('actionBx3', part2);
	};
	ReelSetController.prototype.genNewSpriteArray = function (sourceArray, newArrayIndices){
		let rtArr = [];
		newArrayIndices.map(index => {
			if(typeof index === "number"){
				if( typeof sourceArray[index] !== "undefined"){
					rtArr.push(sourceArray[index]) ;
				}
				else{
					console.warn(`Sorry, element index '${index}' is not found in the giving array! `);
				}
			}
			else if(typeof index === "string" && index.indexOf('~') !== -1){
				const [start, end] = index.split("~");
				let newArr = [];
				for(let i = start*1 ; i <= end*1 ; i++){
					newArr.push(i);
				}
				const temp = this.genNewSpriteArray(sourceArray, newArr);
				rtArr = rtArr.concat(temp);
			}
		});
		return rtArr;
	};
	ReelSetController.prototype.playSoundByConfig = function(soundName, isloop = false){
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
	ReelSetController.prototype.isCurrentPlayingSound = function(soundName){
		const audioObj = config.audio[soundName];
		if(audioObj){
			return audio.currentPlaying(audioObj.channel) === audioObj.name;
		}
		else{
			return false;
		}
	};
	return ReelSetController;

});