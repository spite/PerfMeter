(function() {

	"use strict";

	function throttle(fn, threshold, scope) {
	threshold || (threshold = 250);
	var last,
	deferTimer;
	return function () {
		var context = scope || this;

		var now = +new Date,
		args = arguments;
		if (last && now < last + threshold) {
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
}

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
		this.decorator = this.properties.decorator || ( v => v );

		this.data = [];
		this.start = 0;
		this.end = 0;
		this.paddingTop = 2;
		this.pivot = 0;
		this.lastPoint = 0;
		this.hOffset = 0;
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

		this.title = document.createElement( 'h1' );
		this.title.textContent = this.properties.title;
		this.properties.target.appendChild( this.title );

		this.label = document.createElement( 'div' );
		this.label.className = 'label hidden';
		this.properties.target.appendChild( this.label );

		this.overlayCanvas = document.createElement( 'canvas' );
		this.overlayCanvas.style.width = '100%';
		this.overlayCanvas.style.height = '100%';
		this.overlayCanvas.style.position = 'absolute';
		this.overlayCanvas.style.left = 0;
		this.overlayCanvas.style.top = 0;
		this.overlayCanvas.style.pointerEvents = 'none';

		this.overlayCtx = this.overlayCanvas.getContext( '2d' );
		this.properties.target.appendChild( this.overlayCanvas );

		this.linkIn = this.showLabel;
		this.linkOut = this.showLabel;
		this.linkOver = this.updatePoint;
		this.linkZoom = this.updateZoom;

		this.resize();

		this.zoom = 1;

		var debouncedResize = debounce( this.resize.bind( this ), 100 );
		window.addEventListener( 'resize', function( e  ){
			debouncedResize();
		}.bind( this ) );

		this.canvas.addEventListener( 'mouseover', e => {

			this.linkIn( e.pageX );
			this.linkOver( e.pageX );

		} );

		this.canvas.addEventListener( 'mouseout', e => {

			this.linkOut();

		} );

		this.canvas.addEventListener( 'mousemove', e => {

			this.linkOver( e.pageX );

		})

		var debouncedLinkZoom = throttle( z => this.linkZoom( z ), 20 );

		this.canvas.addEventListener( 'wheel', e => {

			debouncedLinkZoom( this.zoom + ( .005 * e.deltaY ) );
			e.preventDefault();

		} );

		this.animate();

	}

	Graph.link = function( graphs ) {

		graphs.forEach( g => {
			g.linkIn = x => { graphs.forEach( g => g.showLabel( true ) ); };
			g.linkOut = x => { graphs.forEach( g => g.showLabel( false ) ); };
			g.linkOver = x => { graphs.forEach( g => g.updatePoint( x ) ); };
			g.linkZoom = z => { graphs.forEach( g => g.updateZoom( z ) ); };
		} )

	}

	Graph.prototype.updateZoom = function( zoom ) {

		this.zoom = zoom;
		if( this.zoom > 1 ) this.zoom = 1;
		this.update();

	}

	Graph.prototype.showLabel = function( show ) {

		if( show ) {
			this.label.classList.remove( 'hidden' );
		} else {
			this.label.classList.add( 'hidden' );
			this.overlayCtx.clearRect( 0, 0, this.overlayCanvas.width, this.overlayCanvas.height );
		}

	}

	Graph.prototype.updatePoint = function( x ) {

		if( x === undefined ) x = this.lastPoint;
		this.lastPoint = x;

		if( this.data.length === 0 ) return;

		var res = this.updateLabelPosition( x );
		var pos = res.x * ( this.end - this.start ) / res.width + this.start;
		this.pivot = res.x / res.width;
		var y = ( this.data.find( v => v.x >= pos ) ).y;
		this.label.textContent = this.decorator( y );
		y = ( this.canvas.clientHeight - this.paddingTop ) * this.dpr * ( 1 - ( y / this.max ) ) + this.paddingTop * this.dpr;

		var x = res.x * this.dpr;

		this.overlayCtx.clearRect( 0, 0, this.overlayCanvas.width, this.overlayCanvas.height );
		this.overlayCtx.globalCompositeOperation = 'color-burn';
		this.overlayCtx.strokeStyle = '#000000'
		this.overlayCtx.globalAlpha = .5;
		this.overlayCtx.lineWidth = 2;

		this.overlayCtx.setLineDash( [] )
		this.overlayCtx.beginPath();
		this.overlayCtx.arc( x, y, 4, 0, 2 * Math.PI );
		this.overlayCtx.stroke();

		this.overlayCtx.setLineDash( [ 2, 4 ] )
		this.overlayCtx.beginPath();
		this.overlayCtx.moveTo( x, this.overlayCanvas.height );
		this.overlayCtx.lineTo( x, y + 3 );
		this.overlayCtx.stroke();

	}

	Graph.prototype.animate = function() {

		if( this.invalidate ) {
			this.draw();
			this.invalidate = false;
		}

		requestAnimationFrame( this.animate.bind( this ) );

	}

	Graph.prototype.updateLabelPosition = function( x ) {

		var divRect = this.canvas.getBoundingClientRect();
		var canvasRect = this.canvas.getBoundingClientRect();
		var x = x - canvasRect.left;
		if( x < .5 * this.canvas.clientWidth ) {
			this.label.classList.remove( 'flip' );
			this.label.style.transform = `translate3d(${x}px,0,0)`;
			this.title.classList.add( 'flip' );
		} else {
			this.label.classList.add( 'flip' );
			this.label.style.transform = `translate3d(${-(this.canvas.clientWidth-x)}px,0,0)`;
			this.title.classList.remove( 'flip' );
		}
		return { x: x, width: canvasRect.width };

	}

	Graph.prototype.resize = function() {

		this.canvas.width = this.properties.target.clientWidth * this.dpr;
		this.canvas.height = this.properties.target.clientHeight * this.dpr;

		this.overlayCanvas.width = this.canvas.width;
		this.overlayCanvas.height = this.canvas.height;

		this.invalidate = true;

	}

	Graph.prototype.set = function( data ) {

		this.data = data;
		this.update();
		this.updatePath();

	}

	Graph.prototype.update = function() {

		if( this.data.length === 0 ) return;

		if( this.zoom > 1 ) this.zoom = 1;
		if( this.zoom < .1 ) this.zoom = .1;

		var first = this.data[ 0 ].x;
		var last = this.data[ this.data.length - 1 ].x;
		var w = last - first;
		this.start = first + this.pivot * w - this.pivot * this.zoom * w;
		this.end = first + ( this.pivot + ( 1 - this.pivot ) * this.zoom ) * w;

		this.max = 0;
		this.min = Number.MAX_VALUE;

		this.data.forEach( ( v, i ) => {
			if( v.x >= this.start && v.x <= this.end ) {
				if( v.y < this.min ) this.min = v.y;
				if( v.y > this.max ) this.max = v.y;
			}
		} );

		if( this.properties.baselines.length &&
			this.properties.baselines[ 0 ] > this.max ) {
			this.max = this.properties.baselines[ 0 ];
		}

		this.invalidate = true;
		this.updatePoint();

	}

	function createAdjustFunction( min, max, size ) {

		return function adjust( v ) {

			return ( v - min ) * size / ( max - min );

		}

	}

	Graph.prototype.updatePath = function() {

		this.path = new Path2D();

		var ovx = 0;
		var ovy = 0;
		var start = this.data[ 0 ].x;

		this.data.forEach( ( v, i ) => {

			var vx = v.x - start;
			var vy = v.y / this.max;

			if( i === 0 ) {
				this.path.moveTo( vx, vy );
				ovx = vx;
				ovy = vy;
			} else {
				var cpx = ovx + ( vx - ovx ) * .5;
				var cpy1 = ( vy < ovy ) ? vy : ovy;
				var cpy2 = ( vy < ovy ) ? ovy : vy;
				//path.lineTo( this.adjustX( ~~v.x ), this.adjustY( v.y ) );
				this.path.bezierCurveTo( cpx, cpy1, cpx, cpy2, vx, vy );
				ovx = vx;
				ovy = vy;
			}

		} );

		this.path2 = new Path2D( this.path );
		this.path2.lineTo( this.data[ this.data.length - 1 ].x - start, 0 );
		this.path2.lineTo( 0, 0 );

	}

	Graph.prototype.draw = function() {

		if( !this.data.length ) return;

		this.ctx.save();

		this.adjustX = createAdjustFunction( this.start, this.end, this.canvas.width );
		this.adjustY = createAdjustFunction( this.max, 0, this.canvas.height - this.paddingTop );

		this.ctx.fillStyle = '#efefef'
		this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

		var zoom = this.zoom * ( this.end - this.start ) / this.canvas.width;
		var h = ( this.canvas.clientHeight - this.paddingTop ) * this.dpr;
		this.ctx.translate( this.hOffset, h + this.paddingTop * this.dpr );
		this.ctx.scale( 1 / zoom, -h );

		this.ctx.lineWidth = 1 / h;
		this.ctx.stroke( this.path );

		this.ctx.fillStyle = this.properties.color;
		this.ctx.fill( this.path2 );

		/*this.ctx.translate( 0, 2 );
		this.ctx.lineWidth = 1.5;
		this.ctx.globalCompositeOperation = 'color-burn';
		this.ctx.strokeStyle = '#000000'
		this.ctx.globalAlpha = .1;
		this.ctx.stroke( this.path );

		this.ctx.translate( 0, -2 );*/

		/*if( this.properties.baselines.length ) {

			this.ctx.beginPath();
			this.ctx.lineWidth = 1;
			this.ctx.globalAlpha = .25;
			this.properties.baselines.forEach( baseline => {
				var y = this.paddingTop + this.adjustY( baseline );
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
				var y = this.paddingTop + this.adjustY( j * this.properties.baseline_range );
				this.ctx.moveTo( 0, y );
				this.ctx.lineTo( this.canvas.width, y );
			}
			this.ctx.stroke();

		}*/

		this.ctx.restore();

	}

	window.Graph = Graph;

})();
