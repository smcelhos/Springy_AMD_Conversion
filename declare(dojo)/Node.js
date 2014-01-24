define([
	"dojo/_base/declare",
	"dojo/_base/lang"
],function(declare, lang){
	
	return declare(null, {
		// declaring fields isn't necessary but can help in documentation
		id: 0, // id of this node
		data: null // if declared ref fields should be null and set in constructor
		constructor: function(args){
			lang.mixin(this, args);
			
			this.data = this.data || {};
		}
	
	});

});