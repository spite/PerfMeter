import{ createUUID } from "../utils";

function WebGLTimerQueryEXTWrapper( contextWrapper, extension ){

	this.id = createUUID();
	this.contextWrapper = contextWrapper;
	this.extension = extension;
	this.query = this.extension.createQueryEXT();
	this.time = -1;
	this.nestedTime = -1;
	this.available = false;
	this.nested = [];

}

WebGLTimerQueryEXTWrapper.prototype.getTimes = function(){

	var time = this.getTime();
	this.nested.forEach( q => {
		time += q.getTimes();
	});

	this.nestedTime = time;

	return time;

}

WebGLTimerQueryEXTWrapper.prototype.getTime = function(){

	if( this.time !== -1 ) return this.time;

	this.time = this.extension.getQueryObjectEXT( this.query, this.extension.QUERY_RESULT_EXT );
	return this.time;

}

WebGLTimerQueryEXTWrapper.prototype.getResultsAvailable = function(){

	var res = true;
	this.nested.forEach( q => {
		res = res && q.getResultsAvailable();
	});

	return res;

}

WebGLTimerQueryEXTWrapper.prototype.getResultsAvailable = function(){

	if( this.available ) return true;

	this.available = this.extension.getQueryObjectEXT( this.query, this.extension.QUERY_RESULT_AVAILABLE_EXT );
	return this.available;

}

function EXTDisjointTimerQueryExtensionWrapper( contextWrapper ){

	this.id = createUUID();
	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'EXT_disjoint_timer_query' ] );

	this.QUERY_COUNTER_BITS_EXT = this.extension.QUERY_COUNTER_BITS_EXT;
	this.CURRENT_QUERY_EXT = this.extension.CURRENT_QUERY_EXT;
	this.QUERY_RESULT_AVAILABLE_EXT = this.extension.QUERY_RESULT_AVAILABLE_EXT;
	this.GPU_DISJOINT_EXT = this.extension.GPU_DISJOINT_EXT;
	this.QUERY_RESULT_EXT = this.extension.QUERY_RESULT_EXT;
	this.TIME_ELAPSED_EXT = this.extension.TIME_ELAPSED_EXT;
	this.TIMESTAMP_EXT = this.extension.TIMESTAMP_EXT;

}

EXTDisjointTimerQueryExtensionWrapper.prototype.createQueryEXT = function(){

	return new WebGLTimerQueryEXTWrapper( this.contextWrapper, this.extension );

}

EXTDisjointTimerQueryExtensionWrapper.prototype.beginQueryEXT = function( type, query ){

	if( this.contextWrapper.activeQuery ){
		this.extension.endQueryEXT( type );
		this.contextWrapper.activeQuery.nested.push( query );
		this.contextWrapper.queryStack.push( this.contextWrapper.activeQuery );
	}

	this.contextWrapper.activeQuery = query;

	return this.extension.beginQueryEXT( type, query.query );

}

EXTDisjointTimerQueryExtensionWrapper.prototype.endQueryEXT = function( type ){

	this.contextWrapper.activeQuery = this.contextWrapper.queryStack.pop();
	var res = this.extension.endQueryEXT( type );
	if( this.contextWrapper.activeQuery ){
		var newQuery = new WebGLTimerQueryEXTWrapper( this.contextWrapper, this.extension );
		this.contextWrapper.activeQuery.nested.push( newQuery );
		this.extension.beginQueryEXT( type, newQuery.query );
	}
	return res;

}

EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryObjectEXT = function( query, pname ){

	if( pname === this.extension.QUERY_RESULT_AVAILABLE_EXT ){
		return query.getResultsAvailable();
	}

	if( pname === this.extension.QUERY_RESULT_EXT ){
		return query.getTimes();
	}

	return this.extension.getQueryObjectEXT( query.query, pname );

}

EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryEXT = function( target, pname ){

	return this.extension.getQueryEXT( target, pname );

}

export { EXTDisjointTimerQueryExtensionWrapper };
