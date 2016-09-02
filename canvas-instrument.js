'use strict'

var verbose = false;

if( !window.__PerfMeterInstrumented ) {

	window.__PerfMeterInstrumented = true;

	function log() {

		console.log.apply(
			console, [
				`%c PerfMeter `,
				'background: #1E9433; color: #ffffff; text-shadow: 0 -1px #000; padding: 4px 0 4px 0; line-height: 0',
				...arguments
			]
		);

	}

	log( 'Canvas Instrumentation', document.location.href, settings );

	var instrumented = false;

	var glInfo = {
		versions: [],
		WebGLAvailable: 'WebGLRenderingContext' in window,
		WebGL2Available: 'WebGL2RenderingContext' in window
	};

	function getGLInfo( context ) {
		var gl = document.createElement( 'canvas' ).getContext( context );
		if( !gl ) return;
		var debugInfo = gl.getExtension( 'WEBGL_debug_renderer_info' );
		var version = {
			type: context,
			vendor: gl.getParameter( debugInfo.UNMASKED_VENDOR_WEBGL ),
			renderer: gl.getParameter( debugInfo.UNMASKED_RENDERER_WEBGL ),
			glVersion: gl.getParameter( gl.VERSION ),
			glslVersion: gl.getParameter( gl.SHADING_LANGUAGE_VERSION )
		}
		glInfo.versions.push( version );
	}

	getGLInfo( 'webgl' );
	getGLInfo( 'webgl2' );

	var webGLInfo = '';
	glInfo.versions.forEach( v => {
		var glInfo = `GL Version: ${v.glVersion}
GLSL Version: ${v.glslVersion}
Vendor: ${v.vendor}
Renderer: ${v.renderer}
`;
		webGLInfo += glInfo;
	} )

	function post( msg ) {

		msg.source = 'perfmeter-script';
		window.postMessage( msg, '*' );

	}

	post( { method: 'ready' } );

	function getTime(){

		return performance.now();

	}

	var text = document.createElement( 'div' );
	text.setAttribute( 'id', 'perfmeter-panel' );

	function _h ( f, pre, post ) {
		return function () {
			var args = pre.apply( this, arguments ) || arguments;
			var res = f.apply( this, args );
			var r;
			return post ? ( r = post.apply( this, [ res, args ] ), r ? r : res ) : res;
		};
	}

	var contexts = new Map();

	HTMLCanvasElement.prototype.getContext = _h( HTMLCanvasElement.prototype.getContext,
		function() {
			this.style.border = '1px solid #9EFD38';
			this.style.boxSizing = 'border-box';

			log( 'getContext', arguments );
		},
		function( res, args ) {

			if( !res ) return;

			var ctx = {
				ctx: res,
				type: '2d',
				queryExt: null,
				queries: [],
				frames: {},
				programCount: 0,
				textureCount: 0,
				frameBufferCount: 0,
				disjointTime: 0,
				drawCount: 0,
				instancedDrawCount: 0,
				pointCount: 0,
				lineCount: 0,
				triangleCount: 0,
				useProgramCount: 0,
				bindTextureCount: 0,
				JavaScriptTime: 0,
				points: 0,
				lines: 0,
				triangles: 0,
				log: []
			}

			contexts.set( res, ctx );

			if( [ 'webgl', 'experimental-webgl', 'webgl2', 'experimental-webgl2' ].some( id => id == args[ 0 ] ) ) {

				ctx.type = '3d';

				var queryExt = res.getExtension( 'EXT_disjoint_timer_query' );
				if( queryExt ) {
					ctx.queryExt = queryExt;
				}
			}

			instrumentCanvas();

		}
	);

	function updateDrawCount( gl, ctx, mode, count ) {

		switch( mode ){
			case gl.POINTS:
				ctx.points += count;
				break;
			case gl.LINE_STRIP:
				ctx.lines += count - 1;
				break;
			case gl.LINE_LOOP:
				ctx.lines += count;
				break;
			case gl.LINES:
				ctx.lines += count / 2;
				break;
			case gl.TRIANGLE_STRIP:
			case gl.TRIANGLE_FAN:
				ctx.triangles += count - 2;
				break;
			case gl.TRIANGLES:
				ctx.triangles += count / 3;
				break;
		}

	}

	function instrumentContext( proto ) {

		var drawElements = proto.prototype.drawElements;
		proto.prototype.drawElements = function() {

			var ctx = contexts.get( this );

			ctx.drawCount ++;

			updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 1 ] );

			return drawElements.apply( this, arguments );

		}

		var drawArrays = proto.prototype.drawArrays;
		proto.prototype.drawArrays = function() {

			var ctx = contexts.get( this );

			ctx.drawCount ++;

			updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 2 ] );

			return drawArrays.apply( this, arguments );

		}

		var useProgram = proto.prototype.useProgram;
		proto.prototype.useProgram = function() {

			contexts.get( this ).useProgramCount++;
			return useProgram.apply( this, arguments );

		}

		var bindTexture = proto.prototype.bindTexture;
		proto.prototype.bindTexture = function() {

			if( arguments[ 0 ] !== null ) contexts.get( this ).bindTextureCount++;

			return bindTexture.apply( this, arguments );

		}

		var createProgram = proto.prototype.createProgram;
		proto.prototype.createProgram = function() {

			contexts.get( this ).programCount++;
			return createProgram.apply( this, arguments );

		}

		var deleteProgram = proto.prototype.deleteProgram;
		proto.prototype.deleteProgram = function() {

			contexts.get( this ).programCount--;
			return deleteProgram.apply( this, arguments );

		}

		var createTexture = proto.prototype.createTexture;
		proto.prototype.createTexture = function() {

			contexts.get( this ).textureCount++;
			return createTexture.apply( this, arguments );

		}

		var deleteTexture = proto.prototype.deleteTexture;
		proto.prototype.deleteTexture = function() {

			contexts.get( this ).textureCount--;
			return deleteTexture.apply( this, arguments );

		}

		for( var j in proto.prototype ) {
			try {
				if( typeof proto.prototype[ j ] === 'function' ){
					( function( id ) {
						var fn = j;
						var time;
						proto.prototype[ fn ] = _h(
							proto.prototype[ fn ],
							function() {
								time = getTime();
							},
							function() {
								if( settings.logOperations ) contexts.get( this ).log.push( fn );
								contexts.get( this ).JavaScriptTime += getTime() - time;
							}
							);
					})( j );

				}
			} catch( e ) {
			//console.log( j );
			}
		}

	}

	function instrumentCanvas() {

		if( instrumented ) return;

		instrumented = true;

		var fileref = document.createElement("link");
		fileref.rel = "stylesheet";
		fileref.type = "text/css";
		fileref.href = settings.cssPath;

		window.document.getElementsByTagName("head")[0].appendChild(fileref)

		if( !window.document.body ) {
			window.addEventListener( 'load', function() {
				window.document.body.appendChild( text );
			} );
		} else {
			window.document.body.appendChild( text );
		}

		instrumentContext( CanvasRenderingContext2D );
		instrumentContext( WebGLRenderingContext );
		if( glInfo.WebGL2Available ) instrumentContext( WebGL2RenderingContext );

		originalRAF( process );

	}

	// WebGL with ANGLE_instanced_arrays Extension
	// There isn't an available ANGLEInstancedArrays constructor
	// This way feels hacky

	var getExtension = WebGLRenderingContext.prototype.getExtension;
	WebGLRenderingContext.prototype.getExtension = function() {

		log( 'Extension', arguments[ 0 ] );
		var res = getExtension.apply( this, arguments );
		var gl = this;
		var ctx = contexts.get( gl );

		if( arguments[ 0 ] === 'ANGLE_instanced_arrays' ){

			var drawArraysInstancedANGLE = res.drawArraysInstancedANGLE;
			res.drawArraysInstancedANGLE = function() {

				ctx.instancedDrawCount++;
				updateDrawCount( gl, ctx, arguments[ 0 ], arguments[ 2 ] );
				return drawArraysInstancedANGLE.apply( this, arguments );

			}

			var drawElementsInstancedANGLE = res.drawElementsInstancedANGLE;
			res.drawElementsInstancedANGLE = function() {

				ctx.instancedDrawCount++;
				updateDrawCount( gl, ctx, arguments[ 0 ], arguments[ 1 ] );
				return drawElementsInstancedANGLE.apply( this, arguments );

			}

		}

		return res;

	}

	// WebGL2

	if( glInfo.WebGL2Available ) {

		var drawElementsInstanced = WebGL2RenderingContext.prototype.drawElementsInstanced;
		WebGL2RenderingContext.prototype.drawElementsInstanced = function() {

			var ctx = contexts.get( this );
			ctx.instancedDrawCount ++;
			updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 1 ] );
			return drawElementsInstanced.apply( this, arguments );

		}

		var drawArraysInstanced = WebGL2RenderingContext.prototype.drawArraysInstanced;
		WebGL2RenderingContext.prototype.drawArraysInstanced = function() {

			var ctx = contexts.get( this );
			ctx.instancedDrawCount ++;
			updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 2 ] );
			return drawArraysInstanced.apply( this, arguments );

		}

	}

	/*var methods = [
		'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv',
		'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv',
		'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv',
		'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv',
		'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'
	];

	methods.forEach( function( f ) {

		var prev = WebGLRenderingContext.prototype[ f ];
		WebGLRenderingContext.prototype[ f ] = function() {

			//post( { method: f } );
			return prev.apply( this, arguments );

		}

	} );*/

	var originalRAF = requestAnimationFrame;
	var rAFs = [];
	var oTime = getTime();
	var frames = 0;
	var lastTime = getTime();
	var startTime = getTime();
	var frameId = 0;

	var framerate = 0;
	var JavaScriptTime = 0;
	var disjointFrames = {};
	var frameTime = 0;
	var rAFCount = 0;

	window.requestAnimationFrame = function( c ) {

		if( typeof c === 'function' ) rAFs.push( c ); // some pages pass null (?)

	}

	function process( timestamp ) {

		originalRAF( process );

		rAFCount = rAFs.length
		//rAFValues.push( getTime() - oTime );
		oTime = getTime();

		disjointFrames[ frameId ] = { time: 0, queries: 0 };
		disjointTime = 0;

		contexts.forEach( function( context, id ) {

			var queryExt = context.queryExt,
			gl = context.ctx;

			if( queryExt ) {

				context.queries.forEach( function( q, i ) {
					var query = q.query;
					var available = queryExt.getQueryObjectEXT( query, queryExt.QUERY_RESULT_AVAILABLE_EXT );
					var disjoint = gl.getParameter( queryExt.GPU_DISJOINT_EXT );
					if( available && !disjoint ) {
						var timeElapsed = queryExt.getQueryObjectEXT( query, queryExt.QUERY_RESULT_EXT );
						context.queries.splice( i, 1 );
						disjointFrames[ q.frameId ].time += timeElapsed;
						disjointFrames[ q.frameId ].queries--;
						if( disjointFrames[ q.frameId ].queries === 0 ) {
							//extValues.push( disjointFrames[ q.frameId ].time );
							context.disjointTime += disjointFrames[ q.frameId ].time;
							disjointFrames[ q.frameId ] = null;
							delete disjointFrames[ q.frameId ];
						}
					}
				} )

				var query = queryExt.createQueryEXT();
				queryExt.beginQueryEXT( queryExt.TIME_ELAPSED_EXT, query );
				context.queries.push( { frameId: frameId, query: query } );
				disjointFrames[ frameId ].queries++;

			}

			//console.log( context.queries.length );

		} );

		JavaScriptTime = 0;
		var s = getTime();
		var rAFQueue = rAFs.slice();
		rAFs = [];
		rAFQueue.forEach( function( c, i ) {
			c( timestamp );
		} );
		JavaScriptTime = getTime() - s;

		contexts.forEach( function( context ) {
			var queryExt = context.queryExt;
			if( queryExt ) {
				queryExt.endQueryEXT( queryExt.TIME_ELAPSED_EXT );
			}
		} );

		frames++;
		if( getTime() > lastTime + 1000 ) {
			framerate = frames * 1000 / ( getTime() - lastTime );
			//frameValues.push( frames * 1000 / ( getTime() - lastTime ) );
			frames = 0;
			lastTime = getTime();
		}

		frameId++;

		/*if( useProgramCount === 0 ) {
			contexts.forEach( gl => {
				var res = gl.getParameter( gl.CURRENT_PROGRAM );
				debugger;
			} )
		}*/

		frameTime = getTime() - oTime;

		update();

		contexts.forEach( function( context ) {
			context.useProgramCount = 0;
			context.drawCount = 0;
			context.instancedDrawCount = 0;
			context.bindTextureCount = 0;
			context.JavaScriptTime = 0;
			context.disjointTime = 0;
			context.points = 0;
			context.lines = 0;
			context.triangles = 0;
			context.log = []
		} );

	}

	function update(){

		if( contexts.size === 0 ) return;

		var drawCount = 0;
		var instancedDrawCount = 0;
		var JavaScriptTime = 0;
		var disjointTime = 0;
		var useProgramCount = 0;
		var bindTextureCount = 0;
		var hasWebGL = false;
		var totalPoints = 0;
		var totalLines = 0;
		var totalTriangles = 0;
		var programCount = 0;
		var textureCount = 0;

		contexts.forEach( function( context ) {
			drawCount += context.drawCount;
			instancedDrawCount += context.instancedDrawCount;
			JavaScriptTime += context.JavaScriptTime;
			disjointTime += context.disjointTime;
			useProgramCount += context.useProgramCount;
			bindTextureCount += context.bindTextureCount;
			totalPoints += context.points;
			totalLines += context.lines;
			totalTriangles += context.triangles;
			programCount += context.programCount;
			textureCount += context.textureCount;
			if( context.type === '3d' ) hasWebGL = true;
		} );

		var totalDrawCount = drawCount + instancedDrawCount;

		var general = `FPS: ${framerate.toFixed( 2 )}
Frame JS Time: ${frameTime.toFixed(2)}
Canvas: ${contexts.size}
Canvas JS time: ${JavaScriptTime.toFixed( 2 )}
`

		var webgl = `<b>WebGL</b>
GPU Time: ${( disjointTime / 1000000 ).toFixed( 2 )}
programs: ${programCount}
textures: ${textureCount}
useProgram: ${useProgramCount}
bindTexture: ${bindTextureCount}
Draw: ${drawCount}
Instanced: ${instancedDrawCount}
Total: ${totalDrawCount}
Points: ${totalPoints}
Lines: ${totalLines}
Triangles: ${totalTriangles}
`

		var browser = `<b>Browser</b>
Mem: ${(performance.memory.usedJSHeapSize/(1024*1024)).toFixed(2)}/${(performance.memory.totalJSHeapSize/(1024*1024)).toFixed(2)}
`;

		text.innerHTML = general + ( hasWebGL ? webgl : '' ) + browser + webGLInfo;

	}

} else {
	if( verbose ) log( 'Already instrumented. Skipping', document.location.href )
}
