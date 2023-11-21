/**
* @CsvToJsonConverter
*  This is a utility script which converts change request CSVs
* to json. 
*  This script can be removed once we no longer support CSV change requests.
*/
import _ from 'lodash';
import { parse } from 'csv-parse/sync';

import { warning } from '../../logger';
import {
    ARRAY_CSV_FIELDS,
    BASE_CSV_COLUMN_NAMES,
    BOOLEAN_CSV_FIELDS,
    COLLECTION_TYPES,
    COLLECTION_TYPES_FIELDS,
    IA_CSV_COLUMN_NAMES,
    MEASURE_SETS,
    MEASURE_TYPES,
    PI_CSV_COLUMN_NAMES,
    QUALITY_CSV_COLUMN_NAMES,
    OBJECTIVES,
    REPORTING_CATEGORY,
    WEIGHT,
    SUBCATEGORY_NAME,
} from '../../constants';
import { InvalidValueError } from '../../errors';

export function convertCsvToJson(csv: any) {
    const parsedCsv = prepareCsv(csv);

    let mappedCsv = parsedCsv.map((row: any) => {
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

    //remove any empty rows
    _.remove(mappedCsv, _.isEmpty);

    return mappedCsv;
}

function mapInput(columnName: string, csvRow: any, category: string) {

    switch (columnName) {
        case QUALITY_CSV_COLUMN_NAMES.measureType:
            return mapItem(columnName, MEASURE_TYPES, csvRow[columnName].toLowerCase());
        case PI_CSV_COLUMN_NAMES.objective:
            return mapItem(columnName, OBJECTIVES, csvRow[columnName]);
        case PI_CSV_COLUMN_NAMES.reportingCategory:
            return mapItem(columnName, REPORTING_CATEGORY, csvRow[columnName]);
        case IA_CSV_COLUMN_NAMES.weight:
            return mapItem(columnName, WEIGHT, csvRow[columnName]);
        case IA_CSV_COLUMN_NAMES.subcategoryId:
            return mapItem(columnName, SUBCATEGORY_NAME, csvRow[columnName]);
        case QUALITY_CSV_COLUMN_NAMES.metricType:
            if (csvRow[columnName].trim() === 'singlePerformanceRate' && category === 'qcdr') {
                return 'registrySinglePerformanceRate';
            } else if (csvRow[columnName].trim() === 'multiPerformanceRate' && category === 'qcdr') {
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
        return csvFieldToBoolean(columnName, csvRow[columnName].trim());
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

    // null field if the value entered in the CR is 'NULL'.
    if (csvRow[columnName] === 'NULL') return null;

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
    if (COLLECTION_TYPES_FIELDS.includes(fieldHeader)) {
        return mapArrayItem(fieldHeader, COLLECTION_TYPES, fieldValue);
    }
    if (fieldHeader === PI_CSV_COLUMN_NAMES.substitutes && fieldValue === 'NULL') {
        return [];
    }
    if (fieldHeader === PI_CSV_COLUMN_NAMES.exclusion && fieldValue === 'NULL') {
        return null;
    }
    return fieldValue.split(',').map(element => element.trim());;
}

function mapArrayItem(field: string, map: any, values: string) {
    // null field if the value entered in the CR is 'NULL'.
    if (values === 'NULL') return [];

    const arrayedField: string[] = values.replace(/\s/g, "").split(',').filter(n => n);

    for (let i = 0; i < arrayedField.length; i++) {
        arrayedField[i] = mapItem(field, map, arrayedField[i]);
    }

    return _.uniq(arrayedField);
}

function mapItem(field: string, map: any, value: string) {
    // .replace(/\s/g, "") removes all whitespace.
    if (typeof map[value.replace(/\s/g, "").toLowerCase()] !== 'undefined') {
        return map[value.replace(/\s/g, "").toLowerCase()];
    }
    else {
        throw new InvalidValueError(field, value);
    }
}

//converts field 'Yes' to True and 'No' to False.
function csvFieldToBoolean(field: string, value: string): boolean {
    switch (value) {
        case 'Y':
        case 'TRUE':
            return true;
        case 'N':
        case 'FALSE':
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

    //check if the CR includes a leading examples row, and remove.
    if (parsedCsv[0]['Category'].includes('Value')) {
        parsedCsv.splice(0, 1);
    }

    return parsedCsv;
}