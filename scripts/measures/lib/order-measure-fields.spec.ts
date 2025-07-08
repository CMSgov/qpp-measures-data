import * as fs from 'fs';
import * as orderMeasureFieldsModule from './order-measure-fields';
import { Measure } from '../../../util/interfaces/measure';

jest.mock('fs');
jest.mock('app-root-path', () => ({
    toString: () => '/mock-root'
}));
jest.mock('./measures-lib', () => ({
    orderFields: jest.fn(measure => ({ ...measure, ordered: true })),
    writeToFile: jest.fn()
}));

const mockOrderFields = require('./measures-lib').orderFields;
const mockWriteToFile = require('./measures-lib').writeToFile;

describe('orderMeasuresFields', () => {
    const performanceYear = '2025';
    const measuresPath = `measures/${performanceYear}/measures-data.json`;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call orderFields for each measure and write the result', () => {
        const input: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_1', allowedPrograms: ['mips'] } as Measure,
            { category: 'pi', measureId: 'PI_1', isBonus: false } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));

        orderMeasureFieldsModule.orderMeasuresFields(performanceYear);

        expect(mockOrderFields).toHaveBeenCalledTimes(2);
        expect(mockOrderFields).toHaveBeenNthCalledWith(1, input[0]);
        expect(mockOrderFields).toHaveBeenNthCalledWith(2, input[1]);
        expect(mockWriteToFile).toHaveBeenCalledWith(
            [
                { ...input[0], ordered: true },
                { ...input[1], ordered: true }
            ],
            measuresPath
        );
    });

    it('should handle empty measures array', () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

        orderMeasureFieldsModule.orderMeasuresFields(performanceYear);

        expect(mockOrderFields).not.toHaveBeenCalled();
        expect(mockWriteToFile).toHaveBeenCalledWith([], measuresPath);
    });

    it('should not throw if a measure is missing fields', () => {
        const input: Measure[] = [
            {} as Measure,
            { measureId: 'M1' } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));

        expect(() => orderMeasureFieldsModule.orderMeasuresFields(performanceYear)).not.toThrow();
        expect(mockOrderFields).toHaveBeenCalledTimes(2);
        expect(mockWriteToFile).toHaveBeenCalledWith(
            [{ ordered: true }, { measureId: 'M1', ordered: true }],
            measuresPath
        );
    });

    it('should log to console after ordering', () => {
        const input: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));
        const logSpy = jest.spyOn(console, 'log').mockImplementation();

        orderMeasureFieldsModule.orderMeasuresFields(performanceYear);

        expect(logSpy).toHaveBeenCalledWith('Measures fields sorted.');
        logSpy.mockRestore();
    });

    it('should handle measures with duplicate objects', () => {
        const input: Measure[] = [
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure,
            { category: 'ia', measureId: 'IA_AHE_1' } as Measure
        ];
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(input));

        orderMeasureFieldsModule.orderMeasuresFields(performanceYear);

        expect(mockOrderFields).toHaveBeenCalledTimes(2);
        expect(mockWriteToFile).toHaveBeenCalledWith(
            [
                { category: 'ia', measureId: 'IA_AHE_1', ordered: true },
                { category: 'ia', measureId: 'IA_AHE_1', ordered: true }
            ],
            measuresPath
        );
    });
});