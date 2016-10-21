var contexts = [];
var canvasContexts = new WeakMap();

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
						    drawArrays: ctx.contextWrapper.drawArrayCalls,
						    drawElements: ctx.contextWrapper.drawElementsCalls,
						    points: ctx.contextWrapper.pointsCount,
						    lines: ctx.contextWrapper.linesCount,
						    triangles: ctx.contextWrapper.trianglesCount,
						    programs: ctx.contextWrapper.programCount,
						    usePrograms: ctx.contextWrapper.useProgramCount
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

	/*var str = `Framerate: ${framerate.toFixed(2)} FPS
	Frame JS time: ${frameTime.toFixed(2)} ms

	`;
	logs.forEach( l => {
		str += `<b>Canvas</b>
ID: ${l.id}
Count: ${l.count}
Canvas time: ${l.jstime} ms
<b>WebGL</b>
GPU time: ${l.time} ms
Programs: ${l.programs}
usePrograms: ${l.usePrograms}
dArrays: ${l.drawArrays}
dElems: ${l.drawElements}
Points: ${l.points}
Lines: ${l.lines}
Triangles: ${l.triangles}

`;
	});
	if( text ) text.innerHTML = str;*/

	originalRequestAnimationFrame( processRequestAnimationFrames );

}

processRequestAnimationFrames();

export default function() {}
