define([ 
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'game/component/gladButton',
    'game/configController',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'game/events/littleGreenMenGameEvent'
], function (msgBus, audio, gr, SKBeInstant, gladButton, config, loader, LittleGreenMenGameEvent) {
    var audioDisabled = false;
    var audioOn, audioOff;
    var playResult;
    var MTMReinitial = false;
    var popUpDialog = false;

    var hidden = false;
    var playResultAudio = false;
    var buttonClick = true;
    function audioSwitch() {
        if (audioDisabled) {
            gr.lib._buttonAudioOn.show(true);
            gr.lib._buttonAudioOff.show(false);
            audioDisabled = false;
        } else {
            gr.lib._buttonAudioOn.show(false);
            gr.lib._buttonAudioOff.show(true);
            audioDisabled = true;
        }
        audio.muteAll(audioDisabled);
        audio.gameAudioControlChanged(audioDisabled);
        if (buttonClick) {
            if (audioDisabled) {
                if (config.audio && config.audio.ButtonSoundOff) {
                    audio.play(config.audio.ButtonSoundOff.name, config.audio.ButtonSoundOff.channel);
                }
            } else {
                if (config.audio && config.audio.ButtonSoundOn) {
                    audio.play(config.audio.ButtonSoundOn.name, config.audio.ButtonSoundOn.channel);
                }
            }
        }
        buttonClick = true;
    }

    function onConsoleControlChanged(data) {
        if (data.option === 'sound') {
            var isMuted = audio.consoleAudioControlChanged(data);
            if (isMuted) {
                gr.lib._buttonAudioOn.show(false);
                gr.lib._buttonAudioOff.show(true);
                audioDisabled = true;
            } else {
                gr.lib._buttonAudioOn.show(true);
                gr.lib._buttonAudioOff.show(false);
                audioDisabled = false;
            }
            audio.muteAll(audioDisabled);
        }
    }

    function onGameParametersUpdated() {
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true};
        /*if (SKBeInstant.config.customBehavior && (SKBeInstant.config.customBehavior.enableAudioDialog === true || SKBeInstant.config.customBehavior.enableAudioDialog === "true" || SKBeInstant.config.customBehavior.enableAudioDialog === 1)){
         popUpDialog = true;
         }*/
        /*if (SKBeInstant.isSKB()) {
            if (SKBeInstant.config.customBehavior) {
                if (SKBeInstant.config.customBehavior.enableAudioDialog === true || SKBeInstant.config.customBehavior.enableAudioDialog === "true" || SKBeInstant.config.customBehavior.enableAudioDialog === 1) {
                    popUpDialog = true;
                }
            } else if (loader.i18n.gameConfig) {
                if (loader.i18n.gameConfig.enableAudioDialog === true || loader.i18n.gameConfig.enableAudioDialog === "true" || loader.i18n.gameConfig.enableAudioDialog === 1) {
                    popUpDialog = true;
                }
            }
            if (popUpDialog) {
                audio.enableAudioDialog(true);  //set enable the dialog
            }
        }*/

        audioDisabled = SKBeInstant.config.soundStartDisabled;
        if (SKBeInstant.config.assetPack !== 'desktop' && popUpDialog) {
            audioDisabled = true;
        }
        audioOn = new gladButton(gr.lib._buttonAudioOn, config.gladButtonImgName.buttonAudioOn, scaleType);
        audioOff = new gladButton(gr.lib._buttonAudioOff, config.gladButtonImgName.buttonAudioOff, scaleType);
        if (audioDisabled) {
            gr.lib._buttonAudioOn.show(false);
            gr.lib._buttonAudioOff.show(true);
        } else {
            gr.lib._buttonAudioOn.show(true);
            gr.lib._buttonAudioOff.show(false);
        }
        audio.muteAll(audioDisabled);
        audioOn.click(audioSwitch);
        audioOff.click(audioSwitch);
    }

    function onStartUserInteraction(data) {
        playResult = data.playResult;
        if (SKBeInstant.config.gameType === 'ticketReady') {
            return;
        } else {
            if (config.audio && config.audio.gameLoop) {
                gr.getTimer().setTimeout(function () {
                    audio.play(config.audio.gameLoop.name, config.audio.gameLoop.channel, true);
                }, 0);
            }
        }
    }

    function onEnterResultScreenState() {
        if (hidden) {
            playResultAudio = true;
        } else {
            playResultAudio = false;
            if (playResult === 'WIN') {
                if (config.audio && config.audio.gameWin) {
                    audio.play(config.audio.gameWin.name, config.audio.gameWin.channel);
                }
            } else {
                if (config.audio && config.audio.gameNoWin) {
                    audio.play(config.audio.gameNoWin.name, config.audio.gameNoWin.channel);
                }
            }
        }
    }

    function onReStartUserInteraction(data) {
        playResult = data.playResult;
        if (config.audio && config.audio.gameLoop) {
            audio.play(config.audio.gameLoop.name, config.audio.gameLoop.channel, true);
        }
    }

    function reset() {
        audio.stopAllChannel();
    }

    function onReInitialize() {
        audio.stopAllChannel();
        if (MTMReinitial) {
            if (config.audio && config.audio.gameInit) {
                audio.play(config.audio.gameInit.name, config.audio.gameInit.channel);
            }
            MTMReinitial = false;
        }
    }

//    function onInitialize(){
//		if (SKBeInstant.config.screenEnvironment !== 'desktop'){
//			return;
//		}else{
//			// this for screenEnvironment device and tablet
//			if (config.audio && config.audio.gameInit) {
//                gr.getTimer().setTimeout(function() {
//                    audio.play(config.audio.gameInit.name, config.audio.gameInit.channel);
//                }, 0);
//			}
//		}
//    }

    function onPlayerSelectedAudioWhenGameLaunch(data) {
        if (popUpDialog) {
            audioDisabled = data;
            buttonClick = false;
            audioSwitch();
        } else {
            audio.muteAll(audioDisabled);
        }

        if (SKBeInstant.config.gameType === 'ticketReady') {
            if (config.audio && config.audio.gameLoop) {
                gr.getTimer().setTimeout(function () {
                    audio.play(config.audio.gameLoop.name, config.audio.gameLoop.channel, true);
                }, 0);
            }
        } else {
            if (config.audio && config.audio.gameInit) {
                gr.getTimer().setTimeout(function () {
                    audio.play(config.audio.gameInit.name, config.audio.gameInit.channel);
                }, 0);
            }
        }
        msgBus.publish(LittleGreenMenGameEvent.eventIDs.AUDIODIALOG_CLOSED);
    }

    function onPlayerWantsToMoveToMoneyGame() {
        MTMReinitial = true;
    }

    msgBus.subscribe('jLotteryGame.playerWantsToExit', function () {
        audio.stopAllChannel();
    });

    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLotterySKB.onConsoleControlChanged', onConsoleControlChanged);
    msgBus.subscribe('jLotterySKB.reset', reset);
//    msgBus.subscribe('jLottery.initialize', onInitialize);
    msgBus.subscribe('audioPlayer.playerSelectedWhenGameLaunch', onPlayerSelectedAudioWhenGameLaunch);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame', onPlayerWantsToMoveToMoneyGame);

    msgBus.subscribe('resourceLoaded', function () {
        if (!SKBeInstant.isSKB()) {
            if (SKBeInstant.config.customBehavior) {
                if (SKBeInstant.config.customBehavior.enableAudioDialog === true || SKBeInstant.config.customBehavior.enableAudioDialog === "true" || SKBeInstant.config.customBehavior.enableAudioDialog === 1) {
                    popUpDialog = true;
                }
            } else if (loader.i18n.gameConfig) {
                if (loader.i18n.gameConfig.enableAudioDialog === true || loader.i18n.gameConfig.enableAudioDialog === "true" || loader.i18n.gameConfig.enableAudioDialog === 1) {
                    popUpDialog = true;
                }
            }
            if (popUpDialog) {
                audio.enableAudioDialog(true);  //set enable the dialog
            }
        }
    });


    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            hidden = true;
        } else {
            hidden = false;
            if (playResultAudio) {
                onEnterResultScreenState();
            }
        }
    });

    return {};
});