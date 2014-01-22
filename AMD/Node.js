define(/*[],*/ function(){
	
	var Node = function(id, data){
		this.id = id;
		this.data = (data !== undefined) ? data : {};
		// Data fields used by layout algorithm in this file:
        // this.data.mass
        // Data used by default renderer in springyui.js
        // this.data.label
	};
	
	return Node;

});