var extensionId = chrome.runtime.id;
log( 'Background', extensionId );

var settings = {};
var script = '';

var defaultSettings = {

	logOperations: false,
	autoinstrument: true

}

chrome.system.cpu.getInfo( res => log( res ) );
chrome.system.display.getInfo( res => log( res ) );
chrome.system.memory.getInfo( res => log( res ) );

Promise.all( [
	loadSettings().then( res => { settings = res; notifySettings(); } ),
	fetch( chrome.extension.getURL( 'canvas-instrument.js' ) ).then( res => res.text() ).then( res => script = res )
] ).then( () => {
	log( 'Script and settings loaded', settings );
} );

function notifySettings() {

	settings.cssPath = chrome.extension.getURL( 'css/styles.css' );
	settings.fontPath = chrome.extension.getURL( 'css/Roboto_Mono/RobotoMono-Regular.ttf' );

	log( 'settings', settings );

	Object.keys( connections ).forEach( tab => {
		var port = connections[ tab ].devtools;
		port.postMessage( {
			action: 'settings',
			settings: settings
		} );
		inject( port );
	} );

}

function inject( port ) {

	port.postMessage( {
		action: 'script',
		source: script
	} );

}

var connections = {};
var reloadTriggered = false;

// Post back to Devtools from content
chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {

	//log( 'onMessage', message, sender );
	if ( sender.tab && connections[ sender.tab.id ] ) {
		var port = connections[ sender.tab.id ].devtools;
		port.postMessage( { action: 'fromScript', data: message } );
	}

	return true;

} );

chrome.runtime.onConnect.addListener( function( port ) {

	log( 'New connection (chrome.runtime.onConnect) from', port.name, port.sender.frameId, port );

	var name = port.name;

	function listener( msg, sender, reply ) {

		var tabId;

		if( msg.tabId ) tabId = msg.tabId
		else tabId = sender.sender.tab.id;

		if( !connections[ tabId ] ) connections[ tabId ] = {};
		connections[ tabId ][ name ] = port;

		//log( sender );
		log( 'port.onMessage', port.name, msg );

		if( name === 'contentScript' ) {

			var fwd = connections[ tabId ].devtools;
			if( fwd ) {
				fwd.postMessage( { action: 'fromScript', data: msg } );
			} else {
				//console.warn( 'No DevTools port for tab ', tabId );
			}

		}

		switch( msg.action ) {

			case 'reload':
			reloadTriggered = true;
			break;

			case 'start':
			port.postMessage( {
				action: 'settings',
				settings: settings
			} );
			break;

			case 'getScript':
			inject( port );
			break;

			case 'setSettings':
			settings = msg.settings;
			//log( settings );
			saveSettings( settings ).then( res => {
				notifySettings();
			} )

			break;
		}

	}

	port.onMessage.addListener( listener );

	port.onDisconnect.addListener( function() {

		port.onMessage.removeListener( listener );

		log( name, 'disconnect (chrome.runtime.onDisconnect)' );

		Object.keys( connections ).forEach( c => {
			if( connections[ c ][ name ] === port ) {
				connections[ c ][ name ] = null;
				delete connections[ c ][ name ];
			}
			if ( Object.keys( connections[ c ] ).length === 0 ) {
				connections[ c ] = null;
				delete connections[ c ];
			}
		} )


	} );

	port.postMessage( { action: 'ack' } );

	return true;

});

chrome.webRequest.onBeforeRequest.addListener( function() {

	if( reloadTriggered ) {
		return;
	}

	if( settings.autoinstrument ) {
		if( connections[ arguments[ 0 ].tabId ] && connections[ arguments[ 0 ].tabId ].devtools ) {
			//log( 'webRequest', 'inject' )
			connections[ arguments[ 0 ].tabId ].devtools.postMessage( { action: 'inject' } );
		}
	}

}, {urls: ["<all_urls>"]} );

chrome.tabs.onUpdated.addListener( function( tabId, info, tab ) {
	log( 'onUpdate', tabId, info, tab );
	if( info.status === 'complete' ) {
		reloadTriggered = false;
		log( 'finished reload' );
	}
})
