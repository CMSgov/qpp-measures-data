// Libraries
import * as fse from 'fs-extra';
import * as path from 'path';
import * as YAML from 'yaml';
import _ from 'lodash';
import Constants from './constants';
import { BenchmarkSchema } from './types/benchmark-schema';
import { BenchmarkExclusionReason } from './types/benchmark-exclusion-reason';
import { CostNationalAverage } from './types/cost-national-average';
import { BenchmarksByYear } from './types/benchmarks-by-year';
import { CostNationalAveragesSchema } from "./types/cost-national-averages-schema";
import { Measure } from "./types/measure";
import { MeasureSchema } from "./types/measures-schema";
import { ClinicalClusterData } from "./types/clinical-cluster-data";
import { ClinicalClusterSchema } from "./types/clinical-cluster-schema";
import { MVPData, MVPDataSlim } from './types/mvp-data';

const yearRegEx = /^[0-9]{4}/;
const benchmarkJsonFileRegEx = /^[0-9]{4}\.json$/;


export function getValidPerformanceYears(): number[] {
    return Constants.validPerformanceYears;
}

export function updateProgramNames(performanceYear: number): void {
    let programNames: Record<string, string>;
    const programNamesFilePath = path.join(__dirname, 'util/program-names', 'program-names.json');
    const mvpFilePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json');

    let mvpData: MVPData[] = [];

    try {
        programNames = JSON.parse(fse.readFileSync(programNamesFilePath, 'utf8'));
        mvpData = JSON.parse(fse.readFileSync(mvpFilePath, 'utf8'));

        mvpData.forEach(mvp => {
            if (!programNames[mvp.mvpId]) {
                programNames[mvp.mvpId] = mvp.mvpId;
            }
        });

        fse.writeFileSync(programNamesFilePath, JSON.stringify(programNames, null, 2));
    } catch (e) {
        console.log('Error parsing the program-names.json or mvp.json file: ' + ' --> ' + e);
    }
}

export function getProgramNames(): Record<string, string> {
    const programNamesFilePath = path.join(__dirname, 'util/program-names', 'program-names.json');

    try {
        return JSON.parse(fse.readFileSync(programNamesFilePath, 'utf8'));
    } catch (e) {
        console.log('Error parsing the program-names.json file: ' + ' --> ' + e);
        return {};
    }
}

export function getBenchmarksData(): BenchmarksByYear {
    const benchmarksByYear: BenchmarksByYear = {};

    getBenchmarksYears().forEach(year => {
        benchmarksByYear[year] = JSON.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', `${year}.json`), 'utf8'));
    });

    return benchmarksByYear;
}

export function getBenchmarksYears(): number[] {
    const benchmarksYears = new Set<number>();

    fse.readdirSync(path.join(__dirname, 'benchmarks')).forEach(file => {
        if (benchmarkJsonFileRegEx.test(file)) {
            benchmarksYears.add(+file.match(yearRegEx)![0]);
        }
    });

    return Array.from(benchmarksYears);
}

export function getBenchmarksSchema(performanceYear: number = Constants.currentPerformanceYear): BenchmarkSchema {
    return YAML.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'benchmarks-schema.yaml'), 'utf8'));
}

export function getBenchmarksExclusionReasons(performanceYear: number = Constants.currentPerformanceYear): BenchmarkExclusionReason[] {
    return JSON.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'benchmark-exclusion-reasons.json'), 'utf8'));
}

export function getBenchmarksNationalAverages(performanceYear: number = Constants.currentPerformanceYear): CostNationalAverage[] {
    return JSON.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'cost-national-averages.json'), 'utf8'));
}

export function getBenchmarksNationalAveragesSchema(performanceYear: number = Constants.currentPerformanceYear): CostNationalAveragesSchema {
    return YAML.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'cost-national-averages-schema.yaml'), 'utf8'));
}

export function getMeasuresData(performanceYear: number = 2017): Measure[] {
    return JSON.parse(fse.readFileSync(path.join(__dirname, 'measures', performanceYear.toString(), 'measures-data.json'), 'utf8'));
}

export function getMeasuresSchema(performanceYear: number = 2017): MeasureSchema {
    return YAML.parse(fse.readFileSync(path.join(__dirname, 'measures', performanceYear.toString(), 'measures-schema.yaml'), 'utf8'));
}

export function getClinicalClusterData(performanceYear: number = 2017): ClinicalClusterData {
    let clusterData: ClinicalClusterData = [];
    try {
        clusterData = JSON.parse(fse.readFileSync(path.join(__dirname, 'clinical-clusters', performanceYear.toString(), 'clinical-clusters.json'), 'utf8'));
    } catch (e) {
        console.log('QPP measures data not found for year: ' + performanceYear + ' --> ' + e);
    }
    return clusterData;
}

export function getClinicalClusterSchema(performanceYear: number = 2023): ClinicalClusterSchema[] {
    return YAML.parse(fse.readFileSync(path.join(__dirname, 'clinical-clusters', performanceYear.toString(), 'clinical-clusters-schema.yaml'), 'utf8'));
}

export function getMVPData(performanceYear: number = 2023, mvpIds: string[] = []) {
    const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
    let mvpData;

    if (fse.existsSync(filePath)) {
        mvpData = JSON.parse(fse.readFileSync(filePath, 'utf8'));
    } else {
        mvpData = createMVPDataFile(performanceYear);
    }

    if (mvpIds.length) {
        mvpData = mvpData.filter(mvpDataItem => mvpIds.includes(mvpDataItem.mvpId));
    }

    return mvpData;
}

export function createMVPDataFile(performanceYear: number): MVPData[] {
    const mvpFilePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
    const measureFilePath = path.join(__dirname, 'measures', performanceYear.toString(), 'measures-data.json');

    let mvpData: MVPData[] = [];
    let measuresData: Measure[] = [];
    try {
        mvpData = JSON.parse(fse.readFileSync(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json'), 'utf8'));
        measuresData = getMeasuresData(performanceYear);
    } catch (e) {
        console.log('QPP mvp / measures data not found for year: ' + performanceYear + ' --> ' + e);
        return [];
    }

    const mvpIds: string[] = [];
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
            populateMeasuresforMVPs(mvp, mvpData, measuresData, item.measureIdKey, item.enrichedMeasureKey);
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
    currentMvp,
    allMvps,
    measuresData,
    measureIdKey,
    enrichedMeasureKey
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

export function getMVPSchema(performanceYear: number = 2023): any {
    return YAML.parse(fse.readFileSync(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-schema.yaml'), 'utf8'));
}

export function getMVPDataSlim(performanceYear: number = 2023): any[] {
    const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json');
    let mvpData: any[] = [];

    if (fse.existsSync(filePath)) {
        mvpData = JSON.parse(fse.readFileSync(filePath, 'utf8'));
        mvpData.forEach(mvp => {
            mvp.measureIds = [].concat(
                mvp.qualityMeasureIds,
                mvp.iaMeasureIds,
                mvp.costMeasureIds,
                mvp.foundationPiMeasureIds,
                mvp.foundationQualityMeasureIds,
                mvp.administrativeClaimsMeasureIds
            );
        });
    } else {
        console.log('mvp.json file does not exist');
    }

    return mvpData;
}
