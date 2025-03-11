/**
 * @module game/meters
 * @description meters control
 */
 define(function module(require){
        const gr = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
        const msgBus = require('skbJet/component/gameMsgBus/GameMsgBus');
        const LittleGreenMenGameEvent   = require('game/events/littleGreenMenGameEvent');
        const CallbackFunc = require('game/component/callbackFunc');

    function MetersController (){
        this.loader = require('skbJet/component/pixiResourceLoader/pixiResourceLoader');
        this.SKBeInstant = require('skbJet/component/SKBeInstant/SKBeInstant');
        this.currencyHelper = require('skbJet/component/currencyHelper/currencyHelper');
        this.gameUtils = require('game/utils/gameUtils');
        this.config = require('game/configController');        
        this.resultData = null;
        this.MTMReinitial = false;
        this.winningTextSprite = null;
        this.instantWinAmount = 0;
        this.normalWinAmount = 0;
        this.addListeners();
    }
    MetersController.prototype.addListeners = function (){
        msgBus.subscribe('SKBeInstant.gameParametersUpdated', new CallbackFunc(this, this.onGameParametersUpdated));
        msgBus.subscribe('jLottery.reInitialize', new CallbackFunc(this, this.onReInitialize));
        msgBus.subscribe('jLottery.reStartUserInteraction', new CallbackFunc(this, this.onReStartUserInteraction));
        msgBus.subscribe('jLottery.startUserInteraction', new CallbackFunc(this, this.onStartUserInteraction));
        msgBus.subscribe('allRevealed', new CallbackFunc(this, this.onAllRevealed));
        msgBus.subscribe('jLottery.updateBalance', new CallbackFunc(this, this.onUpdateBalance));
        msgBus.subscribe('ticketCostChanged', new CallbackFunc(this, this.onTicketCostChanged));
        msgBus.subscribe('playerWantsPlayAgain', new CallbackFunc(this, this.onPlayerWantsPlayAgain));
        msgBus.subscribe('onBeforeShowStage', new CallbackFunc(this, this.onBeforeShowStage));
        msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame', new CallbackFunc(this, this.moveToMoney));
        msgBus.subscribe('winboxError', new CallbackFunc(this, this.onWinBoxError));
        msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.METER_UPDATE_WINNING, new CallbackFunc(this, this.updateWinnings));
        msgBus.subscribe(LittleGreenMenGameEvent.eventIDs.METER_ADD_INSTANTWIN_WINNING, new CallbackFunc(this, this.obtainInstantWin));
    };
    MetersController.prototype.moveToMoney = function (){
        this.MTMReinitial = true;
    };
    MetersController.prototype.onWinBoxError = function (){
        this.winningTextSprite.setText(this.SKBeInstant.config.defaultWinsValue);
        this.gameUtils.fixMeter(gr);
    };
    MetersController.prototype.updateWinnings = function (winAmount = this.normalWinAmount){
        if(isNaN(winAmount)===false){
            this.normalWinAmount = winAmount*1;
            winAmount = this.normalWinAmount + this.instantWinAmount;
            if(this.isWinAccurate()){
                this.winningTextSprite.setText(this.SKBeInstant.formatCurrency(winAmount).formattedAmount);
            }
            else{
                msgBus.publish('winboxError',{errorCode:"29000"});
            }
        }
    };

    MetersController.prototype.obtainInstantWin = function (iW_value){
        if(isNaN(iW_value) === false){
            this.instantWinAmount += parseInt(iW_value);
            this.updateWinnings();
        }
    };

    MetersController.prototype.onStartUserInteraction = function (data) {
        this.resultData = data;
    };

    MetersController.prototype.onAllRevealed = function (data) {
        if(this.isWinAccurate(true)){
            if(this.resultData.prizeValue > 0 || this.SKBeInstant.isWLA()){
                this.winningTextSprite.setText(this.SKBeInstant.formatCurrency(this.resultData.prizeValue).formattedAmount);
            }
            msgBus.publish('jLotteryGame.ticketResultHasBeenSeen', data);
        }
        else{
            this.winningTextSprite.setText(this.SKBeInstant.config.defaultWinsValue);
            msgBus.publish('winboxError',{errorCode:"29000"});
        }
        this.gameUtils.fixMeter(gr);
    };
    MetersController.prototype.isWinAccurate = function (isStrict = false){
        if(isStrict){
            return this.normalWinAmount + this.instantWinAmount === this.resultData.prizeValue;
        }
        else{
            return this.normalWinAmount + this.instantWinAmount <= this.resultData.prizeValue;
        }
    };

    MetersController.prototype.onReStartUserInteraction = function(data) {
        this.onStartUserInteraction(data);
    };

    MetersController.prototype.onReInitialize = function() {
        if (this.MTMReinitial && this.SKBeInstant.config.balanceDisplayInGame) {
            gr.lib._balanceText.show(true);
            gr.lib._balanceValue.show(true);
            gr.lib._meterDivision0.show(true);
            gr.lib._meterDivision1.show(true);
        }
        this.winningTextSprite.setText(this.SKBeInstant.config.defaultWinsValue);
        this.gameUtils.fixMeter(gr);
    };
    
    MetersController.prototype.onUpdateBalance = function (data){
        if (this.SKBeInstant.config.balanceDisplayInGame) {
            if (this.SKBeInstant.isSKB()) {
                gr.lib._balanceValue.setText(this.currencyHelper.formatBalance(data.balance));
            } else {
                gr.lib._balanceValue.setText(data.formattedBalance);
            }
            this.gameUtils.fixMeter(gr);
        }
    };
    
    MetersController.prototype.onGameParametersUpdated = function(){
        this.winningTextSprite = gr.lib._winsValue;
        //if(this.SKBeInstant.config.balanceDisplayInGame === false || (this.SKBeInstant.config.wagerType === 'TRY' && (!this.SKBeInstant.isSKB() || Number(this.SKBeInstant.config.demosB4Move2MoneyButton) === -1))){
        if(this.SKBeInstant.config.balanceDisplayInGame === false || this.SKBeInstant.config.wagerType === 'TRY'){
            gr.lib._balanceValue.show(false);
            gr.lib._balanceText.show(false);
            gr.lib._meterDivision0.show(false);
            //gr.lib._meterDivision1.show(false);
        }
        
        if (this.config.style.balanceText) {
            this.gameUtils.setTextStyle(gr.lib._balanceText, this.config.style.balanceText);
        }
        if (this.SKBeInstant.isWLA()){
            gr.lib._balanceText.setText(this.loader.i18n.Game.balance.toUpperCase());
        }
        else{
            gr.lib._balanceText.setText(this.loader.i18n.Game.balance);
        }
        if (this.config.style.balanceValue) {
            this.gameUtils.setTextStyle(gr.lib._balanceValue, this.config.style.balanceValue);
        }
        if(!this.SKBeInstant.isSKB()){
           gr.lib._balanceValue.setText('');
        }
        if (this.config.style.winsText) {
            this.gameUtils.setTextStyle(gr.lib._winsText, this.config.style.winsText);
        }
        if (this.config.style.winsValue) {
            this.gameUtils.setTextStyle(this.winningTextSprite, this.config.style.winsValue);
        }
        if (this.config.style.ticketCostMeterText) {
            this.gameUtils.setTextStyle(gr.lib._ticketCostMeterText, this.config.style.ticketCostMeterText);
        }
        if (this.config.style.ticketCostMeterValue) {
            this.gameUtils.setTextStyle(gr.lib._ticketCostMeterValue, this.config.style.ticketCostMeterValue);
        }
        /*if (this.config.style.meterDivision0) {
            this.gameUtils.setTextStyle(gr.lib._meterDivision0, this.config.style.meterDivision0);
        }
        if (this.config.style.meterDivision1) {
            this.gameUtils.setTextStyle(gr.lib._meterDivision1, this.config.style.meterDivision1);
        }*/
        
        if (this.SKBeInstant.isWLA()){
            gr.lib._ticketCostMeterText.setText(this.loader.i18n.Game.meter_wager.toUpperCase());
        }
        else{
            gr.lib._ticketCostMeterText.setText(this.loader.i18n.Game.meter_wager);
        }
        //gr.lib._meterDivision0.setText(this.loader.i18n.Game.meter_division);
        //gr.lib._meterDivision1.setText(this.loader.i18n.Game.meter_division);
        
        gr.lib._balanceText.originFontSize = gr.lib._balanceText._currentStyle._font._size;
		
        this.winningTextSprite.setText(this.SKBeInstant.config.defaultWinsValue);
        if(this.SKBeInstant.config.wagerType === 'BUY'){
            if (this.SKBeInstant.isWLA()){
                gr.lib._winsText.setText(this.loader.i18n.Game.wins.toUpperCase());
            }
            else{
                gr.lib._winsText.setText(this.loader.i18n.Game.wins);
            }
        }else{
            if (this.SKBeInstant.isWLA()){
                gr.lib._winsText.setText(this.loader.i18n.Game.wins_demo.toUpperCase());
            }
            else{
                gr.lib._winsText.setText(this.loader.i18n.Game.wins_demo);            
            }
        }
        this.gameUtils.fixMeter(gr);

    };
    MetersController.prototype.onTicketCostChanged = function(prizePoint){
        if (this.SKBeInstant.config.wagerType === 'BUY') {
            gr.lib._winsText.setText(this.loader.i18n.Game.wins);
            gr.lib._ticketCostMeterValue.setText(this.SKBeInstant.formatCurrency(prizePoint).formattedAmount);
        } else {
            gr.lib._winsText.setText(this.loader.i18n.Game.wins_demo);
            gr.lib._ticketCostMeterValue.setText(this.loader.i18n.Game.demo + this.SKBeInstant.formatCurrency(prizePoint).formattedAmount);
        }
        this.gameUtils.fixMeter(gr);
    };
    MetersController.prototype.onPlayerWantsPlayAgain = function(){
        this.instantWinAmount = 0;
        this.normalWinAmount = 0;
        this.winningTextSprite.setText(this.SKBeInstant.config.defaultWinsValue);
        this.gameUtils.fixMeter(gr);
    };
    
    MetersController.prototype.onBeforeShowStage = function(data){
        gr.lib._balanceValue.setText(this.currencyHelper.formatBalance(data.response.Balances["@totalBalance"]));
        this.gameUtils.fixMeter(gr);
        gr.forceRender();
    };
    return MetersController;
});