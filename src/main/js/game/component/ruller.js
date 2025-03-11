/*


*/
define(function module(require){
	var  Sprite = require('skbJet/component/gladPixiRenderer/Sprite');
	function Ruller (target) {
		// Basic proof of concept - but still pretty effective and useful.
		// Be warned, the space character is used to as the delimeter of propert/value pairs
		// and thus the property/value pairs themselves must not contain any space characters.
		// In a similar vein, the values themselves must be scalar values (numerical).
		this.__targetDisplayObject = null;
		this.__domProxyDiv = null;
		this.__updateDelay = 500;
		this.__cachedProperties = {};
		this.__toUpdate = 0;
		
		if ( target != void 0 ) {
			this.initRuller(target);
		}
	}

	Ruller.__typeProps = [
		{ "type": Sprite, "props": ["x", "y", "rotation", "alpha", "scaleX", "scaleY", "visible"] },
		//{ "type": PIXI.Text, "props": ["width", "height", "fontSize", "textOffsetY", "debugDrawArea"] },
		//{ "type": PIXI.particles, "props": ["spawnTimeMin", "spawnTimeMax", "amountToSpawnMin", "amountToSpawnMax", "emitAreaXmin", "emitAreaXmax", "emitAreaYmin", "emitAreaYmax", /*"maxParticles",*/ "maxParticlesToSpawn", "TTL", "speedFact", "timeFact", "randAnimFrame", "pDirXmin", "pDirXmax", "pDirYmin", "pDirYmax", "pMaxDirXmin", "pMaxDirXmax", "pMaxDirYmin", "pMaxDirYmax", "pVelocityMin", "pVelocityMax", "pForceX", "pForceY", "pTTLmin", "pTTLmax", "pRotToDir"] }
	];

	Ruller.prototype.initRuller = function(targetDisplayObject, proxyDivId) {
		this.__targetDisplayObject = targetDisplayObject;
		
		this.__domProxyDiv = this.__domProxyDiv || document.createElement("div");
		this.__domProxyDiv.id = proxyDivId || targetDisplayObject.data._name;
		this.__domProxyDiv.style.display = "none"; 
		this.__domProxyDiv.style.content = "''";
		
		//if ( targetDisplayObject.node.isOnStage() ) {
		if ( targetDisplayObject.pixiContainer.$sprite.visible) {
			this.__onAddedToStage();
		} else {
			this.__onRemovedFromStage();
		}
		return this;
	};

	Ruller.prototype.__onTimeOut_update = function(self) {
		self.__mapPropertiesFromProxyDivToTarget();
		this.__toUpdate = setTimeout(self.__onTimeOut_update, self.__updateDelay, self); 
	};

	Ruller.prototype.__mapPropertiesFromTargetToProxyDiv = function() {
		var tdo = this.__targetDisplayObject, cp = this.__cachedProperties, strPropertyValuePairs = "",
			arrTypeProps = Ruller.__typeProps, arrProps, prop, type;
		
		for ( var i = 0; i < arrTypeProps.length; i++ ) {
			type = arrTypeProps[i].type;
			if ( type && tdo instanceof type ) {
				arrProps = arrTypeProps[i].props;
				for ( var j = 0; j < arrProps.length; j++ ) {
					prop = arrProps[j];
					strPropertyValuePairs += " " + prop.toString() + ":" + cp[prop];
				}
			}
		}
		
		this.__domProxyDiv.style.content = "'" + strPropertyValuePairs.slice(1) + "'"; // Remove first space
	};

	Ruller.prototype.__mapPropertiesFromProxyDivToTarget = function() {
		var strPropertyValuePairs = this.__domProxyDiv.style.content, cp = this.__cachedProperties,
			propVal, prop, val, hasChanged = false;
			
		strPropertyValuePairs = strPropertyValuePairs.substring(1, strPropertyValuePairs.length-1); // Remove quotes;
		
		var arrPropVals = strPropertyValuePairs.split(" ");
		
		while ( arrPropVals.length > 0 ) {
			propVal = arrPropVals.shift().split(":");
			prop = propVal[0];
			val = propVal[1];
			
			if ( cp[prop] === this.__getTargetObjectProp(prop) ) { // Tests if the targetObject's prop hasn't changed.
				if ( cp[prop].toString() !== val.toString() ) { // Test if the proxyDiv's prop has changed.
					console.log("Changed CSS", prop, cp[prop].toString(), "to", val.toString());
					this.__setTargetObjectProp(prop, val); // Then set it to the targetObject.
					cp[prop] = this.__getTargetObjectProp(prop); // update cache;
				}
			} else {
				console.log('Changed Target:', prop, cp[prop].toString(), "to", this.__getTargetObjectProp(prop).toString());
				hasChanged = true;
			}
		}
		this.__setCachedProperties();
		if ( hasChanged ) {
			this.__mapPropertiesFromTargetToProxyDiv();
		}
	};

	Ruller.prototype.__setCachedProperties = function () {
		var tdo = this.__targetDisplayObject, cp = this.__cachedProperties, arrTypeProps = Ruller.__typeProps, arrProps, prop, type;
		for ( var i = 0; i < arrTypeProps.length; i++ ) {
			type = arrTypeProps[i].type;
			if ( type && tdo instanceof type ) {
				arrProps = arrTypeProps[i].props;
				for ( var j = 0; j < arrProps.length; j++ ) {
					prop = arrProps[j];
					cp[prop] = this.__getTargetObjectProp(prop);
				}
			}
		}
	};

	Ruller.prototype.__getTargetObjectProp = function (prop) {
		var tdo = this.__targetDisplayObject;// cp = this.__cachedProperties, pt;
		if ( tdo instanceof Sprite ) {
			switch ( prop ) {
				case 'x': return tdo._currentStyle._left;
				case 'y': return tdo._currentStyle._top;
				case 'rotation': return Math.round(tdo._currentStyle._transform._rotate);
				case 'alpha': return tdo._currentStyle._opacity;
				case 'scaleX': return tdo._currentStyle._transform._scale._x;
				case 'scaleY': return tdo._currentStyle._transform._scale._y;
				case 'visible': return (tdo.pixiContainer.$sprite.visible ? "1" : "0");
			}
		}
	};

	Ruller.prototype.__setTargetObjectProp = function(prop, val) {
		var tdo = this.__targetDisplayObject;// pt;
		if ( tdo instanceof Sprite) {
			switch ( prop ) {
				case "x": return tdo.updateCurrentStyle({_left:val});
				case "y": return tdo.updateCurrentStyle({_top:val});
				case "rotation": return tdo.updateCurrentStyle({_transform:{_rotate:Math.round(parseFloat(val))}});
				case "alpha": return tdo.updateCurrentStyle({_opacity:val});
				case "scaleX": return tdo.updateCurrentStyle({_transform:{_scale:{_x:val}}});
				case "scaleY": return tdo.updateCurrentStyle({_transform:{_scale:{_y:val}}});
				case 'visible': return tdo.show(val != "0");
			}
		}
	};

	Ruller.prototype.__onAddedToStage = function () {
		this.__setCachedProperties();
		this.__mapPropertiesFromTargetToProxyDiv();
		this.addToDom();
		this.startUpdates();
	};

	Ruller.prototype.__onRemovedFromStage = function () {
		this.stopUpdates();
		this.removeFromDom();
	};

	Ruller.prototype.addToDom = function () {
		if ( this.__domProxyDiv === null ) {
			return this;
		}
		if ( this.__domProxyDiv.parentElement !== null ) {
			return this;
		}
		
		document.head.parentElement.insertBefore(this.__domProxyDiv, document.head);
		
		return this;
	};

	Ruller.prototype.removeFromDom = function () {
		if ( this.__domProxyDiv === null ) {
			return this;
		}
		if ( this.__domProxyDiv.parentElement === null ) {
			return this;
		}
		
		this.__domProxyDiv.parentElement.removeChild(this.__domProxyDiv);
		return this;
	};

	Ruller.prototype.setUpdateDelay = function (delay) {
		this.__updateDelay = delay;
		return this;
	};

	Ruller.prototype.getUpdateDelay = function () {
		return this.__updateDelay;
	};

	Ruller.prototype.startUpdates = function () {
		this.stopUpdates();
		this.__toUpdate = setTimeout(this.__onTimeOut_update, this.__updateDelay, this);
	};

	Ruller.prototype.stopUpdates = function () {
		clearTimeout(this.__toUpdate);
	};	
	window.ruler = new Ruller();
	return {};
});
