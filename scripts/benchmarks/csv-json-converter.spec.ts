import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { convertCsvToJson } from './csv-json-converter';
import * as benchmarksUtil from './util';
import benchmarksJson from '../../test/benchmarks/test-benchmarks.json'
import { InvalidValueError } from '../errors';

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

    it('Does not convert CSV if bad data is detected.', () => {
        expect(() => {
            convertCsvToJson(badBenchmarksCSVPath, performanceYear, 'test-benchmarks');
        }).toThrow(new InvalidValueError('isToppedOut', 'None'));
    });
});