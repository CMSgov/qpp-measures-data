import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { vol } from "memfs";

import * as Lib from '../measures/lib/measures-lib';
import * as logger from '../logger';

jest.mock('fs-extra');

import { parseMvpData } from './parse-mvp-data-script';

const testMeasuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/mvps/measures-data-test.json'), 'utf8')
);
const testRawMvpJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/mvps/mvp-raw-test.json'), 'utf8')
);
const testRawMvpBadIdJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/mvps/mvp-raw-test-bad-id.json'), 'utf8')
);
const testmvpJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'test/mvps/mvp-test.json'), 'utf8')
);

describe('parseMvpData', () => {
    let writeFileSpy: jest.Spied<typeof Lib.writeToFile>;
    beforeEach(() => {
        writeFileSpy = jest.spyOn(Lib, 'writeToFile').mockImplementation(jest.fn());
    });

    afterEach(() => {
        vol.reset();
        jest.restoreAllMocks();
    });
    
    it('successfully adds and updates mvps from the raw json.', () => {
        vol.fromNestedJSON({
            'measures/2024': {
                'measures-data.json': JSON.stringify(testMeasuresJson),
            },
            'mvp/2024': {
                'mvp-raw.json': JSON.stringify(testRawMvpJson),
                'mvp.json': JSON.stringify(testmvpJson),
            },
        });
        parseMvpData('2024');
        expect(writeFileSpy).toHaveBeenCalledWith(
            testmvpJson,
            'mvp/2024/mvp.json',
        )
    });

    it(`logs warning if measureId doesn't exists.`, () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
        vol.fromNestedJSON({
            'measures/2024': {
                'measures-data.json': JSON.stringify(testMeasuresJson),
            },
            'mvp/2024': {
                'mvp-raw.json': JSON.stringify(testRawMvpBadIdJson),
                'mvp.json': JSON.stringify(testmvpJson),
            },
        });
        parseMvpData('2024');
        expect(logSpy).toHaveBeenCalledWith('Measure not found for measureId fakeId for mvpId M1368');
    });

    describe('Core Quality', () => {
        const coreMeasures = [
            { measureId: '039', category: 'quality', submissionMethods: ['claims'] },
            { measureId: '130', category: 'quality', submissionMethods: ['registry'] },
            { measureId: '484', category: 'quality', submissionMethods: ['administrativeClaims'] },
            { measureId: 'IA_1', category: 'ia' },
        ];
        const row = (mvpId: string, category: string, measureId: string) => ({
            'MVP Title': `Title ${mvpId}`,
            'MVP ID': mvpId,
            'MVP Description': 'Description',
            'Most Applicable Medical Specialties': 'Specialty A; Specialty B',
            'Clinical Topic': 'Topic',
            'MVP Reporting Category': category,
            'Measure Id': measureId,
        });
        const rawRows = [
            row('G0053', 'Core Quality', '039'),
            row('G0053', 'Quality', '039'),
            row('G0053', 'Quality', '130'),
            row('G0053', 'Core Quality', '484'),
            row('G0053', 'Core Quality', 'IA_1'),
            row('G0054', 'Quality', '130'),
        ];
        let warningSpy: jest.Spied<typeof logger.warning>;

        const runParse = (performanceYear: string) => {
            vol.fromNestedJSON({
                [`measures/${performanceYear}`]: { 'measures-data.json': JSON.stringify(coreMeasures) },
                [`mvp/${performanceYear}`]: { 'mvp-raw.json': JSON.stringify(rawRows) },
            });
            parseMvpData(performanceYear);
            return writeFileSpy.mock.calls[0][0] as any[];
        };

        beforeEach(() => {
            warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
        });

        it('adds Core Quality measures to coreQualityMeasureIds and to the quality arrays for 2027+', () => {
            const [g0053, g0054] = runParse('2027');

            expect(Object.keys(g0053).slice(6, 8)).toEqual(['qualityMeasureIds', 'coreQualityMeasureIds']);
            expect(g0053.qualityMeasureIds).toEqual(['039', '130']);
            expect(g0053.administrativeClaimsMeasureIds).toEqual(['484']);
            expect(g0053.coreQualityMeasureIds).toEqual(['039', '484']);
            expect(g0053.iaMeasureIds).toEqual(['IA_1']);
            expect(g0053.hasOutcomeAdminClaims).toBe(true);
            expect(g0054.coreQualityMeasureIds).toEqual([]);
        });

        it('warns about non-quality Core Quality rows and MVPs without Core Quality measures for 2027+', () => {
            runParse('2027');

            expect(warningSpy).toHaveBeenCalledTimes(2);
            expect(warningSpy).toHaveBeenCalledWith(`'G0053': measure 'IA_1' is marked 'Core Quality' but is not a quality measure.`);
            expect(warningSpy).toHaveBeenCalledWith(`'G0054' has no 'Core Quality' measures.`);
        });

        it('ignores Core Quality rows and does not add coreQualityMeasureIds before 2027', () => {
            const [g0053, g0054] = runParse('2026');

            expect(g0053).not.toHaveProperty('coreQualityMeasureIds');
            expect(g0054).not.toHaveProperty('coreQualityMeasureIds');
            expect(g0053.qualityMeasureIds).toEqual(['039', '130']);
            expect(g0053.administrativeClaimsMeasureIds).toEqual([]);
            expect(g0053.iaMeasureIds).toEqual(['IA_1']);
            expect(warningSpy).toHaveBeenCalledTimes(3);
            expect(warningSpy).toHaveBeenCalledWith(`'G0053': 'Core Quality' is not a valid MVP Reporting Category before PY2027 (measure '039').`);
        });
    });
});
