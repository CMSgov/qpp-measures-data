/**
 * Expects JSON from standard input and validates against a specified version and
 * type of schema. If no version is specified, the schema version will default
 * to the latest. In the case of an invalid JSON document, the output will contain
 * the validation error.
 *
 * This script can be used as follows:
 * cat [json file path] | node [this file's path] [schemaType] [performanceYear]
 * Example:
 * cat measures/measures-data.json | node scripts/validate-data.js measures 2018
 **/

const path = require('path');
const YAML = require('yamljs');

const Constants = require('../constants.js');
const ValidateLib = require('./validate-json-data/validate-json-data-lib');

const schemaType = process.argv[2];
const performanceYear = (process.argv[3] || Constants.currentPerformanceYear).toString();

function validate(schema, json) {
  const data = JSON.parse(json, 'utf8');

  const {valid, errors, details} = ValidateLib.validate(schema, data);

  if (valid) {
    console.log(`Valid for ${performanceYear} performance year schema`);
  } else {
    console.log(`Invalid for ${performanceYear} performance year schema: ${errors}`);
    console.log('Detailed error: ', details);
  }
}

if (!schemaType) {
  console.log('Please provide schema type, e.g. measures or benchmarks\nExample Command: cat ../measures/measures-data.json | node validate-data.js measures');
  process.exit(1);
}

// Load the schema file
const schema = YAML.load(path.join(__dirname, '../', schemaType, performanceYear, schemaType + '-schema.yaml'));

// Read stdin into a string
let json = '';
process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  const chunk = this.read();
  if (chunk !== null) {
    json += chunk;
  }
});

// Finally, validate the json against the schema
process.stdin.on('end', function() {
  validate(schema, json);
});
