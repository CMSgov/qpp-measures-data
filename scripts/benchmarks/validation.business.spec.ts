import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import mockFS from 'mock-fs';

import * as logger from '../logger'

import { benchmarkBusinessValidation } from './validation.business';
import { BaseMeasure, Benchmark, BenchmarkList, MeasureList } from './benchmarks.types';

const measuresJson: BaseMeasure[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'measures/2023/measures-data.json'), 'utf8')
);

const benchmarksJson: Benchmark[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'staging/2023/benchmarks/json/benchmarks.json'), 'utf8')
);

const benchmarksCahpsJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', 'staging/2023/benchmarks/json/benchmarks_cahps.json'), 'utf8')
);


describe('validation.business', () => {
    let volatileMeasures: any[];
    let volatileBenchmarks: any[];
    let volatileBenchmarksCahps: any[];
    let logSpy: any, warningSpy: any;

    const mockFileSystemResponse = (measures: any[], benchmarks: any[], benchmarksCahps: any[]) => {
        mockFS({
            'measures/2023': {
                'measures-data.json': JSON.stringify(measures),
            },
            'staging/2023/benchmarks/json': {
                'benchmarks.json': JSON.stringify(benchmarks),
                'benchmarks_cahps.json': JSON.stringify(benchmarksCahps)
            }
        });
    };

    const testErrorsThrown = (message: string, changesToMerge: any) => {
        try {
            const modifiedBenchmarks = _.merge([], _.cloneDeep(volatileBenchmarks), changesToMerge)

            mockFileSystemResponse(
                volatileMeasures, 
                modifiedBenchmarks,
                volatileBenchmarksCahps
            );
            benchmarkBusinessValidation(2023);

            expect('').toBe('No error thrown when one expected');
        } catch (errors: any) {
            expect(_.isArray(errors)).toBe(true);
            expect(errors.length).toBe(1);
            expect(errors[0].message).toContain(message);
        }
    }

    beforeEach(() => {
        volatileMeasures = [...measuresJson] ;
        volatileBenchmarks = [...benchmarksJson];
        volatileBenchmarksCahps = [...benchmarksCahpsJson];
        
        logSpy = jest.spyOn(logger, 'info').mockImplementation(jest.fn());
        warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());

        mockFileSystemResponse(volatileMeasures, volatileBenchmarks, volatileBenchmarksCahps);
    });

    afterEach(() => {
        mockFS.restore();
        jest.restoreAllMocks();
    });

    it('validates 2023 benchmarks data', () => {
        const result = benchmarkBusinessValidation(2023);

        expect(logSpy).not.toBeCalled();
        expect(result).toBeFalsy();
    });

    it('throws an error if a benchmark does not have a measureId', () => {
        testErrorsThrown(
            'no MeasureId provided for benchmark:',
            {0: { measureId: null }},
        )
    })

    it('throws an error if a benchmark has mismatched data with isHighPriority', () => {
        testErrorsThrown(
            'Property mismatch for isHighPrority between Benchmark of id 127 it\'s Measure\'s data. Measure expeceted false received true.',
            {42: { isHighPriority: true }},
        )
    })

    it('throws an error if a benchmark has mismatched data with isInverse', () => {
        testErrorsThrown(
            'Property mismatch for isInverse between Benchmark of id 127 it\'s Measure\'s data. Measure expeceted false received true.',
        {42: {isInverse: true}});
    })

    it('throws an error if a benchmark has no measure data for the requested PY', () => {
        testErrorsThrown(
            'No comparable measure found for Benchmark with measureId: 89080908',
            [{measureId: '89080908'}]
        )
    })
});