(function() {

	"use strict";

	function debounce(fn, delay) {
		var timer = null;
		return function () {
			var context = this, args = arguments;
			clearTimeout(timer);
			timer = setTimeout(function () {
				fn.apply(context, args);
			}, delay);
		};
	}

	function Graph( properties ) {

		this.properties = properties;

		this.properties.baselines = this.properties.baselines || [];

		this.data = [];
		this.start = 0;
		this.end = 0;
		this.height = 30;

		this.max = 0;
		this.min = Number.MAX_VALUE;

		this.canvas = document.createElement( 'canvas' );
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		this.canvas.style.position = 'absolute';
		this.canvas.style.left = 0;
		this.canvas.style.top = 0;

		this.ctx = this.canvas.getContext( '2d' );
		this.dpr = window.devicePixelRatio;
		this.properties.target.appendChild( this.canvas );

		this.resize();

		var debouncedResize = debounce( this.resize.bind( this ), 100 );
		window.addEventListener( 'resize', function( e  ){
			debouncedResize();
		}.bind( this ) );

	}

	Graph.prototype.resize = function() {

		this.canvas.width = this.properties.target.clientWidth * this.dpr;
		this.canvas.height = this.properties.target.clientHeight * this.dpr;

		this.refresh();

	}

	Graph.prototype.set = function( data ) {

		this.data = data;

		this.start = this.data[ 0 ].x;
		this.end = this.data[ this.data.length - 1 ].x;
		this.end *= 1;

		this.max = 0;
		this.min = Number.MAX_VALUE;

		this.data.forEach( ( v, i ) => {
			if( v.y < this.min ) this.min = v.y;
			if( v.y > this.max ) this.max = v.y;
		} );

		if( this.properties.baselines.length &&
			this.properties.baselines[ 0 ] > this.max ) {
			this.max = 	this.properties.baselines[ 0 ];
		}

		this.refresh();

	}

	function createAdjustFunction( min, max, size ) {

		return function adjust( v ) {

			return ( v - min ) * size / ( max - min );

		}

	}

	Graph.prototype.refresh = function() {

		if( !this.data.length ) return;

		var paddingTop = 5;

		var adjustX = createAdjustFunction( this.start, this.end, this.canvas.width );
		var adjustY = createAdjustFunction( this.max, 0, this.canvas.height - paddingTop );

		this.ctx.fillStyle = '#efefef'
		this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

		var path = new Path2D();

		var ovx = 0;
		var ovy = 0;
		this.data.forEach( ( v, i ) => {

			var vx = ~~( adjustX( v.x ) );
			var vy = paddingTop + adjustY( v.y );

			if( i === 0 ) {
				path.moveTo( vx, vy );
				ovx = vx;
				ovy = vy;
			} else {
				if( vx > ovx + 2 ) {
					var cpx = ovx + ( vx - ovx ) * .5;
					var cpy = ( vy < ovy ) ? vy : ovy;
					var cpy2 = ( vy < ovy ) ? ovy : vy;
					//path.lineTo( adjustX( ~~v.x ), adjustY( v.y ) );
					//path.quadraticCurveTo( cpx, cpy, vx, vy );
					path.bezierCurveTo( cpx, cpy, cpx, cpy2, vx, vy );
					ovx = vx;
					ovy = vy;
				}
			}

		} );

		var path2 = new Path2D( path );
		path2.lineTo( this.canvas.width, this.canvas.height );
		path2.lineTo( 0, this.canvas.height );

		this.ctx.fillStyle = this.properties.color;
		this.ctx.fill( path2 );

		this.ctx.translate( 0, 2 );
		this.ctx.lineWidth = 1.5;
		this.ctx.globalCompositeOperation = 'color-burn';
		this.ctx.strokeStyle = '#000000'
		this.ctx.globalAlpha = .1;
		this.ctx.stroke( path );

		this.ctx.translate( 0, -2 );

		if( this.properties.baselines.length ) {

			this.ctx.beginPath();
			this.ctx.lineWidth = 1;
			this.ctx.globalAlpha = .25;
			this.properties.baselines.forEach( baseline => {
				var y = paddingTop + adjustY( baseline );
				this.ctx.moveTo( 0, y );
				this.ctx.lineTo( this.canvas.width, y );
			} );
			this.ctx.stroke();

		}

		if( this.properties.baseline_range ) {

			this.ctx.beginPath();
			this.ctx.lineWidth = 1;
			this.ctx.globalAlpha = .25;
			var steps = ~~( this.max / this.properties.baseline_range );
			for( var j = 0; j < steps; j++ ) {
				var y = paddingTop + adjustY( j * this.properties.baseline_range );
				this.ctx.moveTo( 0, y );
				this.ctx.lineTo( this.canvas.width, y );
			}
			this.ctx.stroke();

		}

		this.ctx.globalAlpha = 1;
		this.ctx.globalCompositeOperation = 'source-over';

	}

	window.Graph = Graph;

})();

// baseline_range: n
// baselines: [ a, b, c... ]

var g = new Graph( {
	target: document.getElementById( 'framerate-div' ),
	color: '#d7f0d1',
	baselines: [ 30, 60, 90 ]
} );

var g2 = new Graph( {
	target: document.getElementById( 'gpu-div' ),
	color: '#f0c457',
	baselines: [ 16666666 ]
} );

var g3 = new Graph( {
	target: document.getElementById( 'js-div' ),
	color: '#9b7fe6',
	baselines: [ 1.6 ]
} );

var g4 = new Graph( {
	target: document.getElementById( 'drawcalls-div' ),
	color: '#9dc0ed',
	baseline_range: 200
} );

fetch( 'sample2.json' )
	.then( response => response.json() )
	.then( data => plot( data ) );

function plot( data ){

	var points = data.map( v => { return{ x: v.timestamp, y: v.framerate } } );
	g.set( points );

	var points2 = data.map( v => { return{ x: v.timestamp, y: v.disjointTime } } );
	g2.set( points2 );

	var points3 = data.map( v => { return{ x: v.timestamp, y: v.JavaScriptTime } } );
	g3.set( points3 );

	var points4 = data.map( v => { return{ x: v.timestamp, y: v.drawCount } } );
	g4.set( points4 );

}
