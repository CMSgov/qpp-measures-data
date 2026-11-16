import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import _ from 'lodash';
import { convertCsvToJson } from './csv-json-converter';
import * as benchmarksUtil from './util';
import benchmarksJson from '../../test/benchmarks/test-benchmarks.json'
import { InvalidValueError } from '../errors';
import * as logger from '../logger';

const performanceYear = 2023;

const benchmarksCSVPath = 'test/benchmarks/test-benchmarks.csv';
const badBenchmarksCSVPath = 'test/benchmarks/bad-test-benchmarks.csv';

describe('Benchmarks CSV-JSON Converter', () => {
    let writeSpy: jest.Spied<typeof benchmarksUtil.writeToFile>;
    
    beforeEach(() => {
        writeSpy = jest.spyOn(benchmarksUtil, 'writeToFile').mockImplementation(jest.fn());
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    it('converts properly-formatted benchmarks CSV to JSON.', () => {
        convertCsvToJson(benchmarksCSVPath, performanceYear, 'test-benchmarks');

        expect(writeSpy).toHaveBeenCalledWith(benchmarksJson, 'staging/2023/benchmarks/json/test-benchmarks.json');
    });

    it('ignores isHighPriority with a warning for Core Measures performance years.', () => {
        const warningSpy = jest.spyOn(logger, 'warning').mockImplementation(jest.fn());

        convertCsvToJson(benchmarksCSVPath, 2027, 'test-benchmarks');

        const expected = benchmarksJson.map((benchmark) => ({
            ..._.omit(benchmark, 'isHighPriority'),
            performanceYear: 2027,
            benchmarkYear: 2025,
        }));
        expect(benchmarksJson.every(benchmark => typeof benchmark.isHighPriority === 'boolean')).toBe(true);
        expect(writeSpy).toHaveBeenCalledWith(expected, 'staging/2027/benchmarks/json/test-benchmarks.json');
        expect(warningSpy).toHaveBeenCalledTimes(1);
        expect(warningSpy).toHaveBeenCalledWith(`isHighPriority is ignored for PY2027 and later; please remove it from the benchmark file '${benchmarksCSVPath}'.`);
    });

    it('Does not convert CSV if bad data is detected.', () => {
        expect(() => {
            convertCsvToJson(badBenchmarksCSVPath, performanceYear, 'test-benchmarks');
        }).toThrow(new InvalidValueError('isToppedOut', 'None'));
    });
});