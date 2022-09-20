"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePiLinks = void 0;
var lodash_1 = __importDefault(require("lodash"));
var path = 'measureSpecification.default';
function mergePiLinks(measures, piLinks) {
    piLinks.forEach(function (piLink) {
        var measure = measures.find(function (measure) { return measure.measureId === piLink.measureId; });
        if (measure) {
            lodash_1.default.set(measure, path, piLink.link);
        }
    });
}
exports.mergePiLinks = mergePiLinks;
;
