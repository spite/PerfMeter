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

	}

	function WebGLRenderingContextWrapper( context ) {

		this.id = createUUID();
		this.context = context;

		this.queryStack = [];
		this.activeQuery = null;

		this.count = 0;

	}

	WebGLRenderingContextWrapper.prototype.resetCount = function() {

		this.count = 0;

	}

	WebGLRenderingContextWrapper.prototype.incrementCount = function() {

		this.count++;

	}

	Object.keys( WebGLRenderingContext.prototype ).forEach( key => {

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

		}

	} );

	function WebGLDebugShadersExtensionWrapper( contextWrapper ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'WEBGL_debug_shaders' ] );

	}

	WebGLDebugShadersExtensionWrapper.prototype.getTranslatedShaderSource = function( shaderWrapper ) {

		return this.extension.getTranslatedShaderSource( shaderWrapper.shader );

	}

	WebGLRenderingContextWrapper.prototype.getExtension = function() {

		var extensionName = arguments[ 0 ];

		switch( extensionName ) {
			case 'WEBGL_debug_shaders':
			return new WebGLDebugShadersExtensionWrapper( this );
			case 'EXT_disjoint_timer_query':
			return new EXTDisjointTimerQueryExtensionWrapper( this );
			break;
		}

		return this.context.getExtension( extensionName );

	}

	var contexts = [];

	var getContext = HTMLCanvasElement.prototype.getContext;

	HTMLCanvasElement.prototype.getContext = function() {

		log( arguments );

		var context = getContext.apply( this, arguments );

		if( arguments[ 0 ] === 'webgl' || arguments[ 0 ] === 'experimental-webgl' ) {
			var wrapper = new WebGLRenderingContextWrapper( context );
			var cData = new ContextData( wrapper );
			cData.queryExt = wrapper.getExtension( 'EXT_disjoint_timer_query' )
			contexts.push( cData );
			return wrapper;
		} else {
			return context;
		}

	}

	var createShader = WebGLRenderingContext.prototype.createShader;
	var shaderSource = WebGLRenderingContext.prototype.shaderSource;
	var compileShader = WebGLRenderingContext.prototype.compileShader;
	var getShaderParameter = WebGLRenderingContext.prototype.getShaderParameter;
	var getShaderInfoLog = WebGLRenderingContext.prototype.getShaderInfoLog;
	var deleteShader = WebGLRenderingContext.prototype.deleteShader;

	var createProgram = WebGLRenderingContext.prototype.createProgram;
	var attachShader = WebGLRenderingContext.prototype.attachShader;
	var detachShader = WebGLRenderingContext.prototype.detachShader;
	var linkProgram = WebGLRenderingContext.prototype.linkProgram;
	var getProgramParameter = WebGLRenderingContext.prototype.getProgramParameter;
	var getProgramInfoLog = WebGLRenderingContext.prototype.getProgramInfoLog;
	var getActiveAttrib = WebGLRenderingContext.prototype.getActiveAttrib;
	var getAttribLocation = WebGLRenderingContext.prototype.getAttribLocation;
	var bindAttribLocation = WebGLRenderingContext.prototype.bindAttribLocation;
	var getActiveUniform = WebGLRenderingContext.prototype.getActiveUniform;
	var getUniformLocation = WebGLRenderingContext.prototype.getUniformLocation;
	var useProgram = WebGLRenderingContext.prototype.useProgram;

	function WebGLShaderWrapper( contextWrapper, type ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.shader = createShader.apply( this.contextWrapper.context, [ type ] );
		this.version = 1;
		this.source = null;
		this.type = type;

	}

	WebGLShaderWrapper.prototype.shaderSource = function( source ) {

		this.source = source;
		return shaderSource.apply( this.contextWrapper.context, [ this.shader, source ] );

	}

	WebGLRenderingContextWrapper.prototype.createShader = function() {

		log( 'create shader' );
		return new WebGLShaderWrapper( this, arguments[ 0 ] );

	}

	WebGLRenderingContextWrapper.prototype.shaderSource = function() {

		return arguments[ 0 ].shaderSource( arguments[ 1 ] );

	}

	WebGLRenderingContextWrapper.prototype.compileShader = function() {

		return compileShader.apply( this.context, [ arguments[ 0 ].shader ] );

	}

	WebGLRenderingContextWrapper.prototype.getShaderParameter = function() {

		return getShaderParameter.apply( this.context, [ arguments[ 0 ].shader, arguments[ 1 ] ] );

	}

	WebGLRenderingContextWrapper.prototype.getShaderInfoLog = function() {

		return getShaderInfoLog.apply( this.context, [ arguments[ 0 ].shader ] );

	}

	WebGLRenderingContextWrapper.prototype.deleteShader = function() {

		return deleteShader.apply( this.context, [ arguments[ 0 ].shader ] );

	}

	function WebGLUniformLocationWrapper( contextWrapper, program, name ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.program = program;
		this.name = name;
		this.getUniformLocation();

		this.program.uniformLocations[ this.name ] = this;

		log( 'Location for uniform', name, 'on program', this.program.id );

	}

	WebGLUniformLocationWrapper.prototype.getUniformLocation = function() {

		this.uniformLocation = getUniformLocation.apply( this.contextWrapper, [ this.program.program, this.name ] );

	}

	function WebGLProgramWrapper( contextWrapper ) {

		this.id = createUUID();
		this.contextWrapper = contextWrapper;
		this.program = createProgram.apply( this.contextWrapper.context );
		this.version = 1;
		this.vertexShaderWrapper = null;
		this.fragmentShaderWrapper = null;

		this.uniformLocations = {};

	}

	WebGLProgramWrapper.prototype.attachShader = function() {

		var shaderWrapper = arguments[ 0 ];

		if( shaderWrapper.type == this.contextWrapper.context.VERTEX_SHADER ) this.vertexShaderWrapper = shaderWrapper;
		if( shaderWrapper.type == this.contextWrapper.context.FRAGMENT_SHADER ) this.fragmentShaderWrapper = shaderWrapper;

		return attachShader.apply( this.contextWrapper.context, [ this.program, shaderWrapper.shader ] );

	}

	WebGLProgramWrapper.prototype.highlight = function() {

		detachShader.apply( this.contextWrapper.context, [ this.program, this.fragmentShaderWrapper.shader ] );

		var fs = this.fragmentShaderWrapper.source;
		fs = fs.replace( /\s+main\s*\(/, ' ShaderEditorInternalMain(' );
		fs += '\r\n' + 'void main() { ShaderEditorInternalMain(); gl_FragColor.rgb *= vec3(1.,0.,1.); }';

		var highlightShaderWrapper = new WebGLShaderWrapper( this.contextWrapper, this.contextWrapper.context.FRAGMENT_SHADER );
		highlightShaderWrapper.shaderSource( fs );
		compileShader.apply( this.contextWrapper.context, [ highlightShaderWrapper.shader ] );
		attachShader.apply( this.contextWrapper.context, [ this.program, highlightShaderWrapper.shader ] );
		linkProgram.apply( this.contextWrapper.context, [ this.program ] );

		Object.keys( this.uniformLocations ).forEach( name => {
			this.uniformLocations[ name ].getUniformLocation();
		} );

	}

	WebGLRenderingContextWrapper.prototype.createProgram = function() {

		log( 'create program' );
		return new WebGLProgramWrapper( this );

	}

	WebGLRenderingContextWrapper.prototype.attachShader = function() {

		return arguments[ 0 ].attachShader( arguments[ 1 ] );

	}

	WebGLRenderingContextWrapper.prototype.linkProgram = function() {

		return linkProgram.apply( this.context, [ arguments[ 0 ].program ] );

	}

	WebGLRenderingContextWrapper.prototype.getProgramParameter = function() {

		return getProgramParameter.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

	}

	WebGLRenderingContextWrapper.prototype.getProgramInfoLog = function() {

		return getProgramInfoLog.apply( this.context, [ arguments[ 0 ].program ] );

	}

	WebGLRenderingContextWrapper.prototype.getActiveAttrib = function() {

		return getActiveAttrib.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

	}

	WebGLRenderingContextWrapper.prototype.getAttribLocation = function() {

		return getAttribLocation.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

	}

	WebGLRenderingContextWrapper.prototype.bindAttribLocation = function() {

		return bindAttribLocation.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ], arguments[ 2 ] ] );

	}

	WebGLRenderingContextWrapper.prototype.getActiveUniform = function() {

		return getActiveUniform.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );

	}

	WebGLRenderingContextWrapper.prototype.getUniformLocation = function() {

		return new WebGLUniformLocationWrapper( this.context, arguments[ 0 ], arguments[ 1 ] );

	}

	WebGLRenderingContextWrapper.prototype.useProgram = function() {

		return useProgram.apply( this.context, [ arguments[ 0 ].program ] );

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
			var args = [].slice.call( arguments );
			if( !args[ 0 ] ) return;
			args[ 0 ] = args[ 0 ].uniformLocation;
			return original.apply( this.context, args );
		}
	} );

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

	EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryObjectEXT = function( query, type ) {

		if( type === this.extension.QUERY_RESULT_AVAILABLE_EXT ) {
			return query.getResultsAvailable();
		}

		if( type === this.extension.QUERY_RESULT_EXT ) {
			return query.getTimes();
		}

		return this.extension.getQueryObjectEXT( query.query, type );

	}

	var originalRequestAnimationFrame = window.requestAnimationFrame;
	var rAFQueue = [];

	window.requestAnimationFrame = function( c ) {

		rAFQueue.push( c );

	}

	var extQueries = [];

	function processRequestAnimationFrames() {

		contexts.forEach( ctx => {

			ctx.contextWrapper.resetCount();

			var ext = ctx.queryExt;
			if( ext ) {
				var query = ext.createQueryEXT();
				ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
				extQueries.push( query );
			}
		} );

		var queue = rAFQueue.slice( 0 );
		rAFQueue.length = 0;
		queue.forEach( rAF => {
			rAF();
		} );

		contexts.forEach( ctx => {

			var ext = ctx.queryExt;
			var time = 0;

			if( ext ) {

				ext.endQueryEXT( ext.TIME_ELAPSED_EXT );

				extQueries.forEach( ( query, i ) => {

					var available = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_AVAILABLE_EXT );
					var disjoint = ctx.contextWrapper.context.getParameter( ext.GPU_DISJOINT_EXT );

					if (available && !disjoint) {
						var queryTime = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_EXT );
						time += queryTime;
						extQueries.splice( i, 1 );
					}

				});
			}

			if( ctx.contextWrapper.count ) {
				console.log( ctx.contextWrapper.id, ctx.contextWrapper.count, time );
			}

		} );

		originalRequestAnimationFrame( processRequestAnimationFrames );

	}

	processRequestAnimationFrames();

})();
