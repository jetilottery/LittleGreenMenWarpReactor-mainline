define(function module(require){
	//require('game/component/ruller');
    require('game/configController');
	require('game/engineCustomised');
    require('game/loadController');
    require('game/ticketCostController');
    require('game/utils/gameUtils');
    require('game/paytableHelpController');
	require('game/audioController');
	require('skbJet/componentCRDC/IwGameControllers/gameSizeController');
	require('skbJet/componentCRDC/IwGameControllers/jLotteryInnerLoarderUIController');
	require('skbJet/componentCRDC/IwGameControllers/rotateController');
    const ET = require('game/etController');
	const ControlPanel = require('game/controlPanelController');
    //const InnerPaytableController = require('game/innerPaytableController');
	const TutorialController = require('game/tutorialController');
    const PriceTableController = require('game/priceTableController');
	const MetersController = require('game/metersController');
	const ResultPanelController = require('game/resultController');
	const ErrorWarningController = require('game/errorWarningController');
	const WinUpToController = require('game/winUpToController');
	const StandardBonusController = require('game/standardBonusController');
	const TransitionController = require('game/transitionController');
	const MeteorEmitter = require('game/component/meteorEmitter');
	const ReelSetController = require('game/reelSetController');
	
	new MetersController();
	new TutorialController();
	new ControlPanel();
	new ET();
	//new InnerPaytableController();
	new PriceTableController();
	new ReelSetController();
	new MeteorEmitter();
	new TransitionController();
	new StandardBonusController();
	new ResultPanelController();
	new WinUpToController();
	new ErrorWarningController();

	return {};	
});
	
