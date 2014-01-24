define([
	"dojo/_base/declare", // classy javascript
	"dojo/_base/lang" // mixin
], function(declare, lang){

	return declare(null, {
		
		constructor: function(id, source, target, data){
			// it is common in dojo to just expect a single property bag argument to constructor, but it doesn't matter
			if(arguments.length === 1 && typeof id === "object"){
				lang.mixin(this, args);
			}else{
				this.id = id;
				this.source = source:
				this.target = target;
				this.data = data;
			}
			
			this.data = this.data || {};
		}
	});

});