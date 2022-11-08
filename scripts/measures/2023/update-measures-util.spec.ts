import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import mockFS from 'mock-fs';

import * as UpdateMeasuresUtil from './update-measures-util';
import * as csvConverter from '../lib/csv-json-converter';
import * as logger from '../../logger';
import _ from 'lodash';
import { DataValidationError } from '../lib/errors';
import { MeasuresChange } from '../lib/validate-change-requests';

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
    substitutes: [ 'PI_PPHI_2' ],
    exclusion: [ 'PI_EP_1', 'PI_EP_32' ],
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
    submissionMethods: [ 'registry', 'claims' ],
    measureSets: [ 'nephrology', 'preventiveMedicine' ],
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
    submissionMethods: [ 'registry', 'claims' ],
    measureSets: [ 'nephrology', 'preventiveMedicine' ],
    isInverse: false,
    metricType: 'singlePerformanceRate',
    allowedVendors: [ '123456', '654321'],
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
    fs.readFileSync(path.join(appRoot + '', `measures/2023/measures-data.json`), 'utf8')
);

const qualityStrata = fs.readFileSync(path.join(appRoot + '', `test/measures/2023/quality-strata.csv`), 'utf8');
const qcdrStrata = fs.readFileSync(path.join(appRoot + '', `test/measures/2023/qcdr-strata.csv`), 'utf8');

describe('#update-measures-util', () => {
    describe('updateMeasuresWithChangeFile', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });
        let updateSpy: jest.SpyInstance, addSpy: jest.SpyInstance, deleteSpy: jest.SpyInstance;
        beforeEach(() => {

            mockFS({
                'fakepath': {
                    'test.csv': 'fakevalue',
                },
                'util/measures/2023/': {
                    'quality-strata.csv': qualityStrata,
                    'qcdr-strata.csv': qcdrStrata,
                }
            });
            updateSpy = jest.spyOn(UpdateMeasuresUtil, 'updateMeasure');
            addSpy = jest.spyOn(UpdateMeasuresUtil, 'addMeasure');
            deleteSpy = jest.spyOn(UpdateMeasuresUtil, 'deleteMeasure');
            jest.spyOn(UpdateMeasuresUtil, 'updateChangeLog').mockImplementation(jest.fn());

        });

        afterEach(() => {
            mockFS.restore();
            jest.restoreAllMocks();
        });

        it('successfully updates IA measure', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                ...allowedIaChange,
                category: 'ia',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data 2023`);
        });

        it('successfully adds IA measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedIaNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data 2023`);
        });

        it('successfully adds PI measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedPiNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
                volatileMeasures,
            );
            expect(updateSpy).toBeCalled();
            expect(addSpy).not.toBeCalled();
            expect(deleteSpy).not.toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data 2023`);
        });

        it('successfully adds QCDR measure', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([allowedQCDRNew]);

            const loggerSpy = jest.spyOn(logger, 'info');
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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

            expect(infoSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data 2023`);
        });

        it('throws if eCQM but has no eMeasureId', () => {

            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: 'USWR32',
                submissionMethods: ['electronicHealthRecord', 'quality'],
                category: 'qcdr',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
                yearRemoved: 2023,
                category: 'quality',
            }]);

            const loggerSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
                volatileMeasures,
            );
            expect(updateSpy).not.toBeCalled();
            expect(deleteSpy).toBeCalled();
            expect(loggerSpy).toBeCalledWith(`File 'test.csv' successfully ingested into measures-data 2023`);
        });

        it('logs any validation errors for bad fields', () => {
            jest.spyOn(csvConverter, 'convertCsvToJson').mockReturnValue([{
                measureId: '005',
                badField: false,
                category: 'quality',
            }]);

            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(jest.fn());
            const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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
            UpdateMeasuresUtil.updateMeasuresWithChangeFile(
                'test.csv',
                'fakepath/',
                '2023',
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

    describe('updateChangeLog', () => {
        beforeEach(() => {
            mockFS({
                'fakepath': {
                    'changes.meta.json': '[]',
                },
            });
        });

        afterEach(() => {
            mockFS.restore();
        });

        it('writes to the change file', () => {
            expect(() => {
                UpdateMeasuresUtil.updateChangeLog('test.csv', 'fakepath/');
            }).not.toThrow();
        });
    });

    describe('deleteMeasure', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });

        it('should delete the measure if found', () => {
            const infoSpy = jest.spyOn(logger, 'info');

            UpdateMeasuresUtil.deleteMeasure('001', 'quality', volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: '001' })).toBeUndefined();
            expect(infoSpy).toBeCalledWith(`Measure '001' removed.`);
        });

        it('should fail to delete the measure if not found', () => {
            const warningSpy = jest.spyOn(logger, 'warning');

            UpdateMeasuresUtil.deleteMeasure('notameasureid', 'qcdr', volatileMeasures);

            expect(warningSpy).toBeCalledWith(`Attempted to delete notameasureid, but not found.`);
        });
    });

    describe('updateMeasure', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });

        it('should update the measure if found', () => {
            const change = {
                measureId: '001',
                metricType: 'testdata',
                icdImpacted: [ 'testdata' ],
                clinicalGuidelineChanged: [ 'testdata' ],
                category: 'quality',
            } as MeasuresChange;

            UpdateMeasuresUtil.updateMeasure(change, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: '001' })).toEqual({
                title: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
                eMeasureId: 'CMS122v11',
                nqfEMeasureId: null,
                nqfId: '0059',
                measureId: '001',
                description: 'Percentage of patients 18-75 years of age with diabetes who had hemoglobin A1c > 9.0% during the measurement period.',
                nationalQualityStrategyDomain: 'Effective Clinical Care',
                measureType: 'intermediateOutcome',
                isHighPriority: true,
                primarySteward: 'National Committee for Quality Assurance',
                firstPerformanceYear: 2017,
                lastPerformanceYear: null,
                isInverse: true,
                category: 'quality',
                isRegistryMeasure: false,
                isRiskAdjusted: false,
                icdImpacted: [ 'testdata' ],
                isClinicalGuidelineChanged: true,
                isIcdImpacted: true,
                clinicalGuidelineChanged: [ 'testdata' ],
                metricType: 'testdata',
                allowedPrograms: [
                  'mips',
                  'pcf',
                  'app1'
                ],
                submissionMethods: [
                  'claims',
                  'electronicHealthRecord',
                  'cmsWebInterface',
                  'registry'
                ],
                measureSets: [
                  'endocrinology',
                  'familyMedicine',
                  'internalMedicine',
                  'nephrology',
                  'preventiveMedicine'
                ],
                measureSpecification: {}
            });
        });
    });

    describe('addMeasure', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });

        it('adds the ia measure if not found', () => {
            UpdateMeasuresUtil.addMeasure(allowedIaNew, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: 'IA_EPA_2_NEW' })).toEqual({
                title: 'iaTitle',
                description: 'iaDescription',
                measureId: 'IA_EPA_2_NEW',
                metricType: 'boolean',
                firstPerformanceYear: 2023,
                lastPerformanceYear: null,
                category: 'ia',
                weight: 'high',
                subcategoryId: 'populationManagement',
            });
        });

        it('adds the pi measure if not found', () => {
            UpdateMeasuresUtil.addMeasure(allowedPiNew, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: 'PI_PPHI_1_NEW' })).toEqual({
                title: 'piTitle',
                description: 'piDescription',
                measureId: 'PI_PPHI_1_NEW',
                firstPerformanceYear: 2023,
                lastPerformanceYear: null,
                category: 'pi',
                isRequired: false,
                metricType: 'boolean',
                isBonus: true,
                objective: 'protectPatientHealthInformation',
                reportingCategory: 'required',
                substitutes: [ 'PI_PPHI_2' ],
                exclusion: [ 'PI_EP_1', 'PI_EP_32' ],
                measureSets: [],
            });
        });

        it('adds the quality measure if not found', () => {
            UpdateMeasuresUtil.addMeasure(allowedQualityNew, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: '133' })).toEqual({
                title: 'qualityTitle',
                eMeasureId: null,
                nqfEMeasureId: null,
                nqfId: null,
                measureId: '133',
                description: 'qualityDescription',
                nationalQualityStrategyDomain: null,
                measureType: 'process',
                isHighPriority: false,
                primarySteward: 'stewardTitle',
                firstPerformanceYear: 2023,
                lastPerformanceYear: null,
                isInverse: false,
                category: 'quality',
                isRegistryMeasure: false,
                isRiskAdjusted: false,
                icdImpacted: [],
                isClinicalGuidelineChanged: false,
                isIcdImpacted: false,
                clinicalGuidelineChanged: [],
                metricType: 'singlePerformanceRate',
                allowedPrograms: [ 'mips', 'pcf' ],
                submissionMethods: [ 'registry', 'claims' ],
                measureSets: [ 'nephrology', 'preventiveMedicine' ],
            });
        });

        it('adds the qcdr measure if not found', () => {
            UpdateMeasuresUtil.addMeasure(allowedQCDRNew, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: 'abc' })).toEqual({
                title: 'qualityTitle',
                eMeasureId: null,
                nqfEMeasureId: null,
                nqfId: null,
                measureId: 'abc',
                description: 'qualityDescription',
                nationalQualityStrategyDomain: null,
                measureType: 'process',
                isHighPriority: false,
                primarySteward: 'stewardTitle',
                firstPerformanceYear: 2023,
                lastPerformanceYear: null,
                isInverse: false,
                category: 'quality',
                isRegistryMeasure: true,
                isRiskAdjusted: false,
                icdImpacted: [],
                isClinicalGuidelineChanged: false,
                isIcdImpacted: false,
                clinicalGuidelineChanged: [],
                metricType: 'singlePerformanceRate',
                allowedPrograms: [ 'mips', 'pcf' ],
                submissionMethods: [ 'registry', 'claims' ],
                measureSets: [ 'nephrology', 'preventiveMedicine' ],
                allowedVendors: [ '123456', '654321'],
            });
        });
    });
});