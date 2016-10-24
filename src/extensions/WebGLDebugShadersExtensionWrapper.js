import{ Wrapper } from "../Wrapper";

function WebGLDebugShadersExtensionWrapper( contextWrapper ){

	Wrapper.call( this );

	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'WEBGL_debug_shaders' ] );

}

WebGLDebugShadersExtensionWrapper.prototype = Object.create( Wrapper.prototype );

WebGLDebugShadersExtensionWrapper.prototype.getTranslatedShaderSource = function( shaderWrapper ){

	return this.extension.getTranslatedShaderSource( shaderWrapper.shader );

}

export { WebGLDebugShadersExtensionWrapper };
