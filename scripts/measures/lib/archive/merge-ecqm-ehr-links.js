module.exports = (measures, ecqmEhrLinks) => {
  ecqmEhrLinks.forEach((ecqmEhrLink) => {
    const measure = measures.find(measure => measure.eMeasureId === ecqmEhrLink.eMeasureId);
    if (measure) {
      measure.measureSpecification.electronicHealthRecord = ecqmEhrLink.link;
    }
  });
};
