chrome.devtools.panels.create( 'PerfMeter', 'assets/icon.svg', 'panel.html', initialize );

var port = chrome.runtime.connect( null, { name: `devtools` } );
var tabId = chrome.devtools.inspectedWindow.tabId

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
		if( panelWindow ) {
			panelWindow.onScriptMessage( msg.data );
		}
		break;
	}

} );

function initialize( panel ) {

	panel.onShown.addListener( wnd => {

		panelWindow = wnd;

		panelWindow.getScriptStatus = function() {
			return scriptStatus;
		}

		panelWindow.getSettings = function() {
			return settings;
		}

		panelWindow.inject = function() {
			scriptStatus = 2;
			chrome.devtools.inspectedWindow.eval(
				`(function(){var settings=${JSON.stringify( settings )}; ${script};})();`,
				( result, isException ) => log( result, isException )
			);
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
