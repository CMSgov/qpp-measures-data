/**
 * @MeasuresLibrary
 *  This is a library of utility functions behind maintaining the measures data.
 *  It provides the needed functions for finding all new measures change files,
 *  validating their data and structure, and updating/adding the specified measures.
 */

import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import appRoot from 'app-root-path';

import { info, warning } from '../../logger';
import { MeasuresChange } from '../lib/validate-change-requests';
import { DataValidationError } from '../../errors';
import {
    COST_DEFAULT_PROGRAMS,
    COST_DEFAULT_VALUES,
    COST_MEASURES_ORDER,
    IA_DEFAULT_PROGRAMS,
    IA_DEFAULT_VALUES,
    IA_MEASURES_ORDER,
    PI_DEFAULT_PROGRAMS,
    PI_DEFAULT_VALUES,
    PI_MEASURES_ORDER,
    QCDR_MEASURES_ORDER,
    QUALITY_DEFAULT_PROGRAMS,
    QUALITY_DEFAULT_VALUES,
    QUALITY_MEASURES_ORDER
} from '../../constants';
import { AggregateCostMeasure, IAMeasure, Measure, PIMeasure, QualityMeasure } from '../../../util/interfaces';
import { Category } from '../../../util/interfaces/measure';

/**
 * Adds the change file csv to the array in changes.meta.json.
 * This allows us to track which files are new and which have already been ingested.
 */
export function updateChangeLog(fileName: string, changesPath: string) {
    const changelog = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', `${changesPath}changes.meta.json`), 'utf8')
    );
    changelog.push(fileName);

    writeToFile(changelog, `${changesPath}changes.meta.json`);
}

/**
 * Deletes the specified measure by: 
 *  (1) Removing it from measures-data.json
 *  (2) Deleting it's strata from the related strata.csv
 *  (3) Removing any reference of it from other measures' exlusion or substitute arrays
 */
export function deleteMeasure(measureId: string, category: string, measuresJson: Measure[], strataPath: string) {
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

        // Find and remove all instances of the measureId from exclusion and substute arrays of other measures.
        deepDeleteMeasureId(measureId, measuresJson);

        info(`Measure '${measureId}' removed.`);
    } else {
        warning(`Attempted to delete ${measureId}, but not found.`);
    }
}

/**
 * Updates the specified measure.
 * Will throw a warning if any changed exclusions or substitutes do not exist in the measures-data.json.
 */
export function updateMeasure(change: MeasuresChange, measuresJson: Measure[], performanceYear?: string) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
            // check if new exclusions and substitutes exist.
            if (change.substitutes) {
                existanceCheckForMeasureArray(change.substitutes, change.measureId, measuresJson, 'Substitute');
            }
            if (change.exclusion) {
                existanceCheckForMeasureArray(change.exclusion, change.measureId, measuresJson, 'Exclusion');
            }
            if (change.companionMeasureId) {
                existanceCheckForMeasureArray(change.companionMeasureId, change.measureId, measuresJson, 'companionMeasureId');
            }

            measuresJson[i] = {
                ...measuresJson[i],
                ...change,
                category: change.category === Category.QCDR ? Category.QUALITY : change.category,
            } as Measure;
            if (change.category === 'quality') {
                measuresJson[i] = {
                    ...measuresJson[i],
                    ...updateBenchmarksMetaData(change, performanceYear),
                }
            }
            orderFields(measuresJson[i]);
            info(`Measure '${change.measureId}' updated.`);
            break;
        }
    }
}

/**
 * Adds the specified measure.
 * Will throw a warning if any of its exclusions or substitutes do not exist in the measures-data.json.
 * Sets any default values for the measure type and orders the fields (based on /constants.ts).
 */
export function addMeasure(change: MeasuresChange, measuresJson: Measure[]) {
    // check if new exclusions and substitutes exist.
    if (change.substitutes) {
        existanceCheckForMeasureArray(change.substitutes, change.measureId, measuresJson, 'Substitute', true);
    }
    if (change.exclusion) {
        existanceCheckForMeasureArray(change.exclusion, change.measureId, measuresJson, 'Exclusion', true);
    }

    const index = findFinalInCategory(change.category, measuresJson);
    switch (change.category) {
        case 'ia': {
            measuresJson.splice(index + 1, 0, orderFields({
                ...IA_DEFAULT_VALUES,
                ...change,
                allowedPrograms: IA_DEFAULT_PROGRAMS,
            } as IAMeasure));
            break;
        }
        case 'pi': {
            const preprod = populatePreProdArray(change, measuresJson);
            measuresJson.splice(index + 1, 0, orderFields({
                ...PI_DEFAULT_VALUES,
                ...change,
                preprod,
                allowedPrograms: PI_DEFAULT_PROGRAMS,
            } as PIMeasure));
            break;
        }
        case 'cost': {
            measuresJson.splice(index + 1, 0, orderFields({
                ...COST_DEFAULT_VALUES,
                ...change,
                category: 'cost',
                allowedPrograms: COST_DEFAULT_PROGRAMS,
            } as AggregateCostMeasure));
            break;
        }
        case 'quality': {
            measuresJson.splice(index + 1, 0, orderFields({
                ...QUALITY_DEFAULT_VALUES,
                ...change,
                isRegistryMeasure: false,
                allowedPrograms: QUALITY_DEFAULT_PROGRAMS,
                companionMeasureId: [],
            } as QualityMeasure));
            break;
        }
        case 'qcdr': {
            measuresJson.splice(index + 1, 0, orderFields({
                ...QUALITY_DEFAULT_VALUES,
                ...change,
                category: 'quality',
                isRegistryMeasure: true,
                allowedPrograms: QUALITY_DEFAULT_PROGRAMS,
            } as QualityMeasure));
            break;
        }
    }
    info(`New measure '${change.measureId}' added.`);
}

/**
 * A valid eCQM measure (submissionMethods = electronicHealthRecord) must 
 * have a eMeasureId. If neither or both are true, this function passes.
 */
export function isValidECQM(change: MeasuresChange, measuresJson: Measure[]): boolean {
    if (['quality', 'qcdr'].includes(change.category)) {
        const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId }) as QualityMeasure;

        const eMeasureId = change.eMeasureId ? change.eMeasureId : currentMeasure?.eMeasureId;

        if (change.submissionMethods?.includes('electronicHealthRecord') && !eMeasureId) {
            return false;
        }
    }
    return true;
}

/**
 * A valid Cost measure has a metricType of costScore and only adminstrativeClaims as submissionMethods.
 */
export function isValidCostScore(change: MeasuresChange, measuresJson: Measure[]): boolean {
    if (['quality', 'qcdr', 'cost'].includes(change.category)) {
        const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId }) as QualityMeasure | AggregateCostMeasure;

        const type = change.metricType ? change.metricType : currentMeasure?.metricType;
        const methods = change.submissionMethods ? change.submissionMethods : currentMeasure?.submissionMethods;

        if (type === 'costScore' && (!methods?.includes('administrativeClaims') || methods?.length !== 1)) {
            return false;
        }
    }
    return true;
}

/**
 * 'outcome' and 'intermediateOutcome' measures must always be High Priority.
 */
export function isOutcomeHighPriority(change: MeasuresChange, measuresJson: Measure[]): boolean {
    if (['quality', 'qcdr'].includes(change.category)) {
        const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId }) as QualityMeasure;

        const type = change.measureType ? change.measureType : currentMeasure?.measureType;
        const isHighPriority = change.isHighPriority ? change.isHighPriority : currentMeasure?.isHighPriority;

        if (type?.includes('utcome') && !isHighPriority) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if the measure being modified/added is a multiPerformanceRate.
 */
export function isMultiPerfRateChanged(change: MeasuresChange, measuresJson: Measure[]): boolean {
    const currentMeasure = _.find(measuresJson, { 'measureId': change.measureId });
    
    if (!currentMeasure) {
        //throw error if the measure does not exist in measuresJson
        throw new DataValidationError(change.measureId, `Measure does not exist in measures-data.json.`);
    }

    return change.metricType?.includes('ultiPerformanceRate') || currentMeasure.metricType?.includes('ultiPerformanceRate');
}

/**
 * Writes a JSON object to a .json file at the local file path.
 */
export function writeToFile(file: any, filePath: string) {
    fs.writeFileSync(path.join(appRoot + '', filePath), JSON.stringify(file, null, 2));
}

/**
 * Checks if the measure already exists for the current year.
 */
export function isNewMeasure(measureId: string, measuresJson: Measure[]): boolean {
    const measure = _.find(measuresJson, { 'measureId': measureId });
    return !measure;
}

/**
 * Checks if the submissionMethod is administrativeClaims and nothing else included.
 */
export function isOnlyAdminClaims(change: MeasuresChange): boolean {
    return (
        change.submissionMethods?.length === 1 &&
        change.submissionMethods[0] === 'administrativeClaims'
    );
}

/**
 * Organizes the fields of the modified measure based on its category.
 * This keeps the measures consistent when written to the json file.
 */
function orderFields(measure: Measure): Measure {
    switch (measure.category) {
        case 'pi':
            return Object.assign({}, PI_MEASURES_ORDER, measure);
        case 'ia':
            return Object.assign({}, IA_MEASURES_ORDER, measure);
        case 'cost':
            return Object.assign({}, COST_MEASURES_ORDER, measure);
        case 'quality':
            if (measure.isRegistryMeasure) {
                return Object.assign({}, QCDR_MEASURES_ORDER, measure);
            }
            return Object.assign({}, QUALITY_MEASURES_ORDER, measure);
        default:
            throw new DataValidationError(measure.measureId, `Measures category '${measure.category}' is not recognized.`);

    }
}

/**
 * Finds and returns the _PRE and _PROD measures that corrospond with the
 * current measure, if they exist.
 */
function populatePreProdArray(change: MeasuresChange, measuresJson: Measure[]): string[] | undefined {
    if (change.measureId.includes('_PRE') || change.measureId.includes('_PROD')) {
        return undefined;
    }

    const pre = _.find(measuresJson, { measureId: `${change.measureId}_PRE` });
    const prod = _.find(measuresJson, { measureId: `${change.measureId}_PROD` });

    return _.compact([pre?.measureId, prod?.measureId]);
}

/**
 * Updates the fields indicating whether ICD, Clinical Guidelines, or the Seven Point Cap removal are impacted
 * based on the presence and length of respective arrays in the measure change data.
 */
export function updateBenchmarksMetaData(
    change: MeasuresChange,
    performanceYear?: string
): {
    isIcdImpacted: boolean,
    isClinicalGuidelineChanged: boolean,
    isSevenPointCapRemoved?: boolean,
} {
    return {
        isIcdImpacted: !!(change.icdImpacted && change.icdImpacted.length),
        isClinicalGuidelineChanged: !!(change.clinicalGuidelineChanged && change.clinicalGuidelineChanged.length),
        ...(performanceYear && parseInt(performanceYear, 10) > 2024 && {
            isSevenPointCapRemoved: Array.isArray(change.sevenPointCapRemoved) && change.sevenPointCapRemoved.length > 0,
        }),
    };
}


/**
 * Returns the last measure of a specified category in the measures json.
 * This allows us to add new measures to the end of its category instead of the end of the file.
 */
function findFinalInCategory(category: string, measuresJson: Measure[]): number {
    let index: number = 0;
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].category === category) {
            if (['ia', 'pi', 'cost'].includes(category)) {
                index = i;
            }
            else if (
                category === 'quality' &&
                !measuresJson[i]['isRegistryMeasure'] &&
                !['cahps', 'costScore'].includes(measuresJson[i].metricType)
            ) {
                index = i;
            }
        }
        else if (
            category === 'qcdr' &&
            measuresJson[i].category === 'quality' &&
            !measuresJson[i]['isRegistryMeasure']
        ) {
            index = i;
        }
    }
    return index;
}

/**
 * Takes a strata csv file, parses it into a 2D array, and removes all lines for the specified measureId.
 */
function removeStrata(measureId: string, strata: string): string {

    // Get an array of comma separated lines
    const linesExceptFirst = strata.split('\n').slice(0);

    // Turn that into a data structure we can parse (array of arrays)
    const linesArr = linesExceptFirst.map(line => line.split(','));

    const output = linesArr.filter(line => line[0] !== measureId).join("\n");

    return output;

}

/**
 * Checks if measureIds in the measureId array of the modified measure exist
 * as measures in the measures json files. If not, raises a warning if the measure is being updated
 * and throws an error if the measure is being added.
 */
function existanceCheckForMeasureArray(
    measureIds: string[],
    measureId: string,
    measuresJson: Measure[],
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

/**
 * Removes the specified measureId from all measures' substitutes and exclusions arrays.
 */
function deepDeleteMeasureId(measureId: string, measuresJson: Measure[]) {
    for (let i = 0; i < measuresJson.length; i++) {
        const measure = measuresJson[i];
        if (measure.category === 'pi') {
            const substitutes = measure.substitutes;
            const exclusion = measure.exclusion;

            if (substitutes) {
                measure.substitutes = removeStringFromArray(measureId, substitutes);
            }
            if (exclusion) {
                measure.exclusion = removeStringFromArray(measureId, exclusion);
            }
            
            measuresJson[i] = measure; // Update the measure in the array
        }
    }
}

/**
 * Removes a specified string from an array of strings, returning the updated array.
 */
function removeStringFromArray(str: string, arr: string[]): string[] {
    return arr.filter((strAtIndex: string) => strAtIndex !== str);
}
