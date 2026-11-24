import { describe, it, expect } from '@jest/globals';

import { initValidation, measureType } from './validate-change-requests';

const newQualityChange = {
    measureId: '133',
    category: 'quality',
    title: 'qualityTitle',
    description: 'qualityDescription',
    primarySteward: 'stewardTitle',
    measureType: 'process',
    submissionMethods: ['registry'],
    isInverse: false,
    metricType: 'singlePerformanceRate',
    firstPerformanceYear: 2027,
    measureSets: [],
};

const newQcdrChange = {
    ...newQualityChange,
    measureId: 'ABC1',
    category: 'qcdr',
    metricType: 'registrySinglePerformanceRate',
    allowedVendors: ['1234567'],
    isRiskAdjusted: false,
};

describe('validate-change-requests', () => {
    describe('Core Measures performance years (2027+)', () => {
        it.each([
            [measureType.quality, newQualityChange],
            [measureType.qcdr, newQcdrChange],
        ])('requires isCoreMeasure for a new %s measure', (type, change) => {
            const validate = initValidation(type, true, 2027);

            expect(validate({ ...change, isCoreMeasure: true })).toBe(true);
            expect(validate(change)).toBe(false);
            expect(validate.errors?.[0].params).toEqual({ missingProperty: 'isCoreMeasure' });
        });

        it('rejects isHighPriority', () => {
            const validate = initValidation(measureType.quality, false, 2028);

            expect(validate({ measureId: '001', category: 'quality', isHighPriority: true })).toBe(false);
            expect(validate.errors?.[0].params).toEqual({ additionalProperty: 'isHighPriority' });
        });
    });

    describe('earlier performance years (2026 and earlier)', () => {
        it('requires isHighPriority for a new quality measure', () => {
            const validate = initValidation(measureType.quality, true, 2026);

            expect(validate({ ...newQualityChange, isHighPriority: true })).toBe(true);
            expect(validate(newQualityChange)).toBe(false);
            expect(validate.errors?.[0].params).toEqual({ missingProperty: 'isHighPriority' });
        });

        it('rejects isCoreMeasure', () => {
            const validate = initValidation(measureType.qcdr, false, 2026);

            expect(validate({ measureId: 'ABC1', category: 'qcdr', isCoreMeasure: true })).toBe(false);
            expect(validate.errors?.[0].params).toEqual({ additionalProperty: 'isCoreMeasure' });
        });
    });
});
