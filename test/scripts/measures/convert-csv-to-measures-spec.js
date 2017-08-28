// Libraries
const chai = require('chai');
const assert = chai.assert;
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

// The function
const convertCsvToMeasures = require('./../../../scripts/measures/convert-csv-to-measures');

// Test data
const testConfig = YAML.load(path.join(__dirname, 'fixtures/test-csv-config.yaml'));
const badDtypeConfig = YAML.load(path.join(__dirname, 'fixtures/bad-dtype-config.yaml'));
const badColumnDefConfig = YAML.load(path.join(__dirname, 'fixtures/bad-column-def.yaml'));
const testCsv = parse(fs.readFileSync(path.join(__dirname, 'fixtures/test-qcdr.csv')));
const testCsv2Cols = parse(fs.readFileSync(path.join(__dirname, 'fixtures/test-qcdr-2cols.csv')));

// Expected new measures
const expectedMeasures = require('./fixtures/expected-measures.json');

describe('convertCsvToMeasures', function() {
  it('should create new measures', () => {
    const newMeasures = convertCsvToMeasures(testCsv, testConfig);
    assert.equal(newMeasures.length, 3);
  });

  it('should overwrite fields with the right csv data', () => {
    const newMeasures = convertCsvToMeasures(testCsv, testConfig);
    expectedMeasures.forEach(function(expectedMeasure, measureIdx) {
      Object.entries(expectedMeasure).forEach(function([measureKey, measureValue]) {
        assert.deepEqual(newMeasures[measureIdx][measureKey], measureValue);
      });
    });
  });

  it('throws an informative error when the column doesn\'t exist', function() {
    const errorMessage = 'Column 2 does not exist in source data';
    // assert.throws expects a function as its first parameter
    const errFunc = () => { convertCsvToMeasures(testCsv2Cols, testConfig); };
    assert.throws(errFunc, TypeError, errorMessage);
  });

  it('throws an informative error when invalid transformation', function() {
    const errorMessage = 'Invalid dtype: emoji';
    const errFunc = () => { convertCsvToMeasures(testCsv, badDtypeConfig); };
    assert.throws(errFunc, Error, errorMessage);
  });

  it('throws an informative error when invalid column definition', function() {
    const errorMessage = 'Invalid column definition for vendorId';
    const errFunc = () => { convertCsvToMeasures(testCsv, badColumnDefConfig); };
    assert.throws(errFunc, Error, errorMessage);
  });
});
