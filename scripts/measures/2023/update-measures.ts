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

import { info, error} from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import * as Constants from '../../constants';

const performanceYear = process.argv[2];

const measuresPath = `../../../measures/${performanceYear}/measures-data.json`;
const changesPath = `../../../updates/measures/${performanceYear}/`;

const measuresJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, measuresPath), 'utf8')
);

const changelog = JSON.parse(
    fs.readFileSync(path.join(__dirname, `${changesPath}Changelog.json`), 'utf8')
);

//to determine if any new changes need to be written to measures-data.json.
let numOfNewChangeFiles = 0;

function updateMeasures() {
    const files = fs.readdirSync(path.join(__dirname, changesPath));

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
    const csv = fs.readFileSync(path.join(__dirname, `${changesPath}${fileName}`), 'utf8');
    const parsedCsv = parse(csv, {columns: true});

    return parsedCsv.map((row) => {
        const measure = {};
        measure['category'] = row['category'].toLowerCase();
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
            if(Constants.arrayCSVfields.includes(columnName)) {
                measure[measureKeyName] = csvFieldToArray(row[columnName]);
            }
            measure[measureKeyName] = row[columnName];
          }
        });
        
        return measure;
    });
}

//converts field 'apples, ice cream, banana' to ['apples', 'ice cream', 'banana'].
function csvFieldToArray(field: string) {
    const arrayedField: string[] = field.split(',');
    for (let i = 0; i < arrayedField.length; i++) {
        arrayedField[i] = arrayedField[i].trim();
    }
    return arrayedField;
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
            error(`'${fileName}': category is required.`);
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
    fs.writeFile(path.join(__dirname, filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

function deleteMeasure(measureId: string) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == measureId) {
            delete measuresJson[i];
            info(`Measure '${measureId}' removed.`);
            break;
        }
    }
}

function updateMeasure(change: MeasuresChange) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            measuresJson[i] = {
                ...measuresJson[i],
                ...change as any,
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