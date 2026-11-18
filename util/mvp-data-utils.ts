import * as fse from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { Constants } from '../constants';
import { getMeasuresData } from '../index';
import { isCoreMeasureYear } from '../scripts/constants';
import { warning } from '../scripts/logger';
import { MVP } from '../scripts/mvp/mvps.types';
import { Category, Measure, Programs, QualityMeasure } from './interfaces/measure';

__dirname = __dirname.replace('/dist', '');
__dirname = __dirname.replace('\\dist', '');

export function createMVPDataFile(performanceYear: number): MVP[] {
    const basePath = path.resolve(__dirname, '..');
    const mvpFilePath = path.join(basePath, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
    const measureFilePath = path.join(basePath, 'measures', performanceYear.toString(), 'measures-data.json');

    let mvpData: MVP[] = [];
    let measuresData: Measure[] = [];
    try {
        mvpData = JSON.parse(
            fse.readFileSync(path.join(basePath, 'mvp', performanceYear.toString(), 'mvp.json'), 'utf8'));
        measuresData = getMeasuresData(performanceYear);
    } catch (e) {
        console.log('QPP mvp / measures data not found for year: ' + performanceYear + ' --> ' + e);
        return [];
    }

    const mvpIds: Programs[] = [];
    mvpData.forEach(mvpDataItem => {
        if (mvpDataItem.mvpId !== Programs.APP1) {
            mvpIds.push(mvpDataItem.mvpId);
        }
    });

    // Reset the allowedPrograms to remove any MVP ID program names (we will add them back later in the process)
    // This allows for removal of a measure from an MVP data item
    measuresData.forEach(measure => {
        measure.allowedPrograms = measure.allowedPrograms ? measure.allowedPrograms.filter(program => !mvpIds.includes(program)) : [];
    });

    if (isCoreMeasureYear(performanceYear)) {
        exports.populateCoreMeasureFor(mvpData, measuresData);
    }

    // Hydrate measures
    mvpData.forEach(mvp => {
        Constants.mvpMeasuresHelper.forEach(item => {
            mvp[item.enrichedMeasureKey] = [];
            exports.populateMeasuresforMVPs(mvp, mvpData, measuresData, item.measureIdKey, item.enrichedMeasureKey);
        });

        mvp.hasOutcomeAdminClaims = !_.isEmpty(mvp.administrativeClaimsMeasureIds);
    });

    mvpData.forEach(mvp => {
        Constants.mvpMeasuresHelper.forEach(item => {
            delete mvp[item.measureIdKey];
        });
        // Core status lives on the enriched measures (isCoreMeasure/coreMeasureFor), not on the enriched MVP.
        delete mvp.coreQualityMeasureIds;
    });

    fse.writeFileSync(mvpFilePath, JSON.stringify(mvpData, null, 2));
    fse.writeFileSync(measureFilePath, JSON.stringify(measuresData, null, 2));

    return mvpData;
}

export function populateMeasuresforMVPs(
    currentMvp: MVP,
    allMvps: MVP[],
    measuresData: Measure[],
    measureIdKey: string,
    enrichedMeasureKey: string
): void {
    currentMvp[measureIdKey].forEach((measureId: string) => {
        const measure = measuresData.find(measure => measure.measureId === measureId);

        if (measure) {
            allMvps.forEach(mvp => {
                // update measuresData with MVP programNames.
                if (mvp[measureIdKey].includes(measureId)) {
                    measure.allowedPrograms.push(mvp.mvpId);
                }
            });
            measure.allowedPrograms = _.uniq(measure.allowedPrograms);

            if (measure.measureId === '321') {
                currentMvp.hasCahps = true;
            }

            // update mvp-data with measures.
            currentMvp[enrichedMeasureKey].push(measure);
        }
    });
}

/**
 * PY2027+. Rebuilds coreMeasureFor on every quality measure from each MVP's coreQualityMeasureIds.
 * Disagreements with isCoreMeasure (owned by the Quality change request) are warnings only.
 */
export function populateCoreMeasureFor(mvpData: MVP[], measuresData: Measure[]): void {
    const qualityMeasures = measuresData.filter(measure => measure.category === Category.QUALITY) as QualityMeasure[];

    // Reset, so a measure removed from an MVP's core list loses that MVP.
    qualityMeasures.forEach(measure => {
        measure.coreMeasureFor = [];
        if (typeof measure.isCoreMeasure !== 'boolean') {
            measure.isCoreMeasure = false;
        }
    });

    mvpData.forEach(mvp => {
        (mvp.coreQualityMeasureIds ?? []).forEach(measureId => {
            const measure = qualityMeasures.find(qualityMeasure => qualityMeasure.measureId === measureId);
            if (!measure) {
                warning(`Core Quality measure '${measureId}' for MVP '${mvp.mvpId}' was not found in measures-data.json.`);
                return;
            }
            measure.coreMeasureFor!.push(mvp.mvpId);
        });
    });

    qualityMeasures.forEach(measure => {
        measure.coreMeasureFor = _.uniq(measure.coreMeasureFor).sort();

        if (!measure.isCoreMeasure && measure.coreMeasureFor.length > 0) {
            warning(`'${measure.measureId}' is a Core Quality measure for ${measure.coreMeasureFor.join(', ')} in the MVP source file, but isCoreMeasure is false.`);
        } else if (measure.isCoreMeasure && measure.coreMeasureFor.length === 0) {
            warning(`'${measure.measureId}' has isCoreMeasure set to true, but is not a Core Quality measure for any MVP in the MVP source file.`);
        }
    });
}
