define([
	"dojo/_base/declare", // classy javascript
	"dojo/json", // add JSON support to older browsers
	"./Node", // A simple constructor, could just be declared in this file
	"./Edge"	// A simple constuctor, could just be declared in this file
], function(declare, JSON, Node, Edge){
	
	// private function
	var isEmpty = function(obj) {
		for (var k in obj) {
			if (obj.hasOwnProperty(k)) {
					return false;
			}
		}
		return true;
	};

	
	return declare(null, {
		nodeSet: null,
		nodes: null,
		edges: null,
		adjacency: null,
		nextNodeId: 0,
		nextEdgeId: 0,
		eventListeners: null,
		
		constructor: function(args){
			// initialize non-scalar variables
			this.nodeSet = {};
			this.nodes = [];
			this.edges = [];
			this.adjacency = {};
			this.eventListeners = [];
			
			// safeMixin is like lang.mixin, but does some additional decoration, you may see either
			declare.safeMixin(this, args);
		},
		
		addNode: function(node) {
			if (!(node.id in this.nodeSet)) {
				this.nodes.push(node);
			}

			this.nodeSet[node.id] = node;

			this.notify();
			return node;
		},
		
		addNodes: function(){
			// accepts variable number of arguments, where each argument
			// is a string that becomes both node identifier and label
			for (var i = 0; i < arguments.length; i++) {
				var name = arguments[i];
				var props = {
					id: name,
					data: {
						label: name
					}
				};
				var node = new Node(props);
				this.addNode(node);
			}
		},
		
		addEdge: function(edge) {
			var exists = false;
			
			// this could be done short-circut with Array.prototype.some in modern browsers
			this.edges.forEach(function(e) {
				if (edge.id === e.id) { exists = true; }
			});

			if (!exists) {
				this.edges.push(edge);
			}

			if (!(edge.source.id in this.adjacency)) {
				this.adjacency[edge.source.id] = {};
			}
			if (!(edge.target.id in this.adjacency[edge.source.id])) {
				this.adjacency[edge.source.id][edge.target.id] = [];
			}

			exists = false;
			this.adjacency[edge.source.id][edge.target.id].forEach(function(e) {
				if (edge.id === e.id) { exists = true; }
			});

			if (!exists) {
				this.adjacency[edge.source.id][edge.target.id].push(edge);
			}

			this.notify();
			return edge;
		},
		
		addEdges: function(){
			for (var i = 0; i < arguments.length; i++) {
				var e = arguments[i];
				var node1 = this.nodeSet[e[0]];
				if (node1 == undefined) {
						throw new TypeError("invalid node name: " + e[0]);
				}
				var node2 = this.nodeSet[e[1]];
				if (node2 == undefined) {
						throw new TypeError("invalid node name: " + e[1]);
				}
				var attr = e[2];
				
				this.newEdge(node1, node2, attr);
			}
		},
		
		newNode: function(data){
			var props = {
				id: this.nextNodeId++,
				data: data
			};
			
			var node = new Node(props);
			this.addNode(node);
			
			return node;
		},
		
		newEdge: function(source, target, data){
			var props = {
				id: this.nextEdgeId++, 
				source: source, 
				target: target, 
				data: data
			};
			var edge = new Edge(props);
			this.addEdge(edge);
			return edge;
		},
		
		loadJSON: function(json){
			if (typeof json == 'string' || json instanceof String) {
				json = JSON.parse( json );
			}

			if ('nodes' in json || 'edges' in json) {
				this.addNodes.apply(this, json['nodes']);
				this.addEdges.apply(this, json['edges']);
			}
		},
		
		getEdges: function(node1, node2){
			if (node1.id in this.adjacency
				&& node2.id in this.adjacency[node1.id]) {
				return this.adjacency[node1.id][node2.id];
			}

			return [];
		}, 
		
		removeNode: function(node){
			if (node.id in this.nodeSet) {
				delete this.nodeSet[node.id];
			}

			for (var i = this.nodes.length - 1; i >= 0; i--) {
				if (this.nodes[i].id === node.id) {
						this.nodes.splice(i, 1);
				}
			}

			this.detachNode(node);
		},
		
		detachNode: function(node){
			var tmpEdges = this.edges.slice();
			tmpEdges.forEach(function(e) {
				if (e.source.id === node.id || e.target.id === node.id) {
						this.removeEdge(e);
				}
			}, this);

			this.notify();
		},
		
		removeEdge: function(edge){
			for (var i = this.edges.length - 1; i >= 0; i--) {
				if (this.edges[i].id === edge.id) {
						this.edges.splice(i, 1);
				}
			}

			for (var x in this.adjacency) {
				for (var y in this.adjacency[x]) {
					var edges = this.adjacency[x][y];

					for (var j=edges.length - 1; j>=0; j--) {
						if (this.adjacency[x][y][j].id === edge.id) {
							this.adjacency[x][y].splice(j, 1);
						}
					}

					// Clean up empty edge arrays
					if (this.adjacency[x][y].length == 0) {
						delete this.adjacency[x][y];
					}
				}

					// Clean up empty objects
				if (isEmpty(this.adjacency[x])) {
					delete this.adjacency[x];
				}
			}

			this.notify();
		},
		
		merge: function(data){
			var nodes = [];
			data.nodes.forEach(function(n) {
				nodes.push(this.addNode(new Node(n.id, n.data)));
			}, this);

			data.edges.forEach(function(e) {
				var from = nodes[e.from];
				var to = nodes[e.to];

				var id = (e.directed)
						? (id = e.type + "-" + from.id + "-" + to.id)
						: (from.id < to.id) // normalise id for non-directed edges
								? e.type + "-" + from.id + "-" + to.id
								: e.type + "-" + to.id + "-" + from.id;

				var edge = this.addEdge(new Edge(id, from, to, e.data));
				edge.data.type = e.type;
			}, this);
		},
		
		filterNodes: function(fn) {
			// could be done with Array.prototype.filter in modern browsers
			var tmpNodes = this.nodes.slice();
			tmpNodes.forEach(function(n) {
				if (!fn(n)) {
						this.removeNode(n);
				}
			}, this);
		},
		
		filterEdges: function(fn){
			var tmpEdges = this.edges.slice();
			tmpEdges.forEach(function(e) {
				if (!fn(e)) {
						this.removeEdge(e);
				}
			}, this);
		},
		
		addGraphListener: function(obj){
			this.eventListeners.push(obj);
		},
		
		notify: function(){
			this.eventListeners.forEach(function(obj){
				obj.graphChanged();
			});
		}
		
	});
	
});