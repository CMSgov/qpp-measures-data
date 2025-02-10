export function mergeCqmLinks (measures, cqmLinks) {
  cqmLinks.forEach((cqmLink) => {
    cqmLink.measureId = cqmLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === cqmLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.registry = cqmLink.link.trim();
    }
  });
};
