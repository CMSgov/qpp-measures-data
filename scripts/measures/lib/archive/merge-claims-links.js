module.exports = (measures, claimsLinks) => {
  claimsLinks.forEach((claimsLink) => {
    const measure = measures.find(measure => measure.measureId === claimsLink.measureId);
    if (measure) {
      measure.measureSpecification.claims = claimsLink.link;
    }
  });
};
