(function() {

	"use strict";

	function createUUID() {

		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}

		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();

	}

	function FrameData( id ) {

		this.frameId = id;

		this.framerate = 0;
		this.frameTime = 0;
		this.JavaScriptTime = 0;

		this.contexts = new Map();

	}

	function ContextFrameData( type ) {

		this.type = type;

		this.JavaScriptTime = 0;
		this.GPUTime = 0;
		this.log = [];

		this.createProgram = 0;
		this.createTexture = 0;

		this.useProgram = 0;
		this.bindTexture = 0;

		this.triangles = 0;
		this.lines = 0;
		this.points = 0;

	}

	function ContextData( contextWrapper ) {

		this.id = createUUID();
		this.queryExt = null;
		this.contextWrapper = contextWrapper;
		this.extQueries = [];

	}

	function Wrapper( context ) {

		this.id = createUUID();
		this.context = context;

		this.count = 0;
		this.JavaScriptTime = 0;

	}

	Wrapper.prototype.resetFrame = function() {

		this.resetCount();
		this.resetJavaScriptTime();

	}

	Wrapper.prototype.resetCount = function() {

		this.count = 0;

	}

	Wrapper.prototype.incrementCount = function() {

		this.count++;

	}

	Wrapper.prototype.resetJavaScriptTime = function() {

		this.JavaScriptTime = 0;

	}

	Wrapper.prototype.incrementJavaScriptTime = function( time ) {

		this.JavaScriptTime += time;

	}

	function CanvasRenderingContext2DWrapper( context ) {

		Wrapper.call( this, context );

	}

	CanvasRenderingContext2DWrapper.prototype = Object.create( Wrapper.prototype );

	CanvasRenderingContext2DWrapper.prototype.resetFrame = function() {

		Wrapper.prototype.resetFrame.call( this );

	}

	Object.keys( CanvasRenderingContext2D.prototype ).forEach( key => {

		if( key !== 'canvas' ) {

			try{
				if( typeof CanvasRenderingContext2D.prototype[ key ] === 'function' ) {
					CanvasRenderingContext2DWrapper.prototype[ key ] = function() {
						this.incrementCount();
						var startTime = performance.now();
						var res = CanvasRenderingContext2D.prototype[ key ].apply( this.context, arguments );
						this.incrementJavaScriptTime( performance.now() - startTime );
						return res;
					}
				} else {
					CanvasRenderingContext2DWrapper.prototype[ key ] = CanvasRenderingContext2D.prototype[ key ];
				}
			} catch( e ) {
				Object.defineProperty( CanvasRenderingContext2DWrapper.prototype, key, {
					get: function () { return this.context[ key ]; },
					set: function ( v ) { this.context[ key ] = v; }
				} );
			}

		}

	} );

	function WebGLRenderingContextWrapper( context ) {

		Wrapper.call( this, context );

		this.queryStack = [];
		this.activeQuery = null;

		this.programCount = 0;
		this.textureCount = 0;

		this.useProgramCount = 0;
		this.bindTextureCount = 0;

		this.drawArrayCalls = 0;
		this.drawElementsCalls = 0;

		this.pointsCount = 0;
		this.linesCount = 0;
		this.trianglesCount = 0;

	}

	WebGLRenderingContextWrapper.prototype = Object.create( Wrapper.prototype );

	WebGLRenderingContextWrapper.prototype.cloned = false;

	cloneWebGLRenderingContextPrototype();

	WebGLRenderingContextWrapper.prototype.resetFrame = function() {

		Wrapper.prototype.resetFrame.call( this );

		this.useProgramCount = 0;
		this.bindTextureCount = 0;

		this.drawArrayCalls = 0;
		this.drawElementsCalls = 0;

		this.pointsCount = 0;
		this.linesCount = 0;
		this.trianglesCount = 0;

	}

	function cloneWebGLRenderingContextPrototype() {

		// some sites (e.g. http://codeflow.org/webgl/deferred-irradiance-volumes/www/)
		// modify the prototype, and they do it after the initial check for support

//		if( WebGLRenderingContextWrapper.prototype.cloned ) return;
//		WebGLRenderingContextWrapper.prototype.cloned = true;

		Object.keys( WebGLRenderingContext.prototype ).forEach( key => {

 			// .canvas is weird, so it's directly assigned when creating the wrapper

			if( key !== 'canvas' ) {

				try{
					if( typeof WebGLRenderingContext.prototype[ key ] === 'function' ) {
						WebGLRenderingContextWrapper.prototype[ key ] = function() {
							this.incrementCount();
							return WebGLRenderingContext.prototype[ key ].apply( this.context, arguments );
						}
					} else {
						WebGLRenderingContextWrapper.prototype[ key ] = WebGLRenderingContext.prototype[ key ];
					}
				} catch( e ) {
					Object.defineProperty( WebGLRenderingContext.prototype, key, {
						get: function () { return this.context[ key ]; },
						set: function ( v ) { this.context[ key ] = v; }
					} );
				}

			}

		} );

		instrumentWebGLRenderingContext();

	}

	function WebGLDebugShadersExtensionWrapper( contextWrapper ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'WEBGL_debug_shaders' ] );

	}

	WebGLDebugShadersExtensionWrapper.prototype.getTranslatedShaderSource = function( shaderWrapper ) {

		return this.extension.getTranslatedShaderSource( shaderWrapper.shader );

	}

	WebGLRenderingContextWrapper.prototype.getExtension = function() {

		this.incrementCount();

		var extensionName = arguments[ 0 ];

		switch( extensionName ) {

			case 'WEBGL_debug_shaders':
			return new WebGLDebugShadersExtensionWrapper( this );
			break;

			case 'EXT_disjoint_timer_query':
			return new EXTDisjointTimerQueryExtensionWrapper( this );
			break;

		}

		return this.context.getExtension( extensionName );

	}

	WebGLRenderingContextWrapper.prototype.updateDrawCount = function( mode, count ) {

		var gl = this.context;

		switch( mode ){
			case gl.POINTS:
				this.pointsCount += count;
				break;
			case gl.LINE_STRIP:
				this.linesCount += count - 1;
				break;
			case gl.LINE_LOOP:
				this.linesCount += count;
				break;
			case gl.LINES:
				this.linesCount += count / 2;
				break;
			case gl.TRIANGLE_STRIP:
			case gl.TRIANGLE_FAN:
				this.trianglesCount += count - 2;
				break;
			case gl.TRIANGLES:
				this.trianglesCount += count / 3;
				break;
		}

	};

	WebGLRenderingContextWrapper.prototype.drawElements = function() {

		this.incrementCount();
		this.drawElementsCalls++;
		this.updateDrawCount( arguments[ 0 ], arguments[ 1 ] );

		return WebGLRenderingContext.prototype.drawElements.apply( this.context, arguments );

	}

	WebGLRenderingContextWrapper.prototype.drawArrays = function() {

		this.incrementCount();
		this.drawArrayCalls++;
		this.updateDrawCount( arguments[ 0 ], arguments[ 2 ] );

		return WebGLRenderingContext.prototype.drawArrays.apply( this.context, arguments );

	}

	var contexts = [];
	var canvasContexts = new WeakMap();

	var getContext = HTMLCanvasElement.prototype.getContext;

	HTMLCanvasElement.prototype.getContext = function() {

		var c = canvasContexts.get( this );
		if( c ) {
			log( arguments, '(CACHED)' );
			return c;
		} else {
			log( arguments );
		}

		var context = getContext.apply( this, arguments );

		if( arguments[ 0 ] === 'webgl' || arguments[ 0 ] === 'experimental-webgl' ) {

			var wrapper = new WebGLRenderingContextWrapper( context );
			wrapper.canvas = this;
			var cData = new ContextData( wrapper );
			cData.queryExt = wrapper.getExtension( 'EXT_disjoint_timer_query' )
			contexts.push( cData );
			canvasContexts.set( this, wrapper );
			return wrapper;

		}

		if( arguments[ 0 ] === '2d' ) {

			var wrapper = new CanvasRenderingContext2DWrapper( context );
			wrapper.canvas = this;
			var cData = new ContextData( wrapper );
			contexts.push( cData );
			canvasContexts.set( this, wrapper );
			return wrapper;

		}

		canvasContexts.set( this, context );
		return context;


	}

	function WebGLShaderWrapper( contextWrapper, type ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.shader = WebGLRenderingContext.prototype.createShader.apply( this.contextWrapper.context, [ type ] );
		this.version = 1;
		this.source = null;
		this.type = type;

	}

	WebGLShaderWrapper.prototype.shaderSource = function( source ) {

		this.source = source;
		return WebGLRenderingContext.prototype.shaderSource.apply( this.contextWrapper.context, [ this.shader, source ] );

	}

	function WebGLUniformLocationWrapper( contextWrapper, program, name ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.program = program;
		this.name = name;
		this.getUniformLocation();

		this.program.uniformLocations[ this.name ] = this;

		//log( 'Location for uniform', name, 'on program', this.program.id );

	}

	WebGLUniformLocationWrapper.prototype.getUniformLocation = function() {

		this.uniformLocation = WebGLRenderingContext.prototype.getUniformLocation.apply( this.contextWrapper, [ this.program.program, this.name ] );

	}

	function WebGLProgramWrapper( contextWrapper ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.program = WebGLRenderingContext.prototype.createProgram.apply( this.contextWrapper.context );
		this.version = 1;
		this.vertexShaderWrapper = null;
		this.fragmentShaderWrapper = null;

		this.uniformLocations = {};

	}

	WebGLProgramWrapper.prototype.attachShader = function() {

		var shaderWrapper = arguments[ 0 ];

		if( shaderWrapper.type == this.contextWrapper.context.VERTEX_SHADER ) this.vertexShaderWrapper = shaderWrapper;
		if( shaderWrapper.type == this.contextWrapper.context.FRAGMENT_SHADER ) this.fragmentShaderWrapper = shaderWrapper;

		return WebGLRenderingContext.prototype.attachShader.apply( this.contextWrapper.context, [ this.program, shaderWrapper.shader ] );

	}

	WebGLProgramWrapper.prototype.highlight = function() {

		detachShader.apply( this.contextWrapper.context, [ this.program, this.fragmentShaderWrapper.shader ] );

		var fs = this.fragmentShaderWrapper.source;
		fs = fs.replace( /\s+main\s*\(/, ' ShaderEditorInternalMain(' );
		fs += '\r\n' + 'void main() { ShaderEditorInternalMain(); gl_FragColor.rgb *= vec3(1.,0.,1.); }';

		var highlightShaderWrapper = new WebGLShaderWrapper( this.contextWrapper, this.contextWrapper.context.FRAGMENT_SHADER );
		highlightShaderWrapper.shaderSource( fs );
		WebGLRenderingContext.prototype.compileShader.apply( this.contextWrapper.context, [ highlightShaderWrapper.shader ] );
		WebGLRenderingContext.prototype.attachShader.apply( this.contextWrapper.context, [ this.program, highlightShaderWrapper.shader ] );
		WebGLRenderingContext.prototype.linkProgram.apply( this.contextWrapper.context, [ this.program ] );

		Object.keys( this.uniformLocations ).forEach( name => {
			this.uniformLocations[ name ].getUniformLocation();
		} );

	}

	function instrumentWebGLRenderingContext() {

		WebGLRenderingContextWrapper.prototype.createShader = function() {

			log( 'create shader' );
			this.incrementCount();
			return new WebGLShaderWrapper( this, arguments[ 0 ] );

		}

		WebGLRenderingContextWrapper.prototype.shaderSource = function() {

			this.incrementCount();
			return arguments[ 0 ].shaderSource( arguments[ 1 ] );

		}

		WebGLRenderingContextWrapper.prototype.compileShader = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.compileShader.apply( this.context, [ arguments[ 0 ].shader ] );

		}

		WebGLRenderingContextWrapper.prototype.getShaderParameter = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getShaderParameter.apply( this.context, [ arguments[ 0 ].shader, arguments[ 1 ] ] );

		}

		WebGLRenderingContextWrapper.prototype.getShaderInfoLog = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getShaderInfoLog.apply( this.context, [ arguments[ 0 ].shader ] );

		}

		WebGLRenderingContextWrapper.prototype.deleteShader = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.deleteShader.apply( this.context, [ arguments[ 0 ].shader ] );

		}

		WebGLRenderingContextWrapper.prototype.createProgram = function() {

			log( 'create program' );
			this.incrementCount();
			this.programCount++;
			return new WebGLProgramWrapper( this );

		}

		WebGLRenderingContextWrapper.prototype.deleteProgram = function( programWrapper ) {

			this.incrementCount();
			this.programCount--;
			WebGLRenderingContext.prototype.deleteProgram.apply( this.context, [ programWrapper.program ] );

		}

		WebGLRenderingContextWrapper.prototype.attachShader = function() {

			this.incrementCount();
			return arguments[ 0 ].attachShader( arguments[ 1 ] );

		}

		WebGLRenderingContextWrapper.prototype.linkProgram = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.linkProgram.apply( this.context, [ arguments[ 0 ].program ] );

		}

		WebGLRenderingContextWrapper.prototype.getProgramParameter = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getProgramParameter.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

		}

		WebGLRenderingContextWrapper.prototype.getProgramInfoLog = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getProgramInfoLog.apply( this.context, [ arguments[ 0 ].program ] );

		}

		WebGLRenderingContextWrapper.prototype.getActiveAttrib = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getActiveAttrib.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

		}

		WebGLRenderingContextWrapper.prototype.getAttribLocation = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getAttribLocation.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

		}

		WebGLRenderingContextWrapper.prototype.bindAttribLocation = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.bindAttribLocation.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ], arguments[ 2 ] ] );

		}

		WebGLRenderingContextWrapper.prototype.getActiveUniform = function() {

			this.incrementCount();
			return WebGLRenderingContext.prototype.getActiveUniform.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

		}

		WebGLRenderingContextWrapper.prototype.getUniformLocation = function() {

			this.incrementCount();
			return new WebGLUniformLocationWrapper( this.context, arguments[ 0 ], arguments[ 1 ] );

		}

		WebGLRenderingContextWrapper.prototype.useProgram = function() {

			this.incrementCount();
			this.useProgramCount++;
			return WebGLRenderingContext.prototype.useProgram.apply( this.context, [ arguments[ 0 ] ? arguments[ 0 ].program : null ] );

		}

		var methods = [
			'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv',
			'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv',
			'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv',
			'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv',
			'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'
		];

		var originalMethods = {};

		methods.forEach( method => {
			var original = WebGLRenderingContext.prototype[ method ];
			originalMethods[ method ] = original;
			WebGLRenderingContextWrapper.prototype[ method ] = function() {
				this.incrementCount();
				var args = new Array(arguments.length);
				for (var i = 0, l = arguments.length; i < l; i++) {
					args[i] = arguments[i];
				}
				if( !args[ 0 ] ) return;
				args[ 0 ] = args[ 0 ].uniformLocation;
				return original.apply( this.context, args );
			}
		} );

	}

	function WebGLTimerQueryEXTWrapper( contextWrapper, extension ) {

		this.contextWrapper = contextWrapper;
		this.extension = extension;
		this.query = this.extension.createQueryEXT();
		this.time = 0;
		this.available = false;
		this.nested = [];

	}

	WebGLTimerQueryEXTWrapper.prototype.getTimes = function() {

		var time = this.getTime();
		this.nested.forEach( q => {
			time += q.getTimes();
		} );

		return time;

	}

	WebGLTimerQueryEXTWrapper.prototype.getTime = function() {

		this.time = this.extension.getQueryObjectEXT( this.query, this.extension.QUERY_RESULT_EXT );

		return this.time;

	}

	WebGLTimerQueryEXTWrapper.prototype.getResultsAvailable = function() {

		var res = true;
		this.nested.forEach( q => {
			res = res && q.getResultsAvailable();
		} );

		return res;

	}

	WebGLTimerQueryEXTWrapper.prototype.getResultsAvailable = function() {

		this.available = this.extension.getQueryObjectEXT( this.query, this.extension.QUERY_RESULT_AVAILABLE_EXT );
		return this.available;

	}

	function EXTDisjointTimerQueryExtensionWrapper( contextWrapper ) {

		this.contextWrapper = contextWrapper;
		this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'EXT_disjoint_timer_query' ] );

		this.QUERY_COUNTER_BITS_EXT = this.extension.QUERY_COUNTER_BITS_EXT;
		this.CURRENT_QUERY_EXT = this.extension.CURRENT_QUERY_EXT;
		this.QUERY_RESULT_AVAILABLE_EXT = this.extension.QUERY_RESULT_AVAILABLE_EXT;
		this.GPU_DISJOINT_EXT = this.extension.GPU_DISJOINT_EXT;
		this.QUERY_RESULT_EXT = this.extension.QUERY_RESULT_EXT;
		this.TIME_ELAPSED_EXT = this.extension.TIME_ELAPSED_EXT;
		this.TIMESTAMP_EXT = this.extension.TIMESTAMP_EXT;

	}

	EXTDisjointTimerQueryExtensionWrapper.prototype.createQueryEXT = function() {

		return new WebGLTimerQueryEXTWrapper( this.contextWrapper, this.extension );

	}

	EXTDisjointTimerQueryExtensionWrapper.prototype.beginQueryEXT = function( type, query ) {

		if( this.contextWrapper.activeQuery ){
			this.extension.endQueryEXT( type );
			this.contextWrapper.activeQuery.nested.push( query );
			this.contextWrapper.queryStack.push( this.contextWrapper.activeQuery );
		}

		this.contextWrapper.activeQuery = query;

		return this.extension.beginQueryEXT( type, query.query );

	}

	EXTDisjointTimerQueryExtensionWrapper.prototype.endQueryEXT = function( type ) {

		this.contextWrapper.activeQuery = this.contextWrapper.queryStack.pop();
		var res = this.extension.endQueryEXT( type );
		if( this.contextWrapper.activeQuery ) {
			var newQuery = new WebGLTimerQueryEXTWrapper( this.contextWrapper, this.extension );
			this.contextWrapper.activeQuery.nested.push( newQuery );
			this.extension.beginQueryEXT( type, newQuery.query );
		}
		return res;

	}

	EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryObjectEXT = function( query, pname ) {

		if( pname === this.extension.QUERY_RESULT_AVAILABLE_EXT ) {
			return query.getResultsAvailable();
		}

		if( pname === this.extension.QUERY_RESULT_EXT ) {
			return query.getTimes();
		}

		return this.extension.getQueryObjectEXT( query.query, pname );

	}

	EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryEXT = function( target, pname ) {

		return this.extension.getQueryEXT( target, pname );

	}

	var originalRequestAnimationFrame = window.requestAnimationFrame;
	var rAFQueue = [];

	window.requestAnimationFrame = function( c ) {

		rAFQueue.push( c );

	}

	function processRequestAnimationFrames() {

		contexts.forEach( ctx => {

			ctx.contextWrapper.resetFrame();

			var ext = ctx.queryExt;

			if( ext ) {

				var query = ext.createQueryEXT();
				ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
				ctx.extQueries.push( query );

			}

		} );

		var startTime = performance.now();

		var queue = rAFQueue.slice( 0 );
		rAFQueue.length = 0;
		queue.forEach( rAF => {
			rAF();
		} );

		var endTime = performance.now();
		var frameTime = endTime - startTime;

		contexts.forEach( ctx => {

			var ext = ctx.queryExt;

			if( ext ) {

				ext.endQueryEXT( ext.TIME_ELAPSED_EXT );

				ctx.extQueries.forEach( ( query, i ) => {

					var available = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_AVAILABLE_EXT );
					var disjoint = ctx.contextWrapper.context.getParameter( ext.GPU_DISJOINT_EXT );

					if (available && !disjoint) {

						var queryTime = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_EXT );
						var time = queryTime;
						if( ctx.contextWrapper.count ) {
							log( ctx.contextWrapper.id, ctx.contextWrapper.count,
							    time, ctx.contextWrapper.JavaScriptTime,
							    ctx.contextWrapper.drawArrayCalls, ctx.contextWrapper.drawElementsCalls,
							    ctx.contextWrapper.pointsCount, ctx.contextWrapper.linesCount, ctx.contextWrapper.trianglesCount
							);
						}
						ctx.extQueries.splice( i, 1 );

					}

				} );
			}

		} );

		originalRequestAnimationFrame( processRequestAnimationFrames );

	}

	processRequestAnimationFrames();

})();
