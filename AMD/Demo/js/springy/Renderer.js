define(/*[],*/ function(){
	var Renderer = function(layout, clear, drawEdge, drawNode, onRenderStop, onRenderStart) {
		this.layout = layout;
		this.clear = clear;
		this.drawEdge = drawEdge;
		this.drawNode = drawNode;
		this.onRenderStop = onRenderStop;
		this.onRenderStart = onRenderStart;

		this.layout.graph.addGraphListener(this);
	};
		
	Renderer.prototype.graphChanged = function(e) {
		this.start();
	};	
	
	Renderer.prototype.start = function(done) {
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
	};

	Renderer.prototype.stop = function() {
		this.layout.stop();
	};
		
	return Renderer;

});