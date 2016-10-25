const text = document.createElement( 'div' );
text.setAttribute( 'id', 'perfmeter-panel' );

function setupUI() {

	const fileref = document.createElement("link");
	fileref.rel = "stylesheet";
	fileref.type = "text/css";
	fileref.href = settings.cssPath;

	window.document.getElementsByTagName("head")[0].appendChild(fileref);

	window.document.body.appendChild( text );

	window.addEventListener( 'perfmeter-framedata', updateUI );

}

if( !window.document.body ) {
	window.addEventListener( 'load', setupUI );
} else {
	setupUI();
}

function formatNumber( value, sizes, decimals ) {

	if(value == 0) return '0';

	var k = 1000; // or 1024 for binary
	var dm = decimals || 2;
	var i = Math.floor(Math.log(value) / Math.log(k));

	return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

}

var timeSizes = ['ns', 'µs', 'ms', 's' ];
var callSizes = [ '', 'K', 'M', 'G' ];
var memorySizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];

function updateUI( e ) {

	const d = e.detail;

	if( d.rAFS === 0 || d.logs.length === 0 ) {
		text.style.display = 'none';
	} else {
		text.style.display = 'block';
	}

	const blocks = [];

	blocks.push( `Framerate: ${d.framerate.toFixed(2)} FPS
	Frame JS time: ${d.frameTime.toFixed(2)} ms
	rAFS: ${d.rAFS}` );

	d.logs.forEach( l => {

		if( l.count ) {

			var shaderTime = [];
			Object.keys( l.shaderTime ).forEach( key => {
				shaderTime.push( `${key} ${( l.shaderTime[ key ] / 1000000 ).toFixed(2)} ms` );
			} );
			var shaderTimeStr = shaderTime.join( "\r\n" );

			blocks.push( `<b>Canvas</b>
ID: ${l.uuid}
Count: ${l.count}
Canvas time: ${l.jstime} ms
<b>WebGL</b>
GPU time: ${l.time} ms
Shader time:
${shaderTimeStr}
Programs: ${l.usePrograms} / ${l.programs}
Textures: ${l.bindTextures} / ${l.textures}
Framebuffers: ${l.bindFramebuffers} / ${l.framebuffers}
dArrays: ${l.drawArrays}
dElems: ${l.drawElements}
Points: ${l.points}
Lines: ${l.lines}
Triangles: ${l.triangles}
idArrays: ${l.instancedDrawArrays}
idElems: ${l.instancedDrawElements}
iPoints: ${l.instancedPoints}
iLines: ${l.instancedLines}
iTriangles: ${l.instancedTriangles}` );
		}

	});

	blocks.push( `<b>Browser</b>
Mem: ${(performance.memory.usedJSHeapSize/(1024*1024)).toFixed(2)}/${(performance.memory.totalJSHeapSize/(1024*1024)).toFixed(2)}` );

	if( settings.showGPUInfo ) blocks.push( glInfo );

	text.innerHTML = blocks.join( "\r\n\r\n" );

}

var glInfo = '';

function setInfo( info ) {

	glInfo = info;

}

export { setInfo }
