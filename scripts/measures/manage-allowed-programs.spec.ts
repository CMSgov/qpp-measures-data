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
        G0053: "G0053",
        M0001: "M0001"
    };

    const mockMvpCsvContent = `MVP Title,MVP ID,MVP Description,Most Applicable Medical Specialties,Clinical Topic,MVP Reporting Category,Measure Id
Test MVP,G0053,Test Description,Test Specialties,Test Topic,Improvement,IA_1
Test MVP,G0053,Test Description,Test Specialties,Test Topic,Quality,039
Test MVP,M0001,Another MVP,Test Specialties,Test Topic,Improvement,IA_BE_1`;
    
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
            if ((filePath as string).includes('mvp.csv')) {
                return mockMvpCsvContent;
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

    describe('MVP program handling', () => {
        const mockMeasuresWithMVP: Measure[] = [
            { category: Category.IA, measureId: 'IA_1', allowedPrograms: [Programs.MIPS, 'G0053' as Programs] },
            { category: Category.IA, measureId: 'IA_BE_1', allowedPrograms: [Programs.MIPS, 'M0001' as Programs] },
            { category: Category.PI, measureId: 'PI_1', allowedPrograms: [Programs.MIPS] },
            { category: Category.QUALITY, measureId: '039', allowedPrograms: [Programs.MIPS, 'G0053' as Programs] }
        ] as unknown as Measure[];

        beforeEach(() => {
            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if ((filePath as string).includes('measures-data.json')) {
                    return JSON.stringify(mockMeasuresWithMVP);
                }
                if ((filePath as string).includes('program-names.json')) {
                    return JSON.stringify(mockProgramNames);
                }
                if ((filePath as string).includes('mvp.csv')) {
                    return mockMvpCsvContent;
                }
                return '';
            });
        });

        it('removes MVP program and updates CSV when removing from measures', () => {
            updateAllowedPrograms('2025', 'ia', 'G0053' as Programs, 'remove');
            
            // Should remove G0053 from measure IA_1
            expect(fsWriteSpy).toHaveBeenCalledTimes(2); // measures-data.json + mvp.csv
            
            // Check measures-data.json update
            const measuresCall = fsWriteSpy.mock.calls.find(call => call[0].includes('measures-data.json'));
            expect(measuresCall).toBeDefined();
            
            const updatedMeasures = JSON.parse(measuresCall[1]);
            const ia1Measure = updatedMeasures.find((m: Measure) => m.measureId === 'IA_1');
            expect(ia1Measure.allowedPrograms).not.toContain('G0053');
            expect(ia1Measure.allowedPrograms).toContain(Programs.MIPS);
            
            // Check CSV update
            const csvCall = fsWriteSpy.mock.calls.find(call => call[0].includes('mvp.csv'));
            expect(csvCall).toBeDefined();
            
            const updatedCsvContent = csvCall[1];
            expect(updatedCsvContent).not.toContain('Test MVP,G0053,Test Description,Test Specialties,Test Topic,Improvement,IA_1');
            expect(updatedCsvContent).toContain('Test MVP,G0053,Test Description,Test Specialties,Test Topic,Quality,039'); // Quality measures should remain
            
            // Check logging
            expect(consoleLogSpy).toHaveBeenCalledWith('Removed program "G0053" from measure "IA_1".');
            expect(consoleLogSpy).toHaveBeenCalledWith('  - Removed measure "IA_1" from MVP "G0053" (Improvement) in CSV');
            expect(consoleLogSpy).toHaveBeenCalledWith('Removed 1 measure associations from MVP "G0053" in mvp.csv');
        });

        it('does not modify CSV when removing non-MVP program', () => {
            updateAllowedPrograms('2025', 'ia', Programs.MIPS, 'remove');
            
            // Should only update measures-data.json, not CSV
            expect(fsWriteSpy).toHaveBeenCalledTimes(1);
            
            const measuresCall = fsWriteSpy.mock.calls[0];
            expect(measuresCall[0]).toContain('measures-data.json');
        });

        it('handles CSV modification errors gracefully', () => {
            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if ((filePath as string).includes('mvp.csv')) {
                    throw new Error('CSV read error');
                }
                if ((filePath as string).includes('measures-data.json')) {
                    return JSON.stringify(mockMeasuresWithMVP);
                }
                if ((filePath as string).includes('program-names.json')) {
                    return JSON.stringify(mockProgramNames);
                }
                return '';
            });
            
            updateAllowedPrograms('2025', 'ia', 'G0053' as Programs, 'remove');
            
            // Should still update measures-data.json despite CSV error
            expect(fsWriteSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update MVP CSV data: CSV read error');
        });

        it('skips CSV modification when no measures are affected', () => {
            updateAllowedPrograms('2025', 'pi', 'G0053' as Programs, 'remove');
            
            // Should not modify any files since no PI measures have G0053
            expect(fsWriteSpy).toHaveBeenCalledTimes(0); // no files should be written
            expect(consoleLogSpy).toHaveBeenCalledWith('No measures required updates.');
        });

        it('handles empty CSV content', () => {
            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if ((filePath as string).includes('mvp.csv')) {
                    return '';
                }
                if ((filePath as string).includes('measures-data.json')) {
                    return JSON.stringify(mockMeasuresWithMVP);
                }
                if ((filePath as string).includes('program-names.json')) {
                    return JSON.stringify(mockProgramNames);
                }
                return '';
            });
            
            updateAllowedPrograms('2025', 'ia', 'G0053' as Programs, 'remove');
            
            // Should still remove from measures but log that CSV is empty
            expect(consoleLogSpy).toHaveBeenCalledWith('Removed program "G0053" from measure "IA_1".');
            expect(consoleLogSpy).toHaveBeenCalledWith('MVP CSV file is empty');
        });

        it('correctly maps different categories to MVP reporting categories', () => {
            // Test quality category
            const mockQualityMeasures: Measure[] = [
                { category: Category.QUALITY, measureId: '039', allowedPrograms: [Programs.MIPS, 'G0053' as Programs] }
            ] as unknown as Measure[];
            
            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if ((filePath as string).includes('measures-data.json')) {
                    return JSON.stringify(mockQualityMeasures);
                }
                if ((filePath as string).includes('program-names.json')) {
                    return JSON.stringify(mockProgramNames);
                }
                if ((filePath as string).includes('mvp.csv')) {
                    return mockMvpCsvContent;
                }
                return '';
            });
            
            updateAllowedPrograms('2025', 'quality', 'G0053' as Programs, 'remove');
            
            // Check that it looked for Quality category in CSV
            const csvCall = fsWriteSpy.mock.calls.find(call => call[0].includes('mvp.csv'));
            expect(csvCall).toBeDefined();
            expect(consoleLogSpy).toHaveBeenCalledWith('  - Removed measure "039" from MVP "G0053" (Quality) in CSV');
        });

        it('handles malformed CSV lines', () => {
            const malformedCsvContent = `MVP Title,MVP ID,MVP Description,Most Applicable Medical Specialties,Clinical Topic,MVP Reporting Category,Measure Id
Incomplete line
Test MVP,G0053,Test Description,Test Specialties,Test Topic,Improvement,IA_1
`;
            
            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
                if ((filePath as string).includes('mvp.csv')) {
                    return malformedCsvContent;
                }
                if ((filePath as string).includes('measures-data.json')) {
                    return JSON.stringify(mockMeasuresWithMVP);
                }
                if ((filePath as string).includes('program-names.json')) {
                    return JSON.stringify(mockProgramNames);
                }
                return '';
            });
            
            updateAllowedPrograms('2025', 'ia', 'G0053' as Programs, 'remove');
            
            // Should still work despite malformed line
            const csvCall = fsWriteSpy.mock.calls.find(call => call[0].includes('mvp.csv'));
            expect(csvCall).toBeDefined();
            expect(consoleLogSpy).toHaveBeenCalledWith('  - Removed measure "IA_1" from MVP "G0053" (Improvement) in CSV');
        });
    });
});
