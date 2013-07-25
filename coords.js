var COORDS = (function() {
	"use strict";

	var _with = function(context, enter, exit, fn) {
		context[enter]();
		var err = null;
		try {
			fn();
		} catch (e) {
			err = e;
		}
		context[exit]();
		if (err) throw err;
	};

	var Point = function(id) {
		this.render = function(context, label) {
			_with(context, 'save', 'restore', function() {
				context.translate(id[0], id[1]);
				context.beginPath();
				context.arc(0, 0, 5, 0, Math.PI * 2);
				context.fill();
				_with(context, 'save', 'restore', function() {
					context.scale(1, -1);
					context.strokeStyle = 'white';
					context.lineWidth = 3;
					context.strokeText(label, 6, 4);
					context.fillText(label, 6, 4);
				});
			});
		};
	};

	Point.bag = {};
	Point.hash = function(id) {
		return Math.round(id[0], 2) + "x" + Math.round(id[1], 2);
	};

	/**
	* Get a point from the manifold, identified by a 2D cartesian coordinate
	* system. Unfortunately, as this is the real world, we can not just summon
	* points out of the aether and then compare them. They have to be
	* identified using a 'favoured' or 'blessed' coordinate system. I am using
	* a 2D cartesian system because that is what the computer uses.
	*/
	Point.get = function(id) {
		var hash = Point.hash(id);
		if (hash in Point.bag) {
			return Point.bag[hash];
		} else {
			var p = new Point(id);
			Point.bag[hash] = p;
			return p;
		}
	};

	var makeVariablePoint = function(coordinateSystem) {

		var variablePoint = Object.create(null);
		variablePoint.coordinateSystem = coordinateSystem;
		variablePoint.inputs = [].slice.call(coordinateSystem.container.querySelectorAll('input.coord-part'), 0);

		variablePoint.render = function(context) {
			var coords = this.getCoordinates();
			var id = coordinateSystem.mapping.apply(coordinateSystem, coords);
			var point = COORDS.getPoint(id);

			var label = coordinateSystem.name.toLowerCase() + " = " +
				coordinateSystem.name + "(" + coords.join(", ") + ")";

			_with(context, 'save', 'restore', function() {
				context.lineWidth = 10;
				point.render(context, label);
			});
		};

		variablePoint.getCoordinates = function() {
			return this.inputs.map(function(bit) { return parseFloat(bit.value); });
		};
		variablePoint.setCoordinates = function(coords) {
			coords.forEach(function(coord, i) {
				this.inputs[i].value = parseFloat(coord);
			}, this);
		};

		MicroEvent.mixin(variablePoint);

		variablePoint.inputs.forEach(function(bit) {
			bit.addEventListener('change', function() {
				variablePoint.fireEvent('change');
			});
		});

		return variablePoint;
	};

	var  baseCoordinateSystem = Object.create(null);

	baseCoordinateSystem.renderAxis = function(context) {
		context.save();
		context.strokeStyle = this.colour;
		this.reallyRenderAxis(context);
		context.restore();
	};

	baseCoordinateSystem.renderPoint = function(context) {
		context.save();
		context.strokeStyle = this.colour;
		context.fillStyle = this.colour;
		this.variablePoint.render(context);
		context.restore();
	};


	var makeCoordinateSystem = function(options) {
		var coordinateSystem = Object.create(baseCoordinateSystem);

		options.reallyRenderAxis = options.renderAxis;
		delete options.renderAxis;

		for (var x in options) {
			coordinateSystem[x] = options[x];
		}

		coordinateSystem.container = document.querySelector('[data-coord-maker=' + coordinateSystem.name + ']');
		coordinateSystem.container.querySelector('.coord-colour').style.backgroundColor = coordinateSystem.colour;
		coordinateSystem.variablePoint = makeVariablePoint(
			coordinateSystem
		);

		return coordinateSystem;
	};


	return {
		'getPoint': Point.get,
		'makeVariablePoint': makeVariablePoint,
		'makeCoordinateSystem': makeCoordinateSystem
	};
})();
