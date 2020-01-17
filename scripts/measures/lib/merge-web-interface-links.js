module.exports = (measures, webInterfaceLinks) => {
  webInterfaceLinks.forEach((webInterfaceLink) => {
    const measure = measures.find(measure => measure.measureId === webInterfaceLink.measureId);
    if (measure) {
      measure.measureSpecification.cmsWebInterface = webInterfaceLink.link;
    }
  });
};
