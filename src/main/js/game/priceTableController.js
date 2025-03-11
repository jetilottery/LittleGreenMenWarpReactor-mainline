/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-07-01 13:59:17
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-10-24 11:15:08
*/
define(function module(require){
	let	PIXI = require('com/pixijs/pixi');
	const msgBus   	= require('skbJet/component/gameMsgBus/GameMsgBus');
    const gr 			= require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const loader		= require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const config 		= require('game/configController');
    const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
    const gameUtils		= require('game/utils/gameUtils');
    const PriceTableElement = require("game/component/priceTableElement");
    const SKBeInstant	= require('skbJet/component/SKBeInstant/SKBeInstant');
    const LittleGreenMenGameEvent	= require('game/events/littleGreenMenGameEvent');
    const TweenFunctions = require('game/utils/tweenFunctions');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const Sprite = require('skbJet/component/gladPixiRenderer/Sprite');
	const CallbackFunc = require('game/component/callbackFunc');
	function PriceTableController(){
		this.headerText = null;
		this.items = {reception:[]};
		this.mask = null;
		this.maskParent = null;
		this.dataTable = null;
		this.displaySprite = null;
		this.winningRecodeJustInCase = [];
		this.container = null;
		this.mainIntroText = null;
		this.labelTextLevel_1 = null;
		this.labelTextLevel_2 = null;
		this.labelTextLevel_3 = null;
		this.prizeDetailsSprite = null;
		this.prizeDetailsFadeOutAnim = null;
		this.planetPool = {reception:[],used:[],free:[], spriteStyle:{w:120,h:120}};
		this.planetFlyAnimation = {};
		this.addEventListeners();
		//window.pc = this;
	}
	PriceTableController.prototype.addEventListeners = function() {
		msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
		msgBus.subscribe('ticketCostChanged', new CallbackFunc(this, this.onTicketCostChanged));
		msgBus.subscribe("playerWantsPlayAgain", new CallbackFunc(this, this.onPlayerWantsPlayAgain));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.PRICETABLE_FIGURE_UPDATE, new CallbackFunc(this, this.onFigureUpdated));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ENTRE_TRANSITION_COMPLETE, new CallbackFunc(this, this.rePositionForStandardBonus));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_EXIT_TRANSITION_START, new CallbackFunc(this, this.rePositionForBasegame));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.PLANET_FIRE, new CallbackFunc(this, this.planetFireHandler));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.FADEOUT_PRIZEDETAILS, new CallbackFunc(this, this.fadeOutMyPrizeTable));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.PRESSED_PRIZEDETAILS, new CallbackFunc(this, this.startFadeOutCountDown));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.MOUSE_OUT_PRIZEDETAILS, new CallbackFunc(this, this.startFadeOutCountDown));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.MOUSE_OVER_PRIZEDETAILS, new CallbackFunc(this, this.cancelFadeOutCountDown));
	};
	PriceTableController.prototype.playSoundByConfig = function(soundName, isloop = false){
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
	PriceTableController.prototype.onPlayerWantsPlayAgain = function (){
		// here we want to reset all the element in the price table.
		this.fadeOutMyPrizeTable();
		for (const code of this.items.reception){
			this.items[code].resetAll();
		}

	};
	PriceTableController.prototype.isPortrait = function (){
		return gr.getSize().height > gr.getSize().width;
	};
	PriceTableController.prototype.rePositionForStandardBonus = function() {
		this.handleTextWithImage(this.headerText, loader.i18n.Game.warpBonus_header.split(new RegExp('[\n]','g')));
		if(this.isPortrait()){
			this.displaySprite.updateCurrentStyle({_top:135});
			this.headerText.updateCurrentStyle({"_opacity":1});
		}
		else{
			this.displaySprite.updateCurrentStyle({_top:302});
		}
	};
	PriceTableController.prototype.rePositionForBasegame = function() {
		this.handleTextWithImage(this.headerText, loader.i18n.Game.payTable_bottom_text.split(new RegExp('[\n]','g')));
		if(this.isPortrait()){
			this.headerText.updateCurrentStyle({"_opacity":0});
			this.displaySprite.updateCurrentStyle({_top:178});
		}
		else{
			this.displaySprite.updateCurrentStyle({_top:352});
		}
	};
	/*accept Bunch of figure update together*/
	PriceTableController.prototype.onFigureUpdated = function (evt){
		if(evt){
			this.dataTable = evt;
			//push in the record object for tracking purpose in debug.
			this.winningRecodeJustInCase.push(Object.assign({}, evt));
			/* move this action to planetFlyAnimation_part2_OnComplete function
			for(const id of this.dataTable.reception){
				const planetEle = this.getItemById(id);
				const figure = this.dataTable[id];
				planetEle.setAchievedValue(figure);
			}
			this.updataMeterWin();*/
		}
		else{
			throw new Error("figure argument missing");
		}
	};
	PriceTableController.prototype.updataMeterWin = function (){
		let planetItem = null, winnings = 0;
		for(const id of this.items.reception){
			planetItem = this.getItemById(id);
			winnings += planetItem.getWinningAmount();
		}
		if(winnings){
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.METER_UPDATE_WINNING, winnings);
		}
	};
	PriceTableController.prototype.init = function() {
		this.maskParent = gr.lib._digitalPlanet.pixiContainer;
		this.displaySprite = gr.lib._digitalBottom;
		this.container = gr.lib._ufoPlanetNavyContainer.pixiContainer;
		this.createMask();
		this.setupPlanetFlyAnimation();
		this.labelTextLevel_1 = gr.lib._level_1_achived;
		this.labelTextLevel_2 = gr.lib._level_2_achived;
		this.labelTextLevel_3 = gr.lib._level_3_achived;
		this.labelTextLevel_1.setText('10');
		this.labelTextLevel_2.setText('13');
		this.labelTextLevel_3.setText('16');
		this.prizeDetailsSprite = gr.lib._ptOutline;
		this.prizeDetailsSprite.updateCurrentStyle({"_opacity":0});
		this.mainIntroText = gr.lib._ptIntroTextMain;
		if(config.textAutoFit.mainIntroText){
			this.mainIntroText.autoFontFitText = config.textAutoFit.mainIntroText.isAutoFit;
		}
		this.mainIntroText.setText(loader.i18n.Game.payTableIntroText);
		this.headerText = gr.lib._priceTableHeaderText;
		if (config.style.priceTableHeaderText) {
            gameUtils.setTextStyle(this.headerText, config.style.priceTableHeaderText);
        }
		this.headerText.setText(loader.i18n.Game["payTable_bottom_text"]);
		this.handleTextWithImage(this.headerText, loader.i18n.Game.payTable_bottom_text.split(new RegExp('[\n]','g')));
		this.setupElementText();
		this.updateText();
	};

	PriceTableController.prototype.fadeOutMyPrizeTable = function (){
		if(this.prizeDetailsSprite.getCurrentStyle()._opacity === 1){
			if(this.prizeDetailsFadeOutAnim){
				this.prizeDetailsFadeOutAnim.play();
			}
			else{
				this.initPTFadeOutAnimation();
			}
		}
	};
	PriceTableController.prototype.startFadeOutCountDown = function (){
		this.cancelFadeOutCountDown();
		const _this = this;
		this.secondsCountDownTimer = gr.getTimer().setTimeout(function(){
			_this.fadeOutMyPrizeTable();
		}, config.timers.prizeDetailFadeCountDownDuration);
	};
	PriceTableController.prototype.cancelFadeOutCountDown = function (){
		if(typeof this.secondsCountDownTimer !== 'undefined'){
			gr.getTimer().clearTimeout(this.secondsCountDownTimer);
		}
	};
	
	PriceTableController.prototype.initPTFadeOutAnimation = function (){
		this.prizeDetailsFadeOutAnim = new KeyFrameAnimation({
			"_name": 'priceDetailFadeoutAnimation',
			"tweenFunc": TweenFunctions.linear,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.prizeDetailFadeoutDuration,
					"_SPRITES": []
				}
			]
		});
		this.prizeDetailsFadeOutAnim._onUpdate = new CallbackFunc(this, this.prizeDetailFadeoutOnUpdate);
		//this.prizeDetailsFadeOutAnim._onComplete = new CallbackFunc(this, this.prizeDetailFadeoutOnComplete);
		this.prizeDetailsFadeOutAnim.play();
	};
	PriceTableController.prototype.prizeDetailFadeoutOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		const opacity = tweenFunc(timeDelta, 1, 0, duration);
		this.prizeDetailsSprite.updateCurrentStyle({"_opacity":opacity});
	};
	PriceTableController.prototype.prizeDetailFadeoutOnComplete = function (){

	};
	PriceTableController.prototype.createMask = function (){
		this.mask = new PIXI.Graphics();
		this.mask.data = {};
		this.mask.data._name = "point";
		if(this.isPortrait()){
			this.mask.x = 0;
			this.mask.y = 100;
			this.mask.beginFill(0xFFFFFF);
			this.mask.lineStyle(1, 0xFFFFFF, 1);
			this.mask.drawRect(0,0,700,55);
			this.mask.endFill();
		}
		else{
			this.mask.x = 0;
			this.mask.y = 102;
			this.mask.beginFill(0xFFFFFF);
			this.mask.lineStyle(1, 0xFFFFFF, 1);
			this.mask.drawRect(0,0,350,56);
			this.mask.endFill();

			this.mask.beginFill(0xFFFFFF);
			this.mask.lineStyle(1, 0xFFFFFF, 1);
			this.mask.drawRect(0,125,350,56);
			this.mask.endFill();
		}
		this.maskParent.addChild(this.mask);
		//gr.lib._priceTableMask = this.mask; // just to give a reference to this.gr.lib, in case it needs. if not just remove this line.
		gr.lib._priceLevels.pixiContainer.mask = this.mask;
	};
	PriceTableController.prototype.setupElementText = function (){
		const elementCodes = Object.keys(config.symbolsMap);
		for(const code of elementCodes){
			if(code !== 'IW'){
				this.items[code] = new PriceTableElement({"code":code, "order":this.items.reception.length});
				this.items.reception.push(code);
			}
		}
	};
	PriceTableController.prototype.getItemById = function (id){
		return this.items[id];
	};
	PriceTableController.prototype.updateText = function (currentStake){
		if(SKBeInstant){
			const gameConfig = SKBeInstant.config.gameConfigurationDetails;
			const prizeTable = gameConfig.revealConfigurations;
			this.currentStake = (currentStake)? currentStake : gameConfig.pricePointGameDefault;
			const currentPrize = prizeTable.find(prize => prize.price === this.currentStake);
			for(const item of currentPrize.prizeTable){
				const symbolCode = item.description.substring(0, (item.description.length-1));
				if(this.items[symbolCode]){ //espected A,B,C... IW
					this.items[symbolCode].updateText(item);
				}
			}
		}
	};
	PriceTableController.prototype.onTicketCostChanged = function(prizePoint) {
		this.updateText(prizePoint);
	};
	PriceTableController.prototype.planetFireHandler = function(evt){
		this.playSoundByConfig('PlanetCollection');
		let obj, name;
		if(this.planetPool.free.length){
			// has available one
			name = this.planetPool.free.pop();
			obj = this.planetPool[name];
			this.planetPool.used.push(name);
		}
		else{
			// running out, need to create
			name = 'planetUnit'+this.planetPool.reception.length;
			obj = this.createUnit(name);
			this.planetPool[name] = obj;
			this.planetPool.reception.push(name);
			this.planetPool.used.push(name);
			this.container.addChild(obj.pixiContainer);
		}
		obj.setImage(config.symbolsMap[evt.symbolCode]);
		obj.startPos = {"_top":evt.pos.y, "_left":evt.pos.x, "_opacity":1, "_transform":{"_rotate":0, "_scale":{"_x":1,"_y":1}}};
		obj.updateCurrentStyle(obj.startPos);
		obj.show(true);
		if(!obj.targetPos || obj.targetPos.code !== evt.symbolCode){
			obj.targetPos = this.calculatePlanetPosition(evt.symbolCode);
		}
		if(this.planetFlyAnimation.part2.isPlaying() === false && this.planetFlyAnimation.part1.isPlaying() === false){
			this.planetFlyAnimation.part1.play();
		}
	};
	PriceTableController.prototype.calculatePlanetPosition = function (symbolCode){
		const parentContainerLeft = gr.lib._payTableDisplay.getCurrentStyle()._left + gr.lib._digitalBottom.getCurrentStyle()._left + gr.lib._digitalPlanet.getCurrentStyle()._left;
		const left = parentContainerLeft + gr.lib['_'+symbolCode].getCurrentStyle()._left + gr.lib['_priceIcon'+symbolCode].getCurrentStyle()._left - 6;
		const parentContainerTop = gr.lib._payTableDisplay.getCurrentStyle()._top + gr.lib._digitalBottom.getCurrentStyle()._top + gr.lib._digitalPlanet.getCurrentStyle()._top;
		const top = parentContainerTop + gr.lib['_'+symbolCode].getCurrentStyle()._top + gr.lib['_priceIcon'+symbolCode].getCurrentStyle()._top - 4;
		return {"code":symbolCode, "_left":left, "_top":top};
	};
	PriceTableController.prototype.createUnit = function(id) {
		return new Sprite({
			"_id": id,
			"_name": id,
			"_style": {
				"_width": this.planetPool.spriteStyle.w,
				"_height": this.planetPool.spriteStyle.h,
			},
			"_SPRITES": [],
		});
	};
	PriceTableController.prototype.setupPlanetFlyAnimation = function (){
		this.planetFlyAnimation.part1 = new KeyFrameAnimation({
			"_name": 'planetFlyAnim_part1',
			"tweenFunc": TweenFunctions.pingPong,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.baseGame_planetFlyPingPongDuration,
					"_SPRITES": []
				}
			]
		});
		this.planetFlyAnimation.part1._onUpdate = new CallbackFunc(this, this.planetFlyAnimation_part1_OnUpdate);
		this.planetFlyAnimation.part1._onComplete = new CallbackFunc(this, this.planetFlyAnimation_part1_OnComplete);
		this.planetFlyAnimation.part2 = new KeyFrameAnimation({
			"_name": 'planetFlyAnim_part2',
			//"tweenFunc": TweenFunctions.easeInOutBack,
			"tweenFunc": TweenFunctions.linear,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.baseGame_planetFlyCollectDuration,
					"_SPRITES": []
				}
			]
		});
		this.planetFlyAnimation.part2._onUpdate = new CallbackFunc(this, this.planetFlyAnimation_part2_OnUpdate);
		this.planetFlyAnimation.part2._onComplete = new CallbackFunc(this, this.planetFlyAnimation_part2_OnComplete);
	};
	PriceTableController.prototype.planetFlyAnimation_part1_OnUpdate = function({caller:keyFrameAnim, time:timeDelta}) {
		//ping pong effect
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let obj, startPos, newStyle; 
		for(const id of this.planetPool.used){
			obj = this.planetPool[id];
			startPos = Object.assign({}, obj.startPos);
			newStyle = {
				_top:tweenFunc(timeDelta, startPos._top, startPos._top, duration, 5, 1), // pingPong effect amplitude is 5 pixcel, 1 round of pingpong during the time
				_opacity:1
			};
			obj.updateCurrentStyle(newStyle);
		}
	};
	PriceTableController.prototype.planetFlyAnimation_part1_OnComplete = function() {
		this.planetFlyAnimation.part2.play();
	};
	PriceTableController.prototype.planetFlyAnimation_part2_OnUpdate = function({caller:keyFrameAnim, time:timeDelta}) {
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let obj, startPos, targetPos, newStyle, scale; 
		for(const id of this.planetPool.used){
			obj = this.planetPool[id];
			startPos = Object.assign({}, obj.startPos);
			targetPos = Object.assign({}, obj.targetPos);
			scale = tweenFunc(timeDelta, 1, 0.5, duration);
			newStyle = {
				"_top":tweenFunc(timeDelta, startPos._top, targetPos._top, duration),
				"_left": tweenFunc(timeDelta, startPos._left, targetPos._left, duration),
				"_opacity":tweenFunc(timeDelta, 1, 0.15, duration),
				"_transform":{
					"_rotate":0, 
					"_scale":{
						"_x":scale,
						"_y":scale
					}
				}
			};
			obj.updateCurrentStyle(newStyle);
		}
	};
	PriceTableController.prototype.planetFlyAnimation_part2_OnComplete = function() {
		let obj,id;
		while(this.planetPool.used.length){
			id = this.planetPool.used.shift();
			obj = this.planetPool[id];
			obj.show(false);
			this.planetPool.free.push(id);
		}
		
		//this.planetPool.used = [];
		for(const id of this.dataTable.reception){
			const planetEle = this.getItemById(id);
			const figure = this.dataTable[id];
			planetEle.setAchievedValue(figure);
		}
		this.updataMeterWin();
	};
	PriceTableController.prototype.handleTextWithImage = function (parentSpr, linesArr) {
		var curStyle = parentSpr._currentStyle;
		var fSize = curStyle._font._size, parentWidth = curStyle._width, parentHeight = curStyle._height, contentWidth = 0, contentHeight;
		var regImg = new RegExp('\{[^\{]+\}', 'g');

		var perLineHeight = Math.floor((curStyle._height - (linesArr.length - 1) * 10) / linesArr.length);
		var txtStyle = {fontWeight: curStyle._font._weight, fontFamily: curStyle._font._family, fontSize: fSize, fill: '#'+curStyle._text._color, align: curStyle._text._align, lineHeight: perLineHeight, height: perLineHeight};
		if(curStyle._text._gradient){
			txtStyle._gradient = curStyle._text._gradient;
		}
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
					if(txtStyle._gradient){
						updateGradientStyle(txtSpr, txtStyle._gradient);
					}
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
			function updateGradientStyle(txtObj, gStyle){
				var colorArr=[];
				for (var i = 0; i < gStyle._color.length; i++) {
						colorArr[i]="#"+gStyle._color[i];
				}
				txtObj.style.fill=colorArr;
				txtObj.style.fillGradientStops = gStyle._stop;
				if (gStyle._orientation==="horizontal") {
					txtObj.style.fillGradientType=PIXI.TEXT_GRADIENT.LINEAR_HORIZONTAL;
				}else{
					txtObj.style.fillGradientType=PIXI.TEXT_GRADIENT.LINEAR_VERTICAL;
				}
			}
			function createSubSpr(container, txtArr, imgArr) {
				var imgName, ratio, imgSpr, imgW, imgH, prevSubHeight = 0;
				for (var j = 0; j < txtArr.length; j++) {
					var txtSprite = new PIXI.Text(txtArr[j], txtStyle);
					if(txtStyle._gradient){
						updateGradientStyle(txtSprite, txtStyle._gradient);
					}
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
	return PriceTableController;
});
