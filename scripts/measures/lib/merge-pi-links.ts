import _ from 'lodash';
import { Measure } from '../../../util/interfaces';
import { LinkData } from './ingest-specifications-links';

const path = 'measureSpecification.default';

export function mergePiLinks(measures: Measure[], piLinks: LinkData[]) {
  piLinks.forEach((piLink) => {
    piLink.measureId = piLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === piLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      _.set(measure, path, piLink.link.trim());
    }
  });
};
