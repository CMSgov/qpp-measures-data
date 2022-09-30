const fs = require('fs');
import * as updateMeasures from './update-measures';

// jest.mock('fs');

describe('#update-measures', () => {
    describe('updateMeasures', () => {
        beforeEach(() => {
            fs.readdirSync = jest.fn();
            fs.readdirSync.mockReturnValue(['file1.csv', 'file2.csv', 'changes.meta.json']);
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should attempt no changes when there are no new change files', () => {
            
        });
    });

    describe('updateMeasuresWithChangeFile', () => {

    });
    
    describe('isOutcomeHighPriority', () => {

    });
    
    describe('updateChangeLog', () => {

    });
    
    describe('writeToFile', () => {

    });
    
    describe('deleteMeasure', () => {

    });
    
    describe('updateBenchmarksMetaData', () => {

    });
    
    describe('updateMeasure', () => {

    });
    
    describe('isNewMeasure', () => {

    });
});