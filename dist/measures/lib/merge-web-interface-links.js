"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWebInterfaceLinks = void 0;
function mergeWebInterfaceLinks(measures, webInterfaceLinks) {
    webInterfaceLinks.forEach((webInterfaceLink) => {
        const measure = measures.find(measure => measure.measureId === webInterfaceLink.measureId);
        if (measure) {
            measure.measureSpecification.cmsWebInterface = webInterfaceLink.link;
        }
    });
}
exports.mergeWebInterfaceLinks = mergeWebInterfaceLinks;
;
