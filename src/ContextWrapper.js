import{ Wrapper } from "./Wrapper";

function ContextWrapper( context ) {

	Wrapper.call( this );
	this.context = context;

	this.count = 0;
	this.JavaScriptTime = 0;

	this.log = [];

}

ContextWrapper.prototype = Object.create( Wrapper.prototype );

ContextWrapper.prototype.run = function(fName, fArgs, fn) {

	this.incrementCount();
	this.beginProfile( fName, fArgs );
	const res = fn();
	this.endProfile();
	return res;

}

ContextWrapper.prototype.resetFrame = function() {

	this.resetCount();
	this.resetJavaScriptTime();
	this.resetLog();

}

ContextWrapper.prototype.resetCount = function() {

	this.count = 0;

}

ContextWrapper.prototype.incrementCount = function() {

	this.count++;

}

ContextWrapper.prototype.resetLog = function() {

	this.log.length = 0;

}

ContextWrapper.prototype.resetJavaScriptTime = function() {

	this.JavaScriptTime = 0;

}

ContextWrapper.prototype.incrementJavaScriptTime = function(time) {

	this.JavaScriptTime += time;

}

ContextWrapper.prototype.beginProfile = function(fn, args) {

	const t = performance.now();
	this.log.push( { function: fn, arguments: args, start: t, end: 0 } );
	this.startTime = t;

}

ContextWrapper.prototype.endProfile = function() {

	const t = performance.now();
	this.log[ this.log.length - 1 ].end = t;
	this.incrementJavaScriptTime( t - this.startTime );

}


export { ContextWrapper }
