export function mergeWebInterfaceLinks (measures, webInterfaceLinks) {
  webInterfaceLinks.forEach((webInterfaceLink) => {
    webInterfaceLink.measureId = webInterfaceLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === webInterfaceLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      measure.measureSpecification.cmsWebInterface = webInterfaceLink.link.trim();
    }
  });
};
