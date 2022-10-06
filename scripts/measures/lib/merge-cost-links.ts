import _ from 'lodash';

const path = 'measureSpecification.default';
export function mergeCostLinks (measures, costLinks) {
  costLinks.forEach((costLink) => {
    const measure = measures.find(measure => measure.measureId === costLink.measureId);
    if (measure) {
      _.set(measure, path, costLink.link);
    }
  });
};
