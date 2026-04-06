import { describe, it, expect, jest } from '@jest/globals';
import { convertCsvToJson } from './update-cost-national-averages';
import * as Utils from './util';
import { DataValidationError } from '../errors';

const successfulJsonOutput = [
    {
        "measureId": "COST_ACOPD_1",
        "performanceYear": 2023,
        "benchmarkYear": 2023,
        "groupNationalAverage": 4702.26,
        "individualNationalAverage": 4595.53
    },
    {
        "measureId": "COST_AKID_1",
        "performanceYear": 2023,
        "benchmarkYear": 2023,
        "groupNationalAverage": 39491.89,
        "individualNationalAverage": 46136.03
    },
    {
        "measureId": "COST_SPH_1",
        "performanceYear": 2023,
        "benchmarkYear": 2023,
        "groupNationalAverage": null,
        "individualNationalAverage": null
    },
    {
        "measureId": "COST_SSC_1",
        "performanceYear": 2023,
        "benchmarkYear": 2023,
        "groupNationalAverage": 999.06,
        "individualNationalAverage": 999.06
    },
]

describe('Benchmarks Cost National Averages.', () => {
    it('Successfully creates a json from a csv.', () => {
        const writeSpy = jest.spyOn(Utils, 'writeToFile').mockImplementation(jest.fn());
        
        convertCsvToJson('test/benchmarks/cost-national-averages.csv', 2023, 'cost-national-averages');
        
        expect(writeSpy).toHaveBeenCalledWith(successfulJsonOutput, 'benchmarks/2023/cost-national-averages.json')
    });

    it('Fails to create the json if a measureId is missing.', () => {
        jest.spyOn(Utils, 'writeToFile').mockImplementation(jest.fn());
        
        expect(() => {
            convertCsvToJson('test/benchmarks/bad-measureid-cost-national-averages.csv', 2023, 'cost-national-averages');
        }).toThrow(new DataValidationError('Cost National Average CSV', `Validation Failed. All rows need a measureId.`));
    });
});