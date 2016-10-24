import{ createUUID } from "../utils";

function WebGLDebugShadersExtensionWrapper( contextWrapper ){

	this.id = createUUID();
	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply( this.contextWrapper.context, [ 'WEBGL_debug_shaders' ] );

}

WebGLDebugShadersExtensionWrapper.prototype.getTranslatedShaderSource = function( shaderWrapper ){

	return this.extension.getTranslatedShaderSource( shaderWrapper.shader );

}

export { WebGLDebugShadersExtensionWrapper };
