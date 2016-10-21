import{ createUUID } from "./utils";

class Wrapper {
    constructor(context) {

        this.id = createUUID();
        this.context = context;

        this.count = 0;
        this.JavaScriptTime = 0;

        this.log = [];

    }

    run(fName, fArgs, fn) {

        this.incrementCount();
        this.beginProfile( fName, fArgs );
        const res = fn();
        this.endProfile();
        return res;

    }

    resetFrame() {

        this.resetCount();
        this.resetJavaScriptTime();
        this.resetLog();

    }

    resetCount() {

        this.count = 0;

    }

    incrementCount() {

        this.count++;

    }

    resetLog() {

        this.log.length = 0;

    }

    resetJavaScriptTime() {

        this.JavaScriptTime = 0;

    }

    incrementJavaScriptTime(time) {

        this.JavaScriptTime += time;

    }

    beginProfile(fn, args) {

        const t = performance.now();
        this.log.push( { function: fn, arguments: args, start: t, end: 0 } );
        this.startTime = t;

    }

    endProfile() {

        const t = performance.now();
        this.log[ this.log.length - 1 ].end = t;
        this.incrementJavaScriptTime( t - this.startTime );

    }
}

export { Wrapper }
