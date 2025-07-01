import fs from 'fs-extra';
import { updateAllowedPrograms } from './manage-allowed-programs';
import { Category, Programs } from '../../util/interfaces/measure';
import { Measure } from '../../util/interfaces';
import * as logger from '../../scripts/logger';

jest.mock('app-root-path', () => ({
    toString: () => '/mock-root'
}));

describe('updateAllowedPrograms', () => {
    const mockMeasures: Measure[] = [
        { category: Category.IA, measureId: 'IA_1', allowedPrograms: [Programs.MIPS] },
        { category: Category.PI, measureId: 'PI_1', allowedPrograms: [Programs.MIPS, Programs.APP1] },
        { category: Category.PI, measureId: 'PI_2', allowedPrograms: [] },
        { category: Category.COST, measureId: 'COST_1' }
    ] as unknown as Measure[];

    const mockProgramNames = {
        mips: "mips",
        cpcPlus: "cpcPlus",
        pcf: "pcf",
        app1: "app1",
        appPlus: "appPlus",
    };
    
    let fsWriteSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
            if ((filePath as string).includes('measures-data.json')) {
                return JSON.stringify(mockMeasures);
            }
            if ((filePath as string).includes('program-names.json')) {
                return JSON.stringify(mockProgramNames);
            }
            return '';
        });
        fsWriteSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(logger, 'info').mockImplementation(() => { });
        consoleErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => { });
    });

    it('adds a program to allowedPrograms if not present and sorts', () => {
        updateAllowedPrograms('2025', 'pi', Programs.MIPS, 'add');
        expect(fsWriteSpy).toHaveBeenCalledWith(
            expect.any(String),
            JSON.stringify([
                { category: Category.IA, measureId: 'IA_1', allowedPrograms: [Programs.MIPS] },
                { category: Category.PI, measureId: 'PI_1', allowedPrograms: [Programs.MIPS, Programs.APP1] },
                { category: Category.PI, measureId: 'PI_2', allowedPrograms: [Programs.MIPS] },
                { category: Category.COST, measureId: 'COST_1' }
            ], null, 2)
        );
        expect(consoleLogSpy.mock.calls[0][0]).toEqual('Added program "mips" to measure "PI_2".');
        expect(consoleLogSpy.mock.calls[1][0]).toEqual('1 measures updated successfully.');
    });

    it('does not add a program if already present', () => {
        updateAllowedPrograms('2025', 'ia', Programs.MIPS, 'add');
        expect(fsWriteSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith('No measures required updates.');
    });

    it('removes a program from allowedPrograms if present', () => {
        updateAllowedPrograms('2025', 'pi', Programs.APP1, 'remove');
        expect(fsWriteSpy).toHaveBeenCalledWith(
            expect.any(String),
            JSON.stringify([
                { category: Category.IA, measureId: 'IA_1', allowedPrograms: [Programs.MIPS] },
                { category: Category.PI, measureId: 'PI_1', allowedPrograms: [Programs.MIPS] },
                { category: Category.PI, measureId: 'PI_2', allowedPrograms: []},
                { category: Category.COST, measureId: 'COST_1' }
            ], null, 2)
        );
        expect(consoleLogSpy.mock.calls[0][0]).toEqual('Removed program "app1" from measure "PI_1".');
        expect(consoleLogSpy.mock.calls[1][0]).toEqual('1 measures updated successfully.');
    });

    it('does nothing if removing a program that is not present', () => {
        updateAllowedPrograms('2025', 'pi', Programs.PCF, 'remove');
        expect(fsWriteSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith('No measures required updates.');
    });

    it('logs error if exception is thrown', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => { throw new Error('fail'); });
        updateAllowedPrograms('2025', 'pi', Programs.PCF, 'remove');
        expect(fsWriteSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update measures: fail');
    });

    it('sorts allowedPrograms using programNames order', () => {
        updateAllowedPrograms('2025', 'pi', Programs.PCF, 'add');
        expect(fsWriteSpy).toHaveBeenCalledWith(
            expect.any(String),
            JSON.stringify([
                { category: Category.IA, measureId: 'IA_1', allowedPrograms: [Programs.MIPS] },
                { category: Category.PI, measureId: 'PI_1', allowedPrograms: [Programs.MIPS, Programs.PCF, Programs.APP1] },
                { category: Category.PI, measureId: 'PI_2', allowedPrograms: [Programs.PCF] },
                { category: Category.COST, measureId: 'COST_1' }
            ], null, 2)
        );
    });
});
