var log = function() {

	window.console.log.apply(
		window.console, [
			`%c PerfMeter | ${performance.now().toFixed(2)} `,
			'background: #1E9433; color: #ffffff; text-shadow: 0 -1px #000; padding: 4px 0 4px 0; line-height: 0',
			...arguments
		]
	);

};

var postWithContentScript = function( msg ) {

	var e = new CustomEvent( 'perfmeter-message', { detail: msg } );
	window.dispatchEvent( e );

};

var messageQueue = [];
var postWithoutContentScript = function( msg ) {

	msg.source = 'perfmeter-script';
	messageQueue.push( msg );

};

var queryMessageQueue = function() {

	var res = messageQueue.slice();
	messageQueue = [];
	return res;

};

var checkCount = 0;

function checkContentScript() {

	log( 'Checking for content script' );

	var e = new Event( 'perfmeter-content-script-available' );
	window.dispatchEvent( e );

	checkCount++;
	if( checkCount > 10 ) checkInterval = clearInterval( checkInterval );

}

var checkInterval = setInterval( checkContentScript, 500 );

window.addEventListener( 'perfmeter-content-script-available', e => {

	log( 'Content Script Available' );
	checkInterval = clearInterval( checkInterval );

} );

window.__PerfMeterQueryMessageQueue = queryMessageQueue;

window.__PerfMeterHasContentScript = function() {

	return window.__PerfMeterContentScript === undefined ? false : true;

};

var post = function( msg ) {

	( window.__PerfMeterContentScript ? postWithContentScript : postWithoutContentScript )( msg );

};
