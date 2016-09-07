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

function plotRecording( recordBuffer ) {

	recordedData = recordBuffer;

	if( recordBuffer.length === 0 ) return;

	var d = Date.now();

	var pointsGPU = [];
	var pointsFPS = [];
	var pointsJS = [];
	var pointsCanvasJS = [];
	var pointsDrawCalls = [];

	var s = 2000;

	recordBuffer.forEach( rec => {
		pointsFPS.push( { date: new Date( d + rec.timestamp * s ), value: rec.framerate } );
		pointsGPU.push( { date: new Date( d + rec.timestamp * s ), value: rec.disjointTime / ( 1000 * 1000 ) } );
		pointsJS.push( { date: new Date( d + rec.timestamp * s ), value: rec.frameTime } );
		pointsCanvasJS.push( { date: new Date( d + rec.timestamp * s ), value: rec.JavaScriptTime } );
		pointsDrawCalls.push( { date: new Date( d + rec.timestamp * s ), value: rec.drawCount } );
	} );

	MG.data_graphic( {
		show_tooltips: false,
		chart_type: 'line',
		baselines: [ { value: 0 }, {value: 30, label: '30 FPS'}, {value: 60, label: '60 FPS'}, {value: 90, label: '90 FPS'}],
		description: "FPS",
		brushing: true,
		data: [ pointsFPS ],
		full_width: true,
		height: 180,
		animate_on_load: true,
		area: true,
		linked: false,
		x_rug: true,
		//y_extended_ticks: true,
		interpolate: d3.curveCatmullRomOpen, //d3.curveLinear,
		x_axis: false,
		x_accessor: 'date',
		x_rug: true,
		target: '#fps-graph',
		legend: ['FPS' ],
		legend_target: 'div#custom-color-key',
		colors: ['blue' ],
		aggregate_rollover: false
	} );

	MG.data_graphic( {
		show_tooltips: false,
		chart_type: 'line',
		baselines: [ {value: 0 }, {value: 16.66, label: '16ms'} ],
		description: "GPU, JS, Canvas JS",
		brushing: true,
		data: [ pointsGPU, pointsJS, pointsCanvasJS ],
		full_width: true,
		height: 180,
		animate_on_load: true,
		area: true,
		linked: false,
		x_rug: true,
		//y_extended_ticks: true,
		interpolate: d3.curveCatmullRomOpen, //d3.curveLinear,
		x_axis: false,
		x_accessor: 'date',
		x_rug: true,
		target: '#time-graph',
		legend: [ 'GPU','JS' ],
		legend_target: 'div#custom-color-key',
		colors: [ 'rgb(255,100,43)', '#b70000', 'green' ],
		aggregate_rollover: true
	} );

	MG.data_graphic( {
		show_tooltips: false,
		chart_type: 'line',
		description: "Draw Calls",
		brushing: true,
		data: [ pointsDrawCalls ],
		full_width: true,
		height: 180,
		animate_on_load: true,
		area: true,
		linked: false,
		x_rug: true,
		y_extended_ticks: true,
		interpolate: d3.curveCatmullRomOpen, //d3.curveLinear,
		x_axis: false,
		x_accessor: 'date',
		x_rug: true,
		target: '#drawCalls-graph',
		legend: [ 'Draw calls' ],
		legend_target: 'div#custom-color-key',
		colors: [ 'orange' ],
		aggregate_rollover: false
	} );

}
