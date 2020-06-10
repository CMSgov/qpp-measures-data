module.exports = (measures, generatedEcqms) => {
  generatedEcqms.forEach((generatedEcqm) => {
    const measure = measures.find(measure => measure.eMeasureId === generatedEcqm.eMeasureId);
    if (measure) {
      if (measure.strata) {
        measure.strata.forEach(function(strata, index) {
          if (strata.name) {
            if (generatedEcqm.strata[index] === undefined) {
              generatedEcqm.strata.push({'name': strata.name});
            } else {
              generatedEcqm.strata[index].name = strata.name;
            }
          }
        });
      }
      measure.eMeasureUuid = generatedEcqm.eMeasureUuid;
      measure.metricType = generatedEcqm.metricType;
      measure.strata = generatedEcqm.strata;
    }
  });
};
