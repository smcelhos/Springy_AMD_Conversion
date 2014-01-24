define(/*[],*/ function(){
	// Module returns a function, no change from AMD
	
	
	// a private bind
	var __bind = function(fn, me){
		return function(){
			return fn.apply(me, arguments); 
		};
	}
	
	
	var root = (typeof window != "undefined" &&
				typeof location != "undefined" &&
				typeof document != "undefined" &&
				window.location == location && window.document == document) ? window : global;
	
	var requestAnimationFrame = __bind(root.requestAnimationFrame ||
                root.webkitRequestAnimationFrame ||
                root.mozRequestAnimationFrame ||
                root.oRequestAnimationFrame ||
                root.msRequestAnimationFrame ||
                (function(callback, element) {
                        root.setTimeout(callback, 10);
                }), root);
				
	return requestAnimationFrame;
});