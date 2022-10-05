/**
* @CsvToJsonConverter
*  This is a utility script which converts change request CSVs
* to json. 
*  This script can be removed once we no longer support CSV change requests.
*/
import _ from 'lodash';
import parse from 'csv-parse/lib/sync';

import { warning } from '../../logger';
import {
    ALLOWED_PROGRAMS,
    ARRAY_CSV_FIELDS,
    BASE_CSV_COLUMN_NAMES,
    BOOLEAN_CSV_FIELDS,
    COLLECTION_TYPES,
    COLLECTION_TYPES_FIELDS,
    IA_CSV_COLUMN_NAMES,
    MEASURE_SETS,
    MEASURE_TYPES,
    PI_CSV_COLUMN_NAMES,
    QUALITY_CSV_COLUMN_NAMES
} from '../../constants';
import { InvalidValueError } from './errors';

export function convertCsvToJson(csv: any) {
    
    const parsedCsv = parse(csv, { columns: true });

    return parsedCsv.map((row: any) => {
        const measure = {};
        row['Category'] = row['Category'].toLowerCase().trim();
        let csvColumnNames;
        switch (row['Category']) {
            case 'ia':
                csvColumnNames = IA_CSV_COLUMN_NAMES;
                break;
            case 'pi':
                csvColumnNames = PI_CSV_COLUMN_NAMES;
                break;
            case 'quality':
                csvColumnNames = QUALITY_CSV_COLUMN_NAMES;
                break;
            case 'qcdr':
                csvColumnNames = QUALITY_CSV_COLUMN_NAMES;
                break;
        }
        //maps the csv column values to the matching measures-data fields.
        _.each(csvColumnNames, (columnName, measureKeyName) => {
            if (row[columnName]) {
                measure[measureKeyName] = mapInput(columnName, row, row['Category']);
            }
        });

        return measure;
    });
}

function mapInput(columnName: string, csvRow: any, category: string) {

    switch (columnName) {
        case QUALITY_CSV_COLUMN_NAMES.measureType:
            return mapItem(columnName, MEASURE_TYPES, csvRow[columnName]);

        case QUALITY_CSV_COLUMN_NAMES.metricType:
            if (csvRow[columnName].trim() === 'singlePerformanceRate' && category.trim().toLowerCase() === 'qcdr') {
                return 'registrySinglePerformanceRate';
            } else if (csvRow[columnName].trim() === 'multiPerformanceRate' && category.trim().toLowerCase() === 'qcdr') {
                return 'registryMultiPerformanceRate';
            }
            break;
        case QUALITY_CSV_COLUMN_NAMES.overallAlgorithm:
            if (csvRow[QUALITY_CSV_COLUMN_NAMES.metricType].includes('inglePerformanceRate')) return;
            break;
        case BASE_CSV_COLUMN_NAMES.firstPerformanceYear:
            return +csvRow[columnName];
        case BASE_CSV_COLUMN_NAMES.yearRemoved:
            return +csvRow[columnName];
        case IA_CSV_COLUMN_NAMES.subcategoryId:
            return _.camelCase(csvRow[columnName]).trim();
    }

    //fields with 'Yes' or 'No'
    if (BOOLEAN_CSV_FIELDS.includes(columnName)) {
        //risk Adjusted
        if (columnName === QUALITY_CSV_COLUMN_NAMES.isRiskAdjusted && category === 'quality') {
            if (csvRow[columnName].trim() === 'Y') {
                warning('Quality measures cannot be Risk Adjusted. Setting isRiskAdjusted to false.');
                return false;
            }
        }
        return csvFieldToBoolean(columnName, csvRow[columnName]);
    }

    //fields with comma seperated values.
    if (ARRAY_CSV_FIELDS.includes(columnName)) {
        const rawArray = csvFieldToArray(csvRow[columnName], columnName);
        //map historic_benchmarks
        if (rawArray && columnName === QUALITY_CSV_COLUMN_NAMES.historic_benchmarks) {
            return mapHistoricBenchmarks(rawArray);
        }
        return rawArray;
    }

    return csvRow[columnName].trim();
}

function mapHistoricBenchmarks(removedBenchmarks: string[]) {
    return removedBenchmarks.reduce((obj, item) => {
        return {
            ...obj,
            [item]: 'removed',
        };
    }, {});
}

//converts field 'apples, ice cream, banana' to ['apples', 'icecream', 'banana'].
function csvFieldToArray(fieldValue: string, fieldHeader: string) {
    if (fieldHeader === QUALITY_CSV_COLUMN_NAMES.measureSets) {
        return mapArrayItem(fieldHeader, MEASURE_SETS, fieldValue);
    }
    if (fieldHeader === QUALITY_CSV_COLUMN_NAMES.allowedPrograms) {
        return mapArrayItem(fieldHeader, ALLOWED_PROGRAMS, fieldValue);
    }
    if (COLLECTION_TYPES_FIELDS.includes(fieldHeader)) {
        return mapArrayItem(fieldHeader, COLLECTION_TYPES, fieldValue);
    }
    return fieldValue.split(',').map(element => element.trim());;
}

function mapArrayItem(field: string, map: any, values: string) {
    const arrayedField: string[] = values.split(',');

    for (let i = 0; i < arrayedField.length; i++) {
        arrayedField[i] = mapItem(field, map, arrayedField[i]);
    }

    return _.uniq(arrayedField);
}

function mapItem(field: string, map: any, value: string) {
    // .replace(/\s/g, "") removes all whitespace.
    if (map[value.replace(/\s/g, "")]) {
        return map[value.replace(/\s/g, "")];
    }
    else {
        throw new InvalidValueError(field, value);
    }
}

//converts field 'Yes' to True and 'No' to False.
function csvFieldToBoolean(field: string, value: string) {
    switch (value) {
        case 'Y':
            return true;
        case 'N':
            return false;
        default:
            throw new InvalidValueError(field, value);
    }
}