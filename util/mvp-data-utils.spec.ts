import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import fse from 'fs-extra';
import _ from 'lodash';

import * as mvpDataUtils from './mvp-data-utils';
import * as logger from '../scripts/logger';
import { Constants } from '../constants';
import { Programs, Measure } from './interfaces/measure';
import { MVP } from '../scripts/mvp/mvps.types';

jest.mock('../index', () => ({
    getMeasuresData: jest.fn()
}));

describe('mvp-data-utils', () => {
    const mockPerformanceYear = 2025;
    // const mockMvpFilePath = `${mockBasePath}/mvp/${mockPerformanceYear}/mvp-enriched.json`;
    // const mockMeasureFilePath = `${mockBasePath}/measures/${mockPerformanceYear}/measures-data.json`;

    const mockMvpData: MVP[] = [
        {
            mvpId: 'MVP1',
            administrativeClaimsMeasureIds: ['AC1'],
            qualityMeasureIds: ['Q1'],
            costMeasureIds: ['C1'],
            iaMeasureIds: ['IA1'],
            foundationPiMeasureIds: ['PI1'],
            foundationQualityMeasureIds: []
        } as any,
        {
            mvpId: Programs.APP1,
            administrativeClaimsMeasureIds: [],
            qualityMeasureIds: [],
            costMeasureIds: [],
            iaMeasureIds: [],
            foundationPiMeasureIds: [],
            foundationQualityMeasureIds: []
        } as any
    ];

    const mockMeasuresData: Measure[] = [
        {
            measureId: 'Q1',
            allowedPrograms: [Programs.MIPS, 'MVP1']
        } as any,
        {
            measureId: 'C1',
            allowedPrograms: [Programs.MIPS]
        } as any,
        {
            measureId: 'IA1',
            allowedPrograms: []
        } as any,
        {
            measureId: 'PI1',
            allowedPrograms: []
        } as any
    ];
    
    let fseReadSpy: jest.Spied<typeof fse.readFileSync>;
    let fseWriteSpy: jest.Spied<typeof fse.writeFileSync>;

    beforeEach(() => {
        jest.clearAllMocks();
        fseReadSpy = jest.spyOn(fse, 'readFileSync').mockImplementation((filePath: any) => {
            if (filePath.includes('mvp.json')) {
                return JSON.stringify(mockMvpData);
            }
            return '';
        });
        require('../index').getMeasuresData.mockReturnValue(_.cloneDeep(mockMeasuresData));
        fseWriteSpy = jest.spyOn(fse, 'writeFileSync').mockImplementation(() => { });
    });

    it('returns [] and logs if mvp or measures data not found', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
        jest.spyOn(fse, 'readFileSync').mockImplementation(() => {
            throw new Error('File not found');
        });
        const result = mvpDataUtils.createMVPDataFile(mockPerformanceYear);
        expect(result).toEqual([]);
        expect(logSpy).toHaveBeenCalledWith('QPP mvp / measures data not found for year: 2025 --> Error: File not found');
    });

    it('hydrates MVPs with measures and sets hasOutcomeAdminClaims', () => {
        const result = mvpDataUtils.createMVPDataFile(mockPerformanceYear);
        // Each MVP should have enriched keys from Constants.mvpMeasuresHelper
        Constants.mvpMeasuresHelper.forEach(item => {
            expect(result[0]).toHaveProperty(item.enrichedMeasureKey);
        });
        // hasOutcomeAdminClaims should be true for MVP1 (has admin claims), false for APP1 (none)
        expect(result[0].hasOutcomeAdminClaims).toBe(true);
        expect(result[1].hasOutcomeAdminClaims).toBe(false);
    });

    it('deletes measureIdKey fields after hydration', () => {
        const result = mvpDataUtils.createMVPDataFile(mockPerformanceYear);
        Constants.mvpMeasuresHelper.forEach(item => {
            expect(result[0][item.measureIdKey]).toBeUndefined();
        });
    });

    it('writes hydrated MVP and measures data to disk', () => {
        mvpDataUtils.createMVPDataFile(mockPerformanceYear);
        expect(fseWriteSpy).toHaveBeenCalledWith(
            expect.stringContaining(`mvp/${mockPerformanceYear}/mvp-enriched.json`),
            expect.any(String)
        );
        expect(fseWriteSpy).toHaveBeenCalledWith(
            expect.stringContaining(`measures/${mockPerformanceYear}/measures-data.json`),
            expect.any(String)
        );
    });

    describe('populateMeasuresforMVPs', () => {
        it('adds mvpId to allowedPrograms for each matching measure', () => {
            const mvp = {
                mvpId: 'MVP1',
                qualityMeasureIds: ['Q1'],
                enrichedQualityMeasures: []
            } as any;
            const allMvps = [mvp];
            const measuresData = [
                { measureId: 'Q1', allowedPrograms: [] }
            ] as any;
            mvpDataUtils.populateMeasuresforMVPs(
                mvp,
                allMvps,
                measuresData,
                'qualityMeasureIds',
                'enrichedQualityMeasures'
            );
            expect(measuresData[0].allowedPrograms).toContain('MVP1');
            expect(mvp.enrichedQualityMeasures[0].measureId).toBe('Q1');
        });

        it('sets hasCahps to true if measureId is 321', () => {
            const mvp = {
                mvpId: 'MVP1',
                qualityMeasureIds: ['321'],
                enrichedQualityMeasures: []
            } as any;
            const allMvps = [mvp];
            const measuresData = [
                { measureId: '321', allowedPrograms: [] }
            ] as any;
            mvpDataUtils.populateMeasuresforMVPs(
                mvp,
                allMvps,
                measuresData,
                'qualityMeasureIds',
                'enrichedQualityMeasures'
            );
            expect(mvp.hasCahps).toBe(true);
        });

        it('does nothing if measure is not found', () => {
            const mvp = {
                mvpId: 'MVP1',
                qualityMeasureIds: ['NOTFOUND'],
                enrichedQualityMeasures: []
            } as any;
            const allMvps = [mvp];
            const measuresData = [
                { measureId: 'Q1', allowedPrograms: [] }
            ] as any;
            mvpDataUtils.populateMeasuresforMVPs(
                mvp,
                allMvps,
                measuresData,
                'qualityMeasureIds',
                'enrichedQualityMeasures'
            );
            expect(mvp.enrichedQualityMeasures.length).toBe(0);
        });
    });

    describe('Core Measures', () => {
        const coreMvpData: any[] = [
            {
                mvpId: 'G0053',
                qualityMeasureIds: ['039', '130'],
                coreQualityMeasureIds: ['039', 'NOTFOUND'],
                iaMeasureIds: [], costMeasureIds: [], foundationPiMeasureIds: [],
                foundationQualityMeasureIds: [], administrativeClaimsMeasureIds: [],
            },
            {
                mvpId: 'M0001',
                qualityMeasureIds: ['039', '130'],
                coreQualityMeasureIds: ['039', '130'],
                iaMeasureIds: [], costMeasureIds: [], foundationPiMeasureIds: [],
                foundationQualityMeasureIds: [], administrativeClaimsMeasureIds: [],
            },
        ];
        const coreMeasuresData = () => [
            { measureId: '039', category: 'quality', isCoreMeasure: true, coreMeasureFor: ['G0099'], allowedPrograms: ['mips'] },
            { measureId: '130', category: 'quality', isCoreMeasure: false, coreMeasureFor: [], allowedPrograms: ['mips'] },
            { measureId: '236', category: 'quality', isCoreMeasure: true, coreMeasureFor: [], allowedPrograms: ['mips'] },
            { measureId: 'IA_1', category: 'ia', allowedPrograms: ['mips'] },
        ] as any[];
        let warningSpy: jest.Spied<typeof logger.warning>;

        beforeEach(() => {
            warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
        });

        describe('populateCoreMeasureFor', () => {
            it('rebuilds coreMeasureFor from coreQualityMeasureIds and warns on disagreements', () => {
                const measures = coreMeasuresData();

                mvpDataUtils.populateCoreMeasureFor(_.cloneDeep(coreMvpData) as MVP[], measures);

                expect(measures.map(m => [m.measureId, m.isCoreMeasure, m.coreMeasureFor])).toEqual([
                    ['039', true, ['G0053', 'M0001']],
                    ['130', false, ['M0001']],
                    ['236', true, []],
                    ['IA_1', undefined, undefined],
                ]);
                expect(warningSpy).toHaveBeenCalledTimes(3);
                expect(warningSpy).toHaveBeenCalledWith(`Core Quality measure 'NOTFOUND' for MVP 'G0053' was not found in measures-data.json.`);
                expect(warningSpy).toHaveBeenCalledWith(`'130' is a Core Quality measure for M0001 in the MVP source file, but isCoreMeasure is false.`);
                expect(warningSpy).toHaveBeenCalledWith(`'236' has isCoreMeasure set to true, but is not a Core Quality measure for any MVP in the MVP source file.`);
            });

            it('defaults missing Core Measure fields on quality measures', () => {
                const measures = [{ measureId: '039', category: 'quality' }] as any[];

                mvpDataUtils.populateCoreMeasureFor([{ mvpId: 'G0053' }] as MVP[], measures);

                expect(measures[0]).toEqual({ measureId: '039', category: 'quality', isCoreMeasure: false, coreMeasureFor: [] });
                expect(warningSpy).not.toHaveBeenCalled();
            });
        });

        describe('createMVPDataFile', () => {
            const mockFiles = (mvpData: any[], measuresData: any[]) => {
                jest.spyOn(fse, 'readFileSync').mockImplementation(() => JSON.stringify(mvpData));
                require('../index').getMeasuresData.mockReturnValue(measuresData);
            };

            it('populates coreMeasureFor and leaves coreQualityMeasureIds out of the enriched MVPs for 2027+', () => {
                mockFiles(_.cloneDeep(coreMvpData), coreMeasuresData());

                const result = mvpDataUtils.createMVPDataFile(2027);

                result.forEach(mvp => expect(mvp).not.toHaveProperty('coreQualityMeasureIds'));
                expect((result[1] as any).qualityMeasures.map((m: any) => [m.measureId, m.coreMeasureFor])).toEqual([
                    ['039', ['G0053', 'M0001']],
                    ['130', ['M0001']],
                ]);
                const writtenMeasures = JSON.parse(fseWriteSpy.mock.calls.find(call => (call[0] as string).includes('measures-data.json'))![1] as string);
                expect(writtenMeasures[0].coreMeasureFor).toEqual(['G0053', 'M0001']);
            });

            it('does not touch Core Measure fields before 2027', () => {
                const measures = coreMeasuresData();
                mockFiles(_.cloneDeep(coreMvpData), measures);

                mvpDataUtils.createMVPDataFile(2026);

                expect(measures[0].coreMeasureFor).toEqual(['G0099']);
                expect(warningSpy).not.toHaveBeenCalled();
            });
        });
    });
});
