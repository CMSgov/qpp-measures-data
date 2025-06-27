import { Measure } from "../../../util/interfaces";
import { Category, MetricType, QualityMeasure, Stratum } from "../../../util/interfaces/measure";

export function mergeEcqmData(measures: Measure[], generatedEcqms: {
  eMeasureId: string,
  eMeasureUuid: string,
  metricType: MetricType,
  strata: Stratum[]
}[]) {
  generatedEcqms.forEach((generatedEcqm) => {
    const measure = measures.find(measure => (
      measure.category === Category.QUALITY &&
      measure.eMeasureId === generatedEcqm.eMeasureId
    )) as QualityMeasure;
    if (measure) {
      if (measure.strata) {
        measure.strata.forEach(function (strata, index) {
          if (strata.name) {
            if (generatedEcqm.strata[index] === undefined) {
              generatedEcqm.strata.push(
                {
                  'name': strata.name,
                  description: strata.description
                } as Stratum);
            } else {
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
};
