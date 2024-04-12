/**
* @CsvToJsonConverter
*  This script converts the cost national average csv to json
* to json.
*/
import _ from 'lodash';

import { COST_NATIONAL_AVERAGES_COLUMN_NAMES } from '../constants';
import { CostNationalAverage } from './benchmarks.types';
import { prepareCsv, fetchCSV, writeToFile } from './util';
import { DataValidationError } from '../errors';

export function convertCsvToJson(csvPath: string, performanceYear: number, jsonFileName: string) {
    const csv = fetchCSV(csvPath);
    const parsedCsv = prepareCsv(csv);
    const jsonPath = `benchmarks/${performanceYear}/${jsonFileName}.json`;

    const mappedJson = parsedCsv.map((row) => {
        const costAverageData: CostNationalAverage = {
            // measureId needs default values for typing.
            measureId: '',
            performanceYear,
            benchmarkYear: performanceYear,
            groupNationalAverage: null,
            individualNationalAverage: null,
        };

        //maps the csv column values to the matching json fields.
        _.each(COST_NATIONAL_AVERAGES_COLUMN_NAMES, (csvColumn, jsonField) => {
            if (row[csvColumn]) {
                costAverageData[jsonField] = mapInput(csvColumn, row);
            }
        });
        
        if (costAverageData.measureId === '') {
            throw new DataValidationError('Cost National Average CSV', `Validation Failed. All rows need a measureId.`);
        }

        return costAverageData;
    });

    // write to [filename].json
    writeToFile(mappedJson, jsonPath);
}

function mapInput(columnName: string, csvRow: any) {
    const formattedColData = csvRow[columnName].replace(/\s/g, '');
    if (columnName !== COST_NATIONAL_AVERAGES_COLUMN_NAMES.measureId) {
        return +formattedColData;
    };

    return formattedColData;
}

/* istanbul ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    convertCsvToJson(process.argv[2], parseInt(process.argv[3]), process.argv[4]);
