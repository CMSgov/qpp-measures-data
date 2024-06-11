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
//  node dist/benchmarks/csv-json-converter.js staging/2023/benchmarks/[fileName].csv 2023 [fileName]
export function convertCsvToJson(csvPath: string, performanceYear: number, jsonFileName: string) {
    const csv = fetchCSV(csvPath);
    const parsedCsv = prepareCsv(csv);
    const jsonPath = `staging/${performanceYear}/benchmarks/json/${jsonFileName}.json`;

    const mappedCsv = parsedCsv.map((row) => {
        const benchmark: Benchmark = {
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
                benchmark[columnName] = mapInput(measureKeyName, row);
            }
        });
        
        if (row['percentile10']) {
            benchmark.percentiles = {
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
        benchmark.isToppedOutByProgram = benchmark.isToppedOutByProgram || false;
        benchmark.averagePerformanceRate = (benchmark.averagePerformanceRate != null)
            ? +benchmark.averagePerformanceRate
            : null;

        return orderFields(benchmark);
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

/* c8 ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    /* c8 ignore next */
    convertCsvToJson(process.argv[2], parseInt(process.argv[3]), process.argv[4]);
