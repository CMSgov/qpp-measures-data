/**
 * Expects JSON from standard input and validates against a specified version and
 * type of schema. If no version is specified, the schema version will default
 * to the latest. If no type is specified, the schema will default to
 * measures-schema. In the case of an invalid JSON document, the output will contain
 * the validation error.
 *
 * This script can be used as follows:
 * cat measures-data.json | node validate-data.js 0.0.1 measures
 * cat examples/measurement-set-example.json | node validate-data.js 0.0.1 measurement-set
 **/

var Ajv = require('ajv');
var fs = require('fs');
var path = require('path');
var YAML = require('yamljs');

var ajv = Ajv();

var version = process.argv[2] || '0.0.1';
var schemaType = process.argv[3] || 'measures';

var json = '';
function validate(json) {
   var valid = ajv.validate(
     YAML.load(path.join(__dirname, '../versions', version, schemaType + '-schema.yaml')),
     JSON.parse(json, 'utf8'));
   if (valid) {
     console.log('Valid!');
   }
   else {
     console.log('Invalid: ' + ajv.errorsText(ajv.errors));
   }
}

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
