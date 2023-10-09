// Libraries
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const uniq = require('lodash/uniq');
const _ = require('lodash');

const yearRegEx = /^[0-9]{4}/;
const benchmarkJsonFileRegEx = /^[0-9]{4}\.json$/;
const Constants = require('./constants.js');

/**
 * @return {Array<number>}
 * An array of all the years that the library has data for
 */
exports.getValidPerformanceYears = function() {
  return Constants.validPerformanceYears;
};

/**
 *
 * @return {void}
 * Adds any new program name fields from the mvp.json file for the given performance year
 */
exports.updateProgramNames = function(performanceYear) {
  let programNames;
  const programNamesFilePath = path.join(__dirname, 'util/program-names', 'program-names.json');
  const mvpFilePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json');

  let mvpData = [];

  try {
    programNames = JSON.parse(fs.readFileSync(programNamesFilePath));
    mvpData = JSON.parse(
      fs.readFileSync(mvpFilePath));

    mvpData.forEach(mvp => {
      if (!programNames[mvp.mvpId]) {
        programNames[mvp.mvpId] = mvp.mvpId;
      }
    });

    fs.writeFileSync(programNamesFilePath, JSON.stringify(programNames, null, 2));
  } catch (e) {
    console.log('Error parsing the program-names.json or mvp.json file: ' + ' --> ' + e);
  }
};

/**
 *
 * @return {{}} - program names -
 * An object keyed by program name containing the current program names
 */
exports.getProgramNames = function() {
  const programNamesFilePath = path.join(__dirname, 'util/program-names', 'program-names.json');

  try {
    return JSON.parse(fs.readFileSync(programNamesFilePath));
  } catch (e) {
    console.log('Error parsing the program-names.json file: ' + ' --> ' + e);
  }
};

/**
 *
 * @return {{}} - benchmarks data -
 * An object keyed by performance year with array values
 * containing the benchmarks for that performance year
 */
exports.getBenchmarksData = function() {
  const benchmarksByYear = {};

  fs.readdirSync(path.join(__dirname, 'benchmarks')).forEach(function(file) {
    if (benchmarkJsonFileRegEx.test(file)) {
      benchmarksByYear[file.match(yearRegEx)[0]] = require(path.join(__dirname, 'benchmarks', file));
    }
  });

  return benchmarksByYear;
};

/**
 *
 * @return {Array<number>}
 * An array of years that the library has benchmarks for
 */
exports.getBenchmarksYears = function() {
  const benchmarksYears = new Set();

  fs.readdirSync(path.join(__dirname, 'benchmarks')).forEach(function(file) {
    if (benchmarkJsonFileRegEx.test(file)) {
      benchmarksYears.add(+file.match(yearRegEx)[0]);
    }
  });

  return Array.from(benchmarksYears);
};

/**
 * @return {{}} - Object representation of the Benchmarks Schema
 */
exports.getBenchmarksSchema = function(performanceYear = Constants.currentPerformanceYear) {
  return YAML.load(path.join(__dirname, 'benchmarks', performanceYear.toString(), 'benchmarks-schema.yaml'));
};

/**
 * @return {Array<Measure>}
 */
exports.getMeasuresData = function(performanceYear = 2017) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'measures', performanceYear.toString(), 'measures-data.json')));
};

/**
 * @return {{}} - Object representation of the Measures Schema
 */
exports.getMeasuresSchema = function(performanceYear = 2017) {
  return YAML.load(path.join(__dirname, 'measures', performanceYear.toString(), 'measures-schema.yaml'));
};

/**
 * @return {Array<ClinicalCluster>}
 */
exports.getClinicalClusterData = function(performanceYear = 2017) {
  let clusterData = [];
  try {
    clusterData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'clinical-clusters', performanceYear.toString(), 'clinical-clusters.json')));
  } catch (e) {
    console.log('QPP measures data not found for year: ' + performanceYear + ' --> ' + e);
  }
  return clusterData;
};

/**
 * @return {{}} - Object representation of the Clinical Cluster Schema
 */
exports.getClinicalClusterSchema = function(performanceYear = 2017) {
  return YAML.load(path.join(__dirname, 'clinical-clusters', performanceYear.toString(), 'clinical-clusters-schema.yaml'));
};

/**
 * @return {Array<MVP>}
 */
exports.getMVPData = function(performanceYear = 2023, mvpIds = []) {
  const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
  let mvpData;

  if (fs.existsSync(filePath)) {
    mvpData = JSON.parse(fs.readFileSync(filePath));
  } else {
    mvpData = this.createMVPDataFile(performanceYear, mvpIds);
  }

  if (mvpIds.length) {
    mvpData = mvpData.filter(mvpDataItem => mvpIds.includes(mvpDataItem.mvpId));
  }

  return mvpData;
};

/**
 * @return {Array<MVP>}
 */
exports.createMVPDataFile = function(performanceYear) {
  const mvpFilePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
  const measureFilePath = path.join(__dirname, 'measures', performanceYear.toString(), 'measures-data.json');

  let mvpData = [];
  let measuresData = [];
  try {
    mvpData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json')));
    measuresData = this.getMeasuresData(performanceYear);
  } catch (e) {
    console.log('QPP mvp / measures data not found for year: ' + performanceYear + ' --> ' + e);
  }

  const mvpIds = [];
  mvpData.forEach(mvpDataItem => {
    if (mvpDataItem.mvpId !== 'app1') {
      mvpIds.push(mvpDataItem.mvpId);
    }
  });

  // Reset the allowedPrograms to remove any MVP ID program names (we will add them back on line 173)
  // This allows for removal of a measure from an MVP data item
  measuresData.forEach(measure => {
    measure.allowedPrograms = measure.allowedPrograms ? measure.allowedPrograms.filter(program => !mvpIds.includes(program)) : [];
  });

  // Hydrate measures
  mvpData.forEach(mvp => {
    Constants.mvpMeasuresHelper.forEach(item => {
      mvp[item.enrichedMeasureKey] = [];
      this.populateMeasuresforMVPs(mvp, mvpData, measuresData, item.measureIdKey, item.enrichedMeasureKey);
    });

    mvp.hasOutcomeAdminClaims = !_.isEmpty(mvp.administrativeClaimsMeasureIds);
  });

  mvpData.forEach(mvp => {
    Constants.mvpMeasuresHelper.forEach(item => {
      delete mvp[item.measureIdKey];
    });
  });

  fs.writeFileSync(mvpFilePath, JSON.stringify(mvpData, null, 2));
  fs.writeFileSync(measureFilePath, JSON.stringify(measuresData, null, 2));

  return mvpData;
};

exports.populateMeasuresforMVPs = function(currentMvp, allMvps, measuresData, measureIdKey, enrichedMeasureKey) {
  currentMvp[measureIdKey].forEach(measureId => {
    const measure = measuresData.find(measure => measure.measureId === measureId);

    if (measure) {
      allMvps.forEach(mvp => {
        // update measuresData with MVP programNames.
        if (mvp[measureIdKey].includes(measureId)) {
          measure.allowedPrograms.push(mvp.mvpId);
        }
      });
      measure.allowedPrograms = uniq(measure.allowedPrograms);

      if (measure.measureId === '321') {
        currentMvp.hasCahps = true;
      }

      // update mvp-data with measures.
      currentMvp[enrichedMeasureKey].push(measure);
    }
  });
};

/**
 * @return {{}} - Object representation of the MVP Schema
 */
exports.getMVPSchema = function(performanceYear = 2023) {
  return YAML.load(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-schema.yaml'));
};

/**
 * @return {Array<MVP>}
 */
exports.getMVPDataSlim = function(performanceYear = 2023) {
  const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json');
  let mvpData;

  if (fs.existsSync(filePath)) {
    mvpData = JSON.parse(fs.readFileSync(filePath));
    mvpData.forEach(mvp => {
      mvp.measureIds = [].concat(mvp.qualityMeasureIds,
        mvp.iaMeasureIds,
        mvp.costMeasureIds,
        mvp.foundationPiMeasureIds,
        mvp.foundationQualityMeasureIds,
        mvp.administrativeClaimsMeasureIds);
    });
  } else {
    console.log('mvp.json file does not exist');
  }

  return mvpData;
};
