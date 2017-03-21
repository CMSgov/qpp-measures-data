// Libraries
var fs = require('fs');
var path = require('path');
var YAML = require('yamljs');

/**
 *
 * @param {number|string} year - four digit year
 * @return {Array<Benchmark>} - benchmarks data for given year
 */
exports.getBenchmarksData = function(year) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'benchmarks', year + '.json')));
};

exports.getBenchmarksSchema = function() {
  return YAML.load(path.join(__dirname, 'benchmarks', 'benchmarks-schema.yaml'));
};

exports.getMeasuresData = function() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'measures', 'measures-data.json')));
};

exports.getMeasuresSchema = function() {
  return YAML.load(path.join(__dirname, 'measures', 'measures-schema.yaml'));
};
