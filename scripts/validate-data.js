/**
 * Expects JSON from standard input and validates against a specified version and
 * type of schema. If no version is specified, the schema version will default
 * to the latest. In the case of an invalid JSON document, the output will contain
 * the validation error.
 *
 * This script can be used as follows:
 * cat [json file path] | node [this file's path] [schemaType]
 * Example:
 * cat measures/measures-data.json | node scripts/validate-data.js measures
 **/

var Ajv = require('ajv');
var path = require('path');
var YAML = require('yamljs');

var ajv = Ajv();

var schemaType = process.argv[2];

var json = '';
function validate(json) {
  var valid = ajv.validate(
    YAML.load(path.join(__dirname, '../' + schemaType,
      schemaType + '-schema.yaml')),
    JSON.parse(json, 'utf8'));
  if (valid) {
    console.log('Valid!');
  }
  else {
    console.log('Invalid: ' + ajv.errorsText(ajv.errors));
  }
}

if (schemaType) {
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', function() {
    var chunk = this.read();
    if (chunk !== null) {
      json += chunk;
    }
  });

  process.stdin.on('end', function() {
    validate(json);
  });
} else {
  console.log('Please provide schema type, e.g. measures or benchmarks\nExample Command: cat ../measures/measures-data.json | node validate-data.js measures');
}


