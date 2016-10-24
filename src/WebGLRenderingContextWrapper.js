import{ createUUID } from "./utils";
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

function WebGLShaderWrapper( contextWrapper, type ){

	this.id = createUUID();
	this.contextWrapper = contextWrapper;
	this.shader = WebGLRenderingContext.prototype.createShader.apply( this.contextWrapper.context, [ type ] );
	this.version = 1;
	this.source = null;
	this.type = type;

}

WebGLShaderWrapper.prototype.shaderSource = function( source ){

	this.source = source;
	return WebGLRenderingContext.prototype.shaderSource.apply( this.contextWrapper.context, [ this.shader, source ] );

}

function WebGLUniformLocationWrapper( contextWrapper, program, name ){

	this.id = createUUID();
	this.contextWrapper = contextWrapper;
	this.program = program;
	this.name = name;
	this.getUniformLocation();

	this.program.uniformLocations[ this.name ] = this;

	//log( 'Location for uniform', name, 'on program', this.program.id );

}

WebGLUniformLocationWrapper.prototype.getUniformLocation = function(){

	this.uniformLocation = WebGLRenderingContext.prototype.getUniformLocation.apply( this.contextWrapper, [ this.program.program, this.name ] );

}

function WebGLProgramWrapper( contextWrapper ){

	this.id = createUUID();
	this.contextWrapper = contextWrapper;
	this.program = WebGLRenderingContext.prototype.createProgram.apply( this.contextWrapper.context );
	this.version = 1;
	this.vertexShaderWrapper = null;
	this.fragmentShaderWrapper = null;

	this.uniformLocations = {};

}

WebGLProgramWrapper.prototype.attachShader = function(){

	var shaderWrapper = arguments[ 0 ];

	if( shaderWrapper.type == this.contextWrapper.context.VERTEX_SHADER ) this.vertexShaderWrapper = shaderWrapper;
	if( shaderWrapper.type == this.contextWrapper.context.FRAGMENT_SHADER ) this.fragmentShaderWrapper = shaderWrapper;

	return this.contextWrapper.run( 'attachShader', arguments, _ => {
		return WebGLRenderingContext.prototype.attachShader.apply( this.contextWrapper.context, [ this.program, shaderWrapper.shader ] );
	});

}

WebGLProgramWrapper.prototype.highlight = function(){

	detachShader.apply( this.contextWrapper.context, [ this.program, this.fragmentShaderWrapper.shader ] );

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

function instrumentWebGLRenderingContext(){

	WebGLRenderingContextWrapper.prototype.createShader = function(){

		log( 'create shader' );
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
			return WebGLRenderingContext.prototype.createTexture.apply( this.context, arguments );
		});

	}

	WebGLRenderingContextWrapper.prototype.deleteTexture = function(){

		this.textureCount--;
		return this.run( 'deleteTexture', arguments, _ => {
			return WebGLRenderingContext.prototype.deleteTexture.apply( this.context, arguments );
		});

	}

	WebGLRenderingContextWrapper.prototype.bindTexture = function(){

		this.bindTextureCount++;
		return this.run( 'bindTexture', arguments, _ => {
			return WebGLRenderingContext.prototype.bindTexture.apply( this.context, arguments );
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

}

export { WebGLRenderingContextWrapper };
