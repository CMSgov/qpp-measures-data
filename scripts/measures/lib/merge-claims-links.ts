import { Measure } from "../../../util/interfaces";
import { Category } from "../../../util/interfaces/measure";
import { LinkData } from "./ingest-specifications-links";

export function mergeClaimsLinks(measures: Measure[], claimsLinks: LinkData[]) {
  claimsLinks.forEach((claimsLink) => {
    claimsLink.measureId = claimsLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === claimsLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      if (measure.category === Category.QUALITY &&
          measure.submissionMethods?.length === 1 &&
          measure.submissionMethods[0] === 'administrativeClaims') {
        measure.measureSpecification.default = claimsLink.link.trim();
      } else {
        measure.measureSpecification.claims = claimsLink.link.trim();
      }
    }
  });
};
