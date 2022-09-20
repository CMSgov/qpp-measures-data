"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCostLinks = void 0;
var lodash_1 = __importDefault(require("lodash"));
var path = 'measureSpecification.default';
function mergeCostLinks(measures, costLinks) {
    costLinks.forEach(function (costLink) {
        var measure = measures.find(function (measure) { return measure.measureId === costLink.measureId; });
        if (measure) {
            lodash_1.default.set(measure, path, costLink.link);
        }
    });
}
exports.mergeCostLinks = mergeCostLinks;
;
