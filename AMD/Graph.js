/**
 * Springy v2.2.2
 *
 * Copyright (c) 2010-2013 Dennis Hotson
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
define([
	"./Node", // A simple constructor, could just be declared in this file
	"./Edge"	// A simple constuctor, could just be declared in this file
], function(Node, Edge){
	
	// private function
	var isEmpty = function(obj) {
		for (var k in obj) {
			if (obj.hasOwnProperty(k)) {
					return false;
			}
		}
		return true;
	};


	var Graph = function() {
		this.nodeSet = {};
		this.nodes = [];
		this.edges = [];
		this.adjacency = {};

		this.nextNodeId = 0;
		this.nextEdgeId = 0;
		this.eventListeners = [];
    };
	
	Graph.prototype.constructor = Graph;
	
	Graph.prototype.addNode = function(node) {
		if (!(node.id in this.nodeSet)) {
				this.nodes.push(node);
		}

		this.nodeSet[node.id] = node;

		this.notify();
		return node;
	};
	
	Graph.prototype.addNodes = function() {
		// accepts variable number of arguments, where each argument
		// is a string that becomes both node identifier and label
		for (var i = 0; i < arguments.length; i++) {
				var name = arguments[i];
				var node = new Node(name, {label:name});
				this.addNode(node);
		}
	};
	
	Graph.prototype.addEdge = function(edge) {
			var exists = false;
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
	};
	
	Graph.prototype.addEdges = function() {
			// accepts variable number of arguments, where each argument
			// is a triple [nodeid1, nodeid2, attributes]
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
	};
	
	Graph.prototype.newNode = function(data) {
		var node = new Node(this.nextNodeId++, data);
		this.addNode(node);
		return node;
	};
	
	Graph.prototype.newEdge = function(source, target, data) {
		var edge = new Edge(this.nextEdgeId++, source, target, data);
		this.addEdge(edge);
		return edge;
    };
	
	Graph.prototype.loadJSON = function(json) {
        /**
        Springy's simple JSON format for graphs.

        historically, Springy uses separate lists
        of nodes and edges:

			{
					"nodes": [
							"center",
							"left",
							"right",
							"up",
							"satellite"
					],
					"edges": [
							["center", "left"],
							["center", "right"],
							["center", "up"]
					]
			}

		**/
		// parse if a string is passed (EC5+ browsers)
		if (typeof json == 'string' || json instanceof String) {
			json = JSON.parse( json );
		}

		if ('nodes' in json || 'edges' in json) {
			this.addNodes.apply(this, json['nodes']);
			this.addEdges.apply(this, json['edges']);
		}
	};


	// find the edges from node1 to node2
	Graph.prototype.getEdges = function(node1, node2) {
		if (node1.id in this.adjacency
			&& node2.id in this.adjacency[node1.id]) {
			return this.adjacency[node1.id][node2.id];
		}

		return [];
	};

	// remove a node and it's associated edges from the graph
	Graph.prototype.removeNode = function(node) {
		if (node.id in this.nodeSet) {
			delete this.nodeSet[node.id];
		}

		for (var i = this.nodes.length - 1; i >= 0; i--) {
			if (this.nodes[i].id === node.id) {
					this.nodes.splice(i, 1);
			}
		}

		this.detachNode(node);
	};

	// removes edges associated with a given node
	Graph.prototype.detachNode = function(node) {
		var tmpEdges = this.edges.slice();
		tmpEdges.forEach(function(e) {
			if (e.source.id === node.id || e.target.id === node.id) {
					this.removeEdge(e);
			}
		}, this);

		this.notify();
	};

	// remove a node and it's associated edges from the graph
	Graph.prototype.removeEdge = function(edge) {
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
	};
	
	Graph.prototype.merge = function(data) {
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
	};

	Graph.prototype.filterNodes = function(fn) {
		var tmpNodes = this.nodes.slice();
		tmpNodes.forEach(function(n) {
			if (!fn(n)) {
					this.removeNode(n);
			}
		}, this);
	};

	Graph.prototype.filterEdges = function(fn) {
		var tmpEdges = this.edges.slice();
		tmpEdges.forEach(function(e) {
			if (!fn(e)) {
					this.removeEdge(e);
			}
		}, this);
	};


	Graph.prototype.addGraphListener = function(obj) {
		this.eventListeners.push(obj);
	};

	Graph.prototype.notify = function() {
		this.eventListeners.forEach(function(obj){
			obj.graphChanged();
		});
	};
		
	return Graph;

});