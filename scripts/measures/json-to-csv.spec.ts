import fs from 'fs';
import papa from 'papaparse';

jest.mock('app-root-path', () => ({
    toString: () => '/mock-root'
}));

import * as jsonToCsv from './json-to-csv';
import { Category, Measure } from '../../util/interfaces/measure';

describe('json-to-csv', () => {
    const mockMeasures = [
        { category: 'ia', measureId: 'IA_1', foo: 1 },
        { category: 'pi', measureId: 'PI_1', bar: 2 },
        { category: 'cost', measureId: 'COST_1', baz: 3 },
        { category: 'quality', measureId: 'Q1', isRegistryMeasure: false, strata: ['x'] },
        { category: 'quality', measureId: 'Q2', isRegistryMeasure: true, metricType: 'notcahps', strata: ['y'] },
        { category: 'quality', measureId: 'Q3', isRegistryMeasure: true, metricType: 'cahps', strata: ['z'] },
        { category: 'quality', measureId: 'CAHPS_1', isRegistryMeasure: false, strata: ['w'] }
    ] as unknown as Measure[];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(mockMeasures));
        jest.spyOn(fs, 'writeFile').mockImplementation((_file, _data, cb) => cb && cb(null));
        jest.spyOn(papa, 'unparse').mockImplementation((data, opts) => JSON.stringify({ data, opts }));
    });

    describe('getAllQcdrOrQualityMeasures', () => {
        it('returns only registry quality measures for qcdr (excluding cahps/costScore)', () => {
            const result = jsonToCsv.getAllQcdrOrQualityMeasures(mockMeasures, Category.QCDR);
            expect(result).toEqual([
                expect.objectContaining({ measureId: 'Q2', isRegistryMeasure: true })
            ]);
        });

        it('returns only non-registry, non-CAHPS_ quality measures for quality', () => {
            const result = jsonToCsv.getAllQcdrOrQualityMeasures(mockMeasures, Category.QUALITY);
            expect(result).toEqual([
                expect.objectContaining({ measureId: 'Q1', isRegistryMeasure: false })
            ]);
        });

        it('returns empty array if no matches', () => {
            const result = jsonToCsv.getAllQcdrOrQualityMeasures([
                { category: Category.QUALITY, isRegistryMeasure: false, measureId: 'Q1' } as Measure
            ], Category.QCDR);
            expect(result).toEqual([]);
        });
    });

    describe('createJson', () => {
        it('errors and returns for invalid category', () => {
            const errorSpy = jest.spyOn(require('../logger'), 'error').mockImplementation();
            jsonToCsv.createJson('2025', 'invalid' as Category);
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('category invalid is not valid')
            );
            errorSpy.mockRestore();
        });

        it('writes IA/PI/COST measures to JSON and CSV', () => {
            const fsWriteSpy = jest.spyOn(fs, 'writeFile').mockImplementation();
            ['ia', 'pi', 'cost'].forEach(cat => {
                jsonToCsv.createJson('2025', cat as Category);
                expect(fsWriteSpy).toHaveBeenCalledWith(
                    expect.stringContaining(`${cat}-measures.json`),
                    expect.any(String),
                    expect.any(Function)
                );
                expect(fsWriteSpy).toHaveBeenCalledWith(
                    expect.stringContaining(`${cat}-measures.csv`),
                    expect.any(String),
                    expect.any(Function)
                );
            });
        });

        it('writes QCDR/QUALITY measures to JSON and CSV with strata as an array', () => {
            const fswriteSpy = jest.spyOn(fs, 'writeFile').mockImplementation();
            ['qcdr', 'quality'].forEach(category => {
                jsonToCsv.createJson('2025', category as Category);
                // Should write JSON
                expect(fswriteSpy).toHaveBeenCalledWith(
                    expect.stringContaining(`${category}-measures.json`),
                    expect.any(String),
                    expect.any(Function)
                );
                // Should write CSV with strata as an array
                const csvCall = fswriteSpy.mock.calls[0];
                const csvData = JSON.parse(csvCall[1] as string);
                expect(Array.isArray(csvData[0].strata)).toBe(true);
            });
        });

        it('handles empty measuresJson gracefully', () => {
            (fs.readFileSync as jest.Mock).mockImplementation(() => JSON.stringify([]));
            expect(() => jsonToCsv.createJson('2025', 'ia' as Category)).not.toThrow();
            expect(fs.writeFile).toHaveBeenCalled();
        });
    });
});
