define(function module(){
	function CallbackFunc(caller, method){
		this.subscriberRef = caller;
		this.handler = method;
	}
	CallbackFunc.prototype.equalsCallback = function (callbackObj){
		return (this.subscriberRef === callbackObj.subscriberRef) && (this.handler === callbackObj.handler);
	};
	return CallbackFunc;
});