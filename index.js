// Libraries
var fs = require('fs');
var path = require('path');
var YAML = require('yamljs');

/**
 *
 * @param {number|string} performanceYear - four digit year
 * @return {Array<Benchmark>} - benchmarks data for given year
 */
exports.getBenchmarksData = function(performanceYear) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'benchmarks', performanceYear + '.json')));
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
