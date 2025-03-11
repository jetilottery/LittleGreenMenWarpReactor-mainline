/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-06-24 20:38:52
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2020-05-09 13:55:13
*/
define(function module(require){
	const ReelSymbol = require("game/component/reelSymbol");
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
	const LittleGreenMenGameEvent	= require('game/events/littleGreenMenGameEvent');
	const config = require('game/configController');
	const CallbackFunc = require('game/component/callbackFunc');
	//const TweenFunctions = require('game/utils/tweenFunctions');
	function Reel(data){
		this.name = 'Reel';
		this.reelObj = null;
		this.id = null;
		this.orderInReelset = null;
		this.symbols = {reception:[]};
		this.orgPosition = {x:0, y:0};
		this.offPosition = {x:0, y:0};
		this.symbolDistanceY = 105; //the hardcode gap in between symbols y positon.
		this.orgSymbolData = null;
		this.symbolsMap = null;
		this.reactDropAnimation = null;
		this.init(data);
	}
	Reel.prototype.init = function(data) {
		this.reelObj = data.sourceObj;
		this.id = this.reelObj.getName();
		this.orderInReelset = data.orderInReelset;
		this.orgPosition.x = this.reelObj.getCurrentStyle()._left;
		this.orgPosition.y = this.reelObj.getCurrentStyle()._top;
		this.offPosition.y = data.offPositionY;
		this.symbolsMap = data.symbolsMap;
		const symbols = this.reelObj.getChildren();
		let symbolName = null;
		let symbolSpr = null;
		let symbolData = {};
			symbolData.symbolsMap = data.symbolsMap;
		for(const item of Object.keys(symbols)){
			symbolName = symbols[item].getName();
			symbolSpr = symbols[item];
			symbolData.sourceObj = symbolSpr;
			symbolData.symOffPositionY = this.offPosition.y;
			symbolData.symOrderIndex = this.symbols.reception.length;
			symbolData.ReelId = this.id;
			this.symbols[symbolName] = new ReelSymbol(symbolData);
			this.symbols.reception.push(symbolName);
		}
	};
	Reel.prototype.getReelOrderNum = function (){
		return this.orderInReelset;
	};
	Reel.prototype.initSymbols = function(symData) {
		this.orgSymbolData = symData;
		for(let i = 0 ; i < this.symbols.reception.length ; i++){
			const [symcode, bonuscode] = symData[i].match(new RegExp('.{1}','g'));
			if(i<this.getNumOfSymbols()){
				const symbol = this.getSymbolAtIndex(i);
				symbol.applySymbolCode(symcode);
				symbol.applyBonusCode(bonuscode);
			}
		}
	};
	Reel.prototype.moveTo = function (posObj){
		let newPos = {};
		if(posObj.x){
			newPos._left = Math.ceil(posObj.x);
		}
		if(posObj.y){
			newPos._top = Math.ceil(posObj.y);
		}
		if(Object.keys(newPos).length){
			this.reelObj.updateCurrentStyle(newPos);
		}
	};
	Reel.prototype.moveSymbolsOffInstantly = function (){
		let symbol = null;
		for(const symKey of this.symbols.reception){
			symbol = this.symbols[symKey];
			symbol.goOffInstantlyOnY();
		}
	};
	Reel.prototype.getSymbolById = function(id){
		return this.symbols[id];
	};
	Reel.prototype.getName = function (){
		return this.reelObj.getName();
	};
	Reel.prototype.getSymbolAtIndex = function (posInt){
		posInt = parseInt(posInt);
		if(this.symbols.reception[posInt]){
			return this.symbols[this.symbols.reception[posInt]];
		}
		else{
			return null;
			//throw new Error('Can not found ReelSymbol at '+ posInt + ' in Reel '+ this.reelObj.data._name);
		}
	};
	Reel.prototype.presentWinSymbolAnimation = function (symbolId){
		this.getSymbolById(symbolId).playWinningAnimation();
		//this.getSymbolById(symbolId).highLight();
		return this.getSymbolById(symbolId).getSymbolCode();
	};
	Reel.prototype.getNumOfSymbols = function (){
		return this.symbols.reception.length;
	};
	/*
		To understand better of the logic in startReactDrop, you may turn on the commented console.log in functions:
		mirrorReel, cloneAndReplace, queueAtTheEnd. 

	*/
	Reel.prototype.startReactDrop = function (symData){
		this.mirrorReel(symData);
		this.playReactDropAnimation();
	};
	Reel.prototype.playReactDropAnimation = function (){
		if(!this.reactDropAnimation){
			this.initReactDropAnimation();
		}
		this.reactDropAnimation.play();

	};
	Reel.prototype.reactDropAnimationOnUpdate = function ({caller:keyFrameAnim, time:timeDelta}){
		let symbol, targetSymbol, yGap;
		const firstSymbol = this.getSymbolAtIndex(0);
		const tweenFunc = keyFrameAnim.animData.tweenFunc;
		const duration = keyFrameAnim.maxTime;
		if(firstSymbol.getCurrentPos().y !== firstSymbol.getOriginalPos().y){
			//the first symbol have an static target position to go
			const yPos = tweenFunc(timeDelta, firstSymbol.getCurrentPos().y, firstSymbol.getOriginalPos().y, duration);
			firstSymbol.moveTo({y: yPos});
		}
		for(let i = 1 ; i < this.getNumOfSymbols() ; i++){
			// all the rest symbol are moving accordingly, refer to the first symbol position.
			symbol = this.getSymbolAtIndex(i);
			targetSymbol = this.getSymbolAtIndex(i-1);
			if(symbol.getGap() === false){
				symbol.setGap((targetSymbol.getCurrentPos().y - symbol.getCurrentPos().y));
			}
			yGap = tweenFunc(timeDelta, symbol.getGap(), this.symbolDistanceY, duration);
			symbol.moveTo({"y":(targetSymbol.getCurrentPos().y - yGap)});
		}
	};
	Reel.prototype.reactDropAnimationOnComplete = function(){
		if(this.getReelOrderNum() === 6){
			msgBus.publish(LittleGreenMenGameEvent.eventIDs.REELS_REACTORDROP_COMPLETE);
		}
	};
	Reel.prototype.initReactDropAnimation = function (){
		this.reactDropAnimation = new KeyFrameAnimation({
			"_name": this.id+'reactDropAnimation',
			"tweenFunc": this.customisedEaseOutBounce,
			"_keyFrames": [
				{
					"_time": 0,
					"_SPRITES": []
				},
				{
					"_time": config.timers.baseGame_reactDropDuration,
					"_SPRITES": []
				}
			]
		});
		this.reactDropAnimation._onUpdate = new CallbackFunc(this, this.reactDropAnimationOnUpdate);
		this.reactDropAnimation._onComplete = new CallbackFunc(this, this.reactDropAnimationOnComplete);
	};

	Reel.prototype.customisedEaseOutBounce = function (t, b, _c, d) {
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
	Reel.prototype.mirrorReel = function (symData){
		let symbol, target;
		for(let i = 0 ; i < this.getNumOfSymbols() ; i++){
			symbol = this.getSymbolAtIndex(i);
			symbol.resetGap();
			if(symbol.isVisible() === false){ 
	/*
		use the invisible symbol to replace the closest above visible symbol (refer as target symbol),
		clone its position and all animations, then hide the target symbol. keep doing it until the end of the reel.
	*/			
				target = this.findClosestAboveSymbol(i);
				if(target){
					//do clone and replace
					this.cloneAndReplace(symbol, target);
				}
				else{
					//go to end of the queue and prepare itself for dropping.
					this.queueAtTheEnd(symbol, symData);
				}
			}
			/*else{
				console.log(symbol.getName()+" remain as it is");
			}*/
		}
	};
	Reel.prototype.cloneAndReplace = function (sourceObj, targetObj){
		//apply targetObj symbol code on the sourceObj
		sourceObj.applySymbolCode(targetObj.getSymbolCode());
		//move sourceObj to the targetObj's original position.
		sourceObj.moveTo(targetObj.getOriginalPos());
		sourceObj.stopBonusAnimation();
		if(targetObj.getBonusCode() !== "0"){
			//stop bonusDisplay animation, record its currentFrame index, apply targetObj bonus code on the sourceObj, and synchronise the animation
			const targetBonusCode = targetObj.getBonusCode();
			const currentFrameIndex = targetObj.stopBonusAnimation();
			sourceObj.applyBonusCode(targetBonusCode, currentFrameIndex);
		}
		targetObj.hide();
		sourceObj.show();
		//console.log(sourceObj.getName() + ' clone '+ targetObj.getName()+ " successfully");
	};
	Reel.prototype.queueAtTheEnd = function (symbol, symData){
		//console.log(symbol.getName()+' is queuing behind!');
		const symbolOrder = symbol.getSymbolOrderNum();
		const [symcode, bonuscode] = symData[symbolOrder].match(new RegExp('[^0-9]+|[0-9]+','g'));
		symbol.applySymbolCode(symcode);
		symbol.applyBonusCode(bonuscode);
		symbol.goOffInstantlyOnY();
		symbol.show();
	};
	/*
		passing the current symbol index, and check from this index above, looking for the next visible symbol 
		and return the symbol if found, return false if not.
	*/
	Reel.prototype.findClosestAboveSymbol = function (index){
		let symbol;
		for(let i = index; i < this.getNumOfSymbols() ; i++){
			symbol = this.getSymbolAtIndex(i);
			if(symbol.isVisible() === true && symbol.isOffTheView() === false){
				return symbol;
			}
		}
		return false;
	};
	return Reel;
});