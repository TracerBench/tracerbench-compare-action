"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stderr = exports.stdout = void 0;
/**
 * A wrapper around process.stdout and process.stderr that allows us to mock out the streams for testing.
 */
class Stream {
    constructor(channel) {
        this.channel = channel;
    }
    get isTTY() {
        return process[this.channel].isTTY;
    }
    getWindowSize() {
        return process[this.channel].getWindowSize();
    }
    write(data) {
        return process[this.channel].write(data);
    }
    read() {
        return process[this.channel].read();
    }
    on(event, listener) {
        process[this.channel].on(event, listener);
        return this;
    }
    once(event, listener) {
        process[this.channel].once(event, listener);
        return this;
    }
    emit(event, ...args) {
        return process[this.channel].emit(event, ...args);
    }
}
exports.stdout = new Stream('stdout');
exports.stderr = new Stream('stderr');
