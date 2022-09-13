"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.warning = exports.info = void 0;
function info(message) {
    console.info('\x1b[32m%s\x1b[0m', message);
}
exports.info = info;
function warning(message) {
    console.warn('\x1b[33m%s\x1b[0m', "[WARNING]: ".concat(message));
}
exports.warning = warning;
function error(message) {
    console.error('\x1b[31m%s\x1b[0m', "[ERROR]: ".concat(message));
}
exports.error = error;
