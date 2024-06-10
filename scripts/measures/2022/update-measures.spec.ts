import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { NestedDirectoryJSON, vol } from "memfs";

import * as UpdateMeasuresUtil from './update-measures-util';
import * as logger from '../../logger'
import { updateMeasures } from './update-measures';

jest.mock('fs-extra');

const performanceYear = 2022;

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', `measures/${performanceYear}/measures-data.json`), 'utf8')
);

describe('update-measures', () => {
    let volatileMeasures: any;
    let updateFileSpy: jest.SpyInstance, writeFileSpy: jest.SpyInstance;
    let logSpy: any, warningSpy: any;
    let volFileStructure: NestedDirectoryJSON;

    beforeEach(() => {
        volatileMeasures = [...measuresJson];

        updateFileSpy = jest.spyOn(UpdateMeasuresUtil, 'updateMeasuresWithChangeFile').mockImplementation(jest.fn());
        writeFileSpy = jest.spyOn(UpdateMeasuresUtil, 'writeToFile').mockImplementation(jest.fn());
        logSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
        warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
        
        volFileStructure = {};
        volFileStructure[`measures/${performanceYear}`] = {
            'measures-data.json': JSON.stringify(volatileMeasures),
        };
    });

    afterEach(() => {
        vol.reset();
        jest.restoreAllMocks();
    });

    it('finds the new files and attempts to update the measures data', () => {
        volFileStructure[`updates/measures/${performanceYear}`] = {
            'changes.meta.json': '["test1.csv", "test2.csv"]',
            'test1.csv': "fakedata",
            'test2.csv': "fakedata",
            'test3.csv': "fakedata",
            'test4.csv': "fakedata",
        };
        vol.fromNestedJSON(volFileStructure);

        updateMeasures(`${performanceYear}`);

        expect(updateFileSpy).toBeCalledTimes(2);
        expect(writeFileSpy).toBeCalledTimes(1);
        expect(logSpy).not.toBeCalled();
    });

    it('does nothing and logs if no new files are found', () => {
        volFileStructure[`updates/measures/${performanceYear}`] = {
            'changes.meta.json': '["test1.csv", "test2.csv"]',
            'test1.csv': "fakedata",
            'test2.csv': "fakedata",
        };
        vol.fromNestedJSON(volFileStructure);

        updateMeasures(`${performanceYear}`);

        expect(updateFileSpy).not.toBeCalled();
        expect(writeFileSpy).not.toBeCalled();
        expect(warningSpy).toBeCalledWith('No new change files found.');
    });

    it('handles an empty change file', () => {
        volFileStructure[`updates/measures/${performanceYear}`] = {
            'changes.meta.json': '[]',
        };
        vol.fromNestedJSON(volFileStructure);

        updateMeasures(`${performanceYear}`);

        expect(updateFileSpy).not.toBeCalled();
        expect(writeFileSpy).not.toBeCalled();
        expect(warningSpy).toBeCalledWith('No new change files found.');
    });
});