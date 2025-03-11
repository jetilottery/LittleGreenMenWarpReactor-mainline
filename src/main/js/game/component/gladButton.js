/**
 * @module gladButton
 * @memberof skbJet/componentCRDC/gladRenderer
 */
define([
	], function(){
	
	var lastTimeStamp = 0;
	
    /**
	 * @function GladButton
	 * @description GladButton class constructor
	 * @instance
	 * @param sprite {Object} - The glad sprite object.
	 * @param imgName {string} - The image of the button when active. By default, the image of inactive state should add a postfix "Inactive", also add "Over" postfix for mouse over, and "Pressed" postfix when mouse pressed / touch.
	 * @param options {Object} - optional parameters.
	 * @param options.scaleWhenClick {number} - default: 1. scale rate when click the button.
	 * @param options.scaleWhenOver {number} - default: 1. scale rate when mouse move over the button.
	 */
    function GladButton(sprite, imgName, options){
		this.sprite = sprite;
		this.activeImg = imgName;
		this.inactiveImg = imgName+'Inactive';
		this.overImg = imgName+'Over';
		this.pressedImg = imgName+'Pressed';
		this.enabled = true;
		var _this = this;
        _this.sprite.pixiContainer.$sprite.interactive = true;
        _this.sprite.pixiContainer.$sprite.cursor = "pointer";
		_this.options = {};
		_this.options.scaleXWhenClick = 1;
        _this.options.scaleYWhenClick = 1;
		_this.options.scaleXWhenOver = 1;
        _this.options.scaleYWhenOver = 1;
		_this.options.avoidMultiTouch=true;

		_this.originalScaleX = sprite._currentStyle._transform._scale._x;
		_this.originalScaleY = sprite._currentStyle._transform._scale._y;
		
		if(options){
			if(options.scaleXWhenClick){
				_this.options.scaleXWhenClick = Number(options.scaleXWhenClick);
			}
            if(options.scaleYWhenClick){
				_this.options.scaleYWhenClick = Number(options.scaleYWhenClick);
			}
			if(options.scaleXWhenOver){
				_this.options.scaleXWhenOver = Number(options.scaleXWhenOver);
			}
            if(options.scaleYWhenOver){
				_this.options.scaleYWhenOver = Number(options.scaleYWhenOver);
			}
			if(options.avoidMultiTouch === false){
				_this.options.avoidMultiTouch=false;
			}
		}
		
		_this.sprite.on('mouseover', function(){
			if(_this.enabled){
				try{
					sprite.setImage(_this.overImg);
					if(_this.options.scaleXWhenOver !== 1 || _this.options.scaleYWhenOver !== 1){
						sprite.updateCurrentStyle({'_transform':{'_scale':{'_x':_this.options.scaleXWhenOver, '_y':_this.options.scaleYWhenOver}}});
					}
				}catch(e){
					//Nothing to do in case of mobile/tablet do not have mouse over image.
				}
				
			}
		});
		
		_this.sprite.on('mouseout', function(){
			if(_this.enabled){
				_this.sprite.setImage(_this.activeImg);
				sprite.updateCurrentStyle({'_transform':{'_scale':{'_x':_this.originalScaleX,'_y':_this.originalScaleY}}});
				}
		});
			
		_this.sprite.on('mousedown', function(){
			if(_this.enabled){
				_this.sprite.setImage(_this.pressedImg);
				if(_this.options.scaleXWhenClick !== 1 || _this.options.scaleYWhenClick !== 1){
					sprite.updateCurrentStyle({'_transform':{'_scale':{'_x':_this.options.scaleXWhenClick,'_y':_this.options.scaleYWhenClick}}});			
				}
			}
		});
		
		_this.sprite.on('mouseup', function(event){
			if(_this.enabled){
				_this.sprite.setImage(_this.activeImg);
				sprite.updateCurrentStyle({'_transform':{'_scale':{'_x':_this.originalScaleX,'_y':_this.originalScaleY}}});
			}
/*		});
		
		_this.sprite.on('click', function(event){*/
			_this.curTimeStamp = Date.now();
			if(_this.enabled && _this.onClick){
				event.stopPropagation();
				_this.sprite.setImage(_this.pressedImg);
				setTimeout(function(){
					if(_this.options.avoidMultiTouch){
						//var curTimeStamp = Date.now();
						var intervalTime = _this.curTimeStamp-lastTimeStamp;
						lastTimeStamp = _this.curTimeStamp;
						if(intervalTime>=150){
							if(_this.onClick.hasOwnProperty('handler') && typeof _this.onClick.handler === 'function'){
								_this.onClick.handler.call(_this.onClick.subscriberRef, event);
							}
							else{
								_this.onClick(event);
							}
						}
					}else{
						if(_this.onClick.hasOwnProperty('handler') && typeof _this.onClick.handler === 'function'){
							_this.onClick.handler.call(_this.onClick.subscriberRef, event);
						}
						else{
							_this.onClick(event);
						}
					}
					if(!_this.enabled){
						return;
					}else{
						_this.sprite.setImage(_this.activeImg);
						sprite.updateCurrentStyle({'_transform':{'_scale':{'_x':_this.originalScaleX,'_y':_this.originalScaleY}}});
					}
				}, 100);
			}
		});
    }
    /**
	 * @function enable
	 * @description enable/disable button
	 * @instance
	 * @param enableFlag {boolean} - optional, if it is not undefined, then set button status: true: enable; false: disable. If it is undefined, then return current enabled or not.
	 * @return current button enabled or not.
	 */
    GladButton.prototype.enable = function(enableFlag){
		if(enableFlag === undefined || enableFlag === null){
			return this.enabled;
		}else{
			this.enabled = enableFlag?true:false;
			if(this.enabled){
				this.sprite.setImage(this.activeImg);
				this.sprite.pixiContainer.$sprite.cursor = "pointer";
			}else{
				this.sprite.setImage(this.inactiveImg);
				this.sprite.pixiContainer.$sprite.cursor = "default";
			}
		}
    };
	/**
	 * @function show
	 * @description show/hide button
	 * @instance
	 * @param showFlag {boolean} - optional, if it is not undefined, then set button status: true: show; false: hide. If it is undefined, then return current shown or not.
	 * @return current button shown or not.
	 */
    GladButton.prototype.show = function(showFlag){
		this.sprite.show(showFlag);
    };
	
	/**
	 * @function click
	 * @description set the click action of the button
	 * @instance
	 * @param clickCallBack {Function} - call back function of button click
	 */
    GladButton.prototype.click = function(clickCallBack){
		this.onClick = clickCallBack;
    };
    
    /**
	 * @function changeImg
	 * @description change the activeImg
	 * @instance
	 * @param activeImg {String} - The image of the button when active
	 */
    GladButton.prototype.changeImg = function(activeImg){
        this.activeImg = activeImg;
		this.inactiveImg = activeImg+'Inactive';
		this.overImg = activeImg+'Over';
		this.pressedImg = activeImg+'Pressed';
        
        if (this.enabled) {
            this.sprite.setImage(this.activeImg);
        } else {
            this.sprite.setImage(this.inactiveImg);
        }
    };
    
    /**
	 * @function getEnabled
	 * @description get the enabled property
	 * @instance
	 */
    GladButton.prototype.getEnabled = function(){
        return this.enabled;
    };
	
    return GladButton;
});