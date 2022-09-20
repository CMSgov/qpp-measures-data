"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeClaimsLinks = void 0;
function mergeClaimsLinks(measures, claimsLinks) {
    claimsLinks.forEach(function (claimsLink) {
        var measure = measures.find(function (measure) { return measure.measureId === claimsLink.measureId; });
        if (measure) {
            measure.measureSpecification.claims = claimsLink.link;
        }
    });
}
exports.mergeClaimsLinks = mergeClaimsLinks;
;
