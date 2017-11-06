// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test data
const testMeasures = '../../test/scripts/measures/fixtures/test-measures-data.json';
const testCsv = '../../test/scripts/measures/fixtures/test-qcdr.csv';
const testCsv2Cols = '../../test/scripts/measures/fixtures/test-qcdr-2cols.csv';
const outputArg = '../../test/scripts/measures/fixtures/test-measures-data-output.json';
const output = '../' + outputArg;

// Expected new measures
const expectedMeasures = require('./fixtures/expected-measures.json');

// Function which executes script and reads in output file to a JS object.
const runTest = function(measuresFile, measuresCsv) {
  const cmd = 'node ./scripts/measures/import-qcdr-measures.js ' +
    measuresFile + ' ' + measuresCsv + ' ' + outputArg;
  console.log(execSync(cmd, {stdio: 'pipe'}).toString());

  const qpp = fs.readFileSync(path.join(__dirname, output), 'utf8');

  return JSON.parse(qpp);
};

describe('convertCsvToMeasures', function() {
  it('should create new measures', () => {
    const measures = runTest(testMeasures, testCsv);
    assert.equal(measures.length, 2);
  });

  it('should overwrite fields with the right csv data', () => {
    const measures = runTest(testMeasures, testCsv);
    expectedMeasures.forEach(function(expectedMeasure, measureIdx) {
      Object.entries(expectedMeasure).forEach(function([measureKey, measureValue]) {
        assert.deepEqual(measures[measureIdx][measureKey], measureValue);
      });
    });
  });

  it('throws an informative error when the column doesn\'t exist', function() {
    const errorMessage = /Column 2 does not exist in source data/;
    // assert.throws expects a function as its first parameter
    const errFunc = () => {
      runTest(testMeasures, testCsv2Cols);
    };
    assert.throws(errFunc, Error, errorMessage);
  });
});

after(function() {
  try {
    fs.unlinkSync(path.join(__dirname, output));
  } catch (err) {
    console.log('Warning: ', output, ' should have been deleted but was not.');
  }
});
