 
define(function module(require){   
    const Sprite = require('skbJet/component/gladPixiRenderer/Sprite');
    const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
    const audio = require('skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer');
    const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
    const loader = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
    const SKBeInstant = require('skbJet/component/SKBeInstant/SKBeInstant');
    const gladButton  = require('game/component/gladButton');
    const gameUtils = require('game/utils/gameUtils');
    const config = require('game/configController');

    var plusButton, minusButton;
    var _currentPrizePoint, prizePointList;
    var ticketIcon, ticketIconObj = null;
    var boughtTicket = false;
    var MTMReinitial = false;
    //var numGameRoundCounter = 0;
    
    function registerControl() {
        var formattedPrizeList = [];
        var strPrizeList = [];
        for (var i = 0; i < prizePointList.length; i++) {
            formattedPrizeList.push(SKBeInstant.formatCurrency(prizePointList[i]).formattedAmount);
            strPrizeList.push(prizePointList[i] + '');
        }
        var priceText, stakeText;
        if(SKBeInstant.isWLA()){
            priceText = loader.i18n.MenuCommand.WLA.price;
            stakeText = loader.i18n.MenuCommand.WLA.stake;
        }else{
            priceText = loader.i18n.MenuCommand.Commercial.price;
            stakeText = loader.i18n.MenuCommand.Commercial.stake;            
        }
        
        msgBus.publish("jLotteryGame.registerControl", [{
                name: 'price',
                text: priceText,
                type: 'list',
                enabled: 1,
                valueText: formattedPrizeList,
                values: strPrizeList,
                value: SKBeInstant.config.gameConfigurationDetails.pricePointGameDefault
            }]);
        msgBus.publish("jLotteryGame.registerControl", [{
            name: 'stake',
            text: stakeText,
            type: 'stake',
            enabled: 0,
            valueText: '0',
            value: 0
        }]);
    }
    
    function gameControlChanged(value) {
        msgBus.publish("jLotteryGame.onGameControlChanged",{
            name: 'stake',
            event: 'change',
            params: [SKBeInstant.formatCurrency(value).amount/100, SKBeInstant.formatCurrency(value).formattedAmount]
        });
        
        msgBus.publish("jLotteryGame.onGameControlChanged",{
            name: 'price',
            event: 'change',
            params: [value, SKBeInstant.formatCurrency(value).formattedAmount]
        });
    }
    
    function onConsoleControlChanged(data){
        if (data.option === 'price') {
            setTicketCostValue(Number(data.value));
            
            msgBus.publish("jLotteryGame.onGameControlChanged", {
                name: 'stake',
                event: 'change',
                params: [SKBeInstant.formatCurrency(data.value).amount/100, SKBeInstant.formatCurrency(data.value).formattedAmount]
            });
        }
    }

    function onGameParametersUpdated() {
        if(config.style.ticketCostText){
            gameUtils.setTextStyle(gr.lib._ticketCostText,config.style.ticketCostText);
        }
        if (config.textAutoFit.ticketCostText){
            gr.lib._ticketCostText.autoFontFitText = config.textAutoFit.ticketCostText.isAutoFit;
        }
        gr.lib._ticketCostText.setText(loader.i18n.Game.wager);
        if (config.style.ticketCostValue) {
            gameUtils.setTextStyle(gr.lib._ticketCostValue, config.style.ticketCostValue);
        }
        if (config.textAutoFit.ticketCostValue){
            gr.lib._ticketCostValue.autoFontFitText = config.textAutoFit.ticketCostValue.isAutoFit;
        }
        
        prizePointList = [];
        ticketIcon = {};

        var style = {
            "_id": "_dfgbka",
            "_name": "_ticketCostLevelIcon_",
            "_SPRITES": [],
            "_style": {
                "_width": "18",
                "_height": "18",
                "_left": "196",
                "_background": {
                    "_imagePlate": "_ticketCostLevelIconOff"
                },
                "_top": "190",
                "_transform": {
                    "_scale": {
                        "_x": "1",
                        "_y": "1"
                   }
                }
            }
        };
		
        if (config.style.ticketCostLevelIcon) {
            for (var key in config.style.ticketCostLevelIcon) {
                if (style._style[key]) {
                    style._style[key] = config.style.ticketCostLevelIcon[key];
                }
            }
        }
		
        var length = SKBeInstant.config.gameConfigurationDetails.revealConfigurations.length;
        var width = Number(style._style._width) * Number(style._style._transform._scale._x);
        var space = 4;
        var left = (gr.lib._ticketCost._currentStyle._width - (length * width + (length - 1) * space)) / 2;
        for (var i = 0; i < length; i++) {
            var spData = JSON.parse(JSON.stringify(style));
            spData._id = style._id + i;
            spData._name = spData._name + i;
            spData._style._left = left + (width + space) * i;
            var sprite = new Sprite(spData);
            gr.lib._ticketCost.pixiContainer.addChild(sprite.pixiContainer);

            var price = SKBeInstant.config.gameConfigurationDetails.revealConfigurations[i].price;
            prizePointList.push(price);
            ticketIcon[price] = "_ticketCostLevelIcon_" + i;
		}
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch':true};       
		var arrowPlusType = {'scaleXWhenClick': -0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch':true};
        if(config.gameParam.arrowPlusSpecial){
            arrowPlusType = scaleType;
        }
        plusButton = new gladButton(gr.lib._ticketCostPlus, config.gladButtonImgName.ticketCostPlus, arrowPlusType);       
        minusButton = new gladButton(gr.lib._ticketCostMinus, config.gladButtonImgName.ticketCostMinus, scaleType);        
        registerControl();
        if(prizePointList.length <= 1||SKBeInstant.config.jLotteryPhase === 1 ){
            for (var keyIndex in ticketIcon){
                gr.lib[ticketIcon[keyIndex]].show(false);
            }
            plusButton.show(false);
            minusButton.show(false);
            gr.lib._ticketCost.show(false);
        }else{
            plusButton.show(true);
            minusButton.show(true);

            plusButton.click(increaseTicketCost);
            minusButton.click(decreaseTicketCost);
            // gr.lib._ticketCost.show(isSKBInGIP() === false && isShowTutorialAtBeginning() === false);
            gr.lib._ticketCost.show(isPanelAllowed());
        }
		if(SKBeInstant.config.gameType !== 'ticketReady'){
			setDefaultPricePoint();
		}
        gameUtils.fixMeter(gr);
    }

    function setTicketCostValue(prizePoint) {
        var index = prizePointList.indexOf(prizePoint);
        if (index < 0) {
            msgBus.publish('error', 'Invalide prize point ' + prizePoint);
            return;
        }
        
        plusButton.enable(true);
        minusButton.enable(true);        
        
        if (index === 0) {
            minusButton.enable(false);
        } 
        
        if (index === (prizePointList.length - 1)) {
            plusButton.enable(false);
        } 
        
        var valueString = SKBeInstant.formatCurrency(prizePoint).formattedAmount;

        if(SKBeInstant.config.wagerType === 'BUY'){
            gr.lib._ticketCostValue.setText(valueString);
        }else{
            gr.lib._ticketCostValue.setText(loader.i18n.Game.demo +  valueString);
        }         
      
        if (ticketIconObj) {
            ticketIconObj.setImage('ticketCostLevelIconOff');
        }
        ticketIconObj = gr.lib[ticketIcon[prizePoint]];
        ticketIconObj.setImage('ticketCostLevelIconOn');
        
        _currentPrizePoint = prizePoint;
        msgBus.publish('ticketCostChanged', prizePoint);
    }
    
    function setTicketCostValueWithNotify(prizePoint){
        setTicketCostValue(prizePoint);
        gameControlChanged(prizePoint);
    }

    function increaseTicketCost() {
        var index = prizePointList.indexOf(_currentPrizePoint);
        index++;
        setTicketCostValueWithNotify(prizePointList[index]);
        if(index === prizePointList.length-1){
            if(config.audio && config.audio.ButtonBetMax){
                audio.play(config.audio.ButtonBetMax.name, config.audio.ButtonBetMax.channel);
            }
        }else{
            if (config.audio && config.audio.ButtonBetUp) {
				var betUpChannel = config.audio.ButtonBetUp.channel;
				if(Array.isArray(betUpChannel)){
					audio.play(config.audio.ButtonBetUp.name, betUpChannel[index % betUpChannel.length]);
				}else{
					audio.play(config.audio.ButtonBetUp.name, betUpChannel);
				}
            }
        }

    }

    function decreaseTicketCost() {
        var index = prizePointList.indexOf(_currentPrizePoint);
        index--;
        setTicketCostValueWithNotify(prizePointList[index]);
        if (config.audio && config.audio.ButtonBetDown) {
			var betDownChannel = config.audio.ButtonBetDown.channel;
			if(Array.isArray(betDownChannel)){
				audio.play(config.audio.ButtonBetDown.name, betDownChannel[index % betDownChannel.length]);
			}else{
				audio.play(config.audio.ButtonBetDown.name, betDownChannel);
			}
        }
    }

    function setDefaultPricePoint() {
        setTicketCostValueWithNotify(SKBeInstant.config.gameConfigurationDetails.pricePointGameDefault);
    }

    function onInitialize() {
        gr.lib._ticketCost.show(false);
    }

    function onReInitialize() {
        if(MTMReinitial){
            enableConsole();
            setDefaultPricePoint();
            boughtTicket = false;
            gr.lib._ticketCost.show(false);
            MTMReinitial = false;
        }else{
            onReset();
        }

    }
    
    function onReset(){
        enableConsole();
        if(_currentPrizePoint){
            setTicketCostValueWithNotify(_currentPrizePoint);
        }else{
            setDefaultPricePoint();
        }
        boughtTicket = false;
        gr.lib._ticketCost.show(isPanelAllowed());
    }

    function onStartUserInteraction(data) {
        disableConsole();
        boughtTicket = true;
        //numGameRoundCounter++;
        gr.lib._ticketCost.show(false);
        if (data.price) {
            _currentPrizePoint = data.price;
            setTicketCostValueWithNotify(_currentPrizePoint);
        } 
        msgBus.publish('ticketCostChanged', _currentPrizePoint);
    }

    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function enableConsole(){
        msgBus.publish('toPlatform',{
            channel:"Game",
            topic:"Game.Control",
            data:{"name":"price","event":"enable","params":[1]}
        });
    } 
    function disableConsole(){
        msgBus.publish('toPlatform',{
            channel:"Game",
            topic:"Game.Control",
            data:{"name":"price","event":"enable","params":[0]}
        });
    }

    function onPlayerWantsPlayAgain(){
        boughtTicket = false;
        enableConsole();
        setTicketCostValueWithNotify(_currentPrizePoint);        
        gr.lib._ticketCost.show(isPanelAllowed());
    }
    
    function onTutorialIsShown(){
        if(!boughtTicket){
            gr.lib._ticketCost.show(false);
        }
    }
    function onTutorialIsHide(){
        if(!boughtTicket){
            gr.lib._ticketCost.show(isPanelAllowed());
        }
    }
    function onDisableUI(){
        gr.lib._ticketCost.show(false);
        plusButton.enable(false);
        minusButton.enable(false);
    }
    
    function onPlayerWantsToMoveToMoneyGame(){
        MTMReinitial = true;
        if(isShowTutorialAtBeginning()){
            gr.lib._ticketCost.show(false);
        }
    }
    // function isSKBInGIP (){
    //     return SKBeInstant.config.gameType === 'ticketReady' && numGameRoundCounter === 0 ;
    // }

    function isPanelAllowed(){
        var  rt = false;
        if(SKBeInstant.config.jLotteryPhase !== 1 && prizePointList && prizePointList.length > 1){
            rt = true;
        }
        return rt;
    }

    function isShowTutorialAtBeginning(){
        /*
        if(SKBeInstant.config.customBehavior){
            if(typeof SKBeInstant.config.customBehavior.showTutorialAtBeginning === "undefined"){
                if(loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false){
                    return false;
                }
                else{
                    return true;
                }
            }
            else{
                if(SKBeInstant.config.customBehavior.showTutorialAtBeginning === false){
                    return false;
                }
                else{
                    return true;
                }
            }
        }
        else{
            if(loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false){
                return false;
            }
            else{
                return true;
            }
        }*/
        let defaultValue = true;
        if(SKBeInstant.config.customBehavior){
            if(SKBeInstant.config.customBehavior.showTutorialAtBeginning === false){
                defaultValue =  false;
            }
        }
        else{
            if(loader.i18n.gameConfig && loader.i18n.gameConfig.showTutorialAtBeginning === false){
                defaultValue =  false;
            }
        }
        return defaultValue;
    }
    msgBus.subscribe("playerWantsPlayAgain", onPlayerWantsPlayAgain);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.initialize', onInitialize);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLotterySKB.onConsoleControlChanged', onConsoleControlChanged);
    msgBus.subscribe('jLotterySKB.reset', onReset);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
    msgBus.subscribe('disableUI', onDisableUI);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',onPlayerWantsToMoveToMoneyGame);
    
    return {};
});