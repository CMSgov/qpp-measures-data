import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { info, error, warning } from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import { convertCsvToJson } from '../lib/csv-json-converter';
import { DataValidationError } from '../../errors';
import * as Lib from '../lib/measures-lib';

const PLACEHOLDER_STRATA = [{
    name: 'PLACEHOLDER',
    description: 'WARNING: Update strata file with new measure strata.'
}];

let strataPath: string;

export function updateMeasures(performanceYear: string, testMode: string = 'false') {

    const changesPath = `updates/measures/${performanceYear}/`;
    const measuresPath = `measures/${performanceYear}/measures-data.json`;    

    const changelog = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', `${changesPath}changes.meta.json`), 'utf8')
    );

    const measuresJson: any[] = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', measuresPath), 'utf8')
    );

    //to determine if any new changes need to be written to measures-data.json.
    let numOfNewChangeFiles = 0;

    const fileNames = fs.readdirSync(path.join(appRoot + '', changesPath));

    fileNames.forEach(fileName => {
        if (fileName != 'changes.meta.json') {
            //find only the change files not yet present in the changelog.
            if (!changelog.includes(fileName)) {
                numOfNewChangeFiles++;
                exports.ingestChangeFile(fileName, changesPath, performanceYear, measuresJson, testMode);
            }
        }
    });

    if (numOfNewChangeFiles > 0) {
        if (testMode === 'false'){
            Lib.writeToFile(measuresJson, measuresPath);
        }
    } else {
        warning('No new change files found.');
    }
}

export function ingestChangeFile(
    fileName: string,
    changesPath: string,
    performanceYear: string,
    measuresJson: any,
    testMode: string = 'false',
): number {
    strataPath = `util/measures/${performanceYear}/`;

    const csv = fs.readFileSync(path.join(appRoot + '', `${changesPath}${fileName}`), 'utf8');

    try {
        const changeData = convertCsvToJson(csv);

        const acceptedChangeStack: MeasuresChange[] = [],
            acceptedNewStack: MeasuresChange[] = [],
            acceptedDeleteStack: MeasuresChange[] = [];

        for (let i = 0; i < changeData.length; i++) {
            const change = changeData[i] as MeasuresChange;
            const measureId = change.measureId;

            if (!change.category) {
                throw new DataValidationError(measureId, 'Category is required.');
            } else {
                const isNew = Lib.isNewMeasure(measureId, measuresJson);
                //validation on the change request. Validation on the updated measures data happens later in update-measures.
                const validate = initValidation(measureType[change.category], isNew);

                if (!isNew) {
                    if (change.firstPerformanceYear) warning(
                        `'${measureId}': 'First Performance Year' was changed. Was this deliberate?`
                    );
                    if (!_.isUndefined(change.isInverse)) warning(
                        `'${measureId}': 'isInverse' was changed. Was this deliberate?`
                    );
                    if (Lib.isMultiPerfRateChanged(change, measuresJson) && change.metricType) warning(
                        `'${measureId}': 'Metric Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.overallAlgorithm) warning(
                        `'${measureId}': 'Calculation Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.metricType || change.isHighPriority || change.isInverse) warning(
                        `'${measureId}': 'Metric Type', 'High Priority', and/or 'Inverse' were changed. Make sure benchmarks are also updated with a change request.`
                    );
                    if (!Lib.isValidECQM(change, measuresJson)) {
                        throw new DataValidationError(measureId, 'CMS eCQM ID is required if one of the collection types is eCQM.');
                    }
                }

                if (!Lib.isValidCostScore(change, measuresJson)) {
                    throw new DataValidationError(measureId, `'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
                }
                if (!Lib.isOutcomeHighPriority(change, measuresJson)) {
                    throw new DataValidationError(measureId, `'outcome' and 'intermediateOutcome' measures must always be High Priority.`);
                }
                if (isNew && change.metricType?.includes('ultiPerformanceRate')) {
                    warning(`'${measureId}': 'New MultiPerformanceRate measures require an update to the strata file.\n         Update strata file with new measure strata before merging into the repo.`);
                    change.strata = PLACEHOLDER_STRATA;

                    if (!change.overallAlgorithm) {
                        throw new DataValidationError(measureId, 'New multiPerformanceRate measures require a Calculation Type.');
                    }
                }
                if (isNew && !change.measureSets && Lib.isOnlyAdminClaims(change)) {
                    change.measureSets = [];
                }

                if (change.yearRemoved) {
                    acceptedDeleteStack.push(change);
                } else if (validate(change)) {
                    if (isNew) {
                        acceptedNewStack.push(change);
                    } else {
                        acceptedChangeStack.push(change);
                    }
                } else {
                    console.log(validate.errors);
                    throw new DataValidationError(measureId, `Validation Failed. More info logged above.`);
                }
            }
        }

        //ingest new measures
        for (let i = 0; i < acceptedNewStack.length; i++) {
            Lib.addMeasure(acceptedNewStack[i], measuresJson);
        }

        //ingest deleted measures
        for (let i = 0; i < acceptedDeleteStack.length; i++) {
            Lib.deleteMeasure(acceptedDeleteStack[i].measureId, acceptedDeleteStack[i].category, measuresJson, strataPath);
        }

        //ingest changed measures
        for (let i = 0; i < acceptedChangeStack.length; i++) {
            Lib.updateMeasure(acceptedChangeStack[i], measuresJson);
        }

        if (testMode === 'false') {
            Lib.updateChangeLog(fileName, changesPath);
            info(`File '${fileName}' successfully ingested into measures-data ${performanceYear}`);
        }
        else {
            info(`File '${fileName}' successfully processed and validated, but not persisted in test mode (-t)`);
        }
        return 0;

    } catch (err) {
        if (err instanceof Error) {
            error(err['message']);
        } else {
            /* istanbul ignore next */
            throw err;
        }
        /* istanbul ignore next */
        if (process.argv[2] && process.argv[2] !== '--coverage')
            process.exit(1);
        return 1;
    }
}

/* istanbul ignore next */
if (process.argv[2] && process.argv[2] !== '--coverage')
    updateMeasures(process.argv[2], process.argv[3]);