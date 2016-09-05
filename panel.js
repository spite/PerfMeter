"use strict";

var reloadButton = document.getElementById( 'reload-button' );

reloadButton.addEventListener( 'click', e => {

	reload();
	e.preventDefault();

} );

var startRecordDataButton = document.getElementById( 'start-record-data-button' );

startRecordDataButton.addEventListener( 'click', e => {

	startRecordingData();
	e.preventDefault();

} );

var stopRecordDataButton = document.getElementById( 'stop-record-data-button' );

stopRecordDataButton.addEventListener( 'click', e => {

	stopRecordingData();
	e.preventDefault();

} );

document.getElementById( 'autoinstrument' ).addEventListener( 'change', e => {

	window.settings.autoinstrument = e.target.checked;
	updateSettings();
	e.preventDefault();

} );

document.getElementById( 'show-gpuinfo' ).addEventListener( 'change', e => {

	window.settings.showGPUInfo = e.target.checked;
	updateSettings();
	e.preventDefault();

} );

function setSettings( settings ) {

	window.settings = settings;

	document.getElementById( 'autoinstrument' ).checked = settings.autoinstrument;
	document.getElementById( 'show-gpuinfo' ).checked = settings.showGPUInfo;

}

function updateScriptStatus() {

	document.getElementById( 'not-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block';

	[].forEach.call( document.querySelectorAll( '.instrument-status' ), el => el.style.display = 'none' );
	switch( getScriptStatus() ) {
		case 0: document.getElementById( 'not-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block'; break;
		case 1: document.getElementById( 'injected-instrumented' ).style.display = 'block'; reloadButton.style.display = 'none';  break;
		case 2: document.getElementById( 'executed-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block';  break;
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
