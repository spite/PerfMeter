var verbose = false;

if( !window.__PerfMeterInstrumented ) {

	window.__PerfMeterInstrumented = true;

	function log() {

		var args = Array.from( arguments );
		args.unshift( 'background: #1E9433; color: #ffffff; text-shadow: 0 -1px #000; padding: 4px 0 4px 0; line-height: 0' );
		args.unshift( `%c PerfMeter ` );

		console.log.apply( console, args );

	}

	log( 'Canvas Instrumentation', document.location.href, settings );

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
	text.style.pointerEvents = 'none' // doesn't work from the .css ???

	window.addEventListener( 'load', _ => {

		var fileref = document.createElement("link");
		fileref.rel = "stylesheet";
		fileref.type = "text/css";
		fileref.href = settings.cssPath;
		window.document.getElementsByTagName("head")[0].appendChild(fileref)

		window.document.body.appendChild( text );

	} );

	function _h ( f, pre, post ) {
		return function () {
			var args = pre.apply( this, arguments ) || arguments;
			var res = f.apply( this, args );
			var r;
			return post ? ( r = post.apply( this, [ res, args ] ), r ? r : res ) : res;
		};
	}

	var WebGLAvailable = 'WebGLRenderingContext' in window;
	var WebGL2Available = 'WebGL2RenderingContext' in window;

	var canvasCount = 0;
	var contexts = [];
	var vendor = '';
	var renderer = '';
	var glVersion = '';
	var glslVersion = '';

	HTMLCanvasElement.prototype.getContext = _h( HTMLCanvasElement.prototype.getContext,
		function() {
			this.style.border = '1px solid #ff00ff';
			this.style.boxSizing = 'border-box';

			canvasCount++
			log( 'getContext', arguments );
		},
		function( res, args ) {
			if( args[ 0 ] === 'webgl' || args[ 0 ] === 'experimental-webgl' || args[ 0 ] === 'webgl2' ) {

				var debugInfo = res.getExtension( 'WEBGL_debug_renderer_info' );
				vendor = res.getParameter( debugInfo.UNMASKED_VENDOR_WEBGL );
				renderer = res.getParameter( debugInfo.UNMASKED_RENDERER_WEBGL );
				glVersion = res.getParameter( res.VERSION );
				glslVersion = res.getParameter( res.SHADING_LANGUAGE_VERSION );

				var queryExt = res.getExtension("EXT_disjoint_timer_query");
				if( queryExt ) {
					contexts.push( {
						gl: res,
						queryExt: queryExt,
						queries: [],
						frames: {}
					} );
				}
			}
		}
	);


	var drawCount = 0;
	var instancedDrawCount = 0;
	var pointCount = 0;
	var lineCount = 0;
	var triangleCount = 0;
	var programCount = 0;

	var JavaScriptWebGLTime = 0;

	function instrumentContext( proto ) {

		var drawElements = proto.prototype.drawElements;
		proto.prototype.drawElements = function() {

			drawCount ++;
			return drawElements.apply( this, arguments );

		}

		var drawArrays = proto.prototype.drawArrays;
		proto.prototype.drawArrays = function() {

			drawCount ++;
			return drawArrays.apply( this, arguments );

		}

		var useProgram = proto.prototype.useProgram;
		proto.prototype.useProgram = function() {

			programCount++;
			return useProgram.apply( this, arguments );

		}

		for( var j in proto.prototype ) {
			try {
				if( typeof proto.prototype[ j ] === 'function' ){
					( function( id ) {
						var time;
						proto.prototype[ j ] = _h(
							proto.prototype[ j ],
							function() {
								time = getTime();
							},
							function() {
								JavaScriptWebGLTime += getTime() - time;
							}
							);
					})( j );

				}
			} catch( e ) {
			//console.log( j );
			}
		}

	}

	instrumentContext( WebGLRenderingContext );
	if( WebGL2Available ) instrumentContext( WebGL2RenderingContext );

	if( WebGL2Available ) {

		var drawElements2 = WebGL2RenderingContext.prototype.drawElements;
		WebGL2RenderingContext.prototype.drawElements = function() {

			drawCount ++;
			return drawElements2.apply( this, arguments );

		}

		var drawArrays2 = WebGL2RenderingContext.prototype.drawArrays;
		WebGL2RenderingContext.prototype.drawArrays = function() {

			drawCount ++;
			return drawArrays2.apply( this, arguments );

		}

	}

	// WebGL with ANGLE_instanced_arrays Extension
	// There isn't an available ANGLEInstancedArrays constructor
	// This way feels hacky

	var getExtension = WebGLRenderingContext.prototype.getExtension;
	WebGLRenderingContext.prototype.getExtension = function() {

		log( 'Extension', arguments[ 0 ] );
		var res = getExtension.apply( this, arguments );

		if( arguments[ 0 ] === 'ANGLE_instanced_arrays' ){
			var drawArraysInstancedANGLE = res.drawArraysInstancedANGLE;
			res.drawArraysInstancedANGLE = function() {
				instancedDrawCount++;
				return drawArraysInstancedANGLE.apply( this, arguments );
			}
			var drawElementsInstancedANGLE = res.drawElementsInstancedANGLE;
			res.drawElementsInstancedANGLE = function() {
				instancedDrawCount++;
				return drawElementsInstancedANGLE.apply( this, arguments );
			}
		}

		return res;

	}

	// WebGL2

	if( WebGL2Available ) {

		var drawElementsInstanced = WebGL2RenderingContext.prototype.drawElementsInstanced;
		WebGL2RenderingContext.prototype.drawElementsInstanced = function() {

			instancedDrawCount ++;
			return drawElementsInstanced.apply( this, arguments );

		}

		var drawArraysInstanced = WebGL2RenderingContext.prototype.drawArraysInstanced;
		WebGL2RenderingContext.prototype.drawArraysInstanced = function() {

			instancedDrawCount ++;
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
	var disjointTime = 0;
	var frameTime = 0;

	window.requestAnimationFrame = function( c ) {

		rAFs.push( c );

	}

	function process( timestamp ) {

		//rAFValues.push( getTime() - oTime );
		oTime = getTime();

		originalRAF( process );

		disjointFrames[ frameId ] = { time: 0, queries: 0 };
		disjointTime = 0;

		contexts.forEach( function( context, id ) {

			var queryExt = context.queryExt,
			gl = context.gl;

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
						disjointTime += disjointFrames[ q.frameId ].time;
						disjointFrames[ q.frameId ] = null;
					}
				}
			} )

			var query = queryExt.createQueryEXT();
			queryExt.beginQueryEXT( queryExt.TIME_ELAPSED_EXT, query );
			context.queries.push( { frameId: frameId, query: query } );
			disjointFrames[ frameId ].queries++;

			//console.log( context.queries.length );

		} );

		JavaScriptWebGLTime = 0;
		var s = getTime();
		rAFs.forEach( function( c, i ) {
			c( timestamp );
			rAFs.splice( i, 1 );
		} );
		JavaScriptTime = getTime() - s;

		contexts.forEach( function( context ) {
			var queryExt = context.queryExt;
			queryExt.endQueryEXT( queryExt.TIME_ELAPSED_EXT );
		} );

		frames++;
		if( getTime() > lastTime + 1000 ) {
			framerate = frames * 1000 / ( getTime() - lastTime );
			//frameValues.push( frames * 1000 / ( getTime() - lastTime ) );
			frames = 0;
			lastTime = getTime();
		}

		frameId++;

		/*if( programCount === 0 ) {
			contexts.forEach( gl => {
				var res = gl.getParameter( gl.CURRENT_PROGRAM );
				debugger;
			} )
		}*/

		frameTime = getTime() - oTime;

		update();

		programCount = 0;
		drawCount = 0;
		instancedDrawCount = 0;

	}

	originalRAF( process );

	function update(){

		if( canvasCount === 0 ) return;

		var totalDrawCount = drawCount + instancedDrawCount
		text.innerHTML = `FPS: ${framerate.toFixed( 2 )}
Frame Time: ${frameTime.toFixed(2)}
JS Time: ${JavaScriptTime.toFixed( 2 )}
WebGL JS time: ${JavaScriptWebGLTime.toFixed( 2 )}
GPU Time: ${( disjointTime / 1000000 ).toFixed( 2 )}
Programs: ${programCount}
Draw: ${drawCount}
Instanced: ${instancedDrawCount}
Total: ${totalDrawCount}
Mem: ${(performance.memory.usedJSHeapSize/(1024*1024)).toFixed(2)}/${(performance.memory.totalJSHeapSize/(1024*1024)).toFixed(2)}`
//GL Version: ${glVersion}
//GLSL Version: ${glslVersion}
//Vendor: ${vendor}
//Renderer: ${renderer}`;

	}

} else {
	if( verbose ) log( 'Already instrumented. Skipping', document.location.href )
}
