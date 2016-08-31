chrome.devtools.panels.create( 'PerfMeter', 'assets/icon.svg', 'panel.html', initialize );

var port = chrome.runtime.connect( null, { name: `devtools` } );
var tabId = chrome.devtools.inspectedWindow.tabId

function post( msg ) {

	msg.tabId = tabId;
	port.postMessage( msg );

}

post( { action: 'start' } );
post( { action: 'getScript' } );

port.onDisconnect.addListener( function() {
	console.log( 'disconnect' );
} );

var script = '';
var settings = {};
var panelWindow = null;
var scriptStatus = 0;

port.onMessage.addListener( function( msg ) {

	switch( msg.action ) {
		case 'settings':
		settings = msg.settings;
		if( panelWindow && panelWindow.setSettings ) {
			panelWindow.setSettings( settings );
		}
		break;
		case 'script':
		script = msg.source;
		break;
		case 'inject':
		scriptStatus = 2;
		chrome.devtools.inspectedWindow.eval( `(function(){var settings=${JSON.stringify( settings )}; ${script};})();`, function(result, isException) {
			console.log( result, isException )
		} );
		break;
		case 'fromScript':
		if( panelWindow ) {
			panelWindow.onScriptMessage( msg.data );
		}
		break;
	}

} );

function initialize( panel ) {

	panel.onShown.addListener( function ( wnd ) {

		panelWindow = wnd;

		panelWindow.getScriptStatus = function() {
			return scriptStatus;
		}

		panelWindow.getSettings = function() {
			return settings;
		}

		panelWindow.inject = function() {
			scriptStatus = 2;
			chrome.devtools.inspectedWindow.eval( `(function(){var settings=${JSON.stringify( settings )}; ${script};})();`, function(result, isException) {
				console.log( result, isException )
			} );
		}
		panelWindow.reload = function() {
			scriptStatus = 1;
			post( { action: 'reload' } );
			chrome.devtools.inspectedWindow.reload( {
				injectedScript: `(function(){var settings=${JSON.stringify( settings )}; ${script};})();`
			} );
		}

		panelWindow.updateSettings = function() {

			post( {
				action: 'setSettings',
				settings: settings
			} );

		}

		panelWindow.setSettings( settings );
		panelWindow.updateScriptStatus();

		post( { action: 'onShown' } );

	} );

	panel.onHidden.addListener(function (panelWindow) {
		post( { action: 'onHidden' } );
	});

}

// chrome.devtools.network.onRequestFinished
// chrome.devtools.network.onNavigated
// are called after page js execution

chrome.runtime.onConnect.addListener( function( port ) {

	alert( 'hey' );
	console.log( ' DevTools >>> chrome.runtime.onConnect', JSON.stringify( port ) );

	function listener( msg, sender, reply ) {
		return true;
	}

	port.onMessage.addListener( listener );

} );
