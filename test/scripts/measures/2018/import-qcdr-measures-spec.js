// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Test data
const year = 2018;
const testCsv = '../../../test/scripts/measures/' + year + '/fixtures/test-qcdr.csv';
const testMeasures = '../../../test/scripts/measures/' + year + '/fixtures/test-qcdr-measures.json';
const qcdrStrataNamesFile = '../../../util/measures/' + year + '/qcdr-measures-strata-names.json';
// const outputArg = '../../../test/scripts/measures/' + year + '/fixtures/test-qcdr-measures-output.json';
const outputPath = path.join(__dirname, year.toString(), '../../' + testMeasures);

// Expected new measures
// const expectedMeasures = require('../' + year + '/fixtures/expected-measures.json');

// Function which executes script and reads in output file to a JS object.
const runTest = function(measuresFile, measuresCsv) {
  const cmd = 'node ./scripts/measures/' + year + '/import-qcdr-measures.js ' +
    measuresFile + ' ' + measuresCsv + ' ' + qcdrStrataNamesFile;
  console.log(execSync(cmd, {stdio: 'pipe'}).toString());

  const qpp = fs.readFileSync(outputPath, 'utf8');

  return JSON.parse(qpp);
};

describe(year + ' import measures', function() {
  it('should create new measures and ignore duplicate measureIds', () => {
    const measures = runTest(testMeasures, testCsv);
    assert.equal(measures.length, 4);
  });

  it('should correctly identify multiPerformanceRate measures', () => {
    const measures = runTest(testMeasures, testCsv);
    const multiPerformanceRateMeasure = _.find(measures, {measureId: 'PP4'});
    assert.equal(multiPerformanceRateMeasure.metricType, 'registryMultiPerformanceRate');
  });

  it('should correctly parse performance rates', () => {
    const measures = runTest(testMeasures, testCsv);
    measures.forEach(measure => {
      if (measure.metricType === 'registrySinglePerformanceRate') {
        assert.notProperty(measure, 'strata');
      }
      if (measure.metricType === 'registryMultiPerformanceRate') {
        assert.isAbove(measure.strata.length, 1);
      }
    });
  });

  it('should correctly parse overallPerformanceRate', () => {
    const measures = runTest(testMeasures, testCsv);
    measures.forEach(measure => {
      if (measure.measureId === 'PP4') {
        assert.equal(measure.overallAlgorithm, 'weightedAverage');
      }
      if (measure.measureId === 'PP3') {
        assert.notProperty(measure, 'overallAlgorithm');
      }
      if (measure.measureId === 'PP2') {
        assert.equal(measure.overallAlgorithm, 'overallStratumOnly');
      }
    });
  });
});

after(function() {
  try {
    fs.writeFileSync(outputPath, '[]');
  } catch (err) {
    console.log('Warning: ', outputPath, ' should have been cleared but was not.');
  }
});
