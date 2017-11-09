// Libraries
const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

const yearRegEx = /^[0-9]{4}/;
const benchmarkJsonFileRegEx = /^[0-9]{4}\.json$/;

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
 * @return {{}} - Object representation of the Benchmarks Schema
 */
exports.getBenchmarksSchema = function() {
  return YAML.load(path.join(__dirname, 'benchmarks', 'benchmarks-schema.yaml'));
};

/**
 * @return {Array<Measure>}
 */
exports.getMeasuresData = function() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'measures', 'measures-data.json')));
};

/**
 * @return {{}} - Object representation of the Measures Schema
 */
exports.getMeasuresSchema = function() {
  return YAML.load(path.join(__dirname, 'measures', 'measures-schema.yaml'));
};

/**
 * @return {Array<ClinicalCluster>}
 */
exports.getClinicalClusterData = function() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'clinical-clusters', 'clinical-clusters.json')));
};

/**
 * @return {{}} - Object representation of the Clinical Cluster Schema
 */
exports.getClinicalClusterSchema = function() {
  return YAML.load(path.join(__dirname, 'clinical-clusters', 'clinical-clusters-schema.yaml'));
};
