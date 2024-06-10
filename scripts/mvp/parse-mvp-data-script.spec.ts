import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { vol } from "memfs";

import * as Lib from '../measures/lib/measures-lib';

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
    let writeFileSpy: jest.SpyInstance;
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
        expect(writeFileSpy).toBeCalledWith(
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
        expect(logSpy).toBeCalledWith('Measure not found for measureId fakeId for mvpId M1368');
    });
});
