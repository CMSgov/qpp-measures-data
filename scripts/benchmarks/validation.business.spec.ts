import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import mockFS from 'mock-fs';

import * as logger from '../logger'

import { benchmarkBusinessValidation } from './validation.business';

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'measures/2023/measures-data.json'), 'utf8')
);

const benchmarksJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'staging/2023/benchmarks/json/benchmarks.json'), 'utf8')
);

const benchmarksCahpsJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'staging/2023/benchmarks/json/benchmarks_cahps.json'), 'utf8')
);

describe('validation.business', () => {
    let volatileMeasures: any;
    let logSpy: any, warningSpy: any;

    beforeEach(() => {
        volatileMeasures = [...measuresJson];

        logSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
        warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());
    });

    afterEach(() => {
        mockFS.restore();
        jest.restoreAllMocks();
    });

    it('validates benchmarks data', () => {
        mockFS({
            'measures/2023': {
                'measures-data.json': JSON.stringify(volatileMeasures),
            },
            'staging/2023/benchmarks/json': {
                'benchmarks.json': JSON.stringify(benchmarksJson),
                'benchmarks_cahps.json': JSON.stringify(benchmarksCahpsJson)
            }
        });

        const result = benchmarkBusinessValidation(2023);

        expect(logSpy).not.toBeCalled();
    });
});