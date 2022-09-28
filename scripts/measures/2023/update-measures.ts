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
import path from 'path';
import appRoot from 'app-root-path';

import { info, error, warning } from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import { convertCsvToJson } from '../lib/csv-json-converter';
import { DataValidationError } from '../lib/errors';

const performanceYear = process.argv[2];

const measuresPath = `measures/${performanceYear}/measures-data.json`;
const changesPath = `updates/measures/${performanceYear}/`;

const measuresJson: any[] = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', measuresPath), 'utf8')
);

const changelog = JSON.parse(
    fs.readFileSync(path.join(appRoot + '', `${changesPath}changes.meta.json`), 'utf8')
);


function updateMeasures() {
    //to determine if any new changes need to be written to measures-data.json.
    let numOfNewChangeFiles = 0;

    const fileNames = fs.readdirSync(path.join(appRoot + '', changesPath));

    fileNames.forEach(fileName => {
        if (fileName != 'changes.meta.json') {
            //find only the change files not yet present in the changelog.
            if (!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                updateMeasuresWithChangeFile(fileName)
            }
        }
    });

    if (numOfNewChangeFiles > 0) {
        writeToFile(measuresJson, measuresPath);
    } else {
        info(`No new change files found.`);
    }
}

function updateMeasuresWithChangeFile(fileName: string) {
    const csv = fs.readFileSync(path.join(appRoot + '', `${changesPath}${fileName}`), 'utf8');
    try {
        const changeData = convertCsvToJson(csv);

        for (let i = 0; i < changeData.length; i++) {
            const change = changeData[i] as MeasuresChange;

            if (!change.category) {
                throw new DataValidationError(fileName, 'Category is required.');
            } else {
                const isNew = isNewMeasure(change.measureId);
                //validation on the change request format. Validation on the updated measures data happens later in update-measures.
                const validate = initValidation(measureType[change.category], isNew);

                if (!isNew) {
                    if (change.firstPerformanceYear) warning(
                        `'${fileName}': 'Year Added' was changed. Was this deliberate?`
                    );
                    if (change.isInverse) warning(
                        `'${fileName}': 'isInverse' was changed. Was this deliberate?`
                    );
                    if (change.metricType) warning(
                        `'${fileName}': 'Metric Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.overallAlgorithm) warning(
                        `'${fileName}': 'Calculation Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.submissionMethods?.includes('electronicHealthRecord') && !change.eMeasureId) {
                        throw new DataValidationError(fileName, 'CMS eCQM ID is required if one of the collection types is eCQM.');
                    }
                }

                if (!isOutcomeHighPriority(change)) {
                    throw new DataValidationError(fileName, `'outcome' and 'intermediateOutcome' measures must always be High Priority.`);
                }
                if (change.yearRemoved && change.yearRemoved !== +performanceYear) {
                    throw new DataValidationError(fileName, 'Year Removed is not current year.');
                }
                if (isNew && change.metricType?.includes('ultiPerformanceRate') && !change.overallAlgorithm) {
                    throw new DataValidationError(fileName, 'New multiPerformanceRate measures require a Calculation Type.');
                }

                if (change.yearRemoved) {
                    deleteMeasure(change.measureId);
                } else if (validate(change)) {
                    updateMeasure(change);
                    if (isNew) info(`New measure '${change.measureId}' added.`);
                } else {
                    console.log(validate.errors);
                    throw new DataValidationError(fileName, `Validation Failed. More info logged above.`);
                }
            }
        }

        updateChangeLog(fileName);
        info(`File '${fileName}' successfully ingested into measures-data ${performanceYear}`);

    } catch (err) {
        if (err instanceof Error) {
            error(err.message);
        }
        else {
            throw err;
        }
    }
}

function isOutcomeHighPriority(change: MeasuresChange): boolean {
    const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId });

    const type: string = change.measureType ? change.measureType : currentMeasure?.measureType;
    const isHighPriority: string = change.isHighPriority ? change.isHighPriority : currentMeasure?.isHighPriority;

    if (type?.includes('utcome') && !isHighPriority) {
        return false;
    }
    return true;
}

function updateChangeLog(fileName: string) {
    changelog.push(fileName);
    writeToFile(changelog, `${changesPath}changes.meta.json`);
}

function writeToFile(file: any, filePath: string) {
    fs.writeFile(path.join(appRoot + '', filePath), JSON.stringify(file, null, 2), function writeJSON(err) {
        if (err) return console.log(err);
    });
}

function deleteMeasure(measureId: string) {
    const measureIndex = _.findIndex(measuresJson, { measureId });
    if (measureIndex > -1) {
        measuresJson.splice(measureIndex, 1);
        info(`Measure '${measureId}' removed.`);
    } else {
        throw new DataValidationError(measureId, 'Measure not found.');
    }
}

function updateBenchmarksMetaData(change: MeasuresChange): any {
    return {
        isIcdImpacted: change.icdImpacted ? !!change.icdImpacted.length : false,
        isClinicalGuidelineChanged: change.clinicalGuidelineChanged ? !!change.clinicalGuidelineChanged.length : false,
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
    const measure = _.find(measuresJson, { 'measureId': measureId });
    return !measure;
}

updateMeasures();
