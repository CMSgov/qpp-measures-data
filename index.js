var fs = require('fs');
var path = require('path');
var YAML = require('yamljs');

exports.getMeasuresData = function() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, 'measures', 'measures-data.json')));
}

exports.getMeasuresSchema = function() {
  return YAML.load(path.join(__dirname, 'measures', 'measures-schema.yaml'));
}
