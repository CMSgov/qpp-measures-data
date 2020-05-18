// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Test data
const year = 2018;
const testQualityMeasuresCsv = '../../../test/scripts/measures/' + year + '/fixtures/test-quality-measures.csv';
const testQualityMeasuresMissingCsv = '../../../test/scripts/measures/' + year + '/fixtures/test-quality-measures-missing.csv';
const testQualityStrataCsv = '../../../test/scripts/measures/' + year + '/fixtures/test-quality-strata.csv';
const outputArg = '../../../test/scripts/measures/' + year + '/fixtures/test-measures-data-output.json';
const outputPath = path.join(__dirname, year.toString(), '../../' + outputArg);

// Expected new measures
const expectedMeasures = require('../' + year + '/fixtures/expected-quality-measures.json');

// Function which executes script and reads in output file to a JS object.
const runTest = function(measuresCsv, qualityStrataCsv) {
  const cmd = 'node ./scripts/measures/' + year + '/import-quality-measures.js ' +
    measuresCsv + ' ' + qualityStrataCsv + ' ' + outputArg;
  console.log(execSync(cmd, {stdio: 'pipe'}).toString());

  const qpp = fs.readFileSync(outputPath, 'utf8');

  return JSON.parse(qpp);
};

describe(year + ' import quality measures', function() {
  it('should create new quality measures', () => {
    const measures = runTest(testQualityMeasuresCsv, testQualityStrataCsv);
    assert.equal(measures.length, 3);
  });

  it('should generate the expected quality measures json', () => {
    const measures = runTest(testQualityMeasuresCsv, testQualityStrataCsv);
    expectedMeasures.forEach((expectedMeasure, measureIdx) => {
      _.each(expectedMeasure, (measureValue, measureKey) => {
        const measure = measures[measureIdx];
        assert.deepEqual(measure[measureKey], measureValue);
        assert.sameMembers(Object.keys(expectedMeasure), Object.keys(measure), `Unexpected properties on measureId ${measure.measureId}`);
      });
    });
  });

  it('throws an error when the quality strata csv references a measure that ' +
      'doesn\'t exist in the quality measures csv', function() {
    const errorMessage = 'Measure id: 046 does not exist in ../../../test/scripts/measures/2018/fixtures/test-quality-measures-missing.csv but does exist in ../../../test/scripts/measures/2018/fixtures/test-quality-strata.csv\n';
    // assert.throws expects a function as its first parameter
    const errFunc = () => {
      runTest(testQualityMeasuresMissingCsv, testQualityStrataCsv);
    };
    assert.throws(errFunc, Error, errorMessage);
  });
});

after(function() {
  try {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  } catch (err) {
    console.log('Warning: ', outputPath, ' should have been deleted but was not.');
  }
});
