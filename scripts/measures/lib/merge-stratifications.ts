export function mergeStratifications(measures, additionalStratifications) {
  additionalStratifications.forEach((additionalStratification) => {
    const measure = measures.find(measure => measure.eMeasureId === additionalStratification.eMeasureId);
    measure.strata.forEach(subPopulation => {
      let mapping: any = false;

      if (subPopulation.eMeasureUuids) {
        mapping = additionalStratification.strataMaps.find(map =>
          map.numeratorUuid === subPopulation.eMeasureUuids.numeratorUuid);
      }

      if (mapping) {
        subPopulation.eMeasureUuids.strata = mapping.strata;
      }
    });
  });
};
