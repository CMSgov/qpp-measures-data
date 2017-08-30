// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');

// Test data
const testCsv = './test/scripts/measures/fixtures/test-qcdr.csv';
const testCsv2Cols = './test/scripts/measures/fixtures/test-qcdr-2cols.csv';

// Expected new measures
const expectedMeasures = require('./fixtures/expected-measures.json');

// Function which executes script and converts output to a JS object.
const runTest = function(file) {
  const cmd = 'cat ' + file + ' | node ./scripts/measures/import-qcdr-measures.js';
  const measuresJson = execSync(cmd, {stdio: 'pipe'}).toString();
  return JSON.parse(measuresJson);
};

describe('convertCsvToMeasures', function() {
  it('should create new measures', () => {
    const newMeasures = runTest(testCsv);
    assert.equal(newMeasures.length, 2);
  });

  it('should overwrite fields with the right csv data', () => {
    const newMeasures = runTest(testCsv);
    expectedMeasures.forEach(function(expectedMeasure, measureIdx) {
      Object.entries(expectedMeasure).forEach(function([measureKey, measureValue]) {
        assert.deepEqual(newMeasures[measureIdx][measureKey], measureValue);
      });
    });
  });

  it('throws an informative error when the column doesn\'t exist', function() {
    const errorMessage = /Column 2 does not exist in source data/;
    // assert.throws expects a function as its first parameter
    const errFunc = () => { runTest(testCsv2Cols); };
    assert.throws(errFunc, Error, errorMessage);
  });
});
