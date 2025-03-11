/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-06-14 17:32:04
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-09-06 16:14:54
*/
define(function module(require)
{
	'use strict';
	let PIXI = require('com/pixijs/pixi');
	let KeyFrameAnimation = require('skbJet/component/gladRenderer/animation/KeyFrameAnimation');
	KeyFrameAnimation.prototype._isLoopInfinite = false;
	//let Sprite = require('skbJet/component/gladPixiRenderer/Sprite');

	/*
	* Overwritting KeyFrameAnimation's prototype function onTick, to be able to pass the reference for the call back function.
	*/
	//Object.getPrototypeOf(KeyFrameAnimation).onTick = function(elapsedMS){
	KeyFrameAnimation.prototype.onTick = function(elapsedMS){
		if(!this._isPlaying){
			return;
		}

		if(this.timeCount===0&&this.loopCount===0&&this._onStart){
			if(this._onStart.hasOwnProperty('handler') && typeof this._onStart.handler === 'function'){
				this._onStart.handler.call(this._onStart.subscriberRef, this);
			}
			else{
				this._onStart();
			}
			
		}else if((this.timeCount>0||this.loopCount>0)&&this._onResume){
			if(this._onResume.hasOwnProperty('handler') && typeof this._onResume.handler === 'function'){
				this._onResume.handler.call(this._onResume.subscriberRef, this);
			}
			else{
				this._onResume();
			}
		}
		
		this.timeCount += elapsedMS;
		if(this.timeCount>=this.maxTime){
			this.loopCount++;
			if( !this._isLoopInfinite && this.loopCount>=this.loopNumber){
				this.updateStyleToTime(this.maxTime);
				//_stopThisAnim(this);
				this.stopThisAnimation();
				if(this._onComplete){
					if(this._onComplete.hasOwnProperty('handler') && typeof this._onComplete.handler === 'function'){
						this._onComplete.handler.call(this._onComplete.subscriberRef, this);
					}
					else{
						this._onComplete();
					}
				}
				return;
			}else{

				this.timeCount = 0;
				this._frameIndex = 0;
				if(this._onLoop){
					if(this._onLoop.hasOwnProperty('handler') && typeof this._onLoop.handler === 'function'){
						this._onLoop.handler.call(this._onLoop.subscriberRef, this);
					}
					else{
						this._onLoop();
					}
				}
			}
		}
		
		this.updateStyleToTime(this.timeCount);
	};
	/*
		add setter for this._isLoopInfinite to be able to play infinitely
	*/
	KeyFrameAnimation.prototype.setLoop = function (val){
		this._isLoopInfinite = Boolean(val);
	};
	KeyFrameAnimation.prototype.updateStyleToTime = function(time){
		if(time<0||time>this.maxTime){
			console.warn('Time out of animation range.');
			return;
		}
		if(this._onUpdate){
			if(this._onUpdate.hasOwnProperty('handler') && typeof this._onUpdate.handler === 'function'){
				this._onUpdate.handler.call(this._onUpdate.subscriberRef, {time:time, caller:this});
			}	
			else{
				this._onUpdate(time);
			}
		}
		else{
			var frame = this.getFrameAtTime(time);
			if(!frame._SPRITES){
				return;
			}
			for(var i=0;i<this._spritesNameList.length;i++){
				var sprite = this._gladObjLib[this._spritesNameList[i]];
				sprite.updateCurrentStyle(frame._SPRITES[i]._style);
			}
		}
	};
	/*
	*	write this function in order to help overwriting KeyFrameAnimation.prototype.onTick 
	*	Because inside the orgin onTick function has a local function call _stopThisAnim(this) which won't be available here.
	*	but lucky that function are operating KeyFrameAnimation's prototype properties and functions, so it can be replaced with below.
	*/
	KeyFrameAnimation.prototype.stopThisAnimation = function(){
		this.pause();
		this.timeCount = 0;
		this.loopCount = 0;
		this.loopNumber = 1;
		this._frameIndex = 0;
	};

	KeyFrameAnimation.prototype.getFrameAtTime = function(time){
		//var this = this;
		time = Number(time);
		if(this.animData._keyFrames.length===1){
			if(time === Number(this.animData._keyFrames[0]._time)){
				return this.animData._keyFrames[0];
			}
			return null;
		}
		this._frameIndex = this.findFrameIndex(time, this._frameIndex);
		var nextFrame = this.animData._keyFrames[this._frameIndex];
		if(nextFrame==null){
			return null;
		}
		if(nextFrame&&nextFrame._time===time){
			return nextFrame;
		}
		var lastFrame = this.animData._keyFrames[this._frameIndex-1];
		var currentFrame = {
			_time: time,
			_SPRITES:[]
		};
		var ctime = currentFrame._time;
		if(this.animData._step){
			ctime = this.animData._step*(Math.floor(currentFrame._time/this.animData._step));
		}
		var rt = (ctime-lastFrame._time)/(nextFrame._time-lastFrame._time);
		var rt1 = (ctime-lastFrame._time);
		var duration = nextFrame._time-lastFrame._time;
		/*console.log(ctime+"-"+lastFrame._time+"/"+nextFrame._time+"-"+lastFrame._time+"="+rt);
		console.log(Math.ceil((ctime-lastFrame._time)*1000)+"/"+Math.ceil((nextFrame._time-lastFrame._time)*1000)+"="+Math.ceil(rt*1000));*/
		for(var i=0;i<nextFrame._SPRITES.length;i++){
			var nextSprite = nextFrame._SPRITES[i];
			var lastSprite = lastFrame._SPRITES[i];
			if(lastSprite._id!==nextSprite._id){
				throw 'Error: sprite list dismatch in animation frames';
			}
			var currentSprite = {
					_id:nextSprite._id,
					_name:nextSprite._name,
					_style:{}
			};
			this.caculateCurrentStyle(lastSprite, currentSprite, nextSprite, rt, rt1, duration);
			currentFrame._SPRITES.push(currentSprite);
		}
		return currentFrame;
	};
	KeyFrameAnimation.prototype.findFrameIndex = function(time, lastIndex){
		time = Number(time);
		if(this.animData._keyFrames.length<=1||time<=0){
			return 0;
		}
		if(!lastIndex){
			lastIndex = 0;
		}
		for(var i=lastIndex;i<this.animData._keyFrames.length;i++){
			if(time<=Number(this.animData._keyFrames[i]._time)&&time>Number(this.animData._keyFrames[i-1]._time)){
				return i;
			}
		}
		return this.animData._keyFrames.length;
	};
	KeyFrameAnimation.prototype.caculateCurrentStyle = function(lastSprite, currentSprite, nextSprite, rt, rt1, duration){
		if(!nextSprite._style){
			return;
		}
		var ls = lastSprite._style;
		var cs = currentSprite._style;
		var ns = nextSprite._style;
		
		if(this.isNotEmpty(ns._width)){
			cs._width = this.caculateCurrent(ls._width, ns._width, rt, rt1, duration);
		}
		
		if(this.isNotEmpty(ns._height)){
			cs._height = this.caculateCurrent(ls._height, ns._height, rt, rt1, duration);
		}
		
		if(this.isNotEmpty(ns._top)){
			cs._top = this.caculateCurrent(ls._top, ns._top, rt, rt1, duration);
		}
		
		if(this.isNotEmpty(ns._left)){
			cs._left = this.caculateCurrent(ls._left, ns._left, rt, rt1, duration);
		}
		
		if(this.isNotEmpty(ns._opacity)){
			cs._opacity = this.caculateCurrent(ls._opacity, ns._opacity, rt, rt1, duration);
		}
		
		if(this.isNotEmpty(ns._background)){
			cs._background = {};
			if(this.isNotEmpty(ns._background._position)){
				cs._background._position = {};
				if(this.isNotEmpty(ns._background._position._x)){
					cs._background._position._x = this.caculateCurrent(ls._background._position._x, ns._background._position._x, rt, rt1, duration);
				}
				if(this.isNotEmpty(ns._background._position._y)){
					cs._background._position._y = this.caculateCurrent(ls._background._position._y, ns._background._position._y, rt, rt1, duration);
				}
			}
		}
		
		if(this.isNotEmpty(ns._transform)){
			cs._transform = {};
			if(this.isNotEmpty(ns._transform._rotate)){
				cs._transform._rotate = this.caculateCurrent(ls._transform._rotate, ns._transform._rotate, rt, rt1, duration);
			}
			if(this.isNotEmpty(ns._transform._scale)){
				cs._transform._scale = {};
				if(this.isNotEmpty(ns._transform._scale._x)){
					cs._transform._scale._x = this.caculateCurrent(ls._transform._scale._x, ns._transform._scale._x, rt, rt1, duration);
				}
				if(this.isNotEmpty(ns._transform._scale._y)){
					cs._transform._scale._y = this.caculateCurrent(ls._transform._scale._y, ns._transform._scale._y, rt, rt1, duration);
				}
			}
			if(this.isNotEmpty(ns._transform._skew)){
				cs._transform._skew = {};
				if(this.isNotEmpty(ns._transform._skew._x)){
					cs._transform._skew._x = this.caculateCurrent(ls._transform._skew._x, ns._transform._skew._x, rt, rt1, duration);
				}
				if(this.isNotEmpty(ns._transform._skew._y)){
					cs._transform._skew._y = this.caculateCurrent(ls._transform._skew._y, ns._transform._skew._y, rt, rt1, duration);
				}
			}
		}
	};

	//timeDelta: current time, beginVal: beginning value, finalVal: final value, duration: total duration
	KeyFrameAnimation.prototype.caculateCurrent = function (last, next, rt, rt1, duration){
		const 	timeDelta = Math.ceil(rt1), 
				// beginVal = next, 
				// finalVal = last, 
				beginVal = last, 
				finalVal = next;

		if(typeof this.animData.tweenFunc === 'function'){
			// use Easing tween function 
			const rt = this.animData.tweenFunc(timeDelta, beginVal, finalVal, duration);
			//console.log(rt);
			return rt;
		}
		else{
			// use the original calculation 
			var l = Number(last);
			var n = Number(next);
			return (n-l)*rt+l;
		}
	};
	KeyFrameAnimation.prototype.isNotEmpty = function (o){
		return !(o===null||o===undefined||o==="");
	};

	/*
	* Overwritting Pixi.js-tickerListener's prototype function emit, to be able to pass the reference for the call back function.
	*/
    Object.getPrototypeOf(PIXI.ticker.shared._head).emit = function emit(deltaTime){
		if (this.fn) {
            if (this.context) {
                this.fn.call(this.context, deltaTime);
            } 
            else if(this.fn.hasOwnProperty('handler') && typeof this.fn.handler === 'function'){
                this.fn.handler.call(this.fn.subscriberRef, deltaTime);
            }
            else {
                this.fn(deltaTime);
            }
        }
        var redirect = this.next;
        if (this.once) {
            this.destroy(true);
        }
        // Soft-destroying should remove
        // the next reference
        if (this._destroyed) {
            this.next = null;
        }
        return redirect;
	};
	/*
		Over write this function in order to be able to apply onComplete callback function 
		with reference.

		Failed because there is a private variable spriteSheetAnimationMap is not accessible here and
		a private function searchSpriteSheetAnimationFromTextureCache that is not accessible
	
	Sprite.prototype.gotoAndPlay = function(animName, speed, loop, startFrameNumber){
		if(!spriteSheetAnimationMap){
			spriteSheetAnimationMap = searchSpriteSheetAnimationFromTextureCache();
		}
		if(!spriteSheetAnimationMap[animName]){
			throw 'Cannot find sprite animation '+ animName;
		}
		if(!this.pixiContainer.$sprite){
			this.pixiContainer.$sprite = PIXI.extras.AnimatedSprite.fromFrames(spriteSheetAnimationMap[animName]);
			this.pixiContainer.addChildAt(this.pixiContainer.$sprite, this.data._style._background._color?1:0);
		}else if(this.pixiContainer.$sprite.animName !== animName){
			this.pixiContainer.removeChild(this.pixiContainer.$sprite).destroy();
			this.pixiContainer.$sprite = PIXI.extras.AnimatedSprite.fromFrames(spriteSheetAnimationMap[animName]);
			this.pixiContainer.addChildAt(this.pixiContainer.$sprite, this.data._style._background?(this.data._style._background._color?1:0):0);
			this.pixiContainer.$sprite.width =  Number(this._currentStyle._width);
			this.pixiContainer.$sprite.height = Number(this._currentStyle._height);
		}
		this.pixiContainer.$sprite.animName = animName;
		this.pixiContainer.$sprite.animationSpeed = speed?speed:1;
		this.pixiContainer.$sprite.loop = loop?true:false;
		var _this=this;
		this.pixiContainer.$sprite.onComplete = function(){
			if(typeof _this.onComplete === 'function'){
				_this.onComplete();
			}
			else if(typeof _this.onComplete === 'object' && typeof _this.onComplete.handler === 'function'){
				_this.onComplete.handler.call(_this.onComplete.handler.subscriberRef);
			}
		};
		if(!startFrameNumber||startFrameNumber<0){
			startFrameNumber = 0;
		}
		this.pixiContainer.$sprite.gotoAndPlay(startFrameNumber);
	};
	*/
	return {};
});
