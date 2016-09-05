"use strict";

chrome.devtools.panels.create( 'PerfMeter', 'assets/icon.svg', 'panel.html', initialize );

var port = chrome.runtime.connect( null, { name: `devtools` } );
var tabId = chrome.devtools.inspectedWindow.tabId;

function log( ...args ) {

	var strArgs = [
		'"%c PerfMeter | DevTools "',
		'"background: #1E9433; color: #ffffff; text-shadow: 0 -1px #000; padding: 4px 0 4px 0; line-height: 0;"',
		...args.map( v => JSON.stringify( v ) )
	];

	chrome.devtools.inspectedWindow.eval(
		`console.log(${strArgs});`,
		( result, isException ) => console.log( result, isException )
	);

}

function post( msg ) {

	msg.tabId = tabId;
	port.postMessage( msg );

}

post( { action: 'start' } );
post( { action: 'getScript' } );

port.onDisconnect.addListener( _ => {
	log( 'Disconnect' );
} );

var script = '';
var settings = {};
var panelWindow = null;
var scriptStatus = 0;

var recordBuffer = [];
var pollingInterval = null;

function processMessageFromScript( msg ) {

	if( msg.method === 'frame' ) {
		recordBuffer.push( msg.data );
	} else {
		if( panelWindow ) {
			panelWindow.onScriptMessage( msg );
		}
	}

}

function poll() {

	chrome.devtools.inspectedWindow.eval(
		'window.__PerfMeterQueryMessageQueue()',
		( result, isException ) => {
			if( result ) {
				result.forEach( msg => processMessageFromScript( msg ) );
			}
		}
	);

}

function hasContentScript() {

	return new Promise( ( resolve, reject ) => {

		chrome.devtools.inspectedWindow.eval(
			'window.__PerfMeterHasContentScript()',
			( result, isException ) => {
				if( result === true ) resolve();
				else reject();
			}
		);

	} );

}

port.onMessage.addListener( msg =>  {

	switch( msg.action ) {
		case 'settings':
		settings = msg.settings;
		if( panelWindow && panelWindow.setSettings ) {
			panelWindow.setSettings( settings );
			chrome.devtools.inspectedWindow.eval(
				`window.__PerfMeterSettings(${JSON.stringify( settings )});`,
				( result, isException ) => log( result, isException )
			);
		}
		break;
		case 'script':
		script = msg.source;
		break;
		case 'inject':
		scriptStatus = 2;
		chrome.devtools.inspectedWindow.eval(
			`(function(){var settings=${JSON.stringify( settings )}; ${script};})();`,
			( result, isException ) => log( result, isException )
		);
		break;
		case 'fromScript':
		processMessageFromScript( msg.data );
		break;
	}

} );

function startRecording() {

	chrome.devtools.inspectedWindow.eval(
		`window.__PerfMeterStartRecording();`,
		( result, isException ) => log( result, isException )
	);

}

function initialize( panel ) {

	panel.onShown.addListener( wnd => {

		panelWindow = wnd;

		panelWindow.getScriptStatus = function() {
			return scriptStatus;
		};

		panelWindow.getSettings = function() {
			return settings;
		};

		panelWindow.inject = function() {
			scriptStatus = 2;
			chrome.devtools.inspectedWindow.eval(
				`(function(){var settings=${JSON.stringify( settings )}; ${script};})();`,
				( result, isException ) => log( result, isException )
			);
		};

		panelWindow.reload = function() {
			scriptStatus = 1;
			post( { action: 'reload' } );
			chrome.devtools.inspectedWindow.reload( {
				injectedScript: `(function(){var settings=${JSON.stringify( settings )}; ${script};})();`
			} );
		};

		panelWindow.startRecordingData = function() {
			log( 'Start Recording...' );
			recordBuffer = [];
			hasContentScript().then( _ => {
				startRecording();
			} ).catch( _ => {
				pollingInterval = setInterval( poll, 100 );
				startRecording();
			} );
		};

		panelWindow.stopRecordingData = function() {
			pollingInterval = clearInterval( pollingInterval );
			log( `Recording stopped, ${recordBuffer.length} samples taken`, recordBuffer );
			chrome.devtools.inspectedWindow.eval(
				`window.__PerfMeterStopRecording();`,
				( result, isException ) => log( result, isException )
			);
			panelWindow.plotRecording( recordBuffer );
		};

		panelWindow.updateSettings = function() {

			post( {
				action: 'setSettings',
				settings: settings
			} );

		};

		panelWindow.setSettings( settings );
		panelWindow.updateScriptStatus();

		post( { action: 'onShown' } );

	} );

	panel.onHidden.addListener( wnd => {
		post( { action: 'onHidden' } );
	} );

}
