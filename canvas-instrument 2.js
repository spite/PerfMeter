"use strict";

var verbose = false;

if( !window.__PerfMeterInstrumented ) {

	window.__PerfMeterInstrumented = true;

	window.__PerfMeterSettings = function( s ) {
		settings = s;
	};

	var recording = false;

	window.__PerfMeterStartRecording = function() {

		recording = true;

	};

	window.__PerfMeterStopRecording = function() {

		recording = false;

	};

	log( 'Canvas Instrumentation', document.location.href, settings );

	var instrumented = false;

	var glInfo = {
		versions: [],
		WebGLAvailable: 'WebGLRenderingContext' in window,
		WebGL2Available: 'WebGL2RenderingContext' in window
	};

	var getGLInfo = function( context ) {
		var gl = document.createElement( 'canvas' ).getContext( context );
		if( !gl ) return;
		var debugInfo = gl.getExtension( 'WEBGL_debug_renderer_info' );
		var version = {
			type: context,
			vendor: gl.getParameter( debugInfo.UNMASKED_VENDOR_WEBGL ),
			renderer: gl.getParameter( debugInfo.UNMASKED_RENDERER_WEBGL ),
			glVersion: gl.getParameter( gl.VERSION ),
			glslVersion: gl.getParameter( gl.SHADING_LANGUAGE_VERSION )
		};
		glInfo.versions.push( version );
	};

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
	} );



	post( { method: 'ready' } );

	var getTime = function(){

		return performance.now();

	};

	var text = document.createElement( 'div' );
	text.setAttribute( 'id', 'perfmeter-panel' );

	var _wrap = function( f, pre, post ) {

		return function _wrap() {

			var args = [ ...arguments ];
			args = pre.call( this, args ) || args;
			var res = f.apply( this, args );
			var r;
			return post ? ( r = post.apply( this, [ res, args ] ), r ? r : res ) : res;

		};

	};

	/*function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
	}*/
	var guid = ( function() {
		var counter = 0;
		return function() {
			counter++;
			return counter;
		}
	} )();

	var contexts = new Map();
	var allCanvasAre2D = true;

	HTMLCanvasElement.prototype.getContext = _wrap(
	    HTMLCanvasElement.prototype.getContext,
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
				queries: new Map(),
				frames: {},
				programCount: 0,
				textureCount: 0,
				frameBufferCount: 0,
				disjointTime: 0,
				drawCount: 0,
				instancedDrawCount: 0,
				instanceCount: 0,
				pointCount: 0,
				lineCount: 0,
				triangleCount: 0,
				useProgramCount: 0,
				bindTextureCount: 0,
				JavaScriptTime: 0,
				points: 0,
				lines: 0,
				triangles: 0,
				log: [],
				programs: new Map(),
				timerQueries: [],
				currentQuery: null,
				nestedQueries: new Map(),
				allQueries: {}
			};

			contexts.set( res, ctx );

			if( [ 'webgl', 'experimental-webgl', 'webgl2', 'experimental-webgl2' ].some( id => id == args[ 0 ] ) ) {

				allCanvasAre2D = false;
				ctx.type = '3d';

				var queryExt = res.getExtension( 'EXT_disjoint_timer_query' );
				if( queryExt ) {
					ctx.queryExt = queryExt;
				}
			}

			instrumentCanvas();

		}
	);

	var updateDrawCount = function( gl, ctx, mode, count ) {

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

	};

	var instrumentContext = function( proto ) {

		proto.prototype.drawElements = _wrap(
			proto.prototype.drawElements,
			function _preDrawElements() {
				var ctx = contexts.get( this );
				ctx.drawCount ++;
				updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 1 ] );
				//log( 'DrawElements start query' );
				//var query = ctx.queryExt.createQueryEXT();
				//ctx.queryExt.beginQueryEXT( ctx.queryExt.TIME_ELAPSED_EXT, query );
			},
			function _postDrawElements() {
				//log( 'DrawElements end query' );
				//var ctx = contexts.get( this );
				//ctx.queryExt.endQueryEXT( ctx.queryExt.TIME_ELAPSED_EXT );
			}
		);

		proto.prototype.drawArrays = _wrap(
			proto.prototype.drawArrays,
			function _preDrawArrays() {
				var ctx = contexts.get( this );
				ctx.drawCount ++;
				updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 1 ] );
				//log( 'DrawArrays start query' );
				//var query = ctx.queryExt.createQueryEXT();
				//ctx.queryExt.beginQueryEXT( ctx.queryExt.TIME_ELAPSED_EXT, query );
			},
			function _postDrawArrays() {
				//log( 'DrawArrays end query' );
				//var ctx = contexts.get( this );
				//ctx.queryExt.endQueryEXT( ctx.queryExt.TIME_ELAPSED_EXT );
			}
		);

		var useProgram = proto.prototype.useProgram;
		proto.prototype.useProgram = function() {

			var ctx = contexts.get( this );
			ctx.useProgramCount++;
			ctx.programs.get( arguments[ 0 ] ).calls++;
			return useProgram.apply( this, arguments );

		};

		var bindTexture = proto.prototype.bindTexture;
		proto.prototype.bindTexture = function() {

			if( arguments[ 0 ] !== null ) contexts.get( this ).bindTextureCount++;

			return bindTexture.apply( this, arguments );

		};

		var createProgram = proto.prototype.createProgram;
		proto.prototype.createProgram = function() {

			var ctx = contexts.get( this );
			ctx.programCount++;
			var res = createProgram.apply( this, arguments );
			ctx.programs.set( res, { queries: [], calls: 0 } );
			return res;

		};

		var deleteProgram = proto.prototype.deleteProgram;
		proto.prototype.deleteProgram = function() {

			contexts.get( this ).programCount--;
			return deleteProgram.apply( this, arguments );

		};

		var createTexture = proto.prototype.createTexture;
		proto.prototype.createTexture = function() {

			contexts.get( this ).textureCount++;
			return createTexture.apply( this, arguments );

		};

		var deleteTexture = proto.prototype.deleteTexture;
		proto.prototype.deleteTexture = function() {

			contexts.get( this ).textureCount--;
			return deleteTexture.apply( this, arguments );

		};

		Object.keys( proto.prototype ).filter( v => {
			try{
				if( typeof proto.prototype[ v ] === 'function' ) return true;
			} catch( e ) {
			}
			return false;
		} ).forEach( fn => {
			var startTime;
			proto.prototype[ fn ] = _wrap(
				proto.prototype[ fn ],
				function _pre() {
					startTime = getTime();
					//log( fn );
				},
				function _post() {
					var ctx = contexts.get( this );
					var endTime = getTime();
					if( settings.log ) ctx.log.push( [ startTime, endTime, fn, endTime - startTime ] );
					ctx.JavaScriptTime += endTime - startTime;
					//log( fn, ctx.JavaScriptTime );
				}
			);
		} );

	};

	var instrumentCanvas = function() {

		if( instrumented ) return;

		instrumented = true;

		var fileref = document.createElement("link");
		fileref.rel = "stylesheet";
		fileref.type = "text/css";
		fileref.href = settings.cssPath;

		window.document.getElementsByTagName("head")[0].appendChild(fileref);

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

	};

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
				ctx.instanceCount += arguments[ 3 ];
				updateDrawCount( gl, ctx, arguments[ 0 ], arguments[ 2 ] );
				return drawArraysInstancedANGLE.apply( this, arguments );

			};

			var drawElementsInstancedANGLE = res.drawElementsInstancedANGLE;
			res.drawElementsInstancedANGLE = function() {

				ctx.instancedDrawCount++;
				ctx.instanceCount += arguments[ 4 ];
				updateDrawCount( gl, ctx, arguments[ 0 ], arguments[ 1 ] );
				return drawElementsInstancedANGLE.apply( this, arguments );

			};

		}

		if( arguments[ 0 ] === 'EXT_disjoint_timer_query' ) {

			var createQueryEXT = res.createQueryEXT;
			var beginQueryEXT = res.beginQueryEXT;
			var endQueryEXT = res.endQueryEXT;
			var getQueryObjectEXT = res.getQueryObjectEXT;

			var n = {
				GPU_DISJOINT_EXT: res.GPU_DISJOINT_EXT,
				CURRENT_QUERY_EXT: res.CURRENT_QUERY_EXT,
				QUERY_COUNTER_BITS_EXT: res.QUERY_COUNTER_BITS_EXT,
				QUERY_RESULT_AVAILABLE_EXT: res.QUERY_RESULT_AVAILABLE_EXT,
				QUERY_RESULT_EXT: res.QUERY_RESULT_EXT,
				TIMESTAMP_EXT: res.TIMESTAMP_EXT,
				TIME_ELAPSED_EXT: res.TIME_ELAPSED_EXT
			};

			n.createQueryEXT = function() {

				var createRes = createQueryEXT.apply( res, arguments );
				createRes.guid = guid();
				createRes.originalQuery = null;
				ctx.nestedQueries.set( createRes, [] );
				ctx.allQueries[ createRes.guid ] = createRes;
				log( 'New', createRes.guid );
				return createRes;
			}

			// ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
			n.beginQueryEXT = function() {

				if( arguments[ 0 ] === res.TIME_ELAPSED_EXT ){
					if( ctx.currentQuery ) {
						ctx.nestedQueries.get( ctx.currentQuery ).push( arguments[ 1 ] );
						log( 'Ending', ctx.currentQuery.guid, 'because', arguments[ 1 ].guid, 'begins' );
						endQueryEXT.apply( res, [ res.TIME_ELAPSED_EXT ] );
					}
					arguments[ 1 ].originalQuery = ctx.currentQuery;
					ctx.currentQuery = arguments[ 1 ];
				}
				log( 'Begin', arguments[ 1 ].guid );
				return beginQueryEXT.apply( res, arguments );
			}

			// ext.endQueryEXT( ext.TIME_ELAPSED_EXT );
			n.endQueryEXT = function() {

				log( 'End', ctx.currentQuery.guid, ctx.currentQuery.originalQuery );
				var endRes = endQueryEXT.apply( res, arguments );
				if( arguments[ 0 ] === res.TIME_ELAPSED_EXT ){
					if( ctx.currentQuery.originalQuery ) {
						var newQuery = createQueryEXT.apply( res );
						newQuery.guid = guid();
						newQuery.originalQuery = ctx.currentQuery.originalQuery;
						beginQueryEXT.apply( res, [ res.TIME_ELAPSED_EXT, newQuery ] );
						ctx.currentQuery = newQuery;
						log( 'Starting', newQuery.guid, 'on behalf of', newQuery.originalQuery.guid );
						ctx.nestedQueries.set( newQuery, [] );
						ctx.nestedQueries.get( newQuery.originalQuery ).push( newQuery );
						newQuery.originalQuery = newQuery.originalQuery.originalQuery
					} else {
						ctx.currentQuery = null;
					}
				}
				return endRes;
			}

			function extractNestedQueries( collection ) {
				if( !collection || collection.length === 0 ) return [];
				return collection.filter( c => {
					return extractNestedQueries( ctx.nestedQueries.get( c ) );
				} );
			}
			// queryExt.getQueryObjectEXT( query, queryExt.QUERY_RESULT_AVAILABLE_EXT );
			// queryExt.getQueryObjectEXT( query, queryExt.QUERY_RESULT_EXT );
			n.getQueryObjectEXT = function() {

				var nestedQueries = [ arguments[ 0 ], extractNestedQueries( ctx.nestedQueries.get( arguments[ 0 ] ) ) ];
				nestedQueries = [].concat.apply([], nestedQueries );

				//debugger;

				if( arguments[ 1 ] === res.QUERY_RESULT_AVAILABLE_EXT ) {
					var result = true;
					nestedQueries.forEach( q => {
						var available = getQueryObjectEXT.apply( res, [ q, res.QUERY_RESULT_AVAILABLE_EXT ] );
						//log( 'Available for', q.guid, ':', available );
						result = result && available;
					} );
					return result;
				}

				if( arguments[ 1 ] === res.QUERY_RESULT_EXT ) {
					var result = 0;
					nestedQueries.forEach( q => {
						var timeResult = getQueryObjectEXT.apply( res, [ q, res.QUERY_RESULT_EXT ]);
						result += timeResult;
						//log( 'Result for', q.guid, ':', timeResult );
					} );
					return result;
				}

			}

			return n;

		}

		return res;

	};

	// WebGL2

	if( glInfo.WebGL2Available ) {

		var drawElementsInstanced = WebGL2RenderingContext.prototype.drawElementsInstanced;
		WebGL2RenderingContext.prototype.drawElementsInstanced = function() {

			var ctx = contexts.get( this );
			ctx.instancedDrawCount ++;
			ctx.instanceCount += arguments[ 3 ];
			updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 1 ] );
			return drawElementsInstanced.apply( this, arguments );

		};

		var drawArraysInstanced = WebGL2RenderingContext.prototype.drawArraysInstanced;
		WebGL2RenderingContext.prototype.drawArraysInstanced = function() {

			var ctx = contexts.get( this );
			ctx.instancedDrawCount ++;
			ctx.instanceCount += arguments[ 4 ];
			updateDrawCount( this, ctx, arguments[ 0 ], arguments[ 2 ] );
			return drawArraysInstanced.apply( this, arguments );

		};

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
	var frameCount = 0;
	var lastTime = getTime();
	var frameId = 0;
	var framesQueue = {};
	var disjointFrames = new Map();

	var framerate = 0;
	var JavaScriptTime = 0;
	var frameTime = 0;
	var rAFCount = 0;

	window.requestAnimationFrame = function( c ) {

		if( typeof c === 'function' ) rAFs.push( c ); // some pages pass null (?)

	};

	var process = function( timestamp ) {

		originalRAF( process );

		oTime = getTime();
		rAFCount = rAFs.length;

		disjointFrames.forEach( frame => {

			frame.queries.forEach( q => {

				var query = q.query;
				var queryExt = q.context.queryExt;
				var available = queryExt.getQueryObjectEXT( query, queryExt.QUERY_RESULT_AVAILABLE_EXT );
				var disjoint = q.context.ctx.getParameter( queryExt.GPU_DISJOINT_EXT );

				if( available === null && disjoint === null ) { // Android?
					q.resolved = true;
				}

				if( available && !disjoint ) {
					q.time = queryExt.getQueryObjectEXT( query, queryExt.QUERY_RESULT_EXT );
					q.resolved = true;
				}

			} );

		} );

		disjointFrames.forEach( frame => {

			var time = 0;
			var resolved = true;

			frame.queries.forEach( q => {
				if( q.resolved ) {
					time += q.time;
					q.context.disjointTime += q.time;
				}
				else resolved = false;
			} );

			if( resolved ) {
				if( recording && framesQueue[ frame.frameId ] ) {
					framesQueue[ frame.frameId ].disjointTime = time;
					framesQueue[ frame.frameId ].completed = true;
				}
				disjointFrames.delete( frame.frameId );
			}

		} );

		disjointFrames.set( frameId, { frameId: frameId, queries: [] } );

		contexts.forEach( function _contexts( context ) {

			var queryExt = context.queryExt;

			if( queryExt ) {

				log( 'Perf Start Query' );
				var query = queryExt.createQueryEXT();
				queryExt.beginQueryEXT( queryExt.TIME_ELAPSED_EXT, query );
				var f = disjointFrames.get( frameId );
				if( f ) {
					f.queries.push( { context: context, query: query, resolved: false, time: 0 } );
				}
			}

		} );

		JavaScriptTime = 0;
		var s = getTime();
		var rAFQueue = rAFs.slice();
		rAFs = [];
		rAFQueue.forEach( function _raf( c ) {
			c( timestamp );
		} );
		JavaScriptTime = getTime() - s;

		contexts.forEach( function( context ) {
			var queryExt = context.queryExt;
			if( queryExt ) {
				log( 'Perf End Query' );
				queryExt.endQueryEXT( queryExt.TIME_ELAPSED_EXT );
			}
		} );

		frameCount++;
		if( getTime() > lastTime + 1000 ) {
			framerate = frameCount * 1000 / ( getTime() - lastTime );
			frameCount = 0;
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

		if( recording ) {

			var frameInfo = {
				frameId: frameId,
				framerate: framerate,
				timestamp: oTime,
				frameTime: frameTime,
				completed: allCanvasAre2D,
				contexts: new Map()
			};

			contexts.forEach( function( context ) {
				frameInfo.contexts.set( context, {
					useProgramCount: context.useProgramCount,
					drawCount: context.drawCount,
					instancedDrawCount: context.instancedDrawCount,
					bindTextureCount: context.bindTextureCount,
					JavaScriptTime: context.JavaScriptTime,
					disjointTime: context.disjointTime,
					points: context.points,
					lines: context.lines,
					triangles: context.triangles,
					log: context.log
				} );
			} );

			framesQueue[ frameId ] = frameInfo;

		}

		contexts.forEach( function( context ) {
			context.useProgramCount = 0;
			context.drawCount = 0;
			context.instancedDrawCount = 0;
			context.instanceCount = 0;
			context.bindTextureCount = 0;
			context.JavaScriptTime = 0;
			context.disjointTime = 0;
			context.points = 0;
			context.lines = 0;
			context.triangles = 0;
			context.log = [];
		} );

	};

	var compileFrame = function( contexts ) {

		var drawCount = 0;
		var instancedDrawCount = 0;
		var instanceCount = 0;
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

		var canvasLog = [];

		contexts.forEach( function( context ) {
			drawCount          += context.drawCount;
			instancedDrawCount += context.instancedDrawCount;
			JavaScriptTime     += context.JavaScriptTime;
			disjointTime       += context.disjointTime;
			useProgramCount    += context.useProgramCount;
			bindTextureCount   += context.bindTextureCount;
			totalPoints        += context.points;
			totalLines         += context.lines;
			totalTriangles     += context.triangles;
			programCount       += context.programCount;
			textureCount       += context.textureCount;
			instanceCount      += context.instanceCount;
			canvasLog.push( {
				disjointTime: context.disjointTime,
				log: context.log,
				JavaScriptTime: context.JavaScriptTime
			} );
			if( context.type === '3d' ) hasWebGL = true;
		} );

		return {
			drawCount: drawCount,
			instancedDrawCount: instancedDrawCount,
			instanceCount: instanceCount,
			JavaScriptTime: JavaScriptTime,
			disjointTime: disjointTime,
			useProgramCount: useProgramCount,
			bindTextureCount: bindTextureCount,
			totalPoints: totalPoints,
			totalLines: totalLines,
			totalTriangles: totalTriangles,
			programCount: programCount,
			textureCount: textureCount,
			totalDrawCount: drawCount + instancedDrawCount,
			hasWebGL: hasWebGL,
			log: canvasLog
		};

	};

	var update = function(){

		if( contexts.size === 0 ) return;

		if( recording ) {

			Object.keys( framesQueue ).forEach( n => {

				var frame = framesQueue[ n ];
				if( frame.completed ) {

					var res = compileFrame( frame.contexts );

					post( {
						method: 'frame',
						data: {
							frame: frame.frameId,
							timestamp: frame.timestamp,
							framerate: frame.framerate,
							frameTime: frame.frameTime,
							JavaScriptTime: res.JavaScriptTime,
							disjointTime: res.disjointTime,
							drawCount: res.drawCount,
							log: res.log
						}

					} );

					framesQueue[ n ] = null;
					delete framesQueue[ n ];

				}

			} );

		}

		var frame = compileFrame( contexts );

		//console.log( frameTime.toFixed(2), JavaScriptTime.toFixed(2) )
		//if( frame.JavaScriptTime > frameTime ) debugger;

		var general = `FPS: ${framerate.toFixed( 2 )}
Frame JS Time: ${frameTime.toFixed(2)}
Canvas: ${contexts.size}
Canvas JS time: ${frame.JavaScriptTime.toFixed( 2 )}
`;

		var webgl = `<b>WebGL</b>
GPU Time: ${( frame.disjointTime / 1000000 ).toFixed( 2 )}
programs: ${frame.programCount}
textures: ${frame.textureCount}
useProgram: ${frame.useProgramCount}
bindTexture: ${frame.bindTextureCount}
Draw: ${frame.drawCount}
Instanced: ${frame.instancedDrawCount} (${frame.instanceCount})
Total: ${frame.totalDrawCount}
Points: ${frame.totalPoints}
Lines: ${frame.totalLines}
Triangles: ${frame.totalTriangles}
`;

		var browser = `<b>Browser</b>
Mem: ${(performance.memory.usedJSHeapSize/(1024*1024)).toFixed(2)}/${(performance.memory.totalJSHeapSize/(1024*1024)).toFixed(2)}
`;

		text.innerHTML = general + ( frame.hasWebGL ? webgl : '' ) + browser + ( settings.showGPUInfo ? webGLInfo : '' );

	};

	originalRAF( process );

} else {
	if( verbose ) log( 'Already instrumented. Skipping', document.location.href );
}
