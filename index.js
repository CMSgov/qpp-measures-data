// Libraries
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const uniq = require('lodash/uniq');

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
  let mvpData = [];

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
exports.createMVPDataFile = function(performanceYear, mvpIds) {
  const filePath = path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-enriched.json');
  let mvpData = [];
  let measuresData = [];
  try {
    mvpData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp.json')));
    measuresData = this.getMeasuresData(performanceYear);
  } catch (e) {
    console.log('QPP measures data not found for year: ' + performanceYear + ' --> ' + e);
  }

  // Hydrate measures
  mvpData.forEach(mvp => {
    Constants.mvpMeasuresHelper.forEach(item => {
      mvp[item.enrichedMeasureKey] = [];
      this.populateMeasuresforMVPs(mvp, mvpData, measuresData, item.measureIdKey, item.enrichedMeasureKey);
    });
  });

  mvpData.forEach(mvp => {
    Constants.mvpMeasuresHelper.forEach(item => {
      delete mvp[item.measureIdKey];
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(mvpData, null, 2));

  return mvpData;
};

exports.populateMeasuresforMVPs = function(mvpDataItem, mvpDataArray, measuresData, measureIdKey, enrichedMeasureKey) {
  mvpDataItem[measureIdKey].forEach(measureId => {
    const measure = measuresData.find(m => m.measureId === measureId);
    if (measure) {
      const allowedMvpPrograms = [];
      mvpDataArray.forEach(m => {
        if (m[measureIdKey].includes(measureId)) {
          allowedMvpPrograms.push(m.mvpId);
        }
      });
      measure.allowedPrograms ? measure.allowedPrograms = measure.allowedPrograms.concat(allowedMvpPrograms) : measure.allowedPrograms = allowedMvpPrograms;
      measure.allowedPrograms = uniq(measure.allowedPrograms);
      mvpDataItem[enrichedMeasureKey].push(measure);
    }
  });
};

/**
 * @return {{}} - Object representation of the MVP Schema
 */
exports.getMVPSchema = function(performanceYear = 2023) {
  return YAML.load(path.join(__dirname, 'mvp', performanceYear.toString(), 'mvp-schema.yaml'));
};
