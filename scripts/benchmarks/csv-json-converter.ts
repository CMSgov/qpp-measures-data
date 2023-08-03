/**
* @CsvToJsonConverter
*  This is a utility script which converts change request CSVs
* to json.
*/
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { parse } from 'csv-parse/sync';

import {
    BENCHMARKS_COLUMN_NAMES,
    BENCHMARKS_ORDER,
    BOOLEAN_CSV_FIELDS,
    SUBMISSION_METHOD_MAP,
} from '../constants';
import { InvalidValueError } from '../errors';

export type Benchmark = {
    measureId: string,
    benchmarkYear: number,
    performanceYear: number,
    submissionMethod: string,
    isToppedOut?: boolean,
    isHighPriority?: boolean,
    isInverse?: boolean,
    metricType?: string,
    isToppedOutByProgram?: boolean,
    percentiles?: object,
}

// command to use this file:
//  node ./dist/benchmarks/csv-json-converter.js ./util/2023/benchmarks/[fileName].csv [year] > ./util/2023/benchmarks/json/[fileName].json
function convertCsvToJson(csvPath: string, performanceYear: number) {
    const csv = fetchCSV(csvPath);
    const parsedCsv = prepareCsv(csv);

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
            if (row[columnName]) {
                measure[measureKeyName] = mapInput(columnName, row);
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
        
        //populate with False if it wasn't found in the csv.
        measure.isToppedOutByProgram = measure.isToppedOutByProgram || false;
        return orderFields(measure);
    });

    // output to [filename].json
    process.stdout.write(JSON.stringify(mappedCsv, null, 2));
}

function fetchCSV(filePath: string) {
    return fs.readFileSync(path.join(appRoot + '', `${filePath}`), 'utf8');
}

function orderFields(benchmark: Benchmark) {
    //reorder the fields to stay consistent.
    const orderedValues = Object.assign({}, BENCHMARKS_ORDER, benchmark)
    //remove undefined fields.
    return _.omitBy(orderedValues, _.isNil);
}

function mapInput(columnName: string, csvRow: any) {
    //fields with 'Yes' or 'No'
    if (BOOLEAN_CSV_FIELDS.includes(columnName)) {
        return csvFieldToBoolean(columnName, csvRow[columnName].trim());
    }
    if (columnName === 'submissionMethod') {
        return SUBMISSION_METHOD_MAP[csvRow[columnName].replace(/\s/g, '').toLowerCase()];
    }
    // null field if the value entered in the CR is 'NULL'.
    if (csvRow[columnName] === 'NULL') {
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

function prepareCsv(csv: any) {
    //parse csv.
    let parsedCsv: Object[] = parse(csv, {
        columns: true,
        relax_column_count: true,
        bom: true,
    });

    //trim keys in parsed csv.
    parsedCsv = _.map(parsedCsv, (row) => {
        return _.mapKeys(row, (value, key) => {
            return key.trim();
        });
    });

    return parsedCsv;
}

convertCsvToJson(process.argv[2], parseInt(process.argv[3]));