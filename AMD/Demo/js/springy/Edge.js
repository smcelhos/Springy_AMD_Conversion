define(/*[],*/ function(){
	var Edge = function(id, source, target, data){
		this.id = id;
		this.source = source;
		this.target = target;
		this.data = (data !== undefined) ? data : {};
		
		// Edge data field used by layout alorithm
        // this.data.length
        // this.data.type
		
	
	};
	
	return Edge;

});