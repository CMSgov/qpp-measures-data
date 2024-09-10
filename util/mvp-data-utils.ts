import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Constants } from '../constants';
import { getMeasuresData } from '../index';

__dirname = __dirname.replace('/dist', '');
__dirname = __dirname.replace('\\dist', '');

export function createMVPDataFile(performanceYear: number): any {
    const basePath = path.resolve(__dirname, '..');
    const mvpFilePath = path.join(basePath, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
    const measureFilePath = path.join(basePath, 'measures', performanceYear.toString(), 'measures-data.json');

    let mvpData: any[] = [];
    let measuresData: any[] = [];
    try {
        mvpData = JSON.parse(
            fse.readFileSync(path.join(basePath, 'mvp', performanceYear.toString(), 'mvp.json'), 'utf8'));
        measuresData = getMeasuresData(performanceYear);
    } catch (e) {
        console.log('QPP mvp / measures data not found for year: ' + performanceYear + ' --> ' + e);
        return [];
    }

    const mvpIds: any[] = [];
    mvpData.forEach(mvpDataItem => {
        if (mvpDataItem.mvpId !== 'app1') {
            mvpIds.push(mvpDataItem.mvpId);
        }
    });

    // Reset the allowedPrograms to remove any MVP ID program names (we will add them back later in the process)
    // This allows for removal of a measure from an MVP data item
    measuresData.forEach(measure => {
        measure.allowedPrograms = measure.allowedPrograms ? measure.allowedPrograms.filter(program => !mvpIds.includes(program)) : [];
    });

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
    });

    fse.writeFileSync(mvpFilePath, JSON.stringify(mvpData, null, 2));
    fse.writeFileSync(measureFilePath, JSON.stringify(measuresData, null, 2));

    return mvpData;
}

export function populateMeasuresforMVPs(
    currentMvp: any,
    allMvps: any[],
    measuresData: any[],
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
