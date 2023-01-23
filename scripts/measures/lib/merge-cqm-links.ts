export function mergeCqmLinks (measures, cqmLinks) {
  cqmLinks.forEach((cqmLink) => {
    const measure = measures.find(measure => measure.measureId === cqmLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.registry = cqmLink.link;
    }
  });
};
