import { Measure } from "../../../util/interfaces";
import { Category, QualityMeasure } from "../../../util/interfaces/measure";

interface AdditionalStratification {
  eMeasureId: string,
  strataMaps: {
      numeratorUuid: string,
      strata: string[]
    }[],
};

export function mergeStratifications(measures: Measure[], additionalStratifications: AdditionalStratification[]) {
  additionalStratifications.forEach((additionalStratification) => {
    const measure = measures.find(measure => (
      measure.category === Category.QUALITY &&
      measure.eMeasureId === additionalStratification.eMeasureId
    )) as QualityMeasure;
    measure.strata?.forEach(subPopulation => {
      let mapping;

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
