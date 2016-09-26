var verbose = false;

function log() {

	console.log.apply(
		console, [
			`%c PerfMeter `,
			'background: #1E9433; color: #ffffff; text-shadow: 0 -1px #000; padding: 4px 0 4px 0; line-height: 0',
			...arguments
		]
	);

}

log( 'content script', window.location.toString() );

var port = chrome.runtime.connect( { name: 'contentScript' } );
port.postMessage( { method: 'ready' } );

port.onDisconnect.addListener( function() {
	port = null;
	log( 'Port disconnected' );
})

window.addEventListener( 'perfmeter-message', e => {

	if( verbose ) log( e.detail );
	port.postMessage( e.detail );

} );

var source = '(' + function () {
	window.__PerfMeterContentScript = true;
} + ')();';

var script = document.createElement('script');
script.textContent = source;
(document.head||document.documentElement).appendChild(script);
script.parentNode.removeChild(script);
