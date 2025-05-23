import _ from 'lodash';

const path = 'measureSpecification.default';
export function mergeCostLinks (measures, costLinks) {
  costLinks.forEach((costLink) => {
    costLink.measureId = costLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === costLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      _.set(measure, path, costLink.link.trim());
    }
  });
};
