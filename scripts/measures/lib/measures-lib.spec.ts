import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { vol } from 'memfs';

import * as MeasuresLib from './measures-lib';
import * as logger from '../../logger';
import _ from 'lodash';
import { MeasuresChange } from '../lib/validate-change-requests';
import { Category } from '../../../util/interfaces/measure';

jest.mock('fs-extra');

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
    companionMeasureId: ['001'],
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

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', `measures/2023/measures-data.json`), 'utf8')
);

describe('#update-measures-util', () => {

    describe('updateChangeLog', () => {
        beforeEach(() => {
            vol.fromNestedJSON({
                'fakepath': {
                    'changes.meta.json': '[]',
                },
            });
        });

        afterEach(() => {
            vol.reset();
        });

        it('writes to the change file', () => {
            expect(() => {
                MeasuresLib.updateChangeLog('test.csv', 'fakepath/');
            }).not.toThrow();
        });
    });

    describe('deleteMeasure', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });

        it('should delete the measure if found', () => {
            vol.fromNestedJSON({
                './util/measures/2024': {
                    'quality-strata.csv': fs.readFileSync(path.join(appRoot + '', `util/measures/2024/quality-strata.csv`), 'utf8'),
                },
            });
            const infoSpy = jest.spyOn(logger, 'info');

            MeasuresLib.deleteMeasure('001', 'quality', volatileMeasures, 'util/measures/2024/');

            expect(_.find(volatileMeasures, { measureId: '001' })).toBeUndefined();
            expect(infoSpy).toBeCalledWith(`Measure '001' removed.`);
        });

        it('should fail to delete the measure if not found', () => {
            const warningSpy = jest.spyOn(logger, 'warning');

            MeasuresLib.deleteMeasure('notameasureid', 'qcdr', volatileMeasures, 'util/measures/2024/');

            expect(warningSpy).toBeCalledWith(`Attempted to delete notameasureid, but not found.`);
        });
    });

    describe('updateMeasure', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });

        it('should update the quality measure if found', () => {
            const change = {
                measureId: '001',
                metricType: 'testdata',
                icdImpacted: ['testdata'],
                clinicalGuidelineChanged: ['testdata'],
                category: 'quality',
                companionMeasureId: ['134'],
            } as MeasuresChange;

            MeasuresLib.updateMeasure(change, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: '001' })).toEqual(expect.objectContaining({
                title: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
                eMeasureId: 'CMS122v11',
                nqfEMeasureId: null,
                nqfId: '0059',
                measureId: '001',
                description: 'Percentage of patients 18-75 years of age with diabetes who had hemoglobin A1c > 9.0% during the measurement period.',
                measureType: 'intermediateOutcome',
                isHighPriority: true,
                primarySteward: 'National Committee for Quality Assurance',
                firstPerformanceYear: 2017,
                lastPerformanceYear: null,
                isInverse: true,
                category: 'quality',
                isRegistryMeasure: false,
                isRiskAdjusted: false,
                icdImpacted: ['testdata'],
                isClinicalGuidelineChanged: true,
                isIcdImpacted: true,
                clinicalGuidelineChanged: ['testdata'],
                metricType: 'testdata',
                allowedPrograms: [
                    'mips',
                    'pcf',
                    'app1',
                    'M0002',
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
                    'nutritionDietician',
                    'preventiveMedicine'
                ],
                measureSpecification: {
                    claims: 'http://qpp.cms.gov/docs/QPP_quality_measure_specifications/Claims-Registry-Measures/2023_Measure_001_MedicarePartBClaims.pdf',
                    electronicHealthRecord: 'https://ecqi.healthit.gov/ecqm/ec/2023/cms122v11',
                    registry: 'http://qpp.cms.gov/docs/QPP_quality_measure_specifications/CQM-Measures/2023_Measure_001_MIPSCQM.pdf',
                }
            }));
        });

        it('should update the PI measure if found', () => {
            const change = {
                measureId: 'PI_PPHI_1',
                metricType: 'testdata',
                category: 'pi',
                substitutes: ['PI_PPHI_2'],
                exclusion: ['PI_ONCDIR_1'],
            } as MeasuresChange;

            MeasuresLib.updateMeasure(change, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: 'PI_PPHI_1' })).toEqual(expect.objectContaining({
                category: 'pi',
                measureId: 'PI_PPHI_1',
                title: 'Security Risk Analysis',
                isRequired: true,
                metricType: 'testdata',
                firstPerformanceYear: 2017,
                lastPerformanceYear: null,
                objective: 'protectPatientHealthInformation',
                isBonus: false,
                reportingCategory: 'required',
                measureSets: [],
                substitutes: ['PI_PPHI_2'],
                exclusion: ['PI_ONCDIR_1'],
                preprod: []
            }));
        });

        it('should not add isSevenPointCapRemoved when performanceYear is 2024 or less', () => {
            const change: MeasuresChange = {
                measureId: '001',
                category: Category.QUALITY,
                sevenPointCapRemoved: ['registry'],
            };

            MeasuresLib.updateMeasure(change, volatileMeasures, '2024');

            const updatedMeasure = _.find(volatileMeasures, { measureId: '001' });
            expect(updatedMeasure.isSevenPointCapRemoved).toBeUndefined();
        });

        it('should update isSevenPointCapRemoved to true when sevenPointCapRemoved has values', () => {
            const change: MeasuresChange = {
                measureId: '001',
                category: Category.QUALITY,
                sevenPointCapRemoved: ['registry'],
            };

            MeasuresLib.updateMeasure(change, volatileMeasures, '2025');

            const updatedMeasure = _.find(volatileMeasures, { measureId: '001' });
            expect(updatedMeasure.isSevenPointCapRemoved).toBe(true);
            expect(updatedMeasure.sevenPointCapRemoved).toEqual(['registry']);
        });

        it('should update isSevenPointCapRemoved to false when sevenPointCapRemoved is empty', () => {
            const change: MeasuresChange = {
                measureId: '001',
                category: Category.QUALITY,
                sevenPointCapRemoved: [],
            };

            MeasuresLib.updateMeasure(change, volatileMeasures, '2025');

            const updatedMeasure = _.find(volatileMeasures, { measureId: '001' });
            expect(updatedMeasure.isSevenPointCapRemoved).toBe(false);
            expect(updatedMeasure.sevenPointCapRemoved).toEqual([]);
        });
    });

    describe('addMeasure', () => {
        let volatileMeasures: any;
        beforeEach(() => {
            volatileMeasures = [...measuresJson];
        });

        it('adds the ia measure if not found', () => {
            MeasuresLib.addMeasure(allowedIaNew, volatileMeasures);

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
                allowedPrograms: [
                    'mips',
                    'app1',
                    'appPlus'
                ],
                allowedRegistrationTypes: [
                    'apm',
                    'group',
                    'subgroup',
                    'individual',
                ],
            });
        });

        it('adds the pi measure if not found', () => {
            MeasuresLib.addMeasure(allowedPiNew, volatileMeasures);

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
                preprod: [],
                reportingCategory: 'required',
                substitutes: ['PI_PPHI_2'],
                exclusion: ['PI_EP_1', 'PI_EP_32'],
                measureSets: [],
                allowedPrograms: [
                    'mips',
                    'app1',
                    'appPlus',
                    'ssp',
                ],
                allowedRegistrationTypes: [
                    'apm',
                    'group',
                    'subgroup',
                    'individual',
                ],
            });
        });

        it('adds the quality measure if not found', () => {
            MeasuresLib.addMeasure(allowedQualityNew, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: '133' })).toEqual({
                title: 'qualityTitle',
                eMeasureId: null,
                nqfEMeasureId: null,
                nqfId: null,
                measureId: '133',
                description: 'qualityDescription',
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
                companionMeasureId: [],
                allowedPrograms: ['mips'],
                submissionMethods: ['registry', 'claims'],
                measureSets: ['nephrology', 'preventiveMedicine'],
                sevenPointCapRemoved: [],
                isSevenPointCapRemoved: false,
                allowedRegistrationTypes: [
                    'apm',
                    'group',
                    'subgroup',
                    'individual',
                ],
            });
        });

        it('adds the qcdr measure if not found', () => {
            MeasuresLib.addMeasure(allowedQCDRNew, volatileMeasures);

            expect(_.find(volatileMeasures, { measureId: 'abc' })).toEqual({
                title: 'qualityTitle',
                eMeasureId: null,
                nqfEMeasureId: null,
                nqfId: null,
                measureId: 'abc',
                description: 'qualityDescription',
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
                allowedPrograms: ['mips'],
                submissionMethods: ['registry', 'claims'],
                measureSets: ['nephrology', 'preventiveMedicine'],
                allowedVendors: ['123456', '654321'],
                sevenPointCapRemoved: [],
                isSevenPointCapRemoved: false,
                allowedRegistrationTypes: [
                    'apm',
                    'group',
                    'subgroup',
                    'individual',
                ],
            });
        });
    });
});
