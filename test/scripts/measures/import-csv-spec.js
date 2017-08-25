// Libraries
const chai = require('chai');
const assert = chai.assert;
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');

// The function
const importCsv = require('./../../../scripts/import-csv');

// Test data
const testMeasures = require('./test-measures.json');
const testConfig = YAML.load(path.join(__dirname, 'test-csv-config.yaml'));
const testCsv = fs.readFileSync(path.join(__dirname, 'test-qcdr.csv'));
const testCsv2Cols = fs.readFileSync(path.join(__dirname, 'test-qcdr-2cols.csv'));

// Expected new measures
const expectedMeasures = require('./expected-measures.json');

describe('import-csv', function() {
  it('should append new measures to original measures', () => {
    const updatedMeasures = importCsv(testMeasures, testCsv, testConfig);
    assert.equal(updatedMeasures.length, 4);
  });

  it('should overwrite fields with the right csv data', () => {
    const updatedMeasures = importCsv(testMeasures, testCsv, testConfig);
    expectedMeasures.forEach(function(expectedMeasure, measureIdx) {
      Object.entries(expectedMeasure).forEach(function([measureKey, measureValue]) {
        assert.deepEqual(updatedMeasures[2 + measureIdx][measureKey], measureValue);
      });
    });
  });

  describe('errors', function() {
    it('throws an informative error when the column doesn\'t exist', function() {
      const errorMessage = 'Column 2 does not exist in source data';
      // function expects a function as its first parameter, not an invocation
      const errFunc = () => { importCsv(testMeasures, testCsv2Cols, testConfig); };
      assert.throws(errFunc, TypeError, errorMessage);
    });
  });
});
