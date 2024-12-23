import fs from 'fs';
import fse from 'fs-extra';
import { vol } from 'memfs';
import path from 'path';
import YAML from 'yaml';

import * as programNamesJson from './util/program-names/program-names.json';
import * as index from './index';
import { Constants } from './constants';
import * as mvpDataUtils from './util/mvp-data-utils';
import { ProgramNamesEnum } from './util/interfaces/program-names';

const mvpJson = [
    {
        mvpId: 'G0053',
        clinicalTopic: 'Stroke Care and Prevention',
        title: 'Title 1',
        description: 'Description 1.',
        specialtiesMostApplicableTo: [],
        clinicalTopics: 'Stroke Care and Prevention',
        qualityMeasureIds: ['001', '002', '003'],
        iaMeasureIds: ['004'],
        costMeasureIds: ['005', '006'],
        foundationPiMeasureIds: ['007'],
        foundationQualityMeasureIds: ['008'],
        administrativeClaimsMeasureIds: ['009'],
        hasCahps: false,
        hasOutcomeAdminClaims: false
    },
    {
        mvpId: 'G0054',
        clinicalTopic: 'Heart Disease',
        title: 'Title 2',
        description: 'Description 2.',
        specialtiesMostApplicableTo: [],
        clinicalTopics: 'Heart Disease',
        qualityMeasureIds: ['001'],
        iaMeasureIds: ['002'],
        costMeasureIds: ['003', '004'],
        foundationPiMeasureIds: [],
        foundationQualityMeasureIds: ['005'],
        administrativeClaimsMeasureIds: [],
        hasCahps: false,
        hasOutcomeAdminClaims: true
    }
];

describe('index', () => {
    beforeEach(() => {
        vol.reset();
        jest.restoreAllMocks();
    });

    describe('getValidPerformanceYear', () => {
        it('returns the list of valid years from Constants.', () => {
            expect(index.getValidPerformanceYears()).toStrictEqual(Constants.validPerformanceYears);
        });
    });

    describe('updateProgramNames', () => {
        it('updates the program-names json with any newly-found programs.', () => {
            const writeSpy = jest.spyOn(fse, 'writeFileSync').mockImplementation(jest.fn());
            vol.fromNestedJSON({
                'util/program-names': {
                    'program-names.json': JSON.stringify({
                        mips: 'mips',
                        cpcPlus: 'cpcPlus',
                        pcf: 'pcf',
                        app1: 'app1',
                        DEFAULT: 'mips',
                        G0053: 'G0053'
                    }),
                },
                'mvp/2024': {
                    'mvp.json': JSON.stringify(mvpJson),
                }
            });

            index.updateProgramNames(2024);

            expect(writeSpy).toBeCalledWith(
                expect.any(String),
                JSON.stringify({
                    mips: 'mips',
                    cpcPlus: 'cpcPlus',
                    pcf: 'pcf',
                    app1: 'app1',
                    DEFAULT: 'mips',
                    G0053: 'G0053',
                    G0054: 'G0054'
                }, null, 2),
            );
        });

        it('gracefully logs an error if json parsing fails.', () => {
            const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementationOnce(jest.fn());
            vol.fromNestedJSON({
                'util/program-names': {
                    'program-names.json': '{\'badformat\':: \'mips\',\'cpcPlus\': \'cpcPlus\'}',
                },
                'mvp/2024': {
                    'mvp.json': JSON.stringify(mvpJson),
                }
            });

            index.updateProgramNames(2024);

            expect(writeSpy).not.toBeCalled();
            expect(logSpy).toBeCalled();
        });
    });

    describe('getProgramNames', () => {
        it('gets the program-names json.', () => {
            vol.fromNestedJSON({
                'util/program-names': {
                    'program-names.json': JSON.stringify(
                        { mips: 'mips', cpcPlus: 'cpcPlus' }
                    ),
                },
            });

            expect(index.getProgramNames()).toStrictEqual(
                { mips: 'mips', cpcPlus: 'cpcPlus' },
            );
        });

        it('gracefully logs an error if json parsing fails.', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementationOnce(jest.fn());
            vol.fromNestedJSON({
                'util/program-names': {
                    'program-names.json': '{\'badformat\':: \'mips\',\'cpcPlus\': \'cpcPlus\'}',
                },
            });

            index.getProgramNames();

            expect(logSpy).toBeCalled();
        });
    });

    describe('getBenchmarksData', () => {
        it('gets the benchmarks in all the present years.', () => {
            vol.fromNestedJSON({
                'benchmarks': {
                    '2023.json': JSON.stringify([
                        { measureId: '001', otherdata: true },
                        { measureId: '002', otherdata: false },
                    ]),
                    '2024.json': JSON.stringify([
                        { measureId: '003', otherdata: true },
                        { measureId: '002', otherdata: false },
                    ])
                },
            });

            expect(index.getBenchmarksData()).toStrictEqual(
                {
                    '2023': [
                        { measureId: '001', otherdata: true },
                        { measureId: '002', otherdata: false },
                    ],
                    '2024': [
                        { measureId: '003', otherdata: true },
                        { measureId: '002', otherdata: false },
                    ],
                },
            );
        });
    });

    describe('getBenchmarksYears', () => {
        it('gets all the possible benchmarks years.', () => {
            vol.fromNestedJSON({
                'benchmarks': {
                    'dir-to-be-ignored': {
                        '2099.json': '{}',
                    },
                    '2021.json': '{}',
                    '2022.json': '{}',
                    'ignore.json': '{}',
                },
            });

            expect(index.getBenchmarksYears()).toStrictEqual([2021, 2022]);
        });
    });

    describe('getBenchmarksSchema', () => {
        it('gets the benchmarks schema for the current year.', () => {
            vol.fromNestedJSON({
                'benchmarks/2024': {
                    'benchmarks-schema.yaml': JSON.stringify(
                        YAML.parse(
                            fs.readFileSync(path.join(__dirname, 'benchmarks', '2024', 'benchmarks-schema.yaml'), 'utf8')
                        ),
                    ),
                },
            });

            const schemaJson = index.getBenchmarksSchema(2024);

            expect(schemaJson['$id']).toBeDefined();
            expect(schemaJson['$schema']).toBeDefined();
            expect(schemaJson['definitions']).toEqual(expect.any(Object));
        });
    });

    describe('getBenchmarksExclusionReasons', () => {
        it('gets the exclusion reasons for a benchmarks year.', () => {
            const exclusionArry = [
                {
                    measureId: '001',
                    submissionMethod: 'claims',
                    reasonDescriptions: [
                        'lorem',
                    ],
                },
                {
                    measureId: '002',
                    submissionMethod: 'quality',
                    reasonDescriptions: [
                        'ipsum',
                    ],
                },
            ];
            vol.fromNestedJSON({
                'benchmarks/2024': {
                    'benchmark-exclusion-reasons.json': JSON.stringify(exclusionArry),
                },
            });

            expect(index.getBenchmarksExclusionReasons(2024)).toStrictEqual(exclusionArry);
        });
    });

    describe('getBenchmarksNationalAverages', () => {
        it('gets the national averages for a benchmarks year.', () => {
            const averagesArray = [
                {
                    measureId: 'COST_ACOPD_1',
                    groupNationalAverage: 4631.32,
                    individualNationalAverage: 4560.92,
                },
                {
                    measureId: 'COST_AKID_1',
                    groupNationalAverage: 39386.18,
                    individualNationalAverage: 45390.79,
                },
            ];
            vol.fromNestedJSON({
                'benchmarks/2024': {
                    'cost-national-averages.json': JSON.stringify(averagesArray),
                },
            });

            expect(index.getBenchmarksNationalAverages(2024)).toStrictEqual(averagesArray);
        });
    });

    describe('getBenchmarksNationalAveragesSchema', () => {
        it('gets the national averages schema for a benchmarks year.', () => {
            vol.fromNestedJSON({
                'benchmarks/2024': {
                    'cost-national-averages-schema.yaml': JSON.stringify(
                        YAML.parse(
                            fs.readFileSync(path.join(__dirname, 'benchmarks', '2024', 'cost-national-averages-schema.yaml'), 'utf8')
                        ),
                    ),
                },
            });

            const schemaJson = index.getBenchmarksNationalAveragesSchema(2024);

            expect(schemaJson['$id']).toBeDefined();
            expect(schemaJson['$schema']).toBeDefined();
            expect(schemaJson['definitions']).toEqual(expect.any(Object));
        });
    });

    describe('getMeasuresData', () => {
        it('gets the measures data for a specified performance year.', () => {
            const measureArray = [
                {
                    measureId: '001',
                    metricType: 'boolean',
                    allowedPrograms: [
                        'lorem',
                        'ipsum',
                    ],
                },
                {
                    measureId: '002',
                    metricType: 'multiPerformanceRate',
                    allowedPrograms: [
                        'ipsum',
                        'lorem',
                    ],
                },
            ];
            vol.fromNestedJSON({
                'measures/2024': {
                    'measures-data.json': JSON.stringify(measureArray),
                },
            });

            expect(index.getMeasuresData(2024)).toStrictEqual(measureArray);
        });
    });

    describe('getMeasuresSchema', () => {
        it('gets the measures data schema for a specified performance year.', () => {
            vol.fromNestedJSON({
                'measures/2024': {
                    'measures-schema.yaml': JSON.stringify(
                        YAML.parse(
                            fs.readFileSync(path.join(__dirname, 'measures', '2024', 'measures-schema.yaml'), 'utf8')
                        ),
                    ),
                },
            });

            const schemaJson = index.getMeasuresSchema(2024);

            expect(schemaJson['$id']).toBeDefined();
            expect(schemaJson['$schema']).toBeDefined();
            expect(schemaJson['definitions']).toEqual(expect.any(Object));
        });
    });

    describe('getClinicalClusterData', () => {
        it('gets the clinical clusters data for a specified performance year.', () => {
            const clinicalClustersArray = [
                {
                    measureId: '001',
                    submissionMethod: 'claims',
                    clinicalClusters: [{
                        name: 'earNoseThroatCare',
                    }]
                },
                {
                    measureId: '002',
                    submissionMethod: 'claims',
                    clinicalClusters: [{
                        name: 'earNoseThroatCare',
                    }]
                },
            ];
            vol.fromNestedJSON({
                'clinical-clusters/2024': {
                    'clinical-clusters.json': JSON.stringify(clinicalClustersArray),
                },
            });

            expect(index.getClinicalClusterData(2024)).toStrictEqual(clinicalClustersArray);
        });

        it('Throws an error if is unable to find the json file for the specified year.', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            const clinicalClustersArray = [
                {
                    measureId: '001',
                    submissionMethod: 'claims',
                    clinicalClusters: [{
                        name: 'earNoseThroatCare',
                    }]
                },
                {
                    measureId: '002',
                    submissionMethod: 'claims',
                    clinicalClusters: [{
                        name: 'earNoseThroatCare',
                    }]
                },
            ];
            vol.fromNestedJSON({
                'clinical-clusters/2024': {
                    'clinical-clusters.json': JSON.stringify(clinicalClustersArray),
                },
            });

            expect(index.getClinicalClusterData(2050)).toStrictEqual([]);
            expect(logSpy).toBeCalledTimes(1);
        });
    });

    describe('getClinicalClusterSchema', () => {
        it('gets the clinical clusters schema for a specified performance year.', () => {
            vol.fromNestedJSON({
                'clinical-clusters/2024': {
                    'clinical-clusters-schema.yaml': JSON.stringify(
                        YAML.parse(
                            fs.readFileSync(path.join(__dirname, 'clinical-clusters', '2024', 'clinical-clusters-schema.yaml'), 'utf8')
                        ),
                    ),
                },
            });

            const schemaJson = index.getClinicalClusterSchema(2024);

            expect(schemaJson['$id']).toBeDefined();
            expect(schemaJson['$schema']).toBeDefined();
            expect(schemaJson['definitions']).toEqual(expect.any(Object));
        });
    });

    describe('getMVPData', () => {
        let createMvpFileSpy: jest.SpyInstance;
        beforeEach(() => {
            createMvpFileSpy = jest.spyOn(mvpDataUtils, 'createMVPDataFile').mockImplementation(() => mvpJson);
        });

        it('finds and returns the mvp-enriched json file for the specified performance year.', () => {
            const enrichedMvpArray = [
                {
                    mvpId: 'G0001',
                    clinicalTopic: 'Rheumatology',
                    title: 'Title 1'
                },
                {
                    mvpId: 'G0002',
                    clinicalTopic: 'Stroke Care and Prevention',
                    title: 'Title 2'
                },
            ];
            vol.fromNestedJSON({
                'mvp/2024': {
                    'mvp-enriched.json': JSON.stringify(enrichedMvpArray),
                },
            });

            expect(index.getMVPData(2024)).toStrictEqual(enrichedMvpArray);
            expect(createMvpFileSpy).not.toBeCalled();
        });

        it('returns the mvp data for the specified mvps and performance year.', () => {
            const enrichedMvpArray = [
                {
                    mvpId: 'G0001',
                    clinicalTopic: 'Rheumatology',
                    title: 'Title 1'
                },
                {
                    mvpId: 'G0002',
                    clinicalTopic: 'Stroke Care and Prevention',
                    title: 'Title 2'
                },
            ];
            vol.fromNestedJSON({
                'mvp/2024': {
                    'mvp-enriched.json': JSON.stringify(enrichedMvpArray),
                },
            });

            expect(index.getMVPData(2024, ['G0001'])).toStrictEqual(
                [
                    {
                        mvpId: 'G0001',
                        clinicalTopic: 'Rheumatology',
                        title: 'Title 1'
                    }
                ]
            );
            expect(createMvpFileSpy).not.toBeCalled();
        });

        it('attempts to create an enriched mvp file if none exist for the specified performance year.', () => {
            vol.fromNestedJSON({
                'mvp/2024': {},
            });

            index.getMVPData(2024);

            expect(createMvpFileSpy).toBeCalledTimes(1);
        });
    });

    describe('createMVPDataFile', () => {
        let writeSpy: jest.SpyInstance;
        let populateSpy: jest.SpyInstance;
        let getSpy: jest.SpyInstance;
        beforeEach(() => {
            writeSpy = jest.spyOn(fse, 'writeFileSync').mockImplementation(jest.fn());
            populateSpy = jest.spyOn(mvpDataUtils, 'populateMeasuresforMVPs').mockImplementation(jest.fn());
            getSpy = jest.spyOn(index, 'getMeasuresData').mockReturnValue([
                {
                    measureId: '001',
                    allowedPrograms: ['mips', 'G0001', 'G0002'],
                } as any,
                {
                    measureId: '002',
                    allowedPrograms: ['mips', 'G0001'],
                } as any,
                {
                    measureId: '003',
                } as any,
            ]);
            vol.fromNestedJSON({
                'mvp/2024': {
                    'mvp.json': JSON.stringify([
                        {
                            mvpId: 'G0053',
                            clinicalTopic: 'Stroke Care and Prevention',
                            title: 'Title 1',
                            description: 'Description 1.',
                            specialtiesMostApplicableTo: [],
                            clinicalTopics: 'Stroke Care and Prevention',
                            qualityMeasureIds: [],
                            iaMeasureIds: [],
                            costMeasureIds: [],
                            foundationPiMeasureIds: [],
                            foundationQualityMeasureIds: [],
                            administrativeClaimsMeasureIds: [],
                            hasCahps: false,
                            hasOutcomeAdminClaims: false
                        },
                        {
                            mvpId: 'G0054',
                            clinicalTopic: 'Heart Disease',
                            title: 'Title 2',
                            description: 'Description 2.',
                            specialtiesMostApplicableTo: [],
                            clinicalTopics: 'Heart Disease',
                            qualityMeasureIds: [],
                            iaMeasureIds: [],
                            costMeasureIds: [],
                            foundationPiMeasureIds: [],
                            foundationQualityMeasureIds: [],
                            administrativeClaimsMeasureIds: [],
                            hasCahps: false,
                            hasOutcomeAdminClaims: false
                        },
                    ]),
                },
                'measures/2024': {
                    'measures-data.json': JSON.stringify([
                        { measureId: '001', allowedPrograms: ['mips', 'G0053', 'G0054'] },
                        { measureId: '002', allowedPrograms: ['mips', 'G0053'] },
                        { measureId: '003' }
                    ]),
                }
            });
        });

        it('creates and returns enriched mvp data, updating the mvp-enriched and measures-data files.', () => {
            expect(mvpDataUtils.createMVPDataFile(2024)).toStrictEqual([
                {
                    mvpId: 'G0053',
                    clinicalTopic: 'Stroke Care and Prevention',
                    title: 'Title 1',
                    description: 'Description 1.',
                    specialtiesMostApplicableTo: [],
                    clinicalTopics: 'Stroke Care and Prevention',
                    qualityMeasures: [],
                    iaMeasures: [],
                    costMeasures: [],
                    foundationPiMeasures: [],
                    foundationQualityMeasures: [],
                    administrativeClaimsMeasures: [],
                    hasCahps: false,
                    hasOutcomeAdminClaims: false
                },
                {
                    mvpId: 'G0054',
                    clinicalTopic: 'Heart Disease',
                    title: 'Title 2',
                    description: 'Description 2.',
                    specialtiesMostApplicableTo: [],
                    clinicalTopics: 'Heart Disease',
                    qualityMeasures: [],
                    iaMeasures: [],
                    costMeasures: [],
                    foundationPiMeasures: [],
                    foundationQualityMeasures: [],
                    administrativeClaimsMeasures: [],
                    hasCahps: false,
                    hasOutcomeAdminClaims: false
                }
            ]);
            // one for each data file.
            expect(writeSpy).toBeCalledTimes(2);

            // one for each mvp (2) for each measure type (6).
            expect(populateSpy).toBeCalledTimes(12);
            expect(getSpy).toBeCalledTimes(1);
        });

        it('gracefully logs error message when unable to access mvp data.', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            vol.reset();
            vol.fromNestedJSON({
                'mvp/2024': {},
            });

            expect(mvpDataUtils.createMVPDataFile(2024)).toStrictEqual([]);
            expect(logSpy).toBeCalled();
            expect(writeSpy).not.toBeCalled();
            expect(populateSpy).not.toBeCalled();
            expect(getSpy).not.toBeCalled();
        });
    });

    describe('populateMeasuresforMVPs', () => {
        const testMeasuresData = [
            {
                measureId: '001',
                allowedPrograms: ['mips', 'G0053', 'G0054'],
            },
            {
                measureId: '321',
                allowedPrograms: ['mips', 'G0053'],
            },
            {
                measureId: '003',
            },
        ];

        beforeEach(() => {
            vol.fromNestedJSON({
                'mvp/2024': {
                    'mvp.json': JSON.stringify(mvpJson),
                },
            });
        });

        it('successfully populates the mvp', () => {
            const testMvp = { ...mvpJson[0], qualityMeasureIds: ['001', '321'], qualityMeasures: [] };
            mvpDataUtils.populateMeasuresforMVPs(testMvp, mvpJson, testMeasuresData, 'qualityMeasureIds', 'qualityMeasures');

            expect(testMvp).toStrictEqual({
                mvpId: 'G0053',
                clinicalTopic: 'Stroke Care and Prevention',
                title: 'Title 1',
                description: 'Description 1.',
                specialtiesMostApplicableTo: [],
                clinicalTopics: 'Stroke Care and Prevention',
                qualityMeasures: [
                    {
                        measureId: '001',
                        allowedPrograms: ['mips', 'G0053', 'G0054'],
                    },
                    {
                        measureId: '321',
                        allowedPrograms: ['mips', 'G0053'],
                    }
                ],
                qualityMeasureIds: ['001', '321'],
                iaMeasureIds: ['004'],
                costMeasureIds: ['005', '006'],
                foundationPiMeasureIds: ['007'],
                foundationQualityMeasureIds: ['008'],
                administrativeClaimsMeasureIds: ['009'],
                hasCahps: true,
                hasOutcomeAdminClaims: false
            });
        });
    });

    describe('getMVPSchema', () => {
        it('gets the mvp schema for a specified performance year.', () => {
            vol.fromNestedJSON({
                'mvp/2024': {
                    'mvp-schema.yaml': JSON.stringify(
                        YAML.parse(
                            fs.readFileSync(path.join(__dirname, 'mvp', '2024', 'mvp-schema.yaml'), 'utf8')
                        ),
                    ),
                },
            });

            const schemaJson = index.getMVPSchema(2024);

            expect(schemaJson['$id']).toBeDefined();
            expect(schemaJson['$schema']).toBeDefined();
            expect(schemaJson['definitions']).toEqual(expect.any(Object));
        });
    });

    describe('getMVPDataSlim', () => {
        it('returns the mvp data with all the ids concatenated for a specified performance year.', () => {
            vol.fromNestedJSON({
                'mvp/2024': {
                    'mvp.json': JSON.stringify(mvpJson),
                },
            });

            expect(index.getMVPDataSlim(2024)).toStrictEqual([
                {
                    ...mvpJson[0],
                    measureIds: ['001', '002', '003', '004', '005', '006', '007', '008', '009'],
                },
                {
                    ...mvpJson[1],
                    measureIds: ['001', '002', '003', '004', '005'],
                },
            ]);
        });

        it('logs a failure message if no mvp json file is found for the specified performance year.', () => {
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            vol.fromNestedJSON({
                'mvp/2024': {},
            });

            expect(index.getMVPDataSlim(2024)).toStrictEqual(undefined);
            expect(logSpy).toBeCalledWith('mvp.json file does not exist');
        });
    });

    // TODO - automate steps 1 and 2 below
    // This test will fail when new program-names are programmatically added to ./util/program-names.json
    // When this occurs, developers should:
    // (1) update ./util/interfaces/program-names.ts to include the new programName
    // (2) update this test to include the new programName
    describe('ProgramNames interface', () => {
        it('checks that the ProgramNames interface contains all program names', () => {
            const programNames = Object.keys(programNamesJson).filter(obj => obj !== 'default')
            expect(programNames).toStrictEqual([
                'mips',  'cpcPlus', 'pcf',
                'app1',  'DEFAULT', 'G0053',
                'G0054', 'G0055',   'G0056',
                'G0057', 'G0058',   'G0059',
                'M0001', 'M0005',   'M0002',
                'M0003', 'M0004',   'M1366',
                'M1367', 'M1368',   'M1369',
                'M1370', 'M1420',   'M1421',
                'M1422', 'M1423',   'M1424',
                'M1425',
              ]);
        }) 
    })
    
    describe('ProgramNames Enum', () => {
        it('checks that the ProgramNames enum matches the json object of the same values.', () => {
            const jsonValues = Object.values(programNamesJson)
                .filter(val => typeof val === 'string');
            const enumValues = Object.values(ProgramNamesEnum);

            expect(jsonValues).toStrictEqual(enumValues);
        })
    })
});
