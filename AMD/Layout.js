define([
	"./Vector",
	"./requestAnimationFrame"
], function(Vector, requestAnimationFrame){

	// Point
	var Point = function(position, mass) {
		this.p = position; // position
		this.m = mass; // mass
		this.v = new Vector(0, 0); // velocity
		this.a = new Vector(0, 0); // acceleration
	};

	Point.prototype.applyForce = function(force) {
		this.a = this.a.add(force.divide(this.m));
	};

	// Spring
	var Spring = function(point1, point2, length, k) {
		this.point1 = point1;
		this.point2 = point2;
		this.length = length; // spring length at rest
		this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is
	};



	
	var ForceDirected = function(graph, stiffness, repulsion, damping){
		this.graph = graph;
		this.stiffness = stiffness; // spring stiffness constant
		this.repulsion = repulsion; // repulsion constant
		this.damping = damping; // velocity damping factor

		this.nodePoints = {}; // keep track of points associated with nodes
		this.edgeSprings = {}; // keep track of springs associated with edges
	};
	
	// Attach Point/Spring to ForceDirected like it was before
	ForceDirected.Point = Point;
	ForceDirected.Spring = Spring;

	ForceDirected.prototype.point = function(node) {
		if (!(node.id in this.nodePoints)) {
				var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
				this.nodePoints[node.id] = new ForceDirected.Point(Vector.random(), mass);
		}

		return this.nodePoints[node.id];
	};

	ForceDirected.prototype.spring = function(edge) {
		if (!(edge.id in this.edgeSprings)) {
				var length = (edge.data.length !== undefined) ? edge.data.length : 1.0;

				var existingSpring = false;

				var from = this.graph.getEdges(edge.source, edge.target);
				from.forEach(function(e) {
						if (existingSpring === false && e.id in this.edgeSprings) {
								existingSpring = this.edgeSprings[e.id];
						}
				}, this);

				if (existingSpring !== false) {
						return new ForceDirected.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
				}

				var to = this.graph.getEdges(edge.target, edge.source);
				from.forEach(function(e){
						if (existingSpring === false && e.id in this.edgeSprings) {
								existingSpring = this.edgeSprings[e.id];
						}
				}, this);

				if (existingSpring !== false) {
						return new ForceDirected.Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
				}

				this.edgeSprings[edge.id] = new ForceDirected.Spring(
						this.point(edge.source), this.point(edge.target), length, this.stiffness
				);
		}

		return this.edgeSprings[edge.id];
	};

	// callback should accept two arguments: Node, Point
	ForceDirected.prototype.eachNode = function(callback) {
		var t = this;
		this.graph.nodes.forEach(function(n){
				callback.call(t, n, t.point(n));
		});
	};

	// callback should accept two arguments: Edge, Spring
	ForceDirected.prototype.eachEdge = function(callback) {
		var t = this;
		this.graph.edges.forEach(function(e){
				callback.call(t, e, t.spring(e));
		});
	};

	// callback should accept one argument: Spring
	ForceDirected.prototype.eachSpring = function(callback) {
		var t = this;
		this.graph.edges.forEach(function(e){
				callback.call(t, t.spring(e));
		});
};


	// Physics stuff
	ForceDirected.prototype.applyCoulombsLaw = function() {
		this.eachNode(function(n1, point1) {
			this.eachNode(function(n2, point2) {
					if (point1 !== point2)
					{
						var d = point1.p.subtract(point2.p);
						var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
						var direction = d.normalise();

						// apply force to each end point
						point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
						point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
					}
			});
		});
	};

	ForceDirected.prototype.applyHookesLaw = function() {
			this.eachSpring(function(spring){
				var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
				var displacement = spring.length - d.magnitude();
				var direction = d.normalise();

				// apply force to each end point
				spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
				spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
			});
	};

	ForceDirected.prototype.attractToCentre = function() {
		this.eachNode(function(node, point) {
			var direction = point.p.multiply(-1.0);
			point.applyForce(direction.multiply(this.repulsion / 50.0));
		});
	};


	ForceDirected.prototype.updateVelocity = function(timestep) {
		this.eachNode(function(node, point) {
			// Is this, along with updatePosition below, the only places that your
			// integration code exist?
			point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
			point.a = new Vector(0,0);
		});
	};

	ForceDirected.prototype.updatePosition = function(timestep) {
		this.eachNode(function(node, point) {
			// Same question as above; along with updateVelocity, is this all of
			// your integration code?
			point.p = point.p.add(point.v.multiply(timestep));
		});
	};

	// Calculate the total kinetic energy of the system
	ForceDirected.prototype.totalEnergy = function(timestep) {
		var energy = 0.0;
		this.eachNode(function(node, point) {
			var speed = point.v.magnitude();
			energy += 0.5 * point.m * speed * speed;
		});

		return energy;
	};
	
	
	 /**
	 * Start simulation if it's not running already.
	 * In case it's running then the call is ignored, and none of the callbacks passed is ever executed.
	 */
	ForceDirected.prototype.start = function(render, onRenderStop, onRenderStart) {
		var t = this;

		if (this._started) return;
		this._started = true;
		this._stop = false;

		if (onRenderStart !== undefined) { onRenderStart(); }

		// use it's own module to avoid circular reference
		requestAnimationFrame(function step() {
			t.applyCoulombsLaw();
			t.applyHookesLaw();
			t.attractToCentre();
			t.updateVelocity(0.03);
			t.updatePosition(0.03);

			if (render !== undefined) {
					render();
			}

			// stop simulation when energy of the system goes below a threshold
			if (t._stop || t.totalEnergy() < 0.01) {
					t._started = false;
					if (onRenderStop !== undefined) { onRenderStop(); }
			} else {
					requestAnimationFrame(step);
			}
		});
	};

	ForceDirected.prototype.stop = function() {
			this._stop = true;
	}

	// Find the nearest point to a particular position
	ForceDirected.prototype.nearest = function(pos) {
			var min = {node: null, point: null, distance: null};
			var t = this;
			this.graph.nodes.forEach(function(n){
					var point = t.point(n);
					var distance = point.p.subtract(pos).magnitude();

					if (min.distance === null || distance < min.distance) {
							min = {node: n, point: point, distance: distance};
					}
			});

			return min;
	};

	// returns [bottomleft, topright]
	ForceDirected.prototype.getBoundingBox = function() {
			var bottomleft = new Vector(-2,-2);
			var topright = new Vector(2,2);

			this.eachNode(function(n, point) {
					if (point.p.x < bottomleft.x) {
							bottomleft.x = point.p.x;
					}
					if (point.p.y < bottomleft.y) {
							bottomleft.y = point.p.y;
					}
					if (point.p.x > topright.x) {
							topright.x = point.p.x;
					}
					if (point.p.y > topright.y) {
							topright.y = point.p.y;
					}
			});

			var padding = topright.subtract(bottomleft).multiply(0.07); // ~5% padding

			return {bottomleft: bottomleft.subtract(padding), topright: topright.add(padding)};
	};
	
	
	
	return {
		ForceDirected: ForceDirected
	};

});