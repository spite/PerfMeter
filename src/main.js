import{ Wrapper } from "./Wrapper";

import { CanvasRenderingContext2DWrapper } from "./CanvasRenderingContext2DWrapper"
import { WebGLRenderingContextWrapper } from "./WebGLRenderingContextWrapper"

import { setInfo } from "./widget";

window.addEventListener( 'perfmeter-settings', e => {
	settings = e.detail;
} );

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

setInfo( webGLInfo );

function FrameData( id ){

	this.frameId = id;

	this.framerate = 0;
	this.frameTime = 0;
	this.JavaScriptTime = 0;

	this.contexts = new Map();

}

function ContextFrameData( type ){

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

	this.startTime = 0;

}

function ContextData( contextWrapper ){

	Wrapper.call( this );

	this.queryExt = null;
	this.contextWrapper = contextWrapper;
	this.extQueries = [];

	this.metrics = {}

}

ContextData.prototype = Object.create( Wrapper.prototype );

var contexts = [];
var canvasContexts = new WeakMap();

var getContext = HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.getContext = function(){

	var c = canvasContexts.get( this );
	if( c ){
		log( arguments, '(CACHED)' );
		return c;
	} else {
		log( arguments );
	}

	var context = getContext.apply( this, arguments );

	if( arguments[ 0 ] === 'webgl' || arguments[ 0 ] === 'experimental-webgl' ){

		var wrapper = new WebGLRenderingContextWrapper( context );
		wrapper.canvas = this;
		var cData = new ContextData( wrapper );
		cData.queryExt = wrapper.getExtension( 'EXT_disjoint_timer_query' );
		wrapper.queryExt = cData.queryExt;
		contexts.push( cData );
		canvasContexts.set( this, wrapper );
		return wrapper;

	}

	if( arguments[ 0 ] === '2d' ){

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

//
// This is the rAF queue processing
//

var originalRequestAnimationFrame = window.requestAnimationFrame;
var rAFQueue = [];
var frameCount = 0;
var frameId = 0;
var framerate = 0;
var lastTime = 0;

window.requestAnimationFrame = function( c ){

	rAFQueue.push( c );

}

function processRequestAnimationFrames( timestamp ){

	contexts.forEach( ctx => {

		ctx.contextWrapper.setFrameId( frameId );
		ctx.contextWrapper.resetFrame();

		var ext = ctx.queryExt;

		if( ext ){

			var query = ext.createQueryEXT();
			ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
			ctx.extQueries.push({
				query,
				frameId
			});

		}

	});

	var startTime = performance.now();

	var queue = rAFQueue.slice( 0 );
	rAFQueue.length = 0;
	queue.forEach( rAF => {
		rAF( timestamp );
	});

	var endTime = performance.now();
	var frameTime = endTime - startTime;

	frameCount++;
	if( endTime > lastTime + 1000 ) {
		framerate = frameCount * 1000 / ( endTime - lastTime );
		frameCount = 0;
		lastTime = endTime;
	}

	frameId++;

	contexts.forEach( ctx => {

		var ext = ctx.queryExt;

		if( ext ){

			ext.endQueryEXT( ext.TIME_ELAPSED_EXT );

			ctx.extQueries.forEach( ( query, i ) => {

				var available = ext.getQueryObjectEXT( query.query, ext.QUERY_RESULT_AVAILABLE_EXT );
				var disjoint = ctx.contextWrapper.context.getParameter( ext.GPU_DISJOINT_EXT );

				if (available && !disjoint){

					var queryTime = ext.getQueryObjectEXT( query.query, ext.QUERY_RESULT_EXT );
					var time = queryTime;

					var wrapper = ctx.contextWrapper;

					ctx.metrics = {
						id: wrapper.uuid,
						count: wrapper.count,
						time: ( time / 1000000 ).toFixed( 2 ),
						jstime: wrapper.JavaScriptTime.toFixed(2),
						drawArrays: wrapper.drawArraysCalls,
						drawElements: wrapper.drawElementsCalls,
						instancedDrawArrays: wrapper.instancedDrawArraysCalls,
						instancedDrawElements: wrapper.instancedDrawElementsCalls,
						points: wrapper.pointsCount,
						lines: wrapper.linesCount,
						triangles: wrapper.trianglesCount,
						instancedPoints: wrapper.instancedPointsCount,
						instancedLines: wrapper.instancedLinesCount,
						instancedTriangles: wrapper.instancedTrianglesCount,
						programs: wrapper.programCount,
						usePrograms: wrapper.useProgramCount,
						textures: wrapper.textureCount,
						bindTextures: wrapper.bindTextureCount,
						framebuffers: wrapper.framebufferCount,
						bindFramebuffers: wrapper.bindFramebufferCount
					};

					ctx.extQueries.splice( i, 1 );

				}

			});

			ctx.metrics.shaderTime = {};

			ctx.contextWrapper.drawQueries.forEach( ( query, i ) => {

				var available = ext.getQueryObjectEXT( query.query, ext.QUERY_RESULT_AVAILABLE_EXT );
				var disjoint = ctx.contextWrapper.context.getParameter( ext.GPU_DISJOINT_EXT );

				if (available && !disjoint){

					var queryTime = ext.getQueryObjectEXT( query.query, ext.QUERY_RESULT_EXT );
					var time = queryTime;
					if( ctx.metrics.shaderTime[ query.program.uuid ] === undefined ) {
						ctx.metrics.shaderTime[ query.program.uuid ] = 0;
					}
					ctx.metrics.shaderTime[ query.program.uuid ] += time;
					ctx.contextWrapper.drawQueries.splice( i, 1 );

				}

			});

		}

	});

	var logs = [];
	contexts.forEach( ctx => {
		logs.push( ctx.metrics )
	} );

	var e = new CustomEvent( 'perfmeter-framedata', {
		detail: {
			rAFS: queue.length,
			frameId,
			framerate,
			frameTime,
			logs
		}
	} );
	window.dispatchEvent( e );

	originalRequestAnimationFrame( processRequestAnimationFrames );

}

processRequestAnimationFrames();
