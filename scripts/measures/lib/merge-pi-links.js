const _ = require('lodash');

const path = 'measureSpecification.default';

module.exports = (measures, piLinks) => {
  piLinks.forEach((piLink) => {
    const measure = measures.find(measure => measure.measureId === piLink.measureId);
    if (measure) {
      _.set(measure, path, piLink.link);
    }
  });
};
