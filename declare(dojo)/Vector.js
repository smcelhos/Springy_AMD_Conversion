define([
	"dojo/_base/declare", 
	"dojo/_base/lang"
] function(declare, lang){
	
	return declare(null, {
		constructor: function(x, y){
			// we'll do something a little different here, just for example
			if(arguments.length === 1 && typeof x === "object"){
				lang.mixin(this, args);
			}else{
				// assume x, y 
				this.x = x;
				this.y = y;
			}
		},
		
		
	});
	
	
	Vector.random = function(){
		return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
	}
	
	Vector.prototype.add = function(v2) {
			return new Vector(this.x + v2.x, this.y + v2.y);
	};

	Vector.prototype.subtract = function(v2) {
		return new Vector(this.x - v2.x, this.y - v2.y);
	};

	Vector.prototype.multiply = function(n) {
		return new Vector(this.x * n, this.y * n);
	};

	Vector.prototype.divide = function(n) {
		return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
	};

	Vector.prototype.magnitude = function() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	};

	Vector.prototype.normal = function() {
		return new Vector(-this.y, this.x);
	};

	Vector.prototype.normalise = function() {
		return this.divide(this.magnitude());
	};
	
	
	return Vector;

});