/**
* @CsvToJsonConverter
*  This is a utility script which converts change request CSVs
* to json.
*/
import _ from 'lodash';
import { parse } from 'csv-parse/sync';

import {
    BENCHMARKS_COLUMN_NAMES,
    BENCHMARKS_ORDER,
    BOOLEAN_CSV_FIELDS,
    SUBMISSION_METHOD_MAP,
} from '../constants';
import { InvalidValueError } from '../errors';

type Benchmark = {
    measureId?: string,
    benchmarkYear?: number,
    performanceYear?: number,
    submissionMethod?: string,
    isToppedOut?: boolean,
    isHighPriority?: boolean,
    isInverse?: boolean,
    metricType?: string,
    isToppedOutByProgram?: boolean,
    percentiles?: object,
}

export function convertCsvToJson(csv: any, performanceYear: number) {
    const parsedCsv = prepareCsv(csv);

    let mappedCsv = parsedCsv.map((row: any) => {
        const measure: Benchmark = {};
        //maps the csv column values to the matching measures-data fields.
        _.each(BENCHMARKS_COLUMN_NAMES, (columnName, measureKeyName) => {
            if (row[measureKeyName]) {
                measure[columnName] = mapInput(measureKeyName, row);
            }
        });
        if (row['percentile10']) {
            measure.percentiles = {
                "1": row['percentile1'],
                "10": row['percentile10'],
                "20": row['percentile20'],
                "30": row['percentile30'],
                "40": row['percentile40'],
                "50": row['percentile50'],
                "60": row['percentile60'],
                "70": row['percentile70'],
                "80": row['percentile80'],
                "90": row['percentile90'],
                "99": row['percentile99'],
            }
        }
        
        //populate with False if it wasn't found in the csv.
        measure.isToppedOutByProgram = measure.isToppedOutByProgram || false;
        
        measure.performanceYear = performanceYear;
        measure.benchmarkYear = performanceYear - 2;
        
        return orderFields(measure);
    });

    //remove any empty rows
    _.remove(mappedCsv, _.isEmpty);

    return mappedCsv;
}

function orderFields(measure: any) {
    //reorder the fields to stay consistent.
    const orderedValues = Object.assign({}, BENCHMARKS_ORDER, measure)
    //remove undefined fields.
    return Object.entries(orderedValues)
        .filter(([key, value]) => value !== undefined)
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});
}

function mapInput(columnName: string, csvRow: any) {
    //fields with 'Yes' or 'No'
    if (BOOLEAN_CSV_FIELDS.includes(columnName)) {
        return csvFieldToBoolean(columnName, csvRow[columnName].trim());
    }
    if (csvRow[columnName] === 'submissionMethod') {
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

function prepareCsv(csv: any): any {
    //parse csv.
    const parsedCsv: Object[] = parse(csv, { columns: true, relax_column_count: true, bom: true });

    //trim keys in parsed csv.
    for (let i = 0; i < parsedCsv.length; i++) {
        Object.keys(parsedCsv[i]).forEach((key) => {
            const trimmedKey = key.trim();
            if (key !== trimmedKey) {
                parsedCsv[i][trimmedKey] = parsedCsv[i][key];
                delete parsedCsv[i][key];
            }
        });
    }

    return parsedCsv;
}