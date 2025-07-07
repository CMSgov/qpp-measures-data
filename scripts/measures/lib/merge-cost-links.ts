import _ from 'lodash';
import { Measure } from '../../../util/interfaces';
import { LinkData } from './ingest-specifications-links';

const path = 'measureSpecification.default';
export function mergeCostLinks (measures: Measure[], costLinks: LinkData[]) {
  costLinks.forEach((costLink) => {
    costLink.measureId = costLink.measureId.trim();
    const measure = measures.find(measure => measure.measureId === costLink.measureId);
    if (measure) {
      if (!measure.measureSpecification) measure.measureSpecification = {};
      _.set(measure, path, costLink.link.trim());
    }
  });
};
