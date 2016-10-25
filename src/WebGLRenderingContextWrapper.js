import{ Wrapper } from "./Wrapper";
import{ ContextWrapper } from "./ContextWrapper";

import{ EXTDisjointTimerQueryExtensionWrapper } from "./extensions/EXTDisjointTimerQueryExtensionWrapper";
import{ WebGLDebugShadersExtensionWrapper } from "./extensions/WebGLDebugShadersExtensionWrapper";
import{ ANGLEInstancedArraysExtensionWrapper } from "./extensions/ANGLEInstancedArraysExtensionWrapper";

function WebGLRenderingContextWrapper( context ){

	ContextWrapper.call( this, context );

	this.queryStack = [];
	this.activeQuery = null;
	this.queryExt = null;

	this.drawQueries = [];

	this.programCount = 0;
	this.textureCount = 0;
	this.framebufferCount = 0;

	this.useProgramCount = 0;
	this.bindTextureCount = 0;
	this.bindFramebufferCount = 0;

	this.drawArraysCalls = 0;
	this.drawElementsCalls = 0;

	this.instancedDrawArraysCalls = 0;
	this.instancedDrawElementsCalls = 0;

	this.pointsCount = 0;
	this.linesCount = 0;
	this.trianglesCount = 0;

	this.instancedPointsCount = 0;
	this.instancedLinesCount = 0;
	this.instancedTrianglesCount = 0;

	this.frameId = null;
	this.currentProgram = null;
	this.boundTexture2D = null;
	this.boundTextureCube = null;

	this.textures = new Map();

	this.boundBuffer = null;

	this.buffers = new Map();

}

WebGLRenderingContextWrapper.prototype = Object.create( ContextWrapper.prototype );

WebGLRenderingContextWrapper.prototype.cloned = false;

cloneWebGLRenderingContextPrototype();

WebGLRenderingContextWrapper.prototype.setFrameId = function( frameId ) {

	this.frameId = frameId;

}

WebGLRenderingContextWrapper.prototype.resetFrame = function(){

	ContextWrapper.prototype.resetFrame.call( this );

	this.useProgramCount = 0;
	this.bindTextureCount = 0;
	this.bindFramebufferCount = 0;

	this.drawArraysCalls = 0;
	this.drawElementsCalls = 0;

	this.instancedDrawArraysCalls = 0;
	this.instancedDrawElementsCalls = 0;

	this.pointsCount = 0;
	this.linesCount = 0;
	this.trianglesCount = 0;

	this.instancedPointsCount = 0;
	this.instancedLinesCount = 0;
	this.instancedTrianglesCount = 0;

}

function cloneWebGLRenderingContextPrototype(){

	// some sites (e.g. http://codeflow.org/webgl/deferred-irradiance-volumes/www/)
	// modify the prototype, and they do it after the initial check for support

	// if( WebGLRenderingContextWrapper.prototype.cloned ) return;
	// WebGLRenderingContextWrapper.prototype.cloned = true;

	Object.keys( WebGLRenderingContext.prototype ).forEach( key => {

		// .canvas is weird, so it's directly assigned when creating the wrapper

		if( key !== 'canvas' ){

			try{
				if( typeof WebGLRenderingContext.prototype[ key ] === 'function' ){
					WebGLRenderingContextWrapper.prototype[ key ] = function(){
						var args = new Array(arguments.length);
						for (var i = 0, l = arguments.length; i < l; i++){
							args[i] = arguments[i];
						}
						return this.run( key, args, _ => {
							return WebGLRenderingContext.prototype[ key ].apply( this.context, args );
						});
					}
				} else {
					WebGLRenderingContextWrapper.prototype[ key ] = WebGLRenderingContext.prototype[ key ];
				}
			} catch( e ){
				Object.defineProperty( WebGLRenderingContext.prototype, key, {
					get: function (){ return this.context[ key ]; },
					set: function ( v ){ this.context[ key ] = v; }
				});
			}

		}

	});

	instrumentWebGLRenderingContext();

}

WebGLRenderingContextWrapper.prototype.getTextureMemory = function() {

	var memory = 0;

	this.textures.forEach( t => {

		memory += t.size;

	});

	return memory;

}

WebGLRenderingContextWrapper.prototype.getBufferMemory = function() {

	var memory = 0;

	this.buffers.forEach( b => {

		memory += b.size;

	});

	return memory;

}

const extensionWrappers = {
	WEBGL_debug_shaders: WebGLDebugShadersExtensionWrapper,
	EXT_disjoint_timer_query: EXTDisjointTimerQueryExtensionWrapper,
	ANGLE_instanced_arrays: ANGLEInstancedArraysExtensionWrapper
};

WebGLRenderingContextWrapper.prototype.getExtension = function(){

	var extensionName = arguments[ 0 ];

	return this.run( 'getExtension', arguments, _ => {

		var wrapper = extensionWrappers[ extensionName ];
		if( wrapper ) {
			return new wrapper( this );
		}

		return this.context.getExtension( extensionName );

	});

}

WebGLRenderingContextWrapper.prototype.updateDrawCount = function( mode, count ){

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

WebGLRenderingContextWrapper.prototype.updateInstancedDrawCount = function( mode, count ){

	var gl = this.context;

	switch( mode ){
		case gl.POINTS:
			this.instancedPointsCount += count;
			break;
		case gl.LINE_STRIP:
			this.instancedLinesCount += count - 1;
			break;
		case gl.LINE_LOOP:
			this.instancedLinesCount += count;
			break;
		case gl.LINES:
			this.instancedLinesCount += count / 2;
			break;
		case gl.TRIANGLE_STRIP:
		case gl.TRIANGLE_FAN:
			this.instancedTrianglesCount += count - 2;
			break;
		case gl.TRIANGLES:
			this.instancedTrianglesCount += count / 3;
			break;
	}

};

WebGLRenderingContextWrapper.prototype.drawElements = function(){

	this.drawElementsCalls++;
	this.updateDrawCount( arguments[ 0 ], arguments[ 1 ] );

	return this.run( 'drawElements', arguments, _ => {

		var program = this.context.getParameter( this.context.CURRENT_PROGRAM );
		if( program !== this.currentProgram.program ) {
			debugger;
		}

		if( settings.profileShaders ) {
			var ext = this.queryExt;
			var query = ext.createQueryEXT();
			ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
			this.drawQueries.push( {
				query,
				program: this.currentProgram,
				frameId: this.frameId
			} );
		}

		var res = WebGLRenderingContext.prototype.drawElements.apply( this.context, arguments );

		if( settings.profileShaders ) {
			ext.endQueryEXT( ext.TIME_ELAPSED_EXT );
		}

		return res;

	});

}

WebGLRenderingContextWrapper.prototype.drawArrays = function(){

	this.drawArraysCalls++;
	this.updateDrawCount( arguments[ 0 ], arguments[ 2 ] );

	return this.run( 'drawArrays', arguments, _ => {

		var program = this.context.getParameter( this.context.CURRENT_PROGRAM );
		if( program !== this.currentProgram.program ) {
			debugger;
		}

		if( settings.profileShaders ) {
			var ext = this.queryExt;
			var query = ext.createQueryEXT();
			ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
			this.drawQueries.push( {
				query,
				program: this.currentProgram,
				frameId: this.frameId
			} );
		}

		var res = WebGLRenderingContext.prototype.drawArrays.apply( this.context, arguments );

		if( settings.profileShaders ) {
			ext.endQueryEXT( ext.TIME_ELAPSED_EXT );
		}

		return res;

	});

}

const formats = {}
formats[ WebGLRenderingContext.prototype.ALPHA ] = 1;
formats[ WebGLRenderingContext.prototype.RGB ] = 3;
formats[ WebGLRenderingContext.prototype.RGBA ] = 4;
formats[ WebGLRenderingContext.prototype.RGBA ] = 4;
formats[ WebGLRenderingContext.prototype.LUMINANCE ] = 1;
formats[ WebGLRenderingContext.prototype.LUMINANCE_ALPHA ] = 1;
formats[ WebGLRenderingContext.prototype.DEPTH_COMPONENT ] = 1;

const types = {}
types[ WebGLRenderingContext.prototype.UNSIGNED_BYTE ] = 1;
types[ WebGLRenderingContext.prototype.FLOAT ] = 4;
types[ 36193 ] = 2; // OESTextureHalfFloat.HALF_FLOAT_OES
types[ WebGLRenderingContext.prototype.UNSIGNED_INT ] = 4;

function WebGLShaderWrapper( contextWrapper, type ){

	Wrapper.call( this );

	this.contextWrapper = contextWrapper;
	this.shader = WebGLRenderingContext.prototype.createShader.apply( this.contextWrapper.context, [ type ] );
	this.version = 1;
	this.source = null;
	this.type = type;

}

WebGLShaderWrapper.prototype = Object.create( Wrapper.prototype );

WebGLShaderWrapper.prototype.shaderSource = function( source ){

	this.source = source;
	return WebGLRenderingContext.prototype.shaderSource.apply( this.contextWrapper.context, [ this.shader, source ] );

}

function WebGLUniformLocationWrapper( contextWrapper, program, name ){

	Wrapper.call( this );

	this.contextWrapper = contextWrapper;
	this.program = program;
	this.name = name;
	this.getUniformLocation();

	this.program.uniformLocations[ this.name ] = this;

	//log( 'Location for uniform', name, 'on program', this.program.uuid );

}

WebGLUniformLocationWrapper.prototype = Object.create( Wrapper.prototype );

WebGLUniformLocationWrapper.prototype.getUniformLocation = function(){

	this.uniformLocation = WebGLRenderingContext.prototype.getUniformLocation.apply( this.contextWrapper, [ this.program.program, this.name ] );

}

function WebGLProgramWrapper( contextWrapper ){

	Wrapper.call( this );

	this.contextWrapper = contextWrapper;
	this.program = WebGLRenderingContext.prototype.createProgram.apply( this.contextWrapper.context );
	this.version = 1;
	this.vertexShaderWrapper = null;
	this.fragmentShaderWrapper = null;

	this.uniformLocations = {};

}

WebGLProgramWrapper.prototype = Object.create( Wrapper.prototype );

WebGLProgramWrapper.prototype.attachShader = function(){

	var shaderWrapper = arguments[ 0 ];

	if( shaderWrapper.type == this.contextWrapper.context.VERTEX_SHADER ) this.vertexShaderWrapper = shaderWrapper;
	if( shaderWrapper.type == this.contextWrapper.context.FRAGMENT_SHADER ) this.fragmentShaderWrapper = shaderWrapper;

	return this.contextWrapper.run( 'attachShader', arguments, _ => {
		return WebGLRenderingContext.prototype.attachShader.apply( this.contextWrapper.context, [ this.program, shaderWrapper.shader ] );
	});

}

WebGLProgramWrapper.prototype.detachShader = function(){

	var shaderWrapper = arguments[ 0 ];

	return this.contextWrapper.run( 'detachShader', arguments, _ => {
		return WebGLRenderingContext.prototype.detachShader.apply( this.contextWrapper.context, [ this.program, shaderWrapper.shader ] );
	});

}

WebGLProgramWrapper.prototype.highlight = function(){

	this.contextWrapper.context.detachShader.apply( this.contextWrapper.context, [ this.program, this.fragmentShaderWrapper.shader ] );

	var fs = this.fragmentShaderWrapper.source;
	fs = fs.replace( /\s+main\s*\(/, ' ShaderEditorInternalMain(' );
	fs += '\r\n' + 'void main(){ ShaderEditorInternalMain(); gl_FragColor.rgb *= vec3(1.,0.,1.); }';

	var highlightShaderWrapper = new WebGLShaderWrapper( this.contextWrapper, this.contextWrapper.context.FRAGMENT_SHADER );
	highlightShaderWrapper.shaderSource( fs );
	WebGLRenderingContext.prototype.compileShader.apply( this.contextWrapper.context, [ highlightShaderWrapper.shader ] );
	WebGLRenderingContext.prototype.attachShader.apply( this.contextWrapper.context, [ this.program, highlightShaderWrapper.shader ] );
	WebGLRenderingContext.prototype.linkProgram.apply( this.contextWrapper.context, [ this.program ] );

	Object.keys( this.uniformLocations ).forEach( name => {
		this.uniformLocations[ name ].getUniformLocation();
	});

}

function WebGLTextureWrapper( contextWrapper ) {

	Wrapper.call( this );

	log( 'createTexture', this.uuid );

	this.contextWrapper = contextWrapper;
	this.texture = this.contextWrapper.context.createTexture();

	this.contextWrapper.textures.set( this, this );

	this.size = 0;

}

WebGLTextureWrapper.prototype = Object.create( Wrapper.prototype );

WebGLTextureWrapper.prototype.computeTextureMemoryUsage = function() {

	log( 'texImaged2D', arguments );

	if( arguments.length === 6 ) {

		// texImage2D(target, level, internalformat, format, type, ImageData? pixels);
		// texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
		// texImage2D(target, level, internalformat, format, type, HTMLCanvasElement? pixels);
		// texImage2D(target, level, internalformat, format, type, HTMLVideoElement? pixels);

		var size = formats[ arguments[ 2 ] ] * types[ arguments[ 4 ] ];
		if( isNaN( size ) ) debugger;
		var width = 0;
		var height = 0;

		if( arguments[ 5 ] instanceof HTMLImageElement ) {
			width = arguments[ 5 ].naturalWidth;
			height = arguments[ 5 ].naturalHeight;
		}

		if( arguments[ 5 ] instanceof HTMLCanvasElement || arguments[ 5 ] instanceof ImageData ) {
			width = arguments[ 5 ].width;
			height = arguments[ 5 ].height;
		}

		if( arguments[ 5 ] instanceof HTMLVideoElement ) {
			width = arguments[ 5 ].videoWidth;
			height = arguments[ 5 ].videoHeight;
		}

		var memory = width * height * size;
		this.size = memory;

		log( 'computeTextureMemoryUsage', width, height, size, memory, 'bytes' );

	} else if( arguments.length === 9 ) {

		// texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);

		var size = formats[ arguments[ 2 ] ] * types[ arguments[ 7 ] ];
		if( isNaN( size ) ) debugger;
		var width = arguments[ 3 ]
		var height = arguments[ 4 ];

		var memory = width * height * size;
		this.size = memory;

		log( 'computeTextureMemoryUsage', width, height, size, memory, 'bytes' );

	} else {

		log( 'ARGUMENTS LENGTH NOT RECOGNISED' );

	}

}

function WebGLBufferWrapper( contextWrapper ) {

	Wrapper.call( this );

	this.contextWrapper = contextWrapper;
	this.buffer = this.contextWrapper.context.createBuffer();

	this.contextWrapper.buffers.set( this, this );

	this.size = 0;

}

WebGLBufferWrapper.prototype = Object.create( Wrapper.prototype );

function instrumentWebGLRenderingContext(){

	WebGLRenderingContextWrapper.prototype.createShader = function(){

		//log( 'create shader' );
		return this.run( 'createShader', arguments, _ => {
			return new WebGLShaderWrapper( this, arguments[ 0 ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.shaderSource = function(){

		return this.run( 'shaderSource', arguments, _ => {
			return arguments[ 0 ].shaderSource( arguments[ 1 ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.compileShader = function(){

		return this.run( 'compileShader', arguments, _ => {
			return WebGLRenderingContext.prototype.compileShader.apply( this.context, [ arguments[ 0 ].shader ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getShaderParameter = function(){

		return this.run( 'getShaderParameter', arguments, _ => {
			return WebGLRenderingContext.prototype.getShaderParameter.apply( this.context, [ arguments[ 0 ].shader, arguments[ 1 ] ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getShaderInfoLog = function(){

		return this.run( 'getShaderInfoLog', arguments, _ => {
			return WebGLRenderingContext.prototype.getShaderInfoLog.apply( this.context, [ arguments[ 0 ].shader ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.deleteShader = function(){

		return this.run( 'deleteShader', arguments, _ => {
			return WebGLRenderingContext.prototype.deleteShader.apply( this.context, [ arguments[ 0 ].shader ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.createProgram = function(){

		log( 'create program' );
		this.programCount++;
		return this.run( 'createProgram', arguments, _ => {
			return new WebGLProgramWrapper( this );
		});

	}

	WebGLRenderingContextWrapper.prototype.deleteProgram = function( programWrapper ){

		this.incrementCount();
		this.programCount--;
		return this.run( 'deleteProgram', arguments, _ => {
			return WebGLRenderingContext.prototype.deleteProgram.apply( this.context, [ programWrapper.program ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.attachShader = function(){

		return arguments[ 0 ].attachShader( arguments[ 1 ] );

	}

	WebGLRenderingContextWrapper.prototype.detachShader = function(){

		return arguments[ 0 ].detachShader( arguments[ 1 ] );

	}

	WebGLRenderingContextWrapper.prototype.linkProgram = function(){

		return this.run( 'linkProgram', arguments, _ => {
			return WebGLRenderingContext.prototype.linkProgram.apply( this.context, [ arguments[ 0 ].program ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.validateProgram = function(){

		return this.run( 'validateProgram', arguments, _ => {
			return WebGLRenderingContext.prototype.validateProgram.apply( this.context, [ arguments[ 0 ].program ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getProgramParameter = function(){

		return this.run( 'getProgramParameter', arguments, _ => {
			return WebGLRenderingContext.prototype.getProgramParameter.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getProgramInfoLog = function(){

		return this.run( 'getProgramInfoLog', arguments, _ => {
			return WebGLRenderingContext.prototype.getProgramInfoLog.apply( this.context, [ arguments[ 0 ].program ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getActiveAttrib = function(){

		return this.run( 'getActiveAttrib', arguments, _ => {
			return WebGLRenderingContext.prototype.getActiveAttrib.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getAttribLocation = function(){

		return this.run( 'getAttribLocation', arguments, _ => {
			return WebGLRenderingContext.prototype.getAttribLocation.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.bindAttribLocation = function(){

		return this.run( 'bindAttribLocation', arguments, _ => {
			return WebGLRenderingContext.prototype.bindAttribLocation.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ], arguments[ 2 ] ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getActiveUniform = function(){

		return this.run( 'getActiveUniform', arguments, _ => {
			return WebGLRenderingContext.prototype.getActiveUniform.apply( this.context, [ arguments[ 0 ].program, arguments[ 1 ] ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.getUniformLocation = function(){

		return this.run( 'getUniformLocation', arguments, _ => {
			return new WebGLUniformLocationWrapper( this.context, arguments[ 0 ], arguments[ 1 ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.useProgram = function(){

		this.useProgramCount++;
		this.currentProgram = arguments[ 0 ];
		return this.run( 'useProgram', arguments, _ => {
			return WebGLRenderingContext.prototype.useProgram.apply( this.context, [ arguments[ 0 ] ? arguments[ 0 ].program : null ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.createTexture = function(){

		this.textureCount++;
		return this.run( 'createTexture', arguments, _ => {
			return new WebGLTextureWrapper( this );
		});

	}

	WebGLRenderingContextWrapper.prototype.deleteTexture = function(){

		this.textures.delete( arguments[ 0 ] );
		this.textureCount--;

		return this.run( 'deleteTexture', arguments, _ => {
			return WebGLRenderingContext.prototype.deleteTexture.apply( this.context, [ arguments[ 0 ].texture ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.isTexture = function(){

		return this.run( 'isTexture', arguments, _ => {
			return WebGLRenderingContext.prototype.isTexture.apply( this.context, [ arguments[ 0 ].texture ] );
		});

	}

	WebGLRenderingContextWrapper.prototype.bindTexture = function(){

		log( 'bindTexture', arguments[ 1 ] );

		this.bindTextureCount++;
		if( arguments[ 0 ] === WebGLRenderingContext.prototype.TEXTURE_2D ) {
			this.boundTexture2D = arguments[ 1 ];
		}
		if( arguments[ 0 ] === WebGLRenderingContext.prototype.TEXTURE_CUBE_MAP ) {
			this.boundTextureCube = arguments[ 1 ];
		}

		return this.run( 'bindTexture', arguments, _ => {
			return WebGLRenderingContext.prototype.bindTexture.apply(
				this.context,
				[
					arguments[ 0 ],
					arguments[ 1 ] ? arguments[ 1 ].texture : null
				]
			);
		});

	}

	WebGLRenderingContextWrapper.prototype.texImage2D = function(){

		if( arguments[ 0 ] === WebGLRenderingContext.prototype.TEXTURE_2D ) {
			this.boundTexture2D.computeTextureMemoryUsage.apply( this.boundTexture2D, arguments );
		}

		return this.run( 'texImage2D', arguments, _ => {
			return WebGLRenderingContext.prototype.texImage2D.apply(
				this.context,
				arguments
			);
		});

	}

	WebGLRenderingContextWrapper.prototype.framebufferTexture2D = function(){

		return this.run( 'framebufferTexture2D', arguments, _ => {
			return WebGLRenderingContext.prototype.framebufferTexture2D.apply(
				this.context,
				[
					arguments[ 0 ],
					arguments[ 1 ],
					arguments[ 2 ],
					arguments[ 3 ].texture,
					arguments[ 4 ]
				] );
		});

	}

	WebGLRenderingContextWrapper.prototype.createFramebuffer = function() {

		this.framebufferCount++;
		return this.run( 'createFramebuffer', arguments, _ => {
			return WebGLRenderingContext.prototype.createFramebuffer.apply( this.context, arguments );
		});

	}

	WebGLRenderingContextWrapper.prototype.deleteFramebuffer = function() {

		this.framebufferCount--;
		return this.run( 'deleteFramebuffer', arguments, _ => {
			return WebGLRenderingContext.prototype.deleteFramebuffer.apply( this.context, arguments );
		});

	}

	WebGLRenderingContextWrapper.prototype.bindFramebuffer = function() {

		this.bindFramebufferCount++;
		return this.run( 'bindFramebuffer', arguments, _ => {
			return WebGLRenderingContext.prototype.bindFramebuffer.apply( this.context, arguments );
		});

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

		WebGLRenderingContextWrapper.prototype[ method ] = function(){

			var args = new Array(arguments.length);
			for (var i = 0, l = arguments.length; i < l; i++){
				args[i] = arguments[i];
			}
			if( !args[ 0 ] ) return;
			args[ 0 ] = args[ 0 ].uniformLocation;
			return this.run( method, args, _ => {
				return original.apply( this.context, args );
			});

		}

	});

	WebGLRenderingContextWrapper.prototype.createBuffer = function() {

		return this.run( 'createBuffer', arguments, _ => {
			return new WebGLBufferWrapper( this );
		});

	}


	WebGLRenderingContextWrapper.prototype.bufferData = function() {

		this.boundBuffer.size = arguments[ 1 ].length;

		return this.run( 'bufferData', arguments, _ => {
			return WebGLRenderingContext.prototype.bufferData.apply( this.context, arguments );
		});

	}

	WebGLRenderingContextWrapper.prototype.bindBuffer = function() {

		this.boundBuffer = arguments[ 1 ];

		return this.run( 'bindBuffer', arguments, _ => {
			return WebGLRenderingContext.prototype.bindBuffer.apply(
				this.context,
				[
					arguments[ 0 ],
					arguments[ 1 ] ? arguments[ 1 ].buffer : null
				]
			);
		});

	}

}

export { WebGLRenderingContextWrapper };
