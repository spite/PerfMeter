import{ ContextWrapper } from "./ContextWrapper";

function CanvasRenderingContext2DWrapper( context ){

	ContextWrapper.call( this, context );

	this.frameId = null;

}

CanvasRenderingContext2DWrapper.prototype = Object.create( ContextWrapper.prototype );

CanvasRenderingContext2DWrapper.prototype.setFrameId = function( frameId ) {

	this.frameId = frameId;

}

CanvasRenderingContext2DWrapper.prototype.resetFrame = function(){

	ContextWrapper.prototype.resetFrame.call( this );

}

Object.keys( CanvasRenderingContext2D.prototype ).forEach( key => {

	if( key !== 'canvas' ){

		try{
			if( typeof CanvasRenderingContext2D.prototype[ key ] === 'function' ){
				CanvasRenderingContext2DWrapper.prototype[ key ] = function(){
					var args = new Array(arguments.length);
					for (var i = 0, l = arguments.length; i < l; i++){
						args[i] = arguments[i];
					}
					return this.run( key, args, _ => {
						return CanvasRenderingContext2D.prototype[ key ].apply( this.context, args );
					});
				}
			} else {
				CanvasRenderingContext2DWrapper.prototype[ key ] = CanvasRenderingContext2D.prototype[ key ];
			}
		} catch( e ){
			Object.defineProperty( CanvasRenderingContext2DWrapper.prototype, key, {
				get: function (){ return this.context[ key ]; },
				set: function ( v ){ this.context[ key ] = v; }
			});
		}

	}

});

export { CanvasRenderingContext2DWrapper };
