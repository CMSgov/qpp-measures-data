// Libraries
import * as fse from 'fs-extra';
import * as path from 'path';
import * as YAML from 'yaml';
import * as _ from 'lodash';
import { Constants } from './constants';
import { ProgramNames } from './util/interfaces/program-names';
import { BenchmarksData } from './util/interfaces/benchmarks';
import { BenchmarksExclusionReasons } from './util/interfaces/benchmarks-exclusion-reasons';
import { CostNationalAverage } from "./util/interfaces/cost-national-average";
import { Measure } from './util/interfaces/measure';
import { ClinicalCluster } from './util/interfaces/clinical-cluster';

const yearRegEx = /^[0-9]{4}/;
const benchmarkJsonFileRegEx = /^[0-9]{4}\.json$/;

/**
 * @return {Array<number>}
 * An array of all the years that the library has data for
 */
export function getValidPerformanceYears(): number[] {
  return Constants.validPerformanceYears;
}

/**
 *
 * @return {void}
 * Adds any new program name fields from the mvp.json file for the given performance year
 */
export function updateProgramNames(performanceYear: number): void {
  let programNames: any;
  const programNamesFilePath = path.join(__dirname, 'util/program-names', 'program-names.json');
  const mvpFilePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json');

  let mvpData: any[] = [];

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

/**
 *
 * @return {ProgramNames | undefined} - program names -
 * An object keyed by program name containing the current program names
 */
export function getProgramNames(): ProgramNames | undefined {
  const programNamesFilePath = path.join(__dirname, 'util/program-names', 'program-names.json');

  try {
    return JSON.parse(fse.readFileSync(programNamesFilePath, 'utf8'));
  } catch (e) {
    console.log('Error parsing the program-names.json file: ' + ' --> ' + e);
  }
}

/**
 *
 * @return {BenchmarksData} - benchmarks data -
 * An object keyed by performance year with array values
 * containing the benchmarks for that performance year
 */
export function getBenchmarksData(): BenchmarksData {
  const benchmarksByYear: any = {};

  getBenchmarksYears().forEach(function (year) {
    benchmarksByYear[year] = JSON.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', `${year}.json`), 'utf8'));
  });

  return benchmarksByYear;
}

/**
 *
 * @return {Array<number>}
 * An array of years that the library has benchmarks for
 */
export function getBenchmarksYears(): number[] {
  const benchmarksYears = new Set<number>();

  fse.readdirSync(path.join(__dirname, 'benchmarks')).forEach(function (file) {
    const match = file.match(yearRegEx);
    if (benchmarkJsonFileRegEx.test(file) && match) {
      benchmarksYears.add(+match[0]);
    }
  });

  return Array.from(benchmarksYears);
}

/**
 * @return {any} - Object representation of the Benchmarks Schema
 */
export function getBenchmarksSchema(performanceYear: number = Constants.currentPerformanceYear): any {
  return YAML.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'benchmarks-schema.yaml'), 'utf8'));
}

/**
 * @param {number} performanceYear - The performance year to get the exclusion reasons for.
 * @return {BenchmarksExclusionReasons[]} - The exclusion reasons for the given performance year.
 **/
export function getBenchmarksExclusionReasons(performanceYear: number = Constants.currentPerformanceYear): BenchmarksExclusionReasons[] | undefined  {
  return JSON.parse(
      fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'benchmark-exclusion-reasons.json'), 'utf8'));
}

/**
 * @param {number} performanceYear - The performance year to get the national averages for.
 * @return {CostNationalAverages[]} - The national averages for the given performance year.
 **/
export function getBenchmarksNationalAverages(performanceYear: number = Constants.currentPerformanceYear): CostNationalAverage[] {
  return JSON.parse(
      fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'cost-national-averages.json'), 'utf8'));
}

/**
 * @return {any} - Object representation of the National Averages Schema
 */
export function getBenchmarksNationalAveragesSchema(performanceYear: number = Constants.currentPerformanceYear): any {
  return YAML.parse(fse.readFileSync(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'cost-national-averages-schema.yaml'), 'utf8'));
}

/**
 * @param {number} performanceYear - The performance year for which to load the measures data.
 * @return {Measure[]} An array of measure objects conforming to the Measure type definition.
 **/
export function getMeasuresData(performanceYear: number = 2017): Measure[] {
  return JSON.parse(
      fse.readFileSync(path.join(__dirname, 'measures', performanceYear.toString(), 'measures-data.json'), 'utf8'));
}

/**
 * @return {any} - Object representation of the Measures Schema
 */
export function getMeasuresSchema(performanceYear: number = 2017): any {
  return YAML.parse(fse.readFileSync(path.join(__dirname, 'measures', performanceYear.toString(), 'measures-schema.yaml'), 'utf8'));
}

/**
 * @param {number} performanceYear - The performance year for which to load the clinical cluster data.
 * * @return {ClinicalCluster[]} An array of cluster objects conforming to the ClinicalCluster definition.
 **/
export function getClinicalClusterData(performanceYear: number = 2017): ClinicalCluster[] {
  let clusterData: any[] = [];
  try {
    clusterData = JSON.parse(
        fse.readFileSync(path.join(__dirname, 'clinical-clusters', performanceYear.toString(), 'clinical-clusters.json'), 'utf8'));
  } catch (e) {
    console.log('QPP measures data not found for year: ' + performanceYear + ' --> ' + e);
  }
  return clusterData;
}

/**
 * @return {any} - Object representation of the Clinical Cluster Schema
 */
export function getClinicalClusterSchema(performanceYear: number = 2023): any {
  return YAML.parse(fse.readFileSync(path.join(__dirname, 'clinical-clusters', performanceYear.toString(), 'clinical-clusters-schema.yaml'), 'utf8'));
}

/**
 * @return {any}
 */
export function getMVPData(performanceYear: number = 2023, mvpIds: string[] = []): any {
  const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
  let mvpData: any;

  if (fse.existsSync(filePath)) {
    mvpData = JSON.parse(fse.readFileSync(filePath, 'utf8'));
  } else {
    mvpData = exports.createMVPDataFile(performanceYear);
  }

  if (mvpIds.length) {
    mvpData = mvpData.filter(mvpDataItem => mvpIds.includes(mvpDataItem.mvpId));
  }

  return mvpData;
}

/**
 * @return {any}
 */
export function createMVPDataFile(performanceYear: number): any {
  const mvpFilePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
  const measureFilePath = path.join(__dirname, 'measures', performanceYear.toString(), 'measures-data.json');

  let mvpData: any[] = [];
  let measuresData: any[] = [];
  try {
    mvpData = JSON.parse(
        fse.readFileSync(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json'), 'utf8'));
    measuresData = exports.getMeasuresData(performanceYear);
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

export function populateMeasuresforMVPs(currentMvp: any, allMvps: any[], measuresData: any[], measureIdKey: string, enrichedMeasureKey: string): void {
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
 * @return {any} - Object representation of the MVP Schema
 */
export function getMVPSchema(performanceYear: number = 2023): any {
  return YAML.parse(fse.readFileSync(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-schema.yaml'), 'utf8'));
}

/**
 * @return {any}
 */
export function getMVPDataSlim(performanceYear: number = 2023): any {
  const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json');
  let mvpData: any;

  if (fse.existsSync(filePath)) {
    mvpData = JSON.parse(fse.readFileSync(filePath, 'utf8'));
    mvpData.forEach((mvp: any) => {
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
