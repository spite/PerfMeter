var verbose = false;

function log() {

	var args = Array.from( arguments );
	args.unshift( 'background: #1E9433; color: #ffffff; text-shadow: 0 -1px #000; padding: 4px 0 4px 0; line-height: 0' );
	args.unshift( `%c PerfMeter ` );

	console.log.apply( console, args );

}

log( 'content script', window.location.toString() );

var port = chrome.runtime.connect( { name: 'contentScript' } );
port.postMessage( { method: 'ready' } );

port.onDisconnect.addListener( function() {
	port = null;
	log( 'Port disconnected' );
})

window.addEventListener( 'message', function(event) {

	if( !port ) return;

	if (event.source !== window) {
		return;
	}

	var message = event.data;

	if (typeof message !== 'object' || message === null || message.source !== 'perfmeter-script' ) {
		return;
	}

	if( verbose ) log( message );
	port.postMessage( message );

});
