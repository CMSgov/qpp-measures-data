// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Test data
const year = 2018;
const testIaMeasuresCsv = '../../../test/scripts/measures/' + year + '/fixtures/test-ia-measures.csv';
const outputArg = '../../../test/scripts/measures/' + year + '/fixtures/test-measures-data-output.json';
const outputPath = path.join(__dirname, year.toString(), '../../' + outputArg);

// Expected new measures
const expectedMeasures = require('../' + year + '/fixtures/expected-ia-measures.json');

// Function which executes script and reads in output file to a JS object.
const runTest = (measuresCSV) => {
  const cmd = `node ./scripts/measures/${year}/import-ia-measures.js ${measuresCSV} ${outputArg}`;
  console.log(execSync(cmd, {stdio: 'pipe'}).toString());

  const qpp = fs.readFileSync(outputPath, 'utf8');

  return JSON.parse(qpp);
};

describe(year + ' import IA measures', () => {
  it('should create new IA measures', () => {
    const measures = runTest(testIaMeasuresCsv);
    assert.equal(measures.length, 2);
  });

  it('should generate the expected IA measures json', () => {
    const measures = runTest(testIaMeasuresCsv);
    expectedMeasures.forEach((expectedMeasure, measureIdx) => {
      _.each(expectedMeasure, (measureValue, measureKey) => {
        assert.deepEqual(measures[measureIdx][measureKey], measureValue);
      });
    });
  });
});

after(() => {
  try {
    fs.unlinkSync(outputPath);
  } catch (err) {
    console.log('Warning: ', outputPath, ' should have been deleted but was not.');
  }
});
