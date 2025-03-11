define(function module(require){
  const PIXI = require('com/pixijs/pixi');

  function TweenPath(){
	this._closed = false;
	this.polygon = new PIXI.Polygon();
	this.polygon.closed = false;
	this._tmpPoint = new PIXI.Point();
	this._tmpPoint2 = new PIXI.Point(); 
	this._tmpDistance = [];
	this.currentPath = null;
	this.graphicsData = [];
	this.dirty = true;
	Object.defineProperty(this, 'closed', {
		get: function (){
			return this._closed;
		},
		set: function (value){
			if(this._closed === value)return;
			this.polygon.closed = value;
			this._closed = value;
			this.dirty = true;
		}
	});  
	Object.defineProperty(this, 'length',{
		get: function (){
			return (this.polygon.points.length) ? this.polygon.points.length/2 + ((this._closed) ? 1 : 0) : 0;
		}
	});
  }
  TweenPath.prototype.init = function(){
	this.polygon = new PIXI.Polygon();
	this.polygon.closed = false;

	this._tmpPoint = new PIXI.Point();
	this._tmpPoint2 = new PIXI.Point();
  };
  TweenPath.prototype.moveTo = function(x, y){
	PIXI.Graphics.prototype.moveTo.call(this, x,y);
	this.dirty = true;
	return this;
  };
  TweenPath.prototype.lineTo = function(x, y){
	PIXI.Graphics.prototype.lineTo.call(this, x,y);
	this.dirty = true;
	return this;
  };
  TweenPath.prototype.bezierCurveTo = function(cpX, cpY, cpX2, cpY2, toX, toY){
	PIXI.Graphics.prototype.bezierCurveTo.call(this, cpX, cpY, cpX2, cpY2, toX, toY);
	this.dirty = true;
	return this;
  };
  TweenPath.prototype.quadraticCurveTo = function(cpX, cpY, toX, toY){
	PIXI.Graphics.prototype.quadraticCurveTo.call(this, cpX, cpY, toX, toY);
	this.dirty = true;
	return this;
  };
  TweenPath.prototype.arcTo = function(x1, y1, x2, y2, radius){
	PIXI.Graphics.prototype.arcTo.call(this, x1, y1, x2, y2, radius);
	this.dirty = true;
	return this;
  };
  TweenPath.prototype.arc = function(cx, cy, radius, startAngle, endAngle, anticlockwise){
	PIXI.Graphics.prototype.arc.call(this, cx, cy, radius, startAngle, endAngle, anticlockwise);
	this.dirty = true;
	return this;
  };

  TweenPath.prototype.drawShape = function(shape){
	PIXI.Graphics.prototype.drawShape.call(this, shape);
	this.dirty = true;
	return this;
  };

  TweenPath.prototype.getPoint = function(num){
	this.parsePoints();
	let len = (this.closed && num >= this.length-1) ? 0 : num*2;
	this._tmpPoint.set(this.polygon.points[len], this.polygon.points[len+1]);
	return this._tmpPoint;
  };

  TweenPath.prototype.distanceBetween = function(num1, num2){
	this.parsePoints();
	let {x:p1X, y:p1Y} = this.getPoint(num1);
	let {x:p2X, y:p2Y} = this.getPoint(num2);
	let dx = p2X - p1X;
	let dy = p2Y - p1Y;

	return Math.sqrt(dx*dx+dy*dy);
  };

  TweenPath.prototype.totalDistance = function(){
	this.parsePoints();
	this._tmpDistance.length = 0;
	this._tmpDistance.push(0);

	let len = this.length;
	let distance = 0;
	for(let i = 0; i < len-1; i++){
		distance += this.distanceBetween(i, i+1);
		this._tmpDistance.push(distance);
	}

	return distance;
  };

  TweenPath.prototype.getPointAt = function(num){
	this.parsePoints();
	if(num > this.length){
		return this.getPoint(this.length-1);
	}

	if(num%1 === 0){
		return this.getPoint(num);
	}else{
		this._tmpPoint2.set(0,0);
		let diff = num%1;
		let {x:ceilX, y:ceilY} = this.getPoint(Math.ceil(num));
		let {x:floorX, y:floorY} = this.getPoint(Math.floor(num));
		
		let xx = -((floorX-ceilX)*diff);
		let yy = -((floorY-ceilY)*diff);
		this._tmpPoint2.set(floorX+xx, floorY+yy);
		return this._tmpPoint2;
	}
  };

  TweenPath.prototype.getPointAtDistance = function(distance){
	this.parsePoints();
	if(!this._tmpDistance)this.totalDistance();
	let len = this._tmpDistance.length;
	let n = 0;

	let totalDistance = this._tmpDistance[this._tmpDistance.length-1];
	if(distance < 0){
		distance = totalDistance+distance;
	}else if(distance > totalDistance){
		distance = distance-totalDistance;
	}

	for(let i = 0; i < len; i++){
		if(distance >= this._tmpDistance[i]){
			n = i;
		}

		if(distance < this._tmpDistance[i])break;
	}

	if(n === this.length-1){
		return this.getPointAt(n);
	}

	let diff1 = distance-this._tmpDistance[n];
	let diff2 = this._tmpDistance[n+1] - this._tmpDistance[n];

	return this.getPointAt(n+diff1/diff2);
  };

  TweenPath.prototype.parsePoints = function(){
	if(!this.dirty)return this;
	this.dirty = false;
	this.polygon.points.length = 0;
	for(let i = 0; i < this.graphicsData.length; i++){
		let shape = this.graphicsData[i].shape;
		if(shape && shape.points){
			this.polygon.points = this.polygon.points.concat(shape.points);
		}
	}
	return this;
  };

  TweenPath.prototype.clear = function(){
	this.graphicsData.length = 0;
	this.currentPath = null;
	this.polygon.points.length = 0;
	this._closed = false;
	this.dirty = false;
	return this;
  };

  return TweenPath;
});

