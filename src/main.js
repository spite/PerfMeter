import{ createUUID } from "./utils";

import { CanvasRenderingContext2DWrapper } from "./CanvasRenderingContext2DWrapper"
import { WebGLRenderingContextWrapper } from "./WebGLRenderingContextWrapper"

import "./widget";

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

	this.id = createUUID();
	this.queryExt = null;
	this.contextWrapper = contextWrapper;
	this.extQueries = [];

}

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

		ctx.contextWrapper.resetFrame();

		var ext = ctx.queryExt;

		if( ext ){

			var query = ext.createQueryEXT();
			ext.beginQueryEXT( ext.TIME_ELAPSED_EXT, query );
			ctx.extQueries.push( query );

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

	var logs = [];

	contexts.forEach( ctx => {

		var ext = ctx.queryExt;

		if( ext ){

			ext.endQueryEXT( ext.TIME_ELAPSED_EXT );

			ctx.extQueries.forEach( ( query, i ) => {

				var available = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_AVAILABLE_EXT );
				var disjoint = ctx.contextWrapper.context.getParameter( ext.GPU_DISJOINT_EXT );

				if (available && !disjoint){

					var queryTime = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_EXT );
					var time = queryTime;
					if (ctx.contextWrapper.count ){
						logs.push( {
							id: ctx.contextWrapper.id,
							count: ctx.contextWrapper.count,
						    time: ( time / 1000000 ).toFixed( 2 ),
						    jstime: ctx.contextWrapper.JavaScriptTime.toFixed(2),
						    drawArrays: ctx.contextWrapper.drawArraysCalls,
						    drawElements: ctx.contextWrapper.drawElementsCalls,
						    instancedDrawArrays: ctx.contextWrapper.instancedDrawArraysCalls,
						    instancedDrawElements: ctx.contextWrapper.instancedDrawElementsCalls,
						    points: ctx.contextWrapper.pointsCount,
						    lines: ctx.contextWrapper.linesCount,
						    triangles: ctx.contextWrapper.trianglesCount,
						    instancedPoints: ctx.contextWrapper.instancedPointsCount,
						    instancedLines: ctx.contextWrapper.instancedLinesCount,
						    instancedTriangles: ctx.contextWrapper.instancedTrianglesCount,
						    programs: ctx.contextWrapper.programCount,
						    usePrograms: ctx.contextWrapper.useProgramCount,
						    textures: ctx.contextWrapper.textureCount,
						    bindTextures: ctx.contextWrapper.bindTextureCount
						} );
					}
					ctx.extQueries.splice( i, 1 );

				}

			});

			/*ctx.contextWrapper.drawQueries.forEach( ( query, i ) => {

				var available = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_AVAILABLE_EXT );
				var disjoint = ctx.contextWrapper.context.getParameter( ext.GPU_DISJOINT_EXT );

				if (available && !disjoint){

					var queryTime = ext.getQueryObjectEXT( query, ext.QUERY_RESULT_EXT );
					var time = queryTime;
					if (ctx.contextWrapper.count ){
						log( 'Draw ', time );
					}
					ctx.contextWrapper.drawQueries.splice( i, 1 );

				}

			});*/

		}

	});

	var e = new CustomEvent( 'perfmeter-framedata', {
		detail: {
			frameTime: frameId,
			framerate: framerate,
			frameTime: frameTime,
			logs: logs
		}
	} );
	window.dispatchEvent( e );

	originalRequestAnimationFrame( processRequestAnimationFrames );

}

processRequestAnimationFrames();
