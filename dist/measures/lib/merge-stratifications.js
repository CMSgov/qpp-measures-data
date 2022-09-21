"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeStratifications = void 0;
function mergeStratifications(measures, additionalStratifications) {
    additionalStratifications.forEach((additionalStratification) => {
        const measure = measures.find(measure => measure.eMeasureId === additionalStratification.eMeasureId);
        measure.strata.forEach(subPopulation => {
            let mapping = false;
            if (subPopulation.eMeasureUuids) {
                mapping = additionalStratification.strataMaps.find(map => map.numeratorUuid === subPopulation.eMeasureUuids.numeratorUuid);
            }
            if (mapping) {
                subPopulation.eMeasureUuids.strata = mapping.strata;
                console.log('adding mapping: ' + mapping.strata);
            }
        });
    });
}
exports.mergeStratifications = mergeStratifications;
;
