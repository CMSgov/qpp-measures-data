import { Measure } from "../../../util/interfaces";
import { LinkData } from "./ingest-specifications-links";

export function mergeCqmLinks (measures: Measure[], cqmLinks: LinkData[]) {
  cqmLinks.forEach((cqmLink) => {
    cqmLink.measureId = cqmLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === cqmLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.registry = cqmLink.link.trim();
    }
  });
};
