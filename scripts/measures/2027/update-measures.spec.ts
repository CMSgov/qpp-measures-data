import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { NestedDirectoryJSON, vol } from "memfs";
import { describe, afterEach, beforeEach, it, expect, jest } from '@jest/globals';

import * as UpdateMeasures from './update-measures';
import * as Lib from '../lib/measures-lib';
import * as csvConverter from '../lib/csv-json-converter';
import * as logger from '../../logger'
import { updateMeasures } from './update-measures';
import { MeasuresChange } from '../lib/validate-change-requests';

jest.mock('fs-extra');

const performanceYear = 2027;

const allowedIaChange = {
    title: 'Use of telehealth services that expand practice access',
    description: 'Create and implement a standardized process for providing telehealth services to expand access to care.',
    measureId: 'IA_EPA_2',
    subcategoryId: 'expandedPracticeAccess'
};

const allowedIaNew = {
    title: 'iaTitle',
    description: 'iaDescription',
    measureId: 'IA_EPA_2_NEW',
    firstPerformanceYear: 2023,
    category: 'ia',
    subcategoryId: 'populationManagement',
} as MeasuresChange;

const allowedPiNew = {
    title: 'piTitle',
    description: 'piDescription',
    measureId: 'PI_PPHI_1_NEW',
    firstPerformanceYear: 2023,
    category: 'pi',
    isRequired: false,
    metricType: 'boolean',
    objective: 'protectPatientHealthInformation',
    isBonus: true,
    reportingCategory: 'required',
    substitutes: ['PI_PPHI_2'],
    exclusion: ['PI_EP_1', 'PI_EP_32'],
} as MeasuresChange;

const allowedQualityNew = {
    title: 'qualityTitle',
    description: 'qualityDescription',
    measureId: '133',
    firstPerformanceYear: 2023,
    category: 'quality',
    primarySteward: 'stewardTitle',
    measureType: 'process',
    isCoreMeasure: false,
    submissionMethods: ['registry', 'claims'],
    measureSets: ['nephrology', 'preventiveMedicine'],
    isInverse: false,
    metricType: 'singlePerformanceRate',
    isRiskAdjusted: false,
} as MeasuresChange;

const allowedQCDRNew = {
    title: 'qualityTitle',
    description: 'qualityDescription',
    measureId: 'abc',
    firstPerformanceYear: 2023,
    category: 'qcdr',
    primarySteward: 'stewardTitle',
    measureType: 'process',
    isCoreMeasure: false,
    submissionMethods: ['registry', 'claims'],
    measureSets: ['nephrology', 'preventiveMedicine'],
    isInverse: false,
    metricType: 'singlePerformanceRate',
    allowedVendors: ['123456', '654321'],
    isRiskAdjusted: false,
} as MeasuresChange;

const allowedPiChange = {
    title: 'piTitle',
    description: 'piDescription',
    measureId: 'PI_PPHI_2',
    isBonus: true,
    isRequired: false,
};

const allowedQualityChange = {
    measureId: '001',
    firstPerformanceYear: 2020,
    isInverse: false,
    metricType: 'multiPerformanceRate',
    overallAlgorithm: 'overallStratumOnly',
};

const allowedCostScoreQualityChange = {
    measureId: '002',
    firstPerformanceYear: 2020,
    isInverse: false,
    metricType: 'costScore',
    overallAlgorithm: 'overallStratumOnly',
    submissionMethods: ['administrativeClaims'],
};

const allowedQcdrChange = {
    measureId: 'AQI48',
    title: 'testTitle',
};

const newQualityMeasure = {
    measureId: 'NewId',
    title: 'titleText',
    description: 'descriptionText',
    primarySteward: 'stewardId',
    measureType: 'process',
    isCoreMeasure: false,
    submissionMethods: ['quality'],
    allowedPrograms: ['mips'],
    firstPerformanceYear: 2023,
    isInverse: false,
    metricType: 'singlePerformanceRate',
};

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', `measures/${performanceYear}/measures-data.json`), 'utf8')
);

const qualityStrata = fs.readFileSync(path.join(appRoot + '', `test/measures/${performanceYear}/quality-strata.csv`), 'utf8');
const qcdrStrata = fs.readFileSync(path.join(appRoot + '', `test/measures/${performanceYear}/qcdr-strata.csv`), 'utf8');

describe('update-measures', () => {
    describe('updateMeasures', () => {
        let volatileMeasures: any;
        let updateFileSpy: jest.Spied<typeof UpdateMeasures.ingestChangeFile>, writeFileSpy: jest.Spied<typeof Lib.writeToFile>;
        let logSpy: any, warningSpy: any;
        let volFileStructure: NestedDirectoryJSON;

        beforeEach(() => {
            volatileMeasures = [...measuresJson];

            updateFileSpy = jest.spyOn(UpdateMeasures, 'ingestChangeFile').mockImplementation(() => 0);
            writeFileSpy = jest.spyOn(Lib, 'writeToFile').mockImplementation(jest.fn());
            logSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());

            volFileStructure = {};
            volFileStructure[`measures/${performanceYear}`] = {
                'measures-data.json': JSON.stringify(volatileMeasures),
            };
        });

        afterEach(() => {
            vol.reset();
            jest.restoreAllMocks();
        });

        it('finds the new files and attempts to update the measures data', () => {
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '["test1.csv", "test2.csv"]',
                'test1.csv': "fakedata",
                'test2.csv': "fakedata",
                'test3.csv': "fakedata",
                'test4.csv': "fakedata",
            };
            vol.fromNestedJSON(volFileStructure);

            updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).toHaveBeenCalledTimes(2);
            expect(writeFileSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).not.toHaveBeenCalled();
        });

        it('does nothing and logs if no new files are found', () => {
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '["test1.csv", "test2.csv"]',
                'test1.csv': "fakedata",
                'test2.csv': "fakedata",
            };
            vol.fromNestedJSON(volFileStructure);

            updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).not.toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect(warningSpy).toHaveBeenCalledWith('No new change files found.');
        });

        it('writes the Core Measure migration even when no new change files are found', () => {
            volFileStructure[`measures/${performanceYear}`] = {
                'measures-data.json': JSON.stringify([
                    { category: 'quality', measureId: '001', isHighPriority: true },
                    { category: 'ia', measureId: 'IA_1' },
                ]),
            };
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '[]',
            };
            vol.fromNestedJSON(volFileStructure);

            updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).not.toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('Applied Core Measure field migration.');
            expect(writeFileSpy).toHaveBeenCalledWith([
                { category: 'quality', measureId: '001', isCoreMeasure: false, coreMeasureFor: [] },
                { category: 'ia', measureId: 'IA_1' },
            ], `measures/${performanceYear}/measures-data.json`);
        });

        it('does not write the Core Measure migration in test mode', () => {
            volFileStructure[`measures/${performanceYear}`] = {
                'measures-data.json': JSON.stringify([{ category: 'quality', measureId: '001', isHighPriority: true }]),
            };
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '[]',
            };
            vol.fromNestedJSON(volFileStructure);

            updateMeasures(`${performanceYear}`, 'true');

            expect(writeFileSpy).not.toHaveBeenCalled();
        });

        it('handles an empty change file', () => {
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '[]',
            };
            vol.fromNestedJSON(volFileStructure);

            updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).not.toHaveBeenCalled();
            expect(writeFileSpy).not.toHaveBeenCalled();
            expect(warningSpy).toHaveBeenCalledWith('No new change files found.');
        });
    });

    describe('ingestChangeFile', () => {
        let volatileMeasures: any;
        let updateSpy: jest.Spied<typeof Lib.updateMeasure>, addSpy: jest.Spied<typeof Lib.addMeasure>, deleteSpy: jest.Spied<typeof Lib.deleteMeasure>;

        beforeEach(() => {
            volatileMeasures = [...measuresJson];
            const volFileStructure: NestedDirectoryJSON = {
                'fakepath': {
                    'test.csv': 'fakevalue',
                }
            };
            volFileStructure[`util/measures/${performanceYear}/`] = {
                'quality-strata.csv': qualityStrata,
                'qcdr-strata.csv': qcdrStrata,
            };

            vol.fromNestedJSON(volFileStructure);
            updateSpy = jest.spyOn(Lib, 'updateMeasure');
            addSpy = jest.spyOn(Lib, 'addMeasure');
            deleteSpy = jest.spyOn(Lib, 'deleteMeasure');
            jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
            jest.spyOn(Lib, 'updateChangeLog').mockImplementation(jest.fn());

        });

        afterEach(() => {
            vol.reset();
            jest.restoreAllMocks();
        });

        it('successfully updates IA measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedIaChange,
                category: 'ia',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('successfully adds IA measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedIaNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`New measure 'IA_EPA_2_NEW' added.`);
        });

        it('successfully updates PI measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedPiChange,
                category: 'pi',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('successfully adds PI measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedPiNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`New measure 'PI_PPHI_1_NEW' added.`);
        });

        it('successfully adds Quality measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedQualityNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`New measure '133' added.`);
        });

        it('successfully updates QCDR measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedQcdrChange,
                category: 'qcdr',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('successfully adds QCDR measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedQCDRNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`New measure 'abc' added.`);
        });

        it('throws when category is not included', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedIaChange]);

            const loggerSpy = jest.spyOn(logger, 'error');
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`'IA_EPA_2': Category is required.`);
        });

        it('logs warnings when certain fields are changed', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedQualityChange,
                category: 'quality',
            }]);

            const warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
            const infoSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(warningSpy).toHaveBeenCalledWith(`'001': 'First Performance Year' was changed. Was this deliberate?`);
            expect(warningSpy).toHaveBeenCalledWith(`'001': 'isInverse' was changed. Was this deliberate?`);
            expect(warningSpy).toHaveBeenCalledWith(`'001': 'Metric Type' was changed. Was the strata file also updated to match?`);
            expect(warningSpy).toHaveBeenCalledWith(`'001': 'Calculation Type' was changed. Was the strata file also updated to match?`);
            expect(warningSpy).toHaveBeenCalledWith(`'001': 'Metric Type' and/or 'Inverse' were changed. Make sure benchmarks are also updated with a change request.`);

            expect(infoSpy).toHaveBeenCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('logs warnings when certain fields are changed', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedCostScoreQualityChange,
                category: 'quality',
            }]);

            const warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(warningSpy).toHaveBeenCalledWith(`'002': this measure's only submissionMethod is 'administrativeClaims'; however either the metricType is not 'costScore' and/or isInverse is 'false'. Was this deliberate?`);
        });

        it('throws if eCQM but has no eMeasureId', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: 'USWR32',
                submissionMethods: ['electronicHealthRecord', 'quality'],
                category: 'qcdr',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'USWR32': CMS eCQM ID is required if one of the collection types is eCQM.`);
        });

        it('no longer requires outcome measures to be High Priority', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                measureType: 'outcome',
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('throws if metricType is costScore but submissionMethod does not include administrativeClaims', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '479',
                submissionMethods: ['registry'],
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'479': 'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
        });

        it('throws if metricType is costScore but submissionMethod includes more than just administrativeClaims', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '479',
                submissionMethods: ['administrativeClaims', 'certifiedSurveyVendor'],
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'479': 'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
        });

        it('throws if new multiPerfRate measure does not include a Calc Type', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...newQualityMeasure,
                category: 'quality',
                metricType: 'multiPerformanceRate',

            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'NewId': New multiPerformanceRate measures require a Calculation Type.`);
        });

        it('deletes measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                yearRemoved: performanceYear,
                category: 'quality',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(deleteSpy).toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('logs any validation errors for bad fields', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                badField: false,
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'005': Validation Failed. More info logged above.`);
            expect(logSpy).toHaveBeenCalledWith([{
                instancePath: '',
                keyword: 'additionalProperties',
                message: 'must NOT have additional properties',
                params: {
                    additionalProperty: 'badField'
                },
                schemaPath: '#/additionalProperties',
            }]);
        });

        it('ingests a Core Measure change request csv and sets isCoreMeasure', () => {
            vol.fromNestedJSON({
                'fakepath': {
                    'core.csv': 'Category,*** Quality Number (#) / QCDR #,Core Measure\nQuality,001,Y\n',
                },
            });
            jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            const warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());

            const result = UpdateMeasures.ingestChangeFile('core.csv', 'fakepath/', `${performanceYear}`, volatileMeasures);

            expect(result).toBe(0);
            expect(errorSpy).not.toHaveBeenCalled();
            expect(volatileMeasures.find((m: any) => m.measureId === '001').isCoreMeasure).toBe(true);
            expect(warningSpy).toHaveBeenCalledWith(`'001': 'Core Measure' was changed. Confirm the MVP source file ('Core Quality' rows) is updated to match.`);
            expect(warningSpy).toHaveBeenCalledWith(`'001' is flagged as a Core Measure but is not a Core Measure for any MVP (coreMeasureFor is empty). Confirm the MVP source file will be updated.`);
        });

        it('rejects a change request csv that includes the High Priority column', () => {
            vol.fromNestedJSON({
                'fakepath': {
                    'hp.csv': 'Category,*** Quality Number (#) / QCDR #,High Priority\nQuality,001,\n',
                },
            });
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());

            const result = UpdateMeasures.ingestChangeFile('hp.csv', 'fakepath/', `${performanceYear}`, volatileMeasures);

            expect(result).toBe(1);
            expect(updateSpy).not.toHaveBeenCalled();
            expect(addSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'hp.csv': 'High Priority' is not supported for PY${performanceYear} and later. Use the 'Core Measure' column.`);
        });

        it('fails validation for a new quality measure without Core Measure', () => {
            const noCoreMeasure = { ...allowedQualityNew };
            delete noCoreMeasure.isCoreMeasure;
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([noCoreMeasure]);
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());

            UpdateMeasures.ingestChangeFile('test.csv', 'fakepath/', `${performanceYear}`, volatileMeasures);

            expect(addSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'133': Validation Failed. More info logged above.`);
            expect(logSpy).toHaveBeenCalledWith([expect.objectContaining({ params: { missingProperty: 'isCoreMeasure' } })]);
        });

        it('adds a new Core Measure with an empty coreMeasureFor and warns', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{ ...allowedQualityNew, isCoreMeasure: true }]);
            jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            const warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());

            UpdateMeasures.ingestChangeFile('test.csv', 'fakepath/', `${performanceYear}`, volatileMeasures);

            expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ measureId: '133' }), volatileMeasures, `${performanceYear}`);
            expect(volatileMeasures.find((m: any) => m.measureId === '133')).toEqual(expect.objectContaining({
                isCoreMeasure: true,
                coreMeasureFor: [],
            }));
            expect(warningSpy).toHaveBeenCalledWith(`'133' is flagged as a Core Measure but is not a Core Measure for any MVP (coreMeasureFor is empty). Confirm the MVP source file will be updated.`);
        });

        it('logs any validation errors for bad data', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                metricType: 'baddata',
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            UpdateMeasures.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toHaveBeenCalled();
            expect(deleteSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(`'005': Validation Failed. More info logged above.`);
            expect(logSpy).toHaveBeenCalledWith([{
                instancePath: '/metricType',
                keyword: 'enum',
                message: 'must be equal to one of the allowed values',
                params: {
                    allowedValues: [
                        'registrySinglePerformanceRate',
                        'registryMultiPerformanceRate',
                        'singlePerformanceRate',
                        'multiPerformanceRate',
                        'nonProportion',
                        'costScore',
                    ],
                },
                schemaPath: '#/properties/metricType/enum',
            }]);
        });
    });
});