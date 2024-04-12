/**
* @CsvToJsonConverter
*  This is a utility script which converts change request CSVs
* to json.
*/
import _ from 'lodash';

import {
    BENCHMARKS_COLUMN_NAMES,
    BENCHMARKS_ORDER,
    BOOLEAN_CSV_FIELDS,
    SUBMISSION_METHOD_MAP,
} from '../constants';
import { InvalidValueError } from '../errors';

import { Benchmark } from './benchmarks.types';
import { prepareCsv, fetchCSV, writeToFile } from './util';

// command to use this file:
//  node ./dist/benchmarks/csv-json-converter.js ./util/2023/benchmarks/[fileName].csv [year] > ./util/2023/benchmarks/json/[fileName].json
function convertCsvToJson(csvPath: string, performanceYear: number, jsonFileName: string) {
    const csv = fetchCSV(csvPath);
    const parsedCsv = prepareCsv(csv);
    const jsonPath = `staging/${performanceYear}/benchmarks/json/${jsonFileName}.json`;

    const mappedCsv = parsedCsv.map((row) => {
        const measure: Benchmark = {
            performanceYear,
            benchmarkYear: performanceYear - 2,
            // measureId and submissionMethod need default values for typing.
            measureId: '',
            submissionMethod: '',
            isInverse: false,
            isToppedOutByProgram: false,
            percentiles: {},
        };
        
        //maps the csv column values to the matching measures-data fields.
        _.each(BENCHMARKS_COLUMN_NAMES, (columnName, measureKeyName) => {
            if (row[measureKeyName]) {
                measure[columnName] = mapInput(measureKeyName, row);
            }
        });
        
        if (row['percentile10']) {
            measure.percentiles = {
                "1": parseFloat(row['percentile1']),
                "10": parseFloat(row['percentile10']),
                "20": parseFloat(row['percentile20']),
                "30": parseFloat(row['percentile30']),
                "40": parseFloat(row['percentile40']),
                "50": parseFloat(row['percentile50']),
                "60": parseFloat(row['percentile60']),
                "70": parseFloat(row['percentile70']),
                "80": parseFloat(row['percentile80']),
                "90": parseFloat(row['percentile90']),
                "99": parseFloat(row['percentile99']),
            }
        }
        
        //populate some default values if they are not found in the csv.
        measure.isToppedOutByProgram = measure.isToppedOutByProgram || false;
        measure.averagePerformanceRate = measure.averagePerformanceRate
            ? +measure.averagePerformanceRate
            : null;

        return orderFields(measure);
    });

    // write to [filename].json
    writeToFile(mappedCsv, jsonPath);
}

function orderFields(benchmark: Benchmark) {
    //reorder the fields to stay consistent.
    const orderedValues = Object.assign({}, BENCHMARKS_ORDER, benchmark)
    //remove undefined fields.
    return _.omitBy(orderedValues, _.isUndefined);
}

function mapInput(columnName: string, csvRow: any) {
    const formattedColData = csvRow[columnName].replace(/\s/g, '').toLowerCase();
    //fields with 'Yes' or 'No'
    if (BOOLEAN_CSV_FIELDS.includes(columnName)) {
        return csvFieldToBoolean(columnName, csvRow[columnName].trim());
    }
    if (columnName === 'submissionMethod') {
        return SUBMISSION_METHOD_MAP[formattedColData];
    }
    // null field if the value entered in the CR is 'null'.
    if (formattedColData === 'null') {
        return null;
    };

    return csvRow[columnName].trim();
}

//converts field 'Yes' to True and 'No' to False, any varients.
function csvFieldToBoolean(field: string, value: string): boolean {
    switch (value.toLowerCase()) {
        case 'y':
        case 'yes':
        case 'true':
            return true;
        case 'n':
        case 'no':
        case 'false':
            return false;
        default:
            throw new InvalidValueError(field, value);
    }
}

convertCsvToJson(process.argv[2], parseInt(process.argv[3]), process.argv[4]);
