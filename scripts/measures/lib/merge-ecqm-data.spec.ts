
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { mergeEcqmData } from './merge-ecqm-data';

const eCQMData = JSON.parse(
    fs.readFileSync(path.join(appRoot + "", 'test/measures/test-ecqm-data.json'), "utf8")
);
const measuresJsonResult = JSON.parse(
    fs.readFileSync(path.join(appRoot + "", 'test/measures/test-ecqm-measures-data.json'), "utf8")
);

describe('eCQM Data Merger', () => {
    it('merges eCQM data into the measures-data json', () => {
        const measuresJson = [
            {
                measureId: '001',
                eMeasureId: 'e001',
                strata: [
                    {
                        name: 'strata1',
                        description: 'Strata 1'
                    },
                    {
                        description: 'Strata 2'
                    }
                ]
            },
            {
                measureId: '002',
                eMeasureId: 'e002',
                strata: [
                    {
                        name: 'strata1',
                        description: 'Strata 1'
                    }
                ]
            },
            {
                measureId: '003',
                eMeasureId: 'e003',
                strata: [
                    {
                        name: 'strata1',
                        description: 'Strata 1'
                    },
                    {
                        name: 'strata2',
                        description: 'Strata 2'
                    }
                ]
            },
        ];

        mergeEcqmData(measuresJson, eCQMData);

        expect(measuresJson).toStrictEqual(measuresJsonResult);
    });
});
