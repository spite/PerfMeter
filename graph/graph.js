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

	function colorLuminance(hex, lum) {

		// validate hex string
		hex = String(hex).replace(/[^0-9a-f]/gi, '');
		if (hex.length < 6) {
			hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
		}
		lum = lum || 0;

		// convert to decimal and change luminosity
		var rgb = "#", c, i;
		for (i = 0; i < 3; i++) {
			c = parseInt(hex.substr(i*2,2), 16);
			c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
			rgb += ("00"+c).substr(c.length);
		}

		return rgb;
	}

	function Line( color ) {

		this.data = [];
		this.linePath = new Path2D();
		this.solidPath = new Path2D();

		this.color = color;
		this.secondaryColor = colorLuminance( color, -.25  )

	}

	Line.prototype.set = function( data ) {

		this.data = data;
		this.updatePath();

	}

	Line.prototype.updatePath = function() {

		this.linePath = new Path2D();

		var ovx = 0;
		var ovy = 0;
		var start = this.data[ 0 ].x;

		this.data.forEach( ( v, i ) => {

			var vx = v.x - start;
			var vy = v.y;

			if( i === 0 ) {
				this.linePath.moveTo( vx, vy );
				ovx = vx;
				ovy = vy;
			} else {
				var cpx = ovx + ( vx - ovx ) * .5;
				var cpy1 = ( vy < ovy ) ? vy : ovy;
				var cpy2 = ( vy < ovy ) ? ovy : vy;
				this.linePath.bezierCurveTo( cpx, cpy1, cpx, cpy2, vx, vy );
				ovx = vx;
				ovy = vy;
			}

		} );

		this.solidPath = new Path2D( this.linePath );

		this.solidPath.lineTo( this.data[ this.data.length - 1 ].x - start, 0 );
		this.solidPath.lineTo( 0, 0 );

	}


	function Graph( properties ) {

		this.lines = [];

		this.properties = properties;

		this.properties.baselines = this.properties.baselines || [];
		this.decorator = this.properties.decorator || ( v => v );

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

			debouncedLinkZoom( this.zoom - ( .05 * e.deltaY ) );
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
		if( this.zoom < 1 ) this.zoom = 1;
		this.zoom = 1;
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

		return;
		if( x === undefined ) x = this.lastPoint;
		this.lastPoint = x;

		if( this.line.data.length === 0 ) return;

		var res = this.updateLabelPosition( x );
		var pos = res.x * ( this.last - this.first ) / res.width + this.first;
		this.pivot = res.x / res.width;
		this.lines.forEach( line => {
			var y = ( line.data.find( v => v.x >= pos ) ).y;
			this.label.textContent = this.decorator( y );
			y = ( this.canvas.clientHeight - this.paddingTop ) * this.dpr * ( 1 - ( y / this.max ) ) + this.paddingTop * this.dpr;
		} );

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

		this.invalidate = true;

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

		//this.lines = new Line( properties.color );
		//this.line.set( data );
		if( !Array.isArray( data ) ) data = [ data ];
		data.forEach( d => {
			var line = new Line( d.color );
			line.set( d.samples );
			this.lines.push( line );
		} );

		this.update();

	}

	Graph.prototype.update = function() {

		if( this.lines[ 0 ].data.length === 0 ) return;

		//if( this.zoom > 1 ) this.zoom = 1;
		//if( this.zoom < .1 ) this.zoom = .1;

		var data = this.lines[ 0 ].data;

		var first = data[ 0 ].x;
		var last = data[ data.length - 1 ].x;
		this.first = first;
		this.last = last;
		var w = last - first;
		this.start = this.first;// - this.pivot * w / this.zoom;
		this.end = this.last;// + ( 1 - this.pivot ) * w / this.zoom;

		this.max = 0;
		this.min = Number.MAX_VALUE;

		data.forEach( ( v, i ) => {
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

	Graph.prototype.draw = function() {

		this.ctx.save();

		this.ctx.fillStyle = '#efefef'
		this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

		var p = this.pivot;
		var w = this.end - this.start;
		var h = ( this.canvas.clientHeight - this.paddingTop ) * this.dpr;
		this.ctx.scale( this.canvas.width / w, 1 );
		this.ctx.translate( 0, h + this.paddingTop * this.dpr );
		//this.ctx.translate( this.start, 0 );
		this.ctx.scale( this.zoom, -h / this.max );
		//this.ctx.translate( p * -w, 0 );

		var border = 1;
		var step = border;
		this.lines.forEach( line => {

			if( this.lines.length == 1 ) {

				this.ctx.fillStyle = line.secondaryColor;
				this.ctx.fill( line.solidPath );
				this.ctx.translate( - step, 0 );
				this.ctx.fill( line.solidPath );
				this.ctx.translate( 2 * step, 0 );
				this.ctx.fill( line.solidPath );
				this.ctx.translate( - step, 0 );

				this.ctx.translate( 0, - border / this.canvas.height );
				this.ctx.fillStyle = line.color;
				this.ctx.fill( line.solidPath );
				this.ctx.translate( 0, border / this.canvas.height );

			} else {

				this.ctx.lineWidth = 1;
				this.ctx.strokeStyle = line.color;
				this.ctx.stroke( line.linePath );
				this.ctx.translate( - step, 0 );
				this.ctx.stroke( line.linePath );
				this.ctx.translate( 2 * step, 0 );
				this.ctx.stroke( line.linePath );
				this.ctx.translate( - step, 0 );

			}

		} );

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
