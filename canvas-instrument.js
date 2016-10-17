var proto = HTMLCanvasElement.prototype;
var get = proto.getContext;

function WebGLWrapper() {

	log( 'WebGL Wrapper' );

}

function createUUID() {

	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();

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
const detachShader = WebGLRenderingContext.prototype.detachShader;
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

function WebGLUniformLocationWrapper( context, program, name ) {

	this.id = createUUID();
	this.context = context;
	this.program = program;
	this.name = name;
	this.getUniformLocation();

	this.program.uniformLocations[ this.name ] = this;

	log( 'Location for uniform', name, 'on program', this.program.id );

}

WebGLUniformLocationWrapper.prototype.getUniformLocation = function() {

	this.uniformLocation = getUniformLocation.apply( this.context, [ this.program.program, this.name ] );

}

function WebGLProgramWrapper( context ) {

	this.id = createUUID();
	this.context = context;
	this.program = createProgram.apply( this.context );
	this.version = 1;
	this.vertexShaderWrapper = null;
	this.fragmentShaderWrapper = null;

	this.uniformLocations = {};

	window.programs.push( this )

}

WebGLProgramWrapper.prototype.attachShader = function() {

	const shaderWrapper = arguments[ 0 ];

	if( shaderWrapper.type == this.context.VERTEX_SHADER ) this.vertexShaderWrapper = shaderWrapper;
	if( shaderWrapper.type == this.context.FRAGMENT_SHADER ) this.fragmentShaderWrapper = shaderWrapper;

	return attachShader.apply( this.context, [ this.program, shaderWrapper.shader ] );

}

WebGLProgramWrapper.prototype.highlight = function() {

	detachShader.apply( this.context, [ this.program, this.fragmentShaderWrapper.shader ] );

	let fs = this.fragmentShaderWrapper.source;
	fs = fs.replace( /\s+main\s*\(/, ' ShaderEditorInternalMain(' );
	fs += '\r\n' + 'void main() { ShaderEditorInternalMain(); gl_FragColor.rgb *= vec3(1.,0.,1.); }';

	let highlightShaderWrapper = new WebGLShaderWrapper( this.context, this.context.FRAGMENT_SHADER );
	highlightShaderWrapper.shaderSource( fs );
	compileShader.apply( this.context, [ highlightShaderWrapper.shader ] );
	attachShader.apply( this.context, [ this.program, highlightShaderWrapper.shader ] );
	linkProgram.apply( this.context, [ this.program ] );

	Object.keys( this.uniformLocations ).forEach( name => {
		this.uniformLocations[ name ].getUniformLocation();
	} );

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

	return new WebGLUniformLocationWrapper( this, arguments[ 0 ], arguments[ 1 ] );

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
		case 'EXT_disjoint_timer_query':
		return new EXTDisjointTimerQueryExtensionWrapper( this );
		break;
	}

	return getExtension.apply( this, [ extensionName ] );

}

const methods = [
	'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv',
	'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv',
	'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv',
	'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv',
	'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'
];

const originalMethods = {};

methods.forEach( method => {
	const original = WebGLRenderingContext.prototype[ method ];
	originalMethods[ method ] = original;
	WebGLRenderingContext.prototype[ method ] = function() {
		const args = arguments;
		if( !args[ 0 ] ) return;
		args[ 0 ] = args[ 0 ].uniformLocation;
		return original.apply( this, args );
	}
} );

const queryStack = [];
let activeQuery = null;

function WebGLTimerQueryEXTWrapper( context, extension ) {

	this.context = context;
	this.extension = extension;
	this.query = this.extension.createQueryEXT();
	this.time = 0;
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

function EXTDisjointTimerQueryExtensionWrapper( context ) {

	this.context = context;
	this.extension = getExtension.apply( this.context, [ 'EXT_disjoint_timer_query' ] );

	this.QUERY_RESULT_AVAILABLE_EXT = this.extension.QUERY_RESULT_AVAILABLE_EXT;
	this.GPU_DISJOINT_EXT = this.extension.GPU_DISJOINT_EXT;
	this.QUERY_RESULT_EXT = this.extension.QUERY_RESULT_EXT;
	this.TIME_ELAPSED_EXT = this.extension.TIME_ELAPSED_EXT;

}

EXTDisjointTimerQueryExtensionWrapper.prototype.createQueryEXT = function() {

	return new WebGLTimerQueryEXTWrapper( this.context, this.extension );

}

EXTDisjointTimerQueryExtensionWrapper.prototype.beginQueryEXT = function( type, query ) {

	if( activeQuery ){
		this.extension.endQueryEXT( type );
		activeQuery.nested.push( query );
		queryStack.push( activeQuery );
	}

	activeQuery = query;

	return this.extension.beginQueryEXT( type, query.query );

}

EXTDisjointTimerQueryExtensionWrapper.prototype.endQueryEXT = function( type ) {

	activeQuery = queryStack.pop();
	let res = this.extension.endQueryEXT( type );
	if( activeQuery ) {
		let newQuery = new WebGLTimerQueryEXTWrapper( this.context, this.extension );
		activeQuery.nested.push( newQuery );
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
