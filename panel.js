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

ge( 'show-gpuinfo' ).addEventListener( 'change', e => {

	window.settings.showGPUInfo = e.target.checked;
	updateSettings();
	e.preventDefault();

} );

function setSettings( settings ) {

	window.settings = settings;

	ge( 'autoinstrument' ).checked = settings.autoinstrument;
	ge( 'show-gpuinfo' ).checked = settings.showGPUInfo;

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
	} else {
		ge( 'recording-progress' ).textContent = 'Standing by';
		ge( 'start-record-data-button' ).style.display = 'block';
		ge( 'stop-record-data-button' ).style.display = 'none';
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

function plotRecording( recordBuffer ) {

	var d = Date.now();

	var pointsGPU = [];
	var pointsFPS = [];
	var pointsJS = [];
	var pointsDrawCalls = [];

	var s = 2000;

	recordBuffer.forEach( rec => {
		pointsFPS.push( { date: new Date( d + rec.timestamp * s ), value: rec.framerate } );
		pointsGPU.push( { date: new Date( d + rec.timestamp * s ), value: rec.disjointTime / ( 1000 * 1000 ) } );
		pointsJS.push( { date: new Date( d + rec.timestamp * s ), value: rec.frameTime } );
		pointsDrawCalls.push( { date: new Date( d + rec.timestamp * s ), value: rec.drawCount } );
	} );

	MG.data_graphic( {
		title: "Metrics",
		show_tooltips: false,
		chart_type: 'line',
		description: "FPS, GPU, JS",
		brushing: true,
		data: [ pointsFPS, pointsGPU, pointsJS, pointsDrawCalls ],
		full_width: true,
		height: 200,
		animate_on_load: true,
        area: true,
        y_extended_ticks: true,
        interpolate: d3.curveCatmullRomOpen, //d3.curveLinear,
		x_axis: false,
		x_accessor: 'date',
		x_rug: true,
		target: '#chart_div',
		legend: ['FPS','GPU','JS', 'Draw calls' ],
        legend_target: 'div#custom-color-key',
        colors: ['blue', 'rgb(255,100,43)', '#CCCCFF', '#b70000' ],
        aggregate_rollover: true
	} );

}
