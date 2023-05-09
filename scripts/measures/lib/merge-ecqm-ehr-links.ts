export function mergeEcqmEhrLinks (measures, ecqmEhrLinks) {
  ecqmEhrLinks.forEach((ecqmEhrLink) => {
    const measure = measures.find(measure => measure.eMeasureId === ecqmEhrLink.eMeasureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.electronicHealthRecord = ecqmEhrLink.link;
    }
  });
};
