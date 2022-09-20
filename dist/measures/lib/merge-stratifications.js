"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeStratifications = void 0;
function mergeStratifications(measures, additionalStratifications) {
    additionalStratifications.forEach(function (additionalStratification) {
        // const stratification = additionalStratification.find(stratum => stratum.eMeasureId === measure.eMeasureId);
        var measure = measures.find(function (measure) { return measure.eMeasureId === additionalStratification.eMeasureId; });
        measure.strata.forEach(function (subPopulation) {
            var mapping = false;
            if (subPopulation.eMeasureUuids) {
                mapping = additionalStratification.strataMaps.find(function (map) {
                    return map.numeratorUuid === subPopulation.eMeasureUuids.numeratorUuid;
                });
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
