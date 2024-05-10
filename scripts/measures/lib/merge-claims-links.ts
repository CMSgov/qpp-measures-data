export function mergeClaimsLinks(measures, claimsLinks) {
  claimsLinks.forEach((claimsLink) => {
    const measure = measures.find(measure => measure.measureId === claimsLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.claims = claimsLink.link;
    }
  });
};
