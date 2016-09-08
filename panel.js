"use strict";

ge( 'reload-button' ).addEventListener( 'click', e => {

	reload();
	e.preventDefault();

} );

ge( 'start-record-data-button' ).addEventListener( 'click', e => {

	startRecordingData();
	e.preventDefault();

} );

ge( 'stop-record-data-button' ).addEventListener( 'click', e => {

	stopRecordingData();
	e.preventDefault();

} );

ge( 'autoinstrument' ).addEventListener( 'change', e => {

	window.settings.autoinstrument = e.target.checked;
	updateSettings();
	e.preventDefault();

} );

ge( 'log-calls' ).addEventListener( 'change', e => {

	window.settings.log = e.target.checked;
	updateSettings();
	e.preventDefault();

} );

ge( 'show-gpuinfo' ).addEventListener( 'change', e => {

	window.settings.showGPUInfo = e.target.checked;
	updateSettings();
	e.preventDefault();

} );

function setSettings( settings ) {

	window.settings = settings;

	ge( 'autoinstrument' ).checked = settings.autoinstrument;
	ge( 'show-gpuinfo' ).checked = settings.showGPUInfo;
	ge( 'log-calls' ).checked = settings.log;

}

function updatePanelStatus() {

	updateScriptStatus();
	updateRecordingStatus();

}

function updateRecordingStatus() {

	var recordingStatus = getRecordingStatus();
	if( recordingStatus.status ){
		ge( 'recording-progress' ).textContent = `Recording. ${recordingStatus.bufferSize} samples...`;
		ge( 'start-record-data-button' ).style.display = 'none';
		ge( 'stop-record-data-button' ).style.display = 'block';
		ge( 'download-data-button' ).disabled = true;
	} else {
		ge( 'recording-progress' ).textContent = 'Standing by';
		ge( 'start-record-data-button' ).style.display = 'block';
		ge( 'stop-record-data-button' ).style.display = 'none';
		ge( 'download-data-button' ).disabled = false;
	}

}

function updateScriptStatus() {

	ge( 'not-instrumented' ).style.display = 'block';
	ge( 'reload-button' ).style.display = 'block';

	[].forEach.call( document.querySelectorAll( '.instrument-status' ), el => el.style.display = 'none' );
	switch( getScriptStatus() ) {
		case 0: ge( 'not-instrumented' ).style.display = 'block'; ge( 'reload-button' ).style.display = 'block'; break;
		case 1: ge( 'injected-instrumented' ).style.display = 'block'; ge( 'reload-button' ).style.display = 'none';  break;
		case 2: ge( 'executed-instrumented' ).style.display = 'block'; ge( 'reload-button' ).style.display = 'block';  break;
	}

}

function onScriptMessage( msg ) {

	switch( msg.method ) {
		case 'ready':
		updateScriptStatus();
		break;
	}

}

ge( 'download-data-button' ).addEventListener( 'click', e => {

	var blob = new Blob( [ JSON.stringify( recordedData ) ],{ type: 'application/json' } );
	var url = window.URL.createObjectURL( blob );
	var anchor = document.createElement( 'a' );
	anchor.href = url;
	anchor.setAttribute( 'download', 'data.json' );
	anchor.className = "download-js-link";
	anchor.innerHTML = "downloading...";
	anchor.style.display = "none";
	document.body.appendChild(anchor);
	setTimeout(function() {
		anchor.click();
		document.body.removeChild(anchor);
	}, 1 );

} );

var recordedData = null;

function formatNumber( value, sizes, decimals ) {
   if(value == 0) return '0 Byte';
   var k = 1000; // or 1024 for binary
   var dm = decimals || 2;
   var i = Math.floor(Math.log(value) / Math.log(k));
   return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

var timeSizes = ['ns', 'us', 'ms', 's' ];
var callSizes = [ '', 'K', 'M', 'G' ];
// baseline_range: n
// baselines: [ a, b, c... ]

var g = new Graph( {
	target: document.getElementById( 'framerate-div' ),
	color: '#d7f0d1',
	baselines: [ 30, 60, 90 ],
	decorator: v => `${v.toFixed( 2 )} FPS`
} );

var g2 = new Graph( {
	target: document.getElementById( 'gpu-div' ),
	color: '#f0c457',
	baselines: [ 16666666 ],
	decorator: v => `${formatNumber(v,timeSizes,2)}`
} );

var g3 = new Graph( {
	target: document.getElementById( 'js-div' ),
	color: '#9b7fe6',
	baselines: [ 16 ],
	decorator: v => `${formatNumber(v*1000*1000,timeSizes,2)}`
} );

var g4 = new Graph( {
	target: document.getElementById( 'drawcalls-div' ),
	color: '#9dc0ed',
	baseline_range: 200,
	decorator: v => `${formatNumber(v,callSizes,3)}`
} );

function plotRecording( recordBuffer ) {

	recordedData = recordBuffer;

	if( recordBuffer.length === 0 ) return;

	var points = recordBuffer.map( v => { return{ x: v.timestamp, y: v.framerate } } );
	g.set( points );

	var points2 = recordBuffer.map( v => { return{ x: v.timestamp, y: v.disjointTime } } );
	g2.set( points2 );

	var points3 = recordBuffer.map( v => { return{ x: v.timestamp, y: v.JavaScriptTime } } );
	g3.set( points3 );

	var points4 = recordBuffer.map( v => { return{ x: v.timestamp, y: v.drawCount } } );
	g4.set( points4 );


}
