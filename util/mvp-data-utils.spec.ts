import fse from 'fs-extra';
import _ from 'lodash';

import * as mvpDataUtils from './mvp-data-utils';
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
    
    let fseReadSpy: jest.SpyInstance;
    let fseWriteSpy: jest.SpyInstance;

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
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
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
});
