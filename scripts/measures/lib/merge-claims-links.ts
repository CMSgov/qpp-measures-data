import { Measure } from "../../../util/interfaces";
import { LinkData } from "./ingest-specifications-links";

export function mergeClaimsLinks(measures: Measure[], claimsLinks: LinkData[]) {
  claimsLinks.forEach((claimsLink) => {
    claimsLink.measureId = claimsLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === claimsLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.claims = claimsLink.link.trim();
    }
  });
};
