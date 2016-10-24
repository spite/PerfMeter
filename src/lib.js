(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.CanvasRenderingContext2DWrapper = undefined;

var _ContextWrapper = require('./ContextWrapper');

function CanvasRenderingContext2DWrapper(context) {

	_ContextWrapper.ContextWrapper.call(this, context);

	this.frameId = null;
}

CanvasRenderingContext2DWrapper.prototype = Object.create(_ContextWrapper.ContextWrapper.prototype);

CanvasRenderingContext2DWrapper.prototype.setFrameId = function (frameId) {

	this.frameId = frameId;
};

CanvasRenderingContext2DWrapper.prototype.resetFrame = function () {

	_ContextWrapper.ContextWrapper.prototype.resetFrame.call(this);
};

Object.keys(CanvasRenderingContext2D.prototype).forEach(function (key) {

	if (key !== 'canvas') {

		try {
			if (typeof CanvasRenderingContext2D.prototype[key] === 'function') {
				CanvasRenderingContext2DWrapper.prototype[key] = function () {
					var _this = this;

					var args = new Array(arguments.length);
					for (var i = 0, l = arguments.length; i < l; i++) {
						args[i] = arguments[i];
					}
					return this.run(key, args, function (_) {
						return CanvasRenderingContext2D.prototype[key].apply(_this.context, args);
					});
				};
			} else {
				CanvasRenderingContext2DWrapper.prototype[key] = CanvasRenderingContext2D.prototype[key];
			}
		} catch (e) {
			Object.defineProperty(CanvasRenderingContext2DWrapper.prototype, key, {
				get: function get() {
					return this.context[key];
				},
				set: function set(v) {
					this.context[key] = v;
				}
			});
		}
	}
});

exports.CanvasRenderingContext2DWrapper = CanvasRenderingContext2DWrapper;

},{"./ContextWrapper":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ContextWrapper = undefined;

var _Wrapper = require("./Wrapper");

function ContextWrapper(context) {

	_Wrapper.Wrapper.call(this);
	this.context = context;

	this.count = 0;
	this.JavaScriptTime = 0;

	this.log = [];
}

ContextWrapper.prototype = Object.create(_Wrapper.Wrapper.prototype);

ContextWrapper.prototype.run = function (fName, fArgs, fn) {

	this.incrementCount();
	this.beginProfile(fName, fArgs);
	var res = fn();
	this.endProfile();
	return res;
};

ContextWrapper.prototype.resetFrame = function () {

	this.resetCount();
	this.resetJavaScriptTime();
	this.resetLog();
};

ContextWrapper.prototype.resetCount = function () {

	this.count = 0;
};

ContextWrapper.prototype.incrementCount = function () {

	this.count++;
};

ContextWrapper.prototype.resetLog = function () {

	this.log.length = 0;
};

ContextWrapper.prototype.resetJavaScriptTime = function () {

	this.JavaScriptTime = 0;
};

ContextWrapper.prototype.incrementJavaScriptTime = function (time) {

	this.JavaScriptTime += time;
};

ContextWrapper.prototype.beginProfile = function (fn, args) {

	var t = performance.now();
	this.log.push({ function: fn, arguments: args, start: t, end: 0 });
	this.startTime = t;
};

ContextWrapper.prototype.endProfile = function () {

	var t = performance.now();
	this.log[this.log.length - 1].end = t;
	this.incrementJavaScriptTime(t - this.startTime);
};

exports.ContextWrapper = ContextWrapper;

},{"./Wrapper":5}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.WebGLRenderingContextWrapper = undefined;

var _utils = require("./utils");

var _ContextWrapper = require("./ContextWrapper");

var _EXTDisjointTimerQueryExtensionWrapper = require("./extensions/EXTDisjointTimerQueryExtensionWrapper");

var _WebGLDebugShadersExtensionWrapper = require("./extensions/WebGLDebugShadersExtensionWrapper");

var _ANGLEInstancedArraysExtensionWrapper = require("./extensions/ANGLEInstancedArraysExtensionWrapper");

function WebGLRenderingContextWrapper(context) {

	_ContextWrapper.ContextWrapper.call(this, context);

	this.queryStack = [];
	this.activeQuery = null;
	this.queryExt = null;

	this.drawQueries = [];

	this.programCount = 0;
	this.textureCount = 0;
	this.framebufferCount = 0;

	this.useProgramCount = 0;
	this.bindTextureCount = 0;
	this.bindFramebufferCount = 0;

	this.drawArraysCalls = 0;
	this.drawElementsCalls = 0;

	this.instancedDrawArraysCalls = 0;
	this.instancedDrawElementsCalls = 0;

	this.pointsCount = 0;
	this.linesCount = 0;
	this.trianglesCount = 0;

	this.instancedPointsCount = 0;
	this.instancedLinesCount = 0;
	this.instancedTrianglesCount = 0;

	this.frameId = null;
	this.currentProgram = null;
}

WebGLRenderingContextWrapper.prototype = Object.create(_ContextWrapper.ContextWrapper.prototype);

WebGLRenderingContextWrapper.prototype.cloned = false;

cloneWebGLRenderingContextPrototype();

WebGLRenderingContextWrapper.prototype.setFrameId = function (frameId) {

	this.frameId = frameId;
};

WebGLRenderingContextWrapper.prototype.resetFrame = function () {

	_ContextWrapper.ContextWrapper.prototype.resetFrame.call(this);

	this.useProgramCount = 0;
	this.bindTextureCount = 0;
	this.bindFramebufferCount = 0;

	this.drawArraysCalls = 0;
	this.drawElementsCalls = 0;

	this.instancedDrawArraysCalls = 0;
	this.instancedDrawElementsCalls = 0;

	this.pointsCount = 0;
	this.linesCount = 0;
	this.trianglesCount = 0;

	this.instancedPointsCount = 0;
	this.instancedLinesCount = 0;
	this.instancedTrianglesCount = 0;
};

function cloneWebGLRenderingContextPrototype() {

	// some sites (e.g. http://codeflow.org/webgl/deferred-irradiance-volumes/www/)
	// modify the prototype, and they do it after the initial check for support

	// if( WebGLRenderingContextWrapper.prototype.cloned ) return;
	// WebGLRenderingContextWrapper.prototype.cloned = true;

	Object.keys(WebGLRenderingContext.prototype).forEach(function (key) {

		// .canvas is weird, so it's directly assigned when creating the wrapper

		if (key !== 'canvas') {

			try {
				if (typeof WebGLRenderingContext.prototype[key] === 'function') {
					WebGLRenderingContextWrapper.prototype[key] = function () {
						var _this = this;

						var args = new Array(arguments.length);
						for (var i = 0, l = arguments.length; i < l; i++) {
							args[i] = arguments[i];
						}
						return this.run(key, args, function (_) {
							return WebGLRenderingContext.prototype[key].apply(_this.context, args);
						});
					};
				} else {
					WebGLRenderingContextWrapper.prototype[key] = WebGLRenderingContext.prototype[key];
				}
			} catch (e) {
				Object.defineProperty(WebGLRenderingContext.prototype, key, {
					get: function get() {
						return this.context[key];
					},
					set: function set(v) {
						this.context[key] = v;
					}
				});
			}
		}
	});

	instrumentWebGLRenderingContext();
}

var extensionWrappers = {
	WEBGL_debug_shaders: _WebGLDebugShadersExtensionWrapper.WebGLDebugShadersExtensionWrapper,
	EXT_disjoint_timer_query: _EXTDisjointTimerQueryExtensionWrapper.EXTDisjointTimerQueryExtensionWrapper,
	ANGLE_instanced_arrays: _ANGLEInstancedArraysExtensionWrapper.ANGLEInstancedArraysExtensionWrapper
};

WebGLRenderingContextWrapper.prototype.getExtension = function () {
	var _this2 = this;

	var extensionName = arguments[0];

	return this.run('getExtension', arguments, function (_) {

		var wrapper = extensionWrappers[extensionName];
		if (wrapper) {
			return new wrapper(_this2);
		}

		return _this2.context.getExtension(extensionName);
	});
};

WebGLRenderingContextWrapper.prototype.updateDrawCount = function (mode, count) {

	var gl = this.context;

	switch (mode) {
		case gl.POINTS:
			this.pointsCount += count;
			break;
		case gl.LINE_STRIP:
			this.linesCount += count - 1;
			break;
		case gl.LINE_LOOP:
			this.linesCount += count;
			break;
		case gl.LINES:
			this.linesCount += count / 2;
			break;
		case gl.TRIANGLE_STRIP:
		case gl.TRIANGLE_FAN:
			this.trianglesCount += count - 2;
			break;
		case gl.TRIANGLES:
			this.trianglesCount += count / 3;
			break;
	}
};

WebGLRenderingContextWrapper.prototype.updateInstancedDrawCount = function (mode, count) {

	var gl = this.context;

	switch (mode) {
		case gl.POINTS:
			this.instancedPointsCount += count;
			break;
		case gl.LINE_STRIP:
			this.instancedLinesCount += count - 1;
			break;
		case gl.LINE_LOOP:
			this.instancedLinesCount += count;
			break;
		case gl.LINES:
			this.instancedLinesCount += count / 2;
			break;
		case gl.TRIANGLE_STRIP:
		case gl.TRIANGLE_FAN:
			this.instancedTrianglesCount += count - 2;
			break;
		case gl.TRIANGLES:
			this.instancedTrianglesCount += count / 3;
			break;
	}
};

WebGLRenderingContextWrapper.prototype.drawElements = function () {
	var _this3 = this,
	    _arguments = arguments;

	this.drawElementsCalls++;
	this.updateDrawCount(arguments[0], arguments[1]);

	return this.run('drawElements', arguments, function (_) {

		var program = _this3.context.getParameter(_this3.context.CURRENT_PROGRAM);
		if (program !== _this3.currentProgram.program) {
			debugger;
		}

		if (settings.profileShaders) {
			var ext = _this3.queryExt;
			var query = ext.createQueryEXT();
			ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, query);
			_this3.drawQueries.push({
				query: query,
				program: _this3.currentProgram,
				frameId: _this3.frameId
			});
		}

		var res = WebGLRenderingContext.prototype.drawElements.apply(_this3.context, _arguments);

		if (settings.profileShaders) {
			ext.endQueryEXT(ext.TIME_ELAPSED_EXT);
		}

		return res;
	});
};

WebGLRenderingContextWrapper.prototype.drawArrays = function () {
	var _this4 = this,
	    _arguments2 = arguments;

	this.drawArraysCalls++;
	this.updateDrawCount(arguments[0], arguments[2]);

	return this.run('drawArrays', arguments, function (_) {

		var program = _this4.context.getParameter(_this4.context.CURRENT_PROGRAM);
		if (program !== _this4.currentProgram.program) {
			debugger;
		}

		if (settings.profileShaders) {
			var ext = _this4.queryExt;
			var query = ext.createQueryEXT();
			ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, query);
			_this4.drawQueries.push({
				query: query,
				program: _this4.currentProgram,
				frameId: _this4.frameId
			});
		}

		var res = WebGLRenderingContext.prototype.drawArrays.apply(_this4.context, _arguments2);

		if (settings.profileShaders) {
			ext.endQueryEXT(ext.TIME_ELAPSED_EXT);
		}

		return res;
	});
};

function WebGLShaderWrapper(contextWrapper, type) {

	this.id = (0, _utils.createUUID)();
	this.contextWrapper = contextWrapper;
	this.shader = WebGLRenderingContext.prototype.createShader.apply(this.contextWrapper.context, [type]);
	this.version = 1;
	this.source = null;
	this.type = type;
}

WebGLShaderWrapper.prototype.shaderSource = function (source) {

	this.source = source;
	return WebGLRenderingContext.prototype.shaderSource.apply(this.contextWrapper.context, [this.shader, source]);
};

function WebGLUniformLocationWrapper(contextWrapper, program, name) {

	this.id = (0, _utils.createUUID)();
	this.contextWrapper = contextWrapper;
	this.program = program;
	this.name = name;
	this.getUniformLocation();

	this.program.uniformLocations[this.name] = this;

	//log( 'Location for uniform', name, 'on program', this.program.id );
}

WebGLUniformLocationWrapper.prototype.getUniformLocation = function () {

	this.uniformLocation = WebGLRenderingContext.prototype.getUniformLocation.apply(this.contextWrapper, [this.program.program, this.name]);
};

function WebGLProgramWrapper(contextWrapper) {

	this.id = (0, _utils.createUUID)();
	this.contextWrapper = contextWrapper;
	this.program = WebGLRenderingContext.prototype.createProgram.apply(this.contextWrapper.context);
	this.version = 1;
	this.vertexShaderWrapper = null;
	this.fragmentShaderWrapper = null;

	this.uniformLocations = {};
}

WebGLProgramWrapper.prototype.attachShader = function () {
	var _this5 = this;

	var shaderWrapper = arguments[0];

	if (shaderWrapper.type == this.contextWrapper.context.VERTEX_SHADER) this.vertexShaderWrapper = shaderWrapper;
	if (shaderWrapper.type == this.contextWrapper.context.FRAGMENT_SHADER) this.fragmentShaderWrapper = shaderWrapper;

	return this.contextWrapper.run('attachShader', arguments, function (_) {
		return WebGLRenderingContext.prototype.attachShader.apply(_this5.contextWrapper.context, [_this5.program, shaderWrapper.shader]);
	});
};

WebGLProgramWrapper.prototype.highlight = function () {
	var _this6 = this;

	detachShader.apply(this.contextWrapper.context, [this.program, this.fragmentShaderWrapper.shader]);

	var fs = this.fragmentShaderWrapper.source;
	fs = fs.replace(/\s+main\s*\(/, ' ShaderEditorInternalMain(');
	fs += '\r\n' + 'void main(){ ShaderEditorInternalMain(); gl_FragColor.rgb *= vec3(1.,0.,1.); }';

	var highlightShaderWrapper = new WebGLShaderWrapper(this.contextWrapper, this.contextWrapper.context.FRAGMENT_SHADER);
	highlightShaderWrapper.shaderSource(fs);
	WebGLRenderingContext.prototype.compileShader.apply(this.contextWrapper.context, [highlightShaderWrapper.shader]);
	WebGLRenderingContext.prototype.attachShader.apply(this.contextWrapper.context, [this.program, highlightShaderWrapper.shader]);
	WebGLRenderingContext.prototype.linkProgram.apply(this.contextWrapper.context, [this.program]);

	Object.keys(this.uniformLocations).forEach(function (name) {
		_this6.uniformLocations[name].getUniformLocation();
	});
};

function instrumentWebGLRenderingContext() {

	WebGLRenderingContextWrapper.prototype.createShader = function () {
		var _this7 = this,
		    _arguments3 = arguments;

		log('create shader');
		return this.run('createShader', arguments, function (_) {
			return new WebGLShaderWrapper(_this7, _arguments3[0]);
		});
	};

	WebGLRenderingContextWrapper.prototype.shaderSource = function () {
		var _arguments4 = arguments;


		return this.run('shaderSource', arguments, function (_) {
			return _arguments4[0].shaderSource(_arguments4[1]);
		});
	};

	WebGLRenderingContextWrapper.prototype.compileShader = function () {
		var _this8 = this,
		    _arguments5 = arguments;

		return this.run('compileShader', arguments, function (_) {
			return WebGLRenderingContext.prototype.compileShader.apply(_this8.context, [_arguments5[0].shader]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getShaderParameter = function () {
		var _this9 = this,
		    _arguments6 = arguments;

		return this.run('getShaderParameter', arguments, function (_) {
			return WebGLRenderingContext.prototype.getShaderParameter.apply(_this9.context, [_arguments6[0].shader, _arguments6[1]]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getShaderInfoLog = function () {
		var _this10 = this,
		    _arguments7 = arguments;

		return this.run('getShaderInfoLog', arguments, function (_) {
			return WebGLRenderingContext.prototype.getShaderInfoLog.apply(_this10.context, [_arguments7[0].shader]);
		});
	};

	WebGLRenderingContextWrapper.prototype.deleteShader = function () {
		var _this11 = this,
		    _arguments8 = arguments;

		return this.run('deleteShader', arguments, function (_) {
			return WebGLRenderingContext.prototype.deleteShader.apply(_this11.context, [_arguments8[0].shader]);
		});
	};

	WebGLRenderingContextWrapper.prototype.createProgram = function () {
		var _this12 = this;

		log('create program');
		this.programCount++;
		return this.run('createProgram', arguments, function (_) {
			return new WebGLProgramWrapper(_this12);
		});
	};

	WebGLRenderingContextWrapper.prototype.deleteProgram = function (programWrapper) {
		var _this13 = this;

		this.incrementCount();
		this.programCount--;
		return this.run('deleteProgram', arguments, function (_) {
			return WebGLRenderingContext.prototype.deleteProgram.apply(_this13.context, [programWrapper.program]);
		});
	};

	WebGLRenderingContextWrapper.prototype.attachShader = function () {

		return arguments[0].attachShader(arguments[1]);
	};

	WebGLRenderingContextWrapper.prototype.linkProgram = function () {
		var _this14 = this,
		    _arguments9 = arguments;

		return this.run('linkProgram', arguments, function (_) {
			return WebGLRenderingContext.prototype.linkProgram.apply(_this14.context, [_arguments9[0].program]);
		});
	};

	WebGLRenderingContextWrapper.prototype.validateProgram = function () {
		var _this15 = this,
		    _arguments10 = arguments;

		return this.run('validateProgram', arguments, function (_) {
			return WebGLRenderingContext.prototype.validateProgram.apply(_this15.context, [_arguments10[0].program]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getProgramParameter = function () {
		var _this16 = this,
		    _arguments11 = arguments;

		return this.run('getProgramParameter', arguments, function (_) {
			return WebGLRenderingContext.prototype.getProgramParameter.apply(_this16.context, [_arguments11[0].program, _arguments11[1]]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getProgramInfoLog = function () {
		var _this17 = this,
		    _arguments12 = arguments;

		return this.run('getProgramInfoLog', arguments, function (_) {
			return WebGLRenderingContext.prototype.getProgramInfoLog.apply(_this17.context, [_arguments12[0].program]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getActiveAttrib = function () {
		var _this18 = this,
		    _arguments13 = arguments;

		return this.run('getActiveAttrib', arguments, function (_) {
			return WebGLRenderingContext.prototype.getActiveAttrib.apply(_this18.context, [_arguments13[0].program, _arguments13[1]]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getAttribLocation = function () {
		var _this19 = this,
		    _arguments14 = arguments;

		return this.run('getAttribLocation', arguments, function (_) {
			return WebGLRenderingContext.prototype.getAttribLocation.apply(_this19.context, [_arguments14[0].program, _arguments14[1]]);
		});
	};

	WebGLRenderingContextWrapper.prototype.bindAttribLocation = function () {
		var _this20 = this,
		    _arguments15 = arguments;

		return this.run('bindAttribLocation', arguments, function (_) {
			return WebGLRenderingContext.prototype.bindAttribLocation.apply(_this20.context, [_arguments15[0].program, _arguments15[1], _arguments15[2]]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getActiveUniform = function () {
		var _this21 = this,
		    _arguments16 = arguments;

		return this.run('getActiveUniform', arguments, function (_) {
			return WebGLRenderingContext.prototype.getActiveUniform.apply(_this21.context, [_arguments16[0].program, _arguments16[1]]);
		});
	};

	WebGLRenderingContextWrapper.prototype.getUniformLocation = function () {
		var _this22 = this,
		    _arguments17 = arguments;

		return this.run('getUniformLocation', arguments, function (_) {
			return new WebGLUniformLocationWrapper(_this22.context, _arguments17[0], _arguments17[1]);
		});
	};

	WebGLRenderingContextWrapper.prototype.useProgram = function () {
		var _this23 = this,
		    _arguments18 = arguments;

		this.useProgramCount++;
		this.currentProgram = arguments[0];
		return this.run('useProgram', arguments, function (_) {
			return WebGLRenderingContext.prototype.useProgram.apply(_this23.context, [_arguments18[0] ? _arguments18[0].program : null]);
		});
	};

	WebGLRenderingContextWrapper.prototype.createTexture = function () {
		var _this24 = this,
		    _arguments19 = arguments;

		this.textureCount++;
		return this.run('createTexture', arguments, function (_) {
			return WebGLRenderingContext.prototype.createTexture.apply(_this24.context, _arguments19);
		});
	};

	WebGLRenderingContextWrapper.prototype.deleteTexture = function () {
		var _this25 = this,
		    _arguments20 = arguments;

		this.textureCount--;
		return this.run('deleteTexture', arguments, function (_) {
			return WebGLRenderingContext.prototype.deleteTexture.apply(_this25.context, _arguments20);
		});
	};

	WebGLRenderingContextWrapper.prototype.bindTexture = function () {
		var _this26 = this,
		    _arguments21 = arguments;

		this.bindTextureCount++;
		return this.run('bindTexture', arguments, function (_) {
			return WebGLRenderingContext.prototype.bindTexture.apply(_this26.context, _arguments21);
		});
	};

	WebGLRenderingContextWrapper.prototype.createFramebuffer = function () {
		var _this27 = this,
		    _arguments22 = arguments;

		this.framebufferCount++;
		return this.run('createFramebuffer', arguments, function (_) {
			return WebGLRenderingContext.prototype.createFramebuffer.apply(_this27.context, _arguments22);
		});
	};

	WebGLRenderingContextWrapper.prototype.deleteFramebuffer = function () {
		var _this28 = this,
		    _arguments23 = arguments;

		this.framebufferCount--;
		return this.run('deleteFramebuffer', arguments, function (_) {
			return WebGLRenderingContext.prototype.deleteFramebuffer.apply(_this28.context, _arguments23);
		});
	};

	WebGLRenderingContextWrapper.prototype.bindFramebuffer = function () {
		var _this29 = this,
		    _arguments24 = arguments;

		this.bindFramebufferCount++;
		return this.run('bindFramebuffer', arguments, function (_) {
			return WebGLRenderingContext.prototype.bindFramebuffer.apply(_this29.context, _arguments24);
		});
	};

	var methods = ['uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv', 'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv', 'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv', 'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv', 'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'];

	var originalMethods = {};

	methods.forEach(function (method) {

		var original = WebGLRenderingContext.prototype[method];
		originalMethods[method] = original;

		WebGLRenderingContextWrapper.prototype[method] = function () {
			var _this30 = this;

			var args = new Array(arguments.length);
			for (var i = 0, l = arguments.length; i < l; i++) {
				args[i] = arguments[i];
			}
			if (!args[0]) return;
			args[0] = args[0].uniformLocation;
			return this.run(method, args, function (_) {
				return original.apply(_this30.context, args);
			});
		};
	});
}

exports.WebGLRenderingContextWrapper = WebGLRenderingContextWrapper;

},{"./ContextWrapper":2,"./extensions/ANGLEInstancedArraysExtensionWrapper":6,"./extensions/EXTDisjointTimerQueryExtensionWrapper":7,"./extensions/WebGLDebugShadersExtensionWrapper":8,"./utils":10}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var text = document.createElement('div');
text.setAttribute('id', 'perfmeter-panel');

function setupUI() {

	var fileref = document.createElement("link");
	fileref.rel = "stylesheet";
	fileref.type = "text/css";
	fileref.href = settings.cssPath;

	window.document.getElementsByTagName("head")[0].appendChild(fileref);

	window.document.body.appendChild(text);

	window.addEventListener('perfmeter-framedata', updateUI);
}

if (!window.document.body) {
	window.addEventListener('load', setupUI);
} else {
	setupUI();
}

function updateUI(e) {

	var d = e.detail;

	if (d.rAFS === 0 || d.logs.length === 0) {
		text.style.display = 'none';
	} else {
		text.style.display = 'block';
	}

	var blocks = [];

	blocks.push('Framerate: ' + d.framerate.toFixed(2) + ' FPS\n\tFrame JS time: ' + d.frameTime.toFixed(2) + ' ms\n\trAFS: ' + d.rAFS);

	d.logs.forEach(function (l) {

		if (l.count) {

			var shaderTime = [];
			Object.keys(l.shaderTime).forEach(function (key) {
				shaderTime.push(key + ' ' + (l.shaderTime[key] / 1000000).toFixed(2) + ' ms');
			});
			var shaderTimeStr = shaderTime.join("\r\n");

			blocks.push('<b>Canvas</b>\nID: ' + l.id + '\nCount: ' + l.count + '\nCanvas time: ' + l.jstime + ' ms\n<b>WebGL</b>\nGPU time: ' + l.time + ' ms\nShader time:\n' + shaderTimeStr + '\nPrograms: ' + l.usePrograms + ' / ' + l.programs + '\nTextures: ' + l.bindTextures + ' / ' + l.textures + '\nFramebuffers: ' + l.bindFramebuffers + ' / ' + l.framebuffers + '\ndArrays: ' + l.drawArrays + '\ndElems: ' + l.drawElements + '\nPoints: ' + l.points + '\nLines: ' + l.lines + '\nTriangles: ' + l.triangles + '\nidArrays: ' + l.instancedDrawArrays + '\nidElems: ' + l.instancedDrawElements + '\niPoints: ' + l.instancedPoints + '\niLines: ' + l.instancedLines + '\niTriangles: ' + l.instancedTriangles);
		}
	});

	blocks.push('<b>Browser</b>\nMem: ' + (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) + '/' + (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2));

	if (settings.showGPUInfo) blocks.push(glInfo);

	text.innerHTML = blocks.join("\r\n\r\n");
}

var glInfo = '';

function setInfo(info) {

	glInfo = info;
}

exports.setInfo = setInfo;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Wrapper = undefined;

var _utils = require("./utils");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Wrapper = function Wrapper() {
    _classCallCheck(this, Wrapper);

    this.id = (0, _utils.createUUID)();
};

exports.Wrapper = Wrapper;

},{"./utils":10}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ANGLEInstancedArraysExtensionWrapper = undefined;

var _Wrapper = require('../Wrapper');

function ANGLEInstancedArraysExtensionWrapper(contextWrapper) {

	_Wrapper.Wrapper.call(this);

	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply(this.contextWrapper.context, ['ANGLE_instanced_arrays']);
}

ANGLEInstancedArraysExtensionWrapper.prototype = Object.create(_Wrapper.Wrapper.prototype);

ANGLEInstancedArraysExtensionWrapper.prototype.drawArraysInstancedANGLE = function () {
	var _this = this,
	    _arguments = arguments;

	this.contextWrapper.instancedDrawArraysCalls++;
	this.contextWrapper.updateInstancedDrawCount(arguments[0], arguments[2] * arguments[3]);
	return this.contextWrapper.run('drawArraysInstancedANGLE', arguments, function (_) {
		return _this.extension.drawArraysInstancedANGLE.apply(_this.extension, _arguments);
	});
};

ANGLEInstancedArraysExtensionWrapper.prototype.drawElementsInstancedANGLE = function () {
	var _this2 = this,
	    _arguments2 = arguments;

	this.contextWrapper.instancedDrawElementsCalls++;
	this.contextWrapper.updateInstancedDrawCount(arguments[0], arguments[1] * arguments[4]);
	return this.contextWrapper.run('drawElementsInstancedANGLE', arguments, function (_) {
		return _this2.extension.drawElementsInstancedANGLE.apply(_this2.extension, _arguments2);
	});
};

ANGLEInstancedArraysExtensionWrapper.prototype.vertexAttribDivisorANGLE = function () {

	return this.extension.vertexAttribDivisorANGLE.apply(this.extension, arguments);
};

exports.ANGLEInstancedArraysExtensionWrapper = ANGLEInstancedArraysExtensionWrapper;

},{"../Wrapper":5}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.EXTDisjointTimerQueryExtensionWrapper = undefined;

var _Wrapper = require("../Wrapper");

function WebGLTimerQueryEXTWrapper(contextWrapper, extension) {

	_Wrapper.Wrapper.call(this);

	this.contextWrapper = contextWrapper;
	this.extension = extension;
	this.query = this.extension.createQueryEXT();
	this.time = -1;
	this.nestedTime = -1;
	this.available = false;
	this.nested = [];
}

WebGLTimerQueryEXTWrapper.prototype = Object.create(_Wrapper.Wrapper.prototype);

WebGLTimerQueryEXTWrapper.prototype.getTimes = function () {

	var time = this.getTime();
	this.nested.forEach(function (q) {
		time += q.getTimes();
	});

	this.nestedTime = time;

	return time;
};

WebGLTimerQueryEXTWrapper.prototype.getTime = function () {

	if (this.time !== -1) return this.time;

	this.time = this.extension.getQueryObjectEXT(this.query, this.extension.QUERY_RESULT_EXT);
	return this.time;
};

WebGLTimerQueryEXTWrapper.prototype.getResultsAvailable = function () {

	var res = true;
	this.nested.forEach(function (q) {
		res = res && q.getResultsAvailable();
	});

	return res;
};

WebGLTimerQueryEXTWrapper.prototype.getResultsAvailable = function () {

	if (this.available) return true;

	this.available = this.extension.getQueryObjectEXT(this.query, this.extension.QUERY_RESULT_AVAILABLE_EXT);
	return this.available;
};

function EXTDisjointTimerQueryExtensionWrapper(contextWrapper) {

	_Wrapper.Wrapper.call(this);

	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply(this.contextWrapper.context, ['EXT_disjoint_timer_query']);

	this.QUERY_COUNTER_BITS_EXT = this.extension.QUERY_COUNTER_BITS_EXT;
	this.CURRENT_QUERY_EXT = this.extension.CURRENT_QUERY_EXT;
	this.QUERY_RESULT_AVAILABLE_EXT = this.extension.QUERY_RESULT_AVAILABLE_EXT;
	this.GPU_DISJOINT_EXT = this.extension.GPU_DISJOINT_EXT;
	this.QUERY_RESULT_EXT = this.extension.QUERY_RESULT_EXT;
	this.TIME_ELAPSED_EXT = this.extension.TIME_ELAPSED_EXT;
	this.TIMESTAMP_EXT = this.extension.TIMESTAMP_EXT;
}

EXTDisjointTimerQueryExtensionWrapper.prototype = Object.create(_Wrapper.Wrapper.prototype);

EXTDisjointTimerQueryExtensionWrapper.prototype.createQueryEXT = function () {

	return new WebGLTimerQueryEXTWrapper(this.contextWrapper, this.extension);
};

EXTDisjointTimerQueryExtensionWrapper.prototype.beginQueryEXT = function (type, query) {

	if (this.contextWrapper.activeQuery) {
		this.extension.endQueryEXT(type);
		this.contextWrapper.activeQuery.nested.push(query);
		this.contextWrapper.queryStack.push(this.contextWrapper.activeQuery);
	}

	this.contextWrapper.activeQuery = query;

	return this.extension.beginQueryEXT(type, query.query);
};

EXTDisjointTimerQueryExtensionWrapper.prototype.endQueryEXT = function (type) {

	this.contextWrapper.activeQuery = this.contextWrapper.queryStack.pop();
	var res = this.extension.endQueryEXT(type);
	if (this.contextWrapper.activeQuery) {
		var newQuery = new WebGLTimerQueryEXTWrapper(this.contextWrapper, this.extension);
		this.contextWrapper.activeQuery.nested.push(newQuery);
		this.extension.beginQueryEXT(type, newQuery.query);
	}
	return res;
};

EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryObjectEXT = function (query, pname) {

	if (pname === this.extension.QUERY_RESULT_AVAILABLE_EXT) {
		return query.getResultsAvailable();
	}

	if (pname === this.extension.QUERY_RESULT_EXT) {
		return query.getTimes();
	}

	return this.extension.getQueryObjectEXT(query.query, pname);
};

EXTDisjointTimerQueryExtensionWrapper.prototype.getQueryEXT = function (target, pname) {

	return this.extension.getQueryEXT(target, pname);
};

exports.EXTDisjointTimerQueryExtensionWrapper = EXTDisjointTimerQueryExtensionWrapper;

},{"../Wrapper":5}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.WebGLDebugShadersExtensionWrapper = undefined;

var _Wrapper = require("../Wrapper");

function WebGLDebugShadersExtensionWrapper(contextWrapper) {

	_Wrapper.Wrapper.call(this);

	this.contextWrapper = contextWrapper;
	this.extension = WebGLRenderingContext.prototype.getExtension.apply(this.contextWrapper.context, ['WEBGL_debug_shaders']);
}

WebGLDebugShadersExtensionWrapper.prototype = Object.create(_Wrapper.Wrapper.prototype);

WebGLDebugShadersExtensionWrapper.prototype.getTranslatedShaderSource = function (shaderWrapper) {

	return this.extension.getTranslatedShaderSource(shaderWrapper.shader);
};

exports.WebGLDebugShadersExtensionWrapper = WebGLDebugShadersExtensionWrapper;

},{"../Wrapper":5}],9:[function(require,module,exports){
"use strict";

var _utils = require("./utils");

var _CanvasRenderingContext2DWrapper = require("./CanvasRenderingContext2DWrapper");

var _WebGLRenderingContextWrapper = require("./WebGLRenderingContextWrapper");

var _widget = require("./widget");

window.addEventListener('perfmeter-settings', function (e) {
	settings = e.detail;
});

var glInfo = {
	versions: [],
	WebGLAvailable: 'WebGLRenderingContext' in window,
	WebGL2Available: 'WebGL2RenderingContext' in window
};

var getGLInfo = function getGLInfo(context) {
	var gl = document.createElement('canvas').getContext(context);
	if (!gl) return;
	var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	var version = {
		type: context,
		vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
		renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
		glVersion: gl.getParameter(gl.VERSION),
		glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
	};
	glInfo.versions.push(version);
};

getGLInfo('webgl');
getGLInfo('webgl2');

var webGLInfo = '';
glInfo.versions.forEach(function (v) {
	var glInfo = "GL Version: " + v.glVersion + "\nGLSL Version: " + v.glslVersion + "\nVendor: " + v.vendor + "\nRenderer: " + v.renderer + "\n";
	webGLInfo += glInfo;
});

(0, _widget.setInfo)(webGLInfo);

function FrameData(id) {

	this.frameId = id;

	this.framerate = 0;
	this.frameTime = 0;
	this.JavaScriptTime = 0;

	this.contexts = new Map();
}

function ContextFrameData(type) {

	this.type = type;

	this.JavaScriptTime = 0;
	this.GPUTime = 0;
	this.log = [];

	this.createProgram = 0;
	this.createTexture = 0;

	this.useProgram = 0;
	this.bindTexture = 0;

	this.triangles = 0;
	this.lines = 0;
	this.points = 0;

	this.startTime = 0;
}

function ContextData(contextWrapper) {

	this.id = (0, _utils.createUUID)();
	this.queryExt = null;
	this.contextWrapper = contextWrapper;
	this.extQueries = [];

	this.metrics = {};
}

var contexts = [];
var canvasContexts = new WeakMap();

var getContext = HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.getContext = function () {

	var c = canvasContexts.get(this);
	if (c) {
		log(arguments, '(CACHED)');
		return c;
	} else {
		log(arguments);
	}

	var context = getContext.apply(this, arguments);

	if (arguments[0] === 'webgl' || arguments[0] === 'experimental-webgl') {

		var wrapper = new _WebGLRenderingContextWrapper.WebGLRenderingContextWrapper(context);
		wrapper.canvas = this;
		var cData = new ContextData(wrapper);
		cData.queryExt = wrapper.getExtension('EXT_disjoint_timer_query');
		wrapper.queryExt = cData.queryExt;
		contexts.push(cData);
		canvasContexts.set(this, wrapper);
		return wrapper;
	}

	if (arguments[0] === '2d') {

		var wrapper = new _CanvasRenderingContext2DWrapper.CanvasRenderingContext2DWrapper(context);
		wrapper.canvas = this;
		var cData = new ContextData(wrapper);
		contexts.push(cData);
		canvasContexts.set(this, wrapper);
		return wrapper;
	}

	canvasContexts.set(this, context);
	return context;
};

//
// This is the rAF queue processing
//

var originalRequestAnimationFrame = window.requestAnimationFrame;
var rAFQueue = [];
var frameCount = 0;
var frameId = 0;
var framerate = 0;
var lastTime = 0;

window.requestAnimationFrame = function (c) {

	rAFQueue.push(c);
};

function processRequestAnimationFrames(timestamp) {

	contexts.forEach(function (ctx) {

		ctx.contextWrapper.setFrameId(frameId);
		ctx.contextWrapper.resetFrame();

		var ext = ctx.queryExt;

		if (ext) {

			var query = ext.createQueryEXT();
			ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, query);
			ctx.extQueries.push({
				query: query,
				frameId: frameId
			});
		}
	});

	var startTime = performance.now();

	var queue = rAFQueue.slice(0);
	rAFQueue.length = 0;
	queue.forEach(function (rAF) {
		rAF(timestamp);
	});

	var endTime = performance.now();
	var frameTime = endTime - startTime;

	frameCount++;
	if (endTime > lastTime + 1000) {
		framerate = frameCount * 1000 / (endTime - lastTime);
		frameCount = 0;
		lastTime = endTime;
	}

	frameId++;

	contexts.forEach(function (ctx) {

		var ext = ctx.queryExt;

		if (ext) {

			ext.endQueryEXT(ext.TIME_ELAPSED_EXT);

			ctx.extQueries.forEach(function (query, i) {

				var available = ext.getQueryObjectEXT(query.query, ext.QUERY_RESULT_AVAILABLE_EXT);
				var disjoint = ctx.contextWrapper.context.getParameter(ext.GPU_DISJOINT_EXT);

				if (available && !disjoint) {

					var queryTime = ext.getQueryObjectEXT(query.query, ext.QUERY_RESULT_EXT);
					var time = queryTime;

					var wrapper = ctx.contextWrapper;

					ctx.metrics = {
						id: wrapper.id,
						count: wrapper.count,
						time: (time / 1000000).toFixed(2),
						jstime: wrapper.JavaScriptTime.toFixed(2),
						drawArrays: wrapper.drawArraysCalls,
						drawElements: wrapper.drawElementsCalls,
						instancedDrawArrays: wrapper.instancedDrawArraysCalls,
						instancedDrawElements: wrapper.instancedDrawElementsCalls,
						points: wrapper.pointsCount,
						lines: wrapper.linesCount,
						triangles: wrapper.trianglesCount,
						instancedPoints: wrapper.instancedPointsCount,
						instancedLines: wrapper.instancedLinesCount,
						instancedTriangles: wrapper.instancedTrianglesCount,
						programs: wrapper.programCount,
						usePrograms: wrapper.useProgramCount,
						textures: wrapper.textureCount,
						bindTextures: wrapper.bindTextureCount,
						framebuffers: wrapper.framebufferCount,
						bindFramebuffers: wrapper.bindFramebufferCount
					};

					ctx.extQueries.splice(i, 1);
				}
			});

			ctx.metrics.shaderTime = {};

			ctx.contextWrapper.drawQueries.forEach(function (query, i) {

				var available = ext.getQueryObjectEXT(query.query, ext.QUERY_RESULT_AVAILABLE_EXT);
				var disjoint = ctx.contextWrapper.context.getParameter(ext.GPU_DISJOINT_EXT);

				if (available && !disjoint) {

					var queryTime = ext.getQueryObjectEXT(query.query, ext.QUERY_RESULT_EXT);
					var time = queryTime;
					if (ctx.metrics.shaderTime[query.program.id] === undefined) {
						ctx.metrics.shaderTime[query.program.id] = 0;
					}
					ctx.metrics.shaderTime[query.program.id] += time;
					ctx.contextWrapper.drawQueries.splice(i, 1);
				}
			});
		}
	});

	var logs = [];
	contexts.forEach(function (ctx) {
		logs.push(ctx.metrics);
	});

	var e = new CustomEvent('perfmeter-framedata', {
		detail: {
			rAFS: queue.length,
			frameId: frameId,
			framerate: framerate,
			frameTime: frameTime,
			logs: logs
		}
	});
	window.dispatchEvent(e);

	originalRequestAnimationFrame(processRequestAnimationFrames);
}

processRequestAnimationFrames();

},{"./CanvasRenderingContext2DWrapper":1,"./WebGLRenderingContextWrapper":3,"./utils":10,"./widget":4}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
function createUUID() {

	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	return "" + s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}

exports.createUUID = createUUID;

},{}]},{},[9]);
