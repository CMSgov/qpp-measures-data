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
import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';

import { info, error, warning } from '../../logger';
import { initValidation, MeasuresChange, measureType } from '../lib/validate-change-requests';
import { convertCsvToJson } from '../lib/csv-json-converter';
import { DataValidationError } from '../lib/errors';
import {
    IA_DEFAULT_VALUES,
    PI_DEFAULT_VALUES,
    QUALITY_DEFAULT_VALUES
} from '../../constants';

export function updateMeasuresWithChangeFile(
    fileName: string,
    changesPath: string,
    performanceYear: string,
    measuresJson: any
) {
    const csv = fs.readFileSync(path.join(appRoot + '', `${changesPath}${fileName}`), 'utf8');
    try {
        const changeData = convertCsvToJson(csv);

        for (let i = 0; i < changeData.length; i++) {
            const change = changeData[i] as MeasuresChange;

            if (!change.category) {
                throw new DataValidationError(fileName, 'Category is required.');
            } else {
                const isNew = isNewMeasure(change.measureId, measuresJson);
                //validation on the change request. Validation on the updated measures data happens later in update-measures.
                const validate = initValidation(measureType[change.category], isNew);

                if (!isNew) {
                    if (change.firstPerformanceYear) warning(
                        `'${fileName}': 'First Performance Year' was changed. Was this deliberate?`
                    );
                    if (!_.isUndefined(change.isInverse)) warning(
                        `'${fileName}': 'isInverse' was changed. Was this deliberate?`
                    );
                    if (isMultiPerfRateChanged(change, measuresJson)) warning(
                        `'${fileName}': 'Metric Type' was changed. Was the strata file also updated to match?`
                    );
                    if (change.overallAlgorithm) warning(
                        `'${fileName}': 'Calculation Type' was changed. Was the strata file also updated to match?`
                    );
                    if (!isValidECQM(change, measuresJson)) {
                        throw new DataValidationError(fileName, 'CMS eCQM ID is required if one of the collection types is eCQM.');
                    }
                }

                if (!isAllowedCostScore(change, measuresJson)) {
                    throw new DataValidationError(fileName, `'costScore' metricType requires an 'administrativeClaims' submissionMethod.`);
                }
                if (!isOutcomeHighPriority(change, measuresJson)) {
                    throw new DataValidationError(fileName, `'outcome' and 'intermediateOutcome' measures must always be High Priority.`);
                }
                if (change.yearRemoved && change.yearRemoved !== +performanceYear) {
                    throw new DataValidationError(fileName, 'Year Removed is not current year.');
                }
                if (isNew && change.metricType?.includes('ultiPerformanceRate') && !change.overallAlgorithm) {
                    throw new DataValidationError(fileName, 'New multiPerformanceRate measures require a Calculation Type.');
                }

                if (change.yearRemoved) {
                    exports.deleteMeasure(change.measureId, measuresJson);
                } else if (validate(change)) {
                    if (isNew) {
                        exports.addMeasure(change, measuresJson);
                        info(`New measure '${change.measureId}' added.`);
                    } else {
                        exports.updateMeasure(change, measuresJson);
                        info(`Measure '${change.measureId}' updated.`);
                    }
                } else {
                    console.log(validate.errors);
                    throw new DataValidationError(fileName, `Validation Failed. More info logged above.`);
                }
            }
        }

        exports.updateChangeLog(fileName, changesPath);
        info(`File '${fileName}' successfully ingested into measures-data ${performanceYear}`);

    } catch (err) {
        if (err instanceof Error) {
            error(err['message']);
        } else {
            /* istanbul ignore next */
            throw err;
        }
    }
}

export function updateChangeLog(fileName: string, changesPath: string) {
    const changelog = JSON.parse(
        fs.readFileSync(path.join(appRoot + '', `${changesPath}changes.meta.json`), 'utf8')
    );
    changelog.push(fileName);

    writeToFile(changelog, `${changesPath}changes.meta.json`);
}

export function deleteMeasure(measureId: string, measuresJson: any) {
    const measureIndex = _.findIndex(measuresJson, { measureId });
    if (measureIndex > -1) {
        measuresJson.splice(measureIndex, 1);
        info(`Measure '${measureId}' removed.`);
    } else {
        throw new DataValidationError(measureId, 'Measure not found.');
    }
}

export function updateMeasure(change: MeasuresChange, measuresJson: any) {
    for (let i = 0; i < measuresJson.length; i++) {
        if (measuresJson[i].measureId == change.measureId) {
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
            break;
        }
    }
}

export function addMeasure(change: MeasuresChange, measuresJson: any) {
    const index = findFinalInCategory(change.category, measuresJson);
    switch (change.category) {
        case 'ia':
            measuresJson.splice(index+1, 0, {
                ...IA_DEFAULT_VALUES,
                ...change,
            });
            break;

        case 'pi':
            measuresJson.splice(index+1, 0, {
                ...PI_DEFAULT_VALUES,
                ...change,
            });
            break;

        case 'quality':
            measuresJson.splice(index+1, 0, {
                ...QUALITY_DEFAULT_VALUES,
                ...change,
                isRegistryMeasure: false,
            });
            break;

        case 'qcdr':
            measuresJson.splice(index+1, 0, {
                ...QUALITY_DEFAULT_VALUES,
                ...change,
                category: 'quality',
                isRegistryMeasure: true,
            });
            break;
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

