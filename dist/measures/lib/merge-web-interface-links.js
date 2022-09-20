"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWebInterfaceLinks = void 0;
function mergeWebInterfaceLinks(measures, webInterfaceLinks) {
    webInterfaceLinks.forEach(function (webInterfaceLink) {
        var measure = measures.find(function (measure) { return measure.measureId === webInterfaceLink.measureId; });
        if (measure) {
            measure.measureSpecification.cmsWebInterface = webInterfaceLink.link;
        }
    });
}
exports.mergeWebInterfaceLinks = mergeWebInterfaceLinks;
;
