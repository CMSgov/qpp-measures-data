"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCqmLinks = void 0;
function mergeCqmLinks(measures, cqmLinks) {
    cqmLinks.forEach((cqmLink) => {
        const measure = measures.find(measure => measure.measureId === cqmLink.measureId);
        if (measure) {
            measure.measureSpecification.registry = cqmLink.link;
        }
    });
}
exports.mergeCqmLinks = mergeCqmLinks;
;
