import { convertCsvToJson } from './csv-json-converter';
import * as benchmarksUtil from './util';
import benchmarksJson from '../../test/benchmarks/test-benchmarks.json'
import { InvalidValueError } from '../errors';

const performanceYear = 2023;

const benchmarksCSVPath = 'test/benchmarks/test-benchmarks.csv';
const badBenchmarksCSVPath = 'test/benchmarks/bad-test-benchmarks.csv';

describe('Benchmarks CSV-JSON Converter', () => {
    let writeSpy: jest.SpyInstance;
    
    beforeEach(() => {
        writeSpy = jest.spyOn(benchmarksUtil, 'writeToFile').mockImplementation();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    it('converts properly-formatted benchmarks CSV to JSON.', () => {
        convertCsvToJson(benchmarksCSVPath, performanceYear, 'test-benchmarks');

        expect(writeSpy).toBeCalledWith(benchmarksJson, 'staging/2023/benchmarks/json/test-benchmarks.json');
    });

    it('Does not convert CSV if bad data is detected.', () => {
        expect(() => {
            convertCsvToJson(badBenchmarksCSVPath, performanceYear, 'test-benchmarks');
        }).toThrowError(new InvalidValueError('isToppedOut', 'None'));
    });
});