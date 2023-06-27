const _ = require('lodash');

const path = 'measureSpecification.default';

module.exports = (measures, costLinks) => {
  costLinks.forEach((costLink) => {
    const measure = measures.find(measure => measure.measureId === costLink.measureId);
    if (measure) {
      _.set(measure, path, costLink.link);
    }
  });
};
