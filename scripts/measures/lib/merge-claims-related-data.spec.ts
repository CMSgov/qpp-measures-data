
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { mergeClaimsRelatedData } from './merge-claims-related-data';
import { Measure } from '../../../util/interfaces';

const stratificationData = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/measures/test-claims-related-data.json'), 'utf8')
);
const measuresJsonResult = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/measures/test-claims-related-measures-data.json'), 'utf8')
);

describe('Claims-Related Data Merger', () => {
    it('merges eCQM data into the measures-data json', () => {
        const measuresJson = [
            { measureId: '001' },
            { measureId: '002' },
        ] as Measure[];

        mergeClaimsRelatedData(measuresJson, stratificationData);

        expect(measuresJson).toStrictEqual(measuresJsonResult);
    });
});
