import { mergeBenchmarkFiles } from './merge-benchmark-files';
import * as benchmarksUtil from './util';

import benchmarksOutput from '../../test/benchmarks/test-benchmarks-merged.json';

const performanceYear = 2023;

describe('Merge Benchmark Files', () => {
    let writeSpy: jest.SpyInstance;

    beforeEach(() => {
        writeSpy = jest.spyOn(benchmarksUtil, 'writeToFile').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Successfully merges two benchmark JSON files and sorts the benchmarks', () => {
        mergeBenchmarkFiles('test/benchmarks/merge-input-files/', performanceYear);
        
        expect(writeSpy).toBeCalledWith(benchmarksOutput, `benchmarks/${performanceYear}.json`);
    });
});
