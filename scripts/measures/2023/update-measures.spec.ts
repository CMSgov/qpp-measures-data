import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import mockFS from 'mock-fs';

import * as UpdateMeasuresUtil from './update-measures-util';
import * as logger from '../../logger'
import { updateMeasures } from './update-measures';

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'measures/2023/measures-data.json'), 'utf8')
);

describe('update-measures', () => {
    let volatileMeasures: any;
    let updateFileSpy: jest.SpyInstance, writeFileSpy: jest.SpyInstance;
    let logSpy: any;

    beforeEach(() => {
        volatileMeasures = [...measuresJson];

        updateFileSpy = jest.spyOn(UpdateMeasuresUtil, 'updateMeasuresWithChangeFile').mockImplementation(jest.fn());
        writeFileSpy = jest.spyOn(UpdateMeasuresUtil, 'writeToFile').mockImplementation(jest.fn());
        logSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
    });

    afterEach(() => {
        mockFS.restore();
        jest.restoreAllMocks();
    });

    it('finds the new files and attempts to update the measures data', () => {
        mockFS({
            'measures/2023': {
                'measures-data.json': JSON.stringify(volatileMeasures),
            },
            'updates/measures/2023': {
                'changes.meta.json': '["test1.csv", "test2.csv"]',
                'test1.csv': "fakedata",
                'test2.csv': "fakedata",
                'test3.csv': "fakedata",
                'test4.csv': "fakedata",
            },
        });

        updateMeasures('2023');

        expect(updateFileSpy).toBeCalledTimes(2);
        expect(writeFileSpy).toBeCalledTimes(1);
        expect(logSpy).not.toBeCalled();
    });

    it('does nothing and logs if no new files are found', () => {
        mockFS({
            'measures/2023': {
                'measures-data.json': JSON.stringify(volatileMeasures),
            },
            'updates/measures/2023': {
                'changes.meta.json': '["test1.csv", "test2.csv"]',
                'test1.csv': "fakedata",
                'test2.csv': "fakedata",
            },
        });

        updateMeasures('2023');

        expect(updateFileSpy).not.toBeCalled();
        expect(writeFileSpy).not.toBeCalled();
        expect(logSpy).toBeCalledWith('No new change files found.');
    });

    it('handles an empty change file', () => {
        mockFS({
            'measures/2023': {
                'measures-data.json': JSON.stringify(volatileMeasures),
            },
            'updates/measures/2023': {
                'changes.meta.json': '[]',
            },
        });

        updateMeasures('2023');

        expect(updateFileSpy).not.toBeCalled();
        expect(writeFileSpy).not.toBeCalled();
        expect(logSpy).toBeCalledWith('No new change files found.');
    });
});