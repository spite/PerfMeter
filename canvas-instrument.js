var proto = HTMLCanvasElement.prototype;
var get = proto.getContext;

function WebGLWrapper() {

	log( 'WebGL Wrapper' );

}

HTMLCanvasElement.prototype.getContext = function() {

	log( arguments );
		return get.apply( this, arguments );

/*	if( arguments[ 0 ] === 'webgl' || arguments[ 0 ] === 'experimental-webgl' ) {
		return new WebGLWrapper();
	} else {
		return get.apply( this, arguments );
	}*/

}

const createShader = WebGLRenderingContext.prototype.createShader;
const shaderSource = WebGLRenderingContext.prototype.shaderSource;
const compileShader = WebGLRenderingContext.prototype.compileShader;
const getShaderParameter = WebGLRenderingContext.prototype.getShaderParameter;
const getShaderInfoLog = WebGLRenderingContext.prototype.getShaderInfoLog;
const deleteShader = WebGLRenderingContext.prototype.deleteShader;

function WebGLShaderWrapper( context, type ) {

	this.context = context;
	this.shader = createShader.apply( this.context, [ type ] );
	this.version = 1;
	this.source = null;
	this.type = type;

}

WebGLShaderWrapper.prototype.shaderSource = function( source ) {

	this.source = source;
	return shaderSource.apply( this.context, [ this.shader, source ] );

}

WebGLRenderingContext.prototype.createShader = function() {

	log( 'create shader' );
	return new WebGLShaderWrapper( this, arguments[ 0 ] );

}

WebGLRenderingContext.prototype.shaderSource = function() {

	return arguments[ 0 ].shaderSource( arguments[ 1 ] );

}

WebGLRenderingContext.prototype.compileShader = function() {

	return compileShader.apply( this, [ arguments[ 0 ].shader ] );

}

WebGLRenderingContext.prototype.getShaderParameter = function() {

	return getShaderParameter.apply( this, [ arguments[ 0 ].shader, arguments[ 1 ] ] );

}

WebGLRenderingContext.prototype.getShaderInfoLog = function() {

	return getShaderInfoLog.apply( this, [ arguments[ 0 ].shader ] );

}

WebGLRenderingContext.prototype.deleteShader = function() {

	return deleteShader.apply( this, [ arguments[ 0 ].shader ] );

}

const createProgram = WebGLRenderingContext.prototype.createProgram;
const attachShader = WebGLRenderingContext.prototype.attachShader;
const linkProgram = WebGLRenderingContext.prototype.linkProgram;
const getProgramParameter = WebGLRenderingContext.prototype.getProgramParameter;
const getProgramInfoLog = WebGLRenderingContext.prototype.getProgramInfoLog;
const getActiveAttrib = WebGLRenderingContext.prototype.getActiveAttrib;
const getAttribLocation = WebGLRenderingContext.prototype.getAttribLocation;
const bindAttribLocation = WebGLRenderingContext.prototype.bindAttribLocation;
const getActiveUniform = WebGLRenderingContext.prototype.getActiveUniform;
const getUniformLocation = WebGLRenderingContext.prototype.getUniformLocation;
const useProgram = WebGLRenderingContext.prototype.useProgram;

window.programs = [];

function WebGLProgramWrapper( context ) {

	this.context = context;
	this.program = createProgram.apply( this.context );
	this.version = 1;
	this.vertexShader = null;
	this.fragmentShader = null;

	window.programs.push( this )

}

WebGLProgramWrapper.prototype.attachShader = function() {

	const shaderWrapper = arguments[ 0 ];

	if( shaderWrapper.type == this.context.VERTEX_SHADER ) this.vertexShader = shaderWrapper;
	if( shaderWrapper.type == this.context.FRAGMENT_SHADER ) this.fragmentShader = shaderWrapper;

	return attachShader.apply( this.context, [ this.program, shaderWrapper.shader ] );

}

WebGLRenderingContext.prototype.createProgram = function() {

	log( 'create program' );
	return new WebGLProgramWrapper( this );

}

WebGLRenderingContext.prototype.attachShader = function() {

	return arguments[ 0 ].attachShader( arguments[ 1 ] );

}

WebGLRenderingContext.prototype.linkProgram = function() {

	return linkProgram.apply( this, [ arguments[ 0 ].program ] );

}

WebGLRenderingContext.prototype.getProgramParameter = function() {

	return getProgramParameter.apply( this, [ arguments[ 0 ].program, arguments[ 1 ] ] );

}

WebGLRenderingContext.prototype.getProgramInfoLog = function() {

	return getProgramInfoLog.apply( this, [ arguments[ 0 ].program ] );

}

WebGLRenderingContext.prototype.getActiveAttrib = function() {

	return getActiveAttrib.apply( this, [ arguments[ 0 ].program, arguments[ 1 ] ] );

}

WebGLRenderingContext.prototype.getAttribLocation = function() {

	return getAttribLocation.apply( this, [ arguments[ 0 ].program, arguments[ 1 ] ] );

}

WebGLRenderingContext.prototype.bindAttribLocation = function() {

	return bindAttribLocation.apply( this, [ arguments[ 0 ].program, arguments[ 1 ], arguments[ 2 ] ] );

}

WebGLRenderingContext.prototype.getActiveUniform = function() {

	return getActiveUniform.apply( this, [ arguments[ 0 ].program, arguments[ 1 ] ] );

}

WebGLRenderingContext.prototype.getUniformLocation = function() {

	return getUniformLocation.apply( this, [ arguments[ 0 ].program, arguments[ 1 ] ] );

}

WebGLRenderingContext.prototype.useProgram = function() {

	return useProgram.apply( this, [ arguments[ 0 ].program ] );

}

const getExtension = WebGLRenderingContext.prototype.getExtension;

function WebGLDebugShadersExtensionWrapper( context ) {

	this.context = context;
	this.extension = getExtension.apply( this.context, [ 'WEBGL_debug_shaders' ] );

}

WebGLDebugShadersExtensionWrapper.prototype.getTranslatedShaderSource = function( shaderWrapper ) {

	return this.extension.getTranslatedShaderSource( shaderWrapper.shader );

}

WebGLRenderingContext.prototype.getExtension = function() {

	var extensionName = arguments[ 0 ];

	switch( extensionName ) {
		case 'WEBGL_debug_shaders':
		return new WebGLDebugShadersExtensionWrapper( this );
		break;
	}

	return getExtension.apply( this, [ extensionName ] );

}
