import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { NestedDirectoryJSON, vol } from "memfs";

import * as Lib from '../lib/measures-lib';
import * as logger from '../../logger'
import * as UpdateScript from './update-measures';
import * as csvConverter from '../lib/csv-json-converter';
import { MeasuresChange } from '../lib/validate-change-requests';

jest.mock('fs-extra');

const performanceYear = 2023;

const allowedIaChange = {
    title: 'Use of telehealth services that expand practice access',
    description: 'Create and implement a standardized process for providing telehealth services to expand access to care.',
    measureId: 'IA_EPA_2',
    weight: 'medium',
    subcategoryId: 'expandedPracticeAccess'
};

const allowedIaNew = {
    title: 'iaTitle',
    description: 'iaDescription',
    measureId: 'IA_EPA_2_NEW',
    firstPerformanceYear: 2023,
    category: 'ia',
    weight: 'high',
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
    isHighPriority: false,
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
    isHighPriority: false,
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
    measureId: 'PI_PPHI_1',
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

const allowedQcdrChange = {
    measureId: 'AQI49',
    title: 'testTitle',
};

const newQualityMeasure = {
    measureId: 'NewId',
    title: 'titleText',
    description: 'descriptionText',
    primarySteward: 'stewardId',
    measureType: 'process',
    isHighPriority: false,
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
        let updateFileSpy: jest.SpyInstance, writeFileSpy: jest.SpyInstance;
        let logSpy: any, warningSpy: any;
        let volFileStructure: NestedDirectoryJSON;

        beforeEach(() => {
            volatileMeasures = [...measuresJson];

            updateFileSpy = jest.spyOn(UpdateScript, 'ingestChangeFile').mockImplementation(jest.fn());
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

            UpdateScript.updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).toBeCalledTimes(2);
            expect(writeFileSpy).toBeCalledTimes(1);
            expect(logSpy).not.toBeCalled();
        });

        it('does nothing and logs if no new files are found', () => {
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '["test1.csv", "test2.csv"]',
                'test1.csv': "fakedata",
                'test2.csv': "fakedata",
            };
            vol.fromNestedJSON(volFileStructure);

            UpdateScript.updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).not.toBeCalled();
            expect(writeFileSpy).not.toBeCalled();
            expect(warningSpy).toBeCalledWith('No new change files found.');
        });

        it('handles an empty change file', () => {
            volFileStructure[`updates/measures/${performanceYear}`] = {
                'changes.meta.json': '[]',
            };
            vol.fromNestedJSON(volFileStructure);

            UpdateScript.updateMeasures(`${performanceYear}`);

            expect(updateFileSpy).not.toBeCalled();
            expect(writeFileSpy).not.toBeCalled();
            expect(warningSpy).toBeCalledWith('No new change files found.');
        });
    });

    describe('ingestChangeFile', () => {
        let volatileMeasures: any;
        let updateSpy: jest.SpyInstance, addSpy: jest.SpyInstance, deleteSpy: jest.SpyInstance;

        beforeEach(() => {
            volatileMeasures = [...measuresJson];
            const volFileStructure = {
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
            jest.spyOn(process, 'exit').mockImplementation();
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
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('successfully adds IA measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedIaNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`New measure 'IA_EPA_2_NEW' added.`);
        });

        it('successfully updates PI measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedPiChange,
                category: 'pi',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('successfully adds PI measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedPiNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`New measure 'PI_PPHI_1_NEW' added.`);
        });

        it('successfully adds Quality measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedQualityNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`New measure '133' added.`);
        });

        it('successfully updates QCDR measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedQcdrChange,
                category: 'qcdr',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('successfully adds QCDR measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedQCDRNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`New measure 'abc' added.`);
        });

        it('throws when category is not included', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedIaChange]);

            const loggerSpy = jest.spyOn(logger, 'error');
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`'IA_EPA_2': Category is required.`);
        });

        it('logs warnings when certain fields are changed', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedQualityChange,
                category: 'quality',
            }]);

            const warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
            const infoSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(warningSpy).toBeCalledWith(`'001': 'First Performance Year' was changed. Was this deliberate?`);
            expect(warningSpy).toBeCalledWith(`'001': 'isInverse' was changed. Was this deliberate?`);
            expect(warningSpy).toBeCalledWith(`'001': 'Metric Type' was changed. Was the strata file also updated to match?`);
            expect(warningSpy).toBeCalledWith(`'001': 'Calculation Type' was changed. Was the strata file also updated to match?`);
            expect(warningSpy).toBeCalledWith(`'001': 'Metric Type', 'High Priority', and/or 'Inverse' were changed. Make sure benchmarks are also updated with a change request.`);

            expect(infoSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('throws if eCQM but has no eMeasureId', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: 'USWR32',
                submissionMethods: ['electronicHealthRecord', 'quality'],
                category: 'qcdr',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'USWR32': CMS eCQM ID is required if one of the collection types is eCQM.`);
        });

        it('throws if outcome measure is not High Priority', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                measureType: 'outcome',
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'005': 'outcome' and 'intermediateOutcome' measures must always be High Priority.`);
        });

        it('throws if metricType is costScore but submissionMethod does not include administrativeClaims', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '479',
                submissionMethods: ['registry'],
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'479': 'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
        });

        it('throws if metricType is costScore but submissionMethod includes more than just administrativeClaims', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '479',
                submissionMethods: ['administrativeClaims', 'certifiedSurveyVendor'],
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'479': 'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
        });

        it('throws if new multiPerfRate measure does not include a Calc Type', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...newQualityMeasure,
                category: 'quality',
                metricType: 'multiPerformanceRate',

            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'NewId': New multiPerformanceRate measures require a Calculation Type.`);
        });

        it('deletes measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                yearRemoved: performanceYear,
                category: 'quality',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(deleteSpy).toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data ${performanceYear}`);
        });

        it('logs any validation errors for bad fields', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                badField: false,
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'005': Validation Failed. More info logged above.`);
            expect(logSpy).toBeCalledWith([{
                instancePath: '',
                keyword: 'additionalProperties',
                message: 'must NOT have additional properties',
                params: {
                    additionalProperty: 'badField'
                },
                schemaPath: '#/additionalProperties',
            }]);
        });

        it('logs any validation errors for bad data', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                metricType: 'baddata',
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            UpdateScript.ingestChangeFile(
                'test.csv',
                'fakepath/',
                `${performanceYear}`,
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(errorSpy).toBeCalledWith(`'005': Validation Failed. More info logged above.`);
            expect(logSpy).toBeCalledWith([{
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