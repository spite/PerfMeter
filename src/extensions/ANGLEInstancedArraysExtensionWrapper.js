import{ Wrapper } from "../Wrapper";

function ANGLEInstancedArraysExtensionWrapper( contextWrapper ) {

	Wrapper.call( this );

	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'ANGLE_instanced_arrays' ] );

}

ANGLEInstancedArraysExtensionWrapper.prototype = Object.create( Wrapper.prototype );

ANGLEInstancedArraysExtensionWrapper.prototype.drawArraysInstancedANGLE = function() {

	this.contextWrapper.instancedDrawArraysCalls++;
	this.contextWrapper.updateInstancedDrawCount( arguments[ 0 ], arguments[ 2 ] * arguments[ 3 ] );
	return this.contextWrapper.run( 'drawArraysInstancedANGLE', arguments, _ => {
		return this.extension.drawArraysInstancedANGLE.apply( this.extension, arguments );
	} );

}

ANGLEInstancedArraysExtensionWrapper.prototype.drawElementsInstancedANGLE = function() {

	this.contextWrapper.instancedDrawElementsCalls++;
	this.contextWrapper.updateInstancedDrawCount( arguments[ 0 ], arguments[ 1 ] * arguments[ 4 ] );
	return this.contextWrapper.run( 'drawElementsInstancedANGLE', arguments, _ => {
		return this.extension.drawElementsInstancedANGLE.apply( this.extension, arguments );
	} );

}

ANGLEInstancedArraysExtensionWrapper.prototype.vertexAttribDivisorANGLE = function() {

	return this.extension.vertexAttribDivisorANGLE.apply( this.extension, arguments );

}

export { ANGLEInstancedArraysExtensionWrapper };
