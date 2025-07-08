
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import appRoot from 'app-root-path';

import { mergeEcqmEhrLinks } from './merge-ecqm-ehr-links';
import { mergeClaimsLinks } from './merge-claims-links';
import { mergeCqmLinks } from './merge-cqm-links';
import { mergePiLinks } from './merge-pi-links';
import { mergeCostLinks } from './merge-cost-links';
import { Measure } from '../../../util/interfaces';
import { Category } from '../../../util/interfaces/measure';

const testLinksCSV = parse(
    fs.readFileSync(path.join(appRoot + '', 'test/measures/test-spec-links.csv'), 'utf8'),
    { columns: true, skip_empty_lines: true, bom: true }
);

const testeLinksCSV = parse(
    fs.readFileSync(path.join(appRoot + '', 'test/measures/test-spec-elinks.csv'), 'utf8'),
    { columns: true, skip_empty_lines: true, bom: true }
);

describe('Specification Links Mergers', () => {
    it('merges Claims links into the measures-data json', () => {
        const measuresJson = [
            {
                measureId: '001',
                measureSpecification: null,
             },
            {
                measureId: '002',
                measureSpecification: {},
            },
            {
                measureId: '003',
                measureSpecification: { _other: 'anotherLink' },
            },
        ] as Measure[];
        
        mergeClaimsLinks(measuresJson, testLinksCSV);
        
        expect(measuresJson).toStrictEqual([
            {
                measureId: '001',
                measureSpecification: { claims: 'testLink1' }
            },
            {
                measureId: '002',
                measureSpecification: { claims: 'testLink2' }
            },
            {
                measureId: '003',
                measureSpecification: {
                    _other: 'anotherLink',
                    claims: 'testLink3',
                },
            },
        ])
    });

    it('merges Cost links into the measures-data json', () => {
        const measuresJson = [
            {
                measureId: '001',
                measureSpecification: null,
            },
            {
                measureId: '002',
                measureSpecification: {},
            },
            {
                measureId: '003',
                measureSpecification: { _other: 'anotherLink' },
            },
        ] as Measure[];

        mergeCostLinks(measuresJson, testLinksCSV);

        expect(measuresJson).toStrictEqual([
            {
                measureId: '001',
                measureSpecification: { default: 'testLink1' }
            },
            {
                measureId: '002',
                measureSpecification: { default: 'testLink2' }
            },
            {
                measureId: '003',
                measureSpecification: {
                    _other: 'anotherLink',
                    default: 'testLink3',
                },
            },
        ])
    });

    it('merges PI links into the measures-data json', () => {
        const measuresJson = [
            {
                measureId: '001',
                measureSpecification: null,
            },
            {
                measureId: '002',
                measureSpecification: {},
            },
            {
                measureId: '003',
                measureSpecification: { _other: 'anotherLink' },
            },
        ] as Measure[];

        mergePiLinks(measuresJson, testLinksCSV);

        expect(measuresJson).toStrictEqual([
            {
                measureId: '001',
                measureSpecification: { default: 'testLink1' }
            },
            {
                measureId: '002',
                measureSpecification: { default: 'testLink2' }
            },
            {
                measureId: '003',
                measureSpecification: {
                    _other: 'anotherLink',
                    default: 'testLink3',
                },
            },
        ])
    });

    it('merges CQM links into the measures-data json', () => {
        const measuresJson = [
            {
                measureId: '001',
                measureSpecification: null,
            },
            {
                measureId: '002',
                measureSpecification: {},
            },
            {
                measureId: '003',
                measureSpecification: { _other: 'anotherLink' },
            },
        ] as Measure[];

        mergeCqmLinks(measuresJson, testLinksCSV);

        expect(measuresJson).toStrictEqual([
            {
                measureId: '001',
                measureSpecification: { registry: 'testLink1' }
            },
            {
                measureId: '002',
                measureSpecification: { registry: 'testLink2' }
            },
            {
                measureId: '003',
                measureSpecification: {
                    _other: 'anotherLink',
                    registry: 'testLink3',
                },
            },
        ])
    });

    it('merges ECQM EHR links into the measures-data json', () => {
        const measuresJson = [
            {
                category: Category.QUALITY,
                measureId: '001',
                eMeasureId: 'e001',
                measureSpecification: null,
            },
            {
                category: Category.QUALITY,
                measureId: '002',
                eMeasureId: 'e002',
                measureSpecification: {},
            },
            {
                category: Category.QUALITY,
                measureId: '003',
                eMeasureId: 'e003',
                measureSpecification: { _other: 'anotherLink' },
            },
        ] as Measure[];

        mergeEcqmEhrLinks(measuresJson, testeLinksCSV);

        expect(measuresJson).toStrictEqual([
            {
                category: 'quality',
                measureId: '001',
                eMeasureId: 'e001',
                measureSpecification: { electronicHealthRecord: 'testLink1' }
            },
            {
                category: 'quality',
                measureId: '002',
                eMeasureId: 'e002',
                measureSpecification: { electronicHealthRecord: 'testLink2' }
            },
            {
                category: 'quality',
                measureId: '003',
                eMeasureId: 'e003',
                measureSpecification: {
                    _other: 'anotherLink',
                    electronicHealthRecord: 'testLink3',
                },
            },
        ])
    });
});
