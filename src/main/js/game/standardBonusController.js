/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-07-15 14:48:20
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-11-14 15:09:24
*/
define(function module(require){
	const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const PIXI = require('com/pixijs/pixi');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const LittleGreenMenGameEvent = require('game/events/littleGreenMenGameEvent');
	const ReelH = require('game/component/reelHorizontal');
	const loader		= require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
	const config 		= require('game/configController');
	const GladButton 	= require('game/component/gladButton');
	const gameUtils     = require('game/utils/gameUtils');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const TweenFunctions = require('game/utils/tweenFunctions');
	const CallbackFunc = require('game/component/callbackFunc');
	const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
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
	function StandardBonusController (){
		this.mainSprite = null;
		this.maskParent = null;
		this.reelset = null;
		this.numOfReels = 5;
		this.reels = {reception:[]};
		this.reelOffPosY = [0,0,0,0,0];
		//this.responseData = 'BDXBF';
		this.dim = null;
		this.responseData = null;
		this.goButton = null;
		this.goButtonText = null;
		this.titleText = null;
		this.headerText = null;
		this.outterLight = null;
		this.outterLightHeartBeatKeyAnim = null;
		this.fadeOutKeyFrameAnim = null;
		this.currentStake = null;
		this.ufoSprite = null;
		this.etBonusSprite = null;
		this.ufoAnimation = null;
		this.bln_terminateGameNow = false;
		this.addListeners();
		//window.sb = this;
	}
	StandardBonusController.prototype.addListeners = function() {
		msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
		//msgBus.subscribe('ticketCostChanged', new CallbackFunc(this, this.onTicketCostChanged));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.INNERPAYTABLE_CLOSED, new CallbackFunc(this, this.enableButton));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_EXIT_TRANSITION_COMPLETE, new CallbackFunc(this, this.playUfoAnimation));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ENTRE_TRANSITION_COMPLETE, new CallbackFunc(this, this.entre));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ALL_REELS_STOPPED, new CallbackFunc(this, this.allReelStoppedHandler));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ENTRE_TRANSITION_START, new CallbackFunc(this, this.beforeEntre));
		msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_ALL_WIN_SEQUENCE_COMPLETED, new CallbackFunc(this, this.exit));
		msgBus.subscribe('winboxError', new CallbackFunc(this, this.onWinBoxError));
	};
	StandardBonusController.prototype.onWinBoxError = function (err_evt){
		if (err_evt.errorCode === '29000') {
			this.bln_terminateGameNow = true;
		}
	};
	StandardBonusController.prototype.isEveryThingOkay = function (){
		return this.bln_terminateGameNow === false;
	};
	StandardBonusController.prototype.init = function (){
		this.mainSprite = gr.lib._WarpBonus;
		this.spriteToBeMask = gr.lib._WarpBonusMask;
		this.reelset = gr.lib._Pipeline02;
		this.maskParent = gr.lib._WarpBonus.pixiContainer;
		this.outterLight = gr.lib._outterShadow;
		this.ufoSprite = gr.lib._goBtnReplacement;
		this.etBonusSprite = gr.lib._ETInSBonus;
		this.etBonusSprite.show(false);
		this.outterLight.updateCurrentStyle({"_opacity":0});
		this.dim = gr.lib._BG_dim;
		this.setupButtonsAndTexts();
		this.initReels();
		this.createMask();
		this.initUfoKeyFrameAnimation ();
		this.hide();
	};
	StandardBonusController.prototype.setupButtonsAndTexts = function (){
		this.goButtonText = gr.lib._goButtonText;
		if (config.textAutoFit.goButtonText){
			this.goButtonText.autoFontFitText = config.textAutoFit.goButtonText.isAutoFit;
		}
		if(config.style.button_label){
			gameUtils.setTextStyle(this.goButtonText, config.style.button_label);
		}
		this.goButtonText.setText(loader.i18n.Game.button_go);
		this.goButton = new GladButton(gr.lib._WarpBonusOK, "mainButton", {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch':true});
		this.goButton.onClick = new CallbackFunc(this, this.goButtonOnClick);
		
		this.titleText = gr.lib._warpBonusTitle;
		this.titleText.autoFontFitText = true;
		gameUtils.setTextStyle(this.titleText, config.style.warpBonusTitle);
		this.titleText.setText(loader.i18n.Game.warpBonus_title);

		//this.headerText = gr.lib._warpBonusHeader;
		// this.headerText.autoFontFitText = true;
		// this.headerText.setText(loader.i18n.Game.warpBonus_header);
		// this.handleTextWithImage(this.headerText, loader.i18n.Game.warpBonus_header.split(new RegExp('[\n]','g')));
	};
	StandardBonusController.prototype.initReels = function() {
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
			reelData.offPositionY = this.reelOffPosY[reelSpr.orderInReelset];
			reelData.offPositionX = [-10, 810];
			//reelData.currentStake = this.currentStake;
			this.reels[reelName] = new ReelH(reelData);
			this.reels.reception.push(reelName);
		}
	};
	StandardBonusController.prototype.initUfoKeyFrameAnimation = function() {
		this.ufoAnimation = new KeyFrameAnimation({
			"_name": 'ufoArctanMovement',
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
		this.ufoAnimation._onUpdate = new CallbackFunc(this, this.ufoAnimationOnUpdate);
		this.ufoAnimation._onComplete = new CallbackFunc(this, this.ufoAnimationOnComplete);
	};
	StandardBonusController.prototype.ufoAnimationOnUpdate = function({caller:keyFrameAnim, time:timeDelta}) {
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		if(this.isPortrait()){
			//portrait mode, animate from from top left to bottom right horizontally
			//const x = tweenFunc(timeDelta, gr.getSize().width, -3 * this.ufoSprite.getCurrentStyle()._width, duration); // from top right to bottom left
			const x = tweenFunc(timeDelta, -this.ufoSprite.getCurrentStyle()._width, gr.getSize().width, duration);  // from top left to bottom right.
			const amplitude = 300;
			const y = parseInt(this.ufoSprite.data._style._top - this.ufoYMovement(timeDelta, amplitude, duration));
			const scale = tweenFunc(timeDelta, 1, 3, duration);
			this.ufoSprite.updateCurrentStyle({"_top": y, "_left":x, "_transform":{"_scale":{"_x":scale, "_y":scale}}});
		}
		else{
			//landscape mode, animate from top center to bottom right vertically.
			//const y = tweenFunc(timeDelta, this.gr.getSize().height, -3 * this.actionBonusFlyingETSprite.getCurrentStyle()._height, duration); // from top right to bottom left
			const y = tweenFunc(timeDelta, -this.ufoSprite.getCurrentStyle()._height, gr.getSize().height, duration);  // from top right to bottom left.
			const amplitude = 300;
			const x = parseInt(this.ufoSprite.data._style._left - this.ufoYMovement(timeDelta, amplitude, duration));
			const scale = tweenFunc(timeDelta, 1, 3, duration);
			this.ufoSprite.updateCurrentStyle({"_top": y, "_left":x, "_transform":{"_scale":{"_x":scale, "_y":scale}}});	
		}
	};
	StandardBonusController.prototype.ufoAnimationOnComplete = function() {
		this.etBonusSprite.show(true);
		this.playSoundByConfig('eTSlideIn');
		this.etBonusSprite.gotoAndPlay('actionLittle', 0.2);
		this.goButtonOnClick();
		const _this = this;
		this.etBonusSprite.onComplete = function(){
			_this.etBonusSprite.onComplete = null;
			_this.etBonusSprite.gotoAndPlay("etFireBalls", 0.3, true);
		};
	};

	StandardBonusController.prototype.ufoYMovement = function(timeDelta, amplitude, duration) {
		//return -amplitude * Math.atan(-amplitude + (timeDelta/duration)*amplitude*2);
		return amplitude * Maths.sin(Math.PI * (0.5 +  timeDelta / duration));
	/*function (t, b, _c, d, a = 5, r = 1){
		return b + amplitude * Maths.sin( t / d * r * 2 * Math.PI);*/
	};
	StandardBonusController.prototype.playUfoAnimation = function (){
		this.ufoAnimation.play();
	};
	StandardBonusController.prototype.disableButton = function (){
		this.goButton.enable(false);
	};
	StandardBonusController.prototype.enableButton = function (){
		this.goButton.enable(true);
	};
	StandardBonusController.prototype.goButtonOnClick = function(){
		msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_GO_BUTTON_CLICKED);
		this.goButton.enable(false);
		this.goButton.show(false);
		this.playSoundByConfig('ButtonGo');
		this.startSpin();
	};
	StandardBonusController.prototype.startShadowHeartBeat = function (){
		if(!this.outterLightHeartBeatKeyAnim){
			this.outterLightHeartBeatKeyAnim = new KeyFrameAnimation({
				"_name": this.outterLight.getName()+'HBAnimation',
				"tweenFunc": TweenFunctions.linear,
				"_keyFrames": [
					{
						"_time": 0,
						"_SPRITES": [
							{
								"_name": this.outterLight.getName(),
								"_style": {
									"_opacity":0
								}
							}
						]
					},
					{
						"_time": config.timers.standard_honeyCombHaloHeartBeat0to1Druation,
						"_SPRITES": [
							{
								"_name": this.outterLight.getName(),
								"_style": {
									"_opacity":1
								}
							}
						]
					},
					{
						"_time": config.timers.standard_honeyCombHaloHeartBeat0to1Druation + config.timers.standard_honeyCombHaloHeartBeat1to0Druation,
						"_SPRITES": [
							{
								"_name": this.outterLight.getName(),
								"_style": {
									"_opacity":0
								}
							}
						]
					}
				]
			});
		}
		this.outterLightHeartBeatKeyAnim.setLoop(true);
		this.outterLightHeartBeatKeyAnim.play();
	};
	StandardBonusController.prototype.stopShadowHeartBeat = function (){
		this.outterLightHeartBeatKeyAnim.stop();
	};
	StandardBonusController.prototype.startSpin = function (){
		//console.log(this.responseData.join(","));
		this.spinReel(0);
		this.startShadowHeartBeat();
	};
	StandardBonusController.prototype.spinReel = function(index) {
		const reel = this.getReelAtIndex(index);
		reel.updateCurrentStake(this.currentStake);
		reel.spin(this.responseData[index]);
		index++;
		const _this = this;
		if(index < this.numOfReels){
			gr.getTimer().setTimeout(function (){
				_this.spinReel(index);
			}, config.timers.standard_reelsSpinGap);
		}
		else{
			//all reels started spin, wait for 2 seconds then start reel stopping;
			gr.getTimer().setTimeout(function (){
				_this.stopReel(0);
			}, config.timers.standard_startReelStopUntil);
		}
	};
	StandardBonusController.prototype.stopReel = function (index){
		this.getReelAtIndex(index).stopReel();
		index++;
		if(index < this.numOfReels){
			const _this = this;
			gr.getTimer().setTimeout(function (){
				_this.stopReel(index);
			}, config.timers.standard_reelsStopGap);
		}
	};
	StandardBonusController.prototype.allReelStoppedHandler = function (){
		this.stopShadowHeartBeat();
		this.showWinningSequence(0);
	};
	StandardBonusController.prototype.showWinningSequence = function (index){
		if(this.isEveryThingOkay()){
			const reel = this.getReelAtIndex(index);
			// non-empty symbol will animate, empty symbol will get skipped
			if(reel.isNotEmptySymbol()){
				reel.presentWinSymbolAnimation();
				if(index++ < this.numOfReels - 1){
					const _this = this;
					gr.getTimer().setTimeout(function (){
						_this.showWinningSequence(index);
					}, config.timers.standard_reelsShowWinningGap);
				}
			}
			else{//skip when there is no planet on it.
				if(index++ < this.numOfReels - 1){
					this.showWinningSequence(index);
				}
			}
		}
	};
/*	StandardBonusController.prototype.showWinningSequenceFinished = function (){
		this.exit();
	};*/
	StandardBonusController.prototype.getReelAtIndex = function (num0To6){
		num0To6 = parseInt(num0To6);
		if(this.reels.reception[num0To6]){
			return this.reels[this.reels.reception[num0To6]];
		}
		else{
			throw new Error('Can not found Reels at '+ num0To6);
		}
	};
	StandardBonusController.prototype.isPortrait = function (){
		return gr.getSize().height > gr.getSize().width;
	};
	StandardBonusController.prototype.createMask = function (){

		const displayMode = (this.isPortrait())?'portrait':'landscape';
		const style = config.positions.standardReelsetDrawMask[displayMode];	
		this.mask = new PIXI.Graphics();
		this.mask.data = {};
		this.mask.data._name = "point";

		this.mask.pathData = style;
		this.drawMask();
		this.maskParent.addChild(this.mask);
		this.spriteToBeMask.pixiContainer.mask = this.mask;
	};
	StandardBonusController.prototype.drawMask = function (posChain = this.mask.pathData){
		this.mask.clear();
		this.mask.beginFill(0xAA00AA);
		this.mask.lineStyle(1, 0xFFAAFF, 1);
		//console.group();
		let node;
		for (let i = 0; i < posChain.length; i++) {
			node = posChain[i];
			if(i==0){
				this.mask.moveTo(node.left.x, node.left.y);
			}
			else{
				this.mask.lineTo(node.left.x, node.left.y);
			}
			this.mask.quadraticCurveTo(node.cp.x, node.cp.y, node.right.x, node.right.y);
			//console.log(`i:${i}, cP_x:${node.cp.x}, cP_y:${node.cp.y}, leftX:${node.left.x}, leftY:${node.left.y}, rightX:${node.right.x}, rightY:${node.right.y}`);
		}
		this.mask.endFill();
	};

	StandardBonusController.prototype.formatResultData = function(){
		if(typeof this.responseData === 'string'){
			this.responseData = this.responseData.match(new RegExp('.{1}', "g"));
		}
	};
	StandardBonusController.prototype.exit = function (){
		if(this.isEveryThingOkay()){
			if(!this.fadeOutKeyFrameAnim){
				this.initFadeOutKeyAnimation();
			}
			this.fadeOutKeyFrameAnim.isFadeDimIn = true;
			this.dim.updateCurrentStyle({"_opacity":0});
			this.dim.show(true);		
			const _this = this;
			gr.getTimer().setTimeout(function (){
				if(_this.isEveryThingOkay()){
					_this.fadeOutKeyFrameAnim.play();
				}
			}, config.timers.standard_startFadeOutDelay);
		}
	};

	StandardBonusController.prototype.initFadeOutKeyAnimation = function (){
		this.fadeOutKeyFrameAnim = new KeyFrameAnimation({
			"_name": 'standardBonusFadeOutAnimation',
			"tweenFunc": TweenFunctions.linear,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.standard_dimFadeInOrOutDruation,
					"_SPRITES": []
				}
			]
		});
		this.fadeOutKeyFrameAnim._onUpdate = new CallbackFunc(this, this.fadeOutKeyFrameAnimOnUpdate);
		this.fadeOutKeyFrameAnim._onComplete = new CallbackFunc(this, this.fadeKeyFrameAnimOnComplete);
	};
	StandardBonusController.prototype.fadeOutKeyFrameAnimOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		timeDelta = Math.ceil(timeDelta);
		let opacity = 0;
		if(this.isEveryThingOkay()){
			if(this.fadeOutKeyFrameAnim.isFadeDimIn){
				opacity = tweenFunc(timeDelta, 0, 1, duration);
			}
			else{
				opacity = tweenFunc(timeDelta, 1, 0, duration);
			}
		}
		else{
			opacity = 1;
		}
		this.dim.updateCurrentStyle({"_opacity":opacity});
	};
	StandardBonusController.prototype.fadeKeyFrameAnimOnComplete = function (){
		if(this.isEveryThingOkay()){
			if(this.fadeOutKeyFrameAnim.isFadeDimIn){
				this.etBonusSprite.stopPlay();
				this.etBonusSprite.show(false);
				msgBus.publish(LittleGreenMenGameEvent.eventIDs.STANDARD_BONUS_EXIT_TRANSITION_START);
				this.hide();
				this.fadeOutKeyFrameAnim.isFadeDimIn = false;
				this.fadeOutKeyFrameAnim.play();
			}
			else{
				this.dim.updateCurrentStyle({"_opacity":0.7});
				this.dim.show(false);
				this.playSoundByConfig("baseGameLoop", true);
			}
		}
		else{
			this.dim.updateCurrentStyle({"_opacity":1});
			this.dim.show(true);	
		}
	};
	StandardBonusController.prototype.beforeEntre = function (data){
		this.responseData = data.rs;
		this.onTicketCostChanged(data.currentStake);
		this.goButton.show(false);
	};
	StandardBonusController.prototype.entre = function(){
		/*
		this.goButton.enable(true);
		this.goButton.show(true);
		*/
		if(this.isEveryThingOkay()){
			this.mainSprite.show(true);
			this.resetAllReels();
			const temp = Array.from(this.responseData);
			let isNotX = "";
			//check for the last animated reel, set reel.isLastAnimation to true, by checking the last none X value in the this.responseData;
			while(temp.length){
				isNotX = temp.pop();
				if(isNotX !== 'X'){
					this.getReelAtIndex(temp.length).setTheLastAnimationReel();
					break;
				}
			}
		}
	};
	StandardBonusController.prototype.resetAllReels = function (){
		let reel;
		for(let i = 0 ; i < this.reels.reception.length ; i ++){
			reel = this.getReelAtIndex(i);
			reel.reset();
		}
	};
	StandardBonusController.prototype.hide = function() {
		this.mainSprite.show(false);
		this.mainSprite.updateCurrentStyle({"_opacity":1});
	};
	StandardBonusController.prototype.onTicketCostChanged = function (prizePoint){
		this.currentStake = prizePoint;
	};
	StandardBonusController.prototype.handleTextWithImage = function (parentSpr, linesArr) {
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
	StandardBonusController.prototype.playSoundByConfig = function(soundName, isloop = false){
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
	return StandardBonusController;
});