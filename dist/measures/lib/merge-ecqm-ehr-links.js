"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeEcqmEhrLinks = void 0;
function mergeEcqmEhrLinks(measures, ecqmEhrLinks) {
    ecqmEhrLinks.forEach(function (ecqmEhrLink) {
        var measure = measures.find(function (measure) { return measure.eMeasureId === ecqmEhrLink.eMeasureId; });
        if (measure) {
            measure.measureSpecification.electronicHealthRecord = ecqmEhrLink.link;
        }
    });
}
exports.mergeEcqmEhrLinks = mergeEcqmEhrLinks;
;
