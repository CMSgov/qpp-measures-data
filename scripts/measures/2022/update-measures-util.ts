/**
 * @UpdateMeasuresUtil
 *  This is the primary script behind maintaining the measures data.
 *  It finds all new measures change files, validates their data and
 * structure, updates/adds the specified measures, and reports and 
 * success or error messages back to the user.
 *  Currently, this script is designed to intake CSVs, but will be 
 * refactored to accept JSON files once the front-end is created.
 */

import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import appRoot from 'app-root-path';

import { info, error, warning } from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import { convertCsvToJson } from '../lib/csv-json-converter';
import { DataValidationError } from '../../errors';
import {
    COST_MEASURES_ORDER,
    IA_DEFAULT_VALUES,
    IA_MEASURES_ORDER,
    PI_DEFAULT_VALUES,
    PI_MEASURES_ORDER,
    QCDR_MEASURES_ORDER,
    QUALITY_DEFAULT_VALUES,
    QUALITY_MEASURES_ORDER
} from '../../constants';

const QUALITY_DEFAULT_PROGRAMS = [
    'mips',
    'pcf',
];

const PLACEHOLDER_STRATA = [{
    name: 'PLACEHOLDER',
    description: 'WARNING: Update strata file with new measure strata.'
}];

let strataPath: string;

export function updateMeasuresWithChangeFile(
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
                const isNew = isNewMeasure(measureId, measuresJson);
                //validation on the change request. Validation on the updated measures data happens later in update-measures.
                const validate = initValidation(measureType[change.category], isNew);

                if (!isNew) {
                    if (change.firstPerformanceYear) warning(
                        `'${measureId}': 'First Performance Year' was changed. Was this deliberate?`
                    );
                    if (!_.isUndefined(change.isInverse)) warning(
                        `'${measureId}': 'isInverse' was changed. Was this deliberate?`
                    );
                    if (isMultiPerfRateChanged(change, measuresJson) && change.metricType) warning(
                        `'${measureId}': 'Metric Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.overallAlgorithm) warning(
                        `'${measureId}': 'Calculation Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.metricType || change.isHighPriority || change.isInverse) warning(
                        `'${measureId}': 'Metric Type', 'High Priority', and/or 'Inverse' were changed. Make sure benchmarks are also updated with a change request.`
                    );
                    if (!isValidECQM(change, measuresJson)) {
                        throw new DataValidationError(measureId, 'CMS eCQM ID is required if one of the collection types is eCQM.');
                    }
                }

                if (!isAllowedCostScore(change, measuresJson)) {
                    throw new DataValidationError(measureId, `'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
                }
                if (!isOutcomeHighPriority(change, measuresJson)) {
                    throw new DataValidationError(measureId, `'outcome' and 'intermediateOutcome' measures must always be High Priority.`);
                }
                if (isNew && change.metricType?.includes('ultiPerformanceRate')) {
                    warning(`'${measureId}': 'New MultiPerformanceRate measures require an update to the strata file.\n         Update strata file with new measure strata before merging into the repo.`);
                    change.strata = PLACEHOLDER_STRATA;

                    if (!change.overallAlgorithm) {
                        throw new DataValidationError(measureId, 'New multiPerformanceRate measures require a Calculation Type.');
                    }
                }
                if (isNew && !change.measureSets && isOnlyAdminClaims(change)) {
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
            exports.addMeasure(acceptedNewStack[i], measuresJson);
        }

        //ingest deleted measures
        for (let i = 0; i < acceptedDeleteStack.length; i++) {
            exports.deleteMeasure(acceptedDeleteStack[i].measureId, acceptedDeleteStack[i].category, measuresJson);
        }

        //ingest changed measures
        for (let i = 0; i < acceptedChangeStack.length; i++) {
            exports.updateMeasure(acceptedChangeStack[i], measuresJson);
        }

        if (testMode === 'false') {
            exports.updateChangeLog(fileName, changesPath);
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
        process.exit(1);
    }
}

export function updateChangeLog(fileName: string, changesPath: string) {
    const changelog = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', `${changesPath}changes.meta.json`), 'utf8')
    );
    changelog.push(fileName);

    writeToFile(changelog, `${changesPath}changes.meta.json`);
}

export function deleteMeasure(measureId: string, category: string, measuresJson: any) {
    const measureIndex = _.findIndex(measuresJson, { measureId });
    if (measureIndex > -1) {
        if (['quality', 'qcdr'].includes(category)) {
            //Get strata.
            const strata = fs.readFileSync(path.join(appRoot + '', `${strataPath}${category}-strata.csv`), 'utf8');
            //Update strata.
            const updatedStrata = removeStrata(measureId, strata);
            //Write out new file.
            fs.writeFileSync(`${strataPath}/${category}-strata.csv`, updatedStrata);
        }
        measuresJson.splice(measureIndex, 1);
        info(`Measure '${measureId}' removed.`);
    } else {
        warning(`Attempted to delete ${measureId}, but not found.`);
    }
}

export function updateMeasure(change: MeasuresChange, measuresJson: any) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            // check if new exclusions and substitutes exist.
            if (change.substitutes) {
                checkNewExclusionAndSubstitutes(change.substitutes, change.measureId, measuresJson, 'Substitute');
            }
            if (change.exclusion) {
                checkNewExclusionAndSubstitutes(change.exclusion, change.measureId, measuresJson, 'Exclusion');
            }

            measuresJson[i] = {
                ...measuresJson[i],
                ...change as any,
                category: change.category === 'qcdr' ? 'quality' : change.category,
            };
            if (change.category === 'quality') {
                measuresJson[i] = {
                    ...measuresJson[i],
                    ...updateBenchmarksMetaData(change),
                }
            }
            orderFields(measuresJson[i]);
            info(`Measure '${change.measureId}' updated.`);
            break;
        }
    }
}

export function addMeasure(change: MeasuresChange, measuresJson: any) {
    // check if new exclusions and substitutes exist.
    if (change.substitutes) {
        checkNewExclusionAndSubstitutes(change.substitutes, change.measureId, measuresJson, 'Substitute', true);
    }
    if (change.exclusion) {
        checkNewExclusionAndSubstitutes(change.exclusion, change.measureId, measuresJson, 'Exclusion', true);
    }

    const index = findFinalInCategory(change.category, measuresJson);
    switch (change.category) {
        case 'ia':
            measuresJson.splice(index + 1, 0, orderFields({
                ...IA_DEFAULT_VALUES,
                ...change,
            }));
            break;

        case 'pi':
            measuresJson.splice(index + 1, 0, orderFields({
                ...PI_DEFAULT_VALUES,
                ...change,
            }));
            break;

        case 'quality':
            measuresJson.splice(index + 1, 0, orderFields({
                ...QUALITY_DEFAULT_VALUES,
                ...change,
                isRegistryMeasure: false,
                allowedPrograms: QUALITY_DEFAULT_PROGRAMS,
            }));
            break;

        case 'qcdr':
            measuresJson.splice(index + 1, 0, orderFields({
                ...QUALITY_DEFAULT_VALUES,
                ...change,
                category: 'quality',
                isRegistryMeasure: true,
                allowedPrograms: QUALITY_DEFAULT_PROGRAMS,
            }));
            break;
    }
    info(`New measure '${change.measureId}' added.`);
}

// organizes the fields to match the order of that specific category in measures-data
function orderFields(measure: any) {
    if (measure.category === 'pi') {
        return Object.assign({}, PI_MEASURES_ORDER, measure)
    } else if (measure.category === 'ia') {
        return Object.assign({}, IA_MEASURES_ORDER, measure)
    } else if (measure.category === 'quality' && !measure.isRegistryMeasure) {
        return Object.assign({}, QUALITY_MEASURES_ORDER, measure)
    } else if (measure.category === 'quality' && measure.isRegistryMeasure) {
        return Object.assign({}, QCDR_MEASURES_ORDER, measure)
    } else if (measure.category === 'cost') {
        return Object.assign({}, COST_MEASURES_ORDER, measure)
    }
}

function isValidECQM(change: MeasuresChange, measuresJson: any): boolean {
    const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId });

    const eMeasureId: string = change.eMeasureId ? change.eMeasureId : currentMeasure?.eMeasureId;


    if (change.submissionMethods?.includes('electronicHealthRecord') && !eMeasureId) {
        return false;
    }
    return true;
}

function isAllowedCostScore(change: MeasuresChange, measuresJson: any): boolean {
    const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId });

    const type: string = change.metricType ? change.metricType : currentMeasure?.metricType;
    const methods: string = change.submissionMethods ? change.submissionMethods : currentMeasure?.submissionMethods;

    if (type === 'costScore' && (!methods?.includes('administrativeClaims') || methods?.length !== 1)) {
        return false;
    }
    return true;
}

function isOutcomeHighPriority(change: MeasuresChange, measuresJson: any): boolean {
    const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId });

    const type: string = change.measureType ? change.measureType : currentMeasure?.measureType;
    const isHighPriority: string = change.isHighPriority ? change.isHighPriority : currentMeasure?.isHighPriority;

    if (type?.includes('utcome') && !isHighPriority) {
        return false;
    }
    return true;
}

function isMultiPerfRateChanged(change: MeasuresChange, measuresJson: any): boolean {
    const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId });

    return change.metricType?.includes('ultiPerformanceRate') || currentMeasure.metricType?.includes('ultiPerformanceRate');
}

export function writeToFile(file: any, filePath: string) {
    fs.writeFileSync(path.join(appRoot + '', filePath), JSON.stringify(file, null, 2));
}

function updateBenchmarksMetaData(change: MeasuresChange): any {
    return {
        isIcdImpacted: change.icdImpacted ? !!change.icdImpacted.length : false,
        isClinicalGuidelineChanged: change.clinicalGuidelineChanged ? !!change.clinicalGuidelineChanged.length : false,
    };

}

function isNewMeasure(measureId: string, measuresJson: any) {
    const measure = _.find(measuresJson, { 'measureId': measureId });
    return !measure;
}

function findFinalInCategory(category: string, measuresJson: any) {
    let index: number = 0;
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].category === category) {
            if (['ia', 'pi'].includes(category)) {
                index = i;
            }
            else if (
                category === 'quality' &&
                !measuresJson[i].isRegistryMeasure &&
                !['cahps', 'costScore'].includes(measuresJson[i].metricType)
            ) {
                index = i;
            }
        }
        else if (
            category === 'qcdr' &&
            measuresJson[i].category === 'quality' &&
            !measuresJson[i].isRegistryMeasure
        ) {
            index = i;
        }
    }
    return index;
}

function removeStrata(measureId: string, strata: any): any {

    // Get an array of comma separated lines
    const linesExceptFirst = strata.split('\n').slice(0);

    // Turn that into a data structure we can parse (array of arrays)
    const linesArr = linesExceptFirst.map(line => line.split(','));

    const output = linesArr.filter(line => line[0] !== measureId).join("\n");

    return output;

}

function isOnlyAdminClaims(change: MeasuresChange) {
    return (
        change.submissionMethods?.length === 1 &&
        change.submissionMethods[0] === 'administrativeClaims'
    );
}

function checkNewExclusionAndSubstitutes(
    measureIds: string[],
    measureId: string,
    measuresJson: any,
    arrayType: string,
    isNew: boolean = false
) {
    for (let i = 0; i < measureIds.length; i++) {
        if (!_.find(measuresJson, { 'measureId': measureIds[i] })) {
            const rootMessage = `${arrayType} ${measureIds[i]} does not exist in the measures-data.json.`;

            if (isNew) {
                warning(`${measureId}: ${rootMessage} Was it added later in this change request?`);
            } else {
                throw new DataValidationError(measureId, `${rootMessage}`);
            }
        }
    }
}

