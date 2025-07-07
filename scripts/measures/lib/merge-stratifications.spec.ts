import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { mergeStratifications } from './merge-stratifications';
import { Measure } from '../../../util/interfaces';
import { Category } from '../../../util/interfaces/measure';

const stratificationData = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/measures/test-stratifications.json'), 'utf8')
);
const measuresJsonResult = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/measures/test-stratifications-measures-data.json'), 'utf8')
);

describe('Stratification Data Merger', () => {
    it('merges eCQM data into the measures-data json', () => {
        const measuresJson = [
            {
                category: Category.QUALITY,
                measureId: '001',
                eMeasureId: 'e001',
                strata: [
                    {
                        name: 'strata1',
                        description: 'Strata 1',
                        eMeasureUuids: {
                            initialPopulationUuid: '40CAFBE0-4A13-4D63-A2A8-49CFC65C726F',
                            denominatorUuid: 'DB248CBC-3C13-4C3E-A77C-447BF11FDECE',
                            numeratorUuid: '4146BCB6-11FE-4DAA-9686-3BF8F46A3B18',
                            denominatorExclusionUuid: '86DD07DA-8FD6-46EE-ABCC-CFDBC93DC5CC'
                        }
                    },
                    {
                        description: 'Strata 2'
                    }
                ]
            },
            {
                category: Category.QUALITY,
                measureId: '002',
                eMeasureId: 'e002',
                strata: [
                    {
                        name: 'strata1',
                        description: 'Strata 1',
                        eMeasureUuids: 'C4A832B5-9074-4062-B462-7AF0BF76941D'
                    }
                ]
            },
            {
                category: Category.QUALITY,
                measureId: '003',
                eMeasureId: 'e003',
                strata: [
                    {
                        name: 'strata1',
                        description: 'Strata 1',
                        eMeasureUuids: {
                            initialPopulationUuid: '0C07C013-5032-4643-BC28-A4CDAE340F84',
                            denominatorUuid: '3AF858F0-A8E4-4E32-89CC-CC6A4CA8A160',
                            numeratorUuid: '4BD54EB9-78DC-4402-9E2F-55B67A49DB80',
                            denominatorExclusionUuid: 'E82D67AB-A1EC-401D-8513-9DC56E5BC05D'
                        }
                    },
                    {
                        name: 'strata2',
                        description: 'Strata 2',
                        eMeasureUuids: {
                            initialPopulationUuid: '0C07C013-5032-4643-BC28-A4CDAE340F84',
                            denominatorUuid: '3AF858F0-A8E4-4E32-89CC-CC6A4CA8A160',
                            numeratorUuid: '4BD54EB9-78DC-4402-9E2F-55B67A49DB80',
                            denominatorExclusionUuid: 'E82D67AB-A1EC-401D-8513-9DC56E5BC05D'
                        }
                    }
                ]
            },
        ] as Measure[];

        mergeStratifications(measuresJson, stratificationData);

        expect(measuresJson).toStrictEqual(measuresJsonResult);
    });
});
