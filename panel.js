var reloadButton = document.getElementById( 'reload-button' );

reloadButton.addEventListener( 'click', function( e ) {

	reload();

} );

document.getElementById( 'instrument-canvas' ).addEventListener( 'change', e => {

	window.settings.canvas = e.target.checked;
	updateSettings();

} );

document.getElementById( 'instrument-createProgram' ).addEventListener( 'change', e => {

	window.settings.createProgram = e.target.checked;
	updateSettings();

} );

document.getElementById( 'autoinstrument' ).addEventListener( 'change', e => {

	window.settings.autoinstrument = e.target.checked;
	updateSettings();

} );

function setSettings( settings ) {

	window.settings = settings;

	document.getElementById( 'instrument-canvas' ).checked = settings.canvas;
	document.getElementById( 'instrument-createProgram' ).checked = settings.createProgram;
	document.getElementById( 'autoinstrument' ).checked = settings.autoinstrument;

}

function updateScriptStatus() {

	document.getElementById( 'not-instrumented' ).style.display = 'block'; reloadButton.style.display = 'block';

	return;
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
