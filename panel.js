var reloadButton = document.getElementById( 'reload-button' );

reloadButton.addEventListener( 'click', function( e ) {

	reload();

} );

var startRecordDataButton = document.getElementById( 'start-record-data-button' );

startRecordDataButton.addEventListener( 'click', function( e ) {

	startRecordingData();

} );

var stopRecordDataButton = document.getElementById( 'stop-record-data-button' );

stopRecordDataButton.addEventListener( 'click', function( e ) {

	stopRecordingData();

} );

document.getElementById( 'autoinstrument' ).addEventListener( 'change', e => {

	window.settings.autoinstrument = e.target.checked;
	updateSettings();

} );

document.getElementById( 'show-gpuinfo' ).addEventListener( 'change', e => {

	window.settings.showGPUInfo = e.target.checked;
	updateSettings();

} );

function setSettings( settings ) {

	window.settings = settings;

	document.getElementById( 'autoinstrument' ).checked = settings.autoinstrument;
	document.getElementById( 'show-gpuinfo' ).checked = settings.showGPUInfo;

}

function updateScriptStatus() {

	//document.getElementById( 'not-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block';

/*	[].forEach.call( document.querySelectorAll( '.instrument-status' ), el => el.style.display = 'none' );
	switch( getScriptStatus() ) {
		case 0: document.getElementById( 'not-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block'; break;
		case 1: document.getElementById( 'injected-instrumented' ).style.display = 'block'; reloadButton.style.display = 'none';  break;
		case 2: document.getElementById( 'executed-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block';  break;
	}*/

}

function onScriptMessage( msg ) {

	switch( msg.method ) {
		case 'ready':
		updateScriptStatus();
		break;
	}

}

google.charts.load('current', {packages: ['corechart', 'line']});
//google.charts.setOnLoadCallback(drawBasic);

function plotRecording( recordBuffer ) {

	var d = Date.now();

	var pointsGPU = [];
	var pointsFPS = [];
	var pointsJS = [];

	var s = 2000;

	recordBuffer.forEach( rec => {
		pointsFPS.push( { date: new Date( d + rec.timestamp * s ), value: rec.framerate } );
		pointsGPU.push( { date: new Date( d + rec.timestamp * s ), value: rec.disjointTime / ( 1000 * 1000 ) } );
		pointsJS.push( { date: new Date( d + rec.timestamp * s ), value: rec.frameTime } );
	} );

	MG.data_graphic({
		title: "Metrics",
		chart_type: 'line',
		description: "FPS, GPU, JS",
		data: [ pointsFPS, pointsGPU, pointsJS ],
		full_width: true,
		height: 200,
		animate_on_load: true,
        area: true,
        y_extended_ticks: true,
        interpolate: d3.curveCatmullRomOpen, //d3.curveLinear,
		height: 250,
		x_axis: false,
		x_accessor: 'date',
		x_rug: true,
		target: '#chart_div',
		legend: ['FPS','GPU','JS'],
        legend_target: 'div#custom-color-key',
        colors: ['blue', 'rgb(255,100,43)', '#CCCCFF'],
        aggregate_rollover: true
	})

return;
	var data = new google.visualization.DataTable();
	data.addColumn('number', 'Timestamp');
	data.addColumn('number', 'GPU (ms)');
	data.addColumn('number', 'FPS');

	var points = recordBuffer.map( rec => {
		return [ rec.timestamp, rec.disjointTime / ( 1000 * 1000 ), rec.framerate ];
	} );
	data.addRows( points );

	var options = {
		hAxis: {
			title: 'Time'
		},
		vAxis: {
			title: 'Time | FPS'
		},
		colors: ['#a52714', '#097138'],
		curveType: 'function'
	};

	var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
	chart.draw(data, options);

}
