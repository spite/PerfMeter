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

function updateUI( e ) {

	const d = e.detail;

	let str = `Framerate: ${d.framerate.toFixed(2)} FPS
	Frame JS time: ${d.frameTime.toFixed(2)} ms

	`;

	d.logs.forEach( l => {
		str += `<b>Canvas</b>
ID: ${l.id}
Count: ${l.count}
Canvas time: ${l.jstime} ms
<b>WebGL</b>
GPU time: ${l.time} ms
Programs: ${l.programs}
usePrograms: ${l.usePrograms}
Textures: ${l.textures}
bindTextures: ${l.bindTextures}
dArrays: ${l.drawArrays}
dElems: ${l.drawElements}
Points: ${l.points}
Lines: ${l.lines}
Triangles: ${l.triangles}
idArrays: ${l.instancedDrawArrays}
idElems: ${l.instancedDrawElements}
iPoints: ${l.instancedPoints}
iLines: ${l.instancedLines}
iTriangles: ${l.instancedTriangles}

`;
	});

	text.innerHTML = str;

}
