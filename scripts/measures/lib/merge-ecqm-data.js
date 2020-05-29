const _ = require('lodash');

module.exports = (measures, generatedEcqms) => {
  generatedEcqms.forEach((generatedEcqm) => {
    const measure = measures.find(measure => measure.eMeasureId === generatedEcqm.eMeasureId);
    if (measure) {
      if (measures.strata && measures.stata.name) {
        generatedEcqmData.strata.name = measures.strata.name;
      }
      measure.eMeasureUuid = generatedEcqm.eMeasureUuid
      measure.metricType = generatedEcqm.metricType
      measure.strata = generatedEcqm.strata
    }
  });
};
