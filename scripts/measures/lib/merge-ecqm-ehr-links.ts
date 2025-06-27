import { Measure } from "../../../util/interfaces";
import { Category, QualityMeasure } from "../../../util/interfaces/measure";

export function mergeEcqmEhrLinks(measures: Measure[], ecqmEhrLinks: { link: string, eMeasureId: string }[]) {
  ecqmEhrLinks.forEach((ecqmEhrLink) => {
    ecqmEhrLink.eMeasureId = ecqmEhrLink.eMeasureId.trim();
    const measure = measures.find(measure => (
      measure.category === Category.QUALITY &&
      measure.eMeasureId === ecqmEhrLink.eMeasureId
    )) as QualityMeasure;

    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.electronicHealthRecord = ecqmEhrLink.link.trim();
    }
  });
};
