/**
 * @UpdateMeasures
 *  This is the primary script behind maintaining the measures data.
 *  It finds all new measures change files, validates their data and
 * structure, updates/adds the specified measures, and reports and 
 * success or error messages back to the user.
 *  Currently, this script is designed to intake CSVs, but will be 
 * refactored to accept JSON files once the front-end is created.
 */

import _ from 'lodash';
import fs from 'fs';
import parse from 'csv-parse/lib/sync';
import path from 'path';
import appRoot from 'app-root-path';

import { info, error, warning} from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import * as Constants from '../../constants';

const performanceYear = process.argv[2];

const measuresPath = `measures/${performanceYear}/measures-data.json`;
const changesPath = `updates/measures/${performanceYear}/`;

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot+'', measuresPath), 'utf8')
);

const changelog = JSON.parse(
    fs.readFileSync(path.join(appRoot+'', `${changesPath}Changelog.json`), 'utf8')
);

//to determine if any new changes need to be written to measures-data.json.
let numOfNewChangeFiles = 0;

function updateMeasures() {
    const files = fs.readdirSync(path.join(appRoot+'', changesPath));

    files.forEach(fileName => {
        //find only the change files not yet present in the changelog.
        if(fileName != 'Changelog.json') {
            if(!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName)
            }
        }
    });

    if(numOfNewChangeFiles > 0) {
        writeToFile(measuresJson, measuresPath);
    } else {
        info(`No new change files found.`);
    }
}

//not needed once we only accept JSON change requests.
function convertCsvToJson(fileName: string) {
    const csv = fs.readFileSync(path.join(appRoot+'', `${changesPath}${fileName}`), 'utf8');
    const parsedCsv = parse(csv, {columns: true});

    return parsedCsv.map((row: any) => {
        const measure = {};
        measure['category'] = row['Category'].toLowerCase();
        let csvColumnNames;
        switch (measure['category']) {
            case 'ia':
                csvColumnNames = Constants.IA_CSV_COLUMN_NAMES;
                break;
            case 'pi':
                csvColumnNames = Constants.PI_CSV_COLUMN_NAMES;
                break;
            case 'quality':
                csvColumnNames = Constants.QUALITY_CSV_COLUMN_NAMES;
                break;
        }
        //maps the csv column values to the matching measures-data fields.
        _.each(csvColumnNames, (columnName, measureKeyName) => {
          if(row[columnName]) {
            measure[measureKeyName] = mapInput(columnName, row, measure['category'], csvColumnNames);
          }
        });
        
        return measure;
    });
}

function mapInput(columnName: string, csvRow: any, category: string, csvColumnNames: any) {
    //remove this field if no change requests are made for it.
    if(csvRow[columnName] === '') {
        return undefined;
    }

    //fields with 'Yes' or 'No'
    if (Constants.BOOLEAN_CSV_FIELDS.includes(columnName)) {
        //risk Adjusted
        if (columnName === Constants.QUALITY_CSV_COLUMN_NAMES.isRiskAdjusted && category.trim() === 'Quality') {
            if (csvRow[columnName].trim() === 'Y') {
                warning('Quality measures cannot be Risk Adjusted. Setting isRiskAdjusted to false.');
                return false;
            }
        }
        return csvFieldToBoolean(csvRow[columnName]);
    }
    //fields with comma seperated values.
    else if (Constants.ARRAY_CSV_FIELDS.includes(columnName)) {
        const rawArray = csvFieldToArray(csvRow[columnName], columnName, csvColumnNames);
        //map historic_benchmarks
        if (columnName ===Constants.QUALITY_CSV_COLUMN_NAMES.historic_benchmarks) {
            return rawArray.reduce((obj, item) => {
                return {
                    ...obj,
                    [item]: 'removed',
                };
            }, {});
        }
        return rawArray;
    }
    //metric type
    else if (columnName === Constants.QUALITY_CSV_COLUMN_NAMES.metricType) {
        warning('Metric Type was changed. Was the strata file also updated to match?');
        if (csvRow[columnName].trim() === 'singlePerformanceRate' && category.trim() === 'QCDR') {
            return 'registrySinglePerformanceRate';
        } else if (csvRow[columnName].trim() === 'multiPerformanceRate' && category.trim() === 'QCDR') {
            return 'registryMultiPerformanceRate';
        }
    }
    //Overall Algorithm (Calculation Type)
    else if (
        columnName === Constants.QUALITY_CSV_COLUMN_NAMES.overallAlgorithm && 
        csvRow[Constants.QUALITY_CSV_COLUMN_NAMES.metricType].includes('inglePerformanceRate')
    ) {
        return null;
    }
    //numbers
    else if (
        columnName === Constants.BASE_CSV_COLUMN_NAMES.firstPerformanceYear ||
        columnName === Constants.BASE_CSV_COLUMN_NAMES.yearRemoved
    ) {
        if (columnName === Constants.BASE_CSV_COLUMN_NAMES.firstPerformanceYear) {
            warning('Year Added was changed. Was this deliberate?');
        }
        return +csvRow[columnName];
    }

    return csvRow[columnName].trim();
}

//converts field 'apples, ice cream, banana' to ['apples', 'icecream', 'banana'].
function csvFieldToArray(fieldValue: string, fieldHeader: string, csvColumnNames: string[]) {
    const arrayedField: string[] = fieldValue.split(',');

    //.replace(/\s/g, "") removes all whitespace.
    if (fieldHeader === Constants.QUALITY_CSV_COLUMN_NAMES.measureType) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.MEASURE_TYPES[arrayedField[i].toLowerCase().replace(/\s/g, "")];
        }
    }
    else if (fieldHeader === Constants.QUALITY_CSV_COLUMN_NAMES.measureSets) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.MEASURE_SETS[arrayedField[i].replace(/\s/g, "")];
        }
    }
    else if (fieldHeader === Constants.QUALITY_CSV_COLUMN_NAMES.allowedPrograms) {        
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.ALLOWED_PROGRAMS[arrayedField[i].replace(/\s/g, "")];
        }
    }
    else if (Constants.COLLECTION_TYPES_FIELDS.includes(fieldHeader)) {
        for (let i = 0; i < arrayedField.length; i++) {
            arrayedField[i] = Constants.COLLECTION_TYPES[arrayedField[i].trim()];
            
        }
    }

    for (let i = 0; i < arrayedField.length; i++) {
        arrayedField[i] = arrayedField[i].trim();
    }
    return arrayedField;
}

//converts field 'Yes' to True and 'No' to False.
function csvFieldToBoolean(field: string) {
    switch (field) {
        case 'Y':
            return true;
        case 'N':
            return false;
    }
}

function updateMeasuresWithChangeFile(fileName: string) {
    const changeData = convertCsvToJson(fileName);
    let numOfFailures = 0;

    for (let i = 0; i < changeData.length; i++) {
        const change = changeData[i] as MeasuresChange;

        if(change.category) {
            const isNew = isNewMeasure(change.measureId);
            //validation on the change request format. Validation on the updated measures data happens later in update-measures.
            const validate = initValidation(measureType[change.category], isNew);            

            if (change.yearRemoved && change.yearRemoved == +performanceYear) {
                deleteMeasure(change.measureId);
            } else if (change.yearRemoved) {
                numOfFailures++;
                error(`'${fileName}': Year Removed is not current year.`);
            } else if (isNew && change['metricType'].includes('ultiPerformanceRate') && !change['overallAlgorithm']) {
                numOfFailures++;
                error(`'${fileName}': New multiPerformanceRate measures require a Calculation Type.`);
            } else if (
                isNew && 
                (change['submissionMethods']?.includes('electronicHealthRecord')) && 
                !change['eMeasureId']
                ) {
                numOfFailures++;
                error(`'${fileName}': CMS eCQM ID is required if one of the collection types is eCQM.`);
            } else if (validate(change)) {
                updateMeasure(change);
                if(isNew) {
                    info(`New measure '${change.measureId}' added.`);
                }
            } else {
                numOfFailures++;
                console.log(validate.errors)
            }
        } else {
            numOfFailures++;
            error(`'${fileName}': Category is required.`);
        }
    }

    if(numOfFailures === 0) {
        updateChangeLog(fileName);
        info(`File '${fileName}' successfully ingested into measures-data ${performanceYear}`);
    } else {
        error(`Some changes failed for file '${fileName}'. More info logged above.`);
    }
}

function updateChangeLog(fileName: string) {
    changelog.push(fileName);
    writeToFile(changelog, `${changesPath}Changelog.json`);
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(appRoot+'', filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

function deleteMeasure(measureId: string) {
    const measureIndex = _.findIndex(measuresJson, { measureId });
    if (measureIndex > -1) {
        measuresJson.splice(measureIndex, 1);
        info(`Measure '${measureId}' removed.`);
    } else {
        warning(`Measure '${measureId}' not found.`);
    }
}

function updateBenchmarksMetaData(change: MeasuresChange): any {
    return {
        isIcdImpacted: change['icdImpacted'] ? !!change['icdImpacted'].length :  false,
        isClinicalGuidelineChanged: change['clinicalGuidelineChanged'] ? !!change['clinicalGuidelineChanged'].length :  false,
    };

}

function updateMeasure(change: MeasuresChange) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            measuresJson[i] = {
                ...measuresJson[i],
                ...change as any,
                ...updateBenchmarksMetaData(change),
            };
            break;
        }
    }
}

function isNewMeasure(measureId: string) {
    const measure = _.find(measuresJson, {'measureId': measureId});
    return !measure;
}

updateMeasures();
