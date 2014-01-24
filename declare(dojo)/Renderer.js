define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare, lang){

	return declare(null, {
		constructor: function(args){
			/*
				{
					layout: ...,
					clear: ...,
					drawEdge: ...,
					drawNode: ...,
					onRenderStop: ...,
					onRenderStart: ...
				}
			*/
			
			lang.mixin(this, args);
			
			this.layout.graph.addGraphListener(this);
		},
		
		graphChanged: function(e){
			this.start();
		},
		
		start: function(done) {
			var t = this;
			this.layout.start(function render() {
				t.clear();

				t.layout.eachEdge(function(edge, spring) {
					t.drawEdge(edge, spring.point1.p, spring.point2.p);
				});

				t.layout.eachNode(function(node, point) {
					t.drawNode(node, point.p);
				});
			}, this.onRenderStart, this.onRenderStop);
		},
		
		stop: function(){
			this.layout.stop();
		}
		
	});

});