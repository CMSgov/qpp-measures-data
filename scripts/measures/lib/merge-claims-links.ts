export function mergeClaimsLinks(measures, claimsLinks) {
  claimsLinks.forEach((claimsLink) => {
    claimsLink.measureId = claimsLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === claimsLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.claims = claimsLink.link.trim();
    }
  });
};
