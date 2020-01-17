module.exports = (measures, cqmLinks) => {
  cqmLinks.forEach((cqmLink) => {
    const measure = measures.find(measure => measure.measureId === cqmLink.measureId);
    if (measure) {
      measure.measureSpecification.registry = cqmLink.link;
    }
  });
};
