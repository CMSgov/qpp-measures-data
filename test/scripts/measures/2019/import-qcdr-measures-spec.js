// Libraries
const chai = require('chai');
const assert = chai.assert;
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// Test data
const year = 2019;
const testCsv = '../../../test/scripts/measures/' + year + '/fixtures/test-qcdr.csv';
const testMeasures = '../../../test/scripts/measures/' + year + '/fixtures/test-qcdr-measures.json';
const qcdrStrataNamesFile = '../../../util/measures/' + year + '/qcdr-measures-strata-names.json';
const outputPath = path.join(__dirname, year.toString(), '../../' + testMeasures);

// Function which executes script and reads in output file to a JS object.
const runTest = function(measuresFile, measuresCsv) {
  const cmd = 'node ./scripts/measures/' + year + '/import-qcdr-measures.js ' +
    measuresFile + ' ' + measuresCsv + ' ' + qcdrStrataNamesFile;
  console.log(execSync(cmd, {stdio: 'pipe'}).toString());

  const qpp = fs.readFileSync(outputPath, 'utf8');

  return JSON.parse(qpp);
};

const validateDefaults = function(measure) {
  assert.include(measure, {
    category: 'quality',
    lastPerformanceYear: null,
    eMeasureId: null,
    nqfEMeasureId: null,
    isRegistryMeasure: true,
    isIcdImpacted: false
  });
  // Need chai > 4.1.2 to use deepInclude, so check lists like so
  assert.sameDeepMembers([], measure.measureSets);
  assert.sameDeepMembers(['registry'], measure.submissionMethods);
};

describe(year + ' import measures', () => {
  it('should create new measures', () => {
    const measures = runTest(testMeasures, testCsv);
    assert.lengthOf(measures, 4);

    const multiPerformanceRateMeasure = _.find(measures, {measureId: 'NPA28'});
    validateDefaults(multiPerformanceRateMeasure);
    assert.lengthOf(multiPerformanceRateMeasure.strata, 2);
    assert.strictEqual('overallStratumOnly', multiPerformanceRateMeasure.overallAlgorithm);

    const singlePerforamnceRateMeasure = _.find(measures, {measureId: 'AAPMR2'});
    validateDefaults(singlePerforamnceRateMeasure);
    assert.isUndefined(singlePerforamnceRateMeasure.strata);

    const multiPerformanceRateMeasureWeighted = _.find(measures, {measureId: 'CDR3'});
    validateDefaults(multiPerformanceRateMeasureWeighted);
    assert.strictEqual('weightedAverage', multiPerformanceRateMeasureWeighted.overallAlgorithm);
    assert.lengthOf(multiPerformanceRateMeasureWeighted.strata, 2);

    const nonProportionMeasure = _.find(measures, {measureId: 'HCPR19'});
    validateDefaults(nonProportionMeasure);
    assert.strictEqual('nonProportion', nonProportionMeasure.metricType);
  });

  it('should be fine with duplicates and merge them properly', () => {
    const measures1 = runTest(testMeasures, testCsv);
    const measures2 = runTest(testMeasures, testCsv);
    assert.lengthOf(measures1, 4);

    assert.sameDeepMembers(measures1, measures2);
  });
});

after(function() {
  try {
    fs.writeFileSync(outputPath, '[]');
  } catch (err) {
    console.log('Warning: ', outputPath, ' should have been cleared but was not.');
  }
});
