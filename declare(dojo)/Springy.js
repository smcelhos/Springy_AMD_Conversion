define([
	"./Graph",
	"./Node",
	"./Edge",
	"./Layout",
	"./Vector",
	"./Renderer",
	"./requestAnimationFrame"
],function(Graph, Node, Edge, Layout, Vector, Renderer, requestAnimationFrame){
	
	// no need to use declare on this module (though we used it on other modules that didn't really need it, so I guess really i'm tired. . .
	return {
		Graph: Graph,
		Node: Node,
		Edge: Edge,
		Layout: Layout,
		Vector: Vector,
		Renderer: Renderer,
		requestAnimationFrame: requestAnimationFrame

	}

});