// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Test data
const year = 2018;
const testQualityJson = '../../../test/scripts/measures/' + year + '/fixtures/expected-quality-measures.json';
const testPiJson = '../../../test/scripts/measures/' + year + '/fixtures/test-pi-measures.json';
const outputArg = '../../../test/scripts/measures/' + year + '/fixtures/test-merged-measures-data-output.json';
const outputPath = path.join(__dirname, year.toString(), '../../' + outputArg);

// Expected combined measures
const expectedMeasures = require('../' + year + '/fixtures/expected-measures.json');

const runTest = function(measuresCsv, qualityStrataCsv) {
  const cmd = 'node ./scripts/measures/' + year + '/merge-measures-data.js ' +
    testQualityJson + ' ' + testPiJson + ' ' + outputArg;
  console.log(execSync(cmd, {stdio: 'pipe'}).toString());

  const qpp = fs.readFileSync(outputPath, 'utf8');

  return JSON.parse(qpp);
};

describe(year + ' merge measures', function() {
  it('should generate the expected combined measures json', () => {
    const measures = runTest(testQualityJson, testPiJson);
    expectedMeasures.forEach(function(expectedMeasure, measureIdx) {
      _.each(expectedMeasure, (measureValue, measureKey) => {
        assert.deepEqual(measures[measureIdx][measureKey], measureValue);
      });
    });
  });
});

after(function() {
  try {
    fs.unlinkSync(outputPath);
  } catch (err) {
    console.log('Warning: ', outputPath, ' should have been deleted but was not.');
  }
});
