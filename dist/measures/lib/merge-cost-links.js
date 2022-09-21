"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCostLinks = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path = 'measureSpecification.default';
function mergeCostLinks(measures, costLinks) {
    costLinks.forEach((costLink) => {
        const measure = measures.find(measure => measure.measureId === costLink.measureId);
        if (measure) {
            lodash_1.default.set(measure, path, costLink.link);
        }
    });
}
exports.mergeCostLinks = mergeCostLinks;
;
