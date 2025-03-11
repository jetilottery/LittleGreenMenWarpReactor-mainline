/*
* @Description:
* @Author:  Geordi Guo 
* @Email:   Geordi.Guo@igt.com
* @Date:    2019-06-24 20:39:08
* @Last Modified by:    Geordi Guo
* @Last Modified time:  2019-07-10 17:01:16
*/
define(function module(require){
    const PIXI = require('com/pixijs/pixi');
    const Particles = require('com/pixijs/pixi-particles');
    const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
    const CallbackFunc = require('game/component/callbackFunc');
    /*
    * Particle Emitter class 
    * in order to generate particle effect 
    */
	function MeteorEmitter(){
		this.emitter_meteorite = null;
        this.emitter_bubbleBottomUp = null;
        this.emitter_twinklingStarts = null;
        this.ticker = null;
        this.container = null;
        this.isRunning = false;
        this.deleted = false;
        this.addListeners();
	}
    MeteorEmitter.prototype.addListeners = function() {
        msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.init));
    };
	MeteorEmitter.prototype.init = function (){
        this.ticker = gr.getTicker();
        this.container = gr.lib._particleContainer.pixiContainer;
        const sprites_meteorite = [this.getSpriteSheetByName('meteorSmall'), this.getSpriteSheetByName('meteorTiny'), this.getSpriteSheetByName('meteorMid_0002')];
		this.emitter_meteorite = new Particles.Emitter(this.container, sprites_meteorite, MeteorEmitter.CONFIG_rain);

        const sprites_bubble = [this.getSpriteSheetByName('Point')];
        const bubbleSetting = (this.isPortrait()===true)?MeteorEmitter.CONFIG_BottomUpBubble:MeteorEmitter.CONFIG_BottomUpBubble_landscape;
        this.emitter_bubbleBottomUp = new Particles.Emitter(this.container, sprites_bubble, bubbleSetting);

        const sprite_star = [this.getSpriteSheetByName('Doji')];
        this.emitter_twinklingStarts = new Particles.Emitter(this.container, sprite_star, MeteorEmitter.CONFIG_TWINKLING_STARS);
        
        this.ticker.add(new CallbackFunc(this,this.update));
        this.start();

	};
    MeteorEmitter.prototype.update = function (deltaTime){
        if(this.isRunning === true && this.deleted === false){
            this.emitter_meteorite.update(deltaTime*0.05);
            this.emitter_bubbleBottomUp.update(deltaTime*0.02);
            this.emitter_twinklingStarts.update(deltaTime*0.01);
        }    
    };
    MeteorEmitter.prototype.isPortrait = function (){
        return gr.getSize().height > gr.getSize().width;
    };
    MeteorEmitter.prototype.start = function (){
        this.isRunning = true;
        this.deleted = false;
    };
    MeteorEmitter.prototype.getSpriteSheetByName = function(spriteName){
        return PIXI.utils.TextureCache[spriteName];
    };
    

MeteorEmitter.CONFIG_BottomUpBubble = {
    "alpha": {
        "start": 1,
        "end": 0.3
    },
    "scale": {
        "start": 0.5,
        "end": 1.5,
        "minimumScaleMultiplier": 0.2
    },
    "color": {
        "start": "#f2f1d0",
        "end": "#cedb3b"
    },
    "speed": {
        "start": 2,
        "end": 50,
        "minimumSpeedMultiplier": 1
    },
    "acceleration": {
        "x": 0,
        "y": 0
    },
    "maxSpeed": 0,
    "startRotation": {
        "min": 260,
        "max": 270
    },
    "noRotation": false,
    "rotationSpeed": {
        "min": 0,
        "max": 50
    },
    "lifetime": {
        "min": 2,
        "max": 5
    },
    "blendMode": "normal",
    "ease": [
        {
            "s": 0,
            "cp": 0,
            "e": 0.6
        },
        {
            "s": 0.6,
            "cp": 1,
            "e": 1
        }
    ],
    "frequency": 0.5,
    "emitterLifetime": -1,
    "maxParticles": 10,
    "pos": {
        "x": 0,
        "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
        "x": 70,
        "y": 850,
        "w": 670,
        "h": 200
    }
};
MeteorEmitter.CONFIG_BottomUpBubble_landscape = {
    "alpha": {
        "start": 1,
        "end": 0.3
    },
    "scale": {
        "start": 0.5,
        "end": 1.5,
        "minimumScaleMultiplier": 0.2
    },
    "color": {
        "start": "#f2f1d0",
        "end": "#cedb3b"
    },
    "speed": {
        "start": 2,
        "end": 50,
        "minimumSpeedMultiplier": 1
    },
    "acceleration": {
        "x": 0,
        "y": 0
    },
    "maxSpeed": 0,
    "startRotation": {
        "min": 260,
        "max": 270
    },
    "noRotation": false,
    "rotationSpeed": {
        "min": 0,
        "max": 50
    },
    "lifetime": {
        "min": 2,
        "max": 5
    },
    "blendMode": "normal",
    "ease": [
        {
            "s": 0,
            "cp": 0,
            "e": 0.6
        },
        {
            "s": 0.6,
            "cp": 1,
            "e": 1
        }
    ],
    "frequency": 0.5,
    "emitterLifetime": -1,
    "maxParticles": 10,
    "pos": {
        "x": 0,
        "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
        "x": 700,
        "y": 600,
        "w": 670,
        "h": 200
    }
};
MeteorEmitter.CONFIG_TWINKLING_STARS = {
    "alpha": {
        "start": 1,
        "end": 0
    },
    "scale": {
        "start": 1,
        "end": 0.8,
        "minimumScaleMultiplier": 0.2
    },
    "color": {
        "start": "#b9e4eb",
        "end": "#90d8f0"
    },
    "speed": {
        "start": 0,
        "end": 0,
        "minimumSpeedMultiplier": 1
    },
    "acceleration": {
        "x": 0,
        "y": 0
    },
    "maxSpeed": 0,
    "startRotation": {
        "min": 0,
        "max": 0
    },
    "noRotation": false,
    "rotationSpeed": {
        "min": 0,
        "max": 50
    },
    "lifetime": {
        "min": 5,
        "max": 7
    },
    "blendMode": "normal",
    "ease": [
        {
            "s": 0,
            "cp": 1,
            "e": 0.5
        },
        {
            "s": 0.5,
            "cp": 0.5,
            "e": 0.8
        },
        {
            "s": 0.9,
            "cp": 1,
            "e": 0.9
        },
        {
            "s": 0.9,
            "cp": 0,
            "e": 1
        }
    ],
    "frequency": 0.1,
    "emitterLifetime": -1,
    "maxParticles": 15,
    "pos": {
        "x": 0,
        "y": 0
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
        "x": 350,
        "y": 50,
        "w": 400,
        "h": 350
    }
};
MeteorEmitter.CONFIG_rain = {
    "alpha": {
        "start": 1,
        "end": 0.3
    },
    "scale": {
        /*"start": 0.3,
        "end": 0.5,*/
        "start": 0.5,
        "end": 0.8,
        "minimumScaleMultiplier": 1
    },
    "color": {
        "start": "#ffffff",
        "end": "#ffffff"
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
        "min": 130,
        "max": 160
    },
    "noRotation": false,
    "rotationSpeed": {
        "min": 0,
        "max": 0
    },
    "lifetime": {
        "min": 7,
        "max": 8
    },
    "blendMode": "normal",
    "frequency": 15,
    "emitterLifetime": -1,
    "maxParticles": 2,
    "pos": {
        "x": 900,
        "y": 90
    },
    "addAtBack": false,
    "spawnType": "point"
};
    return MeteorEmitter;
});