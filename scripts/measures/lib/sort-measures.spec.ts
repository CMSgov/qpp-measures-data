import * as fs from 'fs';
import * as sortMeasuresModule from './sort-measures';
import { Measure } from '../../../util/interfaces/measure';

jest.mock('fs');
jest.mock('app-root-path', () => ({
    toString: () => '/mock-root'
}));
jest.mock('./measures-lib', () => ({
    writeToFile: jest.fn()
}));

const mockWriteToFile = require('./measures-lib').writeToFile;

describe('sortMeasures', () => {
    const performanceYear = '2025';
    const measuresPath = `measures/${performanceYear}/measures-data.json`;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should sort measures by measureId within each category using natural sort', () => {
        const input: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_11' } as Measure,
            { category: 'ia', measureId: 'IA_AHE_2' } as Measure,
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure,
            { category: 'pi', measureId: 'PI_3' } as Measure,
            { category: 'pi', measureId: 'PI_10' } as Measure,
            { category: 'pi', measureId: 'PI_2' } as Measure
        ];

        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));

        sortMeasuresModule.sortMeasures(performanceYear);

        const expected: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure,
            { category: 'ia', measureId: 'IA_AHE_2' } as Measure,
            { category: 'ia', measureId: 'IA_AHE_11' } as Measure,
            { category: 'pi', measureId: 'PI_2' } as Measure,
            { category: 'pi', measureId: 'PI_3' } as Measure,
            { category: 'pi', measureId: 'PI_10' } as Measure
        ];

        expect(mockWriteToFile).toHaveBeenCalledWith(expected, measuresPath);
    });

    it('should handle empty measures array', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        sortMeasuresModule.sortMeasures(performanceYear);

        expect(mockWriteToFile).toHaveBeenCalledWith([], measuresPath);
    });

    it('should handle measures with only one category', () => {
        const input: Measure[] = [
            { category: 'cost', measureId: 'COST_3' } as Measure,
            { category: 'cost', measureId: 'COST_1' } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));

        sortMeasuresModule.sortMeasures(performanceYear);

        const expected: Measure[] = [
            { category: 'cost', measureId: 'COST_1' } as Measure,
            { category: 'cost', measureId: 'COST_3' } as Measure
        ];

        expect(mockWriteToFile).toHaveBeenCalledWith(expected, measuresPath);
    });

    it('should handle measures with duplicate measureIds', () => {
        const input: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure,
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));

        sortMeasuresModule.sortMeasures(performanceYear);

        // Both should be present, order doesn't matter for duplicates
        expect(mockWriteToFile).toHaveBeenCalledWith(input, measuresPath);
    });

    it('should log to console after sorting', () => {
        const input: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));
        const logSpy = jest.spyOn(console, 'log').mockImplementation();

        sortMeasuresModule.sortMeasures(performanceYear);

        expect(logSpy).toHaveBeenCalledWith('Measures organized by category and measureId.');
        logSpy.mockRestore();
    });
});