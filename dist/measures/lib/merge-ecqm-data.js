"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeEcqmData = void 0;
function mergeEcqmData(measures, generatedEcqms) {
    generatedEcqms.forEach(function (generatedEcqm) {
        var measure = measures.find(function (measure) { return measure.eMeasureId === generatedEcqm.eMeasureId; });
        if (measure) {
            if (measure.strata) {
                measure.strata.forEach(function (strata, index) {
                    if (strata.name) {
                        if (generatedEcqm.strata[index] === undefined) {
                            generatedEcqm.strata.push({ 'name': strata.name, description: strata.description });
                        }
                        else {
                            generatedEcqm.strata[index].name = strata.name;
                            generatedEcqm.strata[index].description = strata.description;
                        }
                    }
                });
            }
            measure.eMeasureUuid = generatedEcqm.eMeasureUuid;
            measure.metricType = generatedEcqm.metricType;
            measure.strata = generatedEcqm.strata;
        }
    });
}
exports.mergeEcqmData = mergeEcqmData;
;
